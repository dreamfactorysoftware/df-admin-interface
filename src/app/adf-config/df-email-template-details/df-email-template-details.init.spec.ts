import { Injectable } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import {
  Translation,
  TranslocoLoader,
  provideTransloco,
} from '@ngneat/transloco';
import { of } from 'rxjs';
import { DfEmailTemplateDetailsComponent } from './df-email-template-details.component';
import { EMAIL_TEMPLATES_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';

@Injectable()
class EmptyLoader implements TranslocoLoader {
  getTranslation() {
    return of({} as Translation);
  }
}

/**
 * Regression: /system-settings/config/email-templates/create threw
 * "Cannot read properties of undefined (reading 'name')" on every load.
 * The create route has no resolver, so the route data carries no template,
 * and ngOnInit read `editApp.name` before its own `if (this.editApp)` guard.
 */
describe('DfEmailTemplateDetailsComponent ngOnInit', () => {
  let fixture: ComponentFixture<DfEmailTemplateDetailsComponent>;
  let setLastEle: jest.SpyInstance;

  function setup(routeData: Record<string, unknown>) {
    TestBed.configureTestingModule({
      imports: [
        DfEmailTemplateDetailsComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatSnackBarModule,
      ],
      providers: [
        provideTransloco({
          config: {
            defaultLang: 'en',
            availableLangs: ['en'],
            missingHandler: { logMissingKey: false },
          },
          loader: EmptyLoader,
        }),
        { provide: ActivatedRoute, useValue: { data: of(routeData) } },
        {
          provide: EMAIL_TEMPLATES_SERVICE_TOKEN,
          useValue: { create: jest.fn(), update: jest.fn() },
        },
      ],
    });
    setLastEle = jest.spyOn(
      TestBed.inject(DfSnackbarService),
      'setSnackbarLastEle'
    );
    fixture = TestBed.createComponent(DfEmailTemplateDetailsComponent);
  }

  it('create route (no resolved template) initialises without throwing', () => {
    // Exactly what the router hands the create route: static data only.
    setup({ type: 'create' });

    expect(() => fixture.detectChanges()).not.toThrow();

    const form = fixture.componentInstance.emailTemplateForm;
    expect(form.value.name).toBe('');
    expect(form.value.id).toBeNull();
    expect(setLastEle).not.toHaveBeenCalled();
  });

  it('edit route still publishes the template name and fills the form', () => {
    setup({
      type: 'edit',
      data: {
        id: 7,
        name: 'User Invite Default',
        description: 'Invite mail',
        subject: 'You are invited',
        bodyHtml: '<p>hello</p>',
        fromName: 'DF',
        fromEmail: 'no-reply@example.com',
      },
    });

    fixture.detectChanges();

    expect(setLastEle).toHaveBeenCalledTimes(1);
    expect(setLastEle).toHaveBeenCalledWith('User Invite Default', true);
    expect(fixture.componentInstance.emailTemplateForm.value).toMatchObject({
      id: 7,
      name: 'User Invite Default',
      description: 'Invite mail',
      subject: 'You are invited',
      body: '<p>hello</p>',
      senderName: 'DF',
      senderEmail: 'no-reply@example.com',
    });
  });
});
