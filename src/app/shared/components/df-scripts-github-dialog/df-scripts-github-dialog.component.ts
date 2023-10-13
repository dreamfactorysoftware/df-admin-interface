import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { catchError, throwError } from 'rxjs';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { TranslocoPipe } from '@ngneat/transloco';
import { GITHUB_REPO_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { KeyValuePair } from 'src/app/shared/types/generic-http';
import { UntilDestroy } from '@ngneat/until-destroy';
import { isValidHttpUrl } from '../../utilities/url';
@UntilDestroy({ checkProperties: true })
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
export class DfScriptsGithubDialogComponent implements OnInit {
  isGitRepoPrivate = false;
  formGroup: FormGroup;
  repoOwner: string;
  repoName: string;
  fileName: string;

  constructor(
    @Inject(GITHUB_REPO_SERVICE_TOKEN) private githubService: DfBaseCrudService,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<DfScriptsGithubDialogComponent>
  ) {
    this.formGroup = formBuilder.group({
      url: ['', [Validators.required, this.urlValidator]],
    });
  }

  ngOnInit(): void {
    this.formGroup.controls['url'].valueChanges.subscribe((url: string) => {
      if (isValidHttpUrl(url)) {
        if (
          (url.indexOf('.js') > 0 ||
            url.indexOf('.py') > 0 ||
            url.indexOf('.php') > 0 ||
            url.indexOf('.txt') > 0) &&
          url.includes('github')
        ) {
          const urlParams = url.substring(url.indexOf('.com/') + 5);
          const urlArray = urlParams.split('/');

          this.repoOwner = urlArray[0];
          this.repoName = urlArray[1];
          this.fileName = urlArray[4];
          const githubApiEndpoint = `${this.repoOwner}/${this.repoName}`;
          this.githubService
            .get(githubApiEndpoint, {
              snackbarError: 'server',
              snackbarSuccess: 'getScriptSuccessMsg',
            })
            .pipe(
              catchError(err => {
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
            .subscribe((data: any) => {
              this.isGitRepoPrivate = data['private'];
            });
        } else {
          // display error message stating that file needs to have certain extension
        }
      }
    });
  }

  urlValidator(control: FormControl) {
    const url = control.value;
    if (
      (url.indexOf('.js') > 0 ||
        url.indexOf('.py') > 0 ||
        url.indexOf('.php') > 0 ||
        url.indexOf('.txt') > 0) &&
      url.includes('github')
    ) {
      return null;
    } else {
      return { invalidUrl: true };
    }
  }

  onFileUrlChange(value: string) {
    console.log('file url changed', value);
  }

  onUpload() {
    if (this.formGroup.invalid) return;

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

      .subscribe(data => {
        this.dialogRef.close({ data: data });
      });
  }
}
