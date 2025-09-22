export interface FinancialFormData {
  discountRateProfile: number;
  discountRate: number;
  annualRateDropdown: number;
  modificationImpactScope: boolean;
  localCurrency: number;
  functionalCurrency: number;
  financialCurrencyDirectEntry: boolean;
  currencyRate: number;
  ROUMethod: number;
  ROUAmount: number;
  ROUActionDate: string;
  amortizationProfile: number;
  chargeType: string;
  overrideAmortizationProfile: boolean;
  manualAmortizationProfileName: string | null;
  assetBalanceManualAdjustment: string;
}

export interface GlAccountProfile {
  profileID: number;
  profileName: string;
  isActive: boolean;
  includeReasonablyCertainOptions: boolean;
  glAccountIDsCSV: string | null;
  comments: string | null;
}

export interface FinancialFormWrapper {
  financialFormData: FinancialFormData;
  glAccountIDsCSV: GlAccountProfile[];
  localCurrencyName: string;
  localCurrencyDecimalPrecision: number;
  pageMode: string;
  measureEvent: string;
  leaseRecognitionScheduleID: number;
  copiedFromScheduleID: number;
  useDateEU: string;
  calendarId: number;
  leaseRecognitionID: number;
}
