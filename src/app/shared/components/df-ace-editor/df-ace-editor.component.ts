import { edit, Ace } from 'ace-builds';
import 'ace-builds/src-min-noconflict/theme-github_dark';
import 'ace-builds/src-min-noconflict/theme-github';
import 'ace-builds/src-min-noconflict/mode-json';
import 'ace-builds/src-min-noconflict/mode-yaml';
import 'ace-builds/src-min-noconflict/mode-text';
import 'ace-builds/src-min-noconflict/mode-javascript';
import 'ace-builds/src-min-noconflict/mode-php';
import 'ace-builds/src-min-noconflict/mode-python';
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
} from '@angular/core';

type AceEditorMode = 'json' | 'yaml' | 'text' | 'javascript' | 'php' | 'python';

@Component({
  selector: 'df-ace-editor',
  templateUrl: './df-ace-editor.component.html',
  styleUrls: ['./df-ace-editor.component.scss'],
  standalone: true,
})
export class DfAceEditorComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() mode: AceEditorMode = 'text';
  @Input() readonly = false;
  @Input() value: string;
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('editor') elementRef: ElementRef<HTMLElement>;

  private editor: Ace.Editor;

  ngAfterViewInit(): void {
    this.init(this.elementRef, this.mode);
  }

  init(
    elementRef: ElementRef<HTMLElement>,
    mode: AceEditorMode = 'text'
  ): void {
    this.editor = edit(elementRef.nativeElement, {
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
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.editor) return;
    if (changes['mode']) {
      this.editor.session.setMode(`ace/mode/${changes['mode'].currentValue}`);
    }
    if (changes['value']) {
      this.editor.setValue(changes['value'].currentValue);
    }
  }

  ngOnDestroy(): void {
    if (this.editor) this.editor.destroy();
  }
}
