# Logistics and Anti-Fraud Sand Mining Backend Blueprint

## 1. System Goals

This backend architecture supports:
- QR-based consignment tracking
- Payment recording and verification (including OCR reconciliation)
- Real-time GPS tracking and route deviation detection
- Role-based access control (RBAC)
- Fraud detection and audit logging

Target stack:
- Node.js + Express (modular monolith, API-first)
- PostgreSQL (transactional source of truth)
- JWT auth (access + refresh token rotation)
- Redis + BullMQ for async OCR/fraud jobs
- Object storage (S3 or compatible) for receipt images

## 2. Recommended Backend Architecture

### 2.1 Layered Modular Monolith (Scalable)

Use one deployable service initially, with strict module boundaries:
- Transport layer: routes/controllers
- Domain layer: services/state machines/rules
- Data layer: repositories/SQL access
- Infra layer: queue, storage, OCR provider, observability

This keeps complexity low now and allows future extraction of modules to microservices.

### 2.2 Request Lifecycle

1. Request enters API gateway or load balancer.
2. Express middleware assigns request_id and validates JWT.
3. RBAC middleware checks permissions.
4. Validator middleware sanitizes payload.
5. Service layer runs transactional domain logic.
6. Repository persists data in PostgreSQL.
7. Audit middleware writes an audit log entry.
8. Optional events are pushed to event_outbox for async jobs.

## 3. Suggested Folder Structure (Backend Only)

backend/
- src/
  - app.js
  - server.js
  - config/
    - env.js
    - db.js
    - redis.js
    - logger.js
  - common/
    - constants/
    - errors/
    - middleware/
      - auth.middleware.js
      - rbac.middleware.js
      - validation.middleware.js
      - audit.middleware.js
      - rateLimit.middleware.js
    - utils/
      - jwt.js
      - hash.js
      - qrSigner.js
      - geo.js
  - modules/
    - auth/
      - auth.routes.js
      - auth.controller.js
      - auth.service.js
      - auth.repository.js
      - auth.validators.js
    - users/
    - rbac/
    - consignments/
      - consignments.routes.js
      - consignments.controller.js
      - consignments.service.js
      - consignments.repository.js
      - consignments.state-machine.js
      - consignments.validators.js
    - payments/
      - payments.routes.js
      - payments.controller.js
      - payments.service.js
      - payments.repository.js
      - payments.validators.js
    - verification/
      - verification.routes.js
      - verification.controller.js
      - verification.service.js
    - tracking/
      - tracking.routes.js
      - tracking.controller.js
      - tracking.service.js
      - tracking.repository.js
      - route-deviation.service.js
    - gate/
      - gate.routes.js
      - gate.controller.js
      - gate.service.js
    - fraud/
      - fraud.routes.js
      - fraud.controller.js
      - fraud.service.js
      - fraud.rules.js
    - audit/
      - audit.routes.js
      - audit.controller.js
      - audit.repository.js
  - jobs/
    - queues/
      - queue.factory.js
      - queue.names.js
    - workers/
      - ocr.worker.js
      - fraud.worker.js
      - route-check.worker.js
  - integrations/
    - ocr/
      - ocr.client.js
    - storage/
      - object-storage.client.js
    - sms/
      - sms.client.js
    - maps/
      - distance.client.js
  - db/
    - migrations/
    - seeds/
- tests/
  - unit/
  - integration/
  - e2e/

## 4. Database Schema and Relations

A full PostgreSQL migration is provided in:
- backend/db/migrations/001_init_logistics_anti_fraud.sql

### 4.1 Core Entity Groups

Identity and RBAC:
- organizations
- sites
- users
- roles
- permissions
- role_permissions
- user_roles
- auth_refresh_tokens

Operations:
- drivers
- vehicles
- mines
- destinations
- routes
- consignments
- consignment_events
- gate_devices
- gate_events
- weighbridge_readings

Payments and Verification:
- payment_transactions
- payment_receipts
- payment_ocr_results
- payment_verifications

Tracking and Fraud:
- gps_track_points
- route_deviations
- fraud_alerts
- fraud_alert_events

Audit and Integration:
- audit_logs
- event_outbox

