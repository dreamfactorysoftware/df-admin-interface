import { NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { DfAlertComponent } from '../df-alert/df-alert.component';
import { MatInputModule } from '@angular/material/input';

const shared = [DfAlertComponent];

@NgModule({
  imports: shared,
  exports: [
    ...shared,
    MatTableModule,
    MatInputModule,
    FontAwesomeModule,
    TranslateModule,
    MatFormFieldModule,
    MatMenuModule,
    MatPaginatorModule,
    MatButtonModule,
    DfAlertComponent,
  ],
})
export class AdfManageTableModule {}
