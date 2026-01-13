import { PortfolioSettingsResponse } from '@accounting-summary/models/portfolio-settings-response.modal';
import { UserInfoResponse } from '@accounting-summary/models/user-info-response.modal';
import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import { AmortizationGridColumnsService } from '@accounting-summary/services/amortization-grid-columns.service';
import { FormattingService } from '@accounting-summary/services/formatting.service';
import { DatePipe } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'mango-amortization-detail-section',
  templateUrl: './amortization-detail-section.component.html',
  styleUrls: ['./amortization-detail-section.component.scss'],
})
export class AmortizationDetailSectionComponent
  implements OnChanges, OnDestroy, OnInit
{
  @ViewChild('AmortizationDataGrid') amortizationDataGrid: DxDataGridComponent;
  @Input() eventScheduleData: any;
  @Input() gridState: any;
  @Input() userInfo: UserInfoResponse;
  @Input() rightsInfo: any;
  @Input() wfStatusRights: any;
  @Input() classificationType: string;
  @Input() amortizationProfileName: string;
  @Input() classificationID: number;
  @Input() isAccountingEventEmpty: boolean;

  componentName = 'amortization-grid';
  isGridStateChanged = false;
  amortizationDetailsGridData;
  amortizationDetailColumns = [];
  summaryFields: any = {};
  gridName = 'Periods';
  isLoading = false;
  selectedRowKey: number[];
  amortizationGridHeight: string;
  isEuroDateFormat = false;
  dateFormat = 'MM/dd/yyyy';
  expanded = true;
  preferenceSavePendingMessage: string;
  initialState = {};
  portfolioSettings: PortfolioSettingsResponse;
  selectedRowValue = 0;
  popupVisible = false;
  amortizationGridRowClickEvent: any;
  retroAdjustmentGridRowClickEvent: any;
  gridColumnsForRetroPopup: any;
  retroEventJeStatus = '';
  private subscription = new Subscription();
  private gridPreferencesUpdated = false;
  contentLoaded = false;
  showMaxRow = true;
  showDefaultRow = false;
  showMinRow = false;
  resetBtnHoverText =
    'This will delete any saved preferences, taking you back the CoStar default columns';
  clearBtnHoverText = 'This will clear all pending changes in the grid';
  showPaymentTabOnPeriodPopup: boolean;

  constructor(
    public accountingSummaryService: AccountingSummaryService,
    private columnService: AmortizationGridColumnsService,
    private formatService: FormattingService,
    private datePipe: DatePipe
  ) {
    this.summaryFields = this.getSummaryFields();
    this.preferenceSavePendingMessage =
      accountingSummaryService.preferenceSavePendingMessage;
  }

  ngOnInit(): void {
    this.subscription.add(
      this.accountingSummaryService.jeActionTaken$.subscribe(
        (jeActionTaken) => {
          if (jeActionTaken) {
            this.amortizationGridSetup(
              this.eventScheduleData.leaseRecognitionScheduleID
            );
          }
        }
      )
    );
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
      this.amortizationDetailsGridData = [];
      this.amortizationGridSetup(
        this.eventScheduleData.leaseRecognitionScheduleID
      );
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onUpdateRetroEventJeStatus(eventJeProcessingPopupData) {
    this.retroEventJeStatus = eventJeProcessingPopupData.jeStatus;
  }

  onRetroAdjustmentGridRowClick(event) {
    this.retroAdjustmentGridRowClickEvent = event;
    this.showPaymentTabOnPeriodPopup = false;
  }

  onGridOptionChanged(event) {
    if (event.fullName != 'columns' && event.name === 'columns') {
      // The grid state has changed
      this.isGridStateChanged = true;
    }
  }

  onGridRowClick(event) {
    if (!!this.eventScheduleData.retroScheduleID) {
      this.setupGridColumnsForRetroPopup(event.columns);
    }

    this.amortizationGridRowClickEvent = event;
  }

  amortizationGridSetup(leaseRecognitionScheduleID: number) {
    this.accountingSummaryService.isAmortizationDataLoaded$.next(false);
    const amortizationDetails =
      this.accountingSummaryService.getAmortizationDetails(
        leaseRecognitionScheduleID
      );
    this.subscription.add(
      amortizationDetails.subscribe((amortizationDetailsResponse) => {
        if (amortizationDetailsResponse.success) {
          this.amortizationDetailsGridData = amortizationDetailsResponse.data;
          this.selectedRowKey = [
            this.amortizationDetailsGridData[0]?.scheduleIndex,
          ];
          this.portfolioSettings =
            this.accountingSummaryService.getPortfolioSettingsFromSession();
          this.isEuroDateFormat = this.userInfo?.useDateEU;
          if (this.isEuroDateFormat) {
            this.dateFormat = 'dd.MM.yyyy';
          }
          this.amortizationDetailColumns = this.getAmortizationColumns(
            this.classificationID,
            this.eventScheduleData
          );

          //Get Last Approved or Exported Date for Retro and Emit the data to service
          const filteredAmortizationData =
            this.amortizationDetailsGridData.filter(
              (item) =>
                item.jeStatus === 'Approved' || item.jeStatus === 'Exported'
            );

          const lastApprovedOrExportedRow =
            filteredAmortizationData[filteredAmortizationData.length - 1];
          const lastApprovedOrExportedDate =
            lastApprovedOrExportedRow?.periodEnd
              ? (function () {
                  const date = new Date(lastApprovedOrExportedRow.periodEnd);
                  date.setDate(date.getDate() + 1); // Adding 1 day
                  date.setHours(0, 0, 0, 0);
                  return date;
                })()
              : null;

          this.accountingSummaryService.lastApprovedOrExportedDate$.next(
            lastApprovedOrExportedDate
              ? new Date(lastApprovedOrExportedDate)
              : null
          );
          this.getGridPreferences();
        } else if (!amortizationDetailsResponse.success) {
          this.accountingSummaryService.errorNotify(
            amortizationDetailsResponse.clientErrorMessage
          );
        }
      })
    );
  }

  showColumnChooser() {
    this.amortizationDataGrid.instance.showColumnChooser();
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
              sessionStorage.getItem('amortizationGridStateKey')
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
            this.amortizationDataGrid.instance.state(this.initialState);
            sessionStorage.setItem(
              'amortizationGridStateKey',
              JSON.stringify(state)
            );
            this.contentLoaded = false;
          }
        })
    );
  }

  onGridContentReady() {
    if (!this.contentLoaded) {
      if (
        !!this.amortizationDetailsGridData &&
        this.amortizationDetailsGridData.length > 0
      ) {
        this.showDefaultRows();
        this.amortizationDataGrid.instance.state(this.initialState);
      }
      this.contentLoaded = true;
      this.accountingSummaryService.isAmortizationDataLoaded$.next(true);
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
            this.amortizationDataGrid.instance.state({});
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
    this.amortizationDataGrid.instance.state(this.initialState);
  }

  saveGridPreferences() {
    this.isGridStateChanged = false;
    const newState = this.amortizationDataGrid.instance.state();
    sessionStorage.setItem(
      'amortizationGridStateKey',
      JSON.stringify(newState)
    );
    const columnsState = this.amortizationDataGrid.instance.state().columns;
    for (let index = 0; index < columnsState.length; index++) {
      if (
        columnsState[index].name === 'PeriodStart' ||
        columnsState[index].name === 'PeriodEnd'
      ) {
        columnsState[index].format = this.dateFormat;
      }
      columnsState[index].appendsCurrency =
        this.amortizationDataGrid.instance.columnOption(
          index,
          'appendsCurrency'
        );
      columnsState[index].caption =
        this.amortizationDataGrid.instance.columnOption(index, 'caption');
      columnsState[index].isParent =
        this.amortizationDataGrid.instance.columnOption(index, 'isParent');
      columnsState[index].band =
        this.amortizationDataGrid.instance.columnOption(index, 'band');
      columnsState[index].usesLocalFormat =
        this.amortizationDataGrid.instance.columnOption(
          index,
          'usesLocalFormat'
        );
      columnsState[index].usesFunctionalFormat =
        this.amortizationDataGrid.instance.columnOption(
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
    return JSON.parse(sessionStorage.getItem('amortizationGridStateKey'));
  }

  saveState(state) {
    sessionStorage.setItem('amortizationGridStateKey', JSON.stringify(state));
  }

  /**
   * Gets the appropriate columns from the service.
   * @param classificationId Lease recognition classification ID
   */
  getAmortizationColumns(classificationId, currencyInfo) {
    const defaultColumns = this.columnService.getSummaryColumns(
      classificationId,
      this.portfolioSettings?.functionalCurrencyEnabled,
      this.portfolioSettings?.leaseRecognitionCalendarID != 1
    );

    // columns is ultimatly what will be used, it is the default by default
    const columns = defaultColumns;

    // these are the columns that appear when the lease's Functional Currency Site Setting is TRUE
    // If these appear, then they have the Functional Currency Name appended behind their captions
    const FunctionalColumns = [
      'Functional_Asset',
      'FunctionalAssetBeginBalance',
      'Functional_AssetBalance',
      'Functional_AccumulatedAssetAmortization',
      'Functional_AssetAmortization',
      'Functional_AssetAdjustmentAmount',
      'Functional_LevelExpense',
      'Functional_ROUAssetInterestExpense',
      'Functional_SystemAssetAdjustment',
      'Functional_ManualAssetAdjustment',
      'Functional_DirectCostsTotal',
      'Functional_TerminationFee',
      'Functional_AdjustmentGainLoss',
    ];

    let firstRetroPeriodRow = null;

    columns.forEach((col, index) => {
      col.visibleIndex = col.visibleIndex ?? index;

      // Format based on conditions
      if (col.usesLocalFormat === 'true') {
        col.format = (value) =>
          this.formatService.localFormat(
            +value,
            currencyInfo.localCurrencyDecimalPrecision
          );
      } else if (col.usesFunctionalFormat === 'true') {
        col.format = (value) =>
          this.formatService.functionalFormat(
            +value,
            currencyInfo.functionalCurrencyDecimalPrecision
          );
      } else if (col.name === 'PeriodStart' || col.name === 'PeriodEnd') {
        col.format = this.dateFormat;
      }

      // Append currency information to the caption if needed
      if (col.appendsCurrency === 'true') {
        const currency = FunctionalColumns.includes(col.name)
          ? `(${currencyInfo.functionalCurrency})`
          : `(${currencyInfo.localCurrency})`;
        col.caption = `${col.caption} ${currency}`;
      }

      // Set the column alignment
      col.alignment = 'center';

      // Process sub-columns if they exist
      if (col.columns) {
        col.columns.forEach((subCol, subIndex) => {
          subCol.visibleIndex = subCol.visibleIndex ?? subIndex;

          if (subCol.usesLocalFormat === 'true') {
            subCol.format = (value) =>
              this.formatService.localFormat(
                +value,
                currencyInfo.localCurrencyDecimalPrecision
              );
          } else if (subCol.usesFunctionalFormat === 'true') {
            subCol.format = (value) =>
              this.formatService.functionalFormat(
                +value,
                currencyInfo.functionalCurrencyDecimalPrecision
              );
          } else if (
            subCol.name === 'PeriodStart' ||
            subCol.name === 'PeriodEnd'
          ) {
            subCol.format = this.dateFormat;
          }
          if (
            subCol.name === 'AssetAdjustment' ||
            subCol.name === 'FunctionalAssetAdjustmentAmount' ||
            subCol.name === 'LiabilityAdjustment'
          ) {
            subCol.cellTemplate = (container, options) => {
              if (
                options.data.isImpactedByRetro &&
                options.text !== null &&
                options.text !== undefined
              ) {
                if (
                  firstRetroPeriodRow === null ||
                  (firstRetroPeriodRow !== null &&
                    options.rowIndex === firstRetroPeriodRow)
                ) {
                  container.innerHTML = `<div>${options.text}</div>`;
                  firstRetroPeriodRow = options.rowIndex;
                } else {
                  container.innerHTML = `<div class="adjust-text">Adjusted</div>`;
                }
              } else {
                container.innerHTML = `<div>${options.text}</div>`;
              }
            };
          }
        });
      }
    });

    return columns;
  }

  onPopupHidden() {
    this.popupVisible = false;
  }

  currencyDisplay() {
    return this.amortizationDataGrid[0].functionalCurrency ==
      this.amortizationDataGrid[0].localCurrency
      ? this.amortizationDataGrid[0].localCurrency
      : this.amortizationDataGrid[0].localCurrency +
          ' | ' +
          this.amortizationDataGrid[0].functionalCurrency +
          ': ' +
          this.amortizationDataGrid[0].functionalCurrencyRate.toString('N4');
  }

  getSummaryFields() {
    interface SummaryField {
      column: string;
      summaryType: string;
      displayFormat: string | ((value: any) => string);
      alignment?: string;
    }

    const totalItems: Array<SummaryField> = [],
      columns = [
        'DepreciationExpense',
        'AssetAdjustmentAmount',
        'LiabilityReduction',
        'LiabilityAdjustmentAmount',
        'CashAPAmount',
        'StraightLineExpense',
        'DeferredLeaseExpense',
        'AdjustmentAmount',
        'AssetAmortization',
        'InterestExpense',
        'LevelExpense',
        'LeaseLiabilityInterestExpense',
        'AssetAdjustment',
        'LiabilityAdjustment',
        'AdjustmentAmountOperating',
      ],
      functionalColumns = [
        'FunctionalAssetAdjustmentAmount',
        'FunctionalAssetAmortization',
        'FunctionalROUAssetInterestExpense',
        'FunctionalLevelExpense',
      ];

    columns.forEach((name) => {
      totalItems.push({
        column: name,
        summaryType: 'sum',
        displayFormat: (value) =>
          this.formatService.localFormat(
            +value,
            this.eventScheduleData.localCurrencyDecimalPrecision
          ),
        alignment: 'right',
      });
    });

    functionalColumns.forEach((name) => {
      totalItems.push({
        column: name,
        summaryType: 'sum',
        displayFormat: (value) =>
          this.formatService.functionalFormat(
            +value,
            this.eventScheduleData.functionalCurrencyDecimalPrecision
          ),
        alignment: 'right',
      });
    });

    return { totalItems };
  }

  sendToExcel() {
    const classificationType = this.classificationType;
    const amortizationProfileName = this.amortizationProfileName;
    const sheetname =
      this.accountingSummaryService.getLeaseAbstractId() +
      ' - ' +
      amortizationProfileName;
    const filename = this.accountingSummaryService.generateFileName(
      classificationType,
      amortizationProfileName
    );
    this.accountingSummaryService.exportToExcel(
      this.amortizationDataGrid.instance,
      filename,
      sheetname
    );
  }

  openMoreMenu(event: Event): void {
    event.stopPropagation();
  }

  private setupGridColumnsForRetroPopup(visibleColumns) {
    this.gridColumnsForRetroPopup = JSON.parse(
      JSON.stringify(this.amortizationDataGrid.columns)
    );
    let resultColumnsArray = JSON.parse(
      JSON.stringify(this.amortizationDataGrid.columns)
    );
    let bandColIndex = 0;

    this.gridColumnsForRetroPopup.forEach((bandedCol) => {
      let subColIndex = 0;
      let setBandColVisibleToTrue = false;

      bandedCol.columns.forEach((subCol) => {
        const foundColumn = visibleColumns.find(
          (vc) => vc?.name?.toLowerCase() === subCol?.name?.toLowerCase()
        );
        if (foundColumn !== undefined) {
          resultColumnsArray[bandColIndex].columns[subColIndex] = foundColumn;
          setBandColVisibleToTrue = true;
        }

        subColIndex++;
      });

      if (setBandColVisibleToTrue && !bandedCol.visible) {
        resultColumnsArray[bandColIndex].visible = true;
      }

      bandColIndex++;
    });

    this.gridColumnsForRetroPopup = resultColumnsArray;
  }

  showMaxRows() {
    this.amortizationGridHeight = 'auto';
    this.showMaxRow = false;
    this.showDefaultRow = false;
    this.showMinRow = true;
  }

  showDefaultRows() {
    let amortizationHeaderID =
      '#' +
      this.accountingSummaryService.getId(this.componentName, 'card', 'header');
    this.amortizationGridHeight = (
      window.innerHeight -
      document.querySelector(amortizationHeaderID).getBoundingClientRect()
        .bottom
    ).toString();
    this.showMaxRow = true;
    this.showDefaultRow = false;
    this.showMinRow = false;
  }

  showMinRows() {
    this.amortizationGridHeight = this.accountingSummaryService.setGridHeight(
      this.amortizationDataGrid,
      15
    );
    this.amortizationGridHeight =
      parseInt(this.amortizationGridHeight) - 5 + 'px';
    this.showMaxRow = false;
    this.showDefaultRow = true;
    this.showMinRow = false;
  }
}
