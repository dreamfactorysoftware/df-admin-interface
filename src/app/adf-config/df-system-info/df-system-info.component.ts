import { AsyncPipe, NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DfBreakpointService } from '../../shared/services/df-breakpoint.service';
import { TranslocoPipe } from '@ngneat/transloco';
import { Client, Php, Platform, Server } from '../../shared/types/config';
import { UntilDestroy } from '@ngneat/until-destroy';
import { AccountStatus } from 'src/app/shared/types/system';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-system-info',
  templateUrl: './df-system-info.component.html',
  styleUrls: ['./df-system-info.component.scss'],
  standalone: true,
  imports: [AsyncPipe, NgFor, TranslocoPipe],
})
export class DfSystemInfoComponent implements OnInit {
  platform: Platform;
  server: Server;
  client: Client;
  php: Php;
  subscriptionData: AccountStatus;

  constructor(
    private activatedRoute: ActivatedRoute,
    public breakpointService: DfBreakpointService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe((data: any) => {
      this.platform = data?.data.platform;
      this.server = data?.data.server;
      this.client = data?.data.client;
      this.php = {
        phpVersion: data?.data.php.core.phpVersion,
        serverApi: data?.data.php.general.serverApi,
      };
      this.subscriptionData = data?.subscriptionData;
    });
  }
}
