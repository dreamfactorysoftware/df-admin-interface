import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCalculator,
  faCircleCheck,
  faCircleInfo,
  faPlay,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import { silent } from 'src/app/shared/utilities/http-contexts';
import {
  AiChatService,
  ChatService,
} from 'src/app/adf-ai-chat/services/ai-chat.service';
import { UsageService } from '../../services/usage.service';
import { estimateCost, formatUSD } from '../../utils/cost';
import {
  ActualComparison,
  BudgetVerdict,
  TOOL_LOOP,
  TaskCalibration,
  TaskEstimate,
  budgetVerdict,
  calibrate,
  compareActual,
  computeEstimate,
  roundTokens,
  usageCostDelta,
} from '../../utils/task-estimate';

/**
 * POST /api/v2/agents/route response, AFTER the global caseInterceptor
 * (everything under /api/v2 arrives camelCase — see adf-agents). The
 * contract never includes api_key or any credential material.
 */
interface RouteResponse {
  routedTo: { id: number; name: string } | null;
  chatServiceId: number | null;
  chatService: string | null;
  reason: string;
  scores: { id: number; name: string; score: number }[];
}

interface RunState {
  busy: boolean;
  phase: string;
  content: string | null;
  warning: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  actualCost: number | null;
  /** 'server' = metered rows (the pre/post snapshot delta); 'client' =
   *  computed here from returned token counts while server rows lag. */
  actualSource: 'server' | 'client' | null;
  comparison: ActualComparison | null;
  error: string | null;
}

/**
 * Task cost estimator ("what if I ran this?"). Describe a task; the agents
 * router picks the registered agent, the meter's own 90-day history prices
 * the task BEFORE anything runs, and an optional budget turns the range
 * into a soft verdict. "Run for real" then executes the task through the
 * target ai_chat service and compares actual metered spend against the
 * estimate. Estimating spends $0 — one router call plus meter reads.
 *
 * Every degradation is honest: router missing/denied or no matching agent
 * falls back to a manual ai_chat service picker; too little metered
 * history says so instead of inventing numbers; an over-budget verdict
 * warns but never hard-blocks the run.
 */
