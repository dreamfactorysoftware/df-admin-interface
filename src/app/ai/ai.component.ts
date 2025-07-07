import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DfPaywallComponent } from '../shared/components/df-paywall/df-paywall.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-ai',
  standalone: true,
  imports: [CommonModule, DfPaywallComponent, NgIf],
  templateUrl: './ai.component.html',
  styleUrls: ['./ai.component.scss'],
})
export class AiComponent {
  paywall = false;

  constructor(private activatedRoute: ActivatedRoute) {
    this.activatedRoute.data.subscribe(({ showPaywall }) => {
      if (showPaywall) {
        this.paywall = true;
      }
    });
  }
}
