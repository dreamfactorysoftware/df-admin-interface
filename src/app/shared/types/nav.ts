import { ROUTES } from './routes';

export interface Nav {
  path: string;
  route: ROUTES;
  icon?: string;
  subRoutes?: Nav[];
  serviceGroups?: Array<string>;
}
