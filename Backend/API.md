# Backend API Specifications

This document defines the RESTful API endpoints, request payloads, response formats, and status codes for the FMDDS backend service, based on Section 6.3 and Section 8.2 of the SRS.

---

## 1. Global API Standards

* **Base URL**: `/api/v1`
* **Content-Type**: `application/json` (Primary format for all request and response bodies)
* **Authentication**: Authorization header carrying a JWT bearer token: `Authorization: Bearer <JWT_TOKEN>`
* **Common Response Status Codes**:
  * `200 OK`: Successful read or update.
  * `201 Created`: Successful resource creation.
  * `400 Bad Request`: Payload validation error or invalid business transition.
  * `401 Unauthorized`: Missing or invalid credentials token.
  * `403 Forbidden`: Authenticated user lacks permission for the resource.
  * `404 Not Found`: Resource ID does not exist in DB.
  * `500 Internal Server Error`: Unhandled server exception.

---

## 2. API Endpoints Reference

### 2.1 Authentication & Profile Module

#### 2.1.1 POST `/auth/login`
* **Description**: Verifies credentials and returns a session JWT.
* **Request Payload**:
  ```json
  {
    "username": "dr_silva",
    "password": "JmoPassword123!"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "user": {
      "userID": 2,
      "username": "dr_silva",
      "fullName": "Dr. Silva",
      "role": "Judicial Medical Officer"
    }
  }
  ```

#### 2.1.2 POST `/auth/logout`
* **Description**: Invalidates the active session token on the server.
* **Success Response (`200 OK`)**: `{"message": "Logged out successfully"}`

---

### 2.2 Case Management Module

#### 2.2.1 GET `/cases`
* **Description**: Searches and filters cases. Supports query parameters: `caseNumber`, `patientName`, `nic`, `status`, `caseType`.
* **Success Response (`200 OK`)**:
  ```json
  [
    {
      "caseID": 1,
      "caseNumber": "COL/2026/CL/0001",
      "caseType": "Clinical Forensic",
      "registrationDate": "2026-07-01T09:00:00Z",
      "status": "In Progress",
      "patientName": "Saman Kumara",
      "assignedOfficerName": "Dr. Perera"
    }
  ]
  ```

#### 2.2.2 POST `/cases`
* **Description**: Registers a new case. Relies on an existing `patientID`.
* **Request Payload**:
  ```json
  {
    "patientID": 1,
    "caseType": "Clinical Forensic",
    "referralSource": "Police Station Fort",
    "referralSourceTypeID": 1,
    "assignedOfficerID": 3,
    "hospitalID": 1,
    "wardID": 1
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "caseID": 4,
    "caseNumber": "COL/2026/CL/0004",
    "patientID": 1,
    "caseType": "Clinical Forensic",
    "registrationDate": "2026-07-05T12:00:00Z",
    "status": "Registered",
    "assignedOfficerID": 3,
    "hospitalID": 1,
    "wardID": 1,
    "referralSourceTypeID": 1
  }
  ```

#### 2.2.3 PUT `/cases/{id}/status`
* **Description**: Updates the case status workflow. Validates status transitions (`BRL-003`).
* **Request Payload**:
  ```json
  {
    "status": "In Progress"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "caseID": 1,
    "status": "In Progress",
    "updatedAt": "2026-07-05T12:05:00Z"
  }
  ```

---

### 2.3 Medical Examinations Module

#### 2.3.1 POST `/cases/{caseId}/clinical-exam`
* **Description**: Saves clinical examination observations for a living patient.
* **Request Payload**:
  ```json
  {
    "examDate": "2026-07-05T12:10:00Z",
    "observations": "Laceration measuring 3cm on the left forearm. Superficial bruising around wrist.",
    "diagnosis": "Soft tissue trauma consistent with blunt force impact."
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "clinicalExamID": 5,
    "caseID": 1,
    "examinerID": 3,
    "examDate": "2026-07-05T12:10:00Z",
    "observations": "Laceration measuring 3cm...",
    "diagnosis": "Soft tissue trauma..."
  }
  ```

#### 2.3.2 POST `/cases/{caseId}/postmortem-exam`
* **Description**: Saves autopsy findings and cause of death (JMO only).
* **Request Payload**:
  ```json
  {
    "examinationDate": "2026-07-05T12:15:00Z",
    "findings": "External findings: Laceration on scalp. Internal findings: Subdural hematoma in cranial cavity.",
    "causeOfDeath": "Intracranial hemorrhage secondary to blunt force trauma to the head."
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "postmortemID": 2,
    "caseID": 3,
    "examinerID": 2,
    "examinationDate": "2026-07-05T12:15:00Z",
    "findings": "External findings...",
    "causeOfDeath": "Intracranial hemorrhage..."
  }
  ```

---

### 2.4 Evidence & Laboratory Module

#### 2.4.1 POST `/cases/{caseId}/evidence`
* **Description**: Registers a physical evidence item.
* **Request Payload**:
  ```json
  {
    "evidenceType": "Weapon",
    "description": "Metallic knife retrieved at crime scene.",
    "storageLocation": "Safe Locker C-2"
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "evidenceID": 3,
    "caseID": 1,
    "evidenceType": "Weapon",
    "description": "Metallic knife...",
    "storageLocation": "Safe Locker C-2"
  }
  ```

#### 2.4.2 POST `/evidence/{evidenceId}/transfer`
* **Description**: Records a Chain of Custody transfer event.
* **Request Payload**:
  ```json
  {
    "receivingOfficerID": 5,
    "location": "Toxicology Lab",
    "reasonForTransfer": "Analysis request"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "custodyID": 4,
    "evidenceID": 3,
    "transferringOfficerID": 4,
    "receivingOfficerID": 5,
    "transferTimestamp": "2026-07-05T12:20:00Z",
    "location": "Toxicology Lab",
    "reasonForTransfer": "Analysis request"
  }
  ```

#### 2.4.3 POST `/cases/{caseId}/lab-requests`
* **Description**: Issues a lab investigation order.
* **Request Payload**:
  ```json
  {
    "testType": "Toxicology Screen"
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "labRequestID": 8,
    "caseID": 1,
    "requestDate": "2026-07-05T12:22:00Z",
    "status": "Pending"
  }
  ```

#### 2.4.4 PUT `/lab-requests/{requestId}/results`
* **Description**: Records laboratory testing results.
* **Request Payload**:
  ```json
  {
    "result": "Blood alcohol content: 0.08%. Traces of salicylic acid detected."
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "labResultID": 6,
    "labRequestID": 8,
    "result": "Blood alcohol content...",
    "completionDate": "2026-07-05T12:30:00Z"
  }
  ```

---

### 2.5 Reports Module

#### 2.5.1 POST `/cases/{caseId}/reports`
* **Description**: Compiles case metadata to produce draft Medico-Legal or Postmortem reports.
* **Request Payload**:
  ```json
  {
    "reportType": "PMR"
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "reportID": 10,
    "caseID": 3,
    "reportType": "PMR",
    "approvalStatus": "Draft"
  }
  ```

#### 2.5.2 PUT `/reports/{reportId}/approve`
* **Description**: Finalizes and signs the report, locks it as read-only.
* **Success Response (`200 OK`)**:
  ```json
  {
    "reportID": 10,
    "approvalStatus": "Approved",
    "approvedBy": 2,
    "approvalDate": "2026-07-05T12:45:00Z"
  }
  ```
