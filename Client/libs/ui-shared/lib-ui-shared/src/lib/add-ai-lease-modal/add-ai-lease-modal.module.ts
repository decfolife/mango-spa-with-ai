import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import {
  ButtonModule,
  ModalModule,
  DropdownModule,
  CremFormsModule,
  InputComponent,
  DatePickerModule,
} from '@mango/ui-shared/lib-ui-elements';
import {
  DxButtonModule,
  DxSelectBoxModule,
  DxTextAreaModule,
  DxDateBoxModule,
  DxFormModule,
  DxLoadPanelModule,
} from 'devextreme-angular';
import { AddLeaseModalModule } from '../add-lease-modal/add-lease-modal.module';
import { AddAiLeaseModalComponent } from './add-ai-lease-modal.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatIconModule,
    ButtonModule,
    ModalModule,
    DropdownModule,
    CremFormsModule,
    InputComponent,
    DatePickerModule,
    DxButtonModule,
    DxSelectBoxModule,
    DxTextAreaModule,
    DxDateBoxModule,
    DxFormModule,
    DxLoadPanelModule,
    AddLeaseModalModule,
  ],
  declarations: [AddAiLeaseModalComponent],
  exports: [AddAiLeaseModalComponent],
})
export class AddAiLeaseModalModule {}
