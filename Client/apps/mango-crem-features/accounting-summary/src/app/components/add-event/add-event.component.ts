import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import { PortfolioSettingsResponse } from '@accounting-summary/models/portfolio-settings-response.modal';
import { classificationSettingResponse } from '@accounting-summary/models/classification-settings-response.modal';
import { AddEditScheduleService } from '@accounting-summary/services/add-edit-schedule.service';
import {
  Component,
  OnDestroy,
  ViewChild,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { DatePipe, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { PreviousAccountingEvent } from '@accounting-summary/models/previous-accounting-event.model';
import { debounceTime } from 'rxjs/operators';
import { AddEventFormService } from '@accounting-summary/services/add-event-form.service';
import {
  AmortizationProfile,
  CommonDropdowns,
  Currency,
  LookupOption,
} from '@accounting-summary/models/common-dropdowns.model';
import { EventDateOptions } from '@accounting-summary/models/interfaces/event-date-options.interfaces';
import { CalculateValues } from '@accounting-summary/models/interfaces/calculate-values.interfaces';
import {
  AccountingEventPayload,
  CalculationSupports,
  ProperPreviousAmortizationPeriod,
} from '@accounting-summary/models/interfaces/save-accounting-event.interfaces';
import {
  CalculateValuesResponse,
  ResidualValues,
} from '@accounting-summary/models/interfaces/calculate-values-response.interfaces';
import { environment } from '@mangoSpa/src/environments/environment.local';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
@Component({
  selector: 'mango-add-event',
  templateUrl: './add-event.component.html',
  styleUrls: ['./add-event.component.scss'],
  providers: [AddEditScheduleService],
})
export class AddEventComponent implements OnDestroy, OnInit {
  classificationId: any;
  componentName = 'add-edit';
  isSaveAllowed = false;
  isCalculateValuesAllowed = false;
  isApplyAllowed = false;
  pageMode = '';
  eventsGridData: any;
  measureEvent: string;
  queryParams: any;
  commonDropdowns: CommonDropdowns;
  amortizationProfiles: AmortizationProfile[];
  currencyList: Currency[];
  rouAssetMethodsList: LookupOption[];
  scheduleId: number;
  classificationSettings: classificationSettingResponse;
  portfolioSettings: PortfolioSettingsResponse;
  accountingEventsData: PreviousAccountingEvent;
  eventDateOptions: EventDateOptions[];
  scheduleDetailsData: any;
  addEditSchedulePayload: CalculateValues;
  scheduleDetails: any;
  classificationData: any;
  RVData: any;
  financialData: any;
  balanceCardFormData: any;
  paymentsData: any;
  termsValue: any;
  compoundFrequency: number;
  paymentTiming: number;
  manualAssetAdjustment: number;
  createdScheduleID: number;
  accountingEventSelector: any;
  calculationSupport: CalculationSupports;
  properPreviousAmortizationPeriod: ProperPreviousAmortizationPeriod;
  residualValues: ResidualValues;
  scheduleCurrency: any;
  functionalCurrency: any;
  calculateValuesResponseData: CalculateValuesResponse;
  isSaveAndCloseClicked: boolean;
  calculateValuesLoading: boolean;
  isApplyClicked: boolean;
  debounceTime = 300;
  private subscription$ = new Subscription();
  isCalculateClicked: boolean;
  isFunctionalRate1: boolean;
  calculateWithFunctionalRate1: boolean;
  showPayload: boolean;
  apiValidationErrorMessage: string;
  openDay1DayxRemeasurePopup = false;
  lastApprovedOrExportedDate: string;
  dateFormat = 'MM/dd/yyyy';
  effectiveRate: number;

  constructor(
    public accountingSummaryService: AccountingSummaryService,
    public location: Location,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private addEventFormService: AddEventFormService,
    public addEditScheduleService: AddEditScheduleService,
    public cdRef: ChangeDetectorRef,
    private facade: MangoAppFacade,
    private datePipe: DatePipe
  ) {
    this.getCommonDropDowns();
    this.getClassificationSettings();
    this.getEventDateOptions();
    this.getUserInfo();
  }

  ngOnDestroy(): void {
    this.subscription$.unsubscribe();
    this.addEventFormService.setCalculateValueResponse(null);
    this.addEventFormService.classificationFormData$.next(null);
  }

  ngOnInit() {
    this.showPayload = environment.showPayload;
    this.portfolioSettings = JSON.parse(
      localStorage.getItem('portfolioSettings') || '{}'
    );
    this.getFormsData();
    this.getCalculateValueData();
    this.populateChargeDateRangeOptions();
    this.initializeRouteData();
    this.addEventFormService.overrideOpeningBalance$.next(0);
    this.addEventFormService.presentValuePayload$.next({});
    this.addEventFormService.pageMode$.next(this.pageMode);
    this.addEventFormService.measureEvent$.next(this.measureEvent);

    this.subscription$.add(
      this.accountingSummaryService.lastApprovedOrExportedDate$
        .pipe(debounceTime(this.debounceTime))
        .subscribe((isRetro) => {
          const isRetroDate = new Date(isRetro?.setDate(isRetro.getDate() - 1));
          this.lastApprovedOrExportedDate =
            this.addEditScheduleService.toShortDateString(isRetroDate);
        })
    );
  }

  initializeRouteData() {
    this.subscription$.add(
      this.activatedRoute.data.subscribe((navigatedFrom) => {
        this.pageMode = navigatedFrom.breadCrumb.label;
      })
    );

    this.subscription$.add(
      this.activatedRoute.queryParams.subscribe((params) => {
        this.queryParams = params;
      })
    );

    if (this.pageMode === 'Edit Event' || this.pageMode === 'Remeasure Event') {
      this.eventsGridData =
        this.router.lastSuccessfulNavigation?.extras.state?.data ||
        +this.queryParams.eventId;
    }

    if (this.pageMode === 'Edit Event') {
      this.measureEvent = this.eventsGridData?.measureEvent ?? 'Initial';
    } else {
      this.measureEvent =
        this.router.lastSuccessfulNavigation?.extras.state?.measureEvent;
      this.accountingEventSelector =
        this.router.lastSuccessfulNavigation?.extras.state.data.accountingEventSelector;
    }

    if (this.eventsGridData) {
      this.scheduleId =
        this.eventsGridData.leaseRecognitionScheduleID ||
        +this.queryParams.eventId;
      if (!!this.scheduleId) {
        this.getAccountingEventsData();
      }
    } else {
      if (!!this.accountingEventsData) {
        this.addEventFormService.setaccountingEventData(
          this.accountingEventsData
        );
      }
    }
  }

  populateChargeDateRangeOptions() {
    this.subscription$.add(
      this.addEditScheduleService.chargeMinAndMaxDateOptionPopulated.subscribe(
        (data) => {
          let dateChanged = false;

          if (
            this.eventDateOptions.filter((f) => f.optionID === 9)[0]
              .optionDate !== data.minDateOption
          ) {
            this.eventDateOptions.filter(
              (f) => f.optionID === 9
            )[0].optionDate = data.minDateOption;
            dateChanged = true;
          }

          if (
            this.eventDateOptions.filter((f) => f.optionID === 13)[0]
              .optionDate !== data.maxDateOption
          ) {
            this.eventDateOptions.filter(
              (f) => f.optionID === 13
            )[0].optionDate = data.maxDateOption;
            dateChanged = true;
          }

          if (dateChanged) {
            //Trigger change detection because cdRef.detectChanges is not working
            this.eventDateOptions = JSON.parse(
              JSON.stringify(this.eventDateOptions)
            );
          }
        }
      )
    );
  }

  getUserInfo() {
    this.facade.contactRecord$.subscribe((contact) => {
      this.dateFormat = contact.preferences.contactDatesEU
        ? 'dd.MM.yyyy'
        : 'MM/dd/yyyy';
    });
  }

  getCalculateValueData() {
    this.subscription$.add(
      this.addEventFormService.calculateValuesResponseData$
        .pipe(debounceTime(this.debounceTime))
        .subscribe((calculateValuesResponseData) => {
          this.calculateValuesResponseData = calculateValuesResponseData;
          this.calculationSupport =
            calculateValuesResponseData?.calculationSupports;
          this.residualValues = calculateValuesResponseData?.residualValues;
          this.scheduleCurrency =
            calculateValuesResponseData?.calculationSupports?.scheduleCurrency;
          this.functionalCurrency =
            calculateValuesResponseData?.calculationSupports?.functionalCurrency;
        })
    );
  }

  getFormsData() {
    this.subscription$.add(
      combineLatest([
        this.addEventFormService.scheduleDetailsFormData$,
        this.addEventFormService.classificationFormData$,
        this.addEventFormService.RVFormFormData$,
        this.addEventFormService.financialFormData$,
        this.addEventFormService.balanceCardForm$,
        this.addEventFormService.paymentGridData$,
        this.addEventFormService.accountingTerms$,
        this.addEventFormService.paymentTiming$,
        this.addEventFormService.isCalculateValuesAllowed$,
        this.addEventFormService.isSaveAllowed$,
        this.addEventFormService.effectiveRate$,
      ])
        .pipe(debounceTime(this.debounceTime))
        .subscribe(
          ([
            scheduleDetails,
            classificationData,
            RVData,
            financialData,
            balanceCardForm,
            paymentsData,
            termValues,
            paymentTiming,
            isCalculateValuesAllowed,
            SaveInvalid,
            effectiveRate,
          ]) => {
            this.scheduleDetails = scheduleDetails;
            this.classificationData = classificationData;
            this.RVData = RVData;
            this.financialData = financialData;
            this.balanceCardFormData = balanceCardForm;
            this.paymentsData = paymentsData;
            this.termsValue = termValues;
            this.paymentTiming = paymentTiming;
            this.effectiveRate = effectiveRate;
            if (
              this.addEventFormService.ignoreButtonReset.value &&
              this.addEventFormService.calculateValuesClicked.value
            ) {
              this.isCalculateValuesAllowed = false;
              this.isCalculateClicked = true;
              this.isSaveAllowed =
                this.addEventFormService.isSaveAllowed$.value;
              this.isApplyAllowed =
                this.addEventFormService.isSaveAllowed$.value;
              this.addEventFormService.ignoreButtonReset.next(false);
              this.addEventFormService.calculateValuesClicked.next(false);
            } else {
              this.isCalculateValuesAllowed = isCalculateValuesAllowed;
              this.isSaveAllowed = false;
              this.isApplyAllowed = false;
              this.isCalculateClicked = SaveInvalid;
              this.addEventFormService.calculateValuesClicked.next(false);
            }
            if (this.pageMode === 'Edit Event') {
              const initialValues = this.buildCalculateValuePayload();
              this.buildPresentValueExportPayload(initialValues);
              this.addEventFormService.presentValueEnabled$.next(true);
            }
          }
        )
    );
  }

  getScheduleIdentifiers() {
    let leaseRecognitionScheduleId = null;
    let copiedFromScheduleId = null;
    if (this.pageMode === 'Add Event') {
      leaseRecognitionScheduleId = null;
      copiedFromScheduleId = null;
    } else if (
      this.pageMode === 'Edit Event' &&
      this.measureEvent === 'Initial'
    ) {
      leaseRecognitionScheduleId = +this.queryParams.eventId;
      copiedFromScheduleId = null;
    } else if (this.pageMode === 'Remeasure Event') {
      copiedFromScheduleId = +this.queryParams.eventId;
      leaseRecognitionScheduleId = null;
    } else if (
      this.pageMode === 'Edit Event' &&
      this.measureEvent !== 'Initial'
    ) {
      copiedFromScheduleId = +this.accountingEventsData.copiedFromScheduleID;
      leaseRecognitionScheduleId = +this.queryParams.eventId;
    }
    return {
      leaseRecognitionScheduleId,
      copiedFromScheduleId,
    };
  }

  calculateValues() {
    this.addEventFormService.validateCalculateComponents$.next(true);
    if (!this.calculateValidations() && !this.calculateWithFunctionalRate1) {
      return;
    } else {
      const addEditSchedulePayload = this.buildCalculateValuePayload();
      this.buildPresentValueExportPayload(addEditSchedulePayload);
      this.addEventFormService.presentValueEnabled$.next(true);
      this.calculateValuesLoading = true;
      this.subscription$.add(
        this.addEditScheduleService
          .calculateValues(addEditSchedulePayload)
          .subscribe((response) => {
            if (response === null) {
              this.addEditScheduleService.showToast(
                'Error',
                'An error occurred while calculating. If the problem persists, please contact support.',
                'error',
                false
              );
              this.isCalculateValuesAllowed = false;
              this.calculateValuesLoading = false;
            } else if (response.success) {
              this.addEventFormService.setCalculateValueResponse(response.data);
              this.addEventFormService.presentValueEnabled$.next(true);
              this.isCalculateValuesAllowed = false;
              this.calculateValuesLoading = false;
              if (
                this.addEventFormService.isOperatingRetrospectiveAdjustment$
                  .value
              ) {
                this.isSaveAllowed = false;
                this.isCalculateValuesAllowed = true;
              } else {
                if (this.isCalculateClicked) {
                  this.isSaveAllowed = true;
                  this.isApplyAllowed = true;
                } else if (!this.isCalculateClicked) {
                  this.isSaveAllowed = false;
                  this.isApplyAllowed = false;
                }
              }
            } else {
              this.apiValidationErrorMessage = response.clientErrorMessage;
              this.showApiValidationErrorMessage();
              this.isCalculateValuesAllowed = true;
              this.calculateValuesLoading = false;
            }
          })
      );
    }
  }

  showApiValidationErrorMessage() {
    if (
      this.apiValidationErrorMessage ===
      'MissingHistoricalChargeForMidPeriodRemeasurementError'
    ) {
      this.addEditScheduleService.showToast(
        'Historical Charge Missing',
        'Remeasuring from this date is not allowed because historical charge data is not available. Please try picking a start date that coincides with the start of a period.',
        'error',
        false
      );
    } else if (
      this.apiValidationErrorMessage ===
      'Day1DayXRemeasureWhilePriorOneInScheduleJEStatusError'
    ) {
      this.openDay1DayxRemeasurePopup = true;
    } else if (this.apiValidationErrorMessage === 'Day1FullTerminationError') {
      this.addEditScheduleService.showToast(
        'Day 1 Full Termination',
        'Full termination is not supported on Day 1 of the initial schedule.',
        'error',
        false
      );
    } else if (
      this.apiValidationErrorMessage ===
        'Day1DayXRemeasureOnUnsupportedClassificationsError' &&
      this.lastApprovedOrExportedDate
    ) {
      this.addEditScheduleService.showToast(
        'Unsupported Action',
        `In order to proceed with the ${
          this.measureEvent
        } measure event, you must remeasure after: ${this.datePipe.transform(
          this.lastApprovedOrExportedDate,
          this.dateFormat
        )}`,
        'error'
      );
    } else if (
      this.apiValidationErrorMessage ===
        'Day1DayXRemeasureOnUnsupportedClassificationsError' &&
      !this.lastApprovedOrExportedDate
    ) {
      this.addEditScheduleService.showToast(
        'Unsupported Action',
        `In order to proceed with the ${
          this.measureEvent
        } measure event, you must remeasure after: ${this.datePipe.transform(
          this.accountingEventsData.beginDate,
          this.dateFormat
        )}`,
        'error'
      );
    } else if (
      this.apiValidationErrorMessage ===
      'MidPeriodWithPriorAdjustmentRemeasureError'
    ) {
      this.addEditScheduleService.showToast(
        'Remeasuring Mid-Period',
        'Remeasuring mid-period is not allowed when the period has an existing adjustment.',
        'error',
        false
      );
    } else if (
      this.apiValidationErrorMessage ===
      'MissingPreviousPeriodForRemeasureError'
    ) {
      this.addEditScheduleService.showToast(
        'Missing Previous Period',
        'Previous Period was not found.',
        'error',
        false
      );
    } else if (
      this.apiValidationErrorMessage?.includes(
        'Opening Asset Balance cannot be negative.'
      )
    ) {
      this.addEditScheduleService.showToast(
        'Negative Opening Balance',
        'Amortization schedules cannot be created with a negative opening balance. If you are creating a Tenant Improvement Allowance scenario, then input the adjustment as a positive value and change the charge type from expense to income.',
        'error',
        false
      );
    } else if (
      this.apiValidationErrorMessage?.includes('Attempted to divide by zero.')
    ) {
      this.addEditScheduleService.showToast(
        'Error occurred while calculating',
        'Either Total Amount, Total Adjustment Amount, Beginning Asset Balance, or Liability Adjustment, must have a value before processing a schedule.',
        'error',
        false
      );
    } else {
      this.addEditScheduleService.showToast(
        'Error occurred while calculating',
        'An error occurred while calculating. If the problem persists, please contact support.',
        'error',
        false
      );
    }
  }

  saveSchedule() {
    const saveAccountingEventPayload = this.buildSaveAccountingEventPayload();
    if (this.showPayload) {
      console.log('saveAccountingEventPayload', saveAccountingEventPayload);
    }
    return this.addEditScheduleService.saveAccountingEvent(
      saveAccountingEventPayload
    );
  }

  saveAndClose() {
    if (!this.SaveValidations()) {
      return;
    }

    if (
      (!this.calculateValuesResponseData.adjustment ||
        this.calculateValuesResponseData.adjustment === 0) &&
      this.calculateValuesResponseData.totalPayments === 0 &&
      this.classificationId !== 0 &&
      this.calculateValuesResponseData.openingAssetBalance === 0 &&
      this.calculateValuesResponseData.liabilityAdjustmentAmount === 0
    ) {
      this.addEditScheduleService.showToast(
        'Error occurred while saving',
        'Either Total Amount, Total Adjustment Amount, Beginning Asset Balance, or Liability Adjustment must have a value before saving a schedule.',
        'error',
        false
      );
      return false;
    } else {
      this.isSaveAndCloseClicked = true;
      this.isSaveAllowed = false;
      this.isApplyAllowed = false;

      this.saveSchedule().subscribe((response) => {
        if (response === null) {
          this.addEditScheduleService.showToast(
            'Error occurred while saving',
            'An error occurred while saving. If the problem persists, please contact support.',
            'error',
            false
          );
          this.isSaveAndCloseClicked = false;
          this.isSaveAllowed = true;
          this.isApplyAllowed = true;
        } else if (response.success) {
          this.createdScheduleID = response.data;
          if (this.pageMode === 'Add Event') {
            this.accountingSummaryService.newCreatedSchedule.next(
              this.createdScheduleID
            );
          }
          this.isSaveAndCloseClicked = false;
          this.isSaveAllowed = true;
          this.isApplyAllowed = true;
          this.navigateToAccountingSummaryPage();
        } else {
          if (
            response.clientErrorMessage ===
            'ClassificationAmortizationComboExists'
          ) {
            this.addEditScheduleService.showToast(
              'Amortization Profile and Classification',
              'A schedule with this classification and amortization profile already exists.',
              'error',
              false
            );
          } else {
            this.addEditScheduleService.showToast(
              'Error occurred while saving',
              response.clientErrorMessage,
              'error',
              false
            );
          }
          this.isSaveAndCloseClicked = false;
          this.isSaveAllowed = true;
          this.isApplyAllowed = true;
        }
      });
    }
  }

  applyChanges() {
    if (!this.SaveValidations()) {
      return;
    } else {
      this.isApplyClicked = true;
      this.isSaveAllowed = true;
      this.isApplyAllowed = true;
      this.saveSchedule().subscribe((response) => {
        if (response === null) {
          this.addEditScheduleService.showToast(
            'Error occurred while saving',
            'An error occurred while saving. If the problem persists, please contact support.',
            'error',
            false
          );
          this.isApplyClicked = false;
          this.isSaveAllowed = false;
          this.isApplyAllowed = false;
        } else if (response.success) {
          this.createdScheduleID = response.data;
          if (this.createdScheduleID && this.pageMode !== 'Edit Event') {
            this.accountingSummaryService.newCreatedSchedule.next(
              this.createdScheduleID
            );
            const queryParams = {
              eventId: this.createdScheduleID,
            };
            this.router.navigate(['/crem/accounting/summary/editEvent'], {
              state: { data: 'Initial' },
              relativeTo: this.activatedRoute,
              queryParams: queryParams,
            });
          } else {
            this.addEditScheduleService.showToast(
              'Record Saved',
              'Accounting event saved successfully',
              'success',
              false
            );
            this.isApplyClicked = false;
            this.isSaveAllowed = true;
            this.isApplyAllowed = true;
          }
        } else {
          this.addEditScheduleService.showToast(
            'Error occurred while saving',
            response.clientErrorMessage,
            'error',
            false
          );
          this.isApplyClicked = false;
          this.isSaveAllowed = false;
          this.isApplyAllowed = false;
        }
      });
    }
  }

  SaveValidations() {
    if (
      (!this.accountingEventSelector ||
        this.accountingEventSelector.length === 0) &&
      this.pageMode === 'Add Event'
    ) {
      return true;
    }

    const journalEntryProfile = this.scheduleDetails.journalEntryProfile[0];
    const classificationID = this.scheduleDetails.classificationId[0];
    const amortizationProfileID =
      this.financialData.financialFormData.amortizationProfile;
    const manualAmortizationProfileName =
      this.financialData.financialFormData.manualAmortizationProfileName;

    let isScheduleDuplicate;

    if (amortizationProfileID < 0) {
      // Search by manualAmortizationProfileName if ID is -1
      isScheduleDuplicate = this.accountingEventSelector?.some(
        (item) =>
          item.classificationID === classificationID &&
          item.amortizationProfileName === manualAmortizationProfileName
      );
    } else {
      // Default search by IDs
      isScheduleDuplicate = this.accountingEventSelector?.some(
        (item) =>
          item.classificationID === classificationID &&
          item.amortizationProfileID === amortizationProfileID
      );
    }

    if (!amortizationProfileID && amortizationProfileID !== 0) {
      this.addEditScheduleService.showToast(
        'Amortization Profile',
        'Amortization Profile is required'
      );
      return false;
    } else {
      this.addEditScheduleService.clearToastBySummary('Amortization Profile');
    }

    if (
      !journalEntryProfile &&
      journalEntryProfile !== 0 &&
      this.portfolioSettings.journalEntryProfileRequired
    ) {
      this.addEditScheduleService.showToast(
        'Journal Entry Profile',
        'Journal Entry Profile is required'
      );
      return false;
    } else {
      this.addEditScheduleService.clearToastBySummary('Journal Entry Profile');
    }

    if (isScheduleDuplicate && this.pageMode === 'Add Event') {
      this.addEditScheduleService.showToast(
        'Amortization Profile and Classification',
        'A schedule with this classification and amortization profile already exists.'
      );
      return false;
    } else {
      this.addEditScheduleService.clearToastBySummary(
        'Amortization Profile and Classification'
      );
    }
    return true;
  }

  calculateValidations() {
    const discountRate = +this.financialData.financialFormData.discountRate;
    if (discountRate === 0 && this.measureEvent !== 'Full Termination') {
      this.addEditScheduleService.showToast(
        'Zero Discount Rate',
        'Calculating the present value using a zero discount rate results in the present value equal to the total undiscounted amount with no interest component.',
        'warn',
        false
      );
    }

    const showFunctionalCurrency =
      this.portfolioSettings?.functionalCurrencyEnabled;
    const scheduleCurrency = this.getCurrencyDetails(
      Array.isArray(this.financialData?.financialFormData.localCurrency)
        ? this.financialData?.financialFormData.localCurrency[0]
        : this.financialData?.financialFormData.localCurrency
    );
    const functionalCurrency = this.getCurrencyDetails(
      Array.isArray(this.financialData?.financialFormData?.functionalCurrency)
        ? this.financialData?.financialFormData?.functionalCurrency[0]
        : this.financialData?.financialFormData?.functionalCurrency
    );

    const functionalCurrencyRate =
      +this.financialData?.financialFormData.currencyRate;
    const isSameCurrency = scheduleCurrency === functionalCurrency;

    if (
      !isSameCurrency &&
      functionalCurrencyRate === 1 &&
      showFunctionalCurrency &&
      [2, 3, 4].includes(this.classificationId)
    ) {
      this.isFunctionalRate1 = true;
      return this.calculateWithFunctionalRate1;
    }

    if (functionalCurrencyRate === 0) {
      this.addEditScheduleService.showToast(
        'Functional Currency Rate is Required',
        'Functional Currency Rate is required and cannot be zero.'
      );
      return;
    } else {
      this.addEditScheduleService.clearToastBySummary(
        'Functional Currency Rate is Required'
      );
    }
    return true;
  }

  getCurrencyDetails(currency: number) {
    return this.currencyList.find(
      (currencyList) => currencyList.id === currency
    );
  }

  buildSaveAccountingEventPayload(): AccountingEventPayload {
    const financialData = this.financialData?.financialFormData;
    const scheduleDetails = this.scheduleDetails;
    const termsValue = this.termsValue;
    const classificationData = this.classificationData?.classificationFormData;
    const { leaseRecognitionScheduleId, copiedFromScheduleId } =
      this.getScheduleIdentifiers();
    return {
      accountingEvent: {
        leaseRecognitionScheduleID: leaseRecognitionScheduleId,
        leaseRecognitionID: +this.financialData.leaseRecognitionID,
        masterScheduleID: this.eventsGridData?.masterScheduleID ?? null,
        measureEvent: this.measureEvent,
        remeasureTypeID:
          this.pageMode === 'Edit Event'
            ? this.accountingEventsData.remeasureTypeID
            : +this.queryParams.remeasureTypeId || 0,
        copiedFromScheduleID: copiedFromScheduleId,
        isActive: true,
        isPublished: true,
        totalAmount: this.paymentsData?.undiscountedAmount,
        classificationID: scheduleDetails.classificationId[0],
        journalEntryProfileID: scheduleDetails.journalEntryProfile[0],
        beginDate: this.addEditScheduleService.toShortDateString(
          scheduleDetails.accountingEventBeginDate
        ),
        endDate: this.addEditScheduleService.toShortDateString(
          scheduleDetails.accountingEventEndDate
        ),
        fromDateOptionID: scheduleDetails.termBegin.isFormItem
          ? 1
          : scheduleDetails.termBegin.optionID,
        toDateOptionID: scheduleDetails.termEnd.isFormItem
          ? 1
          : scheduleDetails.termEnd.optionID,
        fromDateFormItemID: scheduleDetails.termBegin.formItemID,
        toDateFormItemID: scheduleDetails.termEnd.formItemID,
        includeFromFirst: scheduleDetails.notFirstDayOfTheMonth || false,
        firstMonthOverwriteDate: scheduleDetails.notFirstDayOfTheMonth
          ? this.addEditScheduleService.toShortDateString(
              new Date(
                new Date(
                  scheduleDetails.accountingEventBeginDate
                ).getFullYear(),
                new Date(scheduleDetails.accountingEventBeginDate).getMonth(),
                1
              )
            )
          : null,
        termInDays: +termsValue.termInDays || 0,
        termInPeriods: +termsValue.termInPeriods || 0,
        termInMonths: +termsValue.termInMonths || 0,
        termInYears: +termsValue.termInYear || 0,
        termString: termsValue.termString || '',
        isReportingException: scheduleDetails.reportingExceptions[0] !== 0,
        exceptionReason: scheduleDetails.reportingExceptions[0] ?? 0,
        exceptionOtherReason: scheduleDetails.reportingExceptionReason ?? '',
        isImpaired: scheduleDetails.isImpaired || false,
        comments: scheduleDetails.detailsSectionComments || '',
        test1: Array.isArray(classificationData?.classificationTest1)
          ? classificationData?.classificationTest1[0] === 1
            ? true
            : classificationData?.classificationTest1[0] === 2
            ? false
            : null
          : classificationData?.classificationTest1 === 1
          ? true
          : classificationData?.classificationTest1 === 2
          ? false
          : null,
        test2: Array.isArray(classificationData?.classificationTest2)
          ? classificationData?.classificationTest2[0] === 1
            ? true
            : classificationData?.classificationTest2[0] === 2
            ? false
            : null
          : classificationData?.classificationTest2 === 1
          ? true
          : classificationData?.classificationTest2 === 2
          ? false
          : null,
        test3: this.classificationData?.test3 ?? null,
        test4: this.classificationData?.test4 ?? null,
        test5: Array.isArray(classificationData?.classificationTest5)
          ? classificationData?.classificationTest5[0] === 1
            ? true
            : classificationData?.classificationTest5[0] === 2
            ? false
            : null
          : classificationData?.classificationTest5 === 1
          ? true
          : classificationData?.classificationTest5 === 2
          ? false
          : null,
        classificationTestResult:
          this.classificationData?.classificationTestResult ?? null,
        classificationTestResultReason:
          this.classificationData?.classificationTestResultReason ?? null,
        isClassificationTestResultMatched:
          this.classificationData?.isClassificationTestResultMatched ?? null,
        economicLifeYears: +classificationData?.remainingEconomicLife || null,
        fmv: classificationData?.fairMarketValue ?? null,
        implicitRate:
          this.calculateValuesResponseData.implicitRate != null
            ? +this.calculateValuesResponseData.implicitRate.toFixed(14)
            : null,
        residualValues: this.residualValues,
        amortizationMethodTypeID:
          this.portfolioSettings?.amortizationMethodType,
        amortizationProfileID:
          financialData?.amortizationProfile < 0
            ? -1
            : financialData?.amortizationProfile ?? 0,
        manualProfileName: financialData?.manualAmortizationProfileName ?? '',
        isIncome: financialData?.chargeType !== 'Expense',
        overrideProfile: financialData?.overrideAmortizationProfile,
        discountRateProfileID: financialData?.discountRateProfile[0] ?? -1,
        discountRate: Number(financialData?.discountRate) ?? 0,
        discountRateTypeID: 2,
        annualRateTypeID: Array.isArray(financialData?.annualRateDropdown)
          ? financialData?.annualRateDropdown[0]
          : financialData?.annualRateDropdown,
        effectiveRate: +this.effectiveRate,
        modificationImpactsScope: financialData?.modificationImpactScope,
        localCurrencyID: this.scheduleCurrency.exchangeRateID,
        localCurrency: this.scheduleCurrency.targetCurrency,
        localCurrencyDecimalPrecision: this.scheduleCurrency.decimalPrecision,
        functionalCurrencyID: this.portfolioSettings?.functionalCurrencyEnabled
          ? this.functionalCurrency.exchangeRateID
          : this.scheduleCurrency.exchangeRateID,
        functionalCurrency: this.portfolioSettings?.functionalCurrencyEnabled
          ? this.functionalCurrency.targetCurrency
          : this.scheduleCurrency.targetCurrency,
        functionalCurrencyDecimalPrecision: this.portfolioSettings
          ?.functionalCurrencyEnabled
          ? this.functionalCurrency.decimalPrecision
          : this.scheduleCurrency.decimalPrecision,
        functionalCurrencyRate: this.portfolioSettings
          ?.functionalCurrencyEnabled
          ? financialData?.currencyRate
          : 1,
        rouAssetMethodID: Array.isArray(financialData?.ROUMethod)
          ? financialData?.ROUMethod[0]
          : financialData?.ROUMethod,
        rouAssetObtainedAmount: +financialData?.ROUAmount,
        rouAssetObtainedDate: this.addEditScheduleService.toShortDateString(
          financialData?.ROUActionDate
        ),
        functionalROUAssetObtainedAmount:
          this.calculateValuesResponseData.functionalROUAssetObtainedAmount,
        openingAssetBalance:
          this.calculateValuesResponseData.openingAssetBalance ?? 0.0,
        functionalOpeningAssetBalance:
          this.calculateValuesResponseData.functional_OpeningAssetBalance ??
          0.0,
        openingBalance: this.balanceCardFormData.overrideOpeningBalance
          ? this.balanceCardFormData.openingBalanceInput
          : this.calculateValuesResponseData.openingAssetBalance ?? 0.0,
        overrideOpeningBalance: this.balanceCardFormData.overrideOpeningBalance,
        previousAssetBalance:
          this.calculateValuesResponseData.previousAssetBalance ?? 0.0,
        systemAssetAdjustment:
          this.calculateValuesResponseData.systemAssetAdjustment ?? 0.0,
        manualAssetAdjustment:
          this.balanceCardFormData.manualAssetAdjustment ?? 0.0,
        adjustment: this.calculateValuesResponseData.adjustment ?? 0.0,
        levelExpense: this.calculateValuesResponseData.levelExpense ?? 0.0,
        functionalLevelExpense:
          this.calculateValuesResponseData.functional_LevelExpense ?? 0.0,
        directCosts: this.calculateValuesResponseData.directCostsTotal ?? 0.0,
        functionalDirectCosts:
          this.calculateValuesResponseData.functional_DirectCostsTotal ?? 0.0,
        presentValue: this.calculateValuesResponseData.presentValue ?? 0.0,
        compoundFrequencyType: Array.isArray(
          this.balanceCardFormData.compoundFrequency
        )
          ? this.balanceCardFormData.compoundFrequency[0]
          : this.balanceCardFormData.compoundFrequency,

        paymentInArrears: Array.isArray(this.balanceCardFormData.paymentTiming)
          ? this.balanceCardFormData.paymentTiming[0] === 2
            ? true
            : false
          : this.balanceCardFormData.paymentTiming === 2
          ? true
          : false,
        openingLiabilityBalance:
          this.calculateValuesResponseData.openingLiabilityBalance ?? 0.0,
        previousLiabilityBalance:
          this.calculateValuesResponseData.previousLiabilityBalance ?? 0.0,
        liabilityAdjustmentAmount:
          this.calculateValuesResponseData.liabilityAdjustmentAmount ?? 0.0,
        adjustmentGainLoss:
          this.calculateValuesResponseData.adjustmentGainLoss ?? 0.0,
        functionalAdjustmentGainLoss:
          this.calculateValuesResponseData.functional_AdjustmentGainLoss,
        terminationFee: this.paymentsData?.terminationFee ?? 0.0,
        functionalTerminationFee:
          this.calculateValuesResponseData.functional_TerminationFee ?? 0.0,
        // assetAdjustmentAmount:
        // this.calculateValuesResponseData.assetAdjustmentAmount ?? 0.0,
        straightLineExpense:
          this.calculateValuesResponseData.straightLineExpense ?? 0.0,
        straightLineExpenseDaily:
          this.calculateValuesResponseData.straightLineExpenseDaily ?? 0.0,
        assetAmortization:
          this.calculateValuesResponseData.assetAmortization ?? 0.0,
        functionalAssetAmortization:
          this.calculateValuesResponseData.functional_AssetAmortization ?? 0.0,
      },
      calculationSupports: this.calculationSupport,
    };
  }

  buildCalculateValuePayload(): CalculateValues {
    const scheduleCurrency = this.getCurrencyDetails(
      Array.isArray(this.financialData?.financialFormData.localCurrency)
        ? this.financialData?.financialFormData.localCurrency[0]
        : this.financialData?.financialFormData.localCurrency
    );
    const functionalCurrency = this.getCurrencyDetails(
      Array.isArray(this.financialData?.financialFormData?.functionalCurrency)
        ? this.financialData?.financialFormData?.functionalCurrency[0]
        : this.financialData?.financialFormData?.functionalCurrency
    );
    const { leaseRecognitionScheduleId, copiedFromScheduleId } =
      this.getScheduleIdentifiers();

    return {
      leaseRecognitionScheduleId: leaseRecognitionScheduleId,
      copiedFromScheduleId: copiedFromScheduleId,
      leaseAbstractId: +localStorage.getItem('accSumLeaseAbstractId'),
      classificationId: this.scheduleDetails.classificationId[0],
      remeasureTypeId:
        this.pageMode === 'Edit Event'
          ? this.accountingEventsData.remeasureTypeID
          : +this.queryParams.remeasureTypeId || 0,
      calendarId: this.portfolioSettings.leaseRecognitionCalendarID ?? 1,
      termBegin: this.addEditScheduleService.toShortDateString(
        this.scheduleDetails.accountingEventBeginDate
      ),
      termEnd: this.addEditScheduleService.toShortDateString(
        this.scheduleDetails.accountingEventEndDate
      ),
      includeFromFirst: this.scheduleDetails.notFirstDayOfTheMonth ?? false,
      termInPeriods: this.termsValue.termInPeriods ?? 0,
      termInDays: this.termsValue.termInDays ?? 0,
      termInYears: +this.termsValue.termInYear || 0,
      isIncome: this.financialData.financialFormData.chargeType !== 'Expense',
      scheduleCurrency: {
        exchangeRateID: scheduleCurrency.id,
        targetCurrency: scheduleCurrency.name,
        decimalPrecision: scheduleCurrency.decimalPrecision,
      },

      functionalCurrency: this.portfolioSettings?.functionalCurrencyEnabled
        ? {
            exchangeRateID: functionalCurrency.id ?? 0,
            targetCurrency: functionalCurrency.name ?? 'Currency',
            decimalPrecision: functionalCurrency.decimalPrecision ?? 0,
          }
        : undefined,

      functionalCurrencyRate:
        +this.financialData.financialFormData.currencyRate,
      manualAssetAdjustment:
        this.balanceCardFormData.manualAssetAdjustment ?? 0,
      discountRate: +this.financialData.financialFormData.discountRate,
      compoundFrequencyTypeId: Array.isArray(
        this.balanceCardFormData.compoundFrequency
      )
        ? this.balanceCardFormData.compoundFrequency[0]
        : this.balanceCardFormData.compoundFrequency,
      paymentInArrears: Array.isArray(this.balanceCardFormData.paymentTiming)
        ? this.balanceCardFormData.paymentTiming[0] === 2
          ? true
          : false
        : this.balanceCardFormData.paymentTiming === 2
        ? true
        : false,
      annualRateTypeId: Array.isArray(
        this.financialData.financialFormData.annualRateDropdown
      )
        ? this.financialData.financialFormData.annualRateDropdown[0]
        : this.financialData.financialFormData.annualRateDropdown,
      effectiveRate: +this.effectiveRate,
      amortizationMethodTypeId: this.portfolioSettings.amortizationMethodType,
      isImpaired: this.scheduleDetails?.isImpaired ?? false,
      totalAmount: this.paymentsData?.undiscountedAmount ?? 0,
      directCosts: this.paymentsData?.directCostAmount ?? 0,
      terminationFee: this.paymentsData?.terminationFee ?? 0,
      economicLifeYears:
        +this.classificationData?.classificationFormData
          ?.remainingEconomicLife || null,
      fmv:
        +this.classificationData?.classificationFormData?.fairMarketValue ||
        null,
      test1: Array.isArray(
        this.classificationData?.classificationFormData?.classificationTest1
      )
        ? this.classificationData?.classificationFormData
            .classificationTest1[0] === 1
          ? true
          : this.classificationData?.classificationFormData
              .classificationTest1[0] === 2
          ? false
          : null
        : this.classificationData?.classificationFormData
            ?.classificationTest1 === 1
        ? true
        : this.classificationData?.classificationFormData
            ?.classificationTest1 === 2
        ? false
        : null,
      test2: Array.isArray(
        this.classificationData?.classificationFormData?.classificationTest2
      )
        ? this.classificationData?.classificationFormData
            .classificationTest2[0] === 1
          ? true
          : this.classificationData?.classificationFormData
              .classificationTest2[0] === 2
          ? false
          : null
        : this.classificationData?.classificationFormData
            ?.classificationTest2 === 1
        ? true
        : this.classificationData?.classificationFormData
            ?.classificationTest2 === 2
        ? false
        : null,
      test5: Array.isArray(
        this.classificationData?.classificationFormData?.classificationTest5
      )
        ? this.classificationData?.classificationFormData
            .classificationTest5[0] === 1
          ? true
          : this.classificationData?.classificationFormData
              .classificationTest5[0] === 2
          ? false
          : null
        : this.classificationData?.classificationFormData
            ?.classificationTest5 === 1
        ? true
        : this.classificationData?.classificationFormData
            ?.classificationTest5 === 2
        ? false
        : null,
      residualValues: {
        doesLessorExplicitlyExemptLessee:
          this.RVData.lessorExplicitlyExemptsLessee || false,
        residualValueGuaranteedBy3rdParty:
          +this.RVData.rvGuaranteedBy3rdParty || 0,
        residualValue: +this.RVData.rvGuaranteed || 0,
        estimatedResidualValue: +this.RVData.estimatedResidualValue || 0,
        guaranteedAmtReflectedInPayments:
          +this.RVData.guaranteedAmountReflected || 0,
      },
      selectedPayments: this.paymentsData?.selectedPayments || [],
      pageMode: this.pageMode,
    };
  }

  buildPresentValueExportPayload(values: any) {
    const amortizationProfileID =
      this.financialData?.financialFormData?.amortizationProfile;
    const selectedAmortizationProfile = this.amortizationProfiles?.find(
      (item) => item.profileID === amortizationProfileID
    );

    const amortizationProfileName =
      amortizationProfileID < 0
        ? this.financialData?.financialFormData?.manualAmortizationProfileName
        : selectedAmortizationProfile?.profileName;

    this.addEventFormService.presentValuePayload$.next({
      leaseAbstractId: values.leaseAbstractId,
      classificationId: values.classificationId,
      isIncome: values.isIncome,
      leaseRecognitionScheduleId: values.leaseRecognitionScheduleId,
      copiedFromScheduleId: values.copiedFromScheduleId,
      remeasureTypeId: values.remeasureTypeId,
      fromDate: values.termBegin,
      toDate: values.termEnd,
      isFirstMonthOverwrite: values.includeFromFirst,
      compoundFrequencyTypeId: values.compoundFrequencyTypeId,
      paymentInArrears: values.paymentInArrears,
      amortizationProfileName: amortizationProfileName,
      annualRateTypeId: values.annualRateTypeId,
      discountRate: values.discountRate,
      amountProbableOfBeingOwedByLessee:
        values.residualValues.amountProbableOfBeingOwedByLessee,
      liabilityAdjustmentAmount: values.liabilityAdjustmentAmount,
      scheduleCurrency: values.scheduleCurrency,
      selectedPayments: values.selectedPayments,
    });
  }

  private getCommonDropDowns() {
    this.subscription$.add(
      this.addEditScheduleService
        .getCommonDropdowns()
        .subscribe((response: any) => {
          if (response === null) {
            this.accountingSummaryService.displayContactSystemAdminMessage();
          } else if (response.success) {
            this.commonDropdowns = response.data;
            this.addEventFormService.setCommonDropdownsData(response.data);
            this.amortizationProfiles = response.data.amortizationProfiles;
            this.currencyList = response.data.currencies;
            this.rouAssetMethodsList = response.data.rouAssetMethods;
          } else {
            this.accountingSummaryService.errorNotify(
              response.clientErrorMessage
            );
          }
        })
    );
  }

  /**
   * Goes back to the Accounting Summary Page
   *
   * @memberof AddEventComponent
   */
  navigateToAccountingSummaryPage(): void {
    this.addEditScheduleService.clearAllToastMessages();
    this.subscription$.add(
      this.accountingSummaryService.getLeaseInfo().subscribe(
        (res) => {
          if (res.success) {
            const queryParams: { [key: string]: any } = {};
            queryParams['otid'] = res.data.objectTypeID ?? null;
            queryParams['oid'] = res.data.leaseAbstractID ?? null;
            queryParams['ottid'] = res.data.objectTypeTypeID ?? undefined;
            queryParams['navpageid'] =
              this.accountingSummaryService.getNavPageId();
            this.addEventFormService.manualAssetAdjustment$.next(0);
            this.router.navigate(['/crem/accounting/summary'], {
              relativeTo: this.activatedRoute,
              queryParams: queryParams,
            });
          }
        },
        (error) => {
          console.error('An error occurred: ', error);
        }
      )
    );
  }

  private getClassificationSettings() {
    this.subscription$.add(
      this.addEditScheduleService
        .getClassificationSettings()
        .subscribe((response: any) => {
          if (response === null) {
            this.accountingSummaryService.displayContactSystemAdminMessage();
          } else if (response.success) {
            this.classificationSettings = response.data;
          } else {
            this.accountingSummaryService.errorNotify(
              response.clientErrorMessage
            );
          }
        })
    );
  }

  private getAccountingEventsData() {
    this.subscription$.add(
      this.addEditScheduleService
        .getAccountingEventData(this.scheduleId)
        .subscribe((response: any) => {
          if (response === null) {
            this.accountingSummaryService.displayContactSystemAdminMessage();
          } else if (response.success) {
            this.accountingEventsData = response.data;
            this.accountingEventsData.priorROUAssetObtainedAmount =
              this.eventsGridData.priorROUAssetObtainedAmount ?? 0;
            this.addEventFormService.accountingEventData$.next(response.data);
          } else {
            this.accountingSummaryService.errorNotify(
              response.clientErrorMessage
            );
          }
        })
    );
  }

  private getEventDateOptions() {
    this.subscription$.add(
      this.addEditScheduleService
        .getDateOptions()
        .subscribe((response: any) => {
          if (response === null) {
            this.accountingSummaryService.displayContactSystemAdminMessage();
          } else if (response.success) {
            this.eventDateOptions = response.data;
          } else {
            this.accountingSummaryService.errorNotify(
              response.clientErrorMessage
            );
          }
        })
    );
  }

  onClassificationChanged(classificationId: number) {
    this.classificationId = classificationId;
  }

  scheduleDetailsDataChanged(data: any) {
    this.scheduleDetailsData = data;
    if (
      data.isDayOne &&
      this.pageMode == 'Remeasure Event' &&
      this.measureEvent !== 'Impairment'
    ) {
      this.addEventFormService.DayOneRemeasure$.next(true);
    } else {
      this.addEventFormService.DayOneRemeasure$.next(false);
    }
  }

  closeFunctionalRatePopup() {
    this.calculateWithFunctionalRate1 = false;
    this.isFunctionalRate1 = !this.isFunctionalRate1;
  }

  continueToCalculate() {
    this.calculateWithFunctionalRate1 = true;
    this.calculateValues();
    this.isFunctionalRate1 = !this.isFunctionalRate1;
  }

  closeRemeasuringFromDay1Popup() {
    this.openDay1DayxRemeasurePopup = !this.openDay1DayxRemeasurePopup;
  }

  editPreviousSchedule() {
    const queryParams = {
      eventId: this.eventsGridData.leaseRecognitionScheduleID,
    };
    this.router.navigate(['/crem/accounting/summary/editEvent'], {
      queryParams: queryParams,
    });
    this.addEditScheduleService.clearAllToastMessages();
  }
}
