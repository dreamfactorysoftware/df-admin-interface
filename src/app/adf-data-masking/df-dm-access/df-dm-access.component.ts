import {
  ChangeDetectorRef,
  Component,
  DoCheck,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import {
  MatButtonToggleGroup,
  MatButtonToggleModule,
} from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DataMaskingStore } from '../data-masking.store';
import { baselineDef } from '../data-masking.catalog';
import {
  DfDmConfirmDialogComponent,
  DmConfirmData,
} from '../df-data-masking/df-dm-confirm-dialog.component';
import {
  AccessPatch,
  AccessSettings,
  AdminAccessMode,
  AdminRow,
  GrantDuration,
  RoleAccess,
} from '../data-masking.types';
import { shortWhen } from '../dm-time';

export const DURATIONS: GrantDuration[] = ['1h', '8h', '24h', '7d', 'forever'];
/**
 * Grants still in force. The page can outlive a grant; PATCH sends the
 * complete list, and a grant sent again after it expired would come back
 * as a fresh one, so expired grants are never shown or sent.
 */
export function liveGrants(
  a: AccessSettings
): AccessSettings['admins']['grants'] {
  const now = Date.now();
  return a.admins.grants.filter(
    g => g.expiresAt === null || Date.parse(g.expiresAt) > now
  );
}

/** Who sees real values, narrowest first (the server's loosening order). */
const ADMIN_RANK: Record<AdminAccessMode, number> = {
  none: 0,
  selected: 1,
  all: 2,
};

const DURATION_MS: Record<Exclude<GrantDuration, 'forever'>, number> = {
  '1h': 3_600_000,
  '8h': 8 * 3_600_000,
  '24h': 24 * 3_600_000,
  '7d': 7 * 86_400_000,
};

/** The smallest preset that still covers what is left on a grant. */
export function durationFor(expiresAt: string | null): GrantDuration {
  if (!expiresAt) return 'forever';
  const left = Date.parse(expiresAt) - Date.now();
  return (
    (Object.keys(DURATION_MS) as (keyof typeof DURATION_MS)[]).find(
      d => left <= DURATION_MS[d] + 60_000
    ) ?? '7d'
  );
}

/**
 * Access tab: who sees real values. Admins (none / selected / all, each
 * grant timed), AI and MCP sessions, and roles. Each change saves on its
 * own. Without grant rights everything is read-only, except removing your
 * own grant: narrowing is always allowed.
 */
@Component({
  selector: 'df-dm-access',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    TranslocoPipe,
    DfSkeletonComponent,
    DfEmptyStateComponent,
  ],
  templateUrl: './df-dm-access.component.html',
  styleUrls: ['./df-dm-access.component.scss'],
})
export class DfDmAccessComponent implements OnInit, DoCheck, OnDestroy {
  readonly store = inject(DataMaskingStore);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  readonly durations = DURATIONS;
  /** Durations picked this session, so the select shows what was chosen. */
  private picked = new Map<number, GrantDuration>();
  private expiryTimer?: ReturnType<typeof setTimeout>;
  private timedFor: AccessSettings | null = null;

  @ViewChild('adminGroup') adminGroup?: MatButtonToggleGroup;
  @ViewChild('aiGroup') aiGroup?: MatButtonToggleGroup;

  ngOnInit(): void {
    // Re-read on every visit: access may have changed elsewhere (CLI,
    // another admin, a grant that ended) since the page last read it.
    this.store.loadAccess(!!this.store.access);
    if (!this.store.trackedBaselines) this.store.loadTrackedBaselines();
  }

  ngDoCheck(): void {
    if (this.store.access !== this.timedFor) {
      this.timedFor = this.store.access;
      this.scheduleExpiry();
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.expiryTimer);
  }

  /**
   * When the next grant ends, re-read access (and the overview), so an
   * ended grant leaves the screen without a reload.
   */
  private scheduleExpiry(): void {
    clearTimeout(this.expiryTimer);
    const a = this.store.access;
    if (!a) return;
    const now = Date.now();
    const next = liveGrants(a)
      .map(g => (g.expiresAt ? Date.parse(g.expiresAt) : NaN))
      .filter(t => !isNaN(t))
      .sort((x, y) => x - y)[0];
    if (next === undefined) return;
    // setTimeout holds at most ~24.8 days; a longer wait re-arms itself.
    const wait = Math.min(Math.max(next - now + 1000, 0), 2 ** 31 - 1);
    this.expiryTimer = setTimeout(() => {
      this.store.loadAccess(true);
      this.timedFor = null;
      this.cdr.markForCheck();
    }, wait);
  }

