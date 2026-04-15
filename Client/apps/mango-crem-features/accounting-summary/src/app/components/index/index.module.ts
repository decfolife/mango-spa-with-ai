import { CommonModule, DatePipe } from '@angular/common';

import { NgModule } from '@angular/core';

import { AccountsSummaryComponent } from '@accounting-summary/components/accounts-summary/accounts-summary.component';
import { TitleComponent } from '@accounting-summary/components/title/title.component';
import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import {
  ButtonModule,
  DatePickerModule,
  DropdownModule,
  IconModule,
  ToggleSliderComponent,
  InputComponent,
  AccordionModule,
  ModalModule,
  CremPopupComponent,
  CremTabsComponent,
  CremTabItemComponent,
  CremPopoverComponent,
  SearchComponent,
  CremBlockUIComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { HttpClientModule } from '@angular/common/http';
import {
  DxDataGridModule,
  DxDropDownBoxModule,
  DxTooltipModule,
  DxPopupModule,
  DxScrollViewModule,
  DxSelectBoxModule,
  DxTemplateModule,
  DxTabPanelModule,
  DxLoadPanelModule,
} from 'devextreme-angular';
import { IndexRoutingModule } from './index-routing.module';
import { LeaseAlertsModule } from '@micro-components/lease-alerts/lease-alerts.module';
import { IndexComponent } from './index.component';
import { AddEventComponent } from '../add-event/add-event.component';
import { EventsDetailSectionComponent } from '../events-detail-section/events-detail-section.component';
import { AmortizationDetailSectionComponent } from '../amortization-detail-section/amortization-detail-section.component';
import { PaymentsDetailSectionComponent } from '@accounting-summary/components/payments-detail-section/payments-detail-section.component';
import { JeProcessingInfoComponent } from '../amortization-detail-section/je-retro-popup/je-processing-info/je-processing-info.component';
import { JePaymentInfoComponent } from '../amortization-detail-section/je-retro-popup/je-payment-info/je-payment-info.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { CardModule } from '@mango/ui-shared/lib-ui-elements';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { FormattingService } from '@accounting-summary/services/formatting.service';
import { WorkflowDropdownComponent } from '../workflow-dropdown/workflow-dropdown.component';
import { WorkflowHistoryPopupComponent } from '../workflow-history-popup/workflow-history-popup.component';
import { TimelineModule } from 'primeng/timeline';
import { RetrospectiveAdjustmentInfoComponent } from '../amortization-detail-section/je-retro-popup/retrospective-adjustment-info/retrospective-adjustment-info.component';
import { JeRetroPopupComponent } from '../amortization-detail-section/je-retro-popup/je-retro-popup.component';
import { ScheduleDetailsComponent } from '../add-event/schedule-details/schedule-details.component';
import { ClassificationTestsComponent } from '../add-event/classification-tests/classification-tests.component';
import { InputLabelComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/input';
import { ResidualValueComponent } from '../add-event/residual-value/residual-value.component';
import { FinancialCardComponent } from '../add-event/financial-card/financial-card.component';
import { CheckBoxComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/checkbox';
import { PaymentsGridComponent } from '../add-event/payments-grid/payments-grid.component';
import { ScheduleTransactionsPopupComponent } from '../add-event/payments-grid/schedule-transactions-popup/schedule-transactions-popup.component';
import { AddEditOtherChargeModalComponent } from '../add-event/payments-grid/add-edit-other-charge-modal/add-edit-other-charge-modal.component';
import { EditRouAssetComponent } from '../events-detail-section/edit-rou-asset/edit-rou-asset.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AddEditScheduleService } from '@accounting-summary/services/add-edit-schedule.service';
import { AccountingToastService } from '@accounting-summary/services/accounting-toast.service';
import { AccountingAdaDirective } from '@accounting-summary/shared/directives/accounting-ada.directive';
import { SplitButtonComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/split-button/split-button.component';

@NgModule({
  declarations: [
    IndexComponent,
    AccountsSummaryComponent,
    TitleComponent,
    AddEventComponent,
    EventsDetailSectionComponent,
    PaymentsDetailSectionComponent,
    WorkflowDropdownComponent,
    AmortizationDetailSectionComponent,
    JeRetroPopupComponent,
    JeProcessingInfoComponent,
    JePaymentInfoComponent,
    WorkflowHistoryPopupComponent,
    RetrospectiveAdjustmentInfoComponent,
    ScheduleDetailsComponent,
  ],

  imports: [
    CommonModule,
    MatExpansionModule,
    CardModule,
    IndexRoutingModule,
    IconModule,
    HttpClientModule,
    DxTooltipModule,
    DxDropDownBoxModule,
    DxDataGridModule,
    DxSelectBoxModule,
    ButtonModule,
    LeaseAlertsModule,
    DropdownModule,
    MatIconModule,
    MatMenuModule,
    DxPopupModule,
    DxScrollViewModule,
    FormsModule,
    DxTabPanelModule,
    DxTemplateModule,
    DxLoadPanelModule,
    TimelineModule,
    InputLabelComponent,
    DatePickerModule,
    CheckBoxComponent,
    ReactiveFormsModule,
    InputComponent,
    ToggleSliderComponent,
    ClassificationTestsComponent,
    FinancialCardComponent,
    AccordionModule,
    ResidualValueComponent,
    PaymentsGridComponent,
    AddEditOtherChargeModalComponent,
    ScheduleTransactionsPopupComponent,
    EditRouAssetComponent,
    ModalModule,
    ToastModule,
    CremPopupComponent,
    CremTabsComponent,
    CremTabItemComponent,
    CremPopoverComponent,
    AccountingAdaDirective,
    SearchComponent,
    SplitButtonComponent,
    CremBlockUIComponent,
  ],

  providers: [
    AccountingSummaryService,
    FormattingService,
    DatePipe,
    AddEditScheduleService,
    AccountingToastService,
    MessageService,
  ],
})
export class IndexModule {}
