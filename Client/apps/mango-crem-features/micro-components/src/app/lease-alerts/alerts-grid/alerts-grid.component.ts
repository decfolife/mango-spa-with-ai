import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import { DxDataGridComponent } from 'devextreme-angular';
import { DxPopupComponent } from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import CheckBox from 'devextreme/ui/check_box';
import { Column } from 'devextreme/ui/data_grid';
import * as events from 'devextreme/events';
import { Subscription, combineLatest, of } from 'rxjs';

import { AlertsService } from '../shared/service/alerts.service';
import {
  ApiResponse,
  LeaseAlert,
  Portfolio,
  LeaseAlertFilter,
  LeaseAlertToggleDTO,
  SelectedColumns,
} from '../shared/models';
import { Router } from '@angular/router';

type RedirectorLink = {
  basePageUrl: string;
  fieldType: number;
  objectTypeId: number;
  objectTypeTypeId: number;
  urlLink: string;
};

type RedirectorLinks = {
  redirectorLinks: RedirectorLink[];
};

const LEASE_OTID = 4;

@Component({
  selector: 'mango-alerts-grid',
  templateUrl: './alerts-grid.component.html',
  styleUrls: ['./alerts-grid.component.scss'],
})
export class AlertsGridComponent implements OnInit {
  @Input()
  userCanEdit = false;
  @Input()
  showLoading = false;

  @Input()
  isPopupView = false;

  @Input()
  leaseAbstractID: number;

  @Output()
  gridSelectionChanged = new EventEmitter<number>();

  @Output()
  filterCountChanged = new EventEmitter<number>();

  @Output()
  archivedOnlyChanged = new EventEmitter<boolean>();

  @Output()
  isLoading = new EventEmitter<boolean>();

  @Output()
  enableCollapseExpandAll = new EventEmitter<boolean>();

  @ViewChild('leaseAlertsGrid')
  leaseAlertsGrid: DxDataGridComponent;

  @ViewChild('dismissPopup')
  dismissPopup: DxPopupComponent;

  dateFormat = 'MM/dd/yyyy';
  gridData: LeaseAlert[] = [];
  currentPortfolio: Portfolio;
  currentSearch: string;
  currentLeaseStatusFilter: string;
  customMessageAlert: LeaseAlert;
  isInitialLoading = true;
  firstPageLoad = true;
  isLoadingData = false;
  isArchived = false;
  filterBuilderVisible = false;
  isDismissReasonRequired = true;
  hasListener = false;
  isDismissed = false;

  customReasonString = 'Enter Custom Reason';
  selectedDismissToggleReason = '';
  dismissReasonText = '';
  dismissToggleReasonText = '';
  dismissReasons: string[];

  showDismissPopup = false;
  showDismissTogglePopup = false;
  dismissToggleReasonIsCustom = false;
  isDismissToggleDropdownOpen = false;
  isAllExpanded = false;

  selectedKeys = [];
  sortedFilterFields = [];

  private leaseAlerts: LeaseAlert[];
  private leaseLinks: RedirectorLink[];

  private subscription = new Subscription();

  dismissButtonOptions = {
    text: 'Dismiss',
    elementAttr: { class: 'btn btn-primary dismissBtn' },
    onClick: () => {
      if (this.dismissReasonText.length === 0 && this.isDismissReasonRequired) {
        notify({
          message: 'Dismiss reason is required.',
          type: 'error',
          displayTime: 3000,
          position: {
            my: 'bottom right',
            at: 'bottom right',
            offset: '-16 -16',
          },
          maxWidth: '400px',
          closeOnClick: true,
        });

        return;
      }

      this.toggleAlert(this.customMessageAlert, {
        itemData: this.dismissReasonText,
      });

      this.showDismissPopup = false;
    },
  };

