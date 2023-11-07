import { ROUTES } from './routes';

export interface Nav {
  path: string;
  route: ROUTES;
  subRoutes?: Nav[];
  serviceGroups?: Array<string>;
}
