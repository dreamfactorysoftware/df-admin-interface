import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DfPaywallComponent } from '../shared/components/df-paywall/df-paywall.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-ai',
  standalone: true,
  imports: [CommonModule, DfPaywallComponent, NgIf],
  template: `
    <div *ngIf="paywall" class="ai-paywall-container">
      <div class="ai-intro-section">
        <div class="ai-intro-content">
          <h1 class="ai-title">AI Gateway Data Platform</h1>
          <div class="ai-description">
            <p class="lead-text">
              Unlock the power of AI with your data! Our upcoming AI
              capabilities will enable you to:
            </p>
            <ul class="feature-list">
              <li>
                ✨ <strong>Secure Dataset Exposure:</strong> Safely expose your
                datasets to AI clients with full RBAC protections
              </li>
              <li>
                🔐 <strong>Enterprise-Grade Security:</strong> Maintain complete
                control over data access and permissions
              </li>
              <li>
                🚀 <strong>Seamless Integration:</strong> Connect popular AI
                platforms and tools directly to your DreamFactory APIs
              </li>
              <li>
                📊 <strong>Intelligent Analytics:</strong> Generate insights and
                recommendations powered by machine learning
              </li>
            </ul>
            <div class="beta-callout">
              <h3>🎯 Ready to Get Started?</h3>
              <p>
                Contact us below to join our exclusive AI beta program and be
                among the first to experience these cutting-edge capabilities!
              </p>
            </div>
          </div>
        </div>
      </div>
      <df-paywall></df-paywall>
    </div>
    <ng-template #allowed>
      <div class="ai-container">
        <h1>AI Assistant</h1>
        <p>
          Welcome to the AI section! This is where AI-powered features will be
          implemented.
        </p>
        <div class="ai-content">
          <div class="feature-card">
            <h3>Smart Analytics</h3>
            <p>AI-powered data insights and analytics</p>
          </div>
          <div class="feature-card">
            <h3>Automated Tasks</h3>
            <p>Intelligent automation and task management</p>
          </div>
          <div class="feature-card">
            <h3>Predictive Modeling</h3>
            <p>Advanced machine learning predictions</p>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .ai-paywall-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      }

      .ai-intro-section {
        padding: 3rem 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        position: relative;
        overflow: hidden;
      }

      .ai-intro-section::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="50" cy="10" r="1" fill="rgba(255,255,255,0.08)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        opacity: 0.3;
      }

      .ai-intro-content {
        max-width: 800px;
        margin: 0 auto;
        position: relative;
        z-index: 1;
      }

      .ai-title {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 1.5rem;
        text-align: center;
        color: #000;
      }

      @keyframes rainbow-text {
        0%,
        100% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
      }

      .lead-text {
        font-size: 1.2rem;
        font-weight: 500;
        margin-bottom: 2rem;
        text-align: center;
        opacity: 0.95;
      }

      .feature-list {
        list-style: none;
        padding: 0;
        margin: 2rem 0;
      }

      .feature-list li {
        padding: 0.8rem 0;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        opacity: 0.9;
      }

      .feature-list li:last-child {
        border-bottom: none;
      }

      .beta-callout {
        background: rgba(255, 255, 255, 0.1);
        padding: 1.5rem;
        border-radius: 12px;
        margin-top: 2rem;
        text-align: center;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .beta-callout h3 {
        margin-bottom: 0.5rem;
        font-size: 1.3rem;
        color: #ffd700;
      }

      .beta-callout p {
        margin: 0;
        font-size: 1rem;
        opacity: 0.9;
      }

      .ai-container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      h1 {
        color: #333;
        margin-bottom: 1rem;
        background: linear-gradient(
          45deg,
          #dc143c,
          #ff4500,
          #ffa500,
          #32cd32,
          #1e90ff,
          #8a2be2
        );
        background-size: 300% 300%;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: rainbow-text 3s ease-in-out infinite;
        font-weight: 700;
        text-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
        filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.1));
      }

      .ai-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
      }

      .feature-card {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
      }

      .feature-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .feature-card h3 {
        margin-bottom: 0.5rem;
        color: #333;
      }

      .feature-card p {
        color: #666;
        line-height: 1.5;
      }
    `,
  ],
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
