import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfApiDocsComponent } from './df-api-docs.component';
import { createTestBedConfig } from 'src/app/shared/utilities/testbed-config';
import { mockApiDocsData } from './test-utilities/df-api-docs.mock';
import { Router } from '@angular/router';
import { ROUTES } from 'src/app/shared/constants/routes';

describe('DfApiDocsComponent', () => {
  let component: DfApiDocsComponent;
  let fixture: ComponentFixture<DfApiDocsComponent>;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(DfApiDocsComponent, [], {
        data: {
          ...mockApiDocsData,
        },
      })
    );

    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(DfApiDocsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate away to api docs table successfully when the back button is clicked', () => {
    const navigateSpy = jest.spyOn(router, 'navigate');

    component.goBackToList();

    expect(navigateSpy).toHaveBeenCalledWith([
      `${ROUTES.API_CONNECTIONS}/${ROUTES.API_DOCS}`,
    ]);
  });

  it('should download the api doc when the download button is clicked', () => {
    global.URL.createObjectURL = jest.fn(blob => 'urltest');
    global.URL.revokeObjectURL = jest.fn(url => 'urltest');

    // Mock HTMLAnchorElement here as a spy object
    const spyObj = {
      click: jest.fn(),
    };

    const createAnchorElementSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementation(() => {
        return spyObj as any;
      });

    component.downloadApiDoc();

    expect(createAnchorElementSpy).toHaveBeenCalledWith('a');
    expect(spyObj.click).toHaveBeenCalled();
  });
});
