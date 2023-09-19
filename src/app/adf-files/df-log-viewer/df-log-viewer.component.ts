import { AsyncPipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { DfLogsComponent } from '../df-logs/df-logs.component';

@Component({
  selector: 'df-log-viewer',
  templateUrl: './df-log-viewer.component.html',
  standalone: true,
  imports: [AsyncPipe, DfLogsComponent, NgIf],
})
export class DfLogViewerComponent {
  type = this.activatedRoute.data.pipe(map(({ data }) => data.type));
  constructor(private activatedRoute: ActivatedRoute) {}
}
