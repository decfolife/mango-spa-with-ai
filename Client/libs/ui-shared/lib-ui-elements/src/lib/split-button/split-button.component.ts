import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { ButtonModule } from '../button';

@Component({
  selector: 'crem-split-button',
  templateUrl: './split-button.component.html',
  styleUrls: ['./split-button.component.scss'],
  standalone: true,
  imports: [CommonModule, ButtonModule],
})
export class SplitButtonComponent {
  @Input() text: string;
  @Input() icon: string;
  @Input() disabled: boolean = false;
  @Input() options: string[] = [];
  @Input() dropdownPosition: 'left' | 'right' = 'right';
  @Input() color: 'primary' | 'secondary' | 'warning' | 'danger' = 'primary';
  @Input() btnStyle: 'flat' | 'basic' | 'stroked' = 'flat';
  @Input() iconAnimation?: string;
  @Input() optionsBtnAriaLabel?: string = 'Show Options';

  @Output() mainButtonClick = new EventEmitter<boolean>();
  @Output() selectedOption = new EventEmitter<string>();

  dropDownOpen = false;

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropDownOpen = !this.dropDownOpen;
  }

  @HostListener('document:click')
  onClickOutside() {
    this.dropDownOpen = false;
  }

  onMainButtonClick() {
    this.mainButtonClick.emit(true);
  }

  onOptionSelect(event) {
    this.dropDownOpen = false;
    this.selectedOption.emit(event.target.textContent);
  }
}