  dismissToggleButtonOptions = {
    text: 'Dismiss',
    elementAttr: { class: 'btn btn-primary dismissBtn' },
    onClick: () => {
      const isCustomWithoutText =
        this.dismissToggleReasonIsCustom &&
        this.dismissToggleReasonText.length === 0;

      if (
        (isCustomWithoutText || this.selectedDismissToggleReason === '') &&
        this.isDismissReasonRequired
      ) {
        notify({
          message: 'Dismiss reason is required.',
          type: 'error',
          displayTime: 3000,
          position: {
            my: 'bottom right',
            at: 'bottom right',
            offset: '-16 -16',
          },
          maxWidth: '400px',
          closeOnClick: true,
        });

        return;
      }

      this.toggleSelectedAlerts(true);

      this.showDismissTogglePopup = false;
    },
  };

  cancelButtonOptions = {
    text: 'Cancel',
    elementAttr: { class: 'btn' },
    onClick: () => {
      this.showDismissPopup = false;
      this.showDismissTogglePopup = false;
      this.dismissReasonText = '';
      this.dismissToggleReasonText = '';
    },
  };

  selectedColumnsCopy: SelectedColumns;
  selectedColumns: SelectedColumns = {
    selectedLeaseAlertColumns: {
      leaseAlertID: true,
      alertRuleID: true,
      leaseAbstractID: true,
      leaseRecognitionScheduleID: false,
      glEventID: false,
      glEventSource: false,
      leaseRecognitionPeriodID: false,
      createdDate: false,
      alertInformation: true,
      alertExpectedValue: false,
      alertActualValue: false,
      alertRecommendedAction: true,
      isDismissed: true,
      modified: false,
      modifiedBy: false,
      dismissReason: false,
      isLocked: false,
    },

    selectedAlertRuleColumns: {
      ruleCode: true,
      ruleName: true,
      ruleDescription: true,
      ruleSeverityName: true,
      alertType: true,
    },

    selectedReportingLeasesColumns: {
      leaseSourceImportID: false,
      objectTypeTypeID: false,
      leaseTemplate: false,
      leaseTemplateBillingType: false,
      leaseTemplateBillingTypeID: false,
      portfolio: true,
      portfolioID: false,
      calendar: false,
      calendarID: false,
      buildingID: false,
      buildingSourceImportID: false,
      buildingStatus: false,
      buildingObjectTypeTypeID: false,
      buildingTemplate: false,
      buildingTemplateBillingType: false,
      buildingTemplateBillingTypeID: false,
      premiseID: false,
      systemLeaseStatus: false,
      clientLeaseID: true,
      ownershipType: false,
      buildingName: false,
      leaseName: false,
      leaseDisplayString: false,
      address1: false,
      address2: false,
      city: false,
      stateName: false,
      zipCode: false,
      country: false,
      buildingTypeID: false,
      buildingType: false,
      buildingRentableArea: false,
      buildingMeasureUnits: false,
      buildingSF: false,
      buildingSM: false,
      buildingHierarchyID: false,
      leaseHierarchyID: false,
      leaseStatus: false,
      leaseStatusID: false,
      currentCommencementDate: false,
      currentExpirationDate: false,
      remainingLeaseTerminYears: false,
      leaseRentableArea: false,
      leaseMeasureUnits: false,
      leaseSF: false,
      leaseSM: false,
      hierarchy: false,
      hierarchy1ID: false,
      hierarchy2ID: false,
      hierarchy3ID: false,
      hierarchy4ID: false,
      hierarchy5ID: false,
      measureUnitsID: false,
      leaseCurrencyID: false,
      leaseCurrencyISO: false,
      tenantLegalName: false,
      accountingType: false,
      landLordName: false,
      leaseTenantHierarchyID: false,
      buildingArchivedByID: false,
      buildingArchivedBy: false,
      buildingArchivedDate: false,
      buildingCreatedDate: false,
      leaseArchivedByID: false,
      leaseArchivedBy: false,
      leaseArchivedDate: false,
      leaseCreatedDate: false,
      leaseModifiedDate: false,
      leaseActive: false,
      leaselabel: false,
      accountingWorkFlowStatusStep: false,
      accountingWorkFlowStatusID: false,
      accountingWorkFlowStatusDisplay: false,
      accountingWorkFlowStatus: false,
      reportingLeaseCachedDate: false,
      leaseAllocationDisplay1: false,
      leaseAllocationDisplay2: false,
      leaseAllocationDisplayString: false,
      leaseAllocationDisplayString2: false,
    },
    selectedReportingAccountingEventsColumns: {
      accountingEventID: false,
      accountingSourceImportID: false,
      accountingEventIsActive: false,
      isPublished: false,
      accountingWorkflowStatusModified: false,
      accountingWorkflowStatusModifiedBy: false,
      accountingWorkflowStatusModifiedDescription: false,
      accountingWorkflowStatusBeforeValue: false,
      masterAccountingEventID: false,
      classificationName: false,
      classificationID: false,
      measureEvent: false,
      scheduleIndex: false,
      accountingEventBeginDate: false,
      accountingEventEndDate: false,
      accountingTermNumberOfPeriods: false,
      accountingTermDaysInTerm: false,
      accountingTermNumberOfMonths: false,
      accountingTermYear: false,
      chargeType: false,
      chargeTypeFactor: false,
      localCurrencyID: false,
      localCurrency: false,
      localCurrencyDecimalPrecision: false,
      functionalCurrencyID: false,
      functionalCurrency: false,
      functionalCurrencyDecimalPrecision: false,
      functionalCurrencyRate: false,
      ROUAssetAddedDate: false,
      isImpaired: false,
      reportingException: false,
      exceptionReason: false,
      isRetroEvent: false,
      isRetroactiveRemeasure: false,
      accountingComments: false,
      compoundFrequency: false,
      annualRateType: false,
      annualRateTypeID: false,
      paymentTiming: false,
      discountRate: false,
      effectiveRate: false,
      implicitRate: false,
      includeChargesDueOnFirst: false,
      modificationImpactsScope: false,
      overrideAmortizationProfile: false,
      accountingEventJEProcessingStatus: false,
      discountRateProfile: false,
      discountRateProfileID: false,
      amortizationProfileID: false,
      amortizationProfileName: false,
      journalEntryProfile: false,
      journalEntryProfileID: false,
      accountingEventModified: false,
      accountingEventModifiedBy: false,
      accountingEventModifiedByID: false,
      accountingEventCreated: false,
      accountingEventCreatedBy: false,
      accountingEventCreatedByID: false,
      test1OwnerTransfer: false,
      test2BargianPurchase: false,
      remainingEconomicLife: false,
      test3EconomicLifeYearsPercent: false,
      test4AssetValueVsPaymentsPercent: false,
      test5IsAssetSpecializedNature: false,
      test1Result: false,
      test2Result: false,
      test3Result: false,
      test4Result: false,
      test5Result: false,
      testResult: false,
      testResultReason: false,
      testResultMatchesClassification: false,
      FMV: false,
      estimatedResidualValue: false,
      amountNotReflectedInPVofPayments: false,
      amountProbableofBeingOwedbyLessee: false,
      lessorExplicitlyExemptsLessee: false,
      guaranteedAmountReflectedInPayments: false,
      PVofAmountNotReflectedInPayments: false,
      RVGuaranteed: false,
      RVGuaranteedBy3rdParty: false,
      RVGuaranteedByLessee: false,
      unguaranteedResidualValue: false,
      totalUndiscountedAmount: false,
      targetAmountInPeriodGLAccounts: false,
      targetAmountInPeriodOptions: false,
      targetAmountInPeriodOtherCharges: false,
      presentValue: false,
      directCostsTotal: false,
      terminationFee: false,
      manualAdjustment: false,
      systemAssetAdjustment: false,
      assetAdjustment: false,
      liabilityAdjustment: false,
      levelExpense: false,
      assetAmortization: false,
      previousAssetBalance: false,
      previousLiabilityBalance: false,
      accountingEventBeginningAssetBalance: false,
      accountingEventBeginningLiabilityBalance: false,
      adjustmentGainLoss: false,
      directCostsTotalFunctional: false,
      terminationFeeFunctional: false,
      levelExpenseFunctional: false,
      assetAdjustmentFunctional: false,
      accountingEventBeginningAssetBalanceFunctional: false,
      adjustmentGainLossFunctional: false,
      straightLineExpense: false,
      straightLineExpenseDaily: false,
      straightLineIncome: false,
      straightLineIncomeDaily: false,
      straightLineOpeningBalance: false,
      maxChargeEndDate: false,
      minChargeBeginDate: false,
      numberOfChargeStreams: false,
      amortizationMethodID: false,
      amortizationMethod: false,
      accountingEventCachedDate: false,
    },
  };

