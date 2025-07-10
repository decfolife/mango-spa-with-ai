import {
  AfterViewInit,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

/* eslint-disable @angular-eslint/component-selector */
import { CommonModule } from '@angular/common';
import { Component, ElementRef, SimpleChanges } from '@angular/core';

import { InputHintComponent } from '../hint';
import { InputLabelComponent } from '../label';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

import { InputState, InputType, LabelPosition } from '../definitions';
import { IconModule } from '../../icon';
import { ErrorTooltipComponent } from '../../error-tooltip';
import { CremValidatedComponent } from '../../base';
import { Subject } from 'rxjs';
import { debounceTime, map, takeUntil, tap } from 'rxjs/operators';
import { CremFormControlStatusType } from '@mango/data-models/lib-data-models';
import { InputStateDirective } from './input.directive';

/**
 * @see https://github.com/JsDaddy/ngx-mask/tree/v16
 *
 * @export
 * @interface InputMask
 */
export interface InputMask {
  mask?: string;
  showMaskTyped?: boolean;
  shownMaskExpression?: string;
  allowNegativeNumbers?: boolean;
  dropSpecialCharacters?: boolean;
  thousandSeparator?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * Input: Defined to hold all the common elements, this is the entry point
 * @param {string} state: Defines the overall state of the input, E.g. active, disable, error.
 * The same 'state' is passing down to input and hint depending on the need
 * It allows to control sub-components like hint and input from a single parameter.
 */
@Component({
  selector: 'crem-input',
  standalone: true,
  imports: [
    CommonModule,
    InputLabelComponent,
    InputHintComponent,
    FormsModule,
    IconModule,
    ErrorTooltipComponent,
    NgxMaskDirective,
    InputStateDirective,
  ],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: InputComponent,
    },
    {
      provide: CremValidatedComponent,
      useExisting: InputComponent,
    },
    provideNgxMask(),
  ],
})
export class InputComponent
  extends CremValidatedComponent
  implements OnInit, OnChanges, AfterViewInit, ControlValueAccessor, OnDestroy
{
  @Input() state?: InputState;
  @Input() showHint?: boolean;
  @Input() showLabel?: boolean;
  @Input() showInfo?: boolean;

  // Global
  @Input() className?: string;

  // Label Component
  @Input() label?: string;
  @Input() labelPosition?: LabelPosition;

  // Input Component
  @Input() inputType?: InputType;
  @Input() dataKey: string;
  @Input() id?: string;
  @Input() value?: string = '';
  @Input() name?: string;
  @Input() placeholder?: string = '';
  @Input() required?: boolean;
  @Input() minLengthField?: number = 0;
  @Input() maxLengthField?: number = 255;
  @Input() allowScrolling?: boolean = false;
  @Input() rows?: number;
  @Input() cols?: number;
  @Input() disabled?: boolean;
  @Input() readOnly?: boolean;
  @Input() minNumber?: number = Number.NEGATIVE_INFINITY;
  @Input() maxNumber?: number = Number.POSITIVE_INFINITY;
  @Input() disallowNegative?: boolean;
  @Input() debounceTime = 0;
  @Input() ariaLabel?: string;
  @Input() status: CremFormControlStatusType = 'default';
  @Input() statusMessage = 'One or more required fields are not valid.';

  /**
   * (Optional) Input Mask
   * @see https://jsdaddy.github.io/ngx-mask
   */
  @Input() mask?: InputMask;

  // Hint Component
  @Input() hintText?: string;

  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();

  @Output() onBlurChange: EventEmitter<string> = new EventEmitter<string>();

  touched = false;

  // Internal
  @HostBinding('class') classes = '';

  @ViewChild('textarea') textarea: ElementRef<HTMLTextAreaElement>;
  @ViewChild('input') input: ElementRef<HTMLInputElement>;
  @ViewChild('inputMask') inputMask: ElementRef<HTMLInputElement>;

  public emailRegex: RegExp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  private inputSubject: Subject<string> = new Subject<string>();
  private destroy$ = new Subject<void>();

  /**
   * @ignore
   */
  onChange = (value: string) => {};

  /**
   * @ignore
   */
  onTouched = () => {};

  @Output() enterKeyEvent: EventEmitter<any> = new EventEmitter<any>();

  constructor(private el: ElementRef) {
    super();
  }

  ngOnInit(): void {
    this.inputSubject
      .pipe(takeUntil(this.destroy$), debounceTime(this.debounceTime))
      .subscribe((event) => {
        this.markAsTouched();
        const value = this.formatInput(event);
        this.valueChange.emit(value);
        this.onChange(value);
      });
  }

  ngAfterViewInit() {
    this.adjustTextareaHeight();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['state'] && changes['state']?.currentValue === 'read-only') {
      this.readOnly = true;
      this.required = false; // Hide required symbol when editing disabled
    }
    if (
      changes['disabled'] &&
      changes['disabled']?.currentValue === 'disabled'
    ) {
      this.disabled = true;
      this.required = false; // Hide required symbol when editing disabled
    }
    this.getCssClasses();
    this.validate();
  }

  /**
   * @ignore
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   * @ignore
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * @ignore
   */
  writeValue(value: string): void {
    this.value = value;
    this.markAsTouched();
    this.valueChange.emit(this.value);
    this.onChange(this.value);
  }

  /**
   * @ignore
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   * @ignore
   */
  markAsTouched() {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
    }
  }

  /**
   * @ignore
   */
  getCssClasses() {
    return {
      'read-only': this.state === 'read-only' || this.readOnly,
      disabled: this.state === 'disabled' || this.disabled,
      warning: this.state === 'warning',
      error: this.state === 'error',
      success: this.state === 'success',
    };
  }

  /**
   *
   * @ignore
   */
  validate(): boolean {
    if (this.required && (!this.value || this.value == '')) {
      return false;
    }
    if (this.inputType == 'email' && !!this.value) {
      return this.emailRegex.test(this.value);
    }
    if (
      this.maxLengthField &&
      !!this.value &&
      this.value.length > this.maxLengthField
    ) {
      return false;
    }
    if (
      this.minLengthField &&
      !!this.value &&
      this.value.length < this.minLengthField
    ) {
      return false;
    }
    if (this.value && !/\S/.test(this.value)) {
      return false;
    }
    return true;
  }

  /**
   *
   * @ignore
   * This method is for backward compatibility support
   */
  reset() {
    this.value = '';
    this.markAsTouched();
    this.valueChange.emit(this.value);
    this.onChange(this.value);
  }

  adjustTextareaHeight() {
    if (this.textarea) {
      const textareaElement = this.textarea.nativeElement;
      if (!this.allowScrolling) {
        textareaElement.style.height = '';
        textareaElement.style.height = `${textareaElement.scrollHeight + 3}px`;
      } else {
        textareaElement.style.overflowY = 'scroll';
      }
    }
  }

  /**
   * @ignore
   */
  onInputChange(event) {
    this.inputSubject.next(event);
  }

  /**
   * @ignore
   */
  onBlur(event) {
    const value = this.formatInput(event);
    this.markAsTouched();
    this.onBlurChange.emit(value);
  }

  private formatInput(event): any {
    let value = event.target.value.trim();
    if (this.inputType === 'number' && this.disallowNegative) {
      const regex = /^(?!0\d)\d*\.?\d{0,4}$/;
      const key = event.data;

      if (!regex.test(value) || key == 'e' || key == 'E') {
        value = value.replace(/[^0-9.]/g, '').replace(/[eE]/g, '');
        const parts = value.split('.');
        if (parts.length > 2) {
          value = parts[0] + '.' + parts.slice(1).join('').slice(0, 4);
        } else if (parts.length === 2) {
          value = parts[0] + '.' + parts[1].slice(0, 4);
        }

        if (value.length > 1 && value[0] === '0' && value[1] !== '.') {
          value = value.replace(/^0+/, '');
        }
        event.target.value = value;
      }
    }

    return value;
  }

  /**
   * @ignore
   * This method is defined in subsequent classes
   */
  focusInputBox() {
    if (this.input && this.input.nativeElement) {
      const el = this.input.nativeElement;
      el.focus();
    }
  }

  focusTextBox() {
    const input =
      this.el.nativeElement.querySelector('input') ||
      this.el.nativeElement.querySelector('textarea');
    if (input) {
      input.focus();
    }
  }

  onEnter(event) {
    this.enterKeyEvent.emit(event);
  }
}
