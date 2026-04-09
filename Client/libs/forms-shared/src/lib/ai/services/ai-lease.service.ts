import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { IAIOutput } from '../models/ai-output.model';
import { AiLeaseListItem } from '../models/ai-form.model';

export interface AiAbstractionDetail {
  abstractionId: number;
  buildingId: number;
  status: 'Pending' | 'Processing' | 'Complete' | 'Error' | 'Cancelled';
  errorMessage?: string;
  inputJson: string;
  aiOutputJson?: string;
  createdDate: string;
  completedDate?: string;
}

export interface CreateAiAbstractionResponse {
  abstractionId: number;
}

const MOCK_LEASE_LIST: AiLeaseListItem[] = [
  {
    id: 1,
    tenant: 'Salesforce',
    landlord: 'Brookfield Properties',
    address: '50 Market St, San Francisco, CA 94105',
    leaseType: 'Direct',
    startDate: '2022-01-01',
    endDate: '2032-12-31',
    squareFootage: 125000,
    effectiveRent: 72.5,
    abstractionDate: '2024-03-15',
  },
  {
    id: 2,
    tenant: 'Google LLC',
    landlord: 'SL Green Realty',
    address: '787 7th Ave, New York, NY 10019',
    leaseType: 'Direct',
    startDate: '2021-07-01',
    endDate: '2036-06-30',
    squareFootage: 300000,
    effectiveRent: 105.0,
    abstractionDate: '2024-04-01',
  },
  {
    id: 3,
    tenant: 'Microsoft Corp',
    landlord: 'Kilroy Realty',
    address: '33 3rd St, San Francisco, CA 94103',
    leaseType: 'Sublease',
    startDate: '2023-04-01',
    endDate: '2030-03-31',
    squareFootage: 75000,
    effectiveRent: 68.25,
    abstractionDate: '2024-02-10',
  },
  {
    id: 4,
    tenant: 'Amazon Web Services',
    landlord: 'Beacon Capital Partners',
    address: '100 Summer St, Boston, MA 02110',
    leaseType: 'Direct',
    startDate: '2020-10-01',
    endDate: '2035-09-30',
    squareFootage: 200000,
    effectiveRent: 65.0,
    abstractionDate: '2024-01-22',
  },
  {
    id: 5,
    tenant: 'Meta Platforms',
    landlord: 'Alexandria Real Estate',
    address: '1 Hacker Way, Menlo Park, CA 94025',
    leaseType: 'Direct',
    startDate: '2023-09-01',
    endDate: '2038-08-31',
    squareFootage: 425000,
    effectiveRent: 85.75,
    abstractionDate: '2024-05-01',
  },
];

