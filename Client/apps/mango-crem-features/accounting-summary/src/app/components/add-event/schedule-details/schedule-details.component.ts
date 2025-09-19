import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import { AddEditScheduleService } from '@accounting-summary/services/add-edit-schedule.service';
import { AddEventFormService } from '@accounting-summary/services/add-event-form.service';
import { DatePipe } from '@angular/common';
import { combineLatest, Subject, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { classificationSettingResponse } from '@accounting-summary/models/classification-settings-response.modal';
import { PreviousAccountingEvent } from '@accounting-summary/models/previous-accounting-event.model';
import { EventDateOptions } from '@accounting-summary/models/interfaces/event-date-options.interfaces';
import { PortfolioSettingsResponse } from '@accounting-summary/models/portfolio-settings-response.modal';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import {
  Classification,
  CommonDropdowns,
  JournalEntryProfile,
  LookupOption,
} from '@accounting-summary/models/common-dropdowns.model';
import { DropdownComponent } from '@mango/ui-shared/lib-ui-elements';
import {
  AccountingTerms,
  ScheduleDetailsTermsInformation,
  TermDateOption,
} from '@accounting-summary/models/interfaces/schedule-details-form-interfaces';

@Component({
  selector: 'mango-schedule-details',
  templateUrl: './schedule-details.component.html',
  styleUrls: ['./schedule-details.component.scss'],
})
export class ScheduleDetailsComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  @Input() eventsGridData: PreviousAccountingEvent;
  @Input() commonDropdowns: CommonDropdowns;
  @Input() measureEvent: string;
  @Input() pageMode: string;
  @Input() eventDateOptions: EventDateOptions[];
  @Input() classificationSettings: classificationSettingResponse[];
  @Input() accountingEventsData: PreviousAccountingEvent;
  @Output() classificationChanged: EventEmitter<number> = new EventEmitter();
  @Output() scheduleDetailsData: EventEmitter<ScheduleDetailsTermsInformation> =
    new EventEmitter();
  @ViewChild('jeProfileDD') jeProfileDD: DropdownComponent;
  @ViewChild('ClassificationDD') classificationDD: DropdownComponent;

  title = 'Accounting Event Details ';
  subtitle = '';
  componentName = 'details';
  isEuroDateFormat = false;
  classificationTypeList: Classification[];
  journalEntryProfileList: JournalEntryProfile[];
  defaultClassificationConfigurations: classificationSettingResponse[] = [];
  isClassificationDisabled = false;
  selectedClassificationID: number;
  selectedJournalEntryProfileID: number;
  journalEntryProfileRequired: boolean;
  termEndDate: Date;
  termBeginDate: Date;
  selectedBeginDateID: number;
  selectedEndDateID: number;
  beginDateOptionsForEvents: TermDateOption[];
  endDateOptionsForEvents: TermDateOption[];
  termsValidationFailed = false;
  termCalculations: AccountingTerms;
  scheduleDetailsForm: FormGroup;
  reportingExceptionsList: LookupOption[];
  reportingExceptions: string;
  selectedExceptionId = 0;
  showReportExceptionComment = false;
  myOtherOptionData: string;
  termString: string;
  termInPeriods: number;
  termInMonths: number;
  termInDays: number;
  termInYear: number;
  loading: boolean;
  defaultClassificationFilterByMeasureEvent: classificationSettingResponse;
  setMeasureEvent: string;
  isTermBeginDirectEntry = false;
  isTermEnDirectEntry = false;
  termBeginDateObj: TermDateOption;
  termEndDateObj: TermDateOption;
  portfolioSettings: PortfolioSettingsResponse;
  scheduleDetailsformData: any;
  private subscription = new Subscription();
  private formSubscription$ = new Subject<void>();
  reportExceptionValidationPopup = false;
  compoundFrequency: number;
  selectedExceptionReason = 'string';
  dayOneDate: Date;
  lastApprovedOrExportedDate: Date;
  isRetro: boolean;
  classificationName: string;
  classificationBlur = false;
  jeProfileBlur = false;
  jeProfileStatus = 'default';
  jeProfileStatusMessage = '';
  termBeginBlur = false;
  termBeginStatus = 'default';
  termBeginStatusMessage = '';
  termEndBlur = false;
  termEndStatus = 'default';
  termEndStatusMessage = '';
  dateFormat = {
    type: 'MM/dd/yyyy',
    parser: function (dateString) {
      if (dateString.includes('.')) {
        const dateArray = dateString.split('.', 3);
        dateString = dateArray[1] + '/' + dateArray[0] + '/' + dateArray[2];
      }
      return new Date(dateString);
    },
  };

  constructor(
    public accountingSummaryService: AccountingSummaryService,
    public addEditScheduleService: AddEditScheduleService,
    public addEventFormService: AddEventFormService,
    private router: Router,
    private fb: FormBuilder,
    public datePipe: DatePipe,
    private facade: MangoAppFacade
  ) {
    this.getUserInfo();
    this.subscription.add(
      this.addEventFormService.validateCalculateComponents$.subscribe(
        (clicked) => {
          if (clicked) {
            this.classificationBlur = true;
            this.jeProfileBlur = this.journalEntryProfileList.length >= 0;
            this.termBeginBlur = true;
            this.termEndBlur = true;
            this.scheduleDetailsValidation();
          }
        }
      )
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (!this.classificationDD.isDisabled) {
        this.classificationDD.focusDropdown();
      } else {
        this.jeProfileDD.focusDropdown();
      }
    }, 300);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      (this.commonDropdowns !== undefined || this.commonDropdowns === null) &&
      (this.classificationSettings !== undefined ||
        this.classificationSettings === null) &&
      (this.accountingEventsData !== undefined ||
        this.accountingEventsData === null ||
        this.router.url.includes('addEvent'))
    ) {
      //This should only occur when the event options is changed from the chargeMinAndMaxDateOptionPopulated subject executing in the add-event component
      // if(!!changes.eventDateOptions && !changes.eventDateOptions.firstChange) {
      if (
        !!changes.eventDateOptions &&
        !!changes.eventDateOptions.previousValue &&
        changes.eventDateOptions.previousValue !==
          changes.eventDateOptions.currentValue
      ) {
        if (this.selectedBeginDateID === 9 || this.selectedEndDateID === 13) {
          this.onClassificationValueChanged([
            {
              classificationID: this.selectedClassificationID
                ? this.selectedClassificationID
                : this.accountingEventsData?.classificationID,
              journalEntryProfileId: this.selectedJournalEntryProfileID
                ? this.selectedJournalEntryProfileID
                : this.accountingEventsData.journalEntryProfileID,
            },
          ]);
        } else {
          this.beginDateOptionsForEvents = this.getTermBeginDate(
            this.eventDateOptions
          );
          this.endDateOptionsForEvents = this.getTermEndDate(
            this.eventDateOptions
          );
        }

        return;
      } else {
        this.classificationTypeList =
          this.commonDropdowns?.classificationTypes.filter(
            (ClassificationType) => ClassificationType.isActive
          );
        this.beginDateOptionsForEvents = this.getTermBeginDate(
          this.eventDateOptions
        );
        this.endDateOptionsForEvents = this.getTermEndDate(
          this.eventDateOptions
        );
      }
      this.reportingExceptionsList = this.addNoExceptionEntry(
        this.commonDropdowns.reportingExceptions
      );

      if (this.router.url.includes('addEvent')) {
        this.title = 'Accounting Event Details | Add Event: Initial';
        this.scheduleDetailsForm.controls[
          'accountingEventBeginDate'
        ]?.disable();
        this.scheduleDetailsForm.controls['accountingEventEndDate']?.disable();
      } else if (this.router.url.includes('editEvent')) {
        this.loadScheduleDataforEdit();
      } else if (this.router.url.includes('remeasureEvent')) {
        this.loadScheduleDataforRemeasure();
      }
    }
  }

  loadScheduleDataforEdit() {
    this.title =
      'Accounting Event Details | Edit Event: ' +
      this.accountingEventsData?.measureEvent;
    this.scheduleDetailsForm.controls['classificationId']?.disable();
    this.selectedClassificationID = this.accountingEventsData?.classificationID;
    this.selectedJournalEntryProfileID =
      this.accountingEventsData?.journalEntryProfileID;
    this.scheduleDetailsForm
      .get('isImpaired')
      .setValue(this.accountingEventsData.isImpaired);
    this.selectedExceptionId = this.accountingEventsData?.exceptionReason ?? 0;
    this.scheduleDetailsForm
      .get('reportingExceptionReason')
      .setValue(this.accountingEventsData.exceptionOtherReason);
    this.scheduleDetailsForm
      .get('detailsSectionComments')
      .setValue(this.accountingEventsData.comments);
    this.scheduleDetailsForm
      .get('notFirstDayOfTheMonth')
      .setValue(this.accountingEventsData.includeFromFirst);
    if (this.accountingEventsData?.measureEvent === 'Initial') {
      this.scheduleDetailsForm.get('isImpaired').enable();
    } else {
      this.scheduleDetailsForm.get('isImpaired').disable();
    }
  }

  loadScheduleDataforRemeasure() {
    this.title =
      'Accounting Event Details |' +
      ` ${'Measure Event: '}  ${this.measureEvent} 
    ${
      this.isRetro && this.measureEvent !== 'Initial'
        ? ' | Retrospective Adjustment'
        : ''
    }`;
    this.scheduleDetailsForm.controls['classificationId']?.disable();
    this.selectedClassificationID = this.accountingEventsData?.classificationID;
    this.selectedExceptionId = this.accountingEventsData.exceptionReason ?? 0;
    this.scheduleDetailsForm
      .get('reportingExceptionReason')
      .setValue(this.accountingEventsData.exceptionOtherReason);
    this.scheduleDetailsForm
      .get('isImpaired')
      .setValue(this.accountingEventsData.isImpaired);
    this.scheduleDetailsForm.get('isImpaired').disable();
    if (this.measureEvent === 'Impairment') {
      this.scheduleDetailsForm.get('isImpaired').setValue(true);
    }
    this.subscription.add(
      this.accountingSummaryService
        .getEventDetails(this.eventsGridData.masterScheduleID)
        .subscribe((response) => {
          if (response.success) {
            let scheduleData = response.data.sort(
              (a, b) => a.scheduleIndex - b.scheduleIndex
            );
            this.dayOneDate = new Date(scheduleData[0].beginDate);
          }
        })
    );
  }

  ngOnInit(): void {
    this.portfolioSettings = JSON.parse(
      localStorage.getItem('portfolioSettings') || '{}'
    );
    this.journalEntryProfileRequired =
      this.portfolioSettings?.journalEntryProfileRequired;

    this.initializeScheduleDetailsForm();
    this.handleFormValueChanges();
    this.title = 'Accounting Event Details | Add Event: Initial';
  }

  initializeScheduleDetailsForm() {
    this.scheduleDetailsForm = this.fb.group({
      classificationId: ['', Validators.required],
      journalEntryProfile: ['', Validators.required],
      accountingEventBeginDateDropdown: ['', Validators.required],
      accountingEventBeginDate: ['', Validators.required],
      accountingEventEndDateDropdown: ['', Validators.required],
      accountingEventEndDate: ['', Validators.required],
      notFirstDayOfTheMonth: [false, Validators.required],
      reportingExceptions: [''],
      reportingExceptionReason: [''],
      isImpaired: [false],
      detailsSectionComments: [''],
      includeCharges: [false],
    });
  }

  handleFormValueChanges() {
    const debounce = 300;
    combineLatest([
      this.scheduleDetailsForm
        .get('accountingEventBeginDate')
        ?.valueChanges.pipe(debounceTime(debounce)),
      this.scheduleDetailsForm
        .get('accountingEventEndDate')
        ?.valueChanges.pipe(debounceTime(debounce)),
    ])
      .pipe(takeUntil(this.formSubscription$))
      .subscribe(([accountingEventBeginDate, accountingEventEndDate]) => {
        const termBeginDate = this.addEditScheduleService.toShortDateString(
          accountingEventBeginDate
        );
        const termEndDate = this.addEditScheduleService.toShortDateString(
          accountingEventEndDate
        );

        const lastApprovedOrExportedDate =
          this.addEditScheduleService.isValidDate(
            this.lastApprovedOrExportedDate
          );
        if (lastApprovedOrExportedDate) {
          const formattedLastApprovedOrExportedDate =
            this.addEditScheduleService.toShortDateString(
              this.lastApprovedOrExportedDate
            );
          termBeginDate <= formattedLastApprovedOrExportedDate
            ? (this.isRetro = true)
            : (this.isRetro = false);
        }
        this.title =
          'Accounting Event Details |' +
          ` ${
            this.pageMode === 'Edit Event' ? 'Edit Event | ' : 'Measure Event: '
          }  ${this.measureEvent} ${
            this.isRetro && this.measureEvent !== 'Initial'
              ? ' | Retrospective Adjustment'
              : ''
          }`;

        if (termBeginDate && termEndDate) {
          if (termBeginDate > termEndDate) {
            this.resetAccountingTerms();
            this.emitAccountingTerms();
          } else {
            this.getEventsDateOptions(termBeginDate, termEndDate);
          }
        } else {
          this.resetAccountingTerms();
          this.emitAccountingTerms();
          this.emitScheduleDetailsData();
        }
      });

    this.addEventFormService.compoundFrequency$
      .pipe(debounceTime(debounce), takeUntil(this.formSubscription$))
      .subscribe((compoundFrequency) => {
        this.compoundFrequency = compoundFrequency;
      });

    this.accountingSummaryService.lastApprovedOrExportedDate$
      .pipe(debounceTime(debounce), takeUntil(this.formSubscription$))
      .subscribe((isRetro) => {
        isRetro ? (this.lastApprovedOrExportedDate = new Date(isRetro)) : null;
      });

    this.scheduleDetailsForm.valueChanges
      .pipe(
        debounceTime(debounce),
        distinctUntilChanged(),
        takeUntil(this.formSubscription$)
      )
      .subscribe(() => {
        const scheduleDetailsformData = this.scheduleDetailsForm.getRawValue();
        this.scheduleDetailsformData = this.scheduleDetailsForm.getRawValue();
        this.addEventFormService.setScheduleDetailsFormData(
          scheduleDetailsformData,
          this.termBeginDateObj,
          this.termEndDateObj
        );
        this.scheduleDetailsValidation();
      });

    this.scheduleDetailsForm
      .get('classificationId')
      ?.valueChanges.pipe(
        debounceTime(debounce),
        distinctUntilChanged(),
        takeUntil(this.formSubscription$)
      )
      .subscribe((classificationValue) => {
        this.selectedClassificationID = classificationValue[0];
        this.classificationChanged.emit(classificationValue[0]);
        this.addEventFormService.classificationID$.next(+classificationValue);
        if (classificationValue[0] === 0 || classificationValue[0] === 5) {
          this.scheduleDetailsForm.get('isImpaired').setValue(false);
        }
      });
  }

  scheduleDetailsValidation() {
    const termBegin = this.addEditScheduleService.toShortDateString(
      this.scheduleDetailsformData.accountingEventBeginDate
    );
    const termEnd = this.addEditScheduleService.toShortDateString(
      this.scheduleDetailsformData.accountingEventEndDate
    );
    const accountingEventBeginDate =
      this.addEditScheduleService.toShortDateString(
        this.eventsGridData?.beginDate
      );

    const accountingEventEndDate =
      this.addEditScheduleService.toShortDateString(
        this.eventsGridData?.endDate
      );

    const priorEventBeginDate = this.addEditScheduleService.toShortDateString(
      this.router.lastSuccessfulNavigation?.extras.state?.priorEventBeginDate
    );

    const priorEventEndDate = this.addEditScheduleService.toShortDateString(
      this.router.lastSuccessfulNavigation?.extras.state?.priorEventEndDate
    );

    const classificationID = Array.isArray(
      this.scheduleDetailsForm.get('classificationId').value
    )
      ? this.scheduleDetailsForm.get('classificationId').value[0]
      : this.scheduleDetailsForm.get('classificationId').value;
    const calendarMinDate = new Date(this.portfolioSettings.calendarMinDate);
    const calendarMaxDate = new Date(this.portfolioSettings.calendarMaxDate);
    const journalEntryProfile = Array.isArray(
      this.scheduleDetailsForm.get('journalEntryProfile').value
    )
      ? this.scheduleDetailsForm.get('journalEntryProfile').value[0]
      : this.scheduleDetailsForm.get('journalEntryProfile').value;

    const termBeginDate =
      this.addEditScheduleService.parseDateString(termBegin);
    const termEndDate = this.addEditScheduleService.parseDateString(termEnd);

    const firstDayOfTheMonth = termBeginDate?.getDate() === 1;

    if (this.termBeginBlur) {
      this.termBeginStatus = termBeginDate ? 'default' : 'error';
      this.termBeginStatusMessage = termBeginDate
        ? ''
        : 'Term begin date is required.';
    }
    if (this.termEndBlur) {
      this.termEndStatus = termEndDate ? 'default' : 'error';
      this.termEndStatusMessage = termEndDate
        ? ''
        : 'Term begin date is required.';
    }

    if (!termBeginDate || !termEndDate) {
      this.updateScheduleDetailsValidity(false, false);
      return;
    } else if (termBeginDate && termEndDate) {
      this.updateScheduleDetailsValidity(true, true);
    }

    if (
      this.isRetro &&
      (classificationID === 0 || classificationID === 5) &&
      this.measureEvent !== 'Initial'
    ) {
      this.addEventFormService.isOperatingRetrospectiveAdjustment$.next(true);
      this.addEditScheduleService.showToast(
        'Retroactive Adjustment is not allowed',
        `You are attempting to do a retroactive adjustment on an ${this.classificationName} which is not allowed.`
      );
      this.updateScheduleDetailsValidity(true, false);
      return;
    } else {
      this.addEditScheduleService.clearToastBySummary(
        'Retroactive Adjustment is not allowed'
      );
      this.addEditScheduleService.clearToastBySummary('Unsupported Action');
      this.addEventFormService.isOperatingRetrospectiveAdjustment$.next(false);
      this.updateScheduleDetailsValidity(true, true);
    }

    if (
      (!classificationID && classificationID !== 0) ||
      !termBegin ||
      !termEnd ||
      (this.showReportExceptionComment &&
        this.scheduleDetailsForm.get('reportingExceptionReason').value === '')
    ) {
      this.updateScheduleDetailsValidity(false, false);
      return;
    }

    if (classificationID && classificationID !== 0) {
      if (
        (termBeginDate && termEndDate && termBegin > termEnd) ||
        termBeginDate < calendarMinDate ||
        termBeginDate > calendarMaxDate ||
        termEndDate < calendarMinDate ||
        termEndDate > calendarMaxDate
      ) {
        this.addEditScheduleService.showToast(
          'Accounting Term Begin Or End',
          `Saving is disabled because an error was thrown: The Period From or Period To is either outside the calendar range, or not properly configured for Calendar: ${this.portfolioSettings.leaseRecognitionCalendarID}`
        );
        this.updateScheduleDetailsValidity(false, false);
        return;
      } else {
        this.addEditScheduleService.clearToastBySummary(
          'Accounting Term Begin Or End'
        );
        this.updateScheduleDetailsValidity(true, true);
      }
    }

    if (this.measureEvent === 'Full Termination') {
      if (this.pageMode === 'Edit Event' && termEnd >= priorEventEndDate) {
        this.addEditScheduleService.showToast(
          'Term End Date',
          `Remeasurement date cannot be greater than or equal to ${priorEventEndDate} when performing full termination.`
        );
        this.updateScheduleDetailsValidity(false, false);
        return;
      } else if (
        this.pageMode !== 'Edit Event' &&
        termEnd >= accountingEventEndDate
      ) {
        this.addEditScheduleService.showToast(
          'Term End Date',
          `Remeasurement date cannot be greater than or equal to ${accountingEventEndDate} when performing full termination.`
        );
        this.updateScheduleDetailsValidity(false, false);
        return;
      } else {
        this.addEditScheduleService.clearToastBySummary('Term End Date');
        this.updateScheduleDetailsValidity(true, true);
      }
    }

    if (
      this.pageMode !== 'Add Event' &&
      this.measureEvent !== 'Full Termination' &&
      this.measureEvent !== 'Initial' &&
      classificationID !== 0 &&
      classificationID !== 5 &&
      this.termBeginDate &&
      !firstDayOfTheMonth &&
      this.compoundFrequency === 1 &&
      termBegin !== accountingEventBeginDate
    ) {
      this.addEditScheduleService.showToast(
        'Period From Must Start on the First Of The Month',
        'Period From must start on the first of the month because this is a remeasured schedule and is a Classification with the interest component.',
        'info',
        false
      );
      this.scheduleDetailsForm
        .get('accountingEventBeginDate')
        .setValue(new Date(new Date(termBegin).setDate(1)));
    }

    if (termBegin < priorEventBeginDate && this.measureEvent !== 'Initial') {
      this.addEditScheduleService.showToast(
        'Term Begin Date',
        `Remeasurements cannot start before the min future adjustment date of ${priorEventBeginDate}`
      );
      this.updateScheduleDetailsValidity(false, false);
      return;
    } else {
      this.addEditScheduleService.clearToastBySummary('Term Begin Date');
      this.updateScheduleDetailsValidity(true, true);
    }

    if (
      this.jeProfileBlur &&
      this.journalEntryProfileList &&
      this.journalEntryProfileList.length > 0 &&
      this.journalEntryProfileRequired
    ) {
      this.jeProfileStatus = journalEntryProfile ? 'default' : 'error';
      this.jeProfileStatusMessage = journalEntryProfile
        ? ''
        : 'Journal entry profile is required.';
    }
    this.jeProfileDD.validate();

    if (
      this.journalEntryProfileRequired &&
      (!journalEntryProfile || journalEntryProfile.length === 0)
    ) {
      this.updateScheduleDetailsValidity(true, false);
      return;
    } else {
      this.updateScheduleDetailsValidity(true, true);
      this.jeProfileStatus = 'default';
      this.jeProfileStatusMessage = '';
    }
    this.addEventFormService.validateCalculateComponents$.next(false);
  }

  private updateScheduleDetailsValidity(
    isValidForCalculate: boolean,
    isValidForSave: boolean
  ): void {
    const section = 'scheduleDetails';
    this.addEventFormService.isValidForCalculate(section, isValidForCalculate);

    if (isValidForSave !== undefined) {
      this.addEventFormService.isValidForSave(section, isValidForSave);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.formSubscription$.next();
    this.formSubscription$.complete();
    // this.accountingSummaryService.isRetro$.next(null);
  }

  emitScheduleDetailsData() {
    let d1 = false;
    let begin = this.termBeginDate ? new Date(this.termBeginDate) : null;
    if (!!this.dayOneDate && !!begin) {
      d1 = begin.getTime() === this.dayOneDate.getTime();
    }
    const scheduleData = {
      termBegin: this.termBeginDate ? new Date(this.termBeginDate) : null,
      termEnd: this.termEndDate ? new Date(this.termEndDate) : null,
      termsInMonth: +this.termInMonths || 0,
      isDayOne: d1,
    };
    this.scheduleDetailsData.emit(scheduleData);
  }

  getUserInfo() {
    this.facade.contactRecord$.subscribe((contact) => {
      this.isEuroDateFormat = contact.preferences.contactDatesEU;
      this.dateFormat.type = this.isEuroDateFormat
        ? 'dd.MM.yyyy'
        : 'MM/dd/yyyy';
    });
  }

  onClassificationValueChanged(event: any) {
    if (event) {
      this.addEditScheduleService.clearAllToastMessages();
      this.classificationName = event[0].classificationType;
      this.isTermBeginDirectEntry = true;
      this.isTermEnDirectEntry = true;
      this.journalEntryProfileList =
        this.commonDropdowns?.journalEntryProfiles.filter(
          (profile) =>
            profile.classificationID === event[0].classificationID &&
            profile.isActive
        );
      this.defaultClassificationConfigurations =
        this.classificationSettings.filter(
          (item) => item.classificationID === event[0].classificationID
        );

      this.setMeasureEvent = this.measureEvent || 'Initial';
      this.defaultClassificationFilterByMeasureEvent =
        this.defaultClassificationConfigurations.find(
          (item) => item.remeasureTypeName === this.setMeasureEvent
        );
      this.beginDateOptionsForEvents = this.getTermBeginDate(
        this.eventDateOptions
      );
      this.endDateOptionsForEvents = this.getTermEndDate(this.eventDateOptions);
      this.selectedBeginDateID =
        this.defaultClassificationFilterByMeasureEvent?.beginDateOptionID === 1
          ? this.defaultClassificationFilterByMeasureEvent?.beginDateFormItemID
          : this.defaultClassificationFilterByMeasureEvent?.beginDateOptionID;
      this.selectedEndDateID =
        this.defaultClassificationFilterByMeasureEvent?.endDateOptionID === 1
          ? this.defaultClassificationFilterByMeasureEvent?.endDateFormItemID
          : this.defaultClassificationFilterByMeasureEvent?.endDateOptionID;

      if (this.pageMode !== 'Add Event')
        if (this.selectedBeginDateID === 2) {
          this.termBeginDate = this.accountingEventsData.beginDate;
        }

      if (
        !!this.accountingEventsData?.endDate &&
        this.selectedEndDateID === 2
      ) {
        this.termEndDate = this.accountingEventsData.endDate;
      }

      if (this.pageMode === 'Edit Event') {
        const selectedBeginDateID = this.accountingEventsData?.fromDateOptionID;
        const selectedEndDateID = this.accountingEventsData?.toDateOptionID;

        if (selectedBeginDateID === 2 || selectedBeginDateID !== 1) {
          this.selectedBeginDateID =
            this.accountingEventsData?.fromDateOptionID;
          this.scheduleDetailsForm
            .get('accountingEventBeginDate')
            .setValue(this.accountingEventsData?.beginDate);
        } else {
          this.selectedBeginDateID =
            this.accountingEventsData?.fromDateFormItemID;
          this.scheduleDetailsForm
            .get('accountingEventBeginDate')
            .setValue(this.accountingEventsData?.beginDate);
        }

        if (selectedEndDateID === 2 || selectedEndDateID !== 1) {
          this.selectedEndDateID = this.accountingEventsData?.toDateOptionID;
          this.scheduleDetailsForm
            .get('accountingEventEndDate')
            .setValue(this.accountingEventsData?.endDate);
        } else {
          this.selectedEndDateID = this.accountingEventsData.toDateFormItemID;
          this.scheduleDetailsForm
            .get('accountingEventEndDate')
            .setValue(this.accountingEventsData?.endDate);
        }
      }

      if (this.defaultClassificationFilterByMeasureEvent) {
        if (
          this.defaultClassificationFilterByMeasureEvent.journalEntryOption ===
          'Direct Entry'
        ) {
          return;
        } else if (
          this.defaultClassificationFilterByMeasureEvent.journalEntryOption ===
          'Prior Value'
        ) {
          this.selectedJournalEntryProfileID =
            this.accountingEventsData?.journalEntryProfileID;
        } else {
          this.selectedJournalEntryProfileID =
            this.defaultClassificationFilterByMeasureEvent.journalEntryProfileID;
        }

        if (
          this.defaultClassificationFilterByMeasureEvent.commentsOption ===
          'Prior Comments'
        ) {
          this.scheduleDetailsForm
            .get('detailsSectionComments')
            .setValue(this.accountingEventsData?.comments);
        }
      }
    }
  }

  onJournalEntryProfileValueChanged(event) {
    this.addEditScheduleService.clearToastBySummary('Journal Entry Profile');
  }

  addNoExceptionEntry(originalArray: any[]): any[] {
    const updateReportingException = [...originalArray];
    updateReportingException.unshift({
      id: 0,
      name: 'No Exception',
      isActive: true,
      sortOrder: 0,
    });
    return updateReportingException;
  }

  onReportingExceptionValueChanged(event: any) {
    if (event) {
      this.selectedExceptionReason = event[0].name;
      if (
        Array.isArray(event) &&
        event.some((item: any) => item.name === 'Other Reason')
      ) {
        this.showReportExceptionComment = true;
      } else {
        this.showReportExceptionComment = false;
      }
    }
  }

  getTermBeginDate(eventDateOptions: any[]): any[] {
    return eventDateOptions
      ?.map((option) => {
        // Check if isFormItem is true and optionID is 1, then set optionID to formItemID
        if (option.isFormItem === true && option.optionID === 1) {
          option.optionID = option.formItemID;
        }

        if (
          option.optionID === 15 &&
          (option.optionDate === null ||
            isNaN(new Date(option.optionDate).getTime()))
        ) {
          option.optionDate = this.accountingEventsData?.beginDate
            ? new Date(this.accountingEventsData?.beginDate)
            : null;
        } else if (
          option.optionID === 17 &&
          (option.optionDate === null ||
            isNaN(new Date(option.optionDate).getTime()))
        ) {
          const endDate = this.accountingEventsData?.endDate
            ? new Date(this.accountingEventsData?.endDate)
            : new Date();
          endDate.setDate(endDate.getDate() + 1);
          option.optionDate = endDate;
        }
        return {
          ...option,
          accountingEventBeginDateDisplay: option.optionDate
            ? `${option.optionName} (${this.datePipe.transform(
                option.optionDate,
                this.dateFormat.type
              )})`
            : option.optionName,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter(
        (option) =>
          option.isBeginDateOption === true &&
          (this.pageMode !== 'Add Event' || !option.isInitialExempt)
      );
  }

  getTermEndDate(eventDateOptions: any[]): any[] {
    return eventDateOptions
      ?.map((option) => {
        // Check if isFormItem is true and optionID is 1, then set optionID to formItemID
        if (option.isFormItem === true && option.optionID === 1) {
          option.optionID = option.formItemID;
        }

        if (
          option.optionID === 16 &&
          (option.optionDate === null ||
            isNaN(new Date(option.optionDate).getTime()))
        ) {
          option.optionDate = this.accountingEventsData?.endDate
            ? new Date(this.accountingEventsData?.endDate)
            : null;
        }
        return {
          ...option,
          accountingEventEndDateDisplay: option.optionDate
            ? `${option.optionName} (${this.datePipe.transform(
                option.optionDate,
                this.dateFormat.type
              )})`
            : option.optionName,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter(
        (option) =>
          option.isEndDateOption === true &&
          (this.pageMode !== 'Add Event' || !option.isInitialExempt)
      );
  }

  setTermBeginDate(event: any) {
    if (event.length === 0) {
      this.termBeginDate = null;
      this.resetAccountingTerms();
    } else {
      this.termBeginDateObj = event[0];
      if (event[0].optionDate) {
        this.isTermBeginDirectEntry = false;
        this.termBeginDate = new Date(event[0].optionDate);
        this.scheduleDetailsForm.controls[
          'accountingEventBeginDate'
        ]?.disable();
      } else if (this.measureEvent === 'Full Termination') {
        this.scheduleDetailsForm.controls[
          'accountingEventBeginDate'
        ]?.disable();
      } else if (
        event[0].optionName === 'Direct Entry' &&
        !this.isTermBeginDirectEntry
      ) {
        this.termBeginDate = null;
        this.scheduleDetailsForm.controls['accountingEventBeginDate']?.enable();
      } else if (
        event[0].optionName === 'Direct Entry' &&
        this.isTermBeginDirectEntry
      ) {
        this.scheduleDetailsForm.controls['accountingEventBeginDate']?.enable();
      } else {
        this.isTermBeginDirectEntry = false;
        this.termBeginDate = null;
        this.scheduleDetailsForm.controls[
          'accountingEventBeginDate'
        ]?.disable();
      }
    }
  }

  setTermEndDate(event: any) {
    if (event.length === 0) {
      this.termEndDate = null;
      this.resetAccountingTerms();
    } else {
      this.termEndDateObj = event[0];
      if (event[0].optionDate) {
        this.isTermEnDirectEntry = false;
        this.termEndDate = new Date(event[0].optionDate);
        this.scheduleDetailsForm.controls['accountingEventEndDate']?.disable();
      } else if (
        event[0].optionName === 'Direct Entry' &&
        !this.isTermEnDirectEntry
      ) {
        this.termEndDate = null;
        this.scheduleDetailsForm.controls['accountingEventEndDate']?.enable();
      } else if (
        event[0].optionName === 'Direct Entry' &&
        this.isTermEnDirectEntry
      ) {
        this.scheduleDetailsForm.controls['accountingEventEndDate']?.enable();
      } else {
        this.isTermEnDirectEntry = false;
        this.termEndDate = null;
        this.scheduleDetailsForm.controls['accountingEventEndDate']?.disable();
      }
    }
  }

  onTermBeginDateChange(event: any) {
    this.termBeginDate = event.value ? new Date(event.value) : null;
    this.validateDates();
  }

  onTermEndDateChange(event: any) {
    this.termEndDate = event.value ? new Date(event.value) : null;
    if (this.measureEvent === 'Full Termination') {
      this.termBeginDate = this.termEndDate;
      this.scheduleDetailsForm.controls['accountingEventBeginDate']?.disable();
      this.scheduleDetailsForm.controls[
        'accountingEventBeginDateDropdown'
      ]?.disable();
      this.resetAccountingTerms();
    }
  }

  validateDates() {
    const remeasureEvent = this.accountingEventsData?.measureEvent;
    this.termsValidationFailed =
      !!this.termBeginDate &&
      (this.pageMode === 'Add Event' ||
        (this.pageMode === 'Edit Event' && remeasureEvent === 'Initial')) &&
      new Date(this.termBeginDate).getDate() > 1;
  }

  resetAccountingTerms() {
    this.termString = '';
    this.termInPeriods = 0;
    this.termInMonths = 0;
    this.termInDays = 0;
    this.termInYear = 0;
  }

  emitAccountingTerms() {
    let accountingTerms: {
      termString: string;
      termInPeriods: number;
      termInMonths: number;
      termInDays: number;
      termInYear: number;
    };

    accountingTerms =
      this.measureEvent === 'Full Termination'
        ? {
            termString: '',
            termInPeriods: 0,
            termInMonths: 0,
            termInDays: 0,
            termInYear: 0,
          }
        : {
            termString: this.termString,
            termInPeriods: this.termInPeriods,
            termInMonths: this.termInMonths,
            termInDays: this.termInDays,
            termInYear: this.termInYear,
          };

    this.addEventFormService.accountingTerms$.next(accountingTerms);
  }

  private getEventsDateOptions(termBeginDate: string, termEndDate: string) {
    this.subscription.add(
      this.addEditScheduleService
        .getTermCalculations(termBeginDate, termEndDate)
        .subscribe((response: any) => {
          if (response === null) {
            this.accountingSummaryService.displayContactSystemAdminMessage();
          } else if (response.success) {
            this.termCalculations = response.data;
            this.termString = response.data.termString;
            this.termInPeriods = response.data.termInPeriods;
            this.termInMonths = response.data.termInMonths;
            this.termInDays = response.data.termInDays;
            this.termInYear = response.data.termInYears;
            if (response.data.termInYears >= 100) {
              this.addEditScheduleService.showToast(
                'Accounting Terms',
                'The accounting term cannot be more than 100 years.'
              );
              this.resetAccountingTerms();
              this.updateScheduleDetailsValidity(false, false);
              return;
            } else {
              this.addEditScheduleService.clearToastBySummary(
                'Accounting Terms'
              );
              this.updateScheduleDetailsValidity(true, true);
            }
            if (
              response.data.termInMonths < 12 &&
              this.selectedExceptionReason !==
                'Short Term Lease - Less than 12 months' &&
              this.measureEvent !== 'Full Termination'
            ) {
              this.reportExceptionValidationPopup = true;
            }
            this.emitAccountingTerms();
            this.emitScheduleDetailsData();
          } else {
            this.addEditScheduleService.showToast(
              'Accounting Term Begin Or End',
              `Saving is disabled because an error was thrown: The Period From or Period To is either outside the calendar range, or not properly configured for Calendar: ${this.portfolioSettings.leaseRecognitionCalendarID}`
            );
            this.resetAccountingTerms();
          }
        })
    );
  }

  closeReportExceptionPopup() {
    this.reportExceptionValidationPopup = !this.reportExceptionValidationPopup;
  }

  setScheduleAsException() {
    this.scheduleDetailsForm
      .get('reportingExceptions')
      .setValue(this.reportingExceptionsList[1].id);
    this.reportExceptionValidationPopup = !this.reportExceptionValidationPopup;
  }
}
