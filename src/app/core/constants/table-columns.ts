import { UserRow } from 'src/app/shared/types/user';

export const USER_COLUMNS = [
  {
    columnDef: 'active',
    cell: (row: UserRow) => row.active,
    header: 'active',
  },
  {
    columnDef: 'id',
    cell: (row: UserRow) => row.id,
    header: 'id',
  },
  {
    columnDef: 'email',
    cell: (row: UserRow) => row.email,
    header: 'email',
  },
  {
    columnDef: 'displayName',
    cell: (row: UserRow) => row.displayName,
    header: 'name',
  },
  {
    columnDef: 'firstName',
    cell: (row: UserRow) => row.firstName,
    header: 'firstName',
  },
  {
    columnDef: 'lastName',
    cell: (row: UserRow) => row.lastName,
    header: 'lastName',
  },
  {
    columnDef: 'registration',
    cell: (row: UserRow) => row.registration,
    header: 'registration',
  },
  {
    columnDef: 'actions',
  },
];
