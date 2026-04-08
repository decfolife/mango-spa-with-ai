import { BaseRentScheduleItem, RentAbatement } from './ai-output.model';

export type AiFieldType = 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'percent';

export interface AiFormField {
  key: string;
  label: string;
  type: AiFieldType;
  value: any;
  citation?: string;
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
  id: number;
  tenant: string;
  landlord: string;
  address: string;
  leaseType: string;
  startDate: string;
  endDate: string;
  squareFootage: number;
  effectiveRent: number;
  abstractionDate: string;
}
