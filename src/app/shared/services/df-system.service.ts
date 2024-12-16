import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '../constants/urls';

@Injectable({
  providedIn: 'root'
})
export class DfSystemService {
  constructor(private http: HttpClient) {}

  post(endpoint: string, data: any) {
    return this.http.post(`${BASE_URL}/system/${endpoint}`, data);
  }

  get(endpoint: string) {
    return this.http.get(`${BASE_URL}/system/${endpoint}`);
  }
} 