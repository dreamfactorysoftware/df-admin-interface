/**
 * Add/edit custom tool dialog (§3.2 Custom tools): API-endpoint or
 * server-side-function tool, with name-collision validation against every
 * name the server would emit — built-in catalog names for the exposed
 * services in the current tool style, global/aggregator names, and the other
 * custom tools — plus JSON parse validation for parameters/headers.
 * Returns the tool object to store in cfg.customTools; the caller mutates
 * the store and the shell's Save persists it.
 */
import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { AGGREGATOR_TOOLS, GLOBAL_TOOLS, verbsFor } from '../mcp-catalog';
import { emittedDbToolName, toolKey } from '../mcp-effective';
import { McpEditorStore } from '../mcp-store';

export interface McpCustomToolDialogData {
  store: McpEditorStore;
  /** Present when editing; absent when adding. */
  tool?: any;
}

/**
 * Every tool name this server would emit, apart from the edited custom tool
 * itself: built-ins for exposed services in the current style, globals,
 * aggregators, and the other custom tools.
 */
export function emittedNameSet(store: McpEditorStore, excludeToolName?: string): Set<string> {
  const names = new Set<string>();
  GLOBAL_TOOLS.forEach(t => names.add(t.verb));
  AGGREGATOR_TOOLS.forEach(t => names.add(t.verb));
  const style = store.effective().effectiveStyle;
  for (const row of store.rows()) {
    if (!row.svc) continue;
    for (const v of verbsFor(row.svc.kind)) {
      names.add(
        row.svc.kind === 'db'
          ? emittedDbToolName(style, row.svc.name, v.verb)
          : toolKey(row.svc.name, v.verb)
      );
    }
  }
  for (const t of store.cfg.customTools ?? []) {
    if (t?.name && t.name !== excludeToolName) names.add(t.name);
  }
  return names;
}

@Component({
  selector: 'df-mcp-custom-tool-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
  ],
  template: `
    <div class="mcp-ct-dialog" data-testid="mcp-custom-dialog">
      <h2>{{ data.tool ? 'Edit custom tool' : 'Add custom tool' }}</h2>
      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="mcp-ct-type">
          <span class="mcp-ct-type-label">Tool type:</span>
          <mat-radio-group formControlName="toolType">
            <mat-radio-button value="api">API endpoint</mat-radio-button>
            <mat-radio-button value="function">Server-side function</mat-radio-button>
          </mat-radio-group>
        </div>

        <mat-form-field appearance="outline" class="mcp-ct-field">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" data-testid="mcp-custom-name" />
          <mat-error *ngIf="form.controls['name'].hasError('required')">
            A name is required.
          </mat-error>
          <mat-error *ngIf="form.controls['name'].hasError('pattern')">
            Letters, numbers and underscores only.
          </mat-error>
          <mat-error *ngIf="form.controls['name'].hasError('collision')">
            A tool named {{ form.controls['name'].value }} already exists. Choose
            another name.
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="mcp-ct-field">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" />
        </mat-form-field>

        <ng-container *ngIf="form.controls['toolType'].value === 'api'">
          <div class="mcp-ct-api-row">
            <mat-form-field appearance="outline" class="mcp-ct-method">
              <mat-label>Method</mat-label>
              <mat-select formControlName="httpMethod">
                <mat-option *ngFor="let m of methods" [value]="m">{{ m }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="mcp-ct-url">
              <mat-label>URL</mat-label>
              <input matInput formControlName="url" placeholder="https://…" />
              <mat-error *ngIf="form.controls['url'].hasError('required')">
                A URL is required for an API tool.
              </mat-error>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="mcp-ct-field">
            <mat-label>Parameters (JSON, optional)</mat-label>
            <textarea matInput formControlName="parameters" rows="3"></textarea>
            <mat-error *ngIf="form.controls['parameters'].hasError('json')">
              Not valid JSON.
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="mcp-ct-field">
            <mat-label>Headers (JSON, optional)</mat-label>
            <textarea matInput formControlName="headers" rows="3"></textarea>
            <mat-error *ngIf="form.controls['headers'].hasError('json')">
              Not valid JSON.
            </mat-error>
          </mat-form-field>
        </ng-container>

        <mat-form-field
          appearance="outline"
          class="mcp-ct-field"
          *ngIf="form.controls['toolType'].value === 'function'">
          <mat-label>Function code</mat-label>
          <textarea matInput formControlName="functionCode" rows="8"></textarea>
          <mat-error *ngIf="form.controls['functionCode'].hasError('required')">
            Function code is required for a function tool.
          </mat-error>
        </mat-form-field>

        <div class="mcp-ct-actions">
          <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
          <button
            mat-flat-button
            color="primary"
            type="submit"
            data-testid="mcp-custom-save">
            {{ data.tool ? 'Save tool' : 'Add tool' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .mcp-ct-dialog {
        padding: 18px 20px 14px;
        font-family: Inter, 'Helvetica Neue', sans-serif;
        min-width: 320px;
        max-width: 520px;
      }
      h2 {
        margin: 0 0 12px;
        font-size: 16px;
        font-weight: 700;
      }
      .mcp-ct-type {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 12px;
        font-size: 13px;
      }
      .mcp-ct-type-label {
        font-weight: 600;
      }
      .mcp-ct-field {
        width: 100%;
      }
      .mcp-ct-api-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .mcp-ct-method {
        width: 130px;
      }
      .mcp-ct-url {
        flex: 1;
        min-width: 180px;
      }
      .mcp-ct-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 4px;
      }
    `,
  ],
})
export class DfMcpCustomToolDialogComponent implements OnInit {
  readonly methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  form!: FormGroup;
  private takenNames = new Set<string>();

