import { AsyncPipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { DfFilesComponent } from '../df-files/df-files.component';
import { DfFileDetailsComponent } from '../df-file-details/df-file-details.component';

@Component({
  selector: 'df-file-viewer',
  templateUrl: './df-file-viewer.component.html',
  standalone: true,
  imports: [AsyncPipe, DfFileDetailsComponent, DfFilesComponent, NgIf],
})
export class DfFileViewerComponent {
  data = this.activatedRoute.data.pipe(map(({ data }) => data));
  type = this.data.pipe(map(({ type }) => type));
  constructor(private activatedRoute: ActivatedRoute) {}
}
