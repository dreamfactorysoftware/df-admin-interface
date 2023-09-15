import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subject, catchError, takeUntil, throwError } from 'rxjs';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { TranslocoPipe } from '@ngneat/transloco';
import { isValidHttpUrl } from '../helpers/url-validation';
import { GITHUB_REPO_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { KeyValuePair } from 'src/app/shared/types/generic-http.type';

@Component({
  selector: 'df-scripts-github-dialog',
  templateUrl: './df-scripts-github-dialog.component.html',
  styleUrls: ['./df-scripts-github-dialog.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    NgIf,
    NgFor,
    AsyncPipe,
    TranslocoPipe,
  ],
})
export class DfScriptsGithubDialogComponent implements OnInit, OnDestroy {
  isGitRepoPrivate = false;
  formGroup: FormGroup;
  destroyed$ = new Subject<void>();
  repoOwner: string;
  repoName: string;
  fileName: string;

  constructor(
    @Inject(GITHUB_REPO_SERVICE_TOKEN) private githubService: DfBaseCrudService,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<DfScriptsGithubDialogComponent>
  ) {
    this.formGroup = formBuilder.group({
      url: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.formGroup.controls['url'].valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe((url: string) => {
        if (isValidHttpUrl(url)) {
          console.log('value: ', url);

          if (
            (url.indexOf('.js') > 0 ||
              url.indexOf('.py') > 0 ||
              url.indexOf('.php') > 0 ||
              url.indexOf('.txt') > 0) &&
            url.includes('github')
          ) {
            const urlParams = url.substring(url.indexOf('.com/') + 5);
            const urlArray = urlParams.split('/');

            console.log('url array: ', urlArray);

            this.repoOwner = urlArray[0];
            this.repoName = urlArray[1];
            this.fileName = urlArray[4];
            const githubApiEndpoint = `${this.repoOwner}/${this.repoName}`;

            this.githubService
              .get(githubApiEndpoint)
              .pipe(
                takeUntil(this.destroyed$),
                catchError(err => {
                  console.error(err);
                  // repo can't be found therefore it is private hence enabling the username and password fields
                  this.isGitRepoPrivate = true;
                  this.formGroup.addControl(
                    'username',
                    this.formBuilder.control('', Validators.required)
                  );
                  this.formGroup.addControl(
                    'password',
                    this.formBuilder.control('', Validators.required)
                  );
                  return throwError(() => new Error(err));
                })
              )
              .subscribe(data => {
                console.log('github api response: ', data);
              });
          } else {
            // display error message stating that file needs to have certain extension
          }
        }
      });
  }

  onUpload() {
    const githubApiEndpoint = `${this.repoOwner}/${this.repoName}/contents/${this.fileName}`;

    const authData = window.btoa(
      this.formGroup.value.username + ':' + this.formGroup.value.password
    );

    const headers: KeyValuePair[] = this.isGitRepoPrivate
      ? [
          {
            key: 'Authorization',
            value: `Basic ${authData}`,
          },
        ]
      : [];

    this.githubService
      .get(githubApiEndpoint, {
        additionalParams: [{ key: 'ref', value: 'main' }],
        additionalHeaders: [...headers],
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dialogRef.close({ data: data });
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
