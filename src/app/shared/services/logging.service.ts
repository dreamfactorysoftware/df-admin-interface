import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private logs: string[] = [];

  log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(logMessage);
    this.logs.push(logMessage);
  }

  getLogs(): string[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}
