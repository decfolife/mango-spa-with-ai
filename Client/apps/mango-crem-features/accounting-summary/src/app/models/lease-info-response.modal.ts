export interface LeaseInfoResponse {
  leaseAbstractID: number;
  leaseRecognitionID: number;
  objectName: string;
  displayString: string;
  objectTypeID: number;
  objectTypeName: string;
  objectTypeTypeID: number;
  masterGroupID: number;
  isActive: boolean;
  lockedReason: string;
  isStraightLineManual: boolean;
  beginDate: string;
  endDate: string;
  rentableSF: number;
  exchangeRateID: number;
  defaultVendorID: number;
  defaultCustomerID: number;
  measureUnitsID: number;
  accountingType: string;
  workflowStatusStep: number;
  workflowStatusID: number;
  workflowStatus: string;
  workflowStatusLastModified: string;
  workflowStatusLastModifiedBy: string;
  salesTaxConsolidate: boolean;
  salesTaxShowIncome: boolean;
  salesTaxComments: string;
  originalLeaseCommencementDate: string;
  originalLeaseExpirationDate: string;
  residualStartingValue: number;
  guaranteedResidualValue: number;
  estimatedActualResidualValue: number;
  residualComments: string;
}

export interface LeaseDetails {
  leaseAbstractID: number;
  leaseName: string;
  isLocked: boolean;
  isArchived: boolean;
  lockedReason: string;
  accountingType: string;
  exchangeRateID: number;
  leaseRecognitionID: number;
}
