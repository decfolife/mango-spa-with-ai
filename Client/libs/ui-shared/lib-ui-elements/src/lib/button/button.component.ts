/* eslint-disable @angular-eslint/component-selector */
import {
  Component,
  ContentChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { PendoDataId } from '../../../../../core-shared/src/lib/directives/data-id';

/**
 * Simple button, check Storybook for additional options
 * <example-url>/?path=/docs/components-button--docs&full=1&shortcuts=false&singleStory=true</example-url>
 * @class ButtonComponent
 */
@Component({
  selector: 'crem-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent extends PendoDataId implements OnChanges {
  /**
   * The button id
   * @param {string} [id]
   */
  @Input() id?: string;

  /**
   * The button text
   * @param {string} [textContent]
   */
  @Input() text?: string;

  /**
   * 'flat', 'basic', or 'stroked'
   * @param {string} [btnStyle]
   */
  @Input() btnStyle?: 'flat' | 'basic' | 'stroked';

  /**
   * 'primary', 'secondary', 'warning', or 'danger'
   * @param {string} [color]
   */
  @Input() color?: 'primary' | 'secondary' | 'warning' | 'danger';

  /**
   * Besides the normal sizing, 'big' and 'small' are available.
   * 'small', 'medium', or 'big'
   * @param {string} [size]
   */
  @Input() size?: 'small' | 'medium' | 'big';

  /**
   * For accessibility
   * @param {string} [ariaLabel]
   */
  @Input() ariaLabel?: string;

  /**
   * Disables button
   * @param {boolean} [disabled]
   */
  @Input() disabled?: boolean | null = null;

  /**
   * CSS classes
   * @param {string} [className]
   */
  @Input() className?: string | null = null;

  /**
   * CSS styles
   * @param {string} [styles]
   */
  @Input() styles?: string;
  @ContentChild('childContent') childContentRef: ElementRef;

  /**
   * By default uses FontAwesome, refer to the official docs E.g. 'faUser'
   * @param {string} [icon]
   */
  @Input() icon?: string;

  @Input() iconPack?: string;
  /**
   * Apply a class to the icon for further customization, check crem-icon available params
   * @param {string} [iconClass]
   */
  @Input() iconClass?: string | null = null;

  /**
   * Icon alignment, 'left' or 'right'
   * @param {string} [iconPosition]
   */
  @Input() iconPosition?: 'left' | 'right';
  @Input() iconColor?: string;
  @Input() iconRotate?: string;
  @Input() iconFlip?: string;
  @Input() iconAnimation?: string;
  @Input() iconSize?: string;
  @Input() iconPull?: string;
  @Input() iconFill?: string;
  @Input() iconTransform?: string;
  @Input() ariaHasPopUp?: boolean;
  @Input() ariaExpanded?: boolean;

  /**
   * Prevent text from taking multiple lines
   *
   * @type {boolean}
   * @memberof ButtonComponent
   */
  @Input() noWrap?: boolean;

  /**
   * Deprecated, use the color parameter instead
   * @param {string} [type]
   * @deprecated Added for Backward compatibility on V06
   * @ignore
   */
  @Input() type?: 'primary' | 'secondary' | 'text';

  // Other icon inputs...

  /**
   * Output
   * @param {EventEmitter<void>} buttonClick
   */
  @Output() buttonClick: EventEmitter<void> = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['btnStyle']?.currentValue === undefined) {
      this.btnStyle = 'flat';
    }
    if (changes['size']?.currentValue === undefined) {
      this.size = 'medium';
    }
    if (changes['iconPosition']?.currentValue === undefined) {
      this.iconPosition = 'left';
    }
  }

  /**
   * Get CSS classes
   * @returns {object} CSS classes object
   */
  public getCssClasses() {
    return {
      // Btn Style Type
      'btn-flat': this.btnStyle === 'flat',
      'btn-basic': this.btnStyle === 'basic' || this.type === 'text', // @deprecated type input
      'btn-stroked': this.btnStyle === 'stroked',
      // Btn Color
      'btn-primary': this.color === 'primary' || this.type === 'primary', // @deprecated type input
      'btn-secondary': this.color === 'secondary' || this.type === 'secondary', // @deprecated type input
      'btn-warning': this.color === 'warning',
      'btn-danger': this.color === 'danger',
      // Btn Size
      'btn-small': this.size === 'small',
      'btn-big': this.size === 'big',
      // Btn Icon Position
      'btn-icon-left': this.iconPosition === 'left',
      'btn-icon-right': this.iconPosition === 'right',
      // Text
      'no-text': this.text === undefined || this.text === '',
      // Text Wrap
      'text-nowrap': this.noWrap ?? false,
    };
  }

  /**
   * Handle click event
   */
  handleClick() {
    this.buttonClick.emit();
  }
}
