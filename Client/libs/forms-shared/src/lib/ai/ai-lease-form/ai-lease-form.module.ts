import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { DxDataGridModule } from 'devextreme-angular';
import {
  ButtonModule,
  DatePickerModule,
  FieldHistoryComponent,
  IconModule,
  InputComponent,
  InputLabelComponent,
  SkeletonModule,
  PageHeaderComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { AiLeaseFormComponent } from './ai-lease-form.component';
import { AiFormSectionComponent } from './ai-form-section/ai-form-section.component';

@NgModule({
  declarations: [AiLeaseFormComponent, AiFormSectionComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    DxDataGridModule,
    ButtonModule,
    DatePickerModule,
    FieldHistoryComponent,
    IconModule,
    InputComponent,
    InputLabelComponent,
    SkeletonModule,
    PageHeaderComponent,
  ],
  exports: [AiLeaseFormComponent],
})
export class AiLeaseFormModule {}
