import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { interval } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DfSystemConfigDataService } from '../../services/df-system-config-data.service';
import { DfSnowflakeUsageService } from '../../services/df-snowflake-usage.service';

interface MarketplaceUsageInfo {
  limit: number;
  used: number;
  remaining: number;
  reset_at: string;
  tampered: boolean;
  edition: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-snowflake-marketplace-banner',
  templateUrl: './df-snowflake-marketplace-banner.component.html',
  styleUrls: ['./df-snowflake-marketplace-banner.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class DfSnowflakeMarketplaceBannerComponent implements OnInit {
  // ALWAYS show banner - designed for dedicated Snowflake Marketplace builds
  showMarketplaceBanner = true;
  marketplaceInfo: MarketplaceUsageInfo = {
    limit: 50,
    used: 0,
    remaining: 50,
    reset_at: '',
    tampered: false,
    edition: 'snowflake-marketplace-free',
  };
  upgradeEmail = 'snowflake@dreamfactory.com';

  constructor(
    private http: HttpClient,
    private systemConfigService: DfSystemConfigDataService,
    private usageService: DfSnowflakeUsageService
  ) {}

  ngOnInit() {
    this.initializeMarketplaceBanner();
  }

  initializeMarketplaceBanner() {
    // Check for custom upgrade email from environment config
    this.systemConfigService.environment$
      .pipe(untilDestroyed(this))
      .subscribe(env => {
        // Use custom upgrade email if provided (cast to any for config access)
        const customEmail = (env?.platform as any)?.config?.SNOWFLAKE_UPGRADE_EMAIL;
        if (customEmail) {
          this.upgradeEmail = customEmail;
        }
      });

    // Subscribe to instant usage updates from HTTP interceptor
    this.usageService.usage$
      .pipe(untilDestroyed(this))
      .subscribe(usage => {
        if (usage) {
          // Update from header-based real-time data
          this.marketplaceInfo = {
            ...this.marketplaceInfo,
            limit: usage.limit,
            remaining: usage.remaining,
            reset_at: usage.reset_at,
          };
        }
      });

    // Immediately fetch usage info
    this.fetchUsageInfo();

    // Refresh usage info every 5 seconds as backup polling
    interval(5000)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.fetchUsageInfo();
      });
  }

  fetchUsageInfo() {
    // Fetch current usage statistics with cache-busting headers
    this.http
      .get<MarketplaceUsageInfo>('/api/v2/system/snowflake-marketplace/usage', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      .subscribe({
        next: usage => {
          this.marketplaceInfo = usage;
        },
        error: error => {
          console.error('Failed to fetch Snowflake Marketplace usage:', error);
        },
      });
  }

  get isLowRemaining(): boolean {
    return this.marketplaceInfo.remaining < 5;
  }
}
