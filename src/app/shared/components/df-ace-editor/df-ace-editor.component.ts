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
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AceEditorMode } from '../../types/scripts';
import { DfThemeService } from '../../services/df-theme.service';
import { AsyncPipe } from '@angular/common';
@Component({
  selector: 'df-ace-editor',
  templateUrl: './df-ace-editor.component.html',
  styleUrls: ['./df-ace-editor.component.scss'],
  standalone: true,
  imports: [AsyncPipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DfAceEditorComponent),
      multi: true,
    },
  ],
})
export class DfAceEditorComponent
  implements AfterViewInit, OnChanges, OnDestroy, ControlValueAccessor
{
  @Input() mode: AceEditorMode = AceEditorMode.TEXT;
  @Input() readonly = false;
  @Input() value: string;
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('editor') elementRef: ElementRef<HTMLElement>;

  private editor: ace.Ace.Editor;

  onChange: (value: string) => void;
  onTouched: () => void;
  themeService = inject(DfThemeService);
  isDarkMode = this.themeService.darkMode$;

  ngAfterViewInit(): void {
    this.init(this.elementRef, this.mode);
  }

  writeValue(value: string): void {
    this.value = value;
    if (this.editor) {
      this.editor.setValue(value);
    }
  }

  init(
    elementRef: ElementRef<HTMLElement>,
    mode: AceEditorMode = AceEditorMode.TEXT
  ): void {
    ace.config.set('basePath', '/assets/ace-builds');
    this.editor = ace.edit(elementRef.nativeElement, {
      mode: `ace/mode/${this.getMode(mode)}`,
      value: this.value,
      fontSize: 12,
      showPrintMargin: false,
      showGutter: true,
      highlightActiveLine: true,
      tabSize: 2,
      readOnly: false,
      maxLines: 50,
    });
    this.editor.renderer.attachToShadowRoot();
    this.editor.addEventListener('change', () => {
      this.valueChange.emit(this.editor.getValue());
      if (this.onChange) {
        this.onChange(this.editor.getValue());
      }
      if (this.onTouched) {
        this.onTouched();
      }
    });
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // setDisabledState(isDisabled: boolean): void {
  //   this.editor.setReadOnly(false);
  // if (!this.editor) return;
  // isDisabled ? this.editor.setReadOnly(true) : this.editor.setReadOnly(false);
  // }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.editor) return;
    if (changes['mode']) {
      this.editor.session.setMode(
        `ace/mode/${this.getMode(changes['mode'].currentValue)}`
      );
    }
    if (changes['value']) {
      this.setValue(changes['value'].currentValue);
    }
    // if (changes['readonly']) {
    //   this.setDisabledState(changes['readonly'].currentValue);
    // }
  }

  setValue(value: string): void {
    this.editor.setValue(value);
  }

  ngOnDestroy(): void {
    if (this.editor) this.editor.destroy();
  }

  getMode(mode: string) {
    if (mode === 'nodejs') {
      return AceEditorMode.JAVASCRIPT;
    }
    if (mode === 'python3') {
      return AceEditorMode.PYTHON;
    }
    return mode;
  }
}