  constructor(private alertsService: AlertsService, private router: Router) {}

  ngOnInit(): void {
    if (this.isPopupView) {
      this.selectedColumns.selectedLeaseAlertColumns.leaseAlertID = false;
      this.selectedColumns.selectedLeaseAlertColumns.leaseAbstractID = false;
      this.selectedColumns.selectedReportingLeasesColumns.clientLeaseID = false;
      this.selectedColumns.selectedAlertRuleColumns.ruleCode = false;
      this.selectedColumns.selectedReportingLeasesColumns.portfolio = false;
      this.selectedColumns.selectedLeaseAlertColumns.isDismissed = false;
      this.selectedColumns.selectedLeaseAlertColumns.alertActualValue = true;
      this.selectedColumns.selectedLeaseAlertColumns.alertExpectedValue = true;
    }

    this.currentLeaseStatusFilter = this.isPopupView ? 'all' : 'active';

    const configuration = JSON.parse(
      sessionStorage.getItem('leaseAlertsListPageSessionState')
    );

    if (this.alertsService.isEuroDateFormat) {
      this.dateFormat = 'dd.MM.yyyy';
    }

    this.alertsService.getRedirectorLinkList().subscribe((res: ApiResponse) => {
      this.leaseLinks = (res.data as RedirectorLinks).redirectorLinks?.filter(
        (x) => x.objectTypeId === LEASE_OTID
      );
    });

    this.alertsService.getIsAlertDismissedReasonRequired().subscribe((res) => {
      this.isDismissReasonRequired = res.data as boolean;

      this.alertsService.getAlertDismissReasons().subscribe((res) => {
        this.dismissReasons = res.data as string[];
        this.dismissReasons.sort((a, b) => a.localeCompare(b));
        this.dismissReasons.push(this.customReasonString);
      });
    });

    const isFirstLoad = true;

    this.setIsLoading(true);
    this.loadLeaseAlerts(isFirstLoad, configuration);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  redirectToLeaseAbstract(evt) {
    if (
      this.isPopupView ||
      evt.event.originalEvent.currentTarget.localName !== 'table'
    ) {
      return;
    }

    const link = this.leaseLinks?.find(
      (x) => x.objectTypeTypeId === evt.data.objectTypeTypeID
    );

    if (!link) {
      return;
    }

    this.leaseAlertsGrid.instance.beginCustomLoading('Redirecting...');

    const url = link.urlLink
      .replace('[OID]', evt.data.leaseAbstractID)
      .replace('[OTID]', `${LEASE_OTID}`)
      .replace('[OTTID]', evt.data.objectTypeTypeID);

    this.router.navigateByUrl(url);
  }

  toggleAlert(leaseAlert: LeaseAlert, dismissReason?, isButtonClick = false) {
    const reason = dismissReason?.itemData;

    if (isButtonClick && this.isDismissReasonRequired) {
      return;
    }

    this.selectedDismissToggleReason = reason;

    if (reason === this.customReasonString) {
      this.customMessageAlert = leaseAlert;
      this.showDismissPopup = true;

      return;
    }

    this.setIsLoading(true);

    this.toggleLeaseAlerts([leaseAlert.leaseAlertID]);
  }

  toggleSelectedAlerts(reasonGiven = false) {
    const alerts = this.leaseAlertsGrid.instance.getSelectedRowsData();

    if (alerts.find((x) => !x.isDismissed) && !reasonGiven) {
      this.showDismissTogglePopup = true;

      return;
    }

    this.setIsLoading(true);

    this.toggleLeaseAlerts(
      alerts.map((alert: LeaseAlert) => alert.leaseAlertID)
    );
  }

  searchGrid(text: string) {
    this.leaseAlertsGrid?.instance.searchByText(text);

    this.currentSearch = text;
  }

  showColumnChooser() {
    this.leaseAlertsGrid?.instance.showColumnChooser();

    if (this.hasListener) {
      return;
    }

    setTimeout(() => {
      const choosers = document.getElementsByClassName(
        'dx-datagrid-column-chooser'
      );

      for (let i = 0; i < choosers.length; i++) {
        const closeButton =
          choosers[i].getElementsByClassName('dx-closebutton')[0];

        if (closeButton && !this.hasListener) {
          closeButton.addEventListener('click', () => {
            this.columnChooserClosed();
          });

          this.hasListener = true;
        }
      }
    }, 100);
  }

  filterLeases(portfolio: Portfolio, leaseToggleValue: string) {
    this.leaseAlertsGrid?.instance?.beginCustomLoading('Loading...');
    this.currentPortfolio = portfolio;
    this.currentLeaseStatusFilter = leaseToggleValue;

    this.setIsLoading(true);
    this.loadLeaseAlerts();
  }

  onGridSelectionChanged(e) {
    const selectedRows = e.selectedRowsData as LeaseAlert[];
    const selectedKeysLength = e.currentSelectedRowKeys.length;

    const invalidSelections = selectedRows.filter((alert) => {
      return !this.isAlertDismissable(alert);
    });

    if (
      selectedKeysLength &&
      selectedKeysLength !== 1 &&
      selectedKeysLength !== e.component.instance().totalCount() &&
      e.currentDeselectedRowKeys.length === 0
    ) {
      e.component.deselectRows(e.selectedRowKeys);
      return;
    }

    if (invalidSelections.length) {
      e.component.deselectRows(invalidSelections);
      return;
    }

    this.gridSelectionChanged.emit(e.selectedRowKeys.length);
  }

  updateFilterCount(e) {
    let numberOfFilters;

    if (e?.length > 0) {
      numberOfFilters = this.getFilterCount(e);
    }

    this.filterCountChanged.emit(numberOfFilters);
  }

  dismissToggleReasonChanged(evt) {
    this.selectedDismissToggleReason = evt.addedItems[0];
    this.dismissToggleReasonIsCustom =
      evt.addedItems[0] === this.customReasonString;
    this.isDismissToggleDropdownOpen = false;
  }

  saveSessionState() {
    if (this.leaseAlertsGrid && !this.isPopupView) {
      const sessionState = {
        selectedColumns: this.selectedColumns,
        currentPortfolio: this.currentPortfolio,
        currentSearch: this.currentSearch,
        currentLeaseStatusFilter: this.currentLeaseStatusFilter,
        showDismissed: this.isDismissed,
        isAllExpanded: this.isAllExpanded,
      };

      sessionStorage.setItem(
        'leaseAlertsListPageSessionState',
        JSON.stringify(sessionState)
      );
    }

    this.setIsLoading(false);
  }

  isAlertDismissable(alert: LeaseAlert) {
    return alert.isDismissable && alert.leaseActive && !alert.isLocked;
  }

  setSelectionControlState(evt) {
    if (evt.rowType === 'data' && evt.column.command === 'select') {
      const data = evt.data as LeaseAlert;

      if (!this.isAlertDismissable(data)) {
        const instance = CheckBox.getInstance(
          evt.cellElement.querySelector('.dx-select-checkbox')
        );

        instance.option('disabled', true);
        events.off(evt.cellElement);
      }
    }
  }

  getButtonDisabledReason(alert: LeaseAlert) {
    let disabledReason = !alert.isDismissable
      ? `Alert Rule ${alert.alertRuleID} is not dismissable.\n`
      : '';

    disabledReason += !alert.leaseActive
      ? 'Cannot dismiss alert on archived lease.\n'
      : '';

    disabledReason += alert.isLocked
      ? 'Cannot dismiss alert on locked lease.'
      : '';

    return disabledReason;
  }

  contentReady(contentReadyEvent) {
    this.saveSessionState();
    this.checkGrouping(contentReadyEvent);
    this.sortFilterFields();
  }

  checkGrouping(contentReadyEvent) {
    let hasActiveColumnGrouping = false;
    let hasActiveRowGrouping = false;

    const columns = contentReadyEvent?.component?.getVisibleColumns();

    if (columns) {
      const columnGroups = columns.find((col) => col.groupIndex !== undefined);

      hasActiveColumnGrouping = !!columnGroups;
    }

    const rows = contentReadyEvent?.component?.getVisibleRows();

    if (rows) {
      const rowGroups = rows.find((row) => row.groupIndex !== undefined);

      hasActiveRowGrouping = rowGroups?.length > 0;
    }

    if (hasActiveColumnGrouping || hasActiveRowGrouping) {
      this.enableCollapseExpandAll.emit(true);
    } else {
      this.enableCollapseExpandAll.emit(false);
    }
  }

  private loadLeaseAlerts(firstLoad = false, configuration?): void {
    const hasSessionStoredConfig = !!configuration;

    if (firstLoad) {
      if (hasSessionStoredConfig && !this.isPopupView) {
        this.selectedColumns = configuration.selectedColumns;
        this.currentSearch = configuration.currentSearch;
        this.currentPortfolio = configuration.currentPortfolio;
        this.currentLeaseStatusFilter = configuration.currentLeaseStatusFilter;
        this.isDismissed = configuration.showDismissed;
        this.isAllExpanded = configuration.isAllExpanded;
      }
    }

    this.isInitialLoading = false;

    const leaseAlertFilter: LeaseAlertFilter = {
      leaseAbstractId: this.leaseAbstractID,
      masterGroupId: this.currentPortfolio?.masterGroupId,
      alertRuleId: null,
      isLeaseActive:
        this.currentLeaseStatusFilter === 'active'
          ? true
          : this.currentLeaseStatusFilter === 'archived'
          ? false
          : null,
      selectedColumns: this.selectedColumns,
      isDismissed: this.isDismissed,
    };

    this.leaseAlerts = [];
    this.getLeaseAlerts(leaseAlertFilter);
  }

  private getLeaseAlerts(leaseAlertFilter: LeaseAlertFilter): void {
    setTimeout(() => {
      this.leaseAlertsGrid?.instance?.beginCustomLoading('Loading...');
    }, 10);

    this.alertsService.filterLeaseAlerts(leaseAlertFilter).subscribe(
      (res: ApiResponse) => {
        const leaseAlerts = res.data.leaseAlerts as LeaseAlert[];
        const totalCount = res.data.totalCount;

        this.leaseAlerts.push(...leaseAlerts);

        if (this.leaseAlerts.length < totalCount && leaseAlerts.length > 0) {
          const totalPagesRequired = Math.ceil(totalCount / leaseAlerts.length);

          this.recurseGetAllPages(
            totalCount,
            totalPagesRequired,
            2,
            leaseAlertFilter
          );
        }

        if (this.leaseAlerts.length === totalCount) {
          this.loadFinishedDataAndShowGrid();
        }
      },
      () => {
        this.getLeaseAlertsErrorOccured();
      }
    );
  }

  private recurseGetAllPages(
    totalCount: number,
    totalPages: number,
    firstPageNumber: number,
    leaseAlertFilter: LeaseAlertFilter
  ) {
    this.leaseAlertsGrid?.instance?.beginCustomLoading(
      'Loading... (' +
        Math.ceil(((firstPageNumber - 1) / totalPages) * 100) +
        '%)'
    );

    const secondPageNumber = firstPageNumber + 1;
    const thirdPageNumber = secondPageNumber + 1;

    let pageOneReturn;
    let pageTwoReturn;
    let pageThreeReturn;

    if (firstPageNumber === totalPages) {
      (pageOneReturn = this.alertsService.filterLeaseAlerts(
        leaseAlertFilter,
        firstPageNumber
      )),
        (pageTwoReturn = of({ data: { leaseAlerts: [] } })),
        (pageThreeReturn = of({ data: { leaseAlerts: [] } }));
    }

    if (secondPageNumber === totalPages) {
      (pageOneReturn = this.alertsService.filterLeaseAlerts(
        leaseAlertFilter,
        firstPageNumber
      )),
        (pageTwoReturn = this.alertsService.filterLeaseAlerts(
          leaseAlertFilter,
          secondPageNumber
        )),
        (pageThreeReturn = of({ data: { leaseAlerts: [] } }));
    }

    if (thirdPageNumber <= totalPages) {
      (pageOneReturn = this.alertsService.filterLeaseAlerts(
        leaseAlertFilter,
        firstPageNumber
      )),
        (pageTwoReturn = this.alertsService.filterLeaseAlerts(
          leaseAlertFilter,
          secondPageNumber
        )),
        (pageThreeReturn = this.alertsService.filterLeaseAlerts(
          leaseAlertFilter,
          thirdPageNumber
        ));
    }

    this.subscription.add(
      combineLatest([pageOneReturn, pageTwoReturn, pageThreeReturn]).subscribe(
        (res: any) => {
          this.leaseAlerts.push(...(res[0].data.leaseAlerts as LeaseAlert[]));
          this.leaseAlerts.push(...(res[1].data.leaseAlerts as LeaseAlert[]));
          this.leaseAlerts.push(...(res[2].data.leaseAlerts as LeaseAlert[]));

          if (thirdPageNumber < totalPages) {
            return this.recurseGetAllPages(
              totalCount,
              totalPages,
              thirdPageNumber + 1,
              leaseAlertFilter
            );
          }

          if (thirdPageNumber >= totalPages) {
            this.loadFinishedDataAndShowGrid();
          }
        },
        () => {
          this.getLeaseAlertsErrorOccured();
        }
      )
    );
  }

  private getLeaseAlertsErrorOccured() {
    this.leaseAlerts = [];

    notify({
      message: 'An error occurred while fetching lease alerts.',
      type: 'error',
      displayTime: 5000,
      position: { my: 'bottom right', at: 'bottom right', offset: '-16 -16' },
      maxWidth: '400px',
      closeOnClick: true,
    });
  }

  private loadFinishedDataAndShowGrid() {
    this.leaseAlertsGrid?.instance?.beginCustomLoading('Loading...');

    this.buildGridDataSource();

    if (this.firstPageLoad) {
      this.isInitialLoading = true;
      // This timeout is required to use devextreme's function to load preferences from session state
      setTimeout(() => {
        this.isInitialLoading = false;
      }, 10);
      this.firstPageLoad = false;
    }

    this.selectedColumnsCopy = JSON.parse(JSON.stringify(this.selectedColumns));
  }

  private buildGridDataSource(): void {
    if (!this.leaseAlerts) {
      return;
    }

    this.leaseAlerts.forEach((alert) => {
      Object.keys(alert).forEach((key) => {
        if (key.indexOf('Date') >= 0 || key === 'modified') {
          try {
            const date = new Date(alert[key]);
            date.setHours(0, 0, 0, 0);

            alert[key] = date;
          } catch {
            alert[key] = null;
          }
        }
      });
    });

    this.gridData = this.leaseAlerts.slice();
    this.leaseAlertsGrid?.instance?.endCustomLoading();

    this.isArchived = undefined === this.gridData.find((x) => x.leaseActive);
    this.archivedOnlyChanged.emit(this.isArchived);
  }

  private sortFilterFields() {
    const sorted = this.leaseAlertsGrid.instance
      .option('columns')
      .filter((x: Column) => !!x.caption)
      .sort((a: Column, b: Column) =>
        a.caption.toLowerCase().localeCompare(b.caption.toLowerCase())
      )
      .map((c: Column) => {
        const { caption, dataField, dataType } = c;

        return { caption, dataField, dataType };
      });

    this.leaseAlertsGrid.instance.option('filterBuilder.fields', sorted);
  }

  private toggleLeaseAlerts(ids: number[]) {
    const dto: LeaseAlertToggleDTO = {
      alerts: ids,
      dismissReason: '',
    };

    dto.dismissReason =
      this.selectedDismissToggleReason === this.customReasonString
        ? this.dismissToggleReasonText
        : this.selectedDismissToggleReason;

    this.alertsService.toggleLeaseAlertsIsDismissed(dto).subscribe(
      (res: ApiResponse) => {
        notify({
          message: `Lease alert update ${
            res.success ? 'successful' : 'failed'
          }.`,
          type: res.success ? 'success' : 'error',
          displayTime: 3000,
          position: {
            my: 'bottom right',
            at: 'bottom right',
            offset: '-16 -16',
          },
          maxWidth: '400px',
          closeOnClick: true,
        });

        this.resetLeaseAlerts();
      },
      () => {
        notify({
          message: 'There was an error processing lease alert changes.',
          type: 'error',
          displayTime: 3000,
          position: {
            my: 'bottom right',
            at: 'bottom right',
            offset: '-16 -16',
          },
          maxWidth: '400px',
          closeOnClick: true,
        });

        this.resetLeaseAlerts();
      }
    );
  }

  // This recursively counts the applied filters taking into account the unusual
  // structure of filters in a DataGrid. DevExtreme doesn't even bother providing
  // a type for the filters, hence the linting disable below.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getFilterCount(filter: any[]): number {
    if (!filter || filter.length === 0) {
      return 0;
    }

    const hasArrays = filter.find((x) => Array.isArray(x));
    let filterCount = 0;

    if (!hasArrays) {
      return 1;
    }

    for (let i = 0; i < filter.length; ++i) {
      if (Array.isArray(filter[i])) {
        filterCount += this.getFilterCount(filter[i]);
      }
    }

    return filterCount;
  }

