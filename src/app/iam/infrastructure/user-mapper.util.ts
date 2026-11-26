import {
  SubscriptionPlan,
  User,
  UserBusiness,
  UserHome,
  UserNotifications,
  UserRole,
  UserStatus
} from '../domain/model/user.entity';

export interface BackendUserResource {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  roles?: string[];
  role?: string;
  emailVerified?: boolean;
  verified?: boolean;
  status?: string;
  banned?: boolean;
  plan?: SubscriptionPlan;
  phone?: string;
  home?: UserHome;
  business?: UserBusiness;
  notifications?: UserNotifications;
}

const VALID_USER_STATUSES: ReadonlySet<UserStatus> = new Set([
  'ACTIVE',
  'BANNED',
  'SUSPENDED',
  'INACTIVE'
]);

/**
 * Normalizes a raw backend account status string into a strictly typed `UserStatus`.
 */
export function resolveUserStatus(
  rawStatus?: string,
  banned?: boolean,
  fallbackStatus?: UserStatus
): UserStatus {
  if (rawStatus) {
    const normalized = rawStatus.trim().toUpperCase() as UserStatus;
    if (VALID_USER_STATUSES.has(normalized)) {
      return normalized;
    }
  }
  if (banned === true) {
    return 'BANNED';
  }
  if (banned === false) {
    return 'ACTIVE';
  }
  return fallbackStatus ?? 'ACTIVE';
}

export interface LocalUserPreferences {
  role?: UserRole | string;
  plan?: SubscriptionPlan;
  phone?: string;
  home?: UserHome;
  business?: UserBusiness;
  notifications?: UserNotifications;
}

const PREFS_STORAGE_KEY = 'jouletracker_user_prefs';

function readPrefsMap(): Record<string, LocalUserPreferences> {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getLocalUserPreferences(email?: string): LocalUserPreferences {
  if (!email) return {};
  const map = readPrefsMap();
  return map[email.trim().toLowerCase()] ?? {};
}

export function saveLocalUserPreferences(
  email: string | undefined,
  prefs: Partial<LocalUserPreferences>
): void {
  if (!email) return;
  const key = email.trim().toLowerCase();
  const map = readPrefsMap();
  map[key] = { ...(map[key] ?? {}), ...prefs };
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

export function resolveRoleFromBackend(
  roles?: string[],
  directRole?: string,
  preferredRole?: UserRole | string
): UserRole | string {
  const normalizedRoles = (roles ?? []).map((r) => r.toUpperCase());
  if (normalizedRoles.includes('ROLE_ADMIN')) return 'admin';
  if (normalizedRoles.includes('ROLE_BUSINESS')) return 'business';

  if (directRole && ['admin', 'business', 'homeowner'].includes(directRole.toLowerCase())) {
    return directRole.toLowerCase();
  }

  if (preferredRole) {
    return preferredRole.toLowerCase();
  }

  return 'homeowner';
}

/**
 * Maps Spring Boot `UserResource` (or legacy flat user JSON) to the frontend `User` entity,
 * preserving local preferences (plan, business/home metadata, notifications, account mode)
 * and synchronizing account moderation status (`ACTIVE`, `BANNED`, `SUSPENDED`, `INACTIVE`).
 */
export function mapBackendUserToEntity(
  resource: BackendUserResource,
  existingSession?: Partial<User>,
  tokenOverride?: string
): User {
  const prefs = getLocalUserPreferences(resource.email);
  const fullName =
    resource.name?.trim() ||
    [resource.firstName, resource.lastName].filter(Boolean).join(' ').trim() ||
    resource.email;
  const status = resolveUserStatus(resource.status, resource.banned, existingSession?.status);

  return {
    id: resource.id,
    name: fullName,
    email: resource.email,
    role: resolveRoleFromBackend(
      resource.roles,
      resource.role,
      prefs.role ?? existingSession?.role
    ),
    token: tokenOverride ?? existingSession?.token,
    verified: resource.emailVerified ?? resource.verified ?? existingSession?.verified,
    status,
    banned: status === 'BANNED' || status === 'SUSPENDED' || Boolean(resource.banned),
    plan: resource.plan ?? prefs.plan ?? existingSession?.plan ?? 'pro',
    phone: resource.phone ?? prefs.phone ?? existingSession?.phone,
    home: resource.home ?? prefs.home ?? existingSession?.home,
    business: resource.business ?? prefs.business ?? existingSession?.business,
    notifications: resource.notifications ?? prefs.notifications ?? existingSession?.notifications
  };
}
