import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'df-app-debug',
  template: `
    <div *ngIf="debugInfo.length > 0">
      <h3>Debug Information:</h3>
      <ul>
        <li *ngFor="let info of debugInfo">{{ info }}</li>
      </ul>
      <button (click)="clearDebugInfo()">Clear Debug Info</button>
    </div>
  `,
})
export class DebugComponent implements OnInit {
  debugInfo: string[] = [];

  ngOnInit() {
    this.loadDebugInfo();
  }

  loadDebugInfo() {
    this.debugInfo = JSON.parse(localStorage.getItem('debugInfo') || '[]');
  }

  clearDebugInfo() {
    localStorage.removeItem('debugInfo');
    this.debugInfo = [];
  }
}
