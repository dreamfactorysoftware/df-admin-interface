import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DfApiDocsComponent } from './df-api-docs/df-api-docs.component';
import { DfApiDocsRoutingModule } from './df-api-docs-routing.module';
import { SafePipe } from '../shared/utilities/safe-url-pipe';

@NgModule({
  declarations: [DfApiDocsComponent, SafePipe],
  imports: [CommonModule, DfApiDocsRoutingModule],
})
export class DfApiDocsModule {}
