import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  constructor() {}

  setCurrentUser(user: any) {
    throw new Error('Method not implemented!');
  }
}
