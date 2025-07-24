import { Component, ElementRef, HostListener, Input } from '@angular/core';
import { NgClass, CommonModule } from '@angular/common';
import { PillType } from '@mango/data-models/lib-data-models';
import { IconModule } from '../icon';

@Component({
  selector: 'crem-pill',
  standalone: true,
  imports: [NgClass, IconModule, CommonModule],
  templateUrl: './pill.component.html',
  styleUrls: ['./pill.component.scss'],
})
export class CremPillComponent {
  @Input() text: string | number;
  @Input() type: PillType;
  @Input() titleOnHover?: string = '';
  @Input() displayLockIcon?: boolean = false;
  @Input() lockedMessage?: string = '';
  showLockedMessage = false;

  constructor(private elementRef: ElementRef) {}

  toggleLockedMessage() {
    this.showLockedMessage = !this.showLockedMessage;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showLockedMessage = false;
    }
  }
}
