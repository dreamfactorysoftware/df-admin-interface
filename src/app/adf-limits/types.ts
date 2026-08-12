export type LimitTableRowData = {
  id: number;
  name: string;
  limitType: string;
  limitRate: string;
  limitCounter: string;
  // Display strings, not ids: the table resolves each relation to its name and
  // falls back to '-' when the limit is not scoped to one.
  user: string;
  service: string;
  role: string;
  active: boolean;
};
