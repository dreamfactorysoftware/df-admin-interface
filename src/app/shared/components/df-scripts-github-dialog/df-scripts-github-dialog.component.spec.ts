import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfScriptsGithubDialogComponent } from './df-scripts-github-dialog.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('DfScriptsGithubDialogComponent', () => {
  let component: DfScriptsGithubDialogComponent;
  let fixture: ComponentFixture<DfScriptsGithubDialogComponent>;
  let mockDialog: MatDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfScriptsGithubDialogComponent,
        HttpClientTestingModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        {
          provide: MatDialogRef,
          useValue: {},
        },
      ],
    });
    fixture = TestBed.createComponent(DfScriptsGithubDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
