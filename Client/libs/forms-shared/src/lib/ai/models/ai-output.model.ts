export interface Address {
  StreetAddress?: string;
  CityStateZip?: string;
}

export interface Basics {
  tenant?: { value?: string };
  landlord?: { value?: string };
  propertyId?: { value?: number };
  addresses?: { value?: Address[] };
  isMultipleBuildings?: { value?: boolean };
  squareFootage?: {
    value?: number;
    subfields?: { spaceChangesOverTime?: boolean };
  };
  entireBuilding?: { value?: boolean };
  suite?: { value?: string };
  floors?: { value?: any[] };
  includesAmendments?: { value?: boolean };
  leaseType?: { value?: string };
  dealType?: { value?: string };
  spaceUse?: { value?: string };
  isDataCenterLease?: { value?: boolean };
  isCRE?: { value?: boolean };
  abstractionDate?: { value?: string };
  monetaryUnitId?: { value?: number };
}

export interface Dates {
  leaseSignDate?: { value?: string };
  leaseStartDate?: { value?: string };
  leaseCommencementDate?: { value?: string };
  leaseEndDate?: { value?: string };
  rentCommencementDate?: { value?: string };
  leaseTermInMonths?: {
    value?: number;
    subfields?: { beginsOnCD?: boolean; beginsOnRCD?: boolean };
  };
}

export interface CPI {
  present?: boolean;
  min?: number | null;
  max?: number | null;
}

export interface AnnualEscalation {
  percent?: number;
  amount?: number | null;
  cpi?: CPI;
  onlyDuringExtension?: boolean;
}

export interface Allowance {
  amount?: number;
  tenantContribution?: number;
  landlordContribution?: number;
  tenantReimburses?: boolean;
  tenantReimbursesOnlyInEarlyTermination?: boolean;
  improvementType?: string;
  totalAmount?: number;
  unit?: string;
  improvementSqFt?: number;
  comment?: string;
}

export interface TenantImprovementAllowance {
  value?: number;
  subfields?: { allowances?: Allowance[] };
  citation?: string;
}

export interface BaseRentScheduleItem {
  startMonth?: number;
  endMonth?: number;
  startDate?: string | null;
  endDate?: string | null;
  monthlyBaseRent?: number;
}

export interface BaseRentSchedule {
  value?: BaseRentScheduleItem[];
  subfields?: {
    startsFromCD?: boolean;
    startsFromRCD?: boolean;
    includesAdditionalRent?: boolean;
    includesOperatingExpenses?: boolean;
  };
}

export interface RentAbatement {
  startMonth?: number;
  endMonth?: number;
  startDate?: string | null;
  endDate?: string | null;
  discountAmount?: number;
  discountPercent?: number;
  betweenCDandRCD?: boolean;
}

export interface Metering {
  tenantPaysIfSeparatelyMetered?: boolean;
  documentIncludesMeteringStatus?: boolean;
  utilityIsSeparatelyMetered?: boolean;
  citation?: string;
}

export interface ExpenseSubfields {
  baseTenantResponsible?: boolean;
  baseLandlordResponsible?: boolean;
  tenantResponsibleOnlyIfInExcessOfBaseYearOrOvertime?: boolean;
  tenantShare?: number;
  includedInOpEx?: boolean;
  metering?: Metering;
}

export interface ExpenseItem {
  value?: string | boolean | number;
  subfields?: ExpenseSubfields;
  citation?: string;
}

export interface CleaningSubfields {
  tenantResponsibleForCommonAreas?: boolean;
  landlordResponsibleForCommonAreas?: boolean;
  tenantResponsibleForPremises?: boolean | null;
  landlordResponsibleForPremises?: boolean | null;
  tenantResponsibleOnlyIfInExcessOfBaseYearOrOvertime?: boolean | null;
  includedInOpEx?: boolean | null;
  explicitlyMentioned?: boolean | null;
}

export interface Cleaning {
  value?: string;
  subfields?: CleaningSubfields;
  citation?: string;
}

export interface Expenses {
  serviceTypeId?: { value?: number };
  serviceTypeEstimate?: { value?: string };
  baseYearStructure?: { value?: boolean; subfields?: { year?: number | null } };
  operatingExpenses?: ExpenseItem;
  cam?: ExpenseItem;
  insurance?: ExpenseItem;
  taxes?: ExpenseItem;
  water?: ExpenseItem;
  gas?: ExpenseItem;
  electricity?: ExpenseItem;
  hvac?: ExpenseItem;
  cleaning?: Cleaning;
  comments?: string[];
}

export interface Rent {
  effectiveRent?: { value?: number };
  annualEscalation?: { value?: AnnualEscalation };
  tenantImprovementAllowance?: TenantImprovementAllowance;
  baseRentSchedule?: BaseRentSchedule;
  rentAbatements?: { value?: RentAbatement[] };
  comments?: string[];
}

export interface IAIOutput {
  basics?: Basics;
  dates?: Dates;
  rent?: Rent;
  expenses?: Expenses;
}
