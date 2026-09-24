import { FormControl } from '@angular/forms';
import {
  AccessUsageResult,
  AccessUsageRow,
  NotUsedFilter,
} from '../../types/access-usage';
import { Column } from '../../types/table';
import {
  NOT_USED_FILTER_OPTIONS,
  accessUsageSortValue,
  matchesNotUsedFilter,
} from '../../utilities/access-usage';

/** columnDef shared by every table's "Last used" / "Last active" column. */
export const ACCESS_USAGE_COLUMN = 'lastUsed';

/**
 * Per-table access-usage join: the fetched map, the "Not used in" filter
 * control, and whether the endpoint answered at all. Until `available` flips
 * true, the column and filter stay hidden.
 */
export class AccessUsageTableState {
  available = false;
  staleDays: number | null = null;
  trackingStartedAt: string | null = null;
  readonly filter = new FormControl<NotUsedFilter>('any', {
    nonNullable: true,
  });
  readonly filterOptions = NOT_USED_FILTER_OPTIONS;
  private rows = new Map<number, AccessUsageRow>();

  get filterActive(): boolean {
    return this.available && this.filter.value !== 'any';
  }

  apply(result: AccessUsageResult): void {
    this.available = result.available;
    this.rows = result.rows;
    this.staleDays = result.meta?.staleDays ?? null;
    this.trackingStartedAt = result.meta?.trackingStartedAt ?? null;
  }

  get(id: number | null | undefined): AccessUsageRow | undefined {
    return id == null ? undefined : this.rows.get(id);
  }

  matches(id: number | null | undefined, now = Date.now()): boolean {
    return (
      !this.available ||
      matchesNotUsedFilter(this.get(id), this.filter.value, now)
    );
  }

  sortValue(id: number | null | undefined): number {
    return accessUsageSortValue(this.get(id));
  }
}

/**
 * Return a new columns array with the access-usage column inserted before
 * `before` (default: the trailing actions column). A new reference is needed
 * so the memoized displayedColumns re-diffs.
 */
export function withAccessUsageColumn<T>(
  columns: Array<Column<T>>,
  header: string,
  before = 'actions'
): Array<Column<T>> {
  if (columns.some(c => c.columnDef === ACCESS_USAGE_COLUMN)) {
    return columns;
  }
  const next = [...columns];
  const index = next.findIndex(c => c.columnDef === before);
  next.splice(index === -1 ? next.length : index, 0, {
    columnDef: ACCESS_USAGE_COLUMN,
    header,
  });
  return next;
}
