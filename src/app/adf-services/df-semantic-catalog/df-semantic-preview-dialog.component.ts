import { NgFor, NgIf } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  SemanticParam,
  SemanticPreviewBlock,
  serverMessage,
} from './semantic-catalog';
import { SemanticCatalogApiService } from './semantic-catalog-api.service';

export interface SemanticPreviewDialogData {
  service: string;
  serviceLabel: string;
}

/**
 * df-semantic-preview-dialog: the exact `semantics` block MCP get_data_model
 * hands an agent for this service (approved entries only), rendered readably,
 * with the raw JSON behind an expander.
 */
@Component({
  selector: 'df-semantic-preview-dialog',
  standalone: true,
  templateUrl: './df-semantic-preview-dialog.component.html',
  styleUrls: ['./df-semantic-preview-dialog.component.scss'],
  imports: [
    NgIf,
    NgFor,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    TranslocoPipe,
  ],
})
export class DfSemanticPreviewDialogComponent implements OnInit {
  loading = true;
  error = '';
  block: SemanticPreviewBlock | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SemanticPreviewDialogData,
    private api: SemanticCatalogApiService
  ) {}

  ngOnInit(): void {
    this.api.preview(this.data.service).subscribe({
      next: block => {
        this.block = block;
        this.loading = false;
      },
      error: err => {
        this.error = serverMessage(err);
        this.loading = false;
      },
    });
  }

  get raw(): string {
    return JSON.stringify({ semantics: this.block }, null, 2);
  }

  get hasOmitted(): boolean {
    const o = this.block?.omitted;
    if (o === undefined || o === null) return false;
    if (Array.isArray(o)) return o.length > 0;
    if (typeof o === 'object') return Object.keys(o).length > 0;
    return true;
  }

  pretty(v: unknown): string {
    return JSON.stringify(v, null, 2);
  }

  paramList(params: SemanticParam[] | undefined): string {
    return (params ?? [])
      .map(
        p =>
          `{${p.name}}: ${p.type}${p.required === false ? ' (optional)' : ''}${
            p.description ? ` — ${p.description}` : ''
          }`
      )
      .join('; ');
  }
}
