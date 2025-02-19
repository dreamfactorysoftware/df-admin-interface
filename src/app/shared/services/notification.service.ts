import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  // constructor() {}

  success(title: string, message: string) {
    console.log('Success:', title, message);
    // Implement your notification logic here
  }

  error(title: string, message: string) {
    console.error('Error:', title, message);
    // Implement your notification logic here
  }
}