@Component({
  selector: 'df-task-estimator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    FontAwesomeModule,
  ],
  template: `
    <mat-card class="taskest">
      <mat-card-content>
        <header class="taskest__head">
          <h4 class="taskest__title">
            Task cost estimator
            <fa-icon
              class="taskest__title-hint"
              [icon]="faCircleInfo"
              matTooltip="Describe a task in plain language. The agents router picks the registered agent for it, and the usage meter's own 90-day history prices the task before anything runs. Estimating costs nothing; spend only happens if you click Run."
              matTooltipPosition="above"></fa-icon>
          </h4>
          <span class="taskest__total" *ngIf="est">
            ≈ {{ formatUsd(est.costLow) }} – {{ formatUsd(est.costHigh) }}
          </span>
        </header>
        <p class="taskest__hint">
          What would this task cost before you run it? Routing picks the
          agent, the meter's history prices it, and nothing is spent until
          you click Run.
        </p>

        <textarea
          class="taskest__task"
          rows="2"
          aria-label="Task description"
          placeholder="e.g. Reconcile last week's invoices against purchase orders"
          [(ngModel)]="task"
          [disabled]="busy"
          (keydown.enter)="$event.preventDefault(); estimate()"></textarea>

        <div class="taskest__controls">
          <input
            class="taskest__budget"
            type="number"
            min="0"
            step="0.01"
            aria-label="Budget in dollars (optional)"
            placeholder="Budget $ (optional)"
            [(ngModel)]="budgetInput" />
          <button
            type="button"
            mat-stroked-button
            [disabled]="busy || !task.trim()"
            (click)="estimate()">
            <fa-icon [icon]="faCalculator"></fa-icon>
            <span>{{ busy ? 'Estimating…' : 'Estimate' }}</span>
          </button>
        </div>

        <div *ngIf="busy" class="taskest__phase">
          <mat-spinner diameter="18"></mat-spinner>
          <span>{{ phase }}</span>
        </div>

        <!-- Routing outcome -->
        <div *ngIf="route?.routedTo" class="taskest__routed">
          <fa-icon class="taskest__ok" [icon]="faCircleCheck"></fa-icon>
          <span>
            Would route to
            <strong>{{ route!.routedTo!.name }}</strong>
            <span class="taskest__reason"> — {{ route!.reason }}</span>
          </span>
        </div>
        <div class="taskest__scores" *ngIf="route?.scores?.length">
          <span
            class="taskest__score"
            *ngFor="let s of route!.scores; trackBy: trackScore">
            {{ s.name }} · {{ s.score }}
          </span>
        </div>

        <!-- Router down / no match / routed agent without a chat persona -->
        <div *ngIf="fallbackReason" class="taskest__warn">
          <fa-icon [icon]="faTriangleExclamation"></fa-icon>
          <span>{{ fallbackReason }}</span>
        </div>
        <mat-form-field
          *ngIf="showManualPicker"
          appearance="outline"
          class="taskest__picker">
          <mat-label>Chat service</mat-label>
          <mat-select
            [ngModel]="manualServiceId"
            (ngModelChange)="onManualServiceChange($event)">
            <mat-option
              *ngFor="let s of manualServices; trackBy: trackService"
              [value]="s.id">
              {{ s.label || s.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>
        <p
          *ngIf="fallbackReason && !busy && manualServicesError"
          class="taskest__empty">
          Could not load the chat service list — hit Estimate to retry.
        </p>
        <p
          *ngIf="
            fallbackReason &&
            !busy &&
            !manualServicesError &&
            manualServices.length === 0
          "
          class="taskest__empty">
          No active AI Chat services are configured, so there is nothing to
          estimate against.
        </p>

        <!-- Calibration + estimate -->
        <div *ngIf="calibFailed && !busy" class="taskest__warn">
          <fa-icon [icon]="faTriangleExclamation"></fa-icon>
          <span>Not enough metered history to calibrate an estimate.</span>
        </div>

        <ng-container *ngIf="calib && est">
          <table class="taskest__table">
            <tbody>
              <tr>
                <th>Model</th>
                <td>
                  {{ calib!.model || 'unknown model'
                  }}{{ calib!.provider ? ' · ' + calib!.provider : '' }}
                </td>
              </tr>
              <tr>
                <th>Est. input tokens</th>
                <td>{{ tokenRange(est!.inputLow, est!.inputHigh) }}</td>
              </tr>
              <tr>
                <th>Est. output tokens</th>
                <td>{{ tokenRange(est!.outputLow, est!.outputHigh) }}</td>
              </tr>
              <tr>
                <th>Rates</th>
                <td>
                  <ng-container *ngIf="calib!.rateSource === 'live'">
                    {{ formatRate(calib!.rates.inputPer1k) }} /
                    {{ formatRate(calib!.rates.outputPer1k) }} per 1k (live)
                  </ng-container>
                  <ng-container *ngIf="calib!.rateSource === 'blended'">
                    {{ formatRate(calib!.rates.inputPer1k) }} per 1k (blended
                    from metered history)
                  </ng-container>
                </td>
              </tr>
            </tbody>
          </table>
          <p class="taskest__cal">
            {{
              calib!.source === 'app'
                ? 'Calibrated from ' +
                  calib!.requests +
                  ' metered calls for this agent (90d).'
                : 'Calibrated from ' +
                  calib!.requests +
                  ' metered calls on the AI connection behind the chat service (90d).'
            }}
            One task ≈ {{ toolLoop.low }}–{{ toolLoop.high }} model calls
            (observed tool loop), so this is a range, not a quote.
          </p>

          <div
            class="taskest__verdict"
            [attr.data-verdict]="verdict"
            [ngSwitch]="verdict">
            <span *ngSwitchCase="'none'">No budget set — estimate only.</span>
            <span *ngSwitchCase="'within'">
              <fa-icon [icon]="faCircleCheck"></fa-icon>
              Worth running — even the high estimate
              {{ formatUsd(est!.costHigh) }} fits your
              {{ formatUsd(budget!) }} budget.
            </span>
            <span *ngSwitchCase="'over'">
              <fa-icon [icon]="faTriangleExclamation"></fa-icon>
              Over budget — the high estimate {{ formatUsd(est!.costHigh) }}
              exceeds your {{ formatUsd(budget!) }} budget.
            </span>
          </div>
        </ng-container>

        <!-- Run for real — the budget gate is visual, never a hard block -->
        <div class="taskest__run" *ngIf="runTargetName">
          <button
            type="button"
            mat-stroked-button
            [disabled]="busy || run?.busy || !task.trim()"
            (click)="runTask()">
            <fa-icon [icon]="faPlay"></fa-icon>
            <span>{{ verdict === 'over' ? 'Run anyway' : 'Run for real' }}</span>
          </button>
          <span class="taskest__run-cap">
            Runs through {{ runTargetName }} and meters real spend.
          </span>
        </div>

        <ng-container *ngIf="run">
          <div *ngIf="run!.busy" class="taskest__phase">
            <mat-spinner diameter="18"></mat-spinner>
            <span>{{ run!.phase }}</span>
          </div>
          <div *ngIf="run!.error" class="taskest__warn">
            <fa-icon [icon]="faTriangleExclamation"></fa-icon>
            <span>{{ run!.error }}</span>
          </div>
          <div *ngIf="run!.warning" class="taskest__warn">
            <fa-icon [icon]="faTriangleExclamation"></fa-icon>
            <span>{{ run!.warning }}</span>
          </div>
          <div *ngIf="run!.content" class="taskest__answer">
            {{ run!.content }}
          </div>

          <div
            *ngIf="run!.actualCost !== null && est"
            class="taskest__compare">
            <div class="taskest__tile">
              <span class="taskest__tile-label">Estimated</span>
              <span class="taskest__tile-value">
                {{ formatUsd(est!.costLow) }} – {{ formatUsd(est!.costHigh) }}
              </span>
            </div>
            <div class="taskest__tile">
              <span class="taskest__tile-label">Actual</span>
              <span
                class="taskest__tile-value"
                [class.taskest__tile-value--over]="
                  run!.comparison?.kind === 'above'
                ">
                {{ formatUsd(run!.actualCost!) }}
              </span>
            </div>
          </div>
          <p *ngIf="comparisonText" class="taskest__delta">
            {{ comparisonText }}
          </p>
          <p *ngIf="run!.actualCost !== null && !est" class="taskest__delta">
            Actual spend: {{ formatUsd(run!.actualCost!) }} (no estimate to
            compare against).
          </p>
          <p *ngIf="run!.actualSource" class="taskest__cal">
            {{
              run!.actualSource === 'server'
                ? 'Actual = server-metered rows from the usage log.'
                : 'Actual computed from returned token counts; server rows pending.'
            }}
            <ng-container *ngIf="run!.inputTokens !== null">
              {{ run!.inputTokens | number }} in /
              {{ run!.outputTokens | number }} out tokens.
            </ng-container>
          </p>
        </ng-container>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      /* Token-only chrome like the sibling cost panel; the warning amber is
         aliased locally per theme (no global --df-warning in light/dark). */
      .taskest {
        --taskest-warning: #9a5b00;

        mat-card-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        &__head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }
        &__title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--df-text);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        &__title-hint {
          color: var(--df-text-muted);
          font-size: 1.3rem;
          cursor: help;
        }
        &__total {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 2rem;
          font-weight: 700;
          color: var(--df-success);
          white-space: nowrap;
        }
        &__hint {
          margin: 0;
          font-size: 1.3rem;
          color: var(--df-text-2);
          line-height: 1.5;
        }

        &__task {
          width: 100%;
          resize: vertical;
          padding: 10px 12px;
          background: var(--df-surface);
          border: 1px solid var(--df-border);
          border-radius: var(--df-radius-sm);
          color: var(--df-text);
          font: inherit;
          font-size: 1.4rem;
          line-height: 1.5;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;

          &:focus {
            outline: none;
            border-color: var(--df-accent);
            box-shadow: 0 0 0 2px var(--df-accent-soft);
          }
        }

        &__controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        &__budget {
          width: 160px;
          padding: 8px 10px;
          background: var(--df-surface);
          border: 1px solid var(--df-border);
          border-radius: var(--df-radius-sm);
          color: var(--df-text);
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 1.3rem;
          text-align: right;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;

          &:focus {
            outline: none;
            border-color: var(--df-accent);
            box-shadow: 0 0 0 2px var(--df-accent-soft);
          }
        }

        &__phase {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.3rem;
          color: var(--df-text-2);
        }

        &__routed {
          display: flex;
          align-items: baseline;
          gap: 8px;
          font-size: 1.4rem;
          color: var(--df-text);
        }
        &__ok {
          color: var(--df-success);
        }
        &__reason {
          color: var(--df-text-muted);
        }
        &__scores {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        &__score {
          font-size: 1.2rem;
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          color: var(--df-text-2);
          background: var(--df-surface);
          border: 1px solid var(--df-border-2);
          border-radius: 999px;
          padding: 2px 10px;
        }

        &__warn {
          display: flex;
          align-items: baseline;
          gap: 8px;
          font-size: 1.3rem;
          color: var(--df-warning, var(--taskest-warning));
        }
        &__empty {
          margin: 0;
          font-size: 1.3rem;
          color: var(--df-text-2);
          font-style: italic;
        }
        &__picker {
          max-width: 320px;
        }

        &__table {
          border-collapse: collapse;
          font-size: 1.4rem;
          color: var(--df-text);

          th {
            text-align: left;
            padding: 8px 24px 8px 0;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--df-text-muted);
            font-weight: 600;
            white-space: nowrap;
            vertical-align: baseline;
          }
          td {
            padding: 8px 0;
            font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          }
          tr + tr th,
          tr + tr td {
            border-top: 1px solid var(--df-border-2);
          }
        }
        &__cal {
          margin: 0;
          font-size: 1.2rem;
          color: var(--df-text-muted);
          line-height: 1.5;
        }

        &__verdict {
          font-size: 1.4rem;
          color: var(--df-text-2);

          span {
            display: flex;
            align-items: baseline;
            gap: 8px;
          }
          &[data-verdict='within'] {
            color: var(--df-success);
          }
          &[data-verdict='over'] {
            color: var(--df-warning, var(--taskest-warning));
          }
        }

        &__run {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 4px;
          border-top: 1px solid var(--df-border-2);
        }
        &__run-cap {
          font-size: 1.2rem;
          color: var(--df-text-muted);
        }
        &__answer {
          font-size: 1.3rem;
          color: var(--df-text);
          background: var(--df-surface);
          border: 1px solid var(--df-border-2);
          border-radius: var(--df-radius-sm);
          padding: 12px;
          white-space: pre-wrap;
          max-height: 200px;
          overflow-y: auto;
        }

        &__compare {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        &__tile {
          flex: 1 1 160px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: var(--df-surface);
          border: 1px solid var(--df-border-2);
          border-radius: var(--df-radius-sm);
          padding: 12px;
        }
        &__tile-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--df-text-muted);
          font-weight: 600;
        }
        &__tile-value {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--df-success);

          &--over {
            color: var(--df-warning, var(--taskest-warning));
          }
        }
        &__delta {
          margin: 0;
          font-size: 1.3rem;
          color: var(--df-text-2);
        }
      }

      :host-context(.dark-theme) .taskest {
        --taskest-warning: #ffb74d;
      }
    `,
  ],
})
export class DfTaskEstimatorComponent {
  private http = inject(HttpClient);
  private usage = inject(UsageService);
  private chat = inject(AiChatService);

