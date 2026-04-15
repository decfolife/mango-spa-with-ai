import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AccordionModule,
  ToggleSliderComponent,
  InputComponent,
  DropdownModule,
  IconModule,
  ButtonModule,
  InputLabelComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { FormattingService } from '@accounting-summary/services/formatting.service';
import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

import { Subscription } from 'rxjs';
import { AddEditScheduleService } from '@accounting-summary/services/add-edit-schedule.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AddEventFormService } from '@accounting-summary/services/add-event-form.service';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { PreviousAccountingEvent } from '@accounting-summary/models/previous-accounting-event.model';
import { accountingTerms } from '@accounting-summary/models/interfaces/balance-card-interfaces';
import { AccountingToastService } from '@accounting-summary/services/accounting-toast.service';

@Component({
  selector: 'mango-classification-tests',
  standalone: true,
  imports: [
    CommonModule,
    AccordionModule,
    ToggleSliderComponent,
    InputComponent,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    IconModule,
    ButtonModule,
    InputLabelComponent,
    DxNumberBoxModule,
  ],
  providers: [FormattingService],
  templateUrl: './classification-tests.component.html',
  styleUrls: ['./classification-tests.component.scss'],
})
export class ClassificationTestsComponent
  implements OnChanges, OnInit, OnDestroy
{
  componentName: string = 'classification-tests';
  leaseTermIsTrue: boolean = null;
  size: string;
  classificationTestForm: FormGroup;
  isfairMarketHasValue: boolean = false;
  implicitInterestRate: number;
  implicitRateWarningCode: string;
  implicitRateWarningMessage: string;
  title = 'Classification Tests | Test Result: Tests Incomplete';
  @Input() accountingEventsData: PreviousAccountingEvent;
  @Input() classificationId: number;
  @Input() pageMode;

  test1: boolean;
  test2: boolean;
  test3: number;
  test4: number;
  test5: boolean;

  test3BoolValue: boolean;
  test4BoolValue: boolean;

  testDropdownValues: any[];

  isResultsIncomplete: boolean = true;
  isClassificationMatched: boolean = null;
  classificationResult = 'Incomplete Test';
  classificationResultReason = 'Incomplete Test 1, 2, 3, 4, 5.';

  economicLifeYears: number = 0.0;
  remainingTermYears: number = 0.0;
  fairMarketValue: number = 0.0;
  fairMarketValueString = '';
  presentValue: number = 0.0;
  presentValueString: string = '';
  pVofAmtNotReflectedInPayments: number = 0.0;
  pVofAmtNotReflectedInPaymentsString: string = '';
  localCurrencyDecimalPrecision: number = 2;
  classificationTest3: string;
  classificationTest4: string;

  private subscriptions: Subscription[] = [];

  constructor(
    public formatService: FormattingService,
    public accountingSummaryService: AccountingSummaryService,
    private fb: FormBuilder,
    private addEditScheduleService: AddEditScheduleService,
    public addEventFormService: AddEventFormService,
    private accountingToastService: AccountingToastService
  ) {
    this.initializeClassificationForm();
    this.subscriptions.push(
      this.addEventFormService.localCurrencyDecimalPrecision$.subscribe(
        (precision) => {
          this.localCurrencyDecimalPrecision = precision;
          this.updatePrecision();
        }
      )
    );
  }

  ngOnInit(): void {
    this.handleFormValueChanges();
    this.setupTestDropdowns();
    if (this.pageMode === 'Edit Event' && this.accountingEventsData) {
      this.loadSavedData();
    }
  }

  handleFormValueChanges() {
    const debounce = 300;
    this.subscriptions.push(
      this.classificationTestForm.valueChanges
        .pipe(debounceTime(debounce), distinctUntilChanged())
        .subscribe(() => {
          const classificationTestData = {
            classificationFormData: this.classificationTestForm.getRawValue(),
            implicitRate: this.implicitInterestRate,
            classificationTestResult: this.classificationResult,
            classificationTestResultReason: this.classificationResultReason,
            isClassificationTestResultMatched: this.isClassificationMatched,
            test3: this.test3,
            test4: this.test4,
          };
          setTimeout(() => {
            this.addEventFormService.setClassificationFormData(
              classificationTestData
            );
          });
        })
    );

    this.subscriptions.push(
      this.classificationTestForm
        .get('remainingEconomicLife')
        .valueChanges.pipe(debounceTime(debounce))
        .subscribe(() => {
          this.economicLifeChange();
          const classificationTest3 =
            this.test3BoolValue === null
              ? ''
              : this.test3BoolValue
              ? 'Yes'
              : 'No';
          this.classificationTestForm
            .get('classificationTest3')
            .setValue(classificationTest3);
        })
    );

    this.subscriptions.push(
      this.classificationTestForm
        .get('fairMarketValue')
        .valueChanges.pipe(debounceTime(debounce), distinctUntilChanged())
        .subscribe((fairMarketValue) => {
          if (fairMarketValue && fairMarketValue != 0) {
            const classificationTest4 =
              this.test4BoolValue === null
                ? ''
                : this.test4BoolValue
                ? 'Yes'
                : 'No';
            this.classificationTestForm
              .get('classificationTest4')
              .setValue(classificationTest4);
            this.isfairMarketHasValue = true;
          } else {
            this.isfairMarketHasValue = false;
          }

          const result =
            (+this.presentValue + +this.pVofAmtNotReflectedInPayments) /
            +fairMarketValue;

          if (
            this.presentValue &&
            this.pVofAmtNotReflectedInPayments &&
            fairMarketValue &&
            result > 2
          ) {
            this.accountingToastService.showToast(
              'Fair Market Value',
              `FMV is less than 50% of PV + PV of Amount Not Reflected in Payments.`,
              'info'
            );
          } else {
            this.accountingToastService.clearToastBySummary(
              'Fair Market Value'
            );
          }
        })
    );

    this.subscriptions.push(
      this.addEventFormService.calculateValuesResponseData$
        .pipe(debounceTime(debounce))
        .subscribe((calculateValuesResponseData) => {
          this.implicitInterestRate = parseFloat(
            (calculateValuesResponseData.implicitRate * 100).toFixed(14)
          );
          this.presentValue = calculateValuesResponseData.presentValue;
          this.pVofAmtNotReflectedInPayments =
            calculateValuesResponseData.residualValues.presentValueOnAmtNotReflectedInPayments;
          this.classificationTest3 =
            calculateValuesResponseData.classificationTestResults
              .test3Result === null
              ? ''
              : calculateValuesResponseData.classificationTestResults
                  .test3Result
              ? 'Yes'
              : 'No';
          this.classificationTest4 =
            calculateValuesResponseData.classificationTestResults
              .test4Result === null
              ? ''
              : calculateValuesResponseData.classificationTestResults
                  .test4Result
              ? 'Yes'
              : 'No';
          this.classificationResult =
            calculateValuesResponseData.classificationTestResults.testResult;
          this.classificationResultReason =
            calculateValuesResponseData.classificationTestResults.resultReason;
          this.isClassificationMatched =
            calculateValuesResponseData.classificationTestResults.isResultMatched;
          this.title = `Classification Tests | Test Result: ${this.classificationResult}`;
          this.pvPercent();
          this.implicitRateWarningCode =
            calculateValuesResponseData.implicitRateWarningCode;
          if (
            this.implicitRateWarningCode ===
            'ImplicitRateExceedsPositiveThreshold'
          ) {
            this.implicitRateWarningMessage =
              'Implicit rate could not be found because it would exceed the 200% threshold allowed.';
          } else if (
            this.implicitRateWarningCode ===
            'ImplicitRateExceedsNegativeThreshold'
          ) {
            this.implicitRateWarningMessage =
              'Implicit rate could not be found because it would exceed the -200% threshold allowed.';
          } else {
            this.implicitRateWarningMessage = '';
          }
        })
    );

    this.subscriptions.push(
      this.addEventFormService.accountingTerms$
        .pipe(debounceTime(debounce))
        .subscribe((termValues: accountingTerms) => {
          if (termValues.termInYear) {
            this.remainingTermYears = termValues.termInYear;
          }
        })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.classificationId) {
      [0, 1].includes(this.classificationId)
        ? (this.classificationResultReason = 'Incomplete Test 1, 2, 3, 4.')
        : (this.classificationResultReason = 'Incomplete Test 1, 2, 3, 4, 5.');
    }
  }

  loadSavedData() {
    this.classificationTestForm
      .get('classificationTest1')
      .setValue(
        this.accountingEventsData.test1 === null
          ? 3
          : this.accountingEventsData.test1
          ? 1
          : 2
      );

    this.classificationTestForm
      .get('classificationTest2')
      .setValue(
        this.accountingEventsData.test2 === null
          ? 3
          : this.accountingEventsData.test2
          ? 1
          : 2
      );

    this.classificationTestForm
      .get('classificationTest5')
      .setValue(
        this.accountingEventsData.test5 === null
          ? 3
          : this.accountingEventsData.test5
          ? 1
          : 2
      );

    this.test1 = this.accountingEventsData.test1;
    this.test2 = this.accountingEventsData.test2;
    this.test3 = this.accountingEventsData.test3;
    this.test4 = this.accountingEventsData.test4;
    this.test5 = this.accountingEventsData.test5;

    this.pVofAmtNotReflectedInPayments =
      +this.accountingEventsData.residualValues
        .presentValueOnAmtNotReflectedInPayments;
    this.classificationTestForm
      .get('remainingEconomicLife')
      .setValue(this.accountingEventsData.economicLifeYears);
    this.classificationTestForm
      .get('fairMarketValue')
      .setValue(this.accountingEventsData.fmv);
    this.economicLifeYears = this.accountingEventsData.economicLifeYears;
    this.fairMarketValue = this.accountingEventsData.fmv;
    this.implicitInterestRate =
      this.accountingEventsData.implicitRate !== null
        ? parseFloat((this.accountingEventsData.implicitRate * 100).toFixed(14))
        : null;
    this.presentValue =
      this.accountingEventsData.presentValue ?? this.presentValue;
    this.pVofAmtNotReflectedInPayments =
      this.accountingEventsData.residualValues
        .presentValueOnAmtNotReflectedInPayments ??
      this.pVofAmtNotReflectedInPayments;
    this.remainingTermYears = this.accountingEventsData.termInYears;
    this.classificationResult =
      this.accountingEventsData.classificationTestResult;
    this.classificationResultReason =
      this.accountingEventsData.classificationTestResultReason;
    this.isClassificationMatched =
      this.accountingEventsData.isClassificationTestResultMatched;
    this.title = `Classification Tests | Test Result: ${this.classificationResult}`;
    this.economicLifePercent();
    this.pvPercent();
    this.fairMarketChange();
  }

  initializeClassificationForm() {
    this.classificationTestForm = this.fb.group({
      remainingEconomicLife: new FormControl({ value: null, disabled: false }),
      fairMarketValue: new FormControl({ value: null, disabled: false }),
      classificationTest1: new FormControl({ value: 3, disabled: false }),
      classificationTest2: new FormControl({ value: 3, disabled: false }),
      classificationTest3: new FormControl({ value: null, disabled: false }),
      classificationTest4: new FormControl({ value: null, disabled: false }),
      classificationTest5: new FormControl({ value: 3, disabled: false }),
    });
  }

  formatCurrency(value: number) {
    return this.formatService.localFormat(
      value,
      this.localCurrencyDecimalPrecision
    );
  }

  formatCurrencyInput() {
    return this.formatService.buildCurrencyMask(
      this.localCurrencyDecimalPrecision
    );
  }

  updatePrecision() {
    this.presentValueString = this.formatCurrency(this.presentValue);
    this.pVofAmtNotReflectedInPaymentsString = this.formatCurrency(
      this.pVofAmtNotReflectedInPayments
    );
    this.fairMarketValueString = this.formatCurrency(this.fairMarketValue);
  }

  testDropdownChanged(e, dropdownName: string) {
    let newValue = e[0].tValue === 2 ? false : e[0].tValue === 1 ? true : null;

    switch (dropdownName) {
      case 'test1': {
        this.test1 = newValue;
        this.getClassificationTestResults();
        break;
      }
      case 'test2': {
        this.test2 = newValue;
        this.getClassificationTestResults();
        break;
      }
      case 'test5': {
        this.test5 = newValue;
        this.getClassificationTestResults();
        break;
      }
      default: {
        //statements;
        break;
      }
    }
  }

  economicLifeChange() {
    this.economicLifePercent();
    this.getClassificationTestResults();
  }

  fairMarketChange() {
    this.fairMarketValueString = this.formatCurrency(this.fairMarketValue);
    this.pvPercent();
    this.getClassificationTestResults();
  }

  economicLifePercent() {
    let result: number = 0;
    let relValue: string = this.classificationTestForm.get(
      'remainingEconomicLife'
    ).value;

    if (!!!relValue || relValue === '') {
      this.economicLifeYears = null;
      this.test3 = null;
      this.test3BoolValue = null;

      return;
    } else {
      this.economicLifeYears = Number(relValue);

      if (this.economicLifeYears !== 0) {
        result = (this.remainingTermYears / this.economicLifeYears) * 100;
      }
    }

    if (isNaN(result) || result === Infinity) {
      result = 0;
    }

    this.test3 = Number(
      this.formatService.localFormat(result, 2).replace(/,/g, '')
    );
    this.test3BoolValue = this.test3 >= 75;
  }

  pvPercent() {
    let result: number = 0;
    let fmValue = this.classificationTestForm.get('fairMarketValue').value;

    if (!!!fmValue || fmValue === '') {
      this.fairMarketValue = null;
      this.test4 = null;
      this.test4BoolValue = null;

      return;
    } else {
      this.fairMarketValue = Number(fmValue);

      if (this.fairMarketValue !== 0) {
        result =
          ((+this.presentValue + +this.pVofAmtNotReflectedInPayments) /
            +this.fairMarketValue) *
          100;
      }
    }

    if (isNaN(result) || result === Infinity) {
      result = 0;
    }

    this.test4 = Number(
      this.formatService.localFormat(result, 2).replace(/,/g, '')
    );
    this.test4BoolValue = this.test4 >= 90;
  }

  getTestDropdownValue(value) {
    let returnValue = value == null ? 3 : value ? 1 : 3;

    return returnValue;
  }

  private setupTestDropdowns() {
    let testDropdownValues = [
      { tValue: 3, tDisplay: '-' },
      { tValue: 2, tDisplay: 'No' },
      { tValue: 1, tDisplay: 'Yes' },
    ];

    this.testDropdownValues = Object.assign([], testDropdownValues);
    this.test1 = null;
    this.test2 = null;
    this.test3 = null;
    this.test4 = null;
    this.test5 = null;
    this.test3BoolValue = null;
    this.test4BoolValue = null;
  }

  private getClassificationTestResults() {
    if (this.classificationId >= 0) {
      this.subscriptions.push(
        this.addEditScheduleService
          .getClassificationTestResults(
            this.classificationId,
            this.test1,
            this.test2,
            this.test3BoolValue,
            this.test4BoolValue,
            this.test5
          )
          .subscribe((res) => {
            if (res === null) {
              this.accountingToastService.displayContactSystemAdminMessage();
            } else if (res.success) {
              this.isResultsIncomplete = res?.data?.testResult
                ?.toLowerCase()
                .includes('incomplete');
              this.isClassificationMatched = res.data.isResultMatched;
              this.classificationResult = res.data.testResult;
              this.classificationResultReason = res.data.resultReason;
              this.title = `Classification Tests | Test Result: ${this.classificationResult}`;
            } else {
              this.accountingToastService.errorNotify(res.clientErrorMessage);
            }
          })
      );
    }
  }
}
