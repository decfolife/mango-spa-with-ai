import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { PortfolioSettingsResponse } from '@accounting-summary/models/portfolio-settings-response.modal';
import { PreviousAccountingEvent } from '@accounting-summary/models/previous-accounting-event.model';
import { CommonDropdowns } from '@accounting-summary/models/common-dropdowns.model';
import { TermDateOption } from '@accounting-summary/models/interfaces/schedule-details-form-interfaces';
import { AccountingSummaryService } from './accounting-summary.service';

@Injectable({
  providedIn: 'root',
})
export class AddEventFormService {
  portfolioSettings: PortfolioSettingsResponse;

  private validationStatesForCalculate = {
    scheduleDetails: true,
    residualValue: true,
    financialCard: true,
  };

  private validationStatesForSave = {
    scheduleDetails: true,
    residualValue: true,
    financialCard: true,
  };

  isValidForCalculate(
    key: keyof typeof this.validationStatesForCalculate,
    isValid: boolean
  ) {
    this.validationStatesForCalculate[key] = isValid;
    const allValid = Object.values(this.validationStatesForCalculate).every(
      (state) => state === true
    );
    this.isCalculateValuesAllowed$.next(allValid);
  }

  isValidForSave(
    key: keyof typeof this.validationStatesForSave,
    isValid: boolean
  ) {
    this.validationStatesForSave[key] = isValid;
    const allValid = Object.values(this.validationStatesForSave).every(
      (state) => state === true
    );
    this.isSaveAllowed$.next(allValid);
  }

  private scheduleDetailsForm$ = new Subject<any>();
  private financialForm$ = new Subject<any>();
  private classificationForm$ = new BehaviorSubject<any>({});
  public RVForm$ = new BehaviorSubject<any>({});
  public paymentGridData$ = new BehaviorSubject<any>({});
  public balanceCardForm$ = new Subject<any>();
  private commonDropdowns$ = new BehaviorSubject<any>({});

  private calculateValuesResponse$ = new Subject<any>();
  public presentValuePayload$ = new BehaviorSubject<any>({});
  public presentValueEnabled$ = new BehaviorSubject<boolean>(false);
  public accountingEventData$ = new BehaviorSubject<any>({});
  public classificationID$ = new BehaviorSubject<number>(null);
  public pageMode$ = new BehaviorSubject<string>('');
  public measureEvent$ = new BehaviorSubject<string>('');
  public localCurrency$ = new BehaviorSubject<string>('');
  public localCurrencyDecimalPrecision$ = new BehaviorSubject<number>(0);
  public accountingTerms$ = new BehaviorSubject<object>({});
  public effectiveRate$ = new BehaviorSubject<number>(0);

  public openingAssetBalance$ = new BehaviorSubject<number>(0);
  public systemAssetAdjustment$ = new BehaviorSubject<number>(0);
  public manualAssetAdjustment$ = new BehaviorSubject<number>(0);
  public totalAdjustment$ = new BehaviorSubject<number>(0);
  public DayOneRemeasure$ = new BehaviorSubject<boolean>(false);
  public isOperatingRetrospectiveAdjustment$ = new BehaviorSubject<boolean>(
    false
  );

  public compoundFrequency$ = new BehaviorSubject<number>(null);
  public paymentTiming$ = new BehaviorSubject<number>(null);

  public isCalculateValuesAllowed$ = new BehaviorSubject<boolean>(false);
  public isSaveAllowed$ = new BehaviorSubject<boolean>(false);
  public ignoreButtonReset = new BehaviorSubject<boolean>(false);
  public calculateValuesClicked = new BehaviorSubject<boolean>(false);
  public validateCalculateComponents$ = new BehaviorSubject<boolean>(false);
  public operatingClassifications: number[] = [0, 5];
  public isOtherChargesSaved = new BehaviorSubject<{
    isOtherChargesSaved: boolean;
    glEventIDs: number[];
  }>({ isOtherChargesSaved: false, glEventIDs: [] });
  financialFormData$ = this.financialForm$;
  scheduleDetailsFormData$ = this.scheduleDetailsForm$;
  classificationFormData$ = this.classificationForm$;
  RVFormFormData$ = this.RVForm$;
  commonDropdownsData$ = this.commonDropdowns$;
  calculateValuesResponseData$ = this.calculateValuesResponse$;
  overrideOpeningBalance$ = new BehaviorSubject<number>(0);

  constructor(private accountingSummaryService: AccountingSummaryService) {
    this.portfolioSettings =
      this.accountingSummaryService.getPortfolioSettingsFromSession();
    this.compoundFrequency$.next(
      this.portfolioSettings?.defaultCompoundFrequencyType
    );
    this.paymentTiming$.next(this.portfolioSettings?.defaultPaymentTimingType);
  }

  setaccountingEventData(data: PreviousAccountingEvent) {
    this.accountingEventData$.next(data);
  }

  setFinancialFormData(data: any) {
    this.financialForm$.next(data);
  }

  setCalculateValueResponse(data: any) {
    this.calculateValuesResponse$.next(data);
    this.calculateValuesClicked.next(true);
  }

  setScheduleDetailsFormData(
    data: any,
    termBegin: TermDateOption,
    termEnd: TermDateOption
  ) {
    this.scheduleDetailsForm$.next({ ...data, termBegin, termEnd });
  }

  setRVFormData(data: any) {
    this.RVForm$.next(data);
  }

  setClassificationFormData(data: any) {
    this.classificationFormData$.next(data);
  }

  RVFormData(data: any) {
    this.classificationFormData$.next(data);
  }

  setCommonDropdownsData(data: CommonDropdowns) {
    this.commonDropdowns$.next(data);
  }
}
