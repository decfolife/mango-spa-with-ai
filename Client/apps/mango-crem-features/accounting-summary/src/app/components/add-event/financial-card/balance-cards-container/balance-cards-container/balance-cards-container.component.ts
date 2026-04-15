import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BalanceCardsComponent } from '../balance-cards/balance-cards.component';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DxNumberBoxModule } from 'devextreme-angular';
import { PortfolioSettingsResponse } from '@accounting-summary/models/portfolio-settings-response.modal';
import { FormattingService } from '@accounting-summary/services/formatting.service';
import { AddEventFormService } from '@accounting-summary/services/add-event-form.service';
import { combineLatest, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { FinancialModel } from '@accounting-summary/models/financial-cards.model';
import {
  accountingTerms,
  paymentsAmount,
} from '@accounting-summary/models/interfaces/balance-card-interfaces';
import { CalculateValuesResponse } from '@accounting-summary/models/interfaces/calculate-values-response.interfaces';
import { CheckBoxComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/checkbox';
import { DropdownModule } from '@mango/ui-shared/lib-ui-elements';
import { PreviousAccountingEvent } from '@accounting-summary/models/previous-accounting-event.model';
import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import { AccountingToastService } from '@accounting-summary/services/accounting-toast.service';
@Component({
  selector: 'mango-balance-cards-container',
  standalone: true,
  imports: [
    CommonModule,
    BalanceCardsComponent,
    FormsModule,
    ReactiveFormsModule,
    DxNumberBoxModule,
    CheckBoxComponent,
    DropdownModule,
  ],
  templateUrl: './balance-cards-container.component.html',
  styleUrls: ['./balance-cards-container.component.scss'],
})
export class BalanceCardsContainerComponent implements OnInit, OnDestroy {
  portfolioSettings: PortfolioSettingsResponse;

  private subscription$ = new Subject<void>();
  balanceCardForm: FormGroup;
  balanceCardsModel = new FinancialModel();
  accountingEventsData: PreviousAccountingEvent;
  localCurrency = '';
  showPresentValueLink = true;
  showOpeningBalanceInput = false;
  openingBalanceCustomHeader = true;
  debounce = 300;

  cardsEnabled = {
    assetBalance: false,
    levelExpense: false,
    presentValue: false,
    liabilityBalance: false,
    gainLoss: false,
    adjustments: false,
    assetAmortization: false,
    straightLineExpense: false,
    openingBalance: false,
  };

  constructor(
    public addEventFormService: AddEventFormService,
    public accountingSummaryService: AccountingSummaryService,
    private accountingToastService: AccountingToastService,
    private fb: FormBuilder,
    public formatService: FormattingService
  ) {
    this.portfolioSettings =
      this.accountingSummaryService.getPortfolioSettingsFromSession();
    this.initializeBalanceCardsForm();
    this.updateBalanceCardModel(this.balanceCardForm.value);
    this.addEventFormService.accountingEventData$
      .pipe(takeUntil(this.subscription$))
      .subscribe((data) => {
        this.accountingEventsData = data;
        this.localCurrency = data.localCurrency;
      });

    this.addEventFormService.financialFormData$
      .pipe(takeUntil(this.subscription$))
      .subscribe((fin) => {
        this.updateBalanceCardModel(fin);
        if (
          !this.localCurrency ||
          this.localCurrency == '' ||
          this.localCurrency != fin.localCurrencyName
        ) {
          this.localCurrency = fin.localCurrencyName;
        }
      });

    this.addEventFormService.presentValueEnabled$
      .pipe(takeUntil(this.subscription$))
      .subscribe((pvEnable) => {
        if (
          this.addEventFormService.DayOneRemeasure$.value ||
          this.addEventFormService.measureEvent$.value === 'Full Termination'
        ) {
          this.showPresentValueLink = false;
        } else {
          this.showPresentValueLink = pvEnable;
        }
      });
  }

  ngOnInit(): void {
    this.formValueChanges();
    this.initializeSubscriptions();

    //set Amortization Method Type
    this.balanceCardsModel.amortizationMethodTypeID =
      this.portfolioSettings.amortizationMethodType;
    if (this.balanceCardsModel.pageMode === 'Edit Event') {
      this.loadFormSavedData();
    }
  }

  formValueChanges() {
    this.balanceCardForm.valueChanges
      .pipe(takeUntil(this.subscription$))
      .subscribe(() => {
        const balanceCardsFormData = this.balanceCardForm.getRawValue();
        this.addEventFormService.balanceCardForm$.next(balanceCardsFormData);
      });

    this.balanceCardForm
      .get('manualAssetAdjustment')
      .valueChanges.pipe(
        takeUntil(this.subscription$),
        debounceTime(this.debounce)
      )
      .subscribe((manualAssetAdjustment) => {
        this.addEventFormService.manualAssetAdjustment$.next(
          manualAssetAdjustment
        );
        this.balanceCardsModel.manualAssetAdjustment = manualAssetAdjustment;
        this.balanceCardsModel.totalAdjustment =
          this.balanceCardsModel.systemAssetAdjustment + manualAssetAdjustment;
        this.addEventFormService.totalAdjustment$.next(
          this.balanceCardsModel.totalAdjustment
        );
        //don't change this when you look at it and say wtf. dev extreme believes there is such a thing as negative 0 and our currency formatting breaks without this check for 0
        this.balanceCardsModel.openingBalance = this.balanceCardsModel
          .overrideOpeningBalance
          ? this.balanceCardsModel.openingBalance
          : this.balanceCardsModel.totalAdjustment !== 0
          ? this.balanceCardsModel.totalAdjustment * -1
          : 0;
      });

    this.balanceCardForm
      .get('overrideOpeningBalance')
      .valueChanges.pipe(
        takeUntil(this.subscription$),
        debounceTime(this.debounce)
      )
      .subscribe((override) => {
        this.showOpeningBalanceInput = override;
        if (override) {
          this.balanceCardsModel.totalAdjustment !== 0
            ? this.balanceCardsModel.totalAdjustment * -1
            : 0;
          this.balanceCardForm
            .get('openingBalanceInput')
            .setValue(this.balanceCardsModel.openingBalance);
        } else {
          this.balanceCardsModel.openingBalance =
            this.balanceCardsModel.totalAdjustment !== 0
              ? this.balanceCardsModel.totalAdjustment * -1
              : 0;
        }
      });

    this.balanceCardForm
      .get('compoundFrequency')
      .valueChanges.pipe(
        takeUntil(this.subscription$),
        debounceTime(this.debounce)
      )
      .subscribe((compoundFrequencyValue) => {
        const compoundFrequency = Array.isArray(compoundFrequencyValue)
          ? compoundFrequencyValue[0]
          : compoundFrequencyValue;
        this.addEventFormService.compoundFrequency$.next(compoundFrequency);
      });
  }

  initializeSubscriptions() {
    combineLatest([
      this.addEventFormService.pageMode$,
      this.addEventFormService.measureEvent$,
      this.addEventFormService.classificationID$,
    ])
      .pipe(takeUntil(this.subscription$))
      .subscribe(([pageMode, measureEvent, classificationID]) => {
        this.balanceCardsModel.classificationID = classificationID;
        this.balanceCardsModel.pageMode = pageMode;
        this.balanceCardsModel.measureEvent = measureEvent;
        this.initializePresentValueCard();
        this.enableCardsForClassification();
        if (this.balanceCardsModel.pageMode === 'Edit Event') {
          this.updateBalanceCardModel(this.accountingEventsData);
        }
      });

    combineLatest([
      this.addEventFormService.localCurrency$,
      this.addEventFormService.localCurrencyDecimalPrecision$,
    ])
      .pipe(takeUntil(this.subscription$))
      .subscribe(([localCurrency, localCurrencyDecimalPrecision]) => {
        this.balanceCardsModel.localCurrency = localCurrency;
        this.balanceCardsModel.localCurrencyDecimalPrecision =
          localCurrencyDecimalPrecision;
      });

    this.addEventFormService.calculateValuesResponseData$
      .pipe(takeUntil(this.subscription$))
      .subscribe((calculateValuesResponseData: CalculateValuesResponse) => {
        this.addEventFormService.openingAssetBalance$.next(
          calculateValuesResponseData.openingAssetBalance
        );
        this.addEventFormService.systemAssetAdjustment$.next(
          calculateValuesResponseData.systemAssetAdjustment
        );
        this.updateBalanceCardModel(calculateValuesResponseData);
        this.balanceCardsModel.totalAdjustment =
          this.balanceCardsModel.manualAssetAdjustment +
          this.balanceCardsModel.systemAssetAdjustment;
        this.addEventFormService.totalAdjustment$.next(
          this.balanceCardsModel.totalAdjustment
        );
      });

    this.addEventFormService.paymentGridData$
      .pipe(takeUntil(this.subscription$))
      .subscribe((paymentAmounts: paymentsAmount) => {
        this.balanceCardsModel.directCost =
          paymentAmounts?.directCostAmount ?? 0;
        this.balanceCardsModel.undiscountedAmount =
          paymentAmounts?.undiscountedAmount ?? 0;
        this.balanceCardsModel.terminationFee =
          paymentAmounts?.terminationFee ?? 0;
        this.balanceCardsModel.optionCharges =
          paymentAmounts?.optionAmount ?? 0;
      });

    this.addEventFormService.accountingTerms$
      .pipe(takeUntil(this.subscription$))
      .subscribe((accountingTerms: accountingTerms) => {
        this.balanceCardsModel.termInDays = accountingTerms.termInDays ?? 0;
        this.balanceCardsModel.termInPeriods =
          accountingTerms.termInPeriods ?? 0;
        this.balanceCardsModel.termInMonths = accountingTerms.termInMonths ?? 0;
        this.balanceCardsModel.termInYears = accountingTerms.termInYear ?? 0;
        this.balanceCardsModel.termString = accountingTerms.termString ?? '';
      });

    this.addEventFormService.effectiveRate$
      .pipe(takeUntil(this.subscription$))
      .subscribe((effectiveRate) => {
        this.balanceCardsModel.effectiveRate = effectiveRate;
      });
  }

  ngOnDestroy(): void {
    this.balanceCardsModel = new FinancialModel();
    this.subscription$.next();
    this.subscription$.complete();
  }

  initializeBalanceCardsForm() {
    this.balanceCardForm = this.fb.group({
      manualAssetAdjustment: new FormControl({ value: 0, disabled: false }),
      compoundFrequency: new FormControl(
        {
          value: this.portfolioSettings.defaultCompoundFrequencyType,
          disabled: false,
        },
        [Validators.required]
      ),
      paymentTiming: new FormControl(
        {
          value: this.portfolioSettings.defaultPaymentTimingType,
          disabled: false,
        },
        [Validators.required]
      ),
      overrideOpeningBalance: new FormControl({
        value: false,
        disabled: false,
      }),
      openingBalanceInput: new FormControl({
        value: 0,
        disabled: false,
      }),
    });
  }

  initializePresentValueCard() {
    this.balanceCardsModel.measureEvent !== 'Initial' ||
    this.portfolioSettings.leaseRecognitionCalendarID !== 1
      ? this.balanceCardForm.get('compoundFrequency').disable()
      : this.balanceCardForm.get('compoundFrequency').enable();

    if (this.balanceCardsModel.measureEvent === 'Full Termination') {
      this.balanceCardForm.get('paymentTiming').disable();
      this.balanceCardForm.get('manualAssetAdjustment').disable();
    } else {
      this.balanceCardForm.get('paymentTiming').enable();
      this.balanceCardForm.get('manualAssetAdjustment').enable();
    }

    if (this.balanceCardsModel.pageMode === 'Add Event') {
      this.balanceCardForm
        .get('compoundFrequency')
        .setValue(this.portfolioSettings.defaultCompoundFrequencyType);
      this.balanceCardForm
        .get('paymentTiming')
        .setValue(this.portfolioSettings.defaultPaymentTimingType);
    } else {
      this.balanceCardForm
        .get('compoundFrequency')
        .setValue(this.accountingEventsData.compoundFrequencyType);
      this.balanceCardForm
        .get('paymentTiming')
        .setValue(
          this.accountingEventsData?.paymentInArrears === false ? 1 : 2
        );
    }
  }

  loadFormSavedData() {
    this.balanceCardForm
      .get('manualAssetAdjustment')
      .setValue(this.balanceCardsModel.manualAssetAdjustment);
    this.balanceCardForm
      .get('overrideOpeningBalance')
      .setValue(this.balanceCardsModel.overrideOpeningBalance);
    this.balanceCardForm
      .get('openingBalanceInput')
      .setValue(this.balanceCardsModel.openingBalance);
  }

  localFormat(value, fixedPlaces?: number) {
    return this.formatService.localFormat(
      value,
      fixedPlaces
        ? fixedPlaces
        : this.balanceCardsModel.localCurrencyDecimalPrecision
    );
  }

  formatEffectiveRate() {
    return this.balanceCardsModel.effectiveRate?.toFixed(4);
  }

  formatCurrencyInput() {
    return this.formatService.buildCurrencyMask(
      this.balanceCardsModel.localCurrencyDecimalPrecision
    );
  }

  generateCardId(title: string, suffix: string): string {
    return `${title.toLowerCase().replace(/\s+/g, '-')}-card-${suffix}`;
  }

  getGainLoss() {
    return (
      this.balanceCardsModel.manualAssetAdjustment +
      this.balanceCardsModel.systemAssetAdjustment -
      this.balanceCardsModel.liabilityAdjustmentAmount -
      this.balanceCardsModel.terminationFee
    );
  }

  getCarryForward() {
    return (
      this.balanceCardsModel.previousAssetBalance -
      this.balanceCardsModel.previousLiabilityBalance
    );
  }

  getTotalAssetAdjustment() {
    return (
      this.balanceCardsModel.manualAssetAdjustment +
      this.balanceCardsModel.systemAssetAdjustment
    );
  }

  presentValuePreviewExcel() {
    const filename =
      this.accountingSummaryService.getFileName('PresentValueTable');
    let data;
    this.addEventFormService.presentValuePayload$.subscribe((value) => {
      data = value;
    });
    this.accountingSummaryService
      .exportPresentValuePreviewFile(data)
      .pipe(takeUntil(this.subscription$))
      .subscribe((presentValueResponse: any) => {
        if (!presentValueResponse?.data) {
          this.accountingToastService.errorNotify(
            'Downloading the present value table failed.'
          );
        } else {
          this.accountingSummaryService.downloadExcel(
            presentValueResponse.data,
            filename
          );
        }
      });
  }

  enableCardsForClassification() {
    Object.keys(this.cardsEnabled).forEach((key) => {
      this.cardsEnabled[key] = false;
    });
    switch (this.balanceCardsModel.classificationID) {
      case 0: //Operating 840
        this.cardsEnabled['openingBalance'] = true;
        this.cardsEnabled['adjustments'] = true;
        this.cardsEnabled['straightLineExpense'] = true;
        this.cardsEnabled['presentValue'] = true;
        break;
      case 1: //Capital (FAS 13)
        this.cardsEnabled['assetBalance'] = true;
        this.cardsEnabled['presentValue'] = true;
        this.cardsEnabled['liabilityBalance'] = true;
        break;
      case 2: //Finance (ASC 842)
        this.cardsEnabled['assetBalance'] = true;
        this.cardsEnabled['assetAmortization'] = true;
        this.cardsEnabled['presentValue'] = true;
        this.cardsEnabled['liabilityBalance'] = true;
        this.cardsEnabled['gainLoss'] = true;
        break;
      case 3: //Operating (ASC 842)
        this.cardsEnabled['assetBalance'] = true;
        this.cardsEnabled['levelExpense'] = true;
        this.cardsEnabled['presentValue'] = true;
        this.cardsEnabled['liabilityBalance'] = true;
        this.cardsEnabled['gainLoss'] = true;
        break;
      case 4: //IFRS 16
        this.cardsEnabled['assetBalance'] = true;
        this.cardsEnabled['assetAmortization'] = true;
        this.cardsEnabled['presentValue'] = true;
        this.cardsEnabled['liabilityBalance'] = true;
        this.cardsEnabled['gainLoss'] = true;
        break;
      case 5: // Operating (Lessor)
        this.cardsEnabled['openingBalance'] = true;
        this.cardsEnabled['adjustments'] = true;
        this.cardsEnabled['straightLineExpense'] = true;
        this.cardsEnabled['presentValue'] = true;
        break;
    }
  }

  renameUpdateVariables(update: any) {
    if (update['openingBalance']) {
      update.openingAssetBalance = update['openingBalance'];
    }
  }

  updateBalanceCardModel(update: any) {
    if ([0, 5].includes(this.balanceCardsModel.classificationID)) {
      this.renameUpdateVariables(update);
    }
    Object.keys(this.balanceCardsModel).forEach((k) => {
      if ((update[k] || update[k] === 0) && update[k] !== '') {
        this.balanceCardsModel[k] = update[k];
      }
    });
  }
}
