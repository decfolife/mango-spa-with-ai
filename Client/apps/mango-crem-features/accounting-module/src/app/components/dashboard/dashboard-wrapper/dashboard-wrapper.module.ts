import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardWrapperComponent } from './dashboard-wrapper.component';
import { DashboardModule } from '../accounting-dashboard.module';
import {
  ButtonModule,
  CardModule,
  DropdownModule,
  IconModule,
  SkeletonModule,
} from '@mango/ui-shared/lib-ui-elements';

import { MangoDisclosureViewComponent } from '../view/disclosure-dashboard-view.component';

import { WorkflowAndAlertsComponent } from '../views/workflow-and-alerts/workflow-and-alerts.component';
import { InAppDisclosureService } from '@accounting-dashboard/services/in-app-disclosure.service';
import { CremPivotTableModule } from 'libs/ui-shared/lib-ui-elements/src/lib/crem-pivot-table/crem-pivot-table.module';
import { DxPivotGridModule } from 'devextreme-angular/ui/pivot-grid';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LoaderModule } from '@mango/ui-shared/lib-ui-elements';
import { IADCardComponent } from '../IADCard/iad-card.component';
import { DxChartModule, DxDataGridModule } from 'devextreme-angular';

@NgModule({
  declarations: [
    DashboardWrapperComponent,
    MangoDisclosureViewComponent,
    WorkflowAndAlertsComponent,
    IADCardComponent,
  ],
  imports: [
    CommonModule,
    DashboardModule,
    DropdownModule,
    DxChartModule,
    DxPivotGridModule,
    DxDataGridModule,
    ButtonModule,
    CardModule,
    DragDropModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    LoaderModule,
    IconModule,
    CremPivotTableModule,
    SkeletonModule,
  ],
  providers: [InAppDisclosureService],
  exports: [DashboardWrapperComponent],
})
export class DashboardWrapperModule {}
