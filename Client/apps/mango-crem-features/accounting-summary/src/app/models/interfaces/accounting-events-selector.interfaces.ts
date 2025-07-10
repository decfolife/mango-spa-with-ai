export interface AccountingEventSelector {
  leaseAbstractID: number;
  leaseRecognitionID: number;
  leaseRecognitionScheduleID: number;
  masterScheduleID: number;
  classificationID: number;
  classificationType: string;
  amortizationProfileID: number;
  amortizationProfileName: string;
  isPublished: boolean;
  scheduleIndex: number;
  isIncome: boolean;
  jeStatus: string;
  endDate: string;
  sortOrder: number;
}
