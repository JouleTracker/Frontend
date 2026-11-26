# IAM & User Management Integration Guide

This document describes the frontend implementation and REST API integration for the **Identity & Access Management (IAM)** and **User Management** bounded contexts in JouleTracker.

## Backend API Endpoints

In development (`src/environments/environment.development.ts`), all endpoints resolve against `http://localhost:8081`:

| User Story | Method & Endpoint | Auth Required | Frontend Entry Point |
| :--- | :--- | :---: | :--- |
| **US-03** | `POST /api/v1/authentication/forgot-password` | Public | `/recuperar-contrasena` (alias `/forgot-password`) |
| **US-03** | `POST /api/v1/authentication/reset-password` | Public | `/reset-password?token=<token>` |
| **US-04** | `GET /api/v1/authentication/verify-email?token=<token>` | Public | `/verify-email?token=<token>` |
| **US-04** | `POST /api/v1/authentication/resend-verification` | Public | `/verify-email` |
| **US-25** | `PUT /api/v1/users/{id}/password` | Bearer JWT | `/configuracion` |
| **US-40** | `PATCH /api/v1/users/{id}/deactivate` | Bearer JWT | `/configuracion` |
| **US-49** | `PATCH /api/v1/users/{id}/status` | Bearer JWT (`ROLE_ADMIN`) | `/admin/usuarios` |

> **Interceptor Note:** `iamInterceptor` (`src/app/iam/infrastructure/iam.interceptor.ts`) automatically attaches the `Authorization: Bearer <token>` header to all protected endpoints while skipping public `/api/v1/authentication/*` requests.

---

## Implemented User Stories

### US-03: Password Recovery & Reset Flow
- **Forgot Password (`ForgotPasswordViewComponent`)**:
  - Validates the email address reactively and calls `IamApi.forgotPassword(email)` (`POST /api/v1/authentication/forgot-password`).
  - Displays a loading state while submitting and an **anti-enumeration confirmation banner** on completion so attackers cannot probe registered email addresses.
- **Reset Password (`ResetPasswordViewComponent`)**:
  - Reads the `token` query parameter from `/reset-password?token=...`.
  - If `token` is absent, displays a missing-token screen with a direct link to request a new recovery email.
  - Validates `newPassword` and `confirmPassword` against the shared password policy (`src/app/iam/domain/model/password-policy.ts`) and calls `POST /api/v1/authentication/reset-password`.
  - Handles expired or invalid tokens cleanly and redirects to `/login?passwordReset=1` upon success.

### US-04: Account Verification & Render SPA Routing
- **Email Verification (`VerifyEmailViewComponent`)**:
  - Fully localized in `en_US` via `TranslatePipe` (`public/i18n/en.json`).
  - Supports four explicit states: `loading`, `success`, `pending` (post-registration verification notice), and `error` (invalid/expired token).
  - Includes a **Resend verification email** form connected to `POST /api/v1/authentication/resend-verification` for both newly registered users and users whose links expired.
  - Registration (`SignUpFormComponent`) navigates newly created accounts directly to `/verify-email?pending=1&email=...`.
- **Render SPA Fallback Routing**:
  - `public/_redirects` (`/* /index.html 200`) is bundled automatically into `dist/jouletrackerfront/browser/_redirects` during `ng build`, preventing 404 responses on deep links such as `/verify-email` and `/reset-password`.

### US-25: Change Password
- Located in `ConfigurationViewComponent` (`/configuracion`).
- Provides reactive validation for **Current Password**, **New Password** (enforcing the shared password policy), and **Confirm New Password**.
- Calls `PUT /api/v1/users/{id}/password` via `IamApi.changePassword()`.
- Surfaces backend validation errors (such as an incorrect current password) inline and displays a confirmation toast banner on success.

### US-40: Account Deactivation
- Located in the **Danger Zone** card inside `ConfigurationViewComponent` (`/configuracion`).
- Triggers an accessible **Confirmation Modal** (`role="dialog"`, `aria-modal="true"`, Escape-key and backdrop dismissal).
- On confirmation, executes `IamStore.deactivateCurrentAccount()` -> `PATCH /api/v1/users/{id}/deactivate`, clears local JWT session storage immediately, and redirects to `/login?deactivated=1`.

### US-49: Admin User Moderation
- Implemented in `AdminDashboardComponent` (routed at `/admin/usuarios`) and `AdminUsersComponent`.
- Replaces legacy stubs with `IamApi.updateUserStatus(userId, status)` calling `PATCH /api/v1/users/{id}/status`.
- Supports real-time moderation across all four account statuses: `ACTIVE`, `SUSPENDED`, `BANNED`, and `INACTIVE`.
- **Self-moderation protection**: identifies the currently authenticated administrator via `IamStore.currentUserId()`, disables self-moderation controls in the UI, and enforces a guard in TypeScript to prevent an admin from banning themselves.

---

## Shared Password Policy

Defined once in `src/app/iam/domain/model/password-policy.ts` and shared across Sign-Up, Reset Password, and Change Password:

- Length: **8 to 64 characters**
- Must include at least **one uppercase letter**, **one lowercase letter**, **one digit**, and **one special character**
- **No whitespace** allowed
