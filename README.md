# JouleTracker Frontend

JouleTracker is an Angular Single-Page Application (SPA) for IoT B2C home and small-business (SME) electricity monitoring, built using **Domain-Driven Design (DDD)** Bounded Contexts.

## Architecture Overview

The application is organized into isolated Bounded Contexts under `src/app/`:

- **`iam`** — Identity & Access Management: JWT sign-in, account registration, email verification (`US-04`), password recovery & reset (`US-03`), HTTP auth interceptor, route guards, and session store.
- **`settings`** — User Management preferences & account security: personal/home/business profile settings, password change (`US-25`), and self-service account deactivation (`US-40`).
- **`admin`** — Platform Administration: user moderation (`US-49`), broadcast alerts, and targeted energy recommendations.
- **`consumption`** — Real-time power consumption, historical metrics, and cost/emissions analytics.
- **`devices`** — Connected appliance and commercial machinery registry.
- **`iot`** — Smart meter / IoT sensor telemetry and calibration management.
- **`alerts`** — Real-time threshold warnings and alert acknowledgement workflow.
- **`recommendations`** & **`reports`** — Personalized energy-saving tips and CSV consumption reporting.
- **`business`** — Commercial zone / area energy tracking for SME accounts.
- **`shared`** — Shared layout, navigation sidebar, base HTTP abstractions, and error utilities.

For detailed endpoint contracts, security rules, and user flows for IAM and User Management, see [docs/IAM_AND_USER_MANAGEMENT.md](docs/IAM_AND_USER_MANAGEMENT.md).

## Environment Configuration

API endpoints are configured via Angular environment files:

- **Development** (`src/environments/environment.development.ts`): defaults to `http://localhost:8081` (used automatically by `ng serve` and `ng build --configuration development`).
- **Production** (`src/environments/environment.ts`): points to the deployed backend API URL.

## Internationalization (i18n)

UI copy is powered by `@ngx-translate/core` with translation bundles stored in:

- `public/i18n/en.json` — Primary English (`en_US`) locale (default).
- `public/i18n/es.json` — Spanish (`es`) locale.

## Render SPA Routing

Deep links such as `/verify-email?token=...` and `/reset-password?token=...` require server-side SPA fallback routing. The file `public/_redirects` contains:

```text
/* /index.html 200
```

Angular copies `public/_redirects` directly into the production build output (`dist/jouletrackerfront/browser/_redirects`) so Render serves `index.html` with HTTP `200` on refresh or direct link navigation.

## Development & Verification Commands

```bash
# Install dependencies
npm install

# Start local development server (uses http://localhost:8081 API)
npm start

# Build for production (verifies templates, strict TypeScript, and _redirects output)
npm run build

# Run unit tests (Vitest)
npm test
```