const MOCK_AI_OUTPUTS: { [id: number]: IAIOutput } = {
  1: {
    basics: {
      tenant: { value: 'Salesforce' },
      landlord: { value: 'Brookfield Properties' },
      addresses: { value: [{ StreetAddress: '50 Market St', CityStateZip: 'San Francisco, CA 94105' }] },
      squareFootage: { value: 125000 },
      leaseType: { value: 'Direct' },
      dealType: { value: 'New' },
      spaceUse: { value: 'Office' },
      suite: { value: '2400' },
      floors: { value: ['24', '25', '26'] },
      entireBuilding: { value: false },
      includesAmendments: { value: true },
      isMultipleBuildings: { value: false },
      isDataCenterLease: { value: false },
      isCRE: { value: true },
      monetaryUnitId: { value: 1 },
      abstractionDate: { value: '2024-03-15' },
    },
    dates: {
      leaseSignDate: { value: '2021-11-15' },
      leaseStartDate: { value: '2022-01-01' },
      leaseCommencementDate: { value: '2022-01-01' },
      leaseEndDate: { value: '2032-12-31' },
      rentCommencementDate: { value: '2022-07-01' },
      leaseTermInMonths: { value: 132, subfields: { beginsOnCD: false, beginsOnRCD: true } },
    },
    rent: {
      effectiveRent: { value: 72.5 },
      annualEscalation: { value: { percent: 3.0, amount: null, onlyDuringExtension: false } },
      tenantImprovementAllowance: {
        value: 15625000,
        subfields: {
          allowances: [
            {
              amount: 125,
              unit: 'per sqft',
              improvementSqFt: 125000,
              totalAmount: 15625000,
              improvementType: 'Tenant Improvement',
              landlordContribution: 15625000,
              tenantContribution: 0,
              tenantReimburses: false,
            },
          ],
        },
        citation: 'Tenant shall receive a tenant improvement allowance of $125 per rentable square foot of the Premises.',
      },
      baseRentSchedule: {
        value: [
          { startMonth: 1, endMonth: 12, startDate: '2022-07-01', endDate: '2023-06-30', monthlyBaseRent: 752083 },
          { startMonth: 13, endMonth: 24, startDate: '2023-07-01', endDate: '2024-06-30', monthlyBaseRent: 774645 },
          { startMonth: 25, endMonth: 36, startDate: '2024-07-01', endDate: '2025-06-30', monthlyBaseRent: 797884 },
          { startMonth: 37, endMonth: 48, startDate: '2025-07-01', endDate: '2026-06-30', monthlyBaseRent: 821820 },
          { startMonth: 49, endMonth: 132, startDate: '2026-07-01', endDate: '2032-12-31', monthlyBaseRent: 846475 },
        ],
        subfields: { startsFromCD: false, startsFromRCD: true, includesAdditionalRent: false, includesOperatingExpenses: false },
      },
      rentAbatements: {
        value: [
          {
            startMonth: 1,
            endMonth: 6,
            startDate: '2022-07-01',
            endDate: '2022-12-31',
            discountAmount: 752083,
            discountPercent: 100,
            betweenCDandRCD: false,
          },
        ],
      },
    },
    expenses: {
      serviceTypeId: { value: 2 },
      serviceTypeEstimate: { value: 'Modified Gross' },
      operatingExpenses: {
        value: 'tenant',
        subfields: { baseTenantResponsible: true, baseLandlordResponsible: false, includedInOpEx: false },
        citation: 'Tenant is responsible for its pro-rata share of operating expenses above the base year.',
      },
      cam: {
        value: 'tenant',
        subfields: { baseTenantResponsible: true, includedInOpEx: true },
        citation: 'CAM charges are included within the modified gross rent.',
      },
      insurance: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      taxes: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      water: { value: 'landlord', subfields: { baseLandlordResponsible: true } },
      gas: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      electricity: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      hvac: {
        value: 'tenant',
        subfields: { baseTenantResponsible: true },
        citation: 'Tenant shall maintain and operate all HVAC systems serving the Premises.',
      },
      cleaning: {
        value: 'tenant',
        subfields: { tenantResponsibleForPremises: true, landlordResponsibleForCommonAreas: true },
      },
    },
  },
  2: {
    basics: {
      tenant: { value: 'Google LLC' },
      landlord: { value: 'SL Green Realty' },
      addresses: { value: [{ StreetAddress: '787 7th Ave', CityStateZip: 'New York, NY 10019' }] },
      squareFootage: { value: 300000 },
      leaseType: { value: 'Direct' },
      dealType: { value: 'Renewal' },
      spaceUse: { value: 'Office' },
      suite: { value: 'Floors 1-9' },
      floors: { value: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
      entireBuilding: { value: false },
      includesAmendments: { value: false },
      isMultipleBuildings: { value: false },
      isDataCenterLease: { value: false },
      isCRE: { value: true },
      monetaryUnitId: { value: 1 },
      abstractionDate: { value: '2024-04-01' },
    },
    dates: {
      leaseSignDate: { value: '2021-04-15' },
      leaseStartDate: { value: '2021-07-01' },
      leaseCommencementDate: { value: '2021-07-01' },
      leaseEndDate: { value: '2036-06-30' },
      rentCommencementDate: { value: '2022-01-01' },
      leaseTermInMonths: { value: 180, subfields: { beginsOnCD: true, beginsOnRCD: false } },
    },
    rent: {
      effectiveRent: { value: 105.0 },
      annualEscalation: { value: { percent: 2.5, amount: null, onlyDuringExtension: false } },
      tenantImprovementAllowance: {
        value: 24000000,
        subfields: {
          allowances: [{ amount: 80, unit: 'per sqft', improvementSqFt: 300000, totalAmount: 24000000, improvementType: 'Tenant Improvement', landlordContribution: 24000000, tenantContribution: 0, tenantReimburses: false }],
        },
        citation: 'Landlord shall provide a TI allowance of $80.00 per rentable square foot.',
      },
      baseRentSchedule: {
        value: [
          { startMonth: 1, endMonth: 60, startDate: '2022-01-01', endDate: '2026-12-31', monthlyBaseRent: 2625000 },
          { startMonth: 61, endMonth: 120, startDate: '2027-01-01', endDate: '2031-12-31', monthlyBaseRent: 2970833 },
          { startMonth: 121, endMonth: 180, startDate: '2032-01-01', endDate: '2036-06-30', monthlyBaseRent: 3356250 },
        ],
        subfields: { startsFromCD: false, startsFromRCD: true, includesAdditionalRent: false, includesOperatingExpenses: false },
      },
      rentAbatements: { value: [] },
    },
    expenses: {
      serviceTypeId: { value: 1 },
      serviceTypeEstimate: { value: 'Full Service Gross' },
      operatingExpenses: { value: 'landlord', subfields: { baseLandlordResponsible: true } },
      cam: { value: 'landlord', subfields: { baseLandlordResponsible: true } },
      insurance: { value: 'landlord', subfields: { baseLandlordResponsible: true } },
      taxes: { value: 'landlord', subfields: { baseLandlordResponsible: true } },
      water: { value: 'landlord', subfields: { baseLandlordResponsible: true } },
      gas: { value: 'landlord', subfields: { baseLandlordResponsible: true } },
      electricity: { value: 'landlord', subfields: { baseLandlordResponsible: true } },
      hvac: { value: 'landlord', subfields: { baseLandlordResponsible: true } },
      cleaning: { value: 'landlord', subfields: { landlordResponsibleForPremises: true, landlordResponsibleForCommonAreas: true } },
    },
  },
  3: {
    basics: {
      tenant: { value: 'Microsoft Corp' },
      landlord: { value: 'Kilroy Realty' },
      addresses: { value: [{ StreetAddress: '33 3rd St', CityStateZip: 'San Francisco, CA 94103' }] },
      squareFootage: { value: 75000 },
      leaseType: { value: 'Sublease' },
      dealType: { value: 'New' },
      spaceUse: { value: 'Office' },
      suite: { value: '500' },
      floors: { value: ['5'] },
      entireBuilding: { value: false },
      includesAmendments: { value: false },
      isMultipleBuildings: { value: false },
      isDataCenterLease: { value: false },
      isCRE: { value: true },
      monetaryUnitId: { value: 1 },
      abstractionDate: { value: '2024-02-10' },
    },
    dates: {
      leaseSignDate: { value: '2023-02-28' },
      leaseStartDate: { value: '2023-04-01' },
      leaseCommencementDate: { value: '2023-04-01' },
      leaseEndDate: { value: '2030-03-31' },
      rentCommencementDate: { value: '2023-07-01' },
      leaseTermInMonths: { value: 84, subfields: { beginsOnCD: true, beginsOnRCD: false } },
    },
    rent: {
      effectiveRent: { value: 68.25 },
      annualEscalation: { value: { percent: 3.0, amount: null, onlyDuringExtension: false } },
      tenantImprovementAllowance: {
        value: 3750000,
        subfields: {
          allowances: [{ amount: 50, unit: 'per sqft', improvementSqFt: 75000, totalAmount: 3750000, improvementType: 'Tenant Improvement', landlordContribution: 3750000, tenantContribution: 0, tenantReimburses: false }],
        },
        citation: 'Sublandlord to provide $50/SF TI allowance for Premises improvements.',
      },
      baseRentSchedule: {
        value: [
          { startMonth: 1, endMonth: 36, startDate: '2023-07-01', endDate: '2026-06-30', monthlyBaseRent: 427500 },
          { startMonth: 37, endMonth: 84, startDate: '2026-07-01', endDate: '2030-03-31', monthlyBaseRent: 494775 },
        ],
        subfields: { startsFromCD: false, startsFromRCD: true, includesAdditionalRent: false, includesOperatingExpenses: false },
      },
      rentAbatements: {
        value: [{ startMonth: 1, endMonth: 3, startDate: '2023-07-01', endDate: '2023-09-30', discountAmount: 427500, discountPercent: 100, betweenCDandRCD: false }],
      },
    },
    expenses: {
      serviceTypeId: { value: 3 },
      serviceTypeEstimate: { value: 'NNN' },
      operatingExpenses: { value: 'tenant', subfields: { baseTenantResponsible: true }, citation: 'Tenant responsible for all operating expenses on a triple-net basis.' },
      cam: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      insurance: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      taxes: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      water: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      gas: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      electricity: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      hvac: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      cleaning: { value: 'tenant', subfields: { tenantResponsibleForPremises: true } },
    },
  },
  4: {
    basics: {
      tenant: { value: 'Amazon Web Services' },
      landlord: { value: 'Beacon Capital Partners' },
      addresses: { value: [{ StreetAddress: '100 Summer St', CityStateZip: 'Boston, MA 02110' }] },
      squareFootage: { value: 200000 },
      leaseType: { value: 'Direct' },
      dealType: { value: 'Expansion' },
      spaceUse: { value: 'Office' },
      suite: { value: 'Floors 10-14' },
      floors: { value: ['10', '11', '12', '13', '14'] },
      entireBuilding: { value: false },
      includesAmendments: { value: true },
      isMultipleBuildings: { value: false },
      isDataCenterLease: { value: false },
      isCRE: { value: true },
      monetaryUnitId: { value: 1 },
      abstractionDate: { value: '2024-01-22' },
    },
    dates: {
      leaseSignDate: { value: '2020-07-10' },
      leaseStartDate: { value: '2020-10-01' },
      leaseCommencementDate: { value: '2020-10-01' },
      leaseEndDate: { value: '2035-09-30' },
      rentCommencementDate: { value: '2021-04-01' },
      leaseTermInMonths: { value: 180, subfields: { beginsOnCD: true, beginsOnRCD: false } },
    },
    rent: {
      effectiveRent: { value: 65.0 },
      annualEscalation: { value: { percent: 2.75, amount: null, onlyDuringExtension: false } },
      tenantImprovementAllowance: {
        value: 14000000,
        subfields: {
          allowances: [{ amount: 70, unit: 'per sqft', improvementSqFt: 200000, totalAmount: 14000000, improvementType: 'Tenant Improvement', landlordContribution: 14000000, tenantContribution: 0, tenantReimburses: false }],
        },
        citation: 'Landlord shall provide Tenant with a TI allowance equal to $70.00 per rentable square foot.',
      },
      baseRentSchedule: {
        value: [
          { startMonth: 1, endMonth: 60, startDate: '2021-04-01', endDate: '2026-03-31', monthlyBaseRent: 1083333 },
          { startMonth: 61, endMonth: 120, startDate: '2026-04-01', endDate: '2031-03-31', monthlyBaseRent: 1237500 },
          { startMonth: 121, endMonth: 180, startDate: '2031-04-01', endDate: '2035-09-30', monthlyBaseRent: 1412500 },
        ],
        subfields: { startsFromCD: false, startsFromRCD: true, includesAdditionalRent: false, includesOperatingExpenses: false },
      },
      rentAbatements: { value: [] },
    },
    expenses: {
      serviceTypeId: { value: 2 },
      serviceTypeEstimate: { value: 'Modified Gross' },
      operatingExpenses: { value: 'tenant', subfields: { baseTenantResponsible: true, includedInOpEx: false }, citation: 'Tenant pays pro-rata share of operating expenses above the base year (2021).' },
      cam: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      insurance: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      taxes: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      water: { value: 'landlord', subfields: { baseLandlordResponsible: true } },
      gas: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      electricity: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      hvac: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      cleaning: { value: 'tenant', subfields: { tenantResponsibleForPremises: true, landlordResponsibleForCommonAreas: true } },
    },
  },
  5: {
    basics: {
      tenant: { value: 'Meta Platforms' },
      landlord: { value: 'Alexandria Real Estate' },
      addresses: { value: [{ StreetAddress: '1 Hacker Way', CityStateZip: 'Menlo Park, CA 94025' }] },
      squareFootage: { value: 425000 },
      leaseType: { value: 'Direct' },
      dealType: { value: 'New' },
      spaceUse: { value: 'Office / R&D' },
      suite: { value: 'Building A' },
      floors: { value: ['1', '2', '3', '4'] },
      entireBuilding: { value: true },
      includesAmendments: { value: false },
      isMultipleBuildings: { value: false },
      isDataCenterLease: { value: false },
      isCRE: { value: true },
      monetaryUnitId: { value: 1 },
      abstractionDate: { value: '2024-05-01' },
    },
    dates: {
      leaseSignDate: { value: '2023-06-01' },
      leaseStartDate: { value: '2023-09-01' },
      leaseCommencementDate: { value: '2023-09-01' },
      leaseEndDate: { value: '2038-08-31' },
      rentCommencementDate: { value: '2024-03-01' },
      leaseTermInMonths: { value: 180, subfields: { beginsOnCD: true, beginsOnRCD: false } },
    },
    rent: {
      effectiveRent: { value: 85.75 },
      annualEscalation: { value: { percent: 3.5, amount: null, onlyDuringExtension: false } },
      tenantImprovementAllowance: {
        value: 63750000,
        subfields: {
          allowances: [{ amount: 150, unit: 'per sqft', improvementSqFt: 425000, totalAmount: 63750000, improvementType: 'Tenant Improvement', landlordContribution: 63750000, tenantContribution: 0, tenantReimburses: false }],
        },
        citation: 'Landlord shall provide a tenant improvement allowance of $150.00 per rentable square foot of the Premises.',
      },
      baseRentSchedule: {
        value: [
          { startMonth: 1, endMonth: 24, startDate: '2024-03-01', endDate: '2026-02-28', monthlyBaseRent: 3031250 },
          { startMonth: 25, endMonth: 60, startDate: '2026-03-01', endDate: '2029-02-28', monthlyBaseRent: 3237344 },
          { startMonth: 61, endMonth: 120, startDate: '2029-03-01', endDate: '2034-02-28', monthlyBaseRent: 3458369 },
          { startMonth: 121, endMonth: 180, startDate: '2034-03-01', endDate: '2038-08-31', monthlyBaseRent: 3694456 },
        ],
        subfields: { startsFromCD: false, startsFromRCD: true, includesAdditionalRent: false, includesOperatingExpenses: false },
      },
      rentAbatements: {
        value: [
          { startMonth: 1, endMonth: 6, startDate: '2024-03-01', endDate: '2024-08-31', discountAmount: 3031250, discountPercent: 100, betweenCDandRCD: false },
        ],
      },
    },
    expenses: {
      serviceTypeId: { value: 3 },
      serviceTypeEstimate: { value: 'NNN' },
      operatingExpenses: { value: 'tenant', subfields: { baseTenantResponsible: true }, citation: 'As sole tenant of entire building, Tenant is responsible for all operating costs.' },
      cam: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      insurance: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      taxes: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      water: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      gas: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      electricity: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      hvac: { value: 'tenant', subfields: { baseTenantResponsible: true } },
      cleaning: { value: 'tenant', subfields: { tenantResponsibleForPremises: true, tenantResponsibleForCommonAreas: true } },
    },
  },
};

@Injectable({ providedIn: 'root' })
export class AiLeaseService {
  private readonly API_BASE = '/ai-abstractions';

  constructor(private readonly http: HttpClient) {}

  // ── Real API methods ──────────────────────────────────────────────────────

  /**
   * Submit a new AI abstraction request (modal form + files).
   */
  createAbstraction(formData: FormData): Observable<CreateAiAbstractionResponse> {
    return this.http.post<CreateAiAbstractionResponse>(this.API_BASE, formData);
  }

  /**
   * Get full abstraction detail by ID.
   * Returns the parsed IAIOutput when status = 'Complete', null otherwise.
   */
  getAbstractionById(id: number): Observable<AiAbstractionDetail | null> {
    return this.http.get<AiAbstractionDetail>(`${this.API_BASE}/${id}`);
  }

  /**
   * List AI abstractions for a building.
   */
  getAbstractionList(buildingId: number): Observable<AiAbstractionDetail[]> {
    return this.http.get<AiAbstractionDetail[]>(`${this.API_BASE}?buildingId=${buildingId}`);
  }

  // ── Convenience wrapper for the form page ─────────────────────────────────

  /**
   * Returns the IAIOutput from a completed abstraction.
   * Falls back to mock data for IDs 1–5 so development works without a DB.
   */
  getLeaseById(id: number): Observable<IAIOutput | null> {
    // Keep mock data for dev IDs 1–5
    if (MOCK_AI_OUTPUTS[id] !== undefined) {
      return of(MOCK_AI_OUTPUTS[id]).pipe(delay(400));
    }

    return this.getAbstractionById(id).pipe(
      map((detail) => {
        if (!detail || detail.status !== 'Complete' || !detail.aiOutputJson) {
          return null;
        }
        try {
          return JSON.parse(detail.aiOutputJson) as IAIOutput;
        } catch {
          return null;
        }
      })
    );
  }

  // ── Mock list (used until the list page is wired to a real building ID) ───

  getLeaseList(): Observable<AiLeaseListItem[]> {
    return of(MOCK_LEASE_LIST).pipe(delay(400));
  }
}
