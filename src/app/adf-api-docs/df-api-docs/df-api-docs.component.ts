import {
  AfterContentInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import SwaggerUI from 'swagger-ui';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoModule } from '@ngneat/transloco';
import { ROUTES } from 'src/app/shared/constants/routes';
import { saveRawAsFile } from 'src/app/shared/utilities/file';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import { SESSION_TOKEN_HEADER } from 'src/app/shared/constants/http-headers';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-api-docs',
  templateUrl: './df-api-docs.component.html',
  styleUrls: ['./df-api-docs.component.scss'],
  standalone: true,
  imports: [MatButtonModule, TranslocoModule],
})
export class DfApiDocsComponent implements OnInit, AfterContentInit {
  @ViewChild('apiDocumentation', { static: true }) apiDocElement:
    | ElementRef
    | undefined;

  apiDocJson: object;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userDataService: DfUserDataService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(data => {
      this.apiDocJson = data['data'];
    });
  }

  ngAfterContentInit(): void {
    const apiDocumentation = this.apiDocJson;
    SwaggerUI({
      spec: apiDocumentation,
      domNode: this.apiDocElement?.nativeElement,
      requestInterceptor: (req: SwaggerUI.Request) => {
        req['headers'][SESSION_TOKEN_HEADER] = this.userDataService.token;
        return req;
      },
      showMutatedRequest: true,
    });
  }

  goBackToList(): void {
    this.router.navigate([`${ROUTES.API_CONNECTIONS}/${ROUTES.API_DOCS}`]);
  }

  downloadApiDoc() {
    saveRawAsFile(
      JSON.stringify(this.apiDocJson, undefined, 2),
      'api-spec.json',
      'json'
    );
  }
}
