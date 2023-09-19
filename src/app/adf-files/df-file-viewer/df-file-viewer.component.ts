import { AsyncPipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { DfFilesComponent } from '../df-files/df-files.component';

@Component({
  selector: 'df-file-viewer',
  templateUrl: './df-file-viewer.component.html',
  standalone: true,
  imports: [AsyncPipe, DfFilesComponent, NgIf],
})
export class DfFileViewerComponent {
  type = this.activatedRoute.data.pipe(map(({ data }) => data.type));
  constructor(private activatedRoute: ActivatedRoute) {}
}
