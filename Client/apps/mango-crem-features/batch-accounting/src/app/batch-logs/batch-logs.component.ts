/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable rxjs-angular/prefer-composition */
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import notify from 'devextreme/ui/notify';
import { DxDataGridComponent, DxPopupComponent } from 'devextreme-angular';
import 'regenerator-runtime/runtime';
import { Buffer, ValueType, Workbook, Worksheet } from 'exceljs';
import { saveAs } from 'file-saver-es';
import { format } from 'date-fns';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { ToastMessageService } from '@batch-accounting/services/toast-message.service';
import { CLIENT_ERROR_MESSAGE } from '@batch-accounting/shared/models/batch-accounting-constants';
import { BaseService } from '../services/base.service';
import { BatchLogsService } from '../services/batch-logs.service';
import { AccountingBatch } from '../shared/models';
import { BatchEventListService } from '../services/batch-event-list.service';
import { Subscription } from 'rxjs';

const REFRESH_INTERVAL = 60000; // 60 seconds

@Component({
  selector: 'mango-ba-batch-logs',
  templateUrl: './batch-logs.component.html',
  styleUrls: ['./batch-logs.component.scss'],
})
export class BatchLogsComponent implements AfterViewInit, OnInit, OnDestroy {
  filterBuilderVisible = false;
  showClearFilters = false;
  cancelModalVisible = false;

  appliedFilterCount = 0;

  @ViewChild('DataGrid')
  dataGrid: DxDataGridComponent | undefined;

  @ViewChild('LastNotePopup')
  lastNotePopup: DxPopupComponent | undefined;
  searchText: string | null = null;
  title: string | null = null;

  batchLogs: AccountingBatch[];

  columns: any[] | undefined;
  actionItemsCache: any[] = [];
  actionDisabledCache: any[] = [];

