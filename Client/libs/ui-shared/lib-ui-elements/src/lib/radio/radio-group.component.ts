import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CremRadioService } from './radio.service';

@Component({
  selector: 'crem-radio-group',
  imports: [CommonModule],
  providers: [
    CremRadioService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CremRadioGroupComponent),
      multi: true,
    },
  ],
  template: `<ng-content></ng-content>`,
  preserveWhitespaces: false,
  standalone: true,
  host: {
    '[attr.role]': '"radiogroup"',
    '[attr.aria-labelledby]': 'name',
  },
})
export class CremRadioGroupComponent
  implements ControlValueAccessor, OnInit, OnChanges, OnDestroy
{
  @Input() name: string = null;
  @Input() disabled = false;

  @Output() change = new EventEmitter<any>();

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  value: any;
  subs: Subscription[] = [];

  constructor(private radioService: CremRadioService) {}

  ngOnInit(): void {
    this.subs.push(this.valueChangeListener().subscribe());
  }

  valueChangeListener(): Observable<any> {
    return this.radioService.selected$.pipe(
      tap((value) => {
        if (this.value !== value) {
          this.value = value;
          this.onChange(this.value);
          this.onTouched();
          this.change.emit(this.value);
        }
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { name, disabled } = changes;
    if (name) {
      this.radioService.setName(this.name);
      this.onTouched();
    }
    if (disabled) {
      this.radioService.setDisabled(this.disabled);
      this.onTouched();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = this.disabled || isDisabled;
    this.radioService.setDisabled(this.disabled);
  }

  writeValue(value: any): void {
    this.value = value;
    this.radioService.select(value);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
