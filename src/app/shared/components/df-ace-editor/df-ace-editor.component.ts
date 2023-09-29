import * as ace from 'ace-builds';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '@ngneat/transloco';
import { readAsText } from '../../utilities/file';
import { NgFor, NgIf } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DfScriptsGithubDialogComponent } from '../df-scripts-github-dialog/df-scripts-github-dialog.component';

export enum AceEditorMode {
  JSON = 'json',
  YAML = 'yaml',
  TEXT = 'text',
  NODEJS = 'javascript',
  PHP = 'php',
  PYTHON = 'python',
  PYTHON3 = 'python',
}

@Component({
  selector: 'df-ace-editor',
  templateUrl: './df-ace-editor.component.html',
  styleUrls: ['./df-ace-editor.component.scss'],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DfAceEditorComponent),
      multi: true,
    },
  ],
  imports: [
    MatButtonModule,
    TranslocoPipe,
    NgIf,
    MatFormFieldModule,
    MatSelectModule,
    NgFor,
    FontAwesomeModule,
    MatDialogModule,
  ],
})
export class DfAceEditorComponent
  implements AfterViewInit, OnChanges, OnDestroy, ControlValueAccessor
{
  @Input() mode: AceEditorMode;
  @Input() readonly = false;
  @Input() upload = true;
  @Input() github = true;
  @Input() service = true;
  @Input() value: string;
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('editor') elementRef: ElementRef<HTMLElement>;

  faUpload = faUpload;
  faGitHub = faGithub;

  types = [
    {
      label: 'scriptTypes.nodejs',
      value: AceEditorMode.NODEJS,
      extension: 'js',
    },
    {
      label: 'scriptTypes.php',
      value: AceEditorMode.PHP,
      extension: 'php',
    },
    {
      label: 'scriptTypes.python',
      value: AceEditorMode.PYTHON,
      extension: 'py',
    },
  ];

  private editor: ace.Ace.Editor;

  constructor(public dialog: MatDialog) {}

  onChange: (value: string) => void;
  onTouched: () => void;

  ngAfterViewInit(): void {
    this.init(this.elementRef, this.mode);
  }

  writeValue(value: string): void {
    this.value = value;
  }

  init(
    elementRef: ElementRef<HTMLElement>,
    mode: AceEditorMode = AceEditorMode.TEXT
  ): void {
    ace.config.set('basePath', '/assets/ace-builds');
    this.editor = ace.edit(elementRef.nativeElement, {
      mode: `ace/mode/${mode}`,
      value: this.value,
      fontSize: 12,
      showPrintMargin: false,
      showGutter: true,
      highlightActiveLine: true,
      tabSize: 2,
      readOnly: this.readonly,
      maxLines: 50,
    });
    this.editor.renderer.attachToShadowRoot();
    this.editor.addEventListener('change', () => {
      this.valueChange.emit(this.editor.getValue());
      this.onChange(this.editor.getValue());
      this.onTouched();
    });
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (!this.editor) return;
    isDisabled ? this.editor.setReadOnly(true) : this.editor.setReadOnly(false);
  }

  setMode(mode: string): void {
    this.editor.session.setMode(`ace/mode/${mode}`);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.editor) return;
    if (changes['mode']) {
      this.setMode(changes['mode'].currentValue);
    }
    if (changes['value']) {
      this.editor.setValue(changes['value'].currentValue);
    }
  }

  ngOnDestroy(): void {
    if (this.editor) this.editor.destroy();
  }

  handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      readAsText(input.files[0]).subscribe(value => {
        this.editor.setValue(value);
      });
    }
  }

  handleGithubImport() {
    const dialogRef = this.dialog.open(DfScriptsGithubDialogComponent);

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.editor.setValue(window.atob(res.data.content));
      }
    });
  }
}
