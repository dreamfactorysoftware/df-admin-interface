import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

// df-page-header: the one page title zone (Meridian Phase 0).
//
// Replaces the ad-hoc per-page headers with a single template: an optional
// eyebrow, the page H1 on --df-font-size-2xl, an optional description line, a
// right-aligned actions slot (spec: one primary button per page), an optional
// breadcrumb slot above the title, and an optional tabs slot below it (the
// service workbench mat-tab-nav-bar). It sets --df-content-max and
// --df-page-gutter so every route shares one measure and gutter.
//
// Presentational only: it owns no copy, so it owns no i18n. Consumers pass
// display-ready strings, piping static copy through transloco themselves
// (`[title]="'services.title' | transloco"`) and passing dynamic values (a
// service name) straight through. Tokens only: light/dark/phosphor for free.
//
// Slots:
//   [pageHeaderBreadcrumb] - breadcrumb trail, above the title.
//   [pageHeaderActions]    - right-aligned page actions (keep to one primary).
//   [pageHeaderTabs]       - tab bar, below the title zone.
@Component({
  selector: 'df-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf],
  templateUrl: './df-page-header.component.html',
  styleUrls: ['./df-page-header.component.scss'],
})
export class DfPageHeaderComponent {
  @Input() eyebrow?: string;
  @Input({ required: true }) title = '';
  @Input() description?: string;
}
