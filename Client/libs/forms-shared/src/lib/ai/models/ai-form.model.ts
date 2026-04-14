import { BaseRentScheduleItem, RentAbatement } from './ai-output.model';

export type AiFieldType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'boolean'
  | 'percent'
  | 'dropdown'
  | 'textarea'
  | 'email'
  | 'image'
  | 'radio'
  | 'multiselect'
  | 'hidden'
  | 'textonly'
  | 'password';

export interface AiDropdownItem {
  id: string | number;
  name: string;
}

export interface AiRadioOption {
  value: string;
  display: string;
}

export interface AiFormField {
  key: string;
  label: string;
  type: AiFieldType;
  value: any;
  citation?: string;
  // ── Dropdown config (type === 'dropdown') ────────────────────────────────
  /** Form-defined dropdown source id. Used with RenderForms/GetFormItemDropdownValues. */
  dropdownId?: number;
  /** Backend renderSelect requestTypeId. When set, options are loaded via FormWizardService.getRenderSelect. */
  requestTypeId?: number;
  /** Static option list. Used when requestTypeId is not set. */
  dropdownItems?: AiDropdownItem[];
  /** Property name to display in the dropdown (default: 'name') */
  displayExpr?: string;
  /** Property name to store as the form value (default: 'id') */
  valueExpr?: string;
  column?: number;
  sortOrder?: number;
  sourceIndex?: number;
  formItemTypeID?: number;
  formItemTypeName?: string;
  dataTypeID?: number;
  formItemParameters?: string | null;
  formItemViewOnly?: boolean;
  formItemFieldWidth?: number;
  formItemFieldHeight?: number;
  radioOptions?: AiRadioOption[];
  displayValue?: string;
}

export interface AiFormSectionColumn {
  columnNum: number;
  fields: AiFormField[];
}

export interface AiRentScheduleSection {
  scheduleItems: BaseRentScheduleItem[];
  abatementItems: RentAbatement[];
  startsFromRCD: boolean;
  startsFromCD: boolean;
}

export interface AiFormSection {
  key: string;
  title: string;
  columns?: number;
  fields: AiFormField[];
  columnGroups?: AiFormSectionColumn[];
  rentSchedule?: AiRentScheduleSection;
}

export interface AiLeaseListItem {
  id: number; // abstractionId
  buildingId: number;
  buildingName?: string;
  formId?: number;
  formName?: string;
  portfolioId?: number;
  portfolioName?: string;
  premiseId?: number;
  status: string;
  aiTenant?: string;
  aiLeaseEndDate?: string;
  createdDate: string;
  lastModifiedDate: string;
}
