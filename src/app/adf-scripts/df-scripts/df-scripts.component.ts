import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { DfScriptSamplesComponent } from '../df-script-samples/df-script-samples.component';

@Component({
  selector: 'df-scripts',
  templateUrl: './df-scripts.component.html',
  styleUrls: ['./df-scripts.component.scss'],
  standalone: true,
  imports: [MatTabsModule, DfScriptSamplesComponent],
})
export class DfScriptsComponent {}
