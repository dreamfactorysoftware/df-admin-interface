import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DFPasswordResetComponent } from './df-password-reset/df-password-reset.component';

const routes: Routes = [{ path: '', component: DFPasswordResetComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfUserManagementRoutingModule {}
