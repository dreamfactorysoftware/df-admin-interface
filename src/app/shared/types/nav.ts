import { ROUTES } from './routes';

export interface Nav {
  path: string;
  subRoutes?: Nav[];
  route: ROUTES;
  serviceGroups?: Array<string>;
}
