import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LibDataModelsModule } from '@mango/data-models/lib-data-models';
import {
  DxCheckBoxComponent,
  DxCheckBoxModule,
  DxValidatorModule,
} from 'devextreme-angular';

@Component({
  selector: 'crem-check-box',
  templateUrl: './check-box.component.html',
  styleUrls: ['./check-box.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    LibDataModelsModule,
    DxCheckBoxModule,
    DxValidatorModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: CheckBoxComponent,
    },
  ],
})
export class CheckBoxComponent implements ControlValueAccessor, AfterViewInit {
  @Input() value = false;
  @Input() elementAttr: string;
  @Input() disabled = false;
  @Output() changeEvent = new EventEmitter();
  @Output() enterKeyEvent = new EventEmitter();
  @Output() initialized = new EventEmitter<DxCheckBoxComponent>();
  @ViewChild(DxCheckBoxComponent, { static: false })
  checkBox: DxCheckBoxComponent;

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  /**
   *
   * @ignore
   */
  ngAfterViewInit() {
    this.checkBox.instance.registerKeyHandler('enter', () => {
      this.onEnterKey();
    });
  }

  /**
   *
   * @ignore
   */
  onValueChanged(event) {
    this.changeEvent?.emit(event);
    this.onChange(this.value);
    this.onTouched();
  }

  /**
   *
   * @ignore
   */
  onEnterKey() {
    this.value = !this.value;
    this.enterKeyEvent?.emit(this.value);
    this.onChange(this.value);
    this.onTouched();
  }

  /**
   *
   * @ignore
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   *
   * @ignore
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   *
   * @ignore
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   *
   * @ignore
   */
  writeValue(value: boolean): void {
    this.value = value || false;
  }
}
