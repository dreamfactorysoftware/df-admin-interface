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
    'https://calendly.com/nicdavidson-df/snowflake-native-app-support';

  // Native App branch - always show the banner
  isNativeApp = true;

  constructor(private systemConfigService: DfSystemConfigDataService) {}

  ngOnInit() {
    // In Native App mode, always show the banner
    if (this.isNativeApp) {
      this.showBanner = true;
      return;
    }

    // Standard mode: check license
    this.systemConfigService.environment$
      .pipe(untilDestroyed(this))
      .subscribe(environment => {
        const license = environment.platform?.license?.toUpperCase();
        const isTrial = environment.platform?.isTrial ?? false;

        this.showBanner = license === 'OPEN SOURCE' || isTrial;
      });
  }

  openCalendly() {
    window.open(this.calendlyUrl, '_blank');
  }
}
