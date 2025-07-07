import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DfPaywallComponent } from '../df-paywall/df-paywall.component';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfUserDataService } from '../../services/df-user-data.service';
import { DfSystemConfigDataService } from '../../services/df-system-config-data.service';
import { DfPaywallService } from '../../services/df-paywall.service';

@Component({
  selector: 'df-paywall-modal',
  templateUrl: './df-paywall-modal.component.html',
  styleUrls: ['./df-paywall-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    DfPaywallComponent,
    TranslocoPipe,
  ],
})
export class DfPaywallModal implements OnInit, AfterViewInit {
  @ViewChild('calendlyWidget') calendlyWidget: ElementRef;

  constructor(
    private userDataService: DfUserDataService,
    private systemConfigService: DfSystemConfigDataService,
    private dfPaywallService: DfPaywallService,
    @Inject(MAT_DIALOG_DATA) public data: { serviceName: string }
  ) {}

  ngOnInit(): void {
    const user = this.userDataService.userData;
    const email = user?.email;
    const ip = this.systemConfigService?.environment?.client?.ipAddress;
    this.dfPaywallService.trackPaywallHit(email, ip, this.data.serviceName);
  }

  ngAfterViewInit(): void {
    (window as any)['Calendly'].initInlineWidget({
      url: 'https://calendly.com/dreamfactory-platform/unlock-all-features',
      parentElement: this.calendlyWidget.nativeElement,
      autoLoad: false,
    });
  }
} 