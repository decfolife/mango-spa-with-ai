import { NgModule } from '@angular/core';
import { DashboardCardComponent } from './card/dashboard-card.component';
import { DxLoadPanelModule } from 'devextreme-angular';
import {
  ButtonModule,
  CardModule,
  DropdownModule,
  ModalModule,
  SimpleGridModule,
} from '@mango/ui-shared/lib-ui-elements';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CremPivotTableModule } from 'libs/ui-shared/lib-ui-elements/src/lib/crem-pivot-table/crem-pivot-table.module';
import { DataService } from '../../services/data.service';
import { DashboardService } from '../../services/dashboard.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { ColumnLimitComponent } from './modal/column-limit/column-limit.component';
import { GenericErrorComponent } from './modal/genericError/genericError.component';
import { UserSettingsComponent } from './modal/user-settings/user-settings.component';
import { ToastComponent } from '@mango/ui-shared/lib-ui-elements';
import { AccountingToastService } from '@accounting-summary/services/accounting-toast.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@NgModule({
  declarations: [
    DashboardCardComponent,
    ColumnLimitComponent,
    GenericErrorComponent,
    UserSettingsComponent,
  ],
  imports: [
    CommonModule,
    ButtonModule,
    DxLoadPanelModule,
    DropdownModule,
    SimpleGridModule,
    CremPivotTableModule,
    ModalModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    FontAwesomeModule,
    MatDialogModule,
    CardModule,
    MatSlideToggleModule,
    FormsModule,
    DragDropModule,
    ModalModule,
    ToastComponent,
    ToastModule,
  ],
  providers: [
    DataService,
    DashboardService,
    AccountingToastService,
    MessageService,
  ],
  exports: [DashboardCardComponent],
})
export class DashboardModule {}
