import { HttpClient } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { EndpointService, UtilitiesService } from '@mango/core-shared';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { Api } from '@mango/data-models/lib-data-models';
import { ClassificationTypeName } from '@mango/data-models/lib-data-models';
import { ProrationData } from '@accounting-summary/models/proration-data.model';
import { OtherCharge } from '@accounting-summary/models/other-charge.model';
import { Subject } from 'rxjs';
import { CalculateValues } from '@accounting-summary/models/interfaces/calculate-values.interfaces';
import { AccountingEventPayload } from '@accounting-summary/models/interfaces/save-accounting-event.interfaces';
import { AccountingSummaryService } from './accounting-summary.service';

@Injectable()
export class AddEditScheduleService extends EndpointService {
  private apiUrl: string;
  private leaseAbstractId: number;
  public chargeMinAndMaxDateOptionPopulated = new Subject<any>();

  private dateOnlyRegex =
    /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])))$/;

  constructor(
    protected http: HttpClient,
    @Optional() facade: MangoAppFacade,
    private accountingSummaryService: AccountingSummaryService
  ) {
    super(http, facade);
    this.apiUrl = UtilitiesService.getBaseApiUrl(Api.accountingSummary);
    const leaseInfo = this.accountingSummaryService.getLeaseInfoFromSession();
    this.leaseAbstractId = Number(leaseInfo.leaseAbstractID);
  }

  getCommonDropdowns() {
    return this.callHttpGet(
      `${this.apiUrl}AccountingEvents/GetCommonDropdowns/Lease/${this.leaseAbstractId}`,
      'getCommonDropdowns'
    );
  }

  getClassificationSettings() {
    return this.callHttpGet(
      `${this.apiUrl}AccountingEvents/GetClassificationSettings/Lease/${this.leaseAbstractId}`,
      'getClassificationSettings'
    );
  }

  getTermCalculations(termBegin: string, termEnd: string) {
    return this.callHttpPost(
      `${this.apiUrl}AccountingEvents/GetTermCalculations`,
      'getTermCalculations',
      JSON.stringify({
        leaseAbstractID: this.leaseAbstractId,
        termBegin,
        termEnd,
      })
    );
  }

  getDateOptions() {
    return this.callHttpGet(
      `${this.apiUrl}AccountingEvents/GetDateOptions/Lease/${this.leaseAbstractId}`,
      'getDateOptions'
    );
  }

  getAccountingEventData(ScheduleId: number) {
    return this.callHttpGet(
      `${this.apiUrl}AccountingEvents/GetAccountingEvent/${ScheduleId}`,
      'getAccountingEventData'
    );
  }

  getDiscountRateOptions(
    currency: string,
    termBegin: string,
    termInMonths: number
  ) {
    return this.callHttpPost(
      `${this.apiUrl}AccountingEvents/GetDiscountRateOptions`,
      'getDiscountRateOptions',
      JSON.stringify({
        leaseAbstractID: this.leaseAbstractId,
        currency,
        termBegin,
        termInMonths,
      })
    );
  }

  getEffectiveRate(
    annualRateType: number,
    discountRate: number,
    CompoundFrequencyType: number
  ) {
    return this.callHttpPost(
      `${this.apiUrl}AccountingEvents/getEffectiveRate`,
      'getEffectiveRate',
      JSON.stringify({ annualRateType, discountRate, CompoundFrequencyType })
    );
  }

  getFunctionalCurrencyRateLookup(
    termBegin: Date,
    localCurrency: string,
    functionalCurrency: string
  ) {
    return this.callHttpPost(
      `${this.apiUrl}AccountingEvents/GetFunctionalCurrencyRateLookup`,
      'getFunctionalCurrencyRateLookup',
      JSON.stringify({
        leaseAbstractID: this.leaseAbstractId,
        termBegin,
        localCurrency,
        functionalCurrency,
      })
    );
  }

  getClassificationTestResults(
    classificationId: number,
    test1: boolean,
    test2: boolean,
    test3: boolean,
    test4: boolean,
    test5: boolean
  ) {
    return this.callHttpPost(
      `${this.apiUrl}AccountingEvents/GetClassificationTestResults`,
      'getClassificationTestResults',
      JSON.stringify({ classificationId, test1, test2, test3, test4, test5 })
    );
  }

  getSchedulePayment(
    classificationID: number,
    amortizationProfileId: number,
    IsOverrideProfile: boolean,
    includeReasonablyCertainOptions: boolean,
    gLAccountIds: string,
    isIncome: boolean,
    scheduleCurrencyID: number,
    leaseRecognitionScheduleID: number,
    copiedFromScheduleID: number,
    remeasureTypeId: number,
    includeFromFirst: boolean,
    fromDate: string,
    toDate: string
  ) {
    return this.callHttpPost(
      `${this.apiUrl}Payments/GetSchedulePayments`,
      'getSchedulePayments',
      JSON.stringify({
        leaseAbstractID: this.leaseAbstractId,
        classificationID,
        amortizationProfileId,
        IsOverrideProfile,
        includeReasonablyCertainOptions,
        gLAccountIds,
        isIncome,
        scheduleCurrencyID,
        leaseRecognitionScheduleID,
        copiedFromScheduleID,
        remeasureTypeId,
        includeFromFirst,
        fromDate,
        toDate,
      })
    );
  }

  getScheduleTransactions(
    glEventId: number,
    paymentEventSource: string,
    targetCurrencyId: number
  ) {
    return this.callHttpPost(
      `${this.apiUrl}Payments/GetScheduleTransactions`,
      'getScheduleTransactions',
      JSON.stringify({
        leaseAbstractID: this.leaseAbstractId,
        glEventId,
        paymentEventSource,
        targetCurrencyId,
      })
    );
  }

  getProratedAmounts(prorationData: ProrationData) {
    return this.callHttpPost(
      `${this.apiUrl}Payments/GetProratedAmounts`,
      'getProratedAmounts',
      prorationData
    );
  }

  saveOtherCharge(otherCharge: OtherCharge) {
    return this.callHttpPost(
      `${this.apiUrl}Payments/SaveOtherCharge`,
      'saveOtherCharge',
      otherCharge
    );
  }

  deleteOtherCharge(glEventID: number) {
    return this.callHttpDelete(
      `${this.apiUrl}Payments/DeleteOtherCharge/${glEventID}`,
      'deletothercharge'
    );
  }

  saveROUAssetObtained(
    scheduleId: number,
    rouAssetMethodId: number,
    rouAssetObtainedAmount: number,
    rouAssetObtainedDate: Date
  ) {
    return this.callHttpPost(
      `${this.apiUrl}AccountingSummary/SaveROUAssetObtainedInformation`,
      'saveROUAssetObtained',
      JSON.stringify({
        scheduleId,
        rouAssetMethodId,
        rouAssetObtainedAmount,
        rouAssetObtainedDate,
      })
    );
  }

  calculateValues(addEventData: CalculateValues) {
    return this.callHttpPost(
      `${this.apiUrl}AccountingEvents/CalculateValues`,
      'calculateValues',
      addEventData
    );
  }

  saveAccountingEvent(saveAccountingEventData: AccountingEventPayload) {
    return this.callHttpPost(
      `${this.apiUrl}AccountingEvents/SaveAccountingEvent`,
      'saveAccountingEvent',
      saveAccountingEventData
    );
  }

  /**
   * Returns the Classification Name from the corresponding enum given a ClassificationID
   *
   * @param {number} classificationID
   * @return {*}  {(string | undefined)}
   * @memberof AccountingSummaryService
   */
  getClassificationName(classificationID: number): string | undefined {
    for (const key in ClassificationTypeName) {
      if (
        ClassificationTypeName[key as keyof typeof ClassificationTypeName] ===
        classificationID
      ) {
        return key;
      }
    }
    return undefined;
  }

  isValidDate(date: any): boolean {
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }
    return !isNaN(Date.parse(date));
  }

  toShortDateString(dateInput: Date): string | null {
    if (!dateInput) return null;
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null; // invalid date check
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  parseDateString(dateString: string | null | undefined): Date | null {
    if (!dateString) {
      return null;
    }

    if (this.dateOnlyRegex.test(dateString)) {
      const utcDate = new Date(dateString);
      // Convert to local time and set time to midnight
      const localDate = new Date(
        utcDate.getTime() + utcDate.getTimezoneOffset() * 60000
      );
      localDate.setHours(0, 0, 0, 0);
      return localDate;
    }

    // If not matching the regex, still parse and set the time to midnight
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
