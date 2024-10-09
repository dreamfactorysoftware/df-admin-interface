import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';
import { LoggingService } from './logging.service';
import { Router } from '@angular/router';
import { LoginResponse } from '../types/auth.types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<LoginResponse | null>;
  public currentUser: Observable<LoginResponse | null>;

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private loggingService: LoggingService,
    private router: Router
  ) {
    this.currentUserSubject = new BehaviorSubject<LoginResponse | null>(
      JSON.parse(localStorage.getItem('currentUser') || 'null')
    );
    this.currentUser = this.currentUserSubject.asObservable();
    this.loggingService.log(
      `AuthService initialized. Current user: ${
        this.currentUserSubject.value ? 'exists' : 'null'
      }`
    );
  }

  public get currentUserValue(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  loginWithJwt(jwt: string): Observable<LoginResponse> {
    this.loggingService.log(
      `Attempting to login with JWT: ${jwt.substring(0, 10)}...`
    );
    const headers = new HttpHeaders().set('X-DreamFactory-Session-Token', jwt);
    return this.http
      .get<LoginResponse>(`${this.apiUrl}/user/session`, { headers })
      .pipe(
        tap(response => {
          this.loggingService.log(
            `Login response received: ${JSON.stringify(response)}`
          );
          if (response && (response.session_token || response.sessionToken)) {
            localStorage.setItem('currentUser', JSON.stringify(response));
            this.currentUserSubject.next(response);
            this.userService.setCurrentUser(response);
            this.loggingService.log(
              'User logged in and stored in localStorage'
            );
          } else {
            this.loggingService.log(
              'Warning: sessionToken not found in response'
            );
          }
        }),
        catchError(error => {
          this.loggingService.log(`Login error: ${JSON.stringify(error)}`);
          throw error;
        })
      );
  }

  logout() {
    this.loggingService.log('Logging out user');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.userService.clearCurrentUser();
    this.router.navigate(['/#/auth/login']);
  }

  isLoggedIn(): boolean {
    const isLoggedIn =
      !!this.currentUserValue &&
      !!(
        this.currentUserValue.session_token ||
        this.currentUserValue.sessionToken
      );
    this.loggingService.log(`Checking if user is logged in: ${isLoggedIn}`);
    return isLoggedIn;
  }
}
