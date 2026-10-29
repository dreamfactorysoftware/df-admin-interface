import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { catchError, map, of, switchMap, take } from 'rxjs';
import {
  DfSectionLandingComponent,
  SectionLandingAction,
  SectionLandingGroup,
  SectionLandingNote,
} from '../shared/components/df-section-landing/df-section-landing.component';
import { SERVICE_GROUPS } from '../shared/constants/serviceGroups';
import { SERVICE_TYPE_SERVICE_TOKEN } from '../shared/constants/tokens';
import { GenericListResponse } from '../shared/types/generic-http';
import { ROUTES } from '../shared/types/routes';
import { ServiceType } from '../shared/types/service';
import { DfPaywallService } from '../shared/services/df-paywall.service';
import { DfSystemConfigDataService } from '../shared/services/df-system-config-data.service';
import { DfDataMaskingApiService } from '../adf-data-masking/data-masking-api.service';
import { MaskingOverview } from '../adf-data-masking/data-masking.types';

// Secure & Manage pillar home (/api-security). Tiles mirror the section's
// nav children: Authentication + Rate Limiting live here, Role-Based Access
// and API Keys are surfaced from api-connections via redirect. Tints keep
// the page from reading monochrome (item 21): core access controls take the
// security hue, rate limiting takes system (operational throttle).
@Component({
  selector: 'df-security-overview',
  standalone: true,
  imports: [CommonModule, DfSectionLandingComponent],
  template: `
    <df-section-landing
      [eyebrow]="t('eyebrow')"
      [title]="t('title')"
      [description]="t('description')"
      [actions]="actions"
      [groups]="groups"
      [notes]="notes"
      [cardColumns]="3">
    </df-section-landing>
  `,
})
export class DfSecurityOverviewComponent implements OnInit {
  private serviceTypeService = inject(SERVICE_TYPE_SERVICE_TOKEN);
  private transloco = inject(TranslocoService);
  private serviceTypes: ServiceType[] | null = null;
  private paywall = inject(DfPaywallService);
  private systemConfig = inject(DfSystemConfigDataService);
  private maskingApi = inject(DfDataMaskingApiService);
  /** Data Masking status line on its card; unset = no line (as before). */
  private maskingMeta?: string;

  groups: SectionLandingGroup[] = [];

  t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(`sectionOverviews.security.${key}`, params);
  }

  readonly actions: SectionLandingAction[] = [
    {
      label: this.t('actionRole'),
      route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}/${ROUTES.CREATE}`,
      icon: 'admin_panel_settings',
      primary: true,
    },
    {
      label: this.t('actionKey'),
      route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_KEYS}/${ROUTES.CREATE}`,
      icon: 'vpn_key',
    },
  ];

  readonly notes: SectionLandingNote[] = [
    {
      icon: 'verified_user',
      title: this.t('notePrivilegeTitle'),
      text: this.t('notePrivilegeText'),
    },
    {
      icon: 'speed',
      title: this.t('noteLimitsTitle'),
      text: this.t('noteLimitsText'),
    },
    {
      icon: 'login',
      title: this.t('noteProvidersTitle'),
      text: this.t('noteProvidersText'),
    },
  ];

  ngOnInit(): void {
    this.buildGroups();

    this.serviceTypeService
      .getAll<GenericListResponse<ServiceType>>({ limit: 500 })
      .pipe(
        map(response => response.resource ?? []),
        catchError(() => of([]))
      )
      .subscribe(serviceTypes => {
        this.serviceTypes = serviceTypes;
        this.buildGroups();
      });

    this.loadMaskingStatus();
  }

  /**
   * Data Masking's mode and queue on its card, where admins already look.
   * Licenses without the feature make no request, and an instance without
   * the package (paywalled, like Rate Limiting) shows no line either.
   */
  private loadMaskingStatus(): void {
    const license =
      this.systemConfig.environment?.platform?.license ?? 'OPEN SOURCE';
    if (this.paywall.isFeatureLocked(ROUTES.DATA_MASKING, license)) return;
    this.paywall
      .activatePaywall('data_masking')
      .pipe(
        take(1),
        switchMap(missing =>
          missing
            ? of(undefined)
            : this.maskingApi.overview(true).pipe(
                map(o => this.maskingStatus(o)),
                catchError(() => of(undefined))
              )
        ),
        catchError(() => of(undefined))
      )
      .subscribe(meta => {
        this.maskingMeta = meta;
        this.buildGroups();
      });
  }

  private maskingStatus(o: MaskingOverview): string | undefined {
    if (!o?.mode) return undefined;
    if (o.scan?.status === 'running' && !o.scan.finishedAt) {
      return this.t('maskingScanning');
    }
    if (!o.scan?.finishedAt && !o.scan?.columns) {
      return this.t('maskingNotScanned');
    }
    const masked = o.counts?.masked ?? 0;
    const review = o.counts?.review ?? 0;
    switch (o.mode) {
      case 'on':
        return review
          ? this.t('maskingOnReview', { masked, review })
          : this.t('maskingOn', { masked });
      case 'preview':
        return review
          ? this.t('maskingPreviewReview', { review })
          : this.t('maskingPreview');
      default:
        return this.t('maskingOff');
    }
  }

  private buildGroups(): void {
    const authCount = this.countServiceTypes(
      SERVICE_GROUPS[ROUTES.AUTHENTICATION]
    );

    this.groups = [
      {
        title: this.t('group'),
        cards: [
          {
            icon: 'login',
            title: this.t('authTitle'),
            text: this.t('authText'),
            route: `/${ROUTES.API_SECURITY}/${ROUTES.AUTHENTICATION}`,
            action: this.t('authAction'),
            meta: this.providerMeta(authCount),
            disabled: authCount === 0,
            tint: 'security',
          },
          {
            icon: 'speed',
            title: this.t('rateTitle'),
            text: this.t('rateText'),
            route: `/${ROUTES.API_SECURITY}/${ROUTES.RATE_LIMITING}`,
            action: this.t('rateAction'),
            tint: 'system',
          },
          {
            icon: 'visibility_off',
            title: this.t('maskingTitle'),
            text: this.t('maskingText'),
            route: `/${ROUTES.API_SECURITY}/${ROUTES.DATA_MASKING}`,
            action: this.t('maskingAction'),
            meta: this.maskingMeta,
            tint: 'security',
          },
          {
            icon: 'fact_check',
            title: this.t('complianceTitle'),
            text: this.t('complianceText'),
            route: `/${ROUTES.API_SECURITY}/${ROUTES.COMPLIANCE}`,
            action: this.t('complianceAction'),
            tint: 'security',
          },
          {
            icon: 'admin_panel_settings',
            title: this.t('rolesTitle'),
            text: this.t('rolesText'),
            route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}`,
            action: this.t('rolesAction'),
            tint: 'security',
          },
          {
            icon: 'vpn_key',
            title: this.t('keysTitle'),
            text: this.t('keysText'),
            route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_KEYS}`,
            action: this.t('keysAction'),
            tint: 'security',
          },
        ],
      },
    ];
  }

  private countServiceTypes(groups: string[]): number | null {
    if (!this.serviceTypes) {
      return null;
    }
    return this.serviceTypes.filter(serviceType =>
      groups.includes(serviceType.group)
    ).length;
  }

  private providerMeta(count: number | null): string {
    if (count === null) {
      return this.transloco.translate(
        'sectionOverviews.shared.providersChecking'
      );
    }
    return count === 1
      ? this.transloco.translate('sectionOverviews.shared.providersOne')
      : this.transloco.translate('sectionOverviews.shared.providersOther', {
          count,
        });
  }
}
