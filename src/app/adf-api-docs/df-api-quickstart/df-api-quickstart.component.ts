import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { Clipboard } from '@angular/cdk/clipboard';
import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { SESSION_TOKEN_HEADER } from 'src/app/shared/constants/http-headers';
import { ApiDocJson } from 'src/app/shared/types/files';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DfApiTesterComponent } from 'src/app/shared/components/df-api-tester/df-api-tester.component';
import { healthCheckEndpointsInfo } from '../constants/health-check-endpoints';
import { RouterModule } from '@angular/router';

interface CurlCommand {
  title: string;
  description: string;
  textForDisplay: string;
  textForCopy: string;
  note: string;
}

@Component({
  selector: 'df-api-quickstart',
  templateUrl: './df-api-quickstart.component.html',
  styleUrls: ['./df-api-quickstart.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatExpansionModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    FontAwesomeModule,
    MatDividerModule,
    MatButtonModule,
    DfApiTesterComponent,
    RouterModule,
  ],
})
export class DfApiQuickstartComponent implements OnChanges {
  @Input() apiDocJson: ApiDocJson;
  @Input() serviceName: string;

  curlCommands: CurlCommand[] = [];
  faCopy = faCopy;

  // Native App flag - shows getting started guide
  isNativeApp = true;

  // Base URL for API calls (without service name)
  get baseUrl(): string {
    return `${window.location.origin}${BASE_URL}`;
  }

  constructor(
    private clipboard: Clipboard,
    private userDataService: DfUserDataService,
    private snackBar: MatSnackBar
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['apiDocJson'] || changes['serviceName']) &&
      this.apiDocJson &&
      this.serviceName
    ) {
      this.prepareCurlCommands();
    }
  }

  copyCurlCommand(commandText: string) {
    this.clipboard.copy(commandText);
  }

  private prepareCurlCommands(): void {
    this.curlCommands = [];
    if (!this.serviceName || !this.apiDocJson?.info?.group) {
      return;
    }

    const endpointsInfo = healthCheckEndpointsInfo[this.apiDocJson.info.group];
    if (endpointsInfo?.length > 0) {
      endpointsInfo.forEach(endpointInfo => {
        const sessionToken = this.userDataService.token || 'YOUR_SESSION_TOKEN';
        const baseUrl = `${window.location.origin}${BASE_URL}/${this.serviceName}${endpointInfo.endpoint}`;
        const headers = `-H 'accept: application/json' -H '${SESSION_TOKEN_HEADER}: ${sessionToken}'`;

        const commandForDisplay = `curl -X 'GET' '${baseUrl}' \\\n ${headers}`;
        const commandForCopy = `curl -X 'GET' '${baseUrl}' ${headers}`;

        this.curlCommands.push({
          title: endpointInfo.title,
          description: endpointInfo.description,
          textForDisplay: commandForDisplay,
          textForCopy: commandForCopy,
          note:
            this.apiDocJson.paths[endpointInfo.endpoint]?.['get']?.summary ||
            '',
        });
      });
    }
  }

  trackByCommand(index: number, item: CurlCommand): string {
    return item.textForCopy;
  }
}
