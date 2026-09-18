import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import {
  ADMIN_IDENTITY,
  CellState,
  DB_VERBS,
  FILE_VERBS,
  McpBackend,
  McpConfig,
  McpIdentity,
  McpVerb,
  VERB_GROUPS,
  VerbGroup,
  advertisedVerbs,
  backendVisible,
  cellState,
  toolKey,
} from '../mcp-model';

/**
 * df-mcp-exposure-grid — rows are attachable backends, columns the verbs
 * each backend becomes. The row switch is `exposed_services`; a cell is one
 * `disabled_tools` key. Cell state also reflects the previewed identity
 * (denied / gone) and the server-wide writes switch.
 */
@Component({
  selector: 'df-mcp-exposure-grid',
  standalone: true,
  templateUrl: './df-mcp-exposure-grid.component.html',
  styleUrls: ['./df-mcp-exposure-grid.component.scss'],
  imports: [
    CommonModule,
    TranslocoModule,
    MatSlideToggleModule,
    MatTooltipModule,
    DfSkeletonComponent,
  ],
})
export class DfMcpExposureGridComponent {
  @Input() backends: McpBackend[] = [];
  @Input({ required: true }) cfg!: McpConfig;
  @Input() identity: McpIdentity = ADMIN_IDENTITY;
  @Input() loading = false;

  @Output() toggleExposed = new EventEmitter<string>();
  @Output() toggleCell = new EventEmitter<string>();

  readonly dbVerbs = DB_VERBS;
  readonly fileVerbs = FILE_VERBS;
  readonly groups = VERB_GROUPS;
  readonly states: CellState[] = ['on', 'off', 'writes-off', 'denied', 'gone'];

  get databases(): McpBackend[] {
    return this.backends.filter(b => b.kind === 'database');
  }

  get files(): McpBackend[] {
    return this.backends.filter(b => b.kind === 'file');
  }

  groupSpan(group: VerbGroup): number {
    return DB_VERBS.filter(v => v.group === group).length;
  }

  isExposed(b: McpBackend): boolean {
    return this.cfg.exposedServices.includes(b.name);
  }

  isHidden(b: McpBackend): boolean {
    return this.isExposed(b) && !backendVisible(b, this.identity);
  }

  state(b: McpBackend, verb: McpVerb): CellState {
    return cellState(this.cfg, b, verb, this.identity);
  }

  key(b: McpBackend, verb: McpVerb): string {
    return toolKey(b.name, verb.name);
  }

  interactive(b: McpBackend, verb: McpVerb): boolean {
    const s = this.state(b, verb);
    return s !== 'gone' && s !== 'writes-off';
  }

  /** Components the previewed role is limited to on this backend, if any. */
  limitedTo(b: McpBackend): string[] | null {
    const comps = this.identity.components?.[b.name];
    return this.isExposed(b) && comps?.length ? comps : null;
  }

  toolCount(b: McpBackend): number {
    return advertisedVerbs(this.cfg, b).length;
  }

  onCell(b: McpBackend, verb: McpVerb): void {
    if (!this.interactive(b, verb)) return;
    this.toggleCell.emit(this.key(b, verb));
  }

  trackByName(_: number, o: { name: string }): string {
    return o.name;
  }
}