### 4.2 Critical Relationship Map

- organizations 1:N users, vehicles, drivers, consignments, payments
- users M:N roles via user_roles (optionally scoped by site)
- roles M:N permissions via role_permissions
- consignments N:1 vehicles, drivers, routes, mines, destinations
- consignments 1:N consignment_events, gate_events, gps_track_points
- consignments 1:N payment_transactions
- payment_transactions 1:N payment_receipts
- payment_receipts 1:N payment_ocr_results
- payment_transactions 1:N payment_verifications
- fraud_alerts link optionally to consignment and/or payment
- audit_logs capture all sensitive actions from any module

### 4.3 Status Models

Consignment status:
- CREATED -> LOADED -> IN_TRANSIT -> DELIVERED -> CLOSED
- cancellation path: CREATED|LOADED -> CANCELLED

Payment status:
- PENDING -> VERIFIED
- PENDING -> FLAGGED -> VERIFIED|REJECTED

Alert status:
- OPEN -> INVESTIGATING -> RESOLVED|DISMISSED

## 5. API Endpoint Structure (Versioned)

Base path: /api/v1

### 5.1 Auth

- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me

### 5.2 RBAC and Users

- GET /users
- POST /users
- PATCH /users/:id
- GET /rbac/roles
- GET /rbac/permissions
- POST /rbac/users/:userId/roles
- DELETE /rbac/users/:userId/roles/:roleId

### 5.3 Consignments

- POST /consignments
- GET /consignments
- GET /consignments/:id
- PATCH /consignments/:id/assign
- POST /consignments/:id/transition
- GET /consignments/:id/qr
- POST /consignments/scan
- POST /consignments/:id/close

### 5.4 Gate Control and Scan

- POST /gate/scan-entry
- POST /gate/scan-exit
- GET /gate/events

### 5.5 Payments and Verification

- POST /payments
- GET /payments
- GET /payments/:id
- POST /payments/:id/receipts
- GET /payments/:id/ocr-results
- POST /payments/:id/verify
- GET /verifications/pending

### 5.6 Tracking

- POST /tracking/ingest
- GET /tracking/consignments/:id/points
- GET /tracking/consignments/:id/deviations
- GET /tracking/live

### 5.7 Fraud and Alerts

- GET /fraud/alerts
- GET /fraud/alerts/:id
- PATCH /fraud/alerts/:id/assign
- PATCH /fraud/alerts/:id/resolve

### 5.8 Audit

- GET /audit/logs
- GET /audit/logs/:id

## 6. Permission Matrix (Minimum)

- SUPER_ADMIN: all permissions
- ACCOUNTANT:
  - payments:create/read/upload_receipt/verify
  - fraud_alerts:read
  - audit_logs:read
- OPERATOR:
  - consignments:create/read/assign/transition
  - qr:generate
  - tracking:ingest/read
- WATCHMAN:
  - qr:scan
  - gate:scan_entry/scan_exit
  - consignments:read

## 7. Core Logic Flows (Step-by-Step)

### 7.1 Consignment Creation to Closure

1. Operator creates consignment with mine, destination, expected amount, weight details.
2. Service generates unique consignment number and signed QR payload.
3. Record saved with status CREATED; event logged in consignment_events.
4. Operator assigns vehicle and driver.
5. Transition CREATED -> LOADED after loading/weighing validation.
6. Watchman scans QR at exit gate; gate event created.
7. If authorized, transition LOADED -> IN_TRANSIT.
8. GPS points start ingesting for route monitoring.
9. On destination verification and delivery proof, transition IN_TRANSIT -> DELIVERED.
10. Payment verification and operational checks complete.
11. Final transition DELIVERED -> CLOSED.

### 7.2 Payment Recording and OCR Verification

1. Accountant or operator records payment entry as PENDING.
2. Receipt image uploaded to object storage; metadata in payment_receipts.
3. OCR job queued to BullMQ.
4. OCR worker extracts amount/reference and stores payment_ocr_results.
5. Rule compares paid_amount, expected_amount, and OCR amount.
6. If mismatch beyond tolerance: mark payment FLAGGED and create fraud_alert.
7. Accountant verifies manually:
   - decision VERIFIED: status -> VERIFIED
   - decision FLAGGED/REJECTED: status remains FLAGGED or moves REJECTED