  isSuperUser = false;
  private intervalId: number;
  private hoveredRowBatchId: number;
  private listViews: any[];
  private ignoreFilterCountUpdate: boolean = false;
  private subscription = new Subscription();
  public useEuroDate: boolean = false;
  public dateFormat: string = 'MM/dd/yyyy';
  public dateFormatWithTime = 'MM/dd/yyyy HH:mm';
  contactFullName: string;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private batchEventService: BatchEventListService,
    public baseService: BaseService,
    public service: BatchLogsService,
    public toast: ToastMessageService,
    private mangoAppFacade: MangoAppFacade
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.baseService.getUserRights().subscribe((result) => {
        if (result.success) {
          this.service.userRights = Number(result.data);
        } else {
          this.toast.showError(CLIENT_ERROR_MESSAGE);
        }
      })
    );
    this.subscription.add(
      this.mangoAppFacade.contactRecord$.subscribe((cr) => {
        this.useEuroDate = cr.preferences?.contactDatesEU;
        this.contactFullName = `${cr.firstName} ${cr.lastName}`;
      })
    );

    if (this.useEuroDate) {
      this.dateFormat = 'dd.MM.yyyy';
      this.dateFormatWithTime = 'dd.MM.yyyy HH:mm';
    }

    this.columns = [
      {
        dataField: 'id',
        alignment: 'left',
        caption: 'Batch ID',
        visible: true,
        dataType: 'number',
        sortOrder: 'desc',
      },
      {
        dataField: 'portfolio',
        alignment: null,
        visible: true,
        dataType: 'string',
      },
      {
        dataField: 'user',
        caption: 'Created By',
        alignment: null,
        visible: true,
        dataType: 'string',
      },
      {
        dataField: 'createdOn',
        caption: 'Created',
        alignment: null,
        visible: false,
        dataType: 'date',
        format: this.dateFormat,
      },
      {
        dataField: 'lastModifiedBy',
        caption: 'Modified By',
        alignment: null,
        visible: false,
        dataType: 'string',
      },
      {
        dataField: 'lastModified',
        caption: 'Modified',
        alignment: null,
        visible: false,
        dataType: 'date',
        format: this.dateFormatWithTime,
      },
      {
        dataField: 'batchStatus',
        alignment: null,
        visible: true,
        dataType: 'string',
      },
      {
        dataField: 'validationStarted',
        caption: 'Validation Start',
        alignment: null,
        visible: true,
        dataType: 'date',
        format: this.dateFormatWithTime,
      },
      {
        dataField: 'validationEnded',
        caption: 'Validation End',
        alignment: null,
        visible: true,
        dataType: 'date',
        format: this.dateFormatWithTime,
      },
      {
        dataField: 'isAutoProcess',
        caption: 'Is Auto Process',
        alignment: null,
        visible: true,
        dataType: 'boolean',
      },
      {
        dataField: 'processStarted',
        caption: 'Processing Start',
        alignment: null,
        visible: true,
        dataType: 'date',
        format: this.dateFormatWithTime,
      },
      {
        dataField: 'processEnded',
        caption: 'Processing End',
        alignment: null,
        visible: true,
        dataType: 'date',
        format: this.dateFormatWithTime,
      },
      {
        dataField: 'leaseCount',
        caption: 'Lease Count',
        visible: true,
        dataType: 'number',
      },
      {
        dataField: 'batchCount',
        caption: 'Batch Count',
        visible: true,
        dataType: 'number',
      },
      {
        dataField: 'validationSuccessTotal',
        caption: 'Validation Success',
        alignment: 'right',
        visible: true,
        dataType: 'number',
      },
      {
        dataField: 'validationFailureTotal',
        caption: 'Validation Failure',
        alignment: 'right',
        visible: true,
        dataType: 'number',
      },
      {
        dataField: 'processingSuccessTotal',
        caption: 'Processing Success',
        alignment: 'right',
        visible: true,
        dataType: 'number',
      },
      {
        dataField: 'processingFailureTotal',
        caption: 'Processing Failure',
        alignment: 'right',
        visible: true,
        dataType: 'number',
      },
    ];

    this.title = 'Batch Accounting';
  }

  ngAfterViewInit() {
    this.populateBatchLogsAndParameters();

    this.subscription.add(
      this.batchEventService.getListViews().subscribe((res) => {
        if (res.success) {
          this.listViews = [
            ...res.data.coStarListViews,
            ...res.data.hiddenListViews,
            ...res.data.myListViews,
            ...res.data.sharedListViews,
          ];
        } else {
          this.toast.showError(
            'This page failed to load because views could not be fetched. Please contact support'
          );
        }
      })
    );

    this.intervalId = window.setInterval(() => {
      this.populateBatchLogsAndParameters();
    }, REFRESH_INTERVAL);
  }

  populateBatchLogsAndParameters(): void {
    this.dataGrid?.instance.beginCustomLoading('Loading...');

    this.subscription.add(
      this.service.getBatchLogsAndParameters().subscribe((result) => {
        if (!result || result?.clientErrorMessage) {
          this.dataGrid?.instance.endCustomLoading();
          this.toast.showError(CLIENT_ERROR_MESSAGE);
          return;
        }

        result.data.forEach((item: any) => {
          item.leaseCount = item.listOfLeaseIDs.split(',').length;
          item.batchCount = item.listOfScheduleIDs.split(',').length;
        });

        this.updateBatchLogData(result.data);
        this.batchLogs = result.data;
        this.dataGrid?.instance.endCustomLoading();
      })
    );
  }

  updateBatchLogData(data: any) {
    data.forEach((element) => {
      element.classificationParameters.forEach((param) => {
        if (param.accountingTermBeginDate === 'Direct Entry') {
          param.accountingTermBeginDate = this.getFormattedDate(
            param.termBeginDirectEntry
          );
        }
        if (param.accountingTermEndDate === 'Direct Entry') {
          param.accountingTermEndDate = this.getFormattedDate(
            param.termEndDirectEntry
          );
        }
        if (param.discountRateProfile === 'Direct Entry') {
          param.discountRateProfile = `${param.annualRate}% ${param.annualRateType}`;
        }
        if (param.manualAssetAdjustment === 'Direct Entry') {
          param.manualAssetAdjustment = param.manualAdjustmentDirectEntry;
        }
        if (param.comments === 'Direct Entry') {
          param.comments = param.commentsDirectEntry;
        }
        if (
          ['Operating', 'Capital (FAS 13)', 'Operating (Lessor)'].includes(
            param.classificationType
          )
        ) {
          param.rouAssetMethod = 'Not Applicable';
          param.rouAssetObtainedDate = 'Not Applicable';
        } else if (
          !!param.rouAssetDateOption &&
          param.rouAssetDateOption != 'Direct Entry'
        ) {
          param.rouAssetObtainedDate = param.rouAssetDateOption;
        } else if (!!param.rouAssetObtainedDate) {
          param.rouAssetObtainedDate = this.getFormattedDate(
            param.rouAssetObtainedDate
          );
        }
      });
    });
  }

  canShowButton(data) {
    const isDoneOrActive =
      ['Error', 'Canceled', 'Reversed', 'Validating', 'Processing'].find(
        (x) => x === data.batchStatus
      )?.length > 0;

    const queuedAndUserCanCancel =
      this.service.userRights <= 1 &&
      data.batchStatus === 'Queued for Validation';

    const completeWithoutSuccess =
      (data.batchStatus === 'Complete' ||
        data.batchStatus === 'Complete with Error') &&
      !data.processingSuccessTotal;

    return (
      !isDoneOrActive && !queuedAndUserCanCancel && !completeWithoutSuccess
    );
  }

  getBatchActionItems(data: any) {
    if (this.actionItemsCache[data.batchStatus]) {
      return this.actionItemsCache[data.batchStatus];
    }

    this.actionItemsCache[data.batchStatus] = [];

    if (this.menuButtonVisible('process', data)) {
      this.actionItemsCache[data.batchStatus].push('Process');
    }

    if (this.menuButtonVisible('cancel', data)) {
      this.actionItemsCache[data.batchStatus].push('Cancel');
    }

    if (this.menuButtonVisible('reverse', data)) {
      this.actionItemsCache[data.batchStatus].push('Reverse');
    }

    return this.actionItemsCache[data.batchStatus];
  }

  menuButtonVisible(buttonName: string, data: any): boolean {
    // 0 - No Rights so no access to anything
    if (this.service.userRights <= 0) {
      return false;
    }

    if (buttonName === 'download') {
      return (
        data.batchStatus === 'Validation Complete' ||
        data.batchStatus === 'Queued for Processing' ||
        data.batchStatus === 'Complete' ||
        data.batchStatus === 'Complete with Error' ||
        data.batchStatus === 'Canceled' ||
        data.batchStatus === 'Error' ||
        data.batchStatus === 'Reversed'
      );
    }

    // 1 - View Rights only has access to Download
    if (this.service.userRights <= 1) {
      return false;
    }

    if (buttonName === 'process') {
      return (
        data.batchStatus === 'Validation Complete' &&
        data.validationSuccessTotal > 0
      );
    }

    if (buttonName === 'cancel') {
      return (
        data.batchStatus === 'Validation Complete' ||
        data.batchStatus === 'Queued for Validation' ||
        data.batchStatus === 'Queued for Processing'
      );
    }

    if (buttonName === 'reverse') {
      return (
        (data.batchStatus === 'Complete' ||
          data.batchStatus === 'Complete with Error') &&
        data.processingSuccessTotal
      );
    }

    return false;
  }

  actionMenuCallback(item: string, data: any) {
    const actionMap = {
      download: (data: any) => this.exportExcel(data),
      process: (data: any) => this.queueForProcessing(data),
      cancel: () => this.cancelModalToggle(),
      reverse: (data: any) => this.reverseBatch(data),
    };

    actionMap[item](data);
  }

  showColumnChooser() {
    this.dataGrid?.instance.showColumnChooser();
  }

  searchDataGrid(data: any) {
    this.ignoreFilterCountUpdate = true;
    this.dataGrid?.instance.searchByText(data);
  }

  showFilterBuilder() {
    this.filterBuilderVisible = true;
  }

  calculateAppliedFilterCount() {
    if (this.ignoreFilterCountUpdate) {
      this.ignoreFilterCountUpdate = false;
      return this.appliedFilterCount;
    }
    const filters = this.dataGrid?.instance.getCombinedFilter(true);
    if (!filters) {
      this.appliedFilterCount = 0;
      return;
    }

    let filterArrays = [];
    filterArrays = filters.filter((itm: any) => Array.isArray(itm));
    const filterProperties: any = [];

    let hasSearchText = this.searchText !== null && this.searchText !== '';
    if (filterArrays.length === 0) {
      filterProperties.push(filters[0]);
    }
    filterArrays = hasSearchText ? filterArrays[1] : filterArrays;

    filterArrays.forEach((itm: any) => {
      if (!filterProperties.includes(itm) && Array.isArray(itm)) {
        filterProperties.push(itm);
      }
    });

    this.appliedFilterCount = filterProperties.length;
  }

  onCellPrepared(evt: any) {
    if (evt.rowType === 'detail') {
      evt.cellElement.id = `ba-detail-${evt.data.id}`;

      return;
    }

    if (evt.column.type === 'detailExpand' && evt.rowType === 'data') {
      evt.cellElement.id = `ba-expand-${evt.data.id}`;

      return;
    }

    // Add an ARIA label to the DevExtreme boolean checkbox
    // so that screen readers announce the column name and its current value
    if (evt.rowType === 'data' && evt.column.dataField === 'isAutoProcess') {
      const divCheckbox = evt.cellElement.querySelector('.dx-checkbox');
      if (divCheckbox) {
        divCheckbox.ariaLabel = `Is Auto Process: ${evt.data.isAutoProcess}`;
      }
    }

    if (evt.rowType !== 'header' || evt.column.type === 'buttons') {
      return;
    }

    if (!evt.column.caption) {
      return;
    }

    evt.cellElement.id = `ba-header-${evt.column.caption
      .toLowerCase()
      .replace(' ', '-')}`;
  }

  toggleClearFilters() {
    this.showClearFilters = !this.showClearFilters;
  }

  clearGridFilters(e: any) {
    e.stopPropagation();

    this.dataGrid?.instance.clearFilter();

    this.showClearFilters = false;
    this.searchText = null;
    this.calculateAppliedFilterCount();
  }

  cancelModalToggle() {
    this.cancelModalVisible = !this.cancelModalVisible;
  }

  addNewBatch() {
    window.clearInterval(this.intervalId);
    this.router.navigate(['batcheventlist'], {
      relativeTo: this.activatedRoute,
      queryParamsHandling: 'merge',
    });
  }

  cancelBatch() {
    this.actionDisabledCache[this.hoveredRowBatchId] = true;
    this.cancelModalVisible = false;

    this.subscription.add(
      this.service.cancelBatch(this.hoveredRowBatchId).subscribe((result) => {
        if (result.success) {
          this.populateBatchLogsAndParameters();
          this.dataGrid.instance.refresh();

          const message = result.data.isCancelled
            ? 'Batch Successfully Cancelled.'
            : `Batch failed to cancel for the following reason: ${result.clientErrorMessage}`;

          const type = result.data.isCancelled ? 'success' : 'error';

          notify({
            message,
            type,
            displayTime: 5000,
            position: {
              at: 'bottom right',
              my: 'bottom right',
              offset: '-16 -16',
            },
            maxWidth: '400px',
            closeOnClick: true,
          });
          this.actionDisabledCache[this.hoveredRowBatchId] = false;
        } else {
          this.toast.showError(CLIENT_ERROR_MESSAGE);
        }
      })
    );
  }

  cellHoverChanged(event: any) {
    this.hoveredRowBatchId = event?.key;
  }

  private reverseBatch(data: any) {
    this.actionDisabledCache[data.id] = true;

    notify({
      message: 'Reversing batch. Please wait...',
      type: 'info',
      displayTime: 5000,
      position: { at: 'bottom right', my: 'bottom right', offset: '-16 -16' },
      maxWidth: '400px',
      closeOnClick: false,
    });

    this.subscription.add(
      this.service.reverseBatch(data.id).subscribe((isSuccess) => {
        if (isSuccess.success) {
          const message = isSuccess
            ? 'Batch successfully reversed.'
            : 'Batch failed to reverse.';

          notify({
            message,
            type: isSuccess ? 'success' : 'error',
            displayTime: 3000,
            position: {
              at: 'bottom right',
              my: 'bottom right',
              offset: '-16 -16',
            },
            maxWidth: '400px',
            closeOnClick: true,
          });

          if (isSuccess) {
            this.populateBatchLogsAndParameters();
          }

          this.actionDisabledCache[data.id] = false;
        } else {
          this.toast.showError(CLIENT_ERROR_MESSAGE);
        }
      })
    );
  }

  private queueForProcessing(data: any) {
    this.actionDisabledCache[data.id] = true;

    this.subscription.add(
      this.service.queueForProcessing(data.id).subscribe((isSuccess) => {
        if (isSuccess.success) {
          const message = isSuccess
            ? 'Batch successfully queued for processing.'
            : 'Batch failed to queue for processing.';

          notify({
            message,
            type: isSuccess ? 'success' : 'error',
            displayTime: 3000,
            position: {
              at: 'bottom right',
              my: 'bottom right',
              offset: '-16 -16',
            },
            maxWidth: '400px',
            closeOnClick: true,
          });

          if (isSuccess) {
            this.populateBatchLogsAndParameters();
          }

          this.actionDisabledCache[data.id] = false;
        } else {
          this.toast.showError(CLIENT_ERROR_MESSAGE);
        }
      })
    );
  }

  private exportExcel(data: any) {
    const fileName = `Batch ${data.id} Results - ${data.portfolio} - ${
      this.contactFullName
    } - ${this.baseService.getTimeStamp().toLocaleString()}.xlsx`;

    this.actionDisabledCache[data.id] = true;

    this.subscription.add(
      this.service.getBatchById(data.id).subscribe((res) => {
        if (res.success) {
          const myData = Object.assign({}, data);

          myData.isAutoProcess = res.data.isAutoProcess;
          myData.accountingBatchEvents = res.data.accountingBatchEvents ?? [];

          const workbook = new Workbook();
          const batchInfoWs = workbook.addWorksheet('Batch Info');
          const batchEventResultsWs = workbook.addWorksheet(
            'Batch Event Results'
          );

          this.buildBatchInfoWorksheet(batchInfoWs, myData);
          this.buildBatchEventResultsWorksheet(batchEventResultsWs, myData);

          workbook.xlsx.writeBuffer().then((buffer: Buffer) => {
            saveAs(
              new Blob([buffer], { type: 'application/octet-stream' }),
              fileName
            );
            this.actionDisabledCache[data.id] = false;
          });
        } else {
          this.toast.showError(CLIENT_ERROR_MESSAGE);
        }
      })
    );
  }

  private buildBatchInfoWorksheet(ws: Worksheet, data: any) {
    const listview = this.listViews.find(
      (view) => view.id === (data.userViewID ?? data.listPageID)
    );

    ws.addRows([
      [
        'System Batch ID',
        data.id,
        '',

        'Validation Start',
        this.getExcelDateString(data.validationStarted),
        '',

        'Lease Count',
        data.leaseCount,
      ],
      [
        'Batch Status',
        data.batchStatus,
        '',

        'Validation End',
        this.getExcelDateString(data.validationEnded),
        '',

        'Batch Count',
        data.batchCount,
      ],
      [
        'Created By',
        data.user,
        '',

        'Processing Start',
        this.getExcelDateString(data.processStarted),
        '',

        'Validation Success',
        data.validationSuccessTotal,
      ],
      [
        'Created',
        this.getExcelDateString(data.createdOn),
        '',

        'Processing End',
        this.getExcelDateString(data.processEnded),
        '',

        'Validation Failure',
        data.validationFailureTotal,
      ],
      [
        'Modified By',
        data.lastModifiedBy,
        '',

        'Is Auto Process',
        data.isAutoProcess.toString().toUpperCase(),
        '',

        'Processing Success',
        data.processingSuccessTotal,
      ],
      [
        'Modified',
        this.getExcelDateString(data.lastModified),
        '',

        '',
        '',
        '',

        'Processing Failure',
        data.processingFailureTotal,
      ],
      ['Portfolio', data.portfolio],
      ['Original Accounting Workflow Status', data.originalWorkflowStep],
      ['View Name', listview ? listview.name : ''],
      ['Measure Event', data.measureEvent],
      ['Next Accounting Workflow Status', data.finalWorkflowStep],
      ['Next Accounting Workflow Comment', data.workflowComment],
    ]);

    ['A', 'D', 'G'].forEach((colKey) => {
      ws.getColumn(colKey).font = { bold: true };
    });

    ws.getCell('B1').alignment = { horizontal: 'left' };

    this.autoSizeWorksheetColumns(ws);
  }

  private buildBatchEventResultsWorksheet(ws: Worksheet, data: any) {
    ws.addRow([
      'Batch Event ID',
      'System Lease ID',
      'Copied From Accounting Event ID',
      'Accounting Event ID',
      'Batch Event Status',
      'Batch Event Status Reason',
      'Client Lease ID',
      'Lease Name',
      'Classification',
      'Amortization Profile',
      'Journal Entry Profile',
      'Discount Rate Profile',
      'Accounting Term Begin Date',
      'Accounting Term End Date',
      'Accounting Term (Years, Months, Days)',
      'Annual Discount Rate',
      'Total Amount',
      'Present Value',
      'Liability Adjustment',
      'System Asset Adjustment',
      'Manual Asset Adjustment',
      'Previous Asset Balance',
      'Previous Liability Balance',
      'Beginning Asset Balance',
      'Beginning Liability Balance',
      'Local Currency',
      'Functional Currency',
      'Functional Currency Rate',
    ]).font = { bold: true };

    data.accountingBatchEvents.forEach((event: any) => {
      const accountingEventId =
        event.leaseRecognitionScheduleId === event.copiedFromScheduleId
          ? ''
          : event.leaseRecognitionScheduleId;

      let validationSuccessOrGreaterOnlyItems = [];

      if (event.eventStatusLabel !== 'System Error') {
        validationSuccessOrGreaterOnlyItems = [
          event.classificationType,
          event.amortizationProfile,
          event.journalEntryProfile,
          event.discountRateProfile,
          event.accountingTermBeginDate
            ? new Date(event.accountingTermBeginDate)
            : null,
          event.accountingTermEndDate
            ? new Date(event.accountingTermEndDate)
            : null,
          event.term,
          event.annualRate,
          event.totalAmount,
          event.presentValue,
          event.liabilityAdjustment,
          event.systemAssetAdjustment,
          event.manualAssetAdjustment,
          event.previousAssetBalance,
          event.previousLiabilityBalance,
          event.beginningAssetBalance,
          event.beginningLiabilityBalance,
          event.localCurrency,
          event.functionalCurrency,
          event.functionalCurrencyRate,
        ];
      }

      const newRow = ws.addRow([
        event.batchEventId,
        event.leaseAbstractId,
        event.copiedFromScheduleId,
        accountingEventId,
        event.eventStatusLabel,
        event.failureReason,
        event.clientLeaseId,
        event.leaseName,
        ...validationSuccessOrGreaterOnlyItems,
      ]);

      newRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        if (colNum < 16) {
          return;
        }

        cell.numFmt = '#,##0.00';
      });
    });

    this.autoSizeWorksheetColumns(ws);
  }

  private getExcelDateString(date: string): string {
    if (!date || !date.length) return '';

    return format(new Date(date), 'd MMMM yyy k:mm:ss');
  }

  private autoSizeWorksheetColumns(ws: Worksheet) {
    ws.columns?.forEach((column) => {
      const lengths = [];
      const minLength = 14;

      column.eachCell({ includeEmpty: false }, (cell) => {
        if (cell.type === ValueType.Date) {
          return;
        }

        lengths.push(cell.text.length);
      });

      column.width = Math.max(minLength, ...lengths);
    });
  }

  private getFormattedDate(dateString: string) {
    const date = new Date(dateString);

    return this.dateFormat.includes('.')
      ? `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
      : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
