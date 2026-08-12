import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OverlayRef } from '@angular/cdk/overlay';
import { ListKeyManager } from '@angular/cdk/a11y';
import { TranslocoPipe } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faBolt,
  faBook,
  faDatabase,
  faKey,
  faMagnifyingGlass,
  faPlug,
  faUserShield,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { debounceTime } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  ActionRegistryService,
  PaletteGroup,
  PaletteItem,
  PaletteKind,
} from '../../services/action-registry.service';

/**
 * Cmd/Ctrl-K command palette (spec move 5). Extends the df-search-dialog idea
 * - fuzzy index over real objects + verbs - but rides a CDK Overlay with a
 * ListKeyManager for keyboard-first nav. The shell binds the global key and
 * hands over the OverlayRef so the palette can close itself.
 */
@UntilDestroy()
@Component({
  selector: 'df-command-palette',
  templateUrl: './df-command-palette.component.html',
  styleUrls: ['./df-command-palette.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, TranslocoPipe, FontAwesomeModule],
})
export class DfCommandPaletteComponent implements OnInit {
  private registry = inject(ActionRegistryService);
  private router = inject(Router);

  /** Set by the opener service right after the portal attaches. */
  overlayRef?: OverlayRef;
  /** Route in view when the palette opened - drives the empty state. */
  currentUrl = '/';

  @ViewChild('searchInput', { static: true })
  searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('list') list?: ElementRef<HTMLElement>;

  search = new FormControl('', { nonNullable: true });
  groups: PaletteGroup[] = [];
  /** Flat, in-render-order list backing the ListKeyManager. */
  private flat: PaletteItem[] = [];
  private keyManager!: ListKeyManager<PaletteItem>;

  /** True while showing recents / suggestions (no query typed). */
  emptyState = true;

  faMagnifyingGlass = faMagnifyingGlass;
  faArrowRight = faArrowRight;

  private readonly kindIcon: Record<PaletteKind, IconDefinition> = {
    action: faBolt,
    service: faDatabase,
    role: faUserShield,
    key: faKey,
    mcp: faPlug,
    doc: faBook,
  };

  ngOnInit(): void {
    // Re-pull objects each open so a service created a moment ago is findable;
    // paint the empty state immediately from cache so there's no blank frame.
    this.render(this.registry.emptyState(this.currentUrl), true);
    this.registry
      .refresh()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        if (this.emptyState) {
          this.render(this.registry.emptyState(this.currentUrl), true);
        } else {
          this.render(this.registry.query(this.search.value), false);
        }
      });

    this.search.valueChanges
      .pipe(debounceTime(90), untilDestroyed(this))
      .subscribe(value => {
        const term = value.trim();
        if (!term) {
          this.render(this.registry.emptyState(this.currentUrl), true);
        } else {
          this.render(this.registry.query(term), false);
        }
      });

    queueMicrotask(() => this.searchInput?.nativeElement.focus());
  }

  private render(groups: PaletteGroup[], isEmptyState: boolean): void {
    this.groups = groups;
    this.emptyState = isEmptyState;
    this.flat = groups.flatMap(g => g.items);
    this.keyManager = new ListKeyManager<PaletteItem>(this.flat).withWrap();
    if (this.flat.length) {
      this.keyManager.setActiveItem(0);
    }
  }

  icon(kind: PaletteKind): IconDefinition {
    return this.kindIcon[kind];
  }

  isActive(item: PaletteItem): boolean {
    return this.keyManager?.activeItem === item;
  }

  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        this.keyManager.onKeydown(event);
        this.scrollActiveIntoView();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.keyManager.activeItem) {
          this.run(this.keyManager.activeItem);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
    }
  }

  run(item: PaletteItem): void {
    this.registry.pushRecent(item);
    this.router.navigateByUrl(item.path);
    this.close();
  }

  close(): void {
    this.overlayRef?.dispose();
  }

  trackByGroup = (_: number, g: PaletteGroup) => g.kind + g.labelKey;
  trackByItem = (_: number, i: PaletteItem) => i.id;

  private scrollActiveIntoView(): void {
    queueMicrotask(() => {
      const el = this.list?.nativeElement.querySelector<HTMLElement>(
        '.palette-option.active'
      );
      el?.scrollIntoView({ block: 'nearest' });
    });
  }
}
