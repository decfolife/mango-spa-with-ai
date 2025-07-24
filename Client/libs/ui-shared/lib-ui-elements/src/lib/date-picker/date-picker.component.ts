import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DxDateBoxComponent, DxValidatorComponent } from 'devextreme-angular';
import { CremValidatedComponent } from '../base';
import { CremFormControlStatusType } from '@mango/data-models/lib-data-models';

/**
 * Date Picker Input Field: Primarily to be used as part of the DynamicForms component
 * @export
 * @class DatePickerComponent
 * @param {boolean} showDefaultValidationTooltip - Show DevExtreme default tooltip,
 */
@Component({
  selector: 'crem-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: DatePickerComponent,
    },
    {
      provide: CremValidatedComponent,
      useExisting: DatePickerComponent,
    },
  ],
})
export class DatePickerComponent
  extends CremValidatedComponent
  implements ControlValueAccessor
{
  @Input() value: string;
  @Input() dateFormat = 'MM/dd/yyyy';
  @Input() invalidDateMessage: string;
  @Input() useMaskBehavior = true;
  @Input() showClearButton = false;
  @Input() isRequired = false;
  @Input() inputId: string;
  @Input() inputWrapperClass?: string = 'dateBoxPopupWrapperClass';
  @Input() min: Date;
  @Input() max: Date;
  @Input() disabled: boolean;
  @Input() placeholderText = '';
  @Input() showDefaultValidationTooltip?: boolean = true;
  @Input() dataKey: string;
  @Input() status: CremFormControlStatusType = 'default';
  @Input() formControlName!: string;
  @Input() valueChangeEvent = 'change';
  @Output() changeEvent = new EventEmitter();
  @Output() initialized = new EventEmitter();
  @Output() blur = new EventEmitter();

  @ViewChild('DateBoxValidator', { static: false })
  dateBoxValidator: DxValidatorComponent;
  @ViewChild(DxDateBoxComponent) datePickerComponent: DxDateBoxComponent;

  isCalendarOpen: boolean = false;
  onChange = (value: string) => {};
  onTouch = () => {};

  onContentReady(e) {
    const input = e.element.querySelector('.dx-texteditor-input');
    if (input) {
      input.addEventListener('input', (event: Event) => {
        const value = (event.target as HTMLInputElement).value;
        this.onChange(value);
      });
    }
  }

  public onValueChanged(event: any) {
    this.onChange(event.value);
    this.onTouch();
    this.changeEvent?.emit(event);
  }

  public onInitialized(event) {
    this.initialized?.emit(event);
  }

  onKeyDown(e: any) {
    const key = e.event?.key;
    if (!this.isCalendarOpen && key === ' ') {
      e.event.preventDefault();
      e.component.open();
    } else if (this.isCalendarOpen && key === 'Escape') {
      e.event.preventDefault();
      e.component.close();
    }
  }

  onBlur(e) {
    this.blur.emit(e);
    this.onTouch();
  }

  onCalendarOpened() {
    this.isCalendarOpen = true;
  }

  onCalendarClosed() {
    this.isCalendarOpen = false;
  }

  public validate(): boolean {
    const isValid = this.dateBoxValidator?.instance?.validate()?.isValid;
    return isValid;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  writeValue(value: string): void {
    this.value = value;
  }

  focusDatePicker() {
    this.datePickerComponent.instance.focus();
  }

  cremSharedComponentValidator() {
    return this.status === 'error';
  }
}
