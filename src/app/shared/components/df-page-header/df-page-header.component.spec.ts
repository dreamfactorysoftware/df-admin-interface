import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DfPageHeaderComponent } from './df-page-header.component';

@Component({
  standalone: true,
  imports: [DfPageHeaderComponent],
  template: `
    <df-page-header eyebrow="Gateway" title="Roles" description="Scoped access">
      <button pageHeaderActions data-testid="host-action">Add role</button>
    </df-page-header>
  `,
})
class HostComponent {}

describe('DfPageHeaderComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders eyebrow, H1 title and description from inputs', () => {
    const eyebrow = fixture.debugElement.query(By.css('.page-header__eyebrow'));
    const title = fixture.debugElement.query(By.css('h1.page-header__title'));
    const desc = fixture.debugElement.query(
      By.css('.page-header__description')
    );

    expect(eyebrow.nativeElement.textContent.trim()).toBe('Gateway');
    expect(title.nativeElement.textContent.trim()).toBe('Roles');
    expect(desc.nativeElement.textContent.trim()).toBe('Scoped access');
  });

  it('projects page actions into the right-aligned actions slot', () => {
    const action = fixture.debugElement.query(
      By.css('.page-header__actions [data-testid="host-action"]')
    );

    expect(action).toBeTruthy();
  });
});
