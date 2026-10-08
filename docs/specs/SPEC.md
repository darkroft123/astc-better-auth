BETTER-AUTH SERVICE SPEC
========================

1. SERVICE IDENTIFICATION
-------------------------
Service Name: better-auth-service
Type: Authentication Microservice (JWT + User Management)
Technology: Node.js + Express + Prisma + PostgreSQL
Port: 3010

Main Responsibility:
This service handles authentication, user validation, JWT generation,
and secure identity management for all microservices in the system.

--------------------------------------------------

2. PURPOSE
----------

The Better Auth service is responsible for:

- User login authentication
- Password validation (bcrypt)
- JWT token generation
- Role-based identity embedding
- Secure user session validation (/me endpoint)
- Central identity provider for microservices

--------------------------------------------------

3. SYSTEM FLOW
--------------

Frontend (Login UI)
        ↓
Better Auth Service
        ↓
PostgreSQL (Users + Roles DB)
        ↓
JWT Token Issued
        ↓
Gateway (Apollo Federation)
        ↓
All Microservices (Assistance, Project, Backoffice, AI)

--------------------------------------------------

4. ENDPOINTS
------------

4.1 LOGIN

POST /login

Input:
{
  "email": "user@astc.com",
  "password": "123456"
}

Process:
- Find user by email
- Validate password using bcrypt
- Fetch role information
- Generate JWT token

Output:
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@astc.com",
    "username": "user",
    "role": {
      "id": "uuid",
      "code": "TEAM_MEMBER",
      "name": "Team Member"
    }
  }
}

--------------------------------------------------

4.2 ME (Protected)

GET /me

Security:
- Requires Authorization: Bearer token

Output:
{
  "user": {
    "sub": "uuid",
    "email": "user@astc.com",
    "role": "TEAM_MEMBER",
    "iat": 0000000000,
    "exp": 0000000000
  }
}

--------------------------------------------------

5. AUTH FLOW (JWT)

JWT Payload:

{
  "sub": user.id,
  "email": user.email,
  "role": user.role.code,
  "iat": issued_at,
  "exp": expiration
}

Expiration:
- 24 hours

--------------------------------------------------

6. SECURITY MODEL
-----------------

- Password hashing: bcryptjs
- JWT signing: HS256 (JWT_SECRET)
- Protected routes via middleware
- Stateless authentication
- Role embedded in token

--------------------------------------------------

7. DATABASE SCHEMA
-------------------

This service uses PostgreSQL as identity database.

6.1 USERS TABLE

- id (UUID)
- username (unique)
- email (unique)
- password_hash
- first_name
- last_name
- full_name
- phone
- avatar_url
- role_id (FK → roles.id)
- created_at
- updated_at
- deleted_at

--------------------------------------------------

6.2 ROLES TABLE

- id (UUID)
- code (ADMIN | PROJECT_MANAGER | TEAM_MEMBER)
- name (string)

--------------------------------------------------

6.3 OUTBOX PATTERN (EVENTS)

Table: outbox_events

Used for future event-driven architecture:

- id
- aggregate_id
- aggregate_type
- event_type
- payload
- created_at
- processed_at

--------------------------------------------------

7. PRISMA ORM MODEL
-------------------

- User ↔ Role (Many-to-One relation)
- Flyway schema history tracked
- PostgreSQL fully normalized identity system

--------------------------------------------------

8. AUTH MIDDLEWARE
------------------

Validates JWT token from:

Authorization: Bearer <token>

Extracts:
- userId (sub)
- role
- email

Injects into request context.

--------------------------------------------------

9. ROLE-BASED ACCESS CONTROL

Roles:

- ADMIN → full system access
- PROJECT_MANAGER → team & project control
- TEAM_MEMBER → attendance & personal data

--------------------------------------------------

10. INTEGRATION WITH SYSTEM

This service is the CENTRAL AUTHORITY for:

- Assistance Service (attendance system)
- Project Service (project control)
- Backoffice Service (user admin)
- Gateway (Apollo Federation routing)
- AI Service (future secure requests)

--------------------------------------------------

11. SECURITY LEVEL (ENTERPRISE)

- JWT stateless authentication
- bcrypt password hashing
- role embedded authorization
- middleware protection layer
- database isolation of credentials
- event outbox ready for distributed systems

--------------------------------------------------

12. SUMMARY (ENGLISH)

The Better Auth Service is the central identity provider for the entire system.
It manages authentication, issues JWT tokens, validates users, and enforces
role-based security across all microservices in a distributed architecture.

--------------------------------------------------

END OF SPEC
========================