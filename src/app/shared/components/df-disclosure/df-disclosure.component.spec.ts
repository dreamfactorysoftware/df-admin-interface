import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfDisclosureComponent } from './df-disclosure.component';

@Component({
  standalone: true,
  imports: [DfDisclosureComponent],
  template: `
    <df-disclosure
      eyebrow="Access"
      title="Who can reach this service"
      [summary]="summary"
      (openChange)="opened = $event">
      <p class="body">heavy content</p>
    </df-disclosure>
  `,
})
class HostComponent {
  summary: string | null = '12 of 313 roles';
  opened: boolean | null = null;
}

describe('DfDisclosureComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('starts closed and does not render its body', () => {
    expect(el.querySelector('.body')).toBeNull();
    expect(
      el.querySelector('.disclosure__header')?.getAttribute('aria-expanded')
    ).toBe('false');
  });

  it('shows the summary while closed', () => {
    expect(el.querySelector('.disclosure__summary')?.textContent?.trim()).toBe(
      '12 of 313 roles'
    );
  });

  it('opens on click, renders the body and reports the change', () => {
    (el.querySelector('.disclosure__header') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.body')).not.toBeNull();
    expect(
      el.querySelector('.disclosure__header')?.getAttribute('aria-expanded')
    ).toBe('true');
    expect(fixture.componentInstance.opened).toBe(true);
  });
});
