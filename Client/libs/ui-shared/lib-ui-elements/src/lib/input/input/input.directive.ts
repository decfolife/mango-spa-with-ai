import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2,
} from '@angular/core';
import { NgControl, Validators, FormControl } from '@angular/forms';

@Directive({
  selector: '[inputStateClass]',
  standalone: true,
})
export class InputStateDirective {
  @Input('inputStateClass') inputType?: string;

  private isFocused = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private control: NgControl
  ) {}

  @HostListener('focus') onFocus() {
    this.isFocused = true;
    this.renderer.addClass(this.el.nativeElement, 'focused');
    this.renderer.removeClass(this.el.nativeElement, 'touched-out');
    this.renderer.removeClass(this.el.nativeElement, 'error');
  }

  @HostListener('blur') onBlur() {
    this.isFocused = false;
    const isTouched = this.control?.control?.touched;
    const value = this.control?.control?.value;

    this.renderer.removeClass(this.el.nativeElement, 'focused');

    if (isTouched) {
      this.renderer.addClass(this.el.nativeElement, 'touched-out');
    }

    switch (this.inputType) {
      case 'email': {
        if (value && value !== '' && !this.isValidEmail(value)) {
          this.renderer.addClass(this.el.nativeElement, 'error');
        } else {
          this.renderer.removeClass(this.el.nativeElement, 'error');
        }
        break;
      }
    }
  }

  private isValidEmail(value: string): boolean {
    if (!value) {
      return false;
    }
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
  }
}
