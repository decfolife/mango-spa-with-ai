import { PortfolioSettingsResponse } from '@accounting-summary/models/portfolio-settings-response.modal';
import { UserInfoResponse } from '@accounting-summary/models/user-info-response.modal';
import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import { EventsGridColumnsService } from '@accounting-summary/services/events-grid-columns.service';
import { FormattingService } from '@accounting-summary/services/formatting.service';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import {
  DxDataGridComponent,
  DxDropDownBoxComponent,
} from 'devextreme-angular';
import { trigger } from 'devextreme/events';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '@mango/core-shared';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EditRouAssetComponent } from './edit-rou-asset/edit-rou-asset.component';
import { filter } from 'rxjs/operators';
import { DeleteHistoricScheduleComponent } from './deleteHistoricSchedule/delete-historic-schedule.component';
import { AddEditScheduleService } from '@accounting-summary/services/add-edit-schedule.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { AccountingEventSelector } from '@accounting-summary/models/interfaces/accounting-events-selector.interfaces';
import { formatDate } from '@angular/common';
@Component({
  selector: 'mango-events-detail-section',
  templateUrl: './events-detail-section.component.html',
  styleUrls: ['./events-detail-section.component.scss'],
})
export class EventsDetailSectionComponent
  implements OnChanges, OnDestroy, OnInit
{
  @ViewChild('EventsDataGrid') eventsDataGrid: DxDataGridComponent;
  @ViewChild('EventsSelectDataGrid') eventsSelectDataGrid: DxDataGridComponent;
  @ViewChild('EventSelectorDropdown', { static: false })
  EventSelectorDropdown: DxDropDownBoxComponent;
  @Input() leaseIsLocked: boolean;
  @Input() leaseIsArchived: boolean;
  @Input() rightsInfo: any;
  @Input() wfStatusRights: any;
  @Input() userInfo: UserInfoResponse;
  @Output() eventScheduleSelectedEvent = new EventEmitter();
  @Output() dataChanged: EventEmitter<any> = new EventEmitter();
  classificationType: string;
  amortizationProfileName: string;
  masterScheduleID: number;
  detailsGridData: any[];
  detailColumns = [];
  gridName = 'Events';
  componentName = 'events-grid';
  eventGridHeight: string;
  classificationId: number;
  isLoading = false;
  selectedRowKeys: number[];
  isEuroDateFormat = false;
  dateFormat = 'MM/dd/yyyy';
  expanded = true;
  preferenceSavePendingMessage: string;
  isGridStateChanged = false;
  initialState = {};
  portfolioSettings: PortfolioSettingsResponse;
  showEditIcon: boolean;
  private subscription = new Subscription();
  private masterScheduleIDChanged = false;
  private userInfoLoaded = false;
  private publishedEvent: any;
  private setInitialSelectedRow = false;
  private gridPreferencesUpdated = false;
  private previousClassification = null;
  private allExpanded = false;
  userHasEditLeaseRights = true;
  wfStatusHasEditRights = true;
  userHasLeftNavEditRights = true;
  userHasDeleteAccountingSchedulesModuleRight = true;
  isGridBoxOpened = false;
  gridDataSource: AccountingEventSelector[];
  gridBoxValue: number[] = [];
  pagingEnabled = false;
  leaseRecognitionScheduleID: number;
  classificationID: number;
  isAccountingEventEmpty = true;
  gridsState: any;
  showMaxRow = true;
  showDefaultRow = false;
  showMinRow = false;
  expandedRowCount = 0;
  totalRowCount = 0;
  eventsGridData = [];
  rouAssetPriorAmount: number;
  priorEventBeginDate: Date;
  priorEventEndDate: Date;
  resetBtnHoverText =
    'This will delete any saved preferences, taking you back the CoStar default columns';
  clearBtnHoverText = 'This will clear all pending changes in the grid';
  queryParamObj = {};
  eventsCount: number;
  isPrevNextButtonDisabled = false;
  showPrevNextButton = true;

  constructor(
    public accountingSummaryService: AccountingSummaryService,
    private columnService: EventsGridColumnsService,
    private formatService: FormattingService,
    private ref: ChangeDetectorRef,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private storageService: StorageService,
    private dialog: MatDialog,
    private addEditScheduleService: AddEditScheduleService,
    private clipboard: Clipboard
  ) {
    this.preferenceSavePendingMessage =
      accountingSummaryService.preferenceSavePendingMessage;
  }

  ngOnInit(): void {
    this.getEventsDropDownData();
    this.getQueryParams();
    this.getAmortizationGridLoadingStatus();
    this.subscription.add(
      this.accountingSummaryService.newCreatedSchedule.subscribe(
        (selectAccountingEvent) => {
          if (!selectAccountingEvent) {
            return;
          } else {
            this.gridBoxValue[0] = +selectAccountingEvent;
            this.setLeaseSessionStore();
          }
        }
      )
    );

    this.subscription.add(
      this.accountingSummaryService.jeActionTaken$.subscribe(
        (jeActionTaken) => {
          if (jeActionTaken && this.masterScheduleID) {
            this.eventsGridSetup(this.masterScheduleID);
          }
        }
      )
    );
    localStorage.removeItem('minROUActionDate');
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.getUserPreferences();
    //MasterScheduleID and userInfo has to be populated in order to call eventsGridSetup
    if (
      changes.masterScheduleID !== undefined &&
      changes.masterScheduleID.previousValue !=
        changes.masterScheduleID.currentValue
    ) {
      this.masterScheduleIDChanged = true;
    }

    if (
      changes.userInfo !== undefined &&
      changes.userInfo.currentValue !== undefined
    ) {
      this.userInfoLoaded = true;
    }

    if (this.masterScheduleIDChanged && this.userInfoLoaded) {
      this.eventsGridSetup(this.masterScheduleID);
      this.masterScheduleIDChanged = false;
    }

    if (
      (changes.wfStatusRights &&
        changes.wfStatusRights !== undefined &&
        changes.wfStatusRights.currentValue !== undefined) ||
      (changes.rightsInfo &&
        changes.rightsInfo !== undefined &&
        changes.rightsInfo.currentValue !== undefined)
    ) {
      this.setRights();
    }

    // Determine if the Action's context menu based on rights and lease's state
    this.showEditIcon =
      this.userHasEditLeaseRights &&
      this.wfStatusHasEditRights &&
      this.userHasLeftNavEditRights &&
      !this.leaseIsLocked &&
      !this.leaseIsArchived;

    const gridBoxValue =
      this.storageService.getData('accounting_summary')?.gridBoxValue; // Check if session exists
    !gridBoxValue ?? this.onValueChanged({ value: gridBoxValue }); // fix: Calling it artificially to compensate for the lifecycle issue
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getUserPreferences() {
    this.isEuroDateFormat = this.userInfo?.useDateEU;
    if (this.isEuroDateFormat) {
      this.dateFormat = 'dd.MM.yyyy';
    }
  }

  getQueryParams() {
    const queryString = window.location.search;
    if (queryString !== '') {
      const queryParamArray = queryString.substring(1).split('&');
      queryParamArray.forEach((qp) => {
        const nameValue = qp.split('=');
        this.queryParamObj[nameValue[0]] = nameValue[1];
      });
    }
  }

  eventsGridSetup(masterScheduleId: number) {
    this.isGridStateChanged = false;
    const eventDetails =
      this.accountingSummaryService.getEventDetails(masterScheduleId);
    this.subscription.add(
      eventDetails.subscribe((eventDetailsResponse) => {
        if (
          eventDetailsResponse === null ||
          eventDetailsResponse.data.length === 0
        ) {
          this.eventsDataGrid.instance.state(null);
          this.accountingSummaryService.displayContactSystemAdminMessage();
        } else if (
          eventDetailsResponse.data.length != 0 &&
          eventDetailsResponse.success
        ) {
          this.classificationId = eventDetailsResponse.data[0].classificationID;
          this.detailsGridData = eventDetailsResponse.data.sort(
            (a, b) => a.scheduleIndex - b.scheduleIndex
          );
          this.addPriorROUAssetObtainedToDetailsGridData();

          this.portfolioSettings =
            this.accountingSummaryService.getSavedPortfolioSettings();

          if (eventDetailsResponse.data.length > 1) {
            const getPriorRow = eventDetailsResponse.data.length - 2;
            this.rouAssetPriorAmount =
              eventDetailsResponse.data[getPriorRow].rouAssetObtainedAmount;

            this.priorEventBeginDate =
              eventDetailsResponse.data[getPriorRow].beginDate;
            this.priorEventEndDate =
              eventDetailsResponse.data[getPriorRow].endDate;
          } else if (eventDetailsResponse.data.length === 1) {
            this.rouAssetPriorAmount =
              eventDetailsResponse.data[0].rouAssetObtainedAmount;
            this.priorEventBeginDate = eventDetailsResponse.data[0].beginDate;
            this.priorEventEndDate = eventDetailsResponse.data[0].endDate;
          }

          // Adding fields to datasource based on classificationId && manipulating fields to display correct text
          if (this.classificationId === 0 || this.classificationId === 5) {
            this.detailsGridData.forEach((element) => {
              element.discountRateDisplay = this.discountRateDisplay(element);
              element.currencyDisplay = this.currencyDisplay(element);
            });
          } else {
            this.detailsGridData.forEach((element) => {
              element.discountRateDisplay = this.discountRateDisplay(element);
              element.currencyDisplay = this.currencyDisplay(element);
              element.formatCells = this.formatCells(element);
            });
          }

          this.detailColumns = this.columnService.getDetailsColumns(
            this.classificationId,
            this.detailsGridData[0],
            this.portfolioSettings,
            this.dateFormat
          );

          this.publishedEvent = this.detailsGridData.filter(
            (d) => d.isPublished
          )[0];
          this.setInitialSelectedRow = true;

          this.getGridPreferences();
        } else if (!eventDetailsResponse.success) {
          this.accountingSummaryService.errorNotify(
            eventDetailsResponse.clientErrorMessage
          );
        }
      })
    );
  }

  onGridContentReady(grid) {
    if (grid.component.totalCount() > 0) {
      if (this.setInitialSelectedRow || this.selectedRowKeys.length === 0) {
        this.selectedRowKeys = [this.publishedEvent.leaseRecognitionScheduleID];
        this.setInitialSelectedRow = false;
        if (this.allExpanded) {
          this.showMaxRows();
        } else {
          this.eventGridHeight =
            this.accountingSummaryService.setDefaultGridHeight(
              this.eventsDataGrid
            );
        }
      }
      const selectedRowIndex = grid.component.getRowIndexByKey(
        this.selectedRowKeys[0]
      );

      // Ensure the index is within bounds
      if (
        selectedRowIndex >= 0 &&
        selectedRowIndex < grid.component.totalCount()
      ) {
        grid.component.selectRowsByIndexes([selectedRowIndex]);

        // Adding a slight delay to ensure grid rendering is complete before executing the scroll action
        setTimeout(() => {
          const rowHeight = grid.component.getRowElement(0)[0].clientHeight;
          this.eventsDataGrid.instance
            .getScrollable()
            .scrollTo({ y: selectedRowIndex * rowHeight });
          this.highlightEventDifferencesForGridCell(grid, selectedRowIndex);
        }, 100);
      }
    }
    this.setExpandedRowCount();
  }

  getGridPreferences() {
    this.subscription.add(
      this.accountingSummaryService
        .getGridPreferences()
        .subscribe((response) => {
          if (response === null) {
            this.accountingSummaryService.displayContactSystemAdminMessage();
          } else if (response.success) {
            this.gridsState = response.data;
            let state = JSON.parse(
              sessionStorage.getItem('eventsGridStateKey')
            );
            // Filter the data
            const filteredData = response.data.filter((item) => {
              return (
                item.classificationID === this.classificationId &&
                item.gridName === this.gridName
              );
            });
            if (
              filteredData.length < 1 ||
              this.previousClassification !== this.classificationID
            ) {
              this.gridPreferencesUpdated = false;
            }
            this.previousClassification = this.classificationID;
            this.selectedRowKeys = [
              this.publishedEvent?.leaseRecognitionScheduleID,
            ];

            if (state === null) {
              state = {};
            }

            state.selectedRowKeys = [
              this.publishedEvent?.leaseRecognitionScheduleID,
            ];

            if (!this.gridPreferencesUpdated) {
              state.columns = [];
              filteredData.forEach((item) => {
                const parsedColumns = JSON.parse(item.columnJson);
                state.columns.push(...parsedColumns);
              });
            }

            this.initialState = state;
            this.eventsDataGrid.instance.state(state);
            sessionStorage.setItem('eventsGridStateKey', JSON.stringify(state));
            this.eventScheduleSelectedEvent.emit([
              this.publishedEvent,
              this.gridsState,
              this.gridDataSource,
            ]);
          } else {
            this.accountingSummaryService.errorNotify(
              response.clientErrorMessage
            );
          }
        })
    );
  }

  resetGridPreferences() {
    this.subscription.add(
      this.accountingSummaryService
        .resetGridPreferences(this.classificationId, this.gridName)
        .subscribe((response) => {
          if (response === null) {
            this.accountingSummaryService.displayContactSystemAdminMessage();
          } else if (response.success) {
            this.eventsDataGrid.instance.state({});
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
    this.eventsDataGrid.instance.state(this.initialState);
  }

  saveGridPreferences() {
    this.isGridStateChanged = false;
    const newState = this.eventsDataGrid.instance.state();
    sessionStorage.setItem('eventsGridStateKey', JSON.stringify(newState));
    const columnsState = this.eventsDataGrid.instance.state().columns;
    for (let index = 0; index < columnsState.length; index++) {
      columnsState[index].appendsCurrency =
        this.eventsDataGrid.instance.columnOption(index, 'appendsCurrency');
      columnsState[index].caption = this.eventsDataGrid.instance.columnOption(
        index,
        'caption'
      );
      columnsState[index].usesLocalFormat =
        this.eventsDataGrid.instance.columnOption(index, 'usesLocalFormat');
      columnsState[index].usesFunctionalFormat =
        this.eventsDataGrid.instance.columnOption(
          index,
          'usesFunctionalFormat'
        );
      columnsState[index].headerCellTemplate = 'accountingEventHeader';
    }
    const columns = JSON.stringify(columnsState);
    this.subscription.add(
      this.accountingSummaryService
        .saveGridPreferences(this.classificationId, this.gridName, columns)
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
    return JSON.parse(sessionStorage.getItem('eventsGridStateKey'));
  }

  saveState(state) {
    sessionStorage.setItem('eventsGridStateKey', JSON.stringify(state));
  }

  onGridOptionChanged(event) {
    if (event.fullName != 'columns' && event.name === 'columns') {
      // The grid state has changed
      this.isGridStateChanged = true;
    }
  }

  showColumnChooser() {
    this.eventsDataGrid.instance.showColumnChooser();
  }

  currencyDisplay(gridDataRow) {
    if (
      this.portfolioSettings.functionalCurrencyEnabled &&
      gridDataRow.classificationID !== 0 &&
      gridDataRow.classificationID !== 1 &&
      gridDataRow.classificationID !== 5
    ) {
      return gridDataRow.functionalCurrency == gridDataRow.localCurrency
        ? gridDataRow.localCurrency
        : gridDataRow.localCurrency +
            ' | ' +
            gridDataRow.functionalCurrency +
            ': ' +
            (
              Math.round(gridDataRow.functionalCurrencyRate * 10000) / 10000
            ).toFixed(4);
    } else {
      return gridDataRow.localCurrency;
    }
  }

  discountRateDisplay(gridDataRow) {
    return (
      (!gridDataRow.discountRate
        ? '0.0000'
        : (Math.round(gridDataRow.discountRate * 10000) / 10000).toFixed(4)) +
      '% ' +
      (gridDataRow.annualRateTypeID == 1 ? 'APR' : 'APY')
    );
  }

  implicitRateDisplay(gridDataRow) {
    return (
      (!gridDataRow.implicitRate
        ? '0.0000'
        : (gridDataRow.implicitRate * 100).toFixed(4)) + '%'
    );
  }

  fairMarketValueDisplay(fmv, precision) {
    return this.formatService.localFormat(fmv, precision);
  }

  formatCells(gridDataRow) {
    if (
      this.portfolioSettings?.functionalCurrencyEnabled &&
      gridDataRow.functionalLevelExpense < 0
    ) {
      gridDataRow.functionalLevelExpense = 'N/A';
    } else {
      gridDataRow.functionalLevelExpense = this.formatService.functionalFormat(
        gridDataRow.functionalLevelExpense,
        gridDataRow.functionalCurrencyDecimalPrecision
      );
    }
    if (
      !this.portfolioSettings?.functionalCurrencyEnabled &&
      gridDataRow.levelExpense < 0
    ) {
      gridDataRow.levelExpense = 'N/A';
    } else {
      gridDataRow.levelExpense = this.formatService.localFormat(
        gridDataRow.levelExpense,
        gridDataRow.localCurrencyDecimalPrecision
      );
    }
    gridDataRow.periods = gridDataRow.termInPeriods.toFixed(2);
  }

  onCellClick(e) {
    /*
    ClassificationID's:
    0 - Operating 840
    1 - Capital 840 (AKA Capital FAS)
    2 - Finance (ASC 842)
    3 - Operating (ASC 842)
    4 - IFRS 16
    5 - Operating (Lessor)
    6 - Sales Type (Lessor) - INACTIVE Currently
    */

    if (
      e.column.dataField === 'leaseRecognitionScheduleId' &&
      e.rowType === 'data'
    ) {
      const newEvent = Object.assign({}, e.event, { type: 'dxcontextmenu' });
      e.event.stopPropagation();
      trigger(e.cellElement, newEvent);
    }
  }

  onRowClick(e) {
    this.eventScheduleSelectedEvent.emit([e.data, this.gridsState]);
    this.eventsDataGrid.instance.repaint();
  }

  highlightEventDifferencesForGridCell(
    eventsGrid: any,
    selectedRowIndex: number
  ) {
    const visibleRows = eventsGrid.component.getVisibleRows();
    const visibleColumns = eventsGrid.component.getVisibleColumns();
    visibleRows.forEach((row) => {
      visibleColumns.forEach((col) => {
        const cElement = eventsGrid.component.getCellElement(
          row.rowIndex,
          col.dataField
        );
        const event = {
          row: row,
          column: col,
          cellElement: cElement,
          data: row.data,
        };

        if (event?.row?.rowIndex === selectedRowIndex) {
          if (
            event.row.data.scheduleIndex == 1 ||
            event.column?.caption === '#'
          ) {
            return;
          }

          const previousRow = this.detailsGridData.filter(
            (f) => f.scheduleIndex == event.row.data.scheduleIndex - 1
          )[0];

          const oldValue = Object(previousRow)[event.column.dataField];
          const newValue = Object(event.data)[event.column.dataField];
          if (oldValue !== newValue) {
            event.cellElement?.classList.add('grid-cell-box-shadow');
          } else {
            event.cellElement?.classList.remove('grid-cell-box-shadow');
          }
        }
      });
    });
  }

  presentValueExcel(event, data) {
    event.preventDefault();
    const filename =
      this.accountingSummaryService.getFileName('PresentValueTable');
    this.subscription.add(
      this.accountingSummaryService
        .exportPresentValueFile(data.leaseRecognitionScheduleID)
        .subscribe((presentValueResponse: any) => {
          if (presentValueResponse === null || !presentValueResponse) {
            this.accountingSummaryService.errorNotify(
              'Downloading the present value table failed.'
            );
          } else {
            this.accountingSummaryService.downloadExcel(
              presentValueResponse,
              filename
            );
          }
        })
    );
  }

  expandAll() {
    this.allExpanded = true;
    this.showMaxRows();
    this.eventsDataGrid.instance.expandAll(-1);
    this.setExpandedRowCount();
  }

  collapseAll() {
    this.allExpanded = false;
    this.eventsDataGrid.instance.collapseAll(-1);
    this.setExpandedRowCount();
  }

  setExpandedRowCount() {
    this.totalRowCount = this.eventsDataGrid.instance
      .getVisibleRows()
      ?.filter((x) => x.rowType == 'data').length;
    this.expandedRowCount = this.eventsDataGrid.instance
      .getVisibleRows()
      .filter((x) => x.isExpanded).length;
  }

  onContextMenuPreparing(e) {
    // e.items can be undefined
    if (!e.items) {
      e.items = [];
    }
    const edit = {
      text: 'Edit',
      visible:
        e?.row?.data?.isPublished &&
        this.showEditIcon &&
        e.row.data.jeStatus === 'Scheduled',
      value: e?.row?.data?.leaseRecognitionScheduleID,

      onItemClick: () => {
        const queryParams = {
          otid: this.queryParamObj['otid'],
          oid: this.queryParamObj['oid'],
          eventId: e.row.data.leaseRecognitionScheduleID,
          navpageid: this.queryParamObj['navpageid'],
        };
        this.router.navigate(['editEvent'], {
          state: {
            data: e.row.data,
            priorEventBeginDate: new Date(this.priorEventBeginDate),
            priorEventEndDate: new Date(this.priorEventEndDate),
          },
          relativeTo: this.activatedRoute,
          queryParams: queryParams,
        });
      },
    };

    const editRouAsset = {
      text: 'Edit ROU Asset',
      visible:
        e?.row?.data?.isPublished &&
        this.showEditIcon &&
        e.row.data.measureEvent !== 'Impairment' &&
        (e.row.data.classificationID === 2 ||
          e.row.data.classificationID === 3 ||
          e.row.data.classificationID === 4),
      value: e.row.data.leaseRecognitionScheduleID,
      onItemClick: () => {
        const ROUAssetData = {
          portfolioSettings: this.portfolioSettings,
          classificationID: e.row.data.classificationID,
          scheduleId: e.row.data.leaseRecognitionScheduleID,
          dateFormat: this.dateFormat,
          rouAssetMethodID: e.row.data.rouAssetMethodID,
          rouAssetObtainedMethod: e.row.data.rouAssetObtainedMethod,
          rouAssetObtainedAmount: e.row.data.rouAssetObtainedAmount,
          rouAssetObtainedDate: e.row.data.rouAssetObtainedDate,
          beginDate: e.row.data.beginDate,
          endDate: e.row.data.endDate,
          measureEvent: e.row.data.measureEvent,
          openingAssetBalance: e.row.data.openingAssetBalance,
          systemAssetAdjustment: e.row.data.systemAssetAdjustment,
          manualAssetAdjustment: e.row.data.manualAssetAdjustment,
          adjustment: e.row.data.adjustment,
          rouAssetPriorAmount: this.rouAssetPriorAmount,
          minROUActionDate: this.detailsGridData[0].beginDate,
        };

        const dialogRef: MatDialogRef<any, any> = this.dialog.open(
          EditRouAssetComponent,
          {
            disableClose: true,
            height: 'auto',
            width: '700px',
            maxWidth: '1100px',
            data: {
              eventRoutAssetData: ROUAssetData,
            },
          }
        );

        this.subscription.add(
          dialogRef
            .afterClosed()
            .pipe(filter((res) => !!res))
            .subscribe((saveROUAssetObtained) => {
              if (saveROUAssetObtained.success) {
                this.addEditScheduleService.showToast(
                  'Save ROU Asset Obtained',
                  'ROU Asset Obtained saved successfully.',
                  'success',
                  false
                );
                this.eventsGridSetup(this.masterScheduleID);
                this.eventScheduleSelectedEvent.emit([e.data, this.gridsState]);
              }
            })
        );
      },
    };

    const remeasure = {
      text: 'Remeasure',
      beginGroup: true,
      visible: e.row.data.isPublished && this.showEditIcon,
      items: [
        {
          text: 'Renewal',
          value: e.row.data.leaseRecognitionScheduleId,
          onItemClick: () => {
            this.navigateToRemeasureEvent(1, 'Renewal', e.row.data);
          },
        },
        {
          text: 'Data Correction',
          value: e.row.data.leaseRecognitionScheduleId,
          onItemClick: () => {
            this.navigateToRemeasureEvent(2, 'Data Correction', e.row.data);
          },
        },
        {
          text: 'Rent Review (IFRS)',
          visible: [4, 7].includes(this.classificationId),
          value: e.row.data.leaseRecognitionScheduleId,
          onItemClick: () => {
            this.navigateToRemeasureEvent(3, 'Rent Review (IFRS)', e.row.data);
          },
        },
        {
          text: 'CPI Cumulative Cap Reached',
          visible: [2, 3, 4, 7].includes(this.classificationId),
          value: e.row.data.leaseRecognitionScheduleId,
          onItemClick: () => {
            this.navigateToRemeasureEvent(
              4,
              'CPI Cumulative Cap Reached',
              e.row.data
            );
          },
        },
        {
          text: 'Other',
          value: e.row.data.leaseRecognitionScheduleId,
          onItemClick: () => {
            this.navigateToRemeasureEvent(5, 'Other', e.row.data);
          },
        },
        {
          text: 'Impairment',
          visible: [2, 3, 4, 7].includes(this.classificationId),
          value: e.row.data.leaseRecognitionScheduleId,
          onItemClick: () => {
            this.navigateToRemeasureEvent(6, 'Impairment', e.row.data);
          },
        },
        {
          text: 'Partial Termination',
          visible: [2, 3, 4, 7].includes(this.classificationId),
          value: e.row.data.leaseRecognitionScheduleId,
          onItemClick: () => {
            this.navigateToRemeasureEvent(7, 'Partial Termination', e.row.data);
          },
        },
        {
          text: 'Termination',
          value: e.row.data.leaseRecognitionScheduleId,
          onItemClick: () => {
            this.navigateToRemeasureEvent(8, 'Termination', e.row.data);
          },
        },
        {
          text: 'Full Termination',
          visible: [2, 3, 4].includes(this.classificationId),
          value: e.row.data.leaseRecognitionScheduleId,
          onItemClick: () => {
            this.navigateToRemeasureEvent(9, 'Full Termination', e.row.data);
          },
        },
      ],
    };

    const deleteSchedule = {
      text: 'Delete',
      value: e.row.data.leaseRecognitionScheduleID + '|' + e.row.data.jeStatus,
      beginGroup: true,
      visible: e.row.data.isPublished && this.showEditIcon,
      onItemClick: () => {
        let dialogRef = this.dialog.open(DeleteHistoricScheduleComponent, {
          width: '600px',
          panelClass: 'client-delivery-modal',
          data: {
            isInProcess: e.row.data.jeStatus === 'In Process',
            isHistorical: e.row.data.jeStatus === 'Historical',
            confirmButtonText: 'Yes, delete',
            showCloseButton: true,
            closeButtonText: 'No, cancel',
            title:
              e.row.data.jeStatus === 'Historical'
                ? 'Delete Historic Accounting Event'
                : 'Delete Accounting Event',
          },
          disableClose: true,
        });
        dialogRef.afterClosed().subscribe((response) => {
          if (response === true) {
            this.deleteSchedule(e);
          }
        });
      },
    };

    const scheduleId = {
      text: 'Event ID: ' + e.row.data.leaseRecognitionScheduleID,
      disabled: false,
      selectable: true,
      beginGroup: true,
      icon: 'faCopy',
      onItemClick: () => {
        this.clipboard.copy(e.row.data.leaseRecognitionScheduleID);
      },
    };

    if (this.showEditIcon) {
      e.items.push(edit);
      if (
        this.portfolioSettings?.leaseRecognitionCalendarID != 1 &&
        this.classificationId === 1
      ) {
        // No Remeasure option for Cap 840 using custom calendar
      } else {
        e.items.push(remeasure);
      }
      //Temporarily Remove due to CoE concerns and existing bug
      //Retro schedules do not currently regenerate properly on
      //edit from summary page
      //e.items.push(editRouAsset);

      if (
        this.userHasDeleteAccountingSchedulesModuleRight ||
        (e.row.data.isPublished && e.row.data.jeStatus === 'Scheduled')
      ) {
        e.items.push(deleteSchedule);
      }
    }

    e.items.push(scheduleId);
  }

  navigateToRemeasureEvent(
    remeasureTypeId: number,
    measureEvent: string,
    rowData
  ) {
    const queryParams = {
      otid: this.queryParamObj['otid'],
      oid: this.queryParamObj['oid'],
      remeasureTypeId: remeasureTypeId,
      eventId: rowData?.leaseRecognitionScheduleID,
      navpageid: this.queryParamObj['navpageid'],
    };
    this.router?.navigate(['remeasureEvent'], {
      relativeTo: this.activatedRoute,
      state: {
        data: rowData,
        measureEvent: measureEvent,
        priorEventBeginDate: new Date(rowData.beginDate),
        priorEventEndDate: new Date(this.priorEventEndDate),
      },
      queryParams: queryParams,
    });
    localStorage.setItem('minROUActionDate', this.detailsGridData[0].beginDate);
  }

  private setRights() {
    this.userHasEditLeaseRights = this.rightsInfo?.userHasEditLeaseRights;
    this.wfStatusHasEditRights = this.wfStatusRights?.wfStatusUserHasEditRights;
    this.userHasLeftNavEditRights = this.rightsInfo?.userHasLeftNavEditRights;
    this.userHasDeleteAccountingSchedulesModuleRight =
      this.rightsInfo?.userCanDeleteSchedule &&
      this.rightsInfo?.userCanAddSchedule &&
      this.wfStatusHasEditRights;
  }

  private addPriorROUAssetObtainedToDetailsGridData() {
    let priorROUAssetObtainedAmount: number = null;

    this.detailsGridData.forEach((dgr) => {
      dgr['priorROUAssetObtainedAmount'] = priorROUAssetObtainedAmount;

      priorROUAssetObtainedAmount = dgr.rouAssetObtainedAmount;
    });
  }

  sendToExcel() {
    const classificationType = this.classificationType;
    const amortizationProfileName = this.amortizationProfileName;
    const componentName = 'Accounting Events';
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
      this.eventsDataGrid.instance,
      filename,
      sheetname
    );
  }

  onGridBoxOptionChanged(e) {
    if (e.name === 'value' && this.isGridBoxOpened) {
      this.isGridBoxOpened = false;
      this.ref.detectChanges();
    }
  }

  onValueChanged(event: any) {
    const newSchedule = this.masterScheduleID != event.value;
    this.masterScheduleID = parseInt(event.value);
    const selectedEvent = this.gridDataSource.find(
      (x) => x.masterScheduleID === this.masterScheduleID && x.isPublished
    );
    this.classificationID = selectedEvent?.classificationID;
    this.leaseRecognitionScheduleID = selectedEvent?.leaseRecognitionScheduleID;
    this.amortizationProfileName = selectedEvent?.amortizationProfileName;
    this.classificationType = selectedEvent?.classificationType;
    if (newSchedule) {
      this.detailsGridData = [];
      this.eventsGridSetup(this.masterScheduleID);
      this.emitDataChanged();
      this.setLeaseSessionStore();
    }
  }

  /**
   * Saves the state of the last visited Lease into session storage
   * when clear is true, then delete session data.
   * @private
   * @param {boolean} [clear]
   * @return {*}
   * @memberof EventsDetailSectionComponent
   */
  private setLeaseSessionStore(clear?: boolean) {
    if (clear) {
      this.storageService.deleteData('accounting_summary');
      return;
    }
    this.storageService.saveSyncedSessionData(
      {
        gridBoxValue: this.gridBoxValue[0],
        leaseAbstractID: localStorage.getItem('accSumLeaseAbstractId'),
      },
      'accounting_summary'
    );
  }

  /**
   * Based on the accounting event dropdown setup the grids for the page.
   *
   * @private
   * @memberof EventsDetailSectionComponent
   */
  private getEventsDropDownData() {
    this.subscription.add(
      this.accountingSummaryService
        .getAccountingEvents()
        .subscribe((response) => {
          if (response === null) {
            this.accountingSummaryService.displayContactSystemAdminMessage();
          } else if (response.success && response.data.length != 0) {
            //  If an accounting event for the current lease ID has been selected before try refetching selection
            const sessionLease: { [key: string]: any } =
              this.storageService.getData('accounting_summary');
            const leaseAbstractID: string = localStorage.getItem(
              'accSumLeaseAbstractId'
            );

            this.gridDataSource = response.data
              .filter((eventItem) => eventItem.isPublished)
              .map((item) => ({
                ...item,
                endDate: formatDate(item.endDate, this.dateFormat, 'en-US'),
              }));

            this.eventsCount = this.gridDataSource?.length;
            this.eventsCount <= 1 ? (this.showPrevNextButton = false) : true;
            // Check if masterScheduleID exists in session storage. If it does, load the session data; otherwise, load data from accountingEventsDropdown.
            const doesMasterScheduleExistInSession = this.gridDataSource.some(
              (item) => item.masterScheduleID === sessionLease?.gridBoxValue
            );

            // leaseAbstractID was found from the sessionStorage
            if (
              sessionLease?.leaseAbstractID === leaseAbstractID &&
              doesMasterScheduleExistInSession
            ) {
              const dataSource = response.data.filter(
                // Load the data source that has the right gridBoxValue
                (eventItem) =>
                  eventItem.masterScheduleID === sessionLease?.gridBoxValue &&
                  eventItem.isPublished
              );
              this.gridBoxValue = [sessionLease.gridBoxValue]; // Assign value to Accounting Event dropdown
              this.masterScheduleID = sessionLease?.gridBoxValue;
              this.leaseRecognitionScheduleID =
                dataSource[0].leaseRecognitionScheduleID;
              this.classificationID = dataSource[0].classificationID;
              this.amortizationProfileName =
                dataSource[0].amortizationProfileName;
              this.classificationType = dataSource[0].classificationType;
            } else {
              // Not the same Lease ID, clear accounting event dropdown via the setLeaseSessionStore
              this.setLeaseSessionStore(true); // clears accounting-summary session's data
              this.gridBoxValue = [this.gridDataSource[0].masterScheduleID];
              this.masterScheduleID = this.gridDataSource[0].masterScheduleID;
              this.leaseRecognitionScheduleID =
                this.gridDataSource[0].leaseRecognitionScheduleID;
              this.classificationID = this.gridDataSource[0].classificationID;
              this.amortizationProfileName =
                this.gridDataSource[0].amortizationProfileName;
              this.classificationType =
                this.gridDataSource[0].classificationType;
            }
            this.pagingEnabled = this.gridDataSource.length > 10;
            this.isAccountingEventEmpty = false;
            this.eventsGridSetup(this.masterScheduleID);
            this.emitDataChanged();
          } else if (!response.success) {
            this.accountingSummaryService.errorNotify(
              response.clientErrorMessage
            );
          } else if (response.data.length === 0) {
            this.isAccountingEventEmpty = true;
            this.eventsDataGrid.instance.option(
              'noDataText',
              'No Accounting Events, Click Add to Add a New Event.'
            );
            this.emitDataChanged();
          }
        })
    );
  }

  getAmortizationGridLoadingStatus() {
    this.subscription.add(
      this.accountingSummaryService.isAmortizationDataLoaded$.subscribe(
        (value) => {
          this.isPrevNextButtonDisabled = !value;
        }
      )
    );
  }

  saveVisitedEventsToSession(key: any) {
    const leaseAbstractID = +this.queryParamObj['oid'];
    const eventsInSession = sessionStorage.getItem('visitedEvents');
    const visited = eventsInSession ? JSON.parse(eventsInSession) : [];

    const exists = visited.some(
      (item) => item.key === key && item.leaseAbstractID === leaseAbstractID
    );
    if (!exists) {
      visited.push({ key, leaseAbstractID });
      sessionStorage.setItem('visitedEvents', JSON.stringify(visited));
    }
  }

  onEventSelectorContentReady(event) {
    const selectedKey = event?.component.getSelectedRowKeys()[0];
    this.saveVisitedEventsToSession(selectedKey);
    const gridInstance = this.eventsSelectDataGrid?.instance;
    const rows = gridInstance?.getVisibleRows();

    rows.length <= 1
      ? (this.isPrevNextButtonDisabled = true)
      : (this.isPrevNextButtonDisabled = false);
  }

  onEventSelectorRowClick(e: any) {
    const key = e.key;
    this.eventsSelectDataGrid.instance.repaint();
    this.saveVisitedEventsToSession(key);
  }

  onEventSelectorCellPrepared(e: any) {
    if (e.rowType === 'data') {
      const rowKey = String(e.key);
      const leaseAbstractID = +this.queryParamObj['oid'];

      const visitedEvents = sessionStorage.getItem('visitedEvents');
      let visitedKeys = new Set<string>();

      if (visitedEvents) {
        const parsed = JSON.parse(visitedEvents);

        // Filter items by leaseAbstractID and extract keys as strings
        const keys = parsed
          .filter(
            (item) =>
              item.key !== undefined && item.leaseAbstractID === leaseAbstractID
          )
          .map((item) => String(item.key));
        visitedKeys = new Set(keys);
      }

      if (visitedKeys.has(rowKey)) {
        e.cellElement.style.color = '#800080';
      }
    }
  }

  selectNextRow() {
    const gridInstance = this.eventsSelectDataGrid?.instance;
    const allVisibleRows = gridInstance?.getVisibleRows();

    if (!allVisibleRows || allVisibleRows.length === 0) return;

    const groupByRows = allVisibleRows.filter((row) => row.rowType === 'data');
    if (groupByRows.length === 0) return;

    const selectedKey = gridInstance.getSelectedRowKeys()[0];
    const currentIndex = groupByRows.findIndex(
      (row) => row.key === selectedKey
    );

    this.saveVisitedEventsToSession(selectedKey);

    if (currentIndex === -1 || currentIndex === groupByRows.length - 1) {
      this.selectRowByIndex(groupByRows[0].rowIndex);
    } else {
      this.selectRowByIndex(groupByRows[currentIndex + 1].rowIndex);
    }

    gridInstance?.repaint();
  }

  selectPreviousRow() {
    const gridInstance = this.eventsSelectDataGrid?.instance;
    const allRows = gridInstance?.getVisibleRows();

    if (!allRows || allRows.length === 0) return;

    const dataRows = allRows.filter((row) => row.rowType === 'data');

    if (dataRows.length === 0) return;

    const selectedKey = gridInstance?.getSelectedRowKeys()[0];
    const currentIndex = dataRows.findIndex((row) => row.key === selectedKey);

    this.saveVisitedEventsToSession(selectedKey);

    if (currentIndex === -1) {
      this.selectRowByIndex(dataRows[dataRows.length - 1].rowIndex);
    } else {
      const prevIndex =
        currentIndex === 0 ? dataRows.length - 1 : currentIndex - 1;
      this.selectRowByIndex(dataRows[prevIndex].rowIndex);
    }

    gridInstance?.repaint();
  }

  selectRowByIndex(index: number) {
    const gridInstance = this.eventsSelectDataGrid?.instance;
    const rows = gridInstance?.getVisibleRows();

    if (index >= 0 && index < rows.length) {
      const rowKey = rows[index].key;
      gridInstance.selectRows([rowKey], false);

      gridInstance.option('focusedRowIndex', index);
    }
  }

  gridBox_displayExpr(item) {
    this.gridBoxValue = [item.masterScheduleID];
    return (
      item && `${item.classificationType} | ${item.amortizationProfileName} `
    );
  }

  private deleteSchedule(e) {
    this.eventsDataGrid.instance.beginCustomLoading('Deleting Schedule');
    this.subscription.add(
      this.accountingSummaryService
        .deleteAccountingEvent(e.row.data.leaseRecognitionScheduleID)
        .subscribe((data) => {
          if (data.success) {
            if (e.row.data.scheduleIndex === 1) {
              this.setLeaseSessionStore(true);
              if (this.gridDataSource.length === 1) {
                this.isAccountingEventEmpty = true;
                this.eventGridHeight =
                  this.accountingSummaryService.setGridHeight(
                    this.eventsDataGrid,
                    2
                  );
                this.accountingSummaryService.clearGrid(
                  this.eventsDataGrid,
                  'No Data'
                );
                this.emitDataChanged();
              }
            }
            this.addEditScheduleService.showToast(
              'Delete Accounting Event',
              'Accounting event deleted successfully.',
              'success',
              false
            );
            this.getEventsDropDownData();
          } else {
            this.addEditScheduleService.showToast(
              'Delete Accounting Event',
              'An error occurred while deleting the accounting event.',
              'error',
              false
            );
          }
          this.eventsDataGrid.instance.endCustomLoading();
        })
    );
  }

  private emitDataChanged() {
    this.dataChanged.emit({
      amortizationProfileName: this.amortizationProfileName,
      classificationType: this.classificationType,
      isAccountingEventEmpty: this.isAccountingEventEmpty,
      classificationID: this.classificationID,
    });
  }

  searchDataGrid(data: string) {
    this.eventsSelectDataGrid?.instance?.searchByText(data);
  }

  // Add keyboard accessibility for Events Selector
  handleDropdownActivationKeys(event: KeyboardEvent): void {
    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'Spacebar'
    ) {
      event.stopPropagation();
      event.preventDefault();
      this.EventSelectorDropdown.instance.open();
    }
  }

  openMoreMenu(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  showMaxRows() {
    this.eventGridHeight = 'auto';
    this.showMaxRow = false;
    this.showDefaultRow = false;
    this.showMinRow = true;
  }

  showDefaultRows() {
    this.eventGridHeight = this.accountingSummaryService.setDefaultGridHeight(
      this.eventsDataGrid
    );
    if (this.eventsDataGrid.instance.totalCount() > 3) {
      this.eventsDataGrid.instance.refresh();
    }
    this.showMaxRow = true;
    this.showDefaultRow = false;
    this.showMinRow = false;
  }

  showMinRows() {
    this.eventGridHeight = this.accountingSummaryService.setGridHeight(
      this.eventsDataGrid,
      1
    );
    if (this.eventsDataGrid.instance.totalCount() > 1) {
      this.eventsDataGrid.instance.refresh();
    }
    this.showMaxRow = false;
    this.showDefaultRow = true;
    this.showMinRow = false;
  }
}