  /**
   * The strictest grant limit among tracked Compliance baselines, as
   * { name, hours }, or null when no tracked baseline sets one.
   */
  get grantCap(): { name: string; hours: number } | null {
    let cap: { name: string; hours: number } | null = null;
    for (const id of this.store.trackedBaselines ?? []) {
      const b = baselineDef(id);
      if (b && (!cap || b.grantMaxHours < cap.hours)) {
        cap = { name: b.name, hours: b.grantMaxHours };
      }
    }
    return cap;
  }

  /** The tracked baseline a duration would break, or null. */
  exceeds(d: GrantDuration): string | null {
    const cap = this.grantCap;
    if (!cap) return null;
    const ms = d === 'forever' ? Infinity : DURATION_MS[d];
    return ms > cap.hours * 3_600_000 ? cap.name : null;
  }

  /**
   * The duration list matches its select's width, unless an option carries
   * an "Exceeds …" marker: then it grows to fit the longest option, so no
   * option text wraps.
   */
  get durationPanelWidth(): 'auto' | null {
    return this.durations.some(d => this.exceeds(d)) ? null : 'auto';
  }

  get access(): AccessSettings | null {
    return this.store.access;
  }

  /**
   * The super admin may loosen access. Any admin may tighten it (the
   * server's rule): fewer admins, a grant removed or shortened, AI masked,
   * a role disabled or narrowed. Only the loosening choices lock.
   */
  get canGrant(): boolean {
    return !!this.store.overview?.you.canGrant;
  }

  isGranted(a: AdminRow): boolean {
    return !!this.grantOf(a);
  }

  private grantOf(a: AdminRow) {
    return this.access
      ? liveGrants(this.access).find(g => g.adminId === a.adminId)
      : undefined;
  }

  /** Granting needs the super admin; any grant can be taken away. */
  checkboxDisabled(a: AdminRow): boolean {
    return !this.canGrant && !this.isGranted(a);
  }

  /** A wider admin mode than the current one needs the super admin. */
  modeLocked(mode: AdminAccessMode): boolean {
    const current = this.access?.admins.mode ?? 'none';
    return !this.canGrant && ADMIN_RANK[mode] > ADMIN_RANK[current];
  }

  /** A duration that would end later than the grant does now. */
  durationLocked(a: AdminRow, d: GrantDuration): boolean {
    if (this.canGrant) return false;
    const g = this.grantOf(a);
    if (!g) return true;
    if (d === 'forever') return g.expiresAt !== null;
    if (g.expiresAt === null) return false;
    return Date.now() + DURATION_MS[d] > Date.parse(g.expiresAt);
  }

  /** AI = same as admins needs the super admin; back to masked never does. */
  aiLocked(ai: AccessSettings['ai']): boolean {
    return !this.canGrant && ai === 'same_as_admins' && this.access?.ai !== ai;
  }

  /** Enabling a role needs the super admin; disabling one never does. */
  roleLocked(r: RoleAccess): boolean {
    return !this.canGrant && !r.enabled;
  }

  /** Widening a role to every class needs the super admin. */
  scopeLocked(r: RoleAccess, scope: RoleAccess['scope']): boolean {
    return !this.canGrant && scope === 'all' && r.scope !== 'all';
  }

  durationOf(a: AdminRow): GrantDuration {
    const g = this.grantOf(a);
    return this.picked.get(a.adminId) ?? durationFor(g?.expiresAt ?? null);
  }

  untilOf(a: AdminRow): string {
    const g = this.grantOf(a);
    return g?.expiresAt ? shortWhen(g.expiresAt) : '';
  }

  setAdminMode(mode: AdminAccessMode): void {
    const a = this.access;
    if (!a || a.admins.mode === mode) return;
    const go = () =>
      this.save({ admins: { mode } }, { ...a, admins: { ...a.admins, mode } });
    if (mode !== 'all') {
      go();
      return;
    }
    // Every admin at once is the widest grant there is: say what it means.
    this.confirm(
      {
        title: this.store.t('access.confirmAll.title'),
        message: this.store.t('access.confirmAll.message', {
          columns: this.store.plural('columns', this.store.maskedTotal),
        }),
        confirm: this.store.t('access.confirmAll.confirm'),
        cancel: this.store.t('cancel'),
        danger: true,
      },
      go
    );
  }

