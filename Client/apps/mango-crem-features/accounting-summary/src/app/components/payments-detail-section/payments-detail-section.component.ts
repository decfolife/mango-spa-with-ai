import { HistoricalPayment } from '@accounting-summary/models/interfaces/historical-payments.interfaces';
import { UserInfoResponse } from '@accounting-summary/models/user-info-response.modal';
import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import { PaymentsGridColumnsService } from '@accounting-summary/services/payments-grid-columns.service';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'mango-payments-detail-section',
  templateUrl: './payments-detail-section.component.html',
  styleUrls: ['./payments-detail-section.component.scss'],
})
export class PaymentsDetailSectionComponent implements OnChanges, OnDestroy {
  @ViewChild('PaymentsDataGrid') paymentsDataGrid: DxDataGridComponent;
  @Input() eventScheduleData: any;
  @Input() gridState: any;
  @Input() classificationID: number;
  @Input() userInfo: UserInfoResponse;
  @Input() classificationType: string;
  @Input() amortizationProfileName: string;
  @Input() isAccountingEventEmpty: boolean;

  componentName = 'payments-grid';
  isGridStateChanged = false;
  paymentsGridData: HistoricalPayment[];
  paymentsGridColumns = [];
  paymentsGridHeight: string;
  gridName = 'Payments';
  isEuroDateFormat = false;
  dateFormat = 'MM/dd/yyyy';
  preferenceSavePendingMessage: string;
  transactionPopupVisible = false;
  transactionPopupData: any;
  historicalTransactionData: any;
  showHistoricalTransaction = false;
  initialState = {};
  private subscription = new Subscription();
  private gridPreferencesUpdated = false;
  contentLoaded = false;
  showMaxRow = true;
  showDefaultRow = false;
  showMinRow = false;
  resetBtnHoverText =
    'This will delete any saved preferences, taking you back the CoStar default columns';
  clearBtnHoverText = 'This will clear all pending changes in the grid';
  overrideAmortizationProfile = '';

