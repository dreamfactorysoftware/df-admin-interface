import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  inject,
} from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@ngneat/transloco';

/**
 * Icon button that copies `text`. CDK Clipboard falls back to
 * execCommand, so it also works on plain-http origins where
 * navigator.clipboard is undefined.
 */
@Component({
  selector: 'df-aa-copy',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      mat-icon-button
      type="button"
      class="copy"
      [class.done]="copied"
      [attr.aria-label]="label || ('aauth.copy' | transloco)"
      [matTooltip]="
        copied
          ? ('aauth.copied' | transloco)
          : label || ('aauth.copy' | transloco)
      "
      (click)="copy($event)"
      [attr.data-testid]="testId">
      <mat-icon>{{ copied ? 'check' : 'content_copy' }}</mat-icon>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .copy {
        --mdc-icon-button-state-layer-size: 28px;
        --mdc-icon-button-icon-size: 16px;
        color: inherit;
        height: 28px;
        opacity: 0.75;
        padding: 6px;
        width: 28px;
      }
      .copy:hover,
      .copy:focus-visible,
      .copy.done {
        opacity: 1;
      }
      .copy.done {
        color: var(--df-success);
      }
      mat-icon {
        font-size: 16px;
        height: 16px;
        width: 16px;
      }
    `,
  ],
})
export class DfAaCopyComponent implements OnDestroy {
  private clipboard = inject(Clipboard);
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) text = '';
  @Input() label = '';
  @Input() testId = 'aa-copy';
  copied = false;
  private timer?: ReturnType<typeof setTimeout>;

  copy(event: Event): void {
    event.stopPropagation();
    this.copied = this.clipboard.copy(this.text ?? '');
    this.cdr.markForCheck();
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.copied = false;
      this.cdr.markForCheck();
    }, 1500);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }
}
