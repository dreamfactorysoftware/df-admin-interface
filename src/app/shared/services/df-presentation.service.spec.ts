import { TestBed } from '@angular/core/testing';
import { DfPresentationService } from './df-presentation.service';

describe('DfPresentationService', () => {
  let service: DfPresentationService;

  beforeEach(() => {
    localStorage.clear();
    document.body.className = '';
    TestBed.configureTestingModule({});
    service = TestBed.inject(DfPresentationService);
  });

  it('defaults to off, so nothing is hidden until asked', () => {
    expect(service.on).toBe(false);
    expect(document.body.classList.contains('presentation-mode')).toBe(false);
  });

  it('toggles, persists, and drives the body class', () => {
    service.toggle();
    expect(service.on).toBe(true);
    expect(localStorage.getItem('isPresentationMode')).toBe('true');
    expect(document.body.classList.contains('presentation-mode')).toBe(true);

    service.toggle();
    expect(service.on).toBe(false);
    expect(localStorage.getItem('isPresentationMode')).toBe('false');
    expect(document.body.classList.contains('presentation-mode')).toBe(false);
  });

  it('emits to subscribers', () => {
    const seen: boolean[] = [];
    service.on$.subscribe(v => seen.push(v));
    service.set(true);
    service.set(false);
    expect(seen).toEqual([false, true, false]);
  });

  it('restores a stored ON state', () => {
    localStorage.setItem('isPresentationMode', 'true');
    service.loadInitial();
    expect(service.on).toBe(true);
    expect(document.body.classList.contains('presentation-mode')).toBe(true);
  });

  it('stays off on a corrupt stored value rather than throwing', () => {
    localStorage.setItem('isPresentationMode', 'not-json');
    expect(() => service.loadInitial()).not.toThrow();
    expect(service.on).toBe(false);
  });
});
