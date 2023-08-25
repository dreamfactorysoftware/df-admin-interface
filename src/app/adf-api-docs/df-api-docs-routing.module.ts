import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DfApiDocsComponent } from './df-api-docs/df-api-docs.component';

const routes = [
  {
    path: '',
    component: DfApiDocsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DfApiDocsRoutingModule {}
