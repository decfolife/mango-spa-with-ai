import { z } from 'zod';

const CurrencyPrecisionSchema = z.object({
  data: z.object({
    DecimalPrecision: z.number(),
  }),
});
export type CurrencyPrecisionSchema = z.infer<typeof CurrencyPrecisionSchema>;

/**
 * Segment List
 */
const SegmentListSchema = z.object({
  data: z.array(
    z.object({
      segmentID: z.number(),
      name: z.string(),
      criteriaSetID: z.number(),
      criteriaSetName: z.string(),
      createdBy: z.string(),
      created: z.string().datetime(),
      portfolioID: z.number(),
      lastModifiedBy: z.string(),
      lastModified: z.string().datetime(),
      active: z.boolean(),
      shared: z.string(),
      rights: z.string(),
      securityTypeID: z.number(),
      default: z.number(),
      activeRecordsVisibleToMe: z.boolean(),
    })
  ),
});
export type SegmentListSchema = z.infer<typeof SegmentListSchema>;

/**
 * IADCardSchema
 */
const IADCardSchema = z.object({
  data: z.array(
    z.object({
      Id: z.number(),
      DashboardId: z.number(),
      Title: z.string(),
      SubTitle: z.string(),
      DashboardCardTypeId: z.number(),
      ShowFilterDropdown: z.boolean(),
      CardOrder: z.number(),
      IsActive: z.boolean(),
      CreatedBy: z.string().optional(),
      LastModifiedBy: z.string().optional(),
      CreatedDate: z.string().optional(),
      LastModifiedDate: z.string(),
      ElementTypeId: z.number(),
      CardJSONSchema: z.string(),
      isDisabledInUI: z.boolean().optional(),
      ExportData: z.string(),
    })
  ),
});
export type IADCardSchema = z.infer<typeof IADCardSchema>;

/**
 * IADCardData: Dashboard IFRS Annual
 */
// Lease Counts
const IFRSAnnualLeaseCounts = z.object({
  PeriodYear: z.number(),
  DisclosureClassification: z.string().nullable(),
  LeaseTemplate: z.string(),
  OpeningCount: z.number(),
  AddedCount: z.number(),
  EndedCount: z.number(),
  ClosingCount: z.number(),
});
const IFRSAnnualLeaseCountsArraySchema = z
  .array(IFRSAnnualLeaseCounts)
  .optional();

// Asset Balance
const IFRSAnnualAssetBalance = z.object({
  PeriodYear: z.number().optional(),
  PeriodYearMonth: z.number(),
  PeriodQuarter: z.string(),
  PeriodYearQuarter: z.number(),
  DisplayPeriod: z.string(),
  ClassificationName: z.string(),
  LeaseTemplate: z.string(),
  AssetBalanceClosingReporting: z.number(),
  ShortTermLiabilityClosingReporting: z.number(),
  LongTermLiabilityClosingReporting: z.number(),
  LiabilityBalanceClosingReporting: z.number(),
  AssetBalanceOpeningReporting: z.number().optional(),
  AssetBalanceAddedReporting: z.number().optional().nullable(),
  AssetBalanceAmortizationReporting: z.number().optional(),
  AssetBalanceAdjustmentReporting: z.number().optional().nullable(),
});
const IFRSAnnualAssetBalanceArraySchema = z
  .array(IFRSAnnualAssetBalance)
  .optional();

// Lease Costs
const IFRSAnnualLeaseCost = z.object({
  PeriodYear: z.number().optional(),
  PeriodYearMonth: z.number(),
  PeriodQuarter: z.string(),
  PeriodYearQuarter: z.number(),
  DisplayPeriod: z.string(),
  LeaseTemplate: z.string(),
  LeaseLiabilityInterestReporting: z.number(),
  DepreciationOfROUAssets: z.number(),
  FinanceLeaseCostReporting: z.number(),
  ShortTermLeaseCostReporting: z.number(),
  LowValueLeaseCostReporting: z.number(),
  OtherExceptionCostReporting: z.number(),
});
const IFRSAnnualLeaseCostSPOneArraySchema = z
  .array(IFRSAnnualLeaseCost)
  .optional();

