import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DfAlertComponent } from './df-alert.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [DfAlertComponent],
  imports: [MatIconModule, CommonModule, MatButtonModule],
  exports: [DfAlertComponent],
})
export class DfAlertModule {}
