import { Component, DoCheck, OnDestroy, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfBadgeComponent } from 'src/app/shared/components/df-badge/df-badge.component';
import { AauthStore } from '../aauth.store';
import { HttpMethod, PlaygroundRun, PlaygroundStep } from '../aauth.types';
import { DfAaCopyComponent } from '../df-aa-copy/df-aa-copy.component';
import { DfAaJsonComponent } from '../df-aa-json/df-aa-json.component';
import { DfAaStepComponent } from '../df-aa-step/df-aa-step.component';
import { originOf, statusVariant } from '../jwt-view';
import { Lane, StepEntrance, Tone, laneOf, toneOf } from './lanes';

/**
 * Try it: the built-in playground agent calls this DreamFactory with
 * signed requests (server side), and the page draws every exchange as a
 * sequence diagram across Agent, API and Person Server. While a person
 * must approve, a card on the Person Server lane shows the code and an
 * Approve button; the run is polled every 2 s until it moves on.
 */
@Component({
  selector: 'df-aa-try',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    TranslocoPipe,
    DfBadgeComponent,
    DfAaCopyComponent,
    DfAaJsonComponent,
    DfAaStepComponent,
  ],
  templateUrl: './df-aa-try.component.html',
  styleUrls: ['./df-aa-try.component.scss'],
})
export class DfAaTryComponent implements OnInit, DoCheck, OnDestroy {
  readonly store = inject(AauthStore);
  readonly methods: HttpMethod[] = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];
  readonly statusVariant = statusVariant;
  readonly lane: (s: PlaygroundStep) => Lane = laneOf;
  readonly tone: (s: PlaygroundStep) => Tone = toneOf;

  /** The newest step draws in; nothing else moves. */
  readonly entrance = new StepEntrance();

  /** Expanded timeline rows, by index, for the run on screen. */
  private open = new Set<number>();
  private openRun: string | null = null;

  ngOnInit(): void {
    // Back on the tab: what is already drawn stays still.
    this.entrance.update(this.store.run, true);
    // Came back to the tab mid-run: pick the polling up again.
    if (this.store.runActive) this.store.startPolling();
  }

  ngDoCheck(): void {
    this.entrance.update(this.store.run);
  }

  ngOnDestroy(): void {
    this.store.stopPolling();
  }

  get origin(): string {
    return originOf(this.store.overview?.issuer);
  }

  get canSend(): boolean {
    return (
      !!this.store.overview?.enabled &&
      !!this.store.normalizedPath() &&
      !this.store.sending &&
      !this.store.runActive
    );
  }

  send(): void {
    if (!this.canSend) return;
    this.open.clear();
    this.store.send();
  }

  isOpen(i: number): boolean {
    this.syncRun();
    return this.open.has(i);
  }

  toggle(i: number): void {
    this.syncRun();
    if (this.open.has(i)) this.open.delete(i);
    else this.open.add(i);
  }

  private syncRun(): void {
    const id = this.store.run?.runId ?? null;
    if (id !== this.openRun) {
      this.open.clear();
      this.openRun = id;
    }
  }

  /**
   * The step whose response is the run's result: its expanded detail
   * leaves the body to the Response card below.
   */
  bodyBelow(run: PlaygroundRun, i: number): boolean {
    return (
      !!run.result && i === run.steps.length - 1 && run.steps[i].kind === 'call'
    );
  }

  approve(): void {
    const url = this.store.run?.pending?.url;
    if (url) window.open(url, '_blank', 'noopener');
  }

  trackStep = (i: number, s: PlaygroundStep) => `${i}:${s.kind}`;
}
