/**
 * User entity representing an authenticated JouleTracker account.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  verified?: boolean;
}

/**
 * Credentials payload for login.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration payload for creating a new account.
 */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

/**
 * Authentication response returned by the API.
 */
export interface AuthResponse {
  user: User;
  token: string;
}
