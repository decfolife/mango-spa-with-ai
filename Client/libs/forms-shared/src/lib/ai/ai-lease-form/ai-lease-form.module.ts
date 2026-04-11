import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DxDataGridModule } from 'devextreme-angular';
import {
  ButtonModule,
  DatePickerModule,
  DropdownModule,
  FieldHistoryComponent,
  IconModule,
  InputComponent,
  InputLabelComponent,
  SkeletonModule,
  PageHeaderComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { FormWizardService } from '@micro-components/services/form-wizard.service';
import { AiLeaseFormComponent } from './ai-lease-form.component';
import { AiFormSectionComponent } from './ai-form-section/ai-form-section.component';
import { AiSidebarModule } from '../ai-sidebar/ai-sidebar.module';

@NgModule({
  declarations: [AiLeaseFormComponent, AiFormSectionComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatMenuModule,
    DxDataGridModule,
    ButtonModule,
    DatePickerModule,
    DropdownModule,
    FieldHistoryComponent,
    IconModule,
    InputComponent,
    InputLabelComponent,
    SkeletonModule,
    PageHeaderComponent,
    AiSidebarModule,
  ],
  providers: [FormWizardService],
  exports: [AiLeaseFormComponent],
})
export class AiLeaseFormModule {}
