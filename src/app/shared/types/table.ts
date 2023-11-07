import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface DefaultAction<T> {
  label: string;
  function: (row: T) => void;
  ariaLabel: {
    key: string;
    param?: string;
  };
  disabled?: (row: T) => boolean;
}

export interface Column<T> {
  columnDef: string;
  cell?: (element: T) => unknown;
  header?: string;
}

export interface AdditonalAction<T> extends DefaultAction<T> {
  icon?: IconDefinition;
}

export interface Actions<T> {
  default: DefaultAction<T> | null;
  additional: Array<AdditonalAction<T>> | null;
}
