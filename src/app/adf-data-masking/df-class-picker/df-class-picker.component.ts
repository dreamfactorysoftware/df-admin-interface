import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { classDef, classesByTier } from '../data-masking.catalog';
import { Verdict } from '../data-masking.types';

/**
 * df-class-picker: the class chip on a column row. Tier-tinted (restricted
 * adds a lock so meaning is not color-only), hollow while the column needs
 * review, neutral when not sensitive. Opens a menu grouped by tier with
 * "Not sensitive" last. Emits the picked class id, or null.
 */
@Component({
  selector: 'df-class-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, NgClass, MatIconModule, MatMenuModule, TranslocoPipe],
  templateUrl: './df-class-picker.component.html',
  styleUrls: ['./df-class-picker.component.scss'],
})
export class DfClassPickerComponent {
  @Input() cls: string | null = null;
  @Input() verdict: Verdict = 'clear';
  @Input() disabled = false;
  /** Roving tabindex from the grid: -1 keeps the chip out of the Tab order. */
  @Input() tabIndex: number | null = null;
  @Output() pick = new EventEmitter<string | null>();

  readonly groups = classesByTier();
  private transloco = inject(TranslocoService);

  /**
   * The chip's text: the class, "Not sensitive" when clear, and "Choose a
   * class" for a masked or review column without one (the server redacts
   * it; "Not sensitive" there would say the opposite).
   */
  get labelKey(): string {
    if (this.verdict === 'clear') return 'dataMasking.notSensitive';
    return this.cls
      ? `dataMasking.classes.${this.cls}`
      : 'dataMasking.detection.pickClass';
  }

  get label(): string {
    return this.transloco.translate(this.labelKey);
  }

  get tier(): string {
    return this.verdict === 'clear'
      ? 'clear'
      : (classDef(this.cls)?.tier ?? 'clear');
  }

  choose(cls: string | null): void {
    if (cls === this.cls && this.verdict !== 'review') return;
    this.pick.emit(cls);
  }
}
