import { Injectable, Inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, delay, switchMap } from 'rxjs/operators';
import { ROLE_SERVICE_TOKEN } from '../constants/tokens';
import { DfBaseCrudService } from './df-base-crud.service';
import { UserSession } from '../types/user';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DfRoleRedirectService {
  constructor(
    @Inject(ROLE_SERVICE_TOKEN)
    private roleService: DfBaseCrudService,
    private http: HttpClient
  ) {}

  /**
   * Gets the redirect URI for a user's role, with fallback to default
   * @param userSession The user session containing role information
   * @returns Observable<string> The redirect URI or default '/home'
   */
  getRoleRedirectUri(userSession: UserSession): Observable<string> {
    // First check if userSession has direct role info
    let roleId = userSession?.roleId || userSession?.role_id;

    if (roleId) {
      return this.fetchRoleRedirectUri(roleId);
    }

    // If no direct role ID, try to get it from user's app roles
    if (userSession?.id) {
      return this.getUserRoleFromAPI(userSession.id);
    }

    return of('/home');
  }

  /**
   * Fetch redirect URI for a specific role ID
   */
  private fetchRoleRedirectUri(roleId: number): Observable<string> {
    // Add a small delay to ensure authentication is fully established
    return of(null).pipe(
      delay(100),
      switchMap(() => this.roleService.get(roleId) as Observable<{ redirectUri?: string; [key: string]: any }>),
      map((role: { redirectUri?: string; [key: string]: any }) => {
        // Check if role has a redirect_uri and it's not empty
        if (role?.redirectUri && role.redirectUri.trim()) {
          const redirectUri = role.redirectUri.trim();

          // Security check: Only allow internal URIs
          if (this.isInternalUri(redirectUri)) {
            return redirectUri;
          } else {
            // External URL blocked for security
            return '/home';
          }
        }

        return '/home';
      }),
      catchError((error) => {
        // If we can't fetch the role, use fallback
        if (error.status === 403) {
          return this.getRoleRedirectFromCache(roleId);
        }

        return of('/home');
      })
    );
  }

  /**
   * Fallback method when role API is unavailable
   * Returns default home route for security
   */
  private getRoleRedirectFromCache(roleId: number): Observable<string> {
    return of('/home');
  }

  /**
   * Get user's role from user API endpoint
   */
  private getUserRoleFromAPI(userId: number): Observable<string> {
    // Try to get user details which might include role information
    // For now, return default - this would need to be implemented based on your user API structure
    return of('/home');
  }

  /**
   * Determines the appropriate redirect URL after login
   * @param userSession The user session
   * @param returnUrl Optional return URL from query params
   * @returns Observable<string> The final redirect URL
   */
  getLoginRedirectUrl(userSession: UserSession, returnUrl?: string): Observable<string> {
    // If there's a return URL from query params, validate it for security
    if (returnUrl && returnUrl !== '/') {
      if (this.isInternalUri(returnUrl)) {
        return of(returnUrl);
      }
      // Fall through to role-based redirect if external URL blocked
    }

    // Otherwise, use role-based redirect
    return this.getRoleRedirectUri(userSession);
  }

  /**
   * Security check to ensure URI is internal only
   * @param uri The URI to validate
   * @returns boolean True if internal, false if external
   */
  private isInternalUri(uri: string): boolean {
    if (!uri) return false;

    // Must start with /
    if (!uri.startsWith('/')) {
      return false;
    }

    // Block anything that looks like external URLs
    if (uri.includes('://') ||
        uri.includes('www.') ||
        uri.includes('.com') ||
        uri.includes('.org') ||
        uri.includes('.net') ||
        uri.includes('.gov') ||
        uri.includes('.edu') ||
        uri.includes('localhost:') ||
        /\d+\.\d+\.\d+\.\d+/.test(uri)) { // IP addresses
      return false;
    }

    // Only allow valid internal route characters
    const internalUriPattern = /^\/[a-zA-Z0-9\/_-]*$/;
    return internalUriPattern.test(uri);
  }
}