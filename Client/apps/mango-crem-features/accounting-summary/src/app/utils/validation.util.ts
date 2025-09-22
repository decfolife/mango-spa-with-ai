import { ScheduleDetailsFormData } from '@accounting-summary/models/interfaces/schedule-details-form-interfaces';
import { PortfolioSettingsResponse } from '@accounting-summary/models/portfolio-settings-response.modal';

export function isValidValue(value: any): boolean {
  const actualValue = Array.isArray(value) ? value[0] : value;
  return !!actualValue;
}

export function checkSaveValidity(
  financialData: any,
  scheduleDetails: ScheduleDetailsFormData,
  portfolioSettings: PortfolioSettingsResponse,
  classificationId: number
): boolean {
  const isJournalEntryValid =
    !portfolioSettings.journalEntryProfileRequired ||
    isValidValue(scheduleDetails?.journalEntryProfile);

  const functionalCurrency =
    !(
      portfolioSettings.functionalCurrencyEnabled ||
      [2, 3, 4].includes(classificationId)
    ) || !!financialData.currencyRate;

  const isROUAssetValid =
    ![2, 3, 4].includes(classificationId) ||
    (!!financialData?.ROUMethod &&
      financialData?.ROUAmount != null &&
      !!financialData?.ROUActionDate);
  const discountRateProfile = isValidValue(financialData.discountRateProfile);

  const isValid =
    isJournalEntryValid &&
    !!scheduleDetails?.accountingEventBeginDate &&
    !!scheduleDetails?.accountingEventEndDate &&
    financialData.amortizationProfile != null &&
    functionalCurrency &&
    discountRateProfile != null &&
    financialData.discountRate != null &&
    isROUAssetValid;
  return isValid;
}