// Exceptions Cost
const IFRSAnnualReportingLeaseCostSPTwo = z.object({
  VariableLeaseCostReporting: z.number(),
  VariableLeaseCostOfIndexedPaymentsReporting: z.number(),
  SubleaseIncome: z.number(),
  DueByYear: z.number(),
  PeriodQuarter: z.string(),
  PeriodYear: z.number(),
  PeriodYearMonth: z.number(),
  LeaseTemplate: z.string(),
});
const IFRSAnnualLeaseCostSPTwoArraySchema = z
  .array(IFRSAnnualReportingLeaseCostSPTwo)
  .optional();

// Other Information
const IFRSAnnualOtherInformation = z.object({
  PeriodYear: z.number().optional(),
  LeaseTemplate: z.string(),
  CashFlowsTotalReporting: z.number(),
  CashFlowsInterestReporting: z.number(),
  CashFlowsPrincipalRepaymentReporting: z.number(),
  ROUAssetsObtainedInExchangeForNewFinanceLiabilities: z.number().nullable(),
  WeightedAverageYearsRemainingToAccountingTermFinance: z.number(),
  WeightedAverageYearsRemainingToExpirationFinance: z.number(),
  WeightedAverageIncrementalBorrowingRate: z.number(),
});
const IFRSAnnualOtherInformationArraySchema = z
  .array(IFRSAnnualOtherInformation)
  .optional();

// Liability Maturity
const IFRSAnnualLiabilityMaturity = z.object({
  PeriodYear: z.number(),
  LeaseTemplate: z.string(),
  ScheduledPaymentsReporting: z.number().optional(),
  RemainingPaymentsReporting: z.number().optional(),
});
const IFRSAnnualLiabilityMaturityArraySchema = z
  .array(IFRSAnnualLiabilityMaturity)
  .optional();

// Lease Liabilities
const IFRSAnnualReconciliationOfLeaseLiabilities = z.object({
  LeaseTemplate: z.string(),
  TotalDiscountedLeaseLiability: z.number().optional(),
  TotalUndiscountedLeaseLiability: z.number().optional(),
  WeightedAverageYearsRemainingToAccountingTerm: z.number().optional(),
  WeightedAverageYearsRemainingToExpiration: z.number().optional(),
  WeightedAverageDiscountRate: z.number().optional(),
  ImputedInterest: z.number().optional(),
});
const IFRSAnnualReconciliationOfLeaseLiabilitiesArraySchema = z
  .array(IFRSAnnualReconciliationOfLeaseLiabilities)
  .optional();

// Future Commitments
const IFRSAnnualFutureCommitments = z.object({
  PeriodYear: z.number(),
  LeaseTemplate: z.string(),
  ScheduledPaymentsReporting: z.number().optional(),
  RemainingPaymentsReporting: z.number().optional(),
});
const IFRSAnnualFutureCommitmentsArraySchema = z
  .array(IFRSAnnualFutureCommitments)
  .optional();

// Full Dashboard Cards
const IFRSAnnualDisclosuresDashboard = z.object({
  data: z.tuple([
    IFRSAnnualLeaseCountsArraySchema,
    IFRSAnnualAssetBalanceArraySchema,
    IFRSAnnualLeaseCostSPOneArraySchema,
    IFRSAnnualLeaseCostSPTwoArraySchema, // It merges later with LeaseCost, it can be empty
    z.array(z.unknown()), // Reporting Exceptions Cost is missing
    IFRSAnnualOtherInformationArraySchema,
    IFRSAnnualLiabilityMaturityArraySchema,
    IFRSAnnualReconciliationOfLeaseLiabilitiesArraySchema,
    IFRSAnnualFutureCommitmentsArraySchema,
  ]),
});
export type IFRSAnnualDisclosuresDashboard = z.infer<
  typeof IFRSAnnualDisclosuresDashboard
>;

/**
 * Dashboard Schema Resolver
 * Depending on the Dashboard ID returns the corresponding schema
 */
export const DashboardSchema = (dashboardID: number) => {
  switch (dashboardID) {
    case 6: {
      return z.unknown(); // return IFRSAnnualDisclosuresDashboard;
    }
    case 7: {
      return z.unknown();
    }
    default: {
      return z.unknown();
    }
  }
};
