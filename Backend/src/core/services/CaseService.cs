using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using FMDDS.Data.Db;
using FMDDS.Data.Entities;
using FMDDS.Data.Repositories;
using Microsoft.EntityFrameworkCore;

namespace FMDDS.Core.Services
{
    /// <summary>
    /// Core Domain Service governing forensic case registration, intake validation,
    /// and strict status state-machine transitions.
    /// Tags: #backend #business_rules #concurrency
    /// </summary>
    public class CaseService
    {
        private static readonly object _inMemoryLock = new object();

        private readonly AppDbContext _dbContext;
        private readonly ICaseRepository _caseRepo;
        private readonly IRepository<Patient> _patientRepo;
        private readonly IRepository<Hospital> _hospitalRepo;
        private readonly IRepository<Ward> _wardRepo;
        private readonly IRepository<AuditLog> _auditRepo;

        public CaseService(
            AppDbContext dbContext,
            ICaseRepository caseRepo,
            IRepository<Patient> patientRepo,
            IRepository<Hospital> hospitalRepo,
            IRepository<Ward> wardRepo,
            IRepository<AuditLog> auditRepo)
        {
            _dbContext = dbContext;
            _caseRepo = caseRepo;
            _patientRepo = patientRepo;
            _hospitalRepo = hospitalRepo;
            _wardRepo = wardRepo;
            _auditRepo = auditRepo;
        }

        // Backward-compatible constructor for existing tests/callers where AppDbContext is optional or inferred
        public CaseService(
            ICaseRepository caseRepo,
            IRepository<Patient> patientRepo,
            IRepository<Hospital> hospitalRepo,
            IRepository<Ward> wardRepo,
            IRepository<AuditLog> auditRepo)
            : this(null!, caseRepo, patientRepo, hospitalRepo, wardRepo, auditRepo)
        {
        }

        public async Task<Case> RegisterCaseAsync(
            int patientID,
            string caseType,
            int? hospitalID = null,
            int? wardID = null,
            int? referralSourceTypeID = null,
            int? assignedOfficerID = null)
        {
            // 1. Business Validation (BRL-010)
            var patient = await _patientRepo.GetByIdAsync(patientID);
            if (patient == null)
            {
                throw new ArgumentException("Associated patient record does not exist.");
            }

            if (caseType != "Clinical Forensic" && caseType != "Postmortem")
            {
                throw new ArgumentException("CaseType must be either 'Clinical Forensic' or 'Postmortem'.");
            }

            if (hospitalID.HasValue)
            {
                var hosp = await _hospitalRepo.GetByIdAsync(hospitalID.Value);
                if (hosp == null) throw new ArgumentException("Hospital record does not exist.");
            }

            if (wardID.HasValue)
            {
                var ward = await _wardRepo.GetByIdAsync(wardID.Value);
                if (ward == null) throw new ArgumentException("Ward record does not exist.");
            }

            string branchCode = "COL";
            int year = DateTime.UtcNow.Year;
            string typeCode = caseType == "Postmortem" ? "PM" : "CL";

            int maxRetries = 5;
            for (int attempt = 0; attempt < maxRetries; attempt++)
            {
                try
                {
                    if (_dbContext != null && _dbContext.Database.IsRelational())
                    {
                        using var tx = await _dbContext.Database.BeginTransactionAsync();

                        int seq = await GetNextSequenceAtomicAsync(branchCode, year, typeCode);
                        string caseNumber = $"{branchCode}/{year}/{typeCode}/{seq:D4}";

                        var newCase = new Case
                        {
                            PatientID = patientID,
                            CaseNumber = caseNumber,
                            CaseType = caseType,
                            RegistrationDate = DateTime.UtcNow,
                            Status = "Registered",
                            AssignedOfficerID = assignedOfficerID,
                            HospitalID = hospitalID,
                            WardID = wardID,
                            ReferralSourceTypeID = referralSourceTypeID
                        };

                        _dbContext.Cases.Add(newCase);
                        var audit = new AuditLog
                        {
                            Action = $"Case Registered: {caseNumber}",
                            Timestamp = DateTime.UtcNow,
                            UserID = assignedOfficerID
                        };
                        _dbContext.AuditLogs.Add(audit);

                        await _dbContext.SaveChangesAsync();
                        await tx.CommitAsync();

                        return newCase;
                    }
                    else
                    {
                        int seq = await GetNextSequenceAtomicAsync(branchCode, year, typeCode);
                        string caseNumber = $"{branchCode}/{year}/{typeCode}/{seq:D4}";

                        var newCase = new Case
                        {
                            PatientID = patientID,
                            CaseNumber = caseNumber,
                            CaseType = caseType,
                            RegistrationDate = DateTime.UtcNow,
                            Status = "Registered",
                            AssignedOfficerID = assignedOfficerID,
                            HospitalID = hospitalID,
                            WardID = wardID,
                            ReferralSourceTypeID = referralSourceTypeID
                        };

                        await _caseRepo.AddAsync(newCase);
                        var audit = new AuditLog
                        {
                            Action = $"Case Registered: {caseNumber}",
                            Timestamp = DateTime.UtcNow,
                            UserID = assignedOfficerID
                        };
                        await _auditRepo.AddAsync(audit);

                        return newCase;
                    }
                }
                catch (DbUpdateException ex) when (attempt < maxRetries - 1 && ex.InnerException is Npgsql.PostgresException pgEx && pgEx.SqlState == "23505")
                {
                    await Task.Delay(25 * (attempt + 1));
                }
            }

            throw new InvalidOperationException("Failed to register case due to unique constraint collision.");
        }

