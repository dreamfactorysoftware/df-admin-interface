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
import { MatSnackBar } from '@angular/material/snack-bar';
import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { SESSION_TOKEN_HEADER } from 'src/app/shared/constants/http-headers';
import { ApiDocJson } from 'src/app/shared/types/files';
import { MatDividerModule } from '@angular/material/divider';

interface CurlCommand {
  title: string;
  description: string;
  text: string;
  note: string;
}

const healthCheckEndpointsInfo: {
  [key: string]: { endpoint: string; title: string; description: string }[];
} = {
  Database: [
    {
      endpoint: '/_schema',
      title: 'View Available Schemas',
      description:
        'This command fetches a list of schemas from your connected database',
    },
    {
      endpoint: '/_table',
      title: 'View Tables in Your Database',
      description: 'This command lists all tables in your database',
    },
  ],
  File: [
    {
      endpoint: '/',
      title: 'View Available Folders',
      description:
        'This command fetches a list of folders from your connected file storage',
    },
  ],
};

@Component({
  selector: 'df-curl-command',
  templateUrl: './df-curl-command.component.html',
  styleUrls: ['./df-curl-command.component.scss'],
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
  ],
})
export class DfCurlCommandComponent implements OnChanges {
  @Input() apiDocJson: ApiDocJson;
  @Input() serviceName: string;

  curlCommands: CurlCommand[] = [];
  faCopy = faCopy;

  constructor(
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
    private userDataService: DfUserDataService
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
    this.snackBar.open('CURL command copied to clipboard.', 'Close', {
      duration: 2000,
    });
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
        const command = `curl -X 'GET' '${window.location.origin}${BASE_URL}/${this.serviceName}${endpointInfo.endpoint}' -H 'accept: application/json' -H '${SESSION_TOKEN_HEADER}: ${sessionToken}'`;

        this.curlCommands.push({
          title: endpointInfo.title,
          description: endpointInfo.description,
          text: command,
          note: this.apiDocJson.paths[endpointInfo.endpoint]?.['get']?.summary,
        });
      });
    }
  }

  trackByCommand(index: number, item: CurlCommand): string {
    return item.text;
  }
}
