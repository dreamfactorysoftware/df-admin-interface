import { AsyncPipe, NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DfBreakpointService } from '../../core/services/df-breakpoint.service';
import { TranslocoPipe } from '@ngneat/transloco';
import { Client, Php, Platform, Server } from '../types';

@Component({
  selector: 'df-system-info',
  templateUrl: './df-system-info.component.html',
  styleUrls: ['./df-system-info.component.scss'],
  standalone: true,
  imports: [AsyncPipe, NgFor, TranslocoPipe],
})
export class DfSystemInfoComponent implements OnInit {
  private destroyed$ = new Subject<void>();
  platform: Platform;
  server: Server;
  client: Client;
  php: Php;

  constructor(
    private activatedRoute: ActivatedRoute,
    public breakpointService: DfBreakpointService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: any) => {
        this.platform = data?.data.platform;
        this.server = data?.data.server;
        this.client = data?.data.client;
        this.php = {
          phpVersion: data?.data.php.core.phpVersion,
          serverApi: data?.data.php.general.serverApi,
        };
      });
  }
}