        private async Task<int> GetNextSequenceAtomicAsync(string branchCode, int year, string caseTypeCode)
        {
            if (_dbContext != null && _dbContext.Database.IsRelational())
            {
                var sequences = await _dbContext.Database.SqlQueryRaw<int>(@"
INSERT INTO ""CaseNumberCounters"" (""BranchCode"", ""Year"", ""CaseTypeCode"", ""NextSequence"")
VALUES ({0}, {1}, {2}, 1)
ON CONFLICT (""BranchCode"", ""Year"", ""CaseTypeCode"")
DO UPDATE SET ""NextSequence"" = ""CaseNumberCounters"".""NextSequence"" + 1
RETURNING ""NextSequence"";", branchCode, year, caseTypeCode).ToListAsync();

                return sequences.First();
            }
            else if (_dbContext != null)
            {
                lock (_inMemoryLock)
                {
                    var counter = _dbContext.CaseNumberCounters.FirstOrDefault(c =>
                        c.BranchCode == branchCode && c.Year == year && c.CaseTypeCode == caseTypeCode);

                    if (counter == null)
                    {
                        counter = new CaseNumberCounter
                        {
                            BranchCode = branchCode,
                            Year = year,
                            CaseTypeCode = caseTypeCode,
                            NextSequence = 1
                        };
                        _dbContext.CaseNumberCounters.Add(counter);
                        _dbContext.SaveChanges();
                        return 1;
                    }
                    else
                    {
                        counter.NextSequence++;
                        _dbContext.SaveChanges();
                        return counter.NextSequence;
                    }
                }
            }
            else
            {
                var allCases = await _caseRepo.FindAsync(c => c.CaseType == (caseTypeCode == "PM" ? "Postmortem" : "Clinical Forensic"));
                int maxSeq = 0;
                foreach (var c in allCases)
                {
                    if (c.CaseNumber != null && c.CaseNumber.Contains($"/{year}/"))
                    {
                        var parts = c.CaseNumber.Split('/');
                        if (parts.Length == 4 && int.TryParse(parts[3], out int seq))
                        {
                            if (seq > maxSeq) maxSeq = seq;
                        }
                    }
                }
                return maxSeq + 1;
            }
        }

        public async Task<IEnumerable<Case>> GetAllCasesAsync(string? status = null, string? caseType = null, string? nic = null)
        {
            return await _caseRepo.SearchCasesAsync(status, null, nic, caseType);
        }

        public async Task<Case?> GetCaseByIdAsync(int caseId)
        {
            return await _caseRepo.GetCaseWithDetailsAsync(caseId);
        }

        public async Task<Case> UpdateCaseStatusAsync(int caseId, string newStatus, int officerId = 0)
        {
            var existingCase = await _caseRepo.GetByIdAsync(caseId);
            if (existingCase == null) throw new ArgumentException("Case not found.");

            // Validate status transitions
            var allowedTransitions = new Dictionary<string, string[]>
            {
                { "Registered", new[] { "Assigned", "Examination In Progress", "Closed" } },
                { "Assigned", new[] { "Examination In Progress", "Closed" } },
                { "Examination In Progress", new[] { "Laboratory Pending", "Report Preparation", "Closed" } },
                { "Laboratory Pending", new[] { "Report Preparation", "Closed" } },
                { "Report Preparation", new[] { "Report Approved", "Closed" } },
                { "Report Approved", new[] { "Closed", "Archived" } },
                { "Closed", new[] { "Archived" } },
                { "Archived", Array.Empty<string>() }
            };

            if (allowedTransitions.TryGetValue(existingCase.Status, out var allowed) && !allowed.Contains(newStatus))
            {
                throw new InvalidOperationException($"Invalid status transition from '{existingCase.Status}' to '{newStatus}'.");
            }

            existingCase.Status = newStatus;
            _caseRepo.Update(existingCase);

            var audit = new AuditLog
            {
                Action = $"Case Status Updated: {existingCase.CaseNumber} -> {newStatus}",
                Timestamp = DateTime.UtcNow,
                UserID = officerId > 0 ? officerId : (int?)null
            };
            await _auditRepo.AddAsync(audit);

            return existingCase;
        }

        public async Task<Patient> RegisterPatientAsync(
            string nic,
            string fullName,
            DateTime? dateOfBirth,
            string gender,
            string? address = null,
            string? telephone = null)
        {
            if (string.IsNullOrWhiteSpace(fullName))
            {
                throw new ArgumentException("Patient full name is required.");
            }

            if (!string.IsNullOrWhiteSpace(nic))
            {
                nic = nic.Trim();
                if (!IsValidSriLankanNic(nic))
                {
                    throw new ArgumentException("Invalid Sri Lankan NIC format.");
                }

                // Normalize legacy NIC suffix to uppercase
                if (Regex.IsMatch(nic, @"^\d{9}[vx]$"))
                {
                    nic = nic.Substring(0, 9) + char.ToUpper(nic[9]);
                }

                var existing = await GetPatientByNicAsync(nic);
                if (existing != null)
                {
                    throw new ArgumentException($"Patient with NIC '{nic}' already exists.");
                }
            }

            var patient = new Patient
            {
                NIC = nic,
                FullName = fullName,
                DateOfBirth = dateOfBirth,
                Gender = gender,
                Address = address,
                Telephone = telephone
            };

            await _patientRepo.AddAsync(patient);
            return patient;
        }

        public async Task<Patient?> GetPatientByNicAsync(string nic)
        {
            if (string.IsNullOrWhiteSpace(nic)) return null;
            nic = nic.Trim();
            if (Regex.IsMatch(nic, @"^\d{9}[vx]$"))
            {
                nic = nic.Substring(0, 9) + char.ToUpper(nic[9]);
            }
            var results = await _patientRepo.FindAsync(p => p.NIC == nic);
            return results.FirstOrDefault();
        }

        public static bool IsValidSriLankanNic(string nic)
        {
            if (string.IsNullOrWhiteSpace(nic)) return false;
            nic = nic.Trim();
            // Legacy format: EXACTLY 9 numeric digits followed by V/v or X/x (e.g. 941234567V)
            bool isOldFormat = Regex.IsMatch(nic, @"^\d{9}[VXvx]$");
            // New format: EXACTLY 12 numeric digits (e.g. 199412345678)
            bool isNewFormat = Regex.IsMatch(nic, @"^\d{12}$");
            return isOldFormat || isNewFormat;
        }
    }
}
