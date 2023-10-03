export type LimitTableRowData = {
  id: number;
  name: string;
  limitType: string;
  limitRate: string;
  limitCounter: string;
  user: number | null;
  service: number | null;
  role: number | null;
  active: boolean;
};