  /** Fires after a real run completes so the parent can refresh the
   *  dashboard — the new spend should show up in the charts above. */
  @Output() ran = new EventEmitter<void>();

  task = '';
  budgetInput: number | null = null;

  busy = false;
  phase = '';
  route: RouteResponse | null = null;
  /** Router endpoint unreachable/denied (distinct from a null routing). */
  routeError: string | null = null;
  /** The routed agent's backing app id ("agent:{id}"). Only used for the
   *  90d calibration window, where agent-keyed history genuinely lives —
   *  run snapshots filter by the session's AI Connection instead, because
   *  console-driven runs attribute to the admin app, not this one. */
  appId: number | null = null;

  manualServices: ChatService[] = [];
  manualServiceId: number | null = null;
  /** listChatServices() failed — distinct from a genuinely empty list, so
   *  the template never asserts "none configured" over a fetch error. */
  manualServicesError = false;

  calib: TaskCalibration | null = null;
  calibFailed = false;
  est: TaskEstimate | null = null;
  run: RunState | null = null;

  readonly toolLoop = TOOL_LOOP;

  faCalculator = faCalculator;
  faCircleCheck = faCircleCheck;
  faCircleInfo = faCircleInfo;
  faPlay = faPlay;
  faTriangleExclamation = faTriangleExclamation;

