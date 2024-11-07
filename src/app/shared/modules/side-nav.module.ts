import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DfSideNavComponent } from '../components/df-side-nav/df-side-nav.component';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [CommonModule, RouterModule, DfSideNavComponent],
  exports: [DfSideNavComponent, RouterModule],
})
export class SideNavModule {}
