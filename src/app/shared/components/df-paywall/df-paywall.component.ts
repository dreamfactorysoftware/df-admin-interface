import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  Input,
  OnInit,
} from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfUserDataService } from '../../services/df-user-data.service';
import { DfSystemConfigDataService } from '../../services/df-system-config-data.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'df-paywall',
  templateUrl: './df-paywall.component.html',
  styleUrls: ['./df-paywall.component.scss'],
  standalone: true,
  imports: [TranslocoPipe],
})
export class DfPaywallComponent implements AfterViewInit, OnInit {
  @ViewChild('calendlyWidget') calendlyWidget: ElementRef;
  @Input() serviceName: string = 'Unknown';

  constructor(
    private userDataService: DfUserDataService,
    private systemConfigService: DfSystemConfigDataService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.trackPaywallHit();
  }

  ngAfterViewInit(): void {
    (window as any)['Calendly'].initInlineWidget({
      url: 'https://calendly.com/dreamfactory-platform/unlock-all-features',
      parentElement: this.calendlyWidget.nativeElement,
      autoLoad: false,
    });
  }

  private trackPaywallHit(): void {
    const user = this.userDataService.userData;
    const email = user?.email ?? 'unknown';
    const ip =
      this.systemConfigService?.environment?.client?.ipAddress ?? 'unknown';
    const service = this.serviceName || 'Not specified';

    const payload = { email, ip_address: ip, service_name: service };

    this.http
      .post('https://updates.dreamfactory.com/api/paywall', payload)
      .subscribe({
        next: () => {},
        error: err => {
          console.error('Paywall tracking failed:', err);
        },
      });
  }
}
