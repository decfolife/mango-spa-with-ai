import { BaseRentScheduleItem, RentAbatement } from './ai-output.model';

export type AiFieldType = 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'percent' | 'dropdown';

export interface AiDropdownItem {
  id: string | number;
  name: string;
}

export interface AiFormField {
  key: string;
  label: string;
  type: AiFieldType;
  value: any;
  citation?: string;
  // ── Dropdown config (type === 'dropdown') ────────────────────────────────
  /** Backend renderSelect requestTypeId. When set, options are loaded via FormWizardService.getRenderSelect. */
  requestTypeId?: number;
  /** Static option list. Used when requestTypeId is not set. */
  dropdownItems?: AiDropdownItem[];
  /** Property name to display in the dropdown (default: 'name') */
  displayExpr?: string;
  /** Property name to store as the form value (default: 'id') */
  valueExpr?: string;
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
  fields: AiFormField[];
  rentSchedule?: AiRentScheduleSection;
}

export interface AiLeaseListItem {
  id: number;         // abstractionId
  buildingId: number;
  portfolioId?: number;
  premiseId?: number;
  status: string;
  aiTenant?: string;
  aiLeaseEndDate?: string;
  createdDate: string;
  lastModifiedDate: string;
}
