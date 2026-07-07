import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BASE_URL } from '../shared/constants/urls';
import { DfApiBuilderWorkspaceComponent } from './df-api-builder-workspace.component';

describe('DfApiBuilderWorkspaceComponent', () => {
  let component: DfApiBuilderWorkspaceComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfApiBuilderWorkspaceComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
    });

    component = TestBed.createComponent(
      DfApiBuilderWorkspaceComponent
    ).componentInstance;
    component.apiId = 42;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requires complete junction metadata for many-to-many relationships', () => {
    component.rel = {
      service: 'people_db',
      table: 'people',
      field: 'id',
      type: 'many_many',
      ref_service: 'skills_db',
      ref_table: 'skills',
      ref_field: 'id',
      junction_service: null,
      junction_table: null,
      junction_field: null,
      junction_ref_field: null,
      name: 'skills',
    };

    expect(component.relReady()).toBe(false);

    component.rel.junction_service = 'people_db';
    component.rel.junction_table = 'person_skills';
    component.rel.junction_field = 'person_id';
    component.rel.junction_ref_field = 'skill_id';

    expect(component.relReady()).toBe(true);
  });

  it('sends native junction fields when creating a many-to-many relationship', () => {
    component.relationshipEditorOpen = true;
    component.rel = {
      service: 'people_db',
      table: 'people',
      field: 'id',
      type: 'many_many',
      ref_service: 'skills_db',
      ref_table: 'skills',
      ref_field: 'id',
      junction_service: 'people_db',
      junction_table: 'person_skills',
      junction_field: 'person_id',
      junction_ref_field: 'skill_id',
      name: 'skills',
    };

    component.createRelationship();

    const create = http.expectOne(`${BASE_URL}/api_builder/relationships`);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({
      apiId: 42,
      service: 'people_db',
      table: 'people',
      field: 'id',
      type: 'many_many',
      refService: 'skills_db',
      refTable: 'skills',
      refField: 'id',
      name: 'skills',
      junctionService: 'people_db',
      junctionTable: 'person_skills',
      junctionField: 'person_id',
      junctionRefField: 'skill_id',
    });
    create.flush({ id: 7 });

    http
      .expectOne(`${BASE_URL}/api_builder/relationships?api_id=42`)
      .flush({ resource: [] });
    expect(component.relationshipEditorOpen).toBe(false);
  });
});
