import { NgIf } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EMPTY, catchError, filter, switchMap, timer } from 'rxjs';
import { BASE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { readAsText } from 'src/app/shared/utilities/file';
import { DfAceEditorComponent } from 'src/app/shared/components/df-ace-editor/df-ace-editor.component';

const POLL_MS = 5000;

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-log-viewer',
  templateUrl: './df-log-viewer.component.html',
  // Departure chrome only (tokens, hairline frame, corner scale);
  // the live-tail behavior below is untouched.
  styles: [
    `
      .log-toolbar {
        align-items: center;
        padding: 0 0 12px;
      }

      .log-editor {
        display: block;
        border: 1px solid var(--df-border);
        border-radius: var(--df-radius-sm);
        overflow: hidden;
      }
    `,
  ],
  standalone: true,
  imports: [
    DfAceEditorComponent,
    NgIf,
    MatButtonModule,
    MatSlideToggleModule,
    TranslocoPipe,
  ],
})
export class DfLogViewerComponent implements OnInit {
  content: string;
  live = true;

  @ViewChild(DfAceEditorComponent) editor: DfAceEditorComponent;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    @Inject(BASE_SERVICE_TOKEN) private crudService: DfBaseCrudService
  ) {
    this.activatedRoute.data.subscribe(({ data }) => (this.content = data));
  }

  ngOnInit(): void {
    // tail -f: poll while live, follow the bottom on new content.
    // ponytail: whole-file refetch every poll; switch to a ranged/tail API if
    // log sizes ever make this heavy.
    timer(POLL_MS, POLL_MS)
      .pipe(
        filter(() => this.live),
        switchMap(() => this.fetchLog()),
        untilDestroyed(this)
      )
      .subscribe(text => {
        if (text !== this.content) {
          this.content = text;
          queueMicrotask(() => this.editor?.scrollToBottom());
        }
      });
  }

  ngAfterViewInit(): void {
    if (this.live) {
      queueMicrotask(() => this.editor?.scrollToBottom());
    }
  }

  onLiveToggle(checked: boolean): void {
    this.live = checked;
    if (checked) {
      this.editor?.scrollToBottom();
    }
  }

  private fetchLog() {
    const entity = this.activatedRoute.snapshot.paramMap.get('entity') ?? '';
    const type = this.activatedRoute.snapshot.data['type'];
    return this.crudService
      .downloadFile(`${type}/${entity}`, {
        showSpinner: false,
        errorHandling: 'silent',
      })
      .pipe(
        switchMap(res => readAsText(res as Blob)),
        // A transient poll failure keeps the last content; next tick retries.
        catchError(() => EMPTY)
      );
  }

  goBack() {
    this.router.navigate(['../../'], { relativeTo: this.activatedRoute });
  }
}
