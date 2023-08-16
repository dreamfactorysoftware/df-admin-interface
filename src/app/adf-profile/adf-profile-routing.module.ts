import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DfProfileComponent } from './df-profile/df-profile.component';
import { profileResolver } from './resolvers/profile.resolver';
import { DfProfileService } from './services/df-profile.service';

const routes: Routes = [
  {
    path: '',
    component: DfProfileComponent,
    resolve: { profile: profileResolver },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  providers: [DfProfileService],
  exports: [RouterModule],
})
export class AdfProfileRoutingModule {}
