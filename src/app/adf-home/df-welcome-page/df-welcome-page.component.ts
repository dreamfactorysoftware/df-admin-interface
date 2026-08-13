import { Component, OnInit } from '@angular/core';
import { DFStorageService } from 'src/app/shared/services/df-storage.service';
import { DfDashboardComponent } from '../df-dashboard/df-dashboard.component';

/**
 * Home route shell. Meridian Phase 2 replaced the old landing (six nav-mirror
 * cards + GitHub releases feed + download page) with the activation cockpit,
 * which lives in df-dashboard. This component now only mounts that cockpit and
 * marks the first-time-user flag; the pillar nav already handles navigation and
 * "jump to area" belongs in the command palette, not a card grid.
 */
@Component({
  selector: 'df-welcome-page',
  templateUrl: './df-welcome-page.component.html',
  styleUrls: ['./df-welcome-page.component.scss'],
  standalone: true,
  imports: [DfDashboardComponent],
})
export class DfWelcomePageComponent implements OnInit {
  constructor(private storageService: DFStorageService) {}

  ngOnInit(): void {
    this.storageService.setIsFirstUser();
  }
}