8. All actions written to payment_verifications and audit_logs.

### 7.3 Route Tracking and Deviation Detection

1. Device or app posts GPS points via /tracking/ingest.
2. Service validates point quality (timestamp order, valid coordinates).
3. Route deviation service calculates distance to expected route path.
4. If consecutive points exceed threshold, create route_deviations row.
5. Route deviation also raises fraud_alert with type ROUTE_DEVIATION.
6. Alert is assigned to operator/super admin for follow-up.

### 7.4 Unauthorized Exit Detection

1. Watchman scans EXIT QR.
2. Service validates:
   - QR exists and signature valid
   - consignment is at a valid lifecycle state
   - gate event sequence is valid (ENTRY before EXIT when required)
3. If rule fails, gate event stored as unauthorized.
4. Fraud alert created with type UNAUTHORIZED_EXIT.
5. Alert appears in fraud dashboard and audit trail.

### 7.5 Weight Mismatch Detection

1. Source and destination weighbridge readings are captured.
2. System computes weight delta and percentage difference.
3. If variance exceeds policy threshold, create WEIGHT_MISMATCH alert.
4. Consignment may be blocked from CLOSING until supervisor override.

### 7.6 Duplicate QR Detection

1. QR scan endpoint receives QR payload.
2. Service validates signed payload and resolves qr_hash.
3. If same QR is scanned for another active consignment or invalid time context:
   - block operation
   - create DUPLICATE_QR fraud alert
4. All scan attempts are logged in gate_events and audit_logs.

## 8. Security Considerations (Production)

Authentication and session security:
- Access JWT short TTL (10-20 minutes).
- Refresh token rotation with hash storage in auth_refresh_tokens.
- Immediate token revocation on logout/password reset.
- Optional MFA for SUPER_ADMIN and ACCOUNTANT.

Authorization:
- Permission-based RBAC on every route.
- Site-scoped user_roles for least privilege.
- Deny by default; explicit permission required.

Input and transport security:
- Strict schema validation (Joi or Zod).
- Parameterized SQL only.
- Helmet + CORS allowlist + body size limits.
- Rate limiting by IP and by user.

QR and anti-tampering:
- QR payload signed (JWS/HMAC) with expiry and nonce.
- Store qr_hash in DB and validate against replay.

File upload security:
- MIME whitelist and max size.
- Malware scan before marking upload usable.
- Store outside web root in object storage.

Audit and forensics:
- Write immutable-style audit logs for every critical action.
- Include actor, role, request_id, IP, user_agent, optional GPS.
- Add record_hash and prev_hash for tamper-evident chain.

Data protection:
- TLS everywhere.
- Encrypt backups and object storage.
- Restrict DB network access via private subnet.
- Secrets in vault, not in repository.

## 9. Scalability and Reliability

- Keep API stateless for horizontal scaling.
- Use Redis queues for OCR/fraud workloads.
- Use event_outbox for reliable event publication.
- Partition high-volume tables (gps_track_points, audit_logs) by month.
- Add read replicas for analytics/reporting.
- Add idempotency keys for create consignment/payment APIs.
- Add OpenTelemetry + Prometheus metrics + centralized logs.

## 10. Suggested Implementation Phases

Phase 1:
- Auth, RBAC, users
- Consignment lifecycle + QR generation/scan
- Audit logging base middleware

Phase 2:
- Payments + receipt upload + OCR worker
- Verification workflow and discrepancy flagging

Phase 3:
- GPS ingest + route deviation engine
- Fraud alert orchestration

Phase 4:
- Reporting, SLA dashboards, operational hardening
- Performance tuning, partitioning, archival jobs

## 11. Immediate Next Build Targets

1. Replace current receipt-only routes with versioned module routes.
2. Add PostgreSQL client/ORM and run migration 001.
3. Implement auth middleware and permission guard first.
4. Build consignments module with strict state machine transitions.
5. Add payment OCR queue and fraud alert trigger hooks.