  constructor(
    public accountingSummaryService: AccountingSummaryService,
    private paymentsGridColumnService: PaymentsGridColumnsService
  ) {
    this.preferenceSavePendingMessage =
      accountingSummaryService.preferenceSavePendingMessage;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.eventScheduleData &&
      this.gridState &&
      this.eventScheduleData.leaseRecognitionScheduleID !== undefined &&
      this.classificationID !== undefined &&
      this.amortizationProfileName ===
        this.eventScheduleData?.amortizationProfileName &&
      // The first time loading or the value in the dropdown changed
      (!changes.eventScheduleData ||
        !changes.eventScheduleData.previousValue ||
        changes.eventScheduleData.previousValue.leaseRecognitionScheduleID !==
          this.eventScheduleData.leaseRecognitionScheduleID)
    ) {
      this.isGridStateChanged = false;
      this.paymentsGridData = [];
      this.paymentsGridSetup(this.eventScheduleData.leaseRecognitionScheduleID);
      this.overrideAmortizationProfile = this.eventScheduleData.overrideProfile
        ? ' | Amortization Profile Overridden'
        : '';
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onRowClick(event: any) {
    this.historicalTransactionData = {
      showScheduleTransaction: this.showHistoricalTransaction,
      historicalCharges: event.data,
      isEuroDateFormat: this.isEuroDateFormat,
      isHistoricalCharge: true,
      fromDate: this.eventScheduleData.beginDate,
      toDate: this.eventScheduleData.endDate,
      includeFromFirst: this.eventScheduleData.includeFromFirst,
    };
  }

  private paymentsGridSetup(scheduleEventId: number) {
    const paymentDetails =
      this.accountingSummaryService.getPaymentDetails(scheduleEventId);
    this.subscription.add(
      paymentDetails.subscribe((res) => {
        const paymentDetailsResponse = res;

        if (paymentDetailsResponse === null) {
          this.paymentsDataGrid.instance.state(null);
          this.accountingSummaryService.displayContactSystemAdminMessage();
        } else if (paymentDetailsResponse.success) {
          this.paymentsGridData = paymentDetailsResponse.data;
          this.isEuroDateFormat = this.userInfo?.useDateEU;
          if (this.isEuroDateFormat) {
            this.dateFormat = 'dd.MM.yyyy';
          }

          this.paymentsGridColumns =
            this.paymentsGridColumnService.getPaymentGridColumns(
              this.eventScheduleData.localCurrency,
              this.dateFormat
            );
          this.getGridPreferences();

          const totalAmount = this.eventScheduleData.totalAmount;
          const terminationFee = this.eventScheduleData.terminationFee;
          const directCosts = this.eventScheduleData.directCosts;
          const paymentsData = paymentDetailsResponse.data.length;

          if (
            paymentsData === 0 &&
            !totalAmount &&
            !terminationFee &&
            !directCosts
          ) {
            this.paymentsDataGrid.instance.option('noDataText', 'No Payments');
            this.paymentsGridHeight = '65px';
          } else if (
            paymentsData === 0 &&
            (totalAmount || terminationFee || directCosts)
          ) {
            this.paymentsDataGrid.instance.option(
              'noDataText',
              'Missing Payment Data'
            );
            this.paymentsGridHeight = '65px';
          }
        } else if (!paymentDetailsResponse.success) {
          this.accountingSummaryService.errorNotify(
            paymentDetailsResponse.clientErrorMessage
          );
        }
      })
    );
  }

  getGridPreferences() {
    this.subscription.add(
      this.accountingSummaryService
        .getGridPreferences()
        .subscribe((response) => {
          if (response === null) {
            this.accountingSummaryService.displayContactSystemAdminMessage();
          } else if (response.success) {
            this.gridState = response.data;
            let state = JSON.parse(
              sessionStorage.getItem('paymentsGridStateKey')
            );
            // Filter the data
            const filteredData = this.gridState.filter((item) => {
              return (
                item.classificationID === this.classificationID &&
                item.gridName === this.gridName
              );
            });

            if (state === null) {
              state = {};
            }

            state.columns = [];
            filteredData.forEach((item) => {
              const parsedColumns = JSON.parse(item.columnJson);
              state.columns.push(...parsedColumns);
            });

            this.initialState = state;
            this.paymentsDataGrid.instance.state(this.initialState);
            sessionStorage.setItem(
              'paymentsGridStateKey',
              JSON.stringify(state)
            );
            this.contentLoaded = false;
          }
        })
    );
  }

  onGridContentReady() {
    if (this.paymentsDataGrid.instance.totalCount() > 0) {
      this.showDefaultRows();
    }
    if (!this.contentLoaded) {
      this.paymentsDataGrid.instance.state(this.initialState);
      this.contentLoaded = true;
    }
  }

  resetGridPreferences() {
    this.subscription.add(
      this.accountingSummaryService
        .resetGridPreferences(this.classificationID, this.gridName)
        .subscribe((response) => {
          if (response === null) {
            this.accountingSummaryService.displayContactSystemAdminMessage();
          } else if (response.success) {
            this.paymentsDataGrid.instance.state({});
            this.gridPreferencesUpdated = false;
            this.accountingSummaryService.successNotify(
              'Value Reset Successfully'
            );
          } else {
            this.accountingSummaryService.errorNotify(
              response.clientErrorMessage
            );
          }
        })
    );
  }

  clearGridChanges() {
    this.isGridStateChanged = false;
    this.paymentsDataGrid.instance.state(this.initialState);
  }

  saveGridPreferences() {
    this.isGridStateChanged = false;
    const newState = this.paymentsDataGrid.instance.state();
    sessionStorage.setItem('paymentsGridStateKey', JSON.stringify(newState));
    const columnsState = this.paymentsDataGrid.instance.state().columns;
    for (let index = 0; index < columnsState.length; index++) {
      columnsState[index].appendsCurrency =
        this.paymentsDataGrid.instance.columnOption(index, 'appendsCurrency');
      columnsState[index].caption = this.paymentsDataGrid.instance.columnOption(
        index,
        'caption'
      );
      columnsState[index].usesLocalFormat =
        this.paymentsDataGrid.instance.columnOption(index, 'usesLocalFormat');
      columnsState[index].usesFunctionalFormat =
        this.paymentsDataGrid.instance.columnOption(
          index,
          'usesFunctionalFormat'
        );
      columnsState[index].headerCellTemplate = 'amortizationHeader';
    }
    const columns = JSON.stringify(columnsState);
    this.subscription.add(
      this.accountingSummaryService
        .saveGridPreferences(this.classificationID, this.gridName, columns)
        .subscribe((response) => {
          if (response === null) {
            this.accountingSummaryService.displayContactSystemAdminMessage();
          } else if (response.success) {
            this.initialState = newState;
            this.gridPreferencesUpdated = true;
            this.accountingSummaryService.successNotify(
              response.clientErrorMessage
            );
          } else {
            this.accountingSummaryService.errorNotify(
              response.clientErrorMessage
            );
          }
        })
    );
  }

  loadState() {
    return JSON.parse(sessionStorage.getItem('paymentsGridStateKey'));
  }

  saveState(state) {
    sessionStorage.setItem('paymentsGridStateKey', JSON.stringify(state));
  }

  onGridOptionChanged(event) {
    if (event.fullName != 'columns' && event.name === 'columns') {
      // The grid state has changed
      this.isGridStateChanged = true;
    }
  }

  showColumnChooser() {
    this.paymentsDataGrid.instance.showColumnChooser();
  }

  sendToExcel() {
    const classificationType = this.classificationType;
    const amortizationProfileName = this.amortizationProfileName;
    const componentName = 'Payments';
    const sheetname =
      this.accountingSummaryService.getLeaseAbstractId() +
      ' - ' +
      amortizationProfileName;
    const filename = this.accountingSummaryService.generateFileName(
      classificationType,
      amortizationProfileName,
      componentName
    );
    this.accountingSummaryService.exportToExcel(
      this.paymentsDataGrid.instance,
      filename,
      sheetname
    );
  }

  openMoreMenu(event: Event): void {
    event.stopPropagation();
  }

  showMaxRows() {
    this.paymentsGridHeight = 'auto';
    this.showMaxRow = false;
    this.showDefaultRow = false;
    this.showMinRow = true;
  }

  showDefaultRows() {
    this.paymentsGridHeight =
      this.accountingSummaryService.setDefaultGridHeight(this.paymentsDataGrid);
    this.showMaxRow = true;
    this.showDefaultRow = false;
    this.showMinRow = false;
  }

  showMinRows() {
    this.paymentsGridHeight = this.accountingSummaryService.setGridHeight(
      this.paymentsDataGrid,
      1
    );
    this.showMaxRow = false;
    this.showDefaultRow = true;
    this.showMinRow = false;
  }
}
