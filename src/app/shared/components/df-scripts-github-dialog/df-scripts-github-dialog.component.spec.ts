import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfScriptsGithubDialogComponent } from './df-scripts-github-dialog.component';
import { createTestBedConfig } from '../../utilities/test';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { GITHUB_REPO_SERVICE_TOKEN } from '../../constants/tokens';

const mockGithubService = {
  get: jest.fn().mockReturnValue(
    of({
      private: false,
    })
  ),
};

describe('DfScriptsGithubDialogComponent', () => {
  let component: DfScriptsGithubDialogComponent;
  let fixture: ComponentFixture<DfScriptsGithubDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(
        DfScriptsGithubDialogComponent,
        [
          { provide: MatDialogRef, useValue: {} },
          { provide: GITHUB_REPO_SERVICE_TOKEN, useValue: mockGithubService },
        ],
        {}
      )
    );
    fixture = TestBed.createComponent(DfScriptsGithubDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('username and password fields should be invisible by default', () => {
    expect(component.isGitRepoPrivate).toBeFalsy();
    expect(component.formGroup.contains('username')).toBeFalsy();
    expect(component.formGroup.contains('password')).toBeFalsy();
  });

  it('username and password fields should be invisible given the repo url is public', () => {
    mockGithubService.get.mockReturnValue(of({ private: false }));

    component.formGroup.patchValue({
      url: 'https://github.com/repo-owner/dummy-repo/blob/main/dummy.js',
    });

    fixture.detectChanges();

    expect(component.isGitRepoPrivate).toBeFalsy();
    expect(mockGithubService.get).toHaveBeenCalled();
    expect(component.formGroup.contains('username')).toBeFalsy();
    expect(component.formGroup.contains('password')).toBeFalsy();
  });

  it('username and password fields should be visible given the repo url is private', () => {
    const error = {
      status: 404,
      message: 'Github repo not found',
    };

    mockGithubService.get.mockReturnValue(throwError(() => error));

    component.formGroup.patchValue({
      url: 'https://github.com/repo-owner/dummy-repo/blob/main/dummy.py',
    });

    fixture.detectChanges();

    expect(component.isGitRepoPrivate).toBeTruthy();
    expect(mockGithubService.get).toHaveBeenCalled();
    expect(component.formGroup.contains('username')).toBeTruthy();
    expect(component.formGroup.contains('password')).toBeTruthy();
  });

  it('should not fetch the script from github when the url is invalid', () => {
    component.formGroup.patchValue({
      url: 'https://someurl.com/repo-owner/dummy-repo/blob/',
    });

    fixture.detectChanges();

    expect(mockGithubService.get).not.toHaveBeenCalled();
    expect(component.formGroup.contains('username')).toBeFalsy();
    expect(component.formGroup.contains('password')).toBeFalsy();
  });
});
