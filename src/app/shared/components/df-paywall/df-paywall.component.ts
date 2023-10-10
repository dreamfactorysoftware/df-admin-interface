import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'df-paywall',
  templateUrl: './df-paywall.component.html',
  styleUrls: ['./df-paywall.component.scss'],
  standalone: true,
  imports: [TranslocoPipe],
})
export class DfPaywallComponent implements AfterViewInit {
  @ViewChild('calendlyWidget') calendlyWidget: ElementRef;

  ngAfterViewInit(): void {
    (window as any)['Calendly'].initInlineWidget({
      url: 'https://calendly.com/dreamfactory-platform/unlock-all-features',
      parentElement: this.calendlyWidget.nativeElement,
      autoLoad: false,
    });
  }
}