  /** ESTIMATE — spends $0: one router call plus meter reads. */
  async estimate(): Promise<void> {
    const task = this.task.trim();
    if (!task || this.busy) {
      return;
    }
    this.busy = true;
    this.phase = 'Routing the task to an agent…';
    this.route = null;
    this.routeError = null;
    this.appId = null;
    this.calib = null;
    this.calibFailed = false;
    this.est = null;
    this.run = null;
    try {
      try {
        this.route = await firstValueFrom(
          this.http.post<RouteResponse>(
            `${BASE_URL}/agents/route`,
            { task },
            { context: silent() }
          )
        );
      } catch {
        // 404 (df-agents not installed), 403 (not a sysadmin), or any other
        // failure: degrade to the manual picker, never a dead panel.
        this.routeError =
          'Task routing is unavailable — pick a chat service to estimate against.';
      }

      if (!this.route?.routedTo) {
        await this.loadManualServices();
        // A fallback service picked on an earlier estimate stays selected —
        // recalibrate against it so the panel doesn't show stale nothing.
        if (this.manualServiceId != null) {
          this.phase = 'Reading the usage meter…';
          await this.calibrateTarget(null, this.manualServiceId);
        }
        return;
      }

      this.phase = 'Reading the usage meter…';
      this.appId = await this.lookupBackingApp(this.route.routedTo.id);
      await this.calibrateTarget(this.appId, this.route.chatServiceId);
      if (!this.route.chatServiceId) {
        // Routed, but the agent has no chat persona to run through.
        await this.loadManualServices();
      }
    } finally {
      this.busy = false;
    }
  }

