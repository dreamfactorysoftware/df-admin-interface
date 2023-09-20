import { AsyncPipe, NgIf } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DfAceEditorComponent } from 'src/app/shared/components/df-ace-editor/df-ace-editor.component';

@Component({
  selector: 'df-log-viewer',
  templateUrl: './df-log-viewer.component.html',
  standalone: true,
  imports: [AsyncPipe, DfAceEditorComponent, NgIf, MatButtonModule],
})
export class DfLogViewerComponent implements OnDestroy {
  destroyed$ = new Subject<void>();
  content: string;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ data }) => (this.content = data));
  }

  goBack() {
    this.router.navigate(['../../'], { relativeTo: this.activatedRoute });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
