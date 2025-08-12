import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheckCircle,
  faRocket,
  faShieldAlt,
  faKey,
  faBolt,
  faDatabase,
  faCopy,
} from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { interval, Subject, takeUntil } from 'rxjs';

export interface CelebrationDialogData {
  serviceName: string;
  apiKey?: string;
  isFirstTime: boolean;
}

@Component({
  selector: 'df-celebration-dialog',
  templateUrl: './df-celebration-dialog.component.html',
  styleUrls: ['./df-celebration-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslocoModule,
    FontAwesomeModule,
  ],
})
export class DfCelebrationDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Icons
  faCheckCircle = faCheckCircle;
  faRocket = faRocket;
  faShieldAlt = faShieldAlt;
  faKey = faKey;
  faBolt = faBolt;
  faDatabase = faDatabase;
  faCopy = faCopy;

  // Animation states
  showConfetti = true;
  currentStep = -1;
  allStepsRevealed = false;
  countdown = 15;

  // API creation steps
  steps = [
    {
      icon: faDatabase,
      title: 'services.celebration.steps.database.title',
      description: 'services.celebration.steps.database.description',
      timing: '< 100ms',
    },
    {
      icon: faBolt,
      title: 'services.celebration.steps.endpoints.title',
      description: 'services.celebration.steps.endpoints.description',
      timing: '< 50ms',
    },
    {
      icon: faShieldAlt,
      title: 'services.celebration.steps.security.title',
      description: 'services.celebration.steps.security.description',
      timing: '< 200ms',
    },
    {
      icon: faKey,
      title: 'services.celebration.steps.apiKey.title',
      description: 'services.celebration.steps.apiKey.description',
      timing: 'Instant',
    },
  ];

  constructor(
    public dialogRef: MatDialogRef<DfCelebrationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CelebrationDialogData,
    private router: Router
  ) {
    // Prevent closing by clicking outside
    dialogRef.disableClose = true;
  }

  ngOnInit(): void {
    // Start revealing steps one by one
    this.revealSteps();
    
    // Start countdown after all steps are revealed
    setTimeout(() => {
      this.startCountdown();
    }, 3000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private revealSteps(): void {
    // Reveal each step with a delay
    const stepDelay = 500;
    this.steps.forEach((_, index) => {
      setTimeout(() => {
        this.currentStep = index;
        if (index === this.steps.length - 1) {
          this.allStepsRevealed = true;
        }
      }, stepDelay * (index + 1));
    });
  }

  private startCountdown(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.countdown--;
        if (this.countdown === 0) {
          this.goToApiDocs();
        }
      });
  }

  goToApiDocs(): void {
    this.dialogRef.close();
    this.router.navigate(['/api-connections/api-docs', this.data.serviceName]);
  }

  copyApiKey(): void {
    if (this.data.apiKey) {
      navigator.clipboard.writeText(this.data.apiKey);
    }
  }
}