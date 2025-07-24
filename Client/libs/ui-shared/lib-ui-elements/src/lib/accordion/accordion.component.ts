/* eslint-disable @angular-eslint/component-selector */
import { Component, Input } from '@angular/core';
import { PendoDataId } from '../../../../../core-shared/src/lib/directives/data-id';

@Component({
  selector: 'crem-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.scss'],
})
export class AccordionComponent extends PendoDataId {
  @Input() id: string | number;
  @Input() isOpen?: boolean = false;
  @Input() title?: string;
  @Input() subTitle?: string;
  @Input() contentPadding?: boolean = false;
}