  /** Manual fallback target picked — recalibrate against it. */
  onManualServiceChange(id: number | null): void {
    this.manualServiceId = id;
    this.run = null;
    if (id == null) {
      this.calib = null;
      this.est = null;
      this.calibFailed = false;
      return;
    }
    this.busy = true;
    this.phase = 'Reading the usage meter…';
    this.calibrateTarget(this.appId, id).finally(() => (this.busy = false));
  }

  /**
   * RUN — real spend. Open a session on the target ai_chat service (the
   * console's own credentials, same as the AI Chat page), snapshot the
   * meter by the session's AI Connection, run the task, then read the
   * meter again and compare actual cost to the estimate.
   */
  async runTask(): Promise<void> {
    const target = this.runTargetName;
    const task = this.task.trim();
    if (!target || !task || this.busy || this.run?.busy) {
      return;
    }
    const run: RunState = {
      busy: true,
      phase: 'Opening a chat session…',
      content: null,
      warning: null,
      inputTokens: null,
      outputTokens: null,
      actualCost: null,
      actualSource: null,
      comparison: null,
      error: null,
    };
    this.run = run;
    let sessionId: number | null = null;
    try {
      const session = await firstValueFrom(
        this.chat.createSession(target, {
          title: 'what-if: ' + task.slice(0, 40),
        })
      );
      sessionId = session.id;
      // The run flows through the console's own session, so usage rows land
      // under the session's AI Connection (ChatOrchestrator meters
      // ai_service_id) and the admin app — never the chat service's own id
      // or the agent's backing app. Snapshot pre AND post by that
      // connection; the session arrives snake_case (case-interceptor
      // exempt), with the chat service id as a last-resort fallback.
      const filter = {
        service_id: session.ai_service_id ?? this.runTargetId ?? undefined,
      };
      run.phase = 'Reading the meter (pre-run snapshot)…';
      const pre = await firstValueFrom(this.usage.loadWindow('1h', filter));
      run.phase = `Running the task through ${target}…`;
      const msg = await firstValueFrom(
        this.chat.sendMessage(target, session.id, task)
      );
      run.content = msg.content;
      run.inputTokens = msg.input_tokens ?? null;
      run.outputTokens = msg.output_tokens ?? null;
      if (run.inputTokens == null) {
        // The chat call didn't complete a metered turn (ChatException-style
        // response) — no token counts means no honest cost comparison. The
        // orchestrator still logs an error row, so refresh the dashboard.
        run.warning =
          'The chat service returned no token counts, so actual cost cannot be compared.';
        this.ran.emit();
        return;
      }
      run.phase = 'Reading the meter…';
      const delta = await this.meterDelta(filter, pre);
      if (delta > 0) {
        run.actualCost = delta;
        run.actualSource = 'server';
      } else if (this.calib) {
        run.actualCost = estimateCost(
          run.inputTokens,
          run.outputTokens ?? 0,
          this.calib.rates
        );
        run.actualSource = 'client';
      }
      if (run.actualCost != null && this.est) {
        run.comparison = compareActual(
          run.actualCost,
          this.est.costLow,
          this.est.costHigh
        );
      }
      this.ran.emit();
    } catch (err) {
      const message = normalizeError(err).message;
      run.error = message.startsWith('errors.')
        ? 'The run failed — check the chat service configuration.'
        : message;
    } finally {
      run.busy = false;
      // What-if sessions are throwaway — clean up (best-effort) so runs
      // don't accumulate in the target service's session list. The answer
      // and token counts already live in the run state.
      if (sessionId != null) {
        this.chat.deleteSession(target, sessionId).subscribe({
          error: () => undefined,
        });
      }
    }
  }

