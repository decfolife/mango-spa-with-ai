import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DxDataGridModule } from 'devextreme-angular';
import { SkeletonModule } from '@mango/ui-shared/lib-ui-elements';
import { PageHeaderComponent } from '@mango/ui-shared/lib-ui-elements';
import { AiLeaseFormComponent } from './ai-lease-form.component';
import { AiFormSectionComponent } from './ai-form-section/ai-form-section.component';

@NgModule({
  declarations: [AiLeaseFormComponent, AiFormSectionComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DxDataGridModule,
    SkeletonModule,
    PageHeaderComponent,
  ],
  exports: [AiLeaseFormComponent],
})
export class AiLeaseFormModule {}
