import { CommonModule } from '@angular/common';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DropdownModule } from '@mango/ui-shared/lib-ui-elements';
import {
  DxFormModule,
  DxListModule,
  DxSelectBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxValidationSummaryModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { InputComponent } from '../input';
import { DatePickerModule } from '../date-picker';
import { ToggleSliderComponent } from '../toggle-slider/toggle-slider.component';
import { HierarchyDropdownModule } from '../hierarchy-dropdown';
import { DynamicFormComponent } from './dynamic-form.component';
import { CheckBoxComponent } from '../checkbox';

@NgModule({
  imports: [
    CommonModule,
    DxListModule,
    DxSelectBoxModule,
    DxTextAreaModule,
    DxTextBoxModule,
    DxFormModule,
    DropdownModule,
    DatePickerModule,
    HierarchyDropdownModule,
    DxValidatorModule,
    DxValidationSummaryModule,
    MatSlideToggleModule,
    ToggleSliderComponent,
    CheckBoxComponent,
    InputComponent,
  ],
  declarations: [DynamicFormComponent],
  schemas: [NO_ERRORS_SCHEMA],
  exports: [DynamicFormComponent],
})
export class DynamicFormModule {}