  constructor(
    public dialogRef: MatDialogRef<DfMcpCustomToolDialogComponent, any>,
    @Inject(MAT_DIALOG_DATA) public data: McpCustomToolDialogData,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const t = this.data.tool;
    this.takenNames = emittedNameSet(this.data.store, t?.name);
    this.form = this.fb.group({
      toolType: [t?.toolType || 'api'],
      name: [
        t?.name ?? '',
        [
          Validators.required,
          Validators.pattern(/^[a-zA-Z0-9_]+$/),
          (c: AbstractControl): ValidationErrors | null =>
            this.takenNames.has(c.value) ? { collision: true } : null,
        ],
      ],
      description: [t?.description ?? ''],
      httpMethod: [t?.httpMethod || 'GET'],
      url: [t?.url ?? ''],
      parameters: [this.toJsonText(t?.parameters)],
      headers: [this.toJsonText(t?.headers)],
      functionCode: [t?.function ?? ''],
    });
  }

  private toJsonText(v: any): string {
    if (v === null || v === undefined || v === '') return '';
    if (typeof v === 'string') return v;
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return '';
    }
  }

  /** '' → null; valid JSON → parsed value; invalid → undefined (error). */
  private parseJson(text: string): any {
    const trimmed = (text ?? '').trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return undefined;
    }
  }

  save(): void {
    const v = this.form.value;
    const isApi = v.toolType === 'api';

    // Conditional requirements the static validators can't express.
    this.form.controls['url'].setErrors(
      isApi && !(v.url ?? '').trim() ? { required: true } : null
    );
    this.form.controls['functionCode'].setErrors(
      !isApi && !(v.functionCode ?? '').trim() ? { required: true } : null
    );

    let params: any = null;
    let headers: any = null;
    if (isApi) {
      params = this.parseJson(v.parameters);
      headers = this.parseJson(v.headers);
      this.form.controls['parameters'].setErrors(
        params === undefined ? { json: true } : null
      );
      this.form.controls['headers'].setErrors(
        headers === undefined ? { json: true } : null
      );
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const original = this.data.tool ?? {};
    this.dialogRef.close({
      // Preserve id and storage/scm fields the dialog does not surface.
      ...original,
      toolType: v.toolType,
      name: v.name,
      description: v.description ?? '',
      httpMethod: isApi ? v.httpMethod : original.httpMethod ?? 'GET',
      url: isApi ? v.url : original.url ?? '',
      parameters: isApi ? params : original.parameters ?? null,
      headers: isApi ? headers : original.headers ?? null,
      function: isApi ? original.function ?? '' : v.functionCode,
      enabled: original.enabled !== false && original.enabled !== 0,
    });
  }
}
