# Unit Testing Strategy

This document defines the unit testing standards, testing frameworks, and isolation patterns for database constraints, backend logic, and frontend components in FMDDS, based on Section 14 of the SRS.

---

## 1. Unit Testing Scopes & Frameworks

Unit tests verify that code modules perform correctly in isolation, stubbing out external network connections, email servers, and complex database engines.

```mermaid
graph TD
    UnitTest[Unit Test Runner] --> Mock[Mock Dependencies (Moq / Sinon)]
    UnitTest --> Target[Target Component under Test]
```

### 1.1 Backend Service & Logic Tests
* **Framework**: **xUnit** (for C# / .NET) or **PHPUnit** (for Laravel).
* **Mocking Tool**: **Moq** or **Mockery** to isolate database layers.
* **Coverage Objective**: Minimum of **85% code coverage** on business services and validation classes.

### 1.2 Database Constraint Tests
* **Framework**: **tSQLt** (for SQL Server) or **pgTAP** (for PostgreSQL).
* **Objective**: Verify database schema rules (CHECK constraints, unique index locks) directly on a development database snapshot.

### 1.3 Frontend Validator & Utility Tests
* **Framework**: **Jest** or **Mocha**.
* **Objective**: Verify NIC regular expressions matching, date comparisons, and form error displays.

---

## 2. Typical Unit Test Scenarios

### 2.1 Backend: AuthService Authentication Test Cases

```csharp
[Fact]
public void AuthenticateUser_WithInvalidPassword_IncrementsRetryCount()
{
    // Arrange: Create user with 0 retries and mock password check failure
    var mockUserRepo = new Mock<IUserRepository>();
    var mockAuditRepo = new Mock<IAuditLogRepository>();
    
    var user = new User { UserID = 1, Username = "test", FailedLoginAttempts = 0 };
    mockUserRepo.Setup(r => r.GetByUsername("test")).Returns(user);
    
    var authService = new AuthService(mockUserRepo.Object, mockAuditRepo.Object);

    // Act: Attempt login with invalid credentials
    Assert.Throws<InvalidCredentialsException>(() => authService.AuthenticateUser("test", "wrongPassword"));

    // Assert: Check that attempts were incremented and stored
    Assert.Equal(1, user.FailedLoginAttempts);
    mockUserRepo.Verify(r => r.Update(user), Times.Once);
}
```

### 2.2 Backend: CaseService Unique Case Number Generaton Test Cases
* **Goal**: Validate that Case Number generation logic produces the correct sequence without database conflicts.
* **Scenario**: Stub the case repository to return case count of 99. When calling `CreateCase()`, verify that the generated Case Number is `COL/2026/CL/0100` (formatting and increment checks).

### 2.3 Frontend: NIC Format Validation Test Cases
Using Jest to test regex validators:
```javascript
test('Sri Lankan NIC format validations', () => {
  expect(validateNIC('921345678V')).toBe(true);  // Legacy NIC (Valid)
  expect(validateNIC('921345678X')).toBe(true);  // Legacy NIC (Valid)
  expect(validateNIC('199213456789')).toBe(true); // Modern NIC (Valid)
  expect(validateNIC('92134567V8')).toBe(false);  // Malformed NIC (Invalid)
});
```

---

## 3. Test Isolation Rules

1. **Database Mocking**: Test classes must mock repository interfaces (`ICaseRepository`) using Moq/Sinon. Do not connect to a live relational database inside BLL unit tests.
2. **No SMTP Execution**: Email sending services must be stubbed or replaced with a `FakeEmailService` that logs emails to memory rather than sending TCP traffic.
3. **Log Suppression**: Suppress trace and warn diagnostic log files in unit tests logs to avoid polluting test runner logs.
