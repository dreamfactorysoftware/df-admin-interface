import { Component, Inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { DfScriptSamplesComponent } from '../df-script-samples/df-script-samples.component';
import {
  CdkMenuGroup,
  CdkMenu,
  CdkMenuTrigger,
  CdkMenuItem,
  CdkMenuBar,
} from '@angular/cdk/menu';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { SCRIPTS_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { ActivatedRoute } from '@angular/router';
import { Service } from 'src/app/shared/types/service';
import { Subject, takeUntil } from 'rxjs';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { TranslocoPipe } from '@ngneat/transloco';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'df-scripts',
  templateUrl: './df-scripts.component.html',
  styleUrls: ['./df-scripts.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatTabsModule,
    DfScriptSamplesComponent,
    CdkMenuGroup,
    CdkMenu,
    CdkMenuTrigger,
    CdkMenuItem,
    CdkMenuBar,
    NgIf,
    NgFor,
    AsyncPipe,
    TranslocoPipe,
  ],
})
export class DfScriptsComponent {
  destroyed$ = new Subject<void>();
  userServices: Service[];

  constructor(
    @Inject(SCRIPTS_SERVICE_TOKEN) private scriptService: DfBaseCrudService,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ data }) => {
        this.userServices = data['resource'];
        console.log('data: ', this.userServices);
      });
  }
}
