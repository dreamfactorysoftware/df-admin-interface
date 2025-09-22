import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DfSystemConfigDataService } from '../../services/df-system-config-data.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslocoModule } from '@ngneat/transloco';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-engagement-banner',
  templateUrl: './df-engagement-banner.component.html',
  styleUrls: ['./df-engagement-banner.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslocoModule],
})
export class DfEngagementBannerComponent implements OnInit {
  showBanner = false;
  calendlyUrl =
    'https://calendly.com/dreamfactory-platform/expert-consultation-lab-setup';

  constructor(private systemConfigService: DfSystemConfigDataService) {}

  ngOnInit() {
    const isDismissed =
      localStorage.getItem('df-engagement-banner-dismissed') === 'true';

    if (!isDismissed) {
      this.systemConfigService.environment$
        .pipe(untilDestroyed(this))
        .subscribe(environment => {
          const license = environment.platform?.license?.toUpperCase();
          const isTrial = environment.platform?.isTrial ?? false;

          this.showBanner = license === 'OPEN SOURCE' || isTrial;
        });
    }
  }

  openCalendly() {
    window.open(this.calendlyUrl, '_blank');
  }

  dismissBanner() {
    this.showBanner = false;
    localStorage.setItem('df-engagement-banner-dismissed', 'true');
  }
}