  // ─── Derived view state ───────────────────────────────────────────────

  get budget(): number | null {
    const b = Number(this.budgetInput);
    return Number.isFinite(b) && b > 0 ? b : null;
  }

  get verdict(): BudgetVerdict {
    return this.est ? budgetVerdict(this.est.costHigh, this.budget) : 'none';
  }

  /** Why the manual picker is showing (null = routing fully succeeded). */
  get fallbackReason(): string | null {
    if (this.routeError) {
      return this.routeError;
    }
    if (this.route && !this.route.routedTo) {
      return (
        'No agent takes this task — ' +
        (this.route.reason || 'no registered agent matches') +
        '. Pick a chat service to estimate against.'
      );
    }
    if (this.route?.routedTo && !this.route.chatServiceId) {
      return 'The routed agent has no chat service configured — pick one to run against.';
    }
    return null;
  }

  get showManualPicker(): boolean {
    return this.fallbackReason !== null && this.manualServices.length > 0;
  }

  /** The ai_chat service a real run goes through: the routed agent's chat
   *  persona, or the manually picked fallback. */
  get runTargetName(): string | null {
    if (this.route?.routedTo && this.route.chatService) {
      return this.route.chatService;
    }
    const svc = this.manualServices.find(s => s.id === this.manualServiceId);
    return svc?.name ?? null;
  }

  get runTargetId(): number | null {
    if (this.route?.routedTo && this.route.chatServiceId) {
      return this.route.chatServiceId;
    }
    return this.manualServiceId;
  }

  get comparisonText(): string | null {
    const c = this.run?.comparison;
    if (!c) {
      return null;
    }
    if (c.kind === 'within') {
      return 'Actual is within the estimate range.';
    }
    if (c.kind === 'above') {
      return `+${c.pct}% vs the high estimate.`;
    }
    return `−${c.pct}% vs the low estimate.`;
  }

  tokenRange(low: number, high: number): string {
    return (
      '~' +
      roundTokens(low).toLocaleString() +
      ' – ' +
      roundTokens(high).toLocaleString()
    );
  }

  formatUsd(v: number): string {
    return formatUSD(v);
  }

  /** Per-1k rates sit well below a cent, where formatUSD would collapse to
   *  "<$0.01" — 3 significant digits keeps them honest ($0.003). */
  formatRate(v: number): string {
    return Number.isFinite(v) ? '$' + parseFloat(v.toPrecision(3)) : '$—';
  }

