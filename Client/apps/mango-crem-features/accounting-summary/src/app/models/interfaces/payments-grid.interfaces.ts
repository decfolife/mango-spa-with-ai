export interface AddEditOtherChargeResult {
  chargeSaved: boolean;
  showSaveMsg: boolean;
  chargeDeleted: boolean;
  showDeleteMsg: boolean;
  glEventIDs: number[];
}

export interface ProrationType {
  id: number;
  isActive: boolean;
  name: string;
  sortOrder: number;
}

export interface FrequencyType {
  id: number;
  isActive: boolean;
  name: string;
  sortOrder: number;
}

export interface CustomPeriodFrequencyType {
  frequencyTypeId: number;
  frequencyType: string;
  isCustomPeriod: boolean;
}

export interface DeleteOtherCharges {
  clientErrorMessage: string;
  data: boolean;
  statusCode: {
    data: boolean;
    message: string;
    succeeded: boolean;
  };
  success: boolean;
}

export interface SaveOtherCharges {
  clientErrorMessage: string;
  data: number;
  statusCode: {
    data: number;
    message: string;
    succeeded: boolean;
  };
  success: boolean;
}
