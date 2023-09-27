import { AsyncPipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DfAceEditorComponent } from 'src/app/shared/components/df-ace-editor/df-ace-editor.component';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-log-viewer',
  templateUrl: './df-log-viewer.component.html',
  standalone: true,
  imports: [AsyncPipe, DfAceEditorComponent, NgIf, MatButtonModule],
})
export class DfLogViewerComponent {
  content: string;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.data.subscribe(({ data }) => (this.content = data));
  }

  goBack() {
    this.router.navigate(['../../'], { relativeTo: this.activatedRoute });
  }
}
