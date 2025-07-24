export interface BehaviorType {
  id: number;
  behavior: string;
  type: string;
  sortOder: number;
  isActive: boolean;
}

export interface BehaviorLookup {
  id: number;
  requestTypeID: number;
  name: string;
  parameterName: string;
  parameterDataType: string;
  isActive: boolean;
}

export interface Behaviors {
  id: number;
  formSectionID: number;
  formID: number;
  behaviorTypeID: number;
  behaviorTypeName: string;
  behaviorLookupID: number;
  requestTypeID: number;
  requestTypeName: string;
  formItemInput1ID: number;
  formItemInput1Label: string;
  formItemInput2ID: number;
  formItemInput2Label: string;
  formItemOutputID: number;
  formItemOutputLabel: string;
}

export interface FormItemsLookup {
  dataTypeID: number;
  displayName: string;
  formItemID: number;
  formItemTypeID: number;
}
