import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AccordionComponent } from './accordion.component';

import { IconModule } from '../icon';
import { CremPipesModule } from 'libs/core-shared/src/lib/pipes/pipes.module';
import { CremDataIdDirective } from '../../../../../core-shared/src/lib/directives/data-id.directive';

@NgModule({
  declarations: [AccordionComponent],
  imports: [CommonModule, IconModule, CremPipesModule, CremDataIdDirective],
  exports: [AccordionComponent],
})
export class AccordionModule {}