  toggleAdmin(admin: AdminRow, on: boolean): void {
    const a = this.access;
    if (!a) return;
    const keep = liveGrants(a).filter(g => g.adminId !== admin.adminId);
    const grants = on
      ? [
          ...keep,
          {
            adminId: admin.adminId,
            name: admin.name,
            email: admin.email,
            expiresAt: new Date(Date.now() + DURATION_MS['8h']).toISOString(),
          },
        ]
      : keep;
    const undo = this.rememberPick(admin.adminId);
    if (on) this.picked.set(admin.adminId, '8h');
    else this.picked.delete(admin.adminId);
    this.save(
      {
        admins: {
          grants: grants.map(g => ({
            adminId: g.adminId,
            ...(g.adminId === admin.adminId && on
              ? { duration: '8h' as GrantDuration }
              : {}),
          })),
        },
      },
      { ...a, admins: { ...a.admins, grants } },
      undo
    );
  }

  setDuration(admin: AdminRow, duration: GrantDuration): void {
    const a = this.access;
    if (!a) return;
    const undo = this.rememberPick(admin.adminId);
    this.picked.set(admin.adminId, duration);
    const expiresAt =
      duration === 'forever'
        ? null
        : new Date(Date.now() + DURATION_MS[duration]).toISOString();
    const grants = [
      ...liveGrants(a).filter(g => g.adminId !== admin.adminId),
      ...a.admins.grants
        .filter(g => g.adminId === admin.adminId)
        .map(g => ({ ...g, expiresAt })),
    ];
    this.save(
      {
        admins: {
          grants: grants.map(g => ({
            adminId: g.adminId,
            ...(g.adminId === admin.adminId ? { duration } : {}),
          })),
        },
      },
      { ...a, admins: { ...a.admins, grants } },
      undo
    );
  }

  setAi(ai: AccessSettings['ai']): void {
    const a = this.access;
    if (!a || a.ai === ai) return;
    const go = () => this.save({ ai }, { ...a, ai });
    if (ai === 'masked') {
      go();
      return;
    }
    this.confirm(
      {
        title: this.store.t('access.confirmAi.title'),
        message: this.store.t('access.confirmAi.message'),
        confirm: this.store.t('access.confirmAi.confirm'),
        cancel: this.store.t('cancel'),
        danger: true,
      },
      go
    );
  }

  /** Sends only the role that changed; the others stay as the server has them. */
  setRole(role: RoleAccess, patch: Partial<RoleAccess>): void {
    const a = this.access;
    if (!a) return;
    const changed = { ...role, ...patch };
    const roles = a.roles.map(r => (r.roleId === role.roleId ? changed : r));
    this.save(
      {
        roles: [
          {
            roleId: changed.roleId,
            enabled: changed.enabled,
            scope: changed.scope,
          },
        ],
      },
      { ...a, roles }
    );
  }

  /**
   * Loosening confirms first. A cancel puts the toggles back: a group has
   * already moved to the clicked value on its own.
   */
  private confirm(data: DmConfirmData, go: () => void): void {
    this.dialog
      .open(DfDmConfirmDialogComponent, { data, autoFocus: 'dialog' })
      .afterClosed()
      .subscribe(ok => {
        if (ok) {
          go();
        } else {
          const a = this.store.access;
          if (a && this.adminGroup) this.adminGroup.value = a.admins.mode;
          if (a && this.aiGroup) this.aiGroup.value = a.ai;
        }
        this.cdr.markForCheck();
      });
  }

  /** Restores this admin's picked duration if the save fails. */
  private rememberPick(adminId: number): () => void {
    const had = this.picked.has(adminId);
    const prev = this.picked.get(adminId);
    return () => {
      if (had && prev) this.picked.set(adminId, prev);
      else this.picked.delete(adminId);
    };
  }

  private save(
    patch: AccessPatch,
    optimistic: AccessSettings,
    onError?: () => void
  ): void {
    this.store.updateAccess(patch, optimistic, onError);
  }

  trackAdmin = (_: number, a: AdminRow) => a.adminId;
  trackRole = (_: number, r: RoleAccess) => r.roleId;
}
