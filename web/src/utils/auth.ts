import { getToken, getUser } from '@/services/api';
import type { Role } from '@pp/shared';

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Check if user has required role
 */
export function hasRole(requiredRole: Role): boolean {
  const user = getUser();
  return user?.role === requiredRole;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(requiredRoles: Role[]): boolean {
  const user = getUser();
  return user && requiredRoles.includes(user.role as Role);
}

/**
 * Get user role
 */
export function getUserRole(): Role | null {
  const user = getUser();
  return (user?.role as Role) || null;
}
