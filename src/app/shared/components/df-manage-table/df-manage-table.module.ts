import { NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  imports: [
    MatTableModule,
    FontAwesomeModule,
    TranslateModule,
    MatFormFieldModule,
    MatMenuModule,
    MatPaginatorModule,
  ],
  exports: [
    MatTableModule,
    FontAwesomeModule,
    TranslateModule,
    MatFormFieldModule,
    MatMenuModule,
    MatPaginatorModule,
    MatButtonModule,
  ],
})
export class DfManageTableModule {}
