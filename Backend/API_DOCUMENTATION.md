# CNG Booking System - API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Error Handling](#error-handling)
5. [API Endpoints](#api-endpoints)
   - [Authentication Endpoints](#authentication-endpoints)
   - [User Endpoints](#user-endpoints)
   - [Slot Records Endpoints](#slot-records-endpoints)
   - [Pump Worker Endpoints](#pump-worker-endpoints)
6. [Data Models](#data-models)
7. [Validation Rules](#validation-rules)

---

## Overview

The CNG Booking System API provides endpoints for:
- User registration and authentication (Users, Pump Admins, Pump Workers)
- Slot booking and management
- Slot history and verification
- Pump worker management

**API Version:** 1.0  
**Base Framework:** Spring Boot 3.x  
**Database:** MySQL  
**Security:** JWT Token-based Authentication

---

## Authentication

### JWT Token
The API uses JWT (JSON Web Token) for authentication.

- **Token Expiration:** 7 days (604800000 ms)
- **Secret Key:** Configured in `application.properties`
- **Header:** Include the JWT token in the `Authorization` header

```
Authorization: Bearer <your_jwt_token>
```

### Supported Roles
- `USER` - Regular users booking CNG slots
- `PUMP_ADMIN` - Pump station administrators
- `PUMP_WORKER` - Workers at pump stations
- `SUPER_ADMIN` - System administrators

---

## Base URL

```
http://localhost:8080
```

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message describing the issue",
  "data": null,
  "timestamp": "2026-03-11T10:30:00Z"
}
```

### HTTP Status Codes
| Status | Meaning |
|--------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input parameters |
| 401 | Unauthorized - Authentication failed |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

---

## API Endpoints

### Authentication Endpoints

#### 1. Login

**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and receive JWT token

**Request Body:**
```json
{
  "role": "USER",
  "identifier": "user@example.com",
  "password": "Password123"
}
```

**Request Parameters:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| role | String | Yes | One of: USER, PUMP_ADMIN, PUMP_WORKER, SUPER_ADMIN |
| identifier | String | Yes | Email or username |
| password | String | Yes | Min 6 chars, 1 digit, 1 uppercase letter |

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-03-11T10:30:00Z"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "data": null,
  "timestamp": "2026-03-11T10:30:00Z"
}
```

**Status Code:** 200 OK

---

#### 2. Register User

**Endpoint:** `POST /auth/register-user`

**Description:** Register a new regular user

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

**Request Parameters:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| username | String | Yes | Non-blank |
| email | String | Yes | Valid email format |
| password | String | Yes | Min 6 chars, 1 digit, 1 uppercase letter |

**Response (Success):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-03-11T10:30:00Z"
}
```

**Status Code:** 201 Created

---

#### 3. Register Pump Admin

**Endpoint:** `POST /auth/register-pump`

**Description:** Register a new pump station (requires pump admin credentials)

**Request Body:**
```json
{
  "licenseNo": "DL001ABC123",
  "pumpName": "Green CNG Station",
  "streetName": "MG Road",
  "landmark": "Near Metro Station",
  "pincode": 110001,
  "latitude": 28.6139,
  "longitude": 77.2090,
  "password": "AdminPass123"
}
```

**Request Parameters:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| licenseNo | String | Yes | Unique, non-blank |
| pumpName | String | Yes | Non-blank |
| streetName | String | Yes | Non-blank |
| landmark | String | Yes | Non-blank |
| pincode | Integer | Yes | 6-digit format (100000-999999) |
| latitude | Double | Yes | Valid GPS latitude |
| longitude | Double | Yes | Valid GPS longitude |
| password | String | Yes | Min 6 chars, 1 digit, 1 uppercase letter |

**Response (Success):**
```json
{
  "success": true,
  "message": "Pump registered successfully",
  "data": "DL001ABC123",
  "timestamp": "2026-03-11T10:30:00Z"
}
```

**Status Code:** 201 Created

---

#### 4. Register Pump Worker

**Endpoint:** `POST /auth/register-pump-workers`

**Description:** Register a new pump worker

**Request Body:**
```json
{
  "licenseNo": "DL001ABC123",
  "workerName": "Raj Kumar",
  "email": "raj@example.com",
  "password": "Worker123"
}
```

**Request Parameters:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| licenseNo | String | Yes | Must match existing pump |
| workerName | String | Yes | Non-blank |
| email | String | Yes | Valid email format |
| password | String | Yes | Min 6 chars, 1 digit, 1 uppercase letter |

**Response (Success):**
```json
{
  "success": true,
  "message": "Pump Workers registered successfully",
  "data": "550e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2026-03-11T10:30:00Z"
}
```

**Status Code:** 201 Created

---

### User Endpoints

#### 1. Book Slot

**Endpoint:** `POST /users/book-slot`

**Description:** Book a CNG filling slot (User endpoint)

**Authentication:** Required (JWT Token)

**Request Body:**
```json
{
  "slotIntervalId": 1,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "licenseNo": "DL001ABC123",
  "transactionId": "TXN123456789",
  "vehicleNumber": "DL01AB1234"
}
```

**Request Parameters:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| slotIntervalId | Long | Yes | Must be positive, must exist |
| userId | String | Yes | Non-blank, must match current user |
| licenseNo | String | Yes | Non-blank, must match existing pump |
| transactionId | String | Yes | Non-blank, unique |
| vehicleNumber | String | Yes | Non-blank |

**Response (Success):**
```json
{
  "success": true,
  "message": "Slot Booked Successfully",
  "data": "QR123456789ABCDEF",
  "timestamp": "2026-03-11T10:30:00Z"
}
```

**Status Code:** 200 OK

---

### Slot Records Endpoints

#### 1. Book Slot

**Endpoint:** `POST /slot-records/book-slot`

**Description:** Book a CNG filling slot (Alternative endpoint)

**Authentication:** Required (JWT Token)

**Request Body:**
```json
{
  "slotIntervalId": 1,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "licenseNo": "DL001ABC123",
  "transactionId": "TXN123456789",
  "vehicleNumber": "DL01AB1234"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "slot created successfully",
  "data": "QR123456789ABCDEF",
  "timestamp": "2026-03-11T10:30:00Z"
}
```

**Status Code:** 201 Created

---

#### 2. Get Pending Slots

**Endpoint:** `GET /slot-records/get-pending-slots`

**Description:** Get all pending slot bookings for a pump worker/admin

**Authentication:** Required (JWT Token)

**Request Parameters:**
| Field | Type | Required | Location | Validation |
|-------|------|----------|----------|-----------|
| userId | String | Yes | Query | Non-blank, must be pump worker/admin |

**Response (Success):**
```json
{
  "success": true,
  "message": "fetched pending slots of users successfully",
  "data": [
    {
      "slotRecordId": 1,
      "slotIntervalId": 1,
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john_doe",
      "vehicleNumber": "DL01AB1234",
      "slotStatus": "PENDING",
      "timestamp": "2026-03-11T10:00:00Z"
    }
  ],
  "timestamp": "2026-03-11T10:30:00Z"
}
```

**Status Code:** 200 OK

---

#### 3. Verify Slot Booking

**Endpoint:** `POST /slot-records/verify-slot-booking`

**Description:** Verify/update status of a slot booking (worker verification)

**Authentication:** Required (JWT Token)

**Request Body:**
```json
{
  "slotRecordId": 1,
  "newStatus": "COMPLETED",
  "workerId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Request Parameters:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| slotRecordId | Long | Yes | Must exist |
| newStatus | String | Yes | One of: PENDING, COMPLETED, CANCELLED |
| workerId | String | Yes | Must be valid pump worker |

**Response (Success):**
```json
{
  "success": true,
  "message": "slot verified",
  "data": null,
  "timestamp": "2026-03-11T10:30:00Z"
}
```

**Status Code:** 200 OK

---

#### 4. Get User Slot History

**Endpoint:** `GET /slot-records/get-user-slot-history`

**Description:** Get booking history for a user with pagination

**Authentication:** Required (JWT Token)

**Request Parameters:**
| Field | Type | Required | Location | Validation |
|-------|------|----------|----------|-----------|
| userId | String | Yes | Query | Non-blank |
| page | Integer | No | Query | Default: 0, must be >= 0 |
| size | Integer | No | Query | Default: 10, must be > 0 |

**Response (Success):**
```json
{
  "success": true,
  "message": "fetched user's slot history",
  "data": {
    "content": [
      {
        "slotRecordId": 1,
        "slotIntervalId": 1,
        "username": "john_doe",
        "vehicleNumber": "DL01AB1234",
        "pumpName": "Green CNG Station",
        "slotStatus": "COMPLETED",
        "bookedAt": "2026-03-11T10:00:00Z",
        "completedAt": "2026-03-11T10:30:00Z"
      }
    ],
    "totalPages": 5,
    "totalElements": 45,
    "currentPage": 0,
    "size": 10
  },
  "timestamp": "2026-03-11T10:30:00Z"
}
```

**Status Code:** 200 OK

---

### Pump Worker Endpoints

#### 1. Update Worker Credentials

**Endpoint:** `PUT /pump-workers/update-creds`

**Description:** Update pump worker's password/credentials

**Authentication:** Required (JWT Token)

**Request Body:**
```json
{
  "workerId": "550e8400-e29b-41d4-a716-446655440001",
  "email": "raj.updated@example.com",
  "newPassword": "NewPassword123"
}
```

**Request Parameters:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| workerId | String | Yes | Must exist and match current user |
| email | String | Yes | Valid email format |
| newPassword | String | Yes | Min 6 chars, 1 digit, 1 uppercase letter |

**Response (Success):**
```json
{
  "success": true,
  "message": "Credentials updated successfully",
  "data": null,
  "timestamp": "2026-03-11T10:30:00Z"
}
```

**Status Code:** 200 OK

---

#### 2. Delete Pump Worker

**Endpoint:** `DELETE /pump-workers/delete-worker`

**Description:** Delete a pump worker (Admin only)

**Authentication:** Required (JWT Token - Pump Admin)

**Request Parameters:**
| Field | Type | Required | Location | Validation |
|-------|------|----------|----------|-----------|
| workerId | String | Yes | Query | Non-blank, must exist |

**Response (Success):**
```json
{
  "success": true,
  "message": "worker deleted successfully",
  "data": null,
  "timestamp": "2026-03-11T10:30:00Z"
}
```

**Status Code:** 200 OK

---

## Data Models

### User Model
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john@example.com",
  "password": "hashed_password",
  "createdAt": "2026-03-11T10:00:00Z"
}
```

### Pump Model
```json
{
  "licenseNo": "DL001ABC123",
  "pumpName": "Green CNG Station",
  "address": {
    "streetName": "MG Road",
    "landmark": "Near Metro Station",
    "pincode": 110001
  },
  "latitude": 28.6139,
  "longitude": 77.2090,
  "createdAt": "2026-03-11T10:00:00Z"
}
```

### Pump Worker Model
```json
{
  "workerId": "550e8400-e29b-41d4-a716-446655440001",
  "workerName": "Raj Kumar",
  "email": "raj@example.com",
  "licenseNo": "DL001ABC123",
  "createdAt": "2026-03-11T10:00:00Z"
}
```

### Slot Interval Model
```json
{
  "slotIntervalId": 1,
  "licenseNo": "DL001ABC123",
  "startTime": "08:00",
  "endTime": "09:00",
  "capacity": 5,
  "availableSlots": 3
}
```

### Slot Record Model
```json
{
  "slotRecordId": 1,
  "slotIntervalId": 1,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "licenseNo": "DL001ABC123",
  "vehicleNumber": "DL01AB1234",
  "transactionId": "TXN123456789",
  "qrCode": "QR123456789ABCDEF",
  "slotStatus": "PENDING",
  "bookedAt": "2026-03-11T10:00:00Z"
}
```

---

## Validation Rules

### Password Requirements
- **Minimum Length:** 6 characters
- **Maximum Length:** 20 characters
- **Required Characters:** At least 1 digit (0-9) and 1 uppercase letter (A-Z)
- **Example:** `Password123`, `Abc123`

### Email Validation
- Must follow standard email format: `user@domain.com`

### Pincode Validation
- **Format:** 6-digit integer
- **Range:** 100000 - 999999

### Vehicle Number Format
- Non-blank string
- Typical format: `DL01AB1234` (State code + registration number)

### GPS Coordinates
- **Latitude:** Valid decimal value (-90 to 90)
- **Longitude:** Valid decimal value (-180 to 180)

---

## Common Error Messages

| Error | Status | Possible Causes |
|-------|--------|-----------------|
| Invalid credentials | 400 | Wrong username/email or password |
| User already exists | 400 | Email/username already registered |
| Pump not found | 404 | licenseNo doesn't exist |
| Slot not available | 400 | All slots booked or invalid slotIntervalId |
| Unauthorized | 401 | Missing or invalid JWT token |
| Invalid input | 400 | Validation constraints failed |

---

## Rate Limiting

Currently, no rate limiting is implemented. Future versions may include:
- Login attempts: Max 5 attempts per 15 minutes
- API calls: Max requests per minute based on user role

---

## Versioning

This documentation covers API v1.0. Future versions may include:
- Enhanced filtering and search
- Notification system
- Advanced analytics
- Mobile app specific endpoints

---

## Support

For API issues and support, contact:
- **Documentation:** See `HELP.md`
- **Configuration:** See `application.properties`
- **Database:** MySQL (configured in `application.properties`)

---

**Last Updated:** March 11, 2026  
**API Version:** 1.0
