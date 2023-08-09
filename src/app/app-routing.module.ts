import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTES } from './core/constants/routes';

const routes: Routes = [
  {
    path: ROUTES.AUTH,
    loadChildren: () =>
      import('./adf-user-management/adf-user-management.module').then(
        m => m.AdfUserManagementModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
