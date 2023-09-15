import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfScriptsGithubDialogComponent } from './df-scripts-github-dialog.component';

describe('DfScriptsGithubDialogComponent', () => {
  let component: DfScriptsGithubDialogComponent;
  let fixture: ComponentFixture<DfScriptsGithubDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfScriptsGithubDialogComponent]
    });
    fixture = TestBed.createComponent(DfScriptsGithubDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
