import {
  AfterContentInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import SwaggerUI from 'swagger-ui';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoModule } from '@ngneat/transloco';
import { ROUTES } from 'src/app/shared/constants/routes';
import { saveRawAsFile } from 'src/app/shared/utilities/file';

@Component({
  selector: 'df-api-docs',
  templateUrl: './df-api-docs.component.html',
  styleUrls: ['./df-api-docs.component.scss'],
  standalone: true,
  imports: [MatButtonModule, TranslocoModule],
})
export class DfApiDocsComponent implements OnInit, AfterContentInit, OnDestroy {
  @ViewChild('apiDocumentation', { static: true }) apiDocElement:
    | ElementRef
    | undefined;

  apiDocJson: object;
  destroyed$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.apiDocJson = data['data'];
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngAfterContentInit(): void {
    const apiDocumentation = this.apiDocJson;
    SwaggerUI({
      spec: apiDocumentation,
      domNode: this.apiDocElement?.nativeElement,
    });
  }

  goBackToList(): void {
    this.router.navigate([`${ROUTES.API_CONNECTIONS}/${ROUTES.API_DOCS}`]);
  }

  downloadApiDoc() {
    saveRawAsFile(JSON.stringify(this.apiDocJson), 'api-spec.json', 'json');
  }
}
