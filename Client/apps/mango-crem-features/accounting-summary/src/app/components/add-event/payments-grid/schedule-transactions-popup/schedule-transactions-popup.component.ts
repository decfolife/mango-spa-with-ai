import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { AddEditScheduleService } from '@accounting-summary/services/add-edit-schedule.service';
import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import { TransactionPopupGridColumnsService } from '@accounting-summary/services/transaction-popup-grid-columns.service';
import { CommonModule } from '@angular/common';
import {
  CremPopupComponent,
  InputComponent,
  InputLabelComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { SchedulePayment } from '@accounting-summary/models/schedule-payment-model';
import { Subject } from 'rxjs';
import { FormattingService } from '@accounting-summary/services/formatting.service';
import { DevExtremeModule, DxDataGridComponent } from 'devextreme-angular';
import { ScheduleTransaction } from '@accounting-summary/models/interfaces/schedule-transaction.interfaces';
import { takeUntil } from 'rxjs/operators';
import { AccountingToastService } from '@accounting-summary/services/accounting-toast.service';

@Component({
  selector: 'mango-schedule-transactions-popup',
  standalone: true,
  imports: [
    CommonModule,
    CremPopupComponent,
    DevExtremeModule,
    InputComponent,
    InputLabelComponent,
  ],
  templateUrl: './schedule-transactions-popup.component.html',
  styleUrls: ['./schedule-transactions-popup.component.scss'],
})
export class ScheduleTransactionsPopupComponent
  implements OnChanges, OnDestroy
{
  @ViewChild(DxDataGridComponent, { static: false })
  scheduleTransactionGrid!: DxDataGridComponent;

  @Input() scheduledPaymentGridData;
  @Input() schedulePayments: SchedulePayment;
  private subscription$ = new Subject<void>();

  componentName = 'schedule-transactions';
  scheduleTransactionData: ScheduleTransaction;
  scheduleTransactionColumns: any;
  glEventID: number;
  paymentEventSource: string;
  targetCurrencyId: number;
  isEuroDateFormat = false;
  dateFormat = 'MM/dd/yyyy';
  showScheduleTransaction: boolean;
  fromDate: Date;
  toDate: Date;
  includeFromFirst: boolean;
  glEventNotes: string;
  leaseRecognitionScheduleEventID: number;

  baseAmountFormatter = (value: number) =>
    this.formattingService.localFormat(
      +value,
      this.scheduleTransactionData.chargeCurrencyDecimalPrecision
    );
  targetAmountFormatter = (value: number) =>
    this.formattingService.localFormat(
      +value,
      this.scheduleTransactionData.scheduleCurrencyDecimalPrecision
    );

  constructor(
    private addEditScheduleService: AddEditScheduleService,
    public formattingService: FormattingService,
    public accountingSummaryService: AccountingSummaryService,
    public transactionPopupGridColumnsService: TransactionPopupGridColumnsService,
    private accountingToastService: AccountingToastService
  ) {}

  ngOnDestroy(): void {
    this.subscription$.next();
    this.subscription$.complete();
  }

  closePopup() {
    this.showScheduleTransaction = !this.showScheduleTransaction;
    this.scheduleTransactionData.transactions = null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['scheduledPaymentGridData'] &&
      !changes['scheduledPaymentGridData'].firstChange
    ) {
      this.leaseRecognitionScheduleEventID =
        this.scheduledPaymentGridData?.historicalCharges
          ?.leaseRecognitionScheduleEventID ?? 0;
      this.isEuroDateFormat = this.scheduledPaymentGridData.isEuroDateFormat;
      this.fromDate = this.scheduledPaymentGridData.fromDate
        ? new Date(this.scheduledPaymentGridData.fromDate)
        : null;
      this.toDate = this.scheduledPaymentGridData.toDate
        ? new Date(this.scheduledPaymentGridData.toDate)
        : null;
      this.includeFromFirst = this.scheduledPaymentGridData.includeFromFirst;
      this.includeFromFirst
        ? new Date(this.fromDate.setDate(1)).setHours(0, 0, 0, 0)
        : this.fromDate;

      if (
        this.fromDate &&
        this.toDate &&
        !this.scheduledPaymentGridData.isHistoricalCharge
      ) {
        this.showScheduleTransaction = true;
        this.glEventID =
          this.scheduledPaymentGridData.schedulePayments.glEventID;
        this.paymentEventSource =
          this.scheduledPaymentGridData.schedulePayments.paymentEventSource;
        this.targetCurrencyId =
          this.scheduledPaymentGridData.schedulePayments.scheduleCurrencyID;
        this.getScheduleTransaction();
      } else if (this.scheduledPaymentGridData.isHistoricalCharge) {
        this.getHistoricalTransactions();
        this.showScheduleTransaction = true;
      }
    }
  }

  onEditorPreparing(event: any): void {
    if (event.row && event.command === 'select') {
      event.editorOptions.disabled = true;
    }

    const gridInstance = this.scheduleTransactionGrid.instance;
    const headerCheckbox = gridInstance
      .element()
      .querySelector('.dx-header-row .dx-checkbox');

    if (headerCheckbox) {
      headerCheckbox.setAttribute('hidden', 'true');
      headerCheckbox.classList.add('dx-state-disabled');
    }
  }

  onContentReady() {
    const gridInstance = this.scheduleTransactionGrid?.instance;
    const dataSource = gridInstance?.getDataSource();
    gridInstance.clearSelection();

    if (!gridInstance || !dataSource) {
      return;
    }

    const data = dataSource.items();

    if (!this.fromDate || !this.toDate) {
      gridInstance.clearSelection();
    } else {
      const rowsToSelect = data.filter((item) => {
        const dueDate = new Date(item.dueBy);
        return dueDate >= this.fromDate && dueDate <= this.toDate;
      });
      gridInstance.selectRows(rowsToSelect, true);
    }
  }

  customSummaryCalculation(options) {
    if (options.summaryProcess === 'start') {
      options.totalValue = 0;
    } else if (options.summaryProcess === 'calculate') {
      switch (options.name) {
        case 'targetAmountCount':
          if (options.value.targetAmount !== 0) {
            options.totalValue += 1;
          }
          break;
        case 'baseAmountCount':
          options.totalValue += 1;
          break;
        case 'baseAmountTotal':
          options.totalValue += options.value.baseAmount;
          break;
        case 'targetAmountTotal':
          options.totalValue += options.value.targetAmount;
          break;
      }
    }
  }

  getScheduleTransaction() {
    this.addEditScheduleService
      .getScheduleTransactions(
        this.glEventID,
        this.paymentEventSource,
        this.targetCurrencyId
      )
      .pipe(takeUntil(this.subscription$))
      .subscribe((response: any) => {
        if (response && response.success) {
          this.scheduleTransactionData = response.data;

          for (const transaction of this.scheduleTransactionData.transactions) {
            const dueByDate = new Date(transaction.dueBy);
            if (dueByDate < this.fromDate || dueByDate > this.toDate) {
              transaction.targetAmount = 0;
            }
          }
          this.glEventNotes = response.data.glEventNotes;
          this.dateFormat = this.isEuroDateFormat ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
          this.scheduleTransactionColumns =
            this.transactionPopupGridColumnsService.getTransactionPopupGridColumns(
              this.scheduleTransactionData,
              this.dateFormat
            );
        } else {
          this.accountingToastService.showToast(
            'Error',
            response.clientErrorMessage,
            'error',
            false
          );
        }
      });
  }

  getHistoricalTransactions() {
    this.accountingSummaryService
      .getPaymentPopupData(this.leaseRecognitionScheduleEventID)
      .pipe(takeUntil(this.subscription$))
      .subscribe((response: any) => {
        if (response && response.success) {
          this.scheduleTransactionData = response.data;

          for (const transaction of this.scheduleTransactionData.transactions) {
            const dueByDate = new Date(transaction.dueBy);
            if (dueByDate < this.fromDate || dueByDate > this.toDate) {
              transaction.targetAmount = 0;
            }
          }
          this.glEventNotes = response.data.glEventNotes;
          this.dateFormat = this.isEuroDateFormat ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
          this.scheduleTransactionColumns =
            this.transactionPopupGridColumnsService.getTransactionPopupGridColumns(
              this.scheduleTransactionData,
              this.dateFormat
            );
        } else {
          this.accountingToastService.showToast(
            'Error',
            response.clientErrorMessage,
            'error',
            false
          );
        }
      });
  }
}