  trackScore(_: number, s: { id: number }): number {
    return s.id;
  }

  trackService(_: number, s: ChatService): number {
    return s.id;
  }

  // ─── Internals ────────────────────────────────────────────────────────

  /**
   * Calibration fallback chain (never invent numbers):
   *   1. the routed agent's backing app 90d window (≥5 metered calls);
   *   2. the target chat service's 90d window (≥5 calls);
   *   3. nothing — "Not enough metered history to calibrate an estimate."
   */
  private async calibrateTarget(
    appId: number | null,
    serviceId: number | null
  ): Promise<void> {
    let calibration: TaskCalibration | null = null;
    if (appId != null) {
      const window = await firstValueFrom(
        this.usage.loadWindow('90d', { app_id: appId })
      );
      if (window) {
        calibration = calibrate(window, 'app');
      }
    }
    if (!calibration && serviceId != null) {
      // Chat services never meter under their own id — ChatOrchestrator
      // logs every turn against the underlying AI Connection
      // (config.ai_service_id) — so the service-level window filters by
      // the connection, where the history actually lives.
      const meterId = await this.lookupAiServiceId(serviceId);
      const window = await firstValueFrom(
        this.usage.loadWindow('90d', { service_id: meterId })
      );
      if (window) {
        calibration = calibrate(window, 'service');
      }
    }
    this.calib = calibration;
    this.calibFailed = !calibration;
    this.est = calibration ? computeEstimate(calibration) : null;
  }

  /** Resolve the routed agent's backing app ("agent:{id}" — see df-agents'
   *  Agent::backingAppName) so meter reads attribute to that agent. */
  private async lookupBackingApp(agentId: number): Promise<number | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ resource: { id: number }[] }>(
          `${BASE_URL}/system/app`,
          {
            params: {
              fields: 'id,name',
              filter: `name = "agent:${agentId}"`,
            },
            context: silent(),
          }
        )
      );
      return res.resource?.[0]?.id ?? null;
    } catch {
      return null;
    }
  }

  /** Resolve the AI Connection (config.ai_service_id) behind an ai_chat
   *  service — the id usage rows are actually metered under. Falls back to
   *  the chat service's own id when the config is unreadable. Config keys
   *  are read in both cases: the case interceptor camelCases /system
   *  responses, but stays defensive should the endpoint go exempt. */
  private async lookupAiServiceId(chatServiceId: number): Promise<number> {
    try {
      const res = await firstValueFrom(
        this.http.get<{
          config?: { ai_service_id?: number; aiServiceId?: number };
        }>(`${BASE_URL}/system/service/${chatServiceId}`, {
          context: silent(),
        })
      );
      return (
        res.config?.ai_service_id ?? res.config?.aiServiceId ?? chatServiceId
      );
    } catch {
      return chatServiceId;
    }
  }

  /** List active ai_chat services for the manual fallback picker. Always
   *  refetched so newly added services appear without a page reload. */
  private async loadManualServices(): Promise<void> {
    this.manualServicesError = false;
    try {
      const res = await firstValueFrom(this.chat.listChatServices());
      this.manualServices = (res.resource ?? []).filter(s => s.isActive);
      if (
        this.manualServiceId != null &&
        !this.manualServices.some(s => s.id === this.manualServiceId)
      ) {
        // The previously picked fallback vanished (deleted/deactivated).
        this.manualServiceId = null;
      }
    } catch {
      // Keep whatever list we had; the flag stops the template from
      // asserting "none configured" over a mere fetch failure.
      this.manualServicesError = true;
    }
  }

  /** Meter delta with a lag guard: the usage logger writes synchronously so
   *  attempt 1 normally lands; retry twice at 1.5s if the delta is still 0. */
  private async meterDelta(
    filter: { app_id?: number; service_id?: number },
    pre: { total_cost_usd: number | string } | null
  ): Promise<number> {
    for (let attempt = 1; ; attempt++) {
      const post = await firstValueFrom(this.usage.loadWindow('1h', filter));
      const delta = usageCostDelta(pre, post);
      if (delta > 0 || attempt >= 3) {
        return delta;
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
}
