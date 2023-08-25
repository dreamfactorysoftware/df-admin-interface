import { Component } from '@angular/core';
import { INSTANCE_BASE_URL } from 'src/app/core/constants/urls';

@Component({
  selector: 'df-api-docs',
  templateUrl: './df-api-docs.component.html',
  styleUrls: ['./df-api-docs.component.scss'],
})
export class DfApiDocsComponent {
  serverUrl = `${INSTANCE_BASE_URL}/df-api-docs-ui/dist/index.html?admin_app=1`;
}