  private resetPopupData() {
    this.selectedKeys = [];

    this.dismissToggleReasonIsCustom = false;
    this.customMessageAlert = undefined;

    this.showDismissPopup = false;
    this.dismissReasonText = '';

    this.showDismissTogglePopup = false;
    this.dismissToggleReasonText = '';

    this.selectedDismissToggleReason = '';
    this.isDismissToggleDropdownOpen = false;
  }

  private resetLeaseAlerts() {
    this.leaseAlertsGrid?.instance?.beginCustomLoading('Loading...');
    this.loadLeaseAlerts();
    this.resetPopupData();
  }

  private setIsLoading(isCurrentlyLoading: boolean) {
    this.isLoading.emit(isCurrentlyLoading);
    this.isLoadingData = isCurrentlyLoading;
  }

  private columnChooserClosed() {
    if (this.deepEquals(this.selectedColumns, this.selectedColumnsCopy)) {
      return;
    }
    this.leaseAlertsGrid?.instance?.beginCustomLoading('Loading...');
    this.loadLeaseAlerts();
  }

  private deepEquals<T>(object1: T, object2: T): boolean {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      const value1 = object1[key];
      const value2 = object2[key];

      if (this.isObject(value1) && this.isObject(value2)) {
        if (!this.deepEquals(value1, value2)) {
          return false;
        }
      } else if (value1 !== value2) {
        return false;
      }
    }

    return true;
  }

  private isObject(object) {
    return object != null && typeof object === 'object';
  }
}
