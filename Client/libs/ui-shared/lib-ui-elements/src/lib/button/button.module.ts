import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ButtonComponent } from './button.component';

import { IconModule } from '../icon';
import { CremDataIdDirective } from '../../../../../core-shared/src/lib/directives/data-id.directive';

@NgModule({
  declarations: [ButtonComponent],
  imports: [CommonModule, IconModule, CremDataIdDirective],
  exports: [ButtonComponent, CremDataIdDirective],
})
export class ButtonModule {}
