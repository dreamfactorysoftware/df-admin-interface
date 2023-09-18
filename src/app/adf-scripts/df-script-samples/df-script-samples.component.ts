import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'df-script-samples',
  templateUrl: './df-script-samples.component.html',
  styleUrls: ['./df-script-samples.component.scss'],
  standalone: true,
  imports: [MatTabsModule, MatInputModule],
})
export class DfScriptSamplesComponent {}
