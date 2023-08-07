import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PasswordResetService {
  constructor(private http: HttpClient) {}

  resetPassword(endpoint: string, data: any, params: any): Observable<any> {
    const url = `${endpoint}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.http.post(url, data, { headers, params }).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError('Something went wrong. Please try again later.'); // TODO add error handling
      })
    );
  }
}
