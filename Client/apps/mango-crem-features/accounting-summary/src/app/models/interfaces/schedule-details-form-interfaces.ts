export interface TermDateOption {
  optionID: number;
  formItemID: number | null;
  optionName: string;
  optionDate: string;
  isFormItem: boolean;
  isInitialExempt: boolean;
  isBeginDateOption: boolean;
  isEndDateOption: boolean;
  sortOrder: number;
  accountingEventBeginDateDisplay?: string;
  accountingEventEndDateDisplay?: string;
}

export interface ScheduleDetailsFormData {
  classification: number;
  journalEntryProfile: number;
  accountingEventBeginDateDropdown: number;
  accountingEventBeginDate: string;
  accountingEventEndDateDropdown: number;
  accountingEventEndDate: string;
  notFirstDayOfTheMonth: boolean;
  reportingExceptions: number;
  reportingExceptionReason: string;
  isImpaired: boolean;
  detailsSectionComments: string;
  includeCharges: boolean;
  termBegin: TermDateOption;
  termEnd: TermDateOption;
}

export interface ScheduleDetailsTermsInformation {
  isDayOne: boolean;
  termBegin: Date;
  termEnd: Date;
  termsInMonth: number;
}

export interface AccountingTerms {
  leaseAbstractID: number;
  termBegin: Date;
  termEnd: Date;
  termInDays: number;
  termInMonths: number;
  termInPeriods: number;
  termInYears: number;
  termString: string;
}
