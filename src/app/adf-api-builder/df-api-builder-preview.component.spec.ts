import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfApiBuilderPreviewComponent } from './df-api-builder-preview.component';

describe('DfApiBuilderPreviewComponent', () => {
  let fixture: ComponentFixture<DfApiBuilderPreviewComponent>;
  let component: DfApiBuilderPreviewComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfApiBuilderPreviewComponent, NoopAnimationsModule],
    });
    fixture = TestBed.createComponent(DfApiBuilderPreviewComponent);
    component = fixture.componentInstance;
  });

  it('summarizes the public response contract', () => {
    component.routeLabel = 'GET /people';
    component.sourceSummary = 'Returns records from people_db.people.';
    component.fieldNames = ['id', 'full_name'];
    component.relationshipNames = ['skills'];
    component.canPreview = true;
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('GET /people');
    expect(text).toContain('full_name');
    expect(text).toContain('skills');
    expect(text).toContain('Related datasets');
  });

  it('emits a preview request from the primary preview action', () => {
    const requested = jest.fn();
    component.canPreview = true;
    component.previewRequested.subscribe(requested);
    fixture.detectChanges();

    fixture.debugElement
      .query(By.css('.preview-heading button'))
      .nativeElement.click();

    expect(requested).toHaveBeenCalledTimes(1);
  });
});
