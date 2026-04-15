import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type CremBlockUIVariant = 'light' | 'dark' | 'transparent';
export type CremBlockUISize = 'sm' | 'md' | 'lg';
export type CremBlockUISpinnerPosition = 'component' | 'viewport';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'crem-block-ui',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './block-ui.component.html',
  styleUrls: ['./block-ui.component.scss'],
})
export class CremBlockUIComponent implements OnChanges {
  @Input() isBlocking = false;
  @Input() message = 'Please wait';
  @Input() variant: CremBlockUIVariant = 'dark';
  @Input() size: CremBlockUISize = 'md';
  @Input() spinnerPosition: CremBlockUISpinnerPosition = 'component';

  _visible = false;

  private _previousFocus: Element | null = null;

  @HostBinding('attr.aria-busy')
  get _ariaBusy(): string | null {
    return this._visible ? 'true' : null;
  }

  constructor(private _cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('isBlocking' in changes) {
      this._applyBlocking(changes['isBlocking'].currentValue as boolean);
    }
  }

  private _applyBlocking(blocking: boolean): void {
    if (!blocking) {
      this._visible = false;
      this._cdr.markForCheck();
      if (this._previousFocus instanceof HTMLElement) {
        const target = this._previousFocus;
        setTimeout(() => target.focus({ preventScroll: true }));
      }
      this._previousFocus = null;
      return;
    }

    this._previousFocus = document.activeElement;
    this._visible = true;
    this._cdr.markForCheck();
  }
}
