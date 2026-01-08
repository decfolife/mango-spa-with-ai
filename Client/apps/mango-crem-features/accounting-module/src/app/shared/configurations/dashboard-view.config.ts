import { DashboardConfig } from '@mango/data-models/lib-data-models';

export const dashboardASCAnnually: DashboardConfig = {
  dashboardId: 4,
  pendoId: 'ASCAnnualDisclosures',
  localCardConfig: [
    {
      index: 0,
      id: 'ASC-Annual-Lease-Counts',
      name: 'Lease Counts',
      allowToggleCardView: false, // Allows to change between PivotGrid and DataGrid
      defaultCardView: 'pivotGrid', // When allowToggleCardView is true, choose the default Grid type
      chartActive: false,
      chartVisible: false,
      showMenuSave: false,
      showMenuReset: false,
      format: {
        type: 'fixedPoint',
        precision: 0,
      },
      sortingOrder: {
        'Opening Lease Count': 0,
        ' - Leases Added': 1,
        ' - Leases Expired/Cancelled': 2,
        'Closing Lease Count': 3,
      },
      sortedColumnFieldName: {
        LeaseTemplate: {
          Lease: 0,
          'Real Estate Lease': 1,
          'Equipment Lease': 2,
          'Office Equipment Lease': 3,
          Total: 4,
        },
        DisclosureClassification: {
          Finance: 0,
          Operating: 1,
          Mixed: 2,
          Total: 3,
        },
      },
      summaryCellName: 'PeriodYear',
      // summaryCellFormula: '(x / 2) + 1000', // Todo: Combine summaryCellName/Formula/Constants as an object
      // summaryCellConstants: {y: 2},
      // chartActive: true,
      // chartVisible: false,
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodYear',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'DisclosureClassification',
          area: 'column',
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
          expanded: 'true',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          DisclosureClassification: 'DisclosureClassification',
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Opening Lease Count',
          PeriodYear: 'PeriodYear',
          data: 'OpeningCount',
        },
        {
          DisclosureClassification: 'DisclosureClassification',
          LeaseTemplate: 'LeaseTemplate',
          Display: ' - Leases Added',
          PeriodYear: 'PeriodYear',
          data: 'AddedCount',
        },
        {
          DisclosureClassification: 'DisclosureClassification',
          LeaseTemplate: 'LeaseTemplate',
          Display: ' - Leases Expired/Cancelled',
          PeriodYear: 'PeriodYear',
          data: 'EndedCount',
        },
        {
          DisclosureClassification: 'DisclosureClassification',
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Closing Lease Count',
          PeriodYear: 'PeriodYear',
          data: 'ClosingCount',
        },
        // Total
        {
          DisclosureClassification: 'Total',
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Opening Lease Count',
          PeriodYear: 'PeriodYear',
          data: 'OpeningCount',
        },
        {
          DisclosureClassification: 'Total',
          LeaseTemplate: 'LeaseTemplate',
          Display: ' - Leases Added',
          PeriodYear: 'PeriodYear',
          data: 'AddedCount',
        },
        {
          DisclosureClassification: 'Total',
          LeaseTemplate: 'LeaseTemplate',
          Display: ' - Leases Expired/Cancelled',
          PeriodYear: 'PeriodYear',
          data: 'EndedCount',
        },
        {
          DisclosureClassification: 'Total',
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Closing Lease Count',
          PeriodYear: 'PeriodYear',
          data: 'ClosingCount',
        },
      ],
    },
    {
      index: 1,
      id: 'ASC-Annual-Asset-Balance',
      name: 'Assets and Liabilities Balances',
      width: 200,
      summaryCellName: 'PeriodYear',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      sortingOrder: {
        'ROU Asset Balance': 0,
        'Short Term Liability Balance': 1,
        'Long Term Liability Balance': 2,
        'Total Liability Balance': 3,
      },
      // dataGridColumnDefinition: [], // todo: This is not implemented
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodYear',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'DisclosureClassification',
          area: 'column',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      sortedColumnFieldName: 'DisclosureClassification',
      columnSortingOrder: {
        Finance: 1,
        Operating: 2,
        Total: 10,
      },
      fieldTransform: [
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'ROU Asset Balance',
          PeriodYear: 'PeriodYear',
          data: 'AssetBalanceClosingReporting',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Short Term Liability Balance',
          PeriodYear: 'PeriodYear',
          data: 'ShortTermLiabilityClosingReporting',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Long Term Liability Balance',
          PeriodYear: 'PeriodYear',
          data: 'LongTermLiabilityClosingReporting',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Total Liability Balance',
          PeriodYear: 'PeriodYear',
          data: 'LiabilityBalanceClosingReporting',
        },
        {
          DisclosureClassification: 'Total',
          Display: 'ROU Asset Balance',
          PeriodYear: 'PeriodYear',
          data: 'AssetBalanceClosingReporting',
        },
        {
          DisclosureClassification: 'Total',
          Display: 'Short Term Liability Balance',
          PeriodYear: 'PeriodYear',
          data: 'ShortTermLiabilityClosingReporting',
        },
        {
          DisclosureClassification: 'Total',
          Display: 'Long Term Liability Balance',
          PeriodYear: 'PeriodYear',
          data: 'LongTermLiabilityClosingReporting',
        },
        {
          DisclosureClassification: 'Total',
          Display: 'Total Liability Balance',
          PeriodYear: 'PeriodYear',
          data: 'LiabilityBalanceClosingReporting',
        },
      ],
    },
    {
      index: 2,
      id: 'ASC-Annual-lease-cost',
      name: 'Lease Cost',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      width: 200,
      combineWithIndex: 3,
      mergeBy: [
        {
          PeriodYearMonth: 'PeriodYearMonth',
        },
      ],
      sortingOrder: {
        'Finance Lease Cost': 0,
        ' - Amortization of right-of-use Assets': 1,
        ' - Interest on Lease Liabilities': 2,
        'Operating Lease Cost': 3,
        'Short-term Lease & Reporting Exceptions Cost': 4,
        'Variable Lease Cost': 5,
        'Variable Cost of Indexed Payments': 6,
        'Sublease Income': 7,
        'Total Lease Cost': 10,
      },
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodYear',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          Display: 'Finance Lease Cost',
          PeriodYear: 'PeriodYear',
          data: 'FinanceLeaseCostReporting',
        },
        {
          Display: ' - Amortization of right-of-use Assets',
          PeriodYear: 'PeriodYear',
          data: 'AssetAmortizationReporting',
        },
        {
          Display: ' - Interest on Lease Liabilities',
          PeriodYear: 'PeriodYear',
          data: 'LeaseLiabilityInterestReporting',
        },
        {
          Display: 'Operating Lease Cost',
          PeriodYear: 'PeriodYear',
          data: 'OperatingLeaseCostReporting',
        },
        {
          Display: 'Short-term Lease & Reporting Exceptions Cost',
          PeriodYear: 'PeriodYear',
          data: 'ShortTermLeaseAndReportingExceptionCostReporting',
        },
        {
          Display: 'Variable Lease Cost',
          PeriodYear: 'PeriodYear',
          data: 'VariableLeaseCostReporting',
        },
        {
          Display: 'Variable Cost of Indexed Payments',
          PeriodYear: 'PeriodYear',
          data: 'VariableLeaseCostOfIndexedPaymentsReporting',
        },
        {
          Display: 'Sublease Income',
          PeriodYear: 'PeriodYear',
          data: 'SubleaseIncome',
        },
        {
          Display: 'Total Lease Cost',
          PeriodYear: 'PeriodYear',
          dataCalculation:
            '${AssetAmortizationReporting} + ' +
            '${LeaseLiabilityInterestReporting} + ' +
            '${OperatingLeaseCostReporting} + ' +
            '${ShortTermLeaseAndReportingExceptionCostReporting} + ' +
            '${VariableLeaseCostReporting} + ' +
            '${VariableLeaseCostOfIndexedPaymentsReporting} + ' +
            '${SubleaseIncome}',
        },
      ],
    },
    {
      index: 3,
      id: 'ASC-Annual-Reporting-Exceptions-Cost',
      name: 'Reporting Exceptions Cost',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      width: 200,
      sortingOrder: {
        'ST Lease & Reporting Exceptions Cost - Cash Basis': 0,
        '- ST Lease & Reporting Exceptions Cost - SL Accrual Basis': 1,
      },
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodYear',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          Display: 'ST Lease & Reporting Exceptions Cost - Cash Basis',
          PeriodYear: 'PeriodYear',
          data: 'ShortTermLeaseAndReportingExceptionCostCashBasisReporting',
        },
        {
          Display: '- ST Lease & Reporting Exceptions Cost - SL Accrual Basis',
          PeriodYear: 'PeriodYear',
          data: 'ShortTermLeaseAndReportingExceptionCostAccrualBasisReporting',
        },
      ],
    },
    {
      index: 4,
      id: 'ASC-Annual-Other-Information',
      name: 'Other Information',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      width: 200,
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodYear',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          Display:
            'Cash Paid for Amounts Included In Measurement of Liabilities',
          PeriodYear: 'PeriodYear',
          data: 'cashFlowTotal',
        },
        {
          Display: ' - Operating Cash Flows From Finance Leases',
          PeriodYear: 'PeriodYear',
          data: 'OperatingCashFlowsFromFinanceLeases',
        },
        {
          Display: ' - Operating Cash Flows From Operating Leases',
          PeriodYear: 'PeriodYear',
          data: 'OperatingCashFlowsFromOperatingLeases',
        },
        {
          Display: ' - Financing Cash Flows From Finance Leases',
          PeriodYear: 'PeriodYear',
          data: 'FinancingCashFlowsFromFinanceLeases',
        },
        {
          Display:
            'ROU Assets Obtained In Exchange For New Finance Liabilities',
          PeriodYear: 'PeriodYear',
          data: 'ROUAssetsObtainedInExchangeForNewFinanceLiabilities',
        },
        {
          Display:
            'ROU Assets Obtained In Exchange For New Operating Liabilities',
          PeriodYear: 'PeriodYear',
          data: 'ROUAssetsObtainedInExchangeForNewOperatingLiabilities',
        },
        {
          Display:
            'Weighted-Average Remaining Years to Accounting Term - Finance Leases',
          PeriodYear: 'PeriodYear',
          data: 'WeightedAverageRemainingYearsRemainingToAccountingTermFinance',
        },
        {
          Display:
            'Weighted-Average Remaining Years to Accounting Term - Operating Leases',
          PeriodYear: 'PeriodYear',
          data: 'WeightedAverageRemainingYearsRemainingToAccountingTermOperating',
        },
        {
          Display:
            'Weighted-Average Remaining Years to Expiration - Finance Leases',
          PeriodYear: 'PeriodYear',
          data: 'WeightedAverageYearsRemainingToExpirationFinance',
        },
        {
          Display:
            'Weighted-Average Remaining Years to Expiration - Operating Leases',
          PeriodYear: 'PeriodYear',
          data: 'WeightedAverageYearsRemainingToExpirationOperating',
        },
        {
          Display: 'Weighted-Average Discount Rate - Finance Leases',
          PeriodYear: 'PeriodYear',
          data: 'WeightedAverageDiscountRateFinance',
        },
        {
          Display: 'Weighted-Average Discount Rate - Operating Leases',
          PeriodYear: 'PeriodYear',
          data: 'WeightedAverageDiscountRateOperating',
        },
      ],
    },
    {
      index: 5,
      id: 'ASC-Annual-Liability-Maturity',
      name: 'Liability Maturity',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      filterData: [
        { displayKey: '5 years', valueKey: 6 },
        { displayKey: '10 years', valueKey: 11 },
      ],
      filterBy: 'PeriodYear',
      filterInitialValue: { displayKey: '5 years', valueKey: 6 },
      width: 200,
      sortingOrder: {
        Thereafter: 100,
      },
      sortedColumnFieldName: 'DisclosureClassification',
      columnSortingOrder: {
        Finance: 0,
        Operating: 1,
        Total: 10,
      },
      cardJSONSchema: [
        {
          dataField: 'PeriodYear',
          area: 'row',
        },
        {
          dataField: 'DisclosureClassification',
          area: 'column',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          DisclosureClassification: 'ClassificationName',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'ClassificationName',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
        {
          DisclosureClassification: 'Total',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'ClassificationName',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
      ],
    },
    {
      index: 6,
      id: 'ASC-Annual-Reconciliation-of-Lease-Liabilities',
      name: 'Reconciliation of Lease Liabilities',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      width: 200,
      sortingOrder: {
        'Weighted-Average Remaining Years to Accounting Term': 0,
        'Weighted-Average Remaining Years to Expiration': 1,
        'Weighted-Average Discount Rate': 2,
        'Total Undiscounted Lease Liability': 3,
        'Imputed Interest': 4,
        'Total Discounted Lease Liability': 5,
      },
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Finance: 0,
        Operating: 1,
        Total: 2,
      },
      texts: {
        grandTotal: 'Total',
      },
      showColumnGrandTotals: false,
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'DisclosureClassification',
          area: 'column',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Weighted-Average Remaining Years to Accounting Term',
          data: 'WeightedAverageYearsRemainingToAccountingTerm',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Weighted-Average Remaining Years To Expiration',
          data: 'WeightedAverageYearsRemainingToExpiration',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Weighted-Average Discount Rate',
          data: 'WeightedAverageDiscountRate',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Total Undiscounted Lease Liability',
          data: 'TotalUndiscountedLeaseLiability',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Imputed Interest',
          data: 'ImputedInterest',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Total Discounted Lease Liability',
          data: 'TotalDiscountedLeaseLiability',
        },
      ],
    },
    {
      index: 7,
      id: 'ASC-Annual-Future-Commitments',
      name: 'Future Commitments',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      width: 200,
      sortingOrder: {},
      fillMissingYears: true,
      filterData: [
        { displayKey: '5 years', valueKey: 6 },
        { displayKey: '10 years', valueKey: 11 },
      ],
      filterBy: 'PeriodYear',
      filterInitialValue: { displayKey: '5 years', valueKey: 6 },
      cardJSONSchema: [
        {
          dataField: 'PeriodYear',
          area: 'row',
        },
        {
          dataField: 'DisclosureClassification',
          area: 'column',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          DisclosureClassification: 'ClassificationName',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'ClassificationName',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
        {
          DisclosureClassification: 'Total',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'ClassificationName',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
      ],
    },
  ],
};

export const dashboardASCQuarterly: DashboardConfig = {
  dashboardId: 5,
  pendoId: 'ASCQuarterlyDisclosures',
  localCardConfig: [
    {
      index: 0,
      id: 'ASC-Quarterly-Lease-Counts',
      name: 'Lease Counts',
      allowToggleCardView: false, // Allows to change between PivotGrid and DataGrid
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false, // When allowToggleCardView is true, choose the default Grid type
      chartActive: false,
      chartVisible: false,
      format: {
        type: 'fixedPoint',
        precision: 0,
      },
      sortingOrder: {
        'Opening Lease Count': 0,
        ' - Leases Added': 1,
        ' - Leases Expired/Cancelled': 2,
        'Closing Lease Count': 3,
      },
      sortedColumnFieldName: {
        LeaseTemplate: {
          Lease: 0,
          'Real Estate Lease': 1,
          'Equipment Lease': 2,
          'Office Equipment Lease': 3,
          Total: 4,
        },
        DisclosureClassification: {
          Finance: 0,
          Operating: 1,
          Mixed: 2,
          Total: 3,
        },
      },
      summaryCellName: 'PeriodQuarter',
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodQuarter',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'DisclosureClassification',
          area: 'column',
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
          expanded: 'true',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          DisclosureClassification: 'DisclosureClassification',
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Opening Lease Count',
          PeriodQuarter: 'PeriodQuarter',
          data: 'OpeningCount',
        },
        {
          DisclosureClassification: 'DisclosureClassification',
          LeaseTemplate: 'LeaseTemplate',
          Display: ' - Leases Added',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AddedCount',
        },
        {
          DisclosureClassification: 'DisclosureClassification',
          LeaseTemplate: 'LeaseTemplate',
          Display: ' - Leases Expired/Cancelled',
          PeriodQuarter: 'PeriodQuarter',
          data: 'EndedCount',
        },
        {
          DisclosureClassification: 'DisclosureClassification',
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Closing Lease Count',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ClosingCount',
        },
        // Total
        {
          DisclosureClassification: 'Total',
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Opening Lease Count',
          PeriodQuarter: 'PeriodQuarter',
          data: 'OpeningCount',
        },
        {
          DisclosureClassification: 'Total',
          LeaseTemplate: 'LeaseTemplate',
          Display: ' - Leases Added',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AddedCount',
        },
        {
          DisclosureClassification: 'Total',
          LeaseTemplate: 'LeaseTemplate',
          Display: ' - Leases Expired/Cancelled',
          PeriodQuarter: 'PeriodQuarter',
          data: 'EndedCount',
        },
        {
          DisclosureClassification: 'Total',
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Closing Lease Count',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ClosingCount',
        },
      ],
    },
    {
      index: 1,
      id: 'ASC-Quarterly-Asset-Balance',
      name: 'Assets and Liabilities Balances',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      width: 200,
      summaryCellName: 'PeriodQuarter',
      sortingOrder: {
        'ROU Asset Balance': 0,
        'Short Term Liability Balance': 1,
        'Long Term Liability Balance': 2,
        'Total Liability Balance': 3,
      },
      sortedColumnFieldName: 'DisclosureClassification',
      columnSortingOrder: {
        Finance: 1,
        Operating: 2,
        Total: 10,
      },
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodQuarter',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'DisclosureClassification',
          area: 'column',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'ROU Asset Balance',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AssetBalanceClosingReporting',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Short Term Liability Balance',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ShortTermLiabilityClosingReporting',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Long Term Liability Balance',
          PeriodQuarter: 'PeriodQuarter',
          data: 'LongTermLiabilityClosingReporting',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Total Liability Balance',
          PeriodQuarter: 'PeriodQuarter',
          data: 'LiabilityBalanceClosingReporting',
        },
        // Totals
        {
          DisclosureClassification: 'Total',
          Display: 'ROU Asset Balance',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AssetBalanceClosingReporting',
        },
        {
          DisclosureClassification: 'Total',
          Display: 'Short Term Liability Balance',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ShortTermLiabilityClosingReporting',
        },
        {
          DisclosureClassification: 'Total',
          Display: 'Long Term Liability Balance',
          PeriodQuarter: 'PeriodQuarter',
          data: 'LongTermLiabilityClosingReporting',
        },
        {
          DisclosureClassification: 'Total',
          Display: 'Total Liability Balance',
          PeriodQuarter: 'PeriodQuarter',
          data: 'LiabilityBalanceClosingReporting',
        },
      ],
    },
    {
      index: 2,
      id: 'ASC-Quarterly-lease-cost',
      name: 'Lease Cost',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      width: 200,
      combineWithIndex: 3,
      mergeBy: [
        { PeriodYearMonth: 'PeriodYearMonth' },
        { PeriodQuarter: 'PeriodQuarter' },
      ],
      summaryCellName: 'PeriodYearMonth',
      sortingOrder: {
        'Finance Lease Cost': 0,
        ' - Amortization of right-of-use Assets': 1,
        ' - Interest on Lease Liabilities': 2,
        'Operating Lease Cost': 3,
        'Short-term Lease & Reporting Exceptions Cost': 4,
        'Variable Lease Cost': 5,
        'Variable Cost of Indexed Payments': 6,
        'Sublease Income': 7,
        'Total Lease Cost': 10,
      },
      sortedColumnFieldName: 'LeaseTemplate',
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodQuarter',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          Display: 'Finance Lease Cost',
          PeriodQuarter: 'PeriodQuarter',
          data: 'FinanceLeaseCostReporting',
        },
        {
          Display: ' - Amortization of right-of-use Assets',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AssetAmortizationReporting',
        },
        {
          Display: ' - Interest on Lease Liabilities',
          PeriodQuarter: 'PeriodQuarter',
          data: 'LeaseLiabilityInterestReporting',
        },
        {
          Display: 'Operating Lease Cost',
          PeriodQuarter: 'PeriodQuarter',
          data: 'OperatingLeaseCostReporting',
        },
        {
          Display: 'Short-term Lease & Reporting Exceptions Cost',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ShortTermLeaseAndReportingExceptionCostReporting',
        },
        {
          Display: 'Variable Lease Cost',
          PeriodQuarter: 'PeriodQuarter',
          data: 'VariableLeaseCostReporting',
        },
        {
          Display: 'Variable Cost of Indexed Payments',
          PeriodQuarter: 'PeriodQuarter',
          data: 'VariableLeaseCostOfIndexedPaymentsReporting',
        },
        {
          Display: 'Sublease Income',
          PeriodQuarter: 'PeriodQuarter',
          data: 'SubleaseIncome',
        },
        {
          Display: 'Total Lease Cost',
          PeriodQuarter: 'PeriodQuarter',
          dataCalculation:
            '${AssetAmortizationReporting} + ' +
            '${LeaseLiabilityInterestReporting} + ' +
            '${OperatingLeaseCostReporting} + ' +
            '${ShortTermLeaseAndReportingExceptionCostReporting} + ' +
            '${VariableLeaseCostReporting} + ' +
            '${VariableLeaseCostOfIndexedPaymentsReporting} + ' +
            '${SubleaseIncome}',
        },
      ],
    },
    {
      index: 3,
      id: 'ASC-Quarterly-Reporting-Exceptions-Cost',
      name: 'Reporting Exceptions Cost',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      width: 200,
      sortingOrder: {
        'ST Lease & Reporting Exceptions Cost - Cash Basis': 0,
        '- ST Lease & Reporting Exceptions Cost - SL Accrual Basis': 1,
      },
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodQuarter',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          Display: 'ST Lease & Reporting Exceptions Cost - Cash Basis',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ShortTermLeaseAndReportingExceptionCostCashBasisReporting',
        },
        {
          Display: '- ST Lease & Reporting Exceptions Cost - SL Accrual Basis',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ShortTermLeaseAndReportingExceptionCostAccrualBasisReporting',
        },
      ],
    },
    {
      index: 4,
      id: 'ASC-Quarterly-Other-Information',
      name: 'Other Information',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      width: 200,
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodQuarter',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          Display:
            'Cash Paid for Amounts Included In Measurement of Liabilities',
          PeriodQuarter: 'PeriodQuarter',
          data: 'cashFlowTotal',
        },
        {
          Display: ' - Operating Cash Flows From Finance Leases',
          PeriodQuarter: 'PeriodQuarter',
          data: 'OperatingCashFlowsFromFinanceLeases',
        },
        {
          Display: ' - Operating Cash Flows From Operating Leases',
          PeriodQuarter: 'PeriodQuarter',
          data: 'OperatingCashFlowsFromOperatingLeases',
        },
        {
          Display: ' - Financing Cash Flows From Finance Leases',
          PeriodQuarter: 'PeriodQuarter',
          data: 'FinancingCashFlowsFromFinanceLeases',
        },
        {
          Display:
            'ROU Assets Obtained In Exchange For New Finance Liabilities',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ROUAssetsObtainedInExchangeForNewFinanceLiabilities',
        },
        {
          Display:
            'ROU Assets Obtained In Exchange For New Operating Liabilities',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ROUAssetsObtainedInExchangeForNewOperatingLiabilities',
        },
        {
          Display:
            'Weighted-Average Remaining Years to Accounting Term - Finance Leases',
          PeriodQuarter: 'PeriodQuarter',
          data: 'WeightedAverageRemainingYearsRemainingToAccountingTermFinance',
        },
        {
          Display:
            'Weighted-Average Remaining Years to Accounting Term - Operating Leases',
          PeriodQuarter: 'PeriodQuarter',
          data: 'WeightedAverageRemainingYearsRemainingToAccountingTermOperating',
        },
        {
          Display:
            'Weighted-Average Remaining Years to Expiration - Finance Leases',
          PeriodQuarter: 'PeriodQuarter',
          data: 'WeightedAverageYearsRemainingToExpirationFinance',
        },
        {
          Display:
            'Weighted-Average Remaining Years to Expiration - Operating Leases',
          PeriodQuarter: 'PeriodQuarter',
          data: 'WeightedAverageYearsRemainingToExpirationOperating',
        },
        {
          Display: 'Weighted-Average Discount Rate - Finance Leases',
          PeriodQuarter: 'PeriodQuarter',
          data: 'WeightedAverageDiscountRateFinance',
        },
        {
          Display: 'Weighted-Average Discount Rate - Operating Leases',
          PeriodQuarter: 'PeriodQuarter',
          data: 'WeightedAverageDiscountRateOperating',
        },
      ],
    },
    {
      index: 5,
      id: 'ASC-Quarterly-Liability-Maturity',
      name: 'Liability Maturity',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      filterData: [
        { displayKey: '5 years', valueKey: 6 },
        { displayKey: '10 years', valueKey: 11 },
      ],
      filterBy: 'PeriodYear',
      filterInitialValue: { displayKey: '5 years', valueKey: 6 },
      width: 200,
      sortingOrder: {
        Thereafter: 100,
      },
      sortedColumnFieldName: 'DisclosureClassification',
      columnSortingOrder: {
        Finance: 0,
        Operating: 1,
        Total: 10,
      },
      cardJSONSchema: [
        {
          dataField: 'PeriodYear',
          area: 'row',
          expanded: true,
        },
        {
          dataField: 'DisclosureClassification',
          area: 'column',
          expanded: 'true',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          DisclosureClassification: 'ClassificationName',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'ClassificationName',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
        {
          DisclosureClassification: 'Total',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'ClassificationName',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
      ],
    },
    {
      index: 6,
      id: 'ASC-Quarterly-Reconciliation-of-Lease-Liabilities',
      name: 'Reconciliation of Lease Liabilities',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      width: 200,
      sortingOrder: {
        'Weighted-Average Remaining Years to Accounting Term': 0,
        'Weighted-Average Remaining Years to Expiration': 1,
        'Weighted-Average Discount Rate': 2,
        'Total Undiscounted Lease Liability': 3,
        'Imputed Interest': 4,
        'Total Discounted Lease Liability': 5,
      },
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Finance: 0,
        Operating: 1,
        Total: 2,
      },
      texts: {
        grandTotal: 'Total',
      },
      showColumnGrandTotals: false,
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'DisclosureClassification',
          area: 'column',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Weighted-Average Remaining Years to Accounting Term',
          data: 'WeightedAverageYearsRemainingToAccountingTerm',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Weighted-Average Remaining Years To Expiration',
          data: 'WeightedAverageYearsRemainingToExpiration',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Weighted-Average Discount Rate',
          data: 'WeightedAverageDiscountRate',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Total Undiscounted Lease Liability',
          data: 'TotalUndiscountedLeaseLiability',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Imputed Interest',
          data: 'ImputedInterest',
        },
        {
          DisclosureClassification: 'ClassificationName',
          Display: 'Total Discounted Lease Liability',
          data: 'TotalDiscountedLeaseLiability',
        },
      ],
    },
    {
      index: 7,
      id: 'ASC-Quarterly-Future-Commitments',
      name: 'Future Commitments',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      width: 200,
      sortingOrder: {},
      fillMissingYears: true,
      filterData: [
        { displayKey: '5 years', valueKey: 6 },
        { displayKey: '10 years', valueKey: 11 },
      ],
      filterBy: 'PeriodYear',
      filterInitialValue: { displayKey: '5 years', valueKey: 6 },
      cardJSONSchema: [
        {
          dataField: 'PeriodYear',
          area: 'row',
        },
        {
          dataField: 'DisclosureClassification',
          area: 'column',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          DisclosureClassification: 'ClassificationName',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'ClassificationName',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
        {
          DisclosureClassification: 'Total',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'ClassificationName',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
      ],
    },
  ],
};

export const dashboardIFRSAnnually: DashboardConfig = {
  dashboardId: 6,
  pendoId: 'IFRSAnnualDisclosures',
  localCardConfig: [
    {
      index: 0,
      id: 'IFRS16-Annual-Lease-Counts',
      name: 'Lease Counts',
      allowToggleCardView: false, // Allows to change between PivotGrid and DataGrid
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false, // When allowToggleCardView is true, choose the default Grid type
      chartActive: false,
      chartVisible: false,
      sortingOrder: {
        'Opening Lease Count': 1,
        '- Leases Added': 2,
        '- Leases Expired/Cancelled': 3,
        'Closing Lease Count': 4,
      },
      format: {
        type: 'fixedPoint',
        precision: 0,
      },
      summaryCellName: 'PeriodYear',
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Lease: 1,
        'JE Lease': 2,
        'Real Estate Lease': 3,
        'Equipment Lease': 4,
        'Office Equipment Lease': 5,
        Total: 10,
      },
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodYear',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Opening Lease Count',
          PeriodYear: 'PeriodYear',
          data: 'OpeningCount',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: '- Leases Added',
          PeriodYear: 'PeriodYear',
          data: 'AddedCount',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: '- Leases Expired/Cancelled',
          PeriodYear: 'PeriodYear',
          data: 'EndedCount',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Closing Lease Count',
          PeriodYear: 'PeriodYear',
          data: 'ClosingCount',
        },
        // Totals
        {
          LeaseTemplate: 'Total',
          Display: 'Opening Lease Count',
          PeriodYear: 'PeriodYear',
          data: 'OpeningCount',
        },
        {
          LeaseTemplate: 'Total',
          Display: '- Leases Added',
          PeriodYear: 'PeriodYear',
          data: 'AddedCount',
        },
        {
          LeaseTemplate: 'Total',
          Display: '- Leases Expired/Cancelled',
          PeriodYear: 'PeriodYear',
          data: 'EndedCount',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Closing Lease Count',
          PeriodYear: 'PeriodYear',
          data: 'ClosingCount',
        },
      ],
    },
    {
      index: 1,
      id: 'IFRS16-Annual-Asset-Balance',
      name: 'Assets and Liabilities Balances',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      width: 200,
      summaryCellName: 'PeriodYear',
      sortingOrder: {
        'ROU Asset Balance - Opening': 1,
        'ROU Asset Balance - Added': 2,
        'ROU Asset Balance - Amortization': 3,
        'ROU Asset Balance - Adjustment': 4,
        'ROU Asset Balance - Closing': 5,

        'Short Term Liability Balance': 6,
        'Long Term Liability Balance': 7,
        'Total Liability Balance': 8,
      },
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Lease: 1,
        'JE Lease': 2,
        'Real Estate Lease': 3,
        'Equipment Lease': 4,
        'Office Equipment Lease': 5,
        Total: 10,
      },
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodYear',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
          expanded: 'true',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        // First Part
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'ROU Asset Balance - Opening',
          PeriodYear: 'PeriodYear',
          data: 'AssetBalanceOpeningReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'ROU Asset Balance - Added',
          PeriodYear: 'PeriodYear',
          data: 'AssetBalanceAddedReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'ROU Asset Balance - Amortization',
          PeriodYear: 'PeriodYear',
          data: 'AssetBalanceAmortizationReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'ROU Asset Balance - Adjustment',
          PeriodYear: 'PeriodYear',
          data: 'AssetBalanceAdjustmentReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'ROU Asset Balance - Closing',
          PeriodYear: 'PeriodYear',
          data: 'AssetBalanceClosingReporting',
        },
        // Second Part
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Short Term Liability Balance',
          PeriodYear: 'PeriodYear',
          data: 'ShortTermLiabilityClosingReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Long Term Liability Balance',
          PeriodYear: 'PeriodYear',
          data: 'LongTermLiabilityClosingReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Total Liability Balance',
          PeriodYear: 'PeriodYear',
          data: 'LiabilityBalanceClosingReporting',
        },
        // Totals
        // First Part
        {
          LeaseTemplate: 'Total',
          Display: 'ROU Asset Balance - Opening',
          PeriodYear: 'PeriodYear',
          data: 'AssetBalanceOpeningReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'ROU Asset Balance - Added',
          PeriodYear: 'PeriodYear',
          data: 'AssetBalanceAddedReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'ROU Asset Balance - Amortization',
          PeriodYear: 'PeriodYear',
          data: 'AssetBalanceAmortizationReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'ROU Asset Balance - Adjustment',
          PeriodYear: 'PeriodYear',
          data: 'AssetBalanceAdjustmentReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'ROU Asset Balance - Closing',
          PeriodYear: 'PeriodYear',
          data: 'AssetBalanceClosingReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Short Term Liability Balance',
          PeriodYear: 'PeriodYear',
          data: 'ShortTermLiabilityClosingReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Long Term Liability Balance',
          PeriodYear: 'PeriodYear',
          data: 'LongTermLiabilityClosingReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Total Liability Balance',
          PeriodYear: 'PeriodYear',
          data: 'LiabilityBalanceClosingReporting',
        },
      ],
    },
    {
      index: 2,
      name: 'Lease Cost',
      id: 'IFRS16-Annual-Lease-Cost',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      width: 200,
      summaryCellName: 'PeriodYear',
      combineWithIndex: 3,
      mergeBy: [
        {
          PeriodYearMonth: 'PeriodYearMonth',
        },
      ],
      sortingOrder: {
        'Finance Lease Cost': 0,
        '- Depreciation of right-of-use Assets': 1,
        '- Interest on Lease Liabilities': 2,
        'Reporting Exceptions Cost Short-Term Leases': 3,
        'Reporting Exceptions Cost Low-Value Leases': 4,
        'Other Reporting Exceptions': 5,
        'Variable Lease Cost': 6,
        'Variable Cost of Indexed Payments': 7,
        'Sublease Income': 8,
        'Total Lease Cost': 9,
      },
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Lease: 1,
        'JE Lease': 2,
        'Real Estate Lease': 3,
        'Equipment Lease': 4,
        'Office Equipment Lease': 5,
        Total: 10,
      },
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodYear',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
          expanded: 'true',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Finance Lease Cost',
          PeriodYear: 'PeriodYear',
          data: 'FinanceLeaseCostReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: '- Depreciation of right-of-use Assets',
          PeriodYear: 'PeriodYear',
          data: 'DepreciationOfROUAssets',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: '- Interest on Lease Liabilities',
          PeriodYear: 'PeriodYear',
          data: 'LeaseLiabilityInterestReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Reporting Exceptions Cost Short-Term Leases',
          PeriodYear: 'PeriodYear',
          data: 'ShortTermLeaseCostReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Reporting Exceptions Cost Low-Value Leases',
          PeriodYear: 'PeriodYear',
          data: 'LowValueLeaseCostReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Other Reporting Exceptions',
          PeriodYear: 'PeriodYear',
          data: 'OtherExceptionCostReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Variable Lease Cost',
          PeriodYear: 'PeriodYear',
          data: 'VariableLeaseCostReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Variable Cost of Indexed Payments',
          PeriodYear: 'PeriodYear',
          data: 'VariableLeaseCostOfIndexedPaymentsReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Sublease Income',
          PeriodYear: 'PeriodYear',
          data: 'SubleaseIncome',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Total Lease Cost',
          PeriodYear: 'PeriodYear',
          dataCalculation:
            '${DepreciationOfROUAssets} + ' +
            '${LeaseLiabilityInterestReporting} + ' +
            '${ShortTermLeaseCostReporting} + ' +
            '${LowValueLeaseCostReporting} + ' +
            '${OtherExceptionCostReporting} + ' +
            '${VariableLeaseCostReporting} + ' +
            '${VariableLeaseCostOfIndexedPaymentsReporting} + ' +
            '${SubleaseIncome}',
        },
        // Totals
        {
          LeaseTemplate: 'Total',
          Display: 'Finance Lease Cost',
          PeriodYear: 'PeriodYear',
          data: 'FinanceLeaseCostReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: '- Depreciation of right-of-use Assets',
          PeriodYear: 'PeriodYear',
          data: 'DepreciationOfROUAssets',
        },
        {
          LeaseTemplate: 'Total',
          Display: '- Interest on Lease Liabilities',
          PeriodYear: 'PeriodYear',
          data: 'LeaseLiabilityInterestReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Reporting Exceptions Cost Short-Term Leases',
          PeriodYear: 'PeriodYear',
          data: 'ShortTermLeaseCostReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Reporting Exceptions Cost Low-Value Leases',
          PeriodYear: 'PeriodYear',
          data: 'LowValueLeaseCostReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Other Reporting Exceptions',
          PeriodYear: 'PeriodYear',
          data: 'OtherExceptionCostReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Variable Lease Cost',
          PeriodYear: 'PeriodYear',
          data: 'VariableLeaseCostReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Variable Cost of Indexed Payments',
          PeriodYear: 'PeriodYear',
          data: 'VariableLeaseCostOfIndexedPaymentsReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Sublease Income',
          PeriodYear: 'PeriodYear',
          data: 'SubleaseIncome',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Total Lease Cost',
          PeriodYear: 'PeriodYear',
          dataCalculation:
            '${DepreciationOfROUAssets} + ' +
            '${LeaseLiabilityInterestReporting} + ' +
            '${ShortTermLeaseCostReporting} + ' +
            '${LowValueLeaseCostReporting} + ' +
            '${OtherExceptionCostReporting} + ' +
            '${VariableLeaseCostReporting} + ' +
            '${VariableLeaseCostOfIndexedPaymentsReporting} + ' +
            '${SubleaseIncome}',
        },
      ],
    },
    {
      index: 3,
      name: 'Reporting Exceptions Cost',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      id: 'IFRS16-Annual-Reporting-Exceptions-Cost',
      width: 200,
      summaryCellName: 'PeriodYear',
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Lease: 1,
        'JE Lease': 2,
        'Real Estate Lease': 3,
        'Equipment Lease': 4,
        'Office Equipment Lease': 5,
        Total: 10,
      },
      cardJSONSchema: [
        {
          dataField: 'ExceptionReason',
          area: 'row',
        },
        {
          dataField: 'PeriodYear',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
          expanded: 'true',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          LeaseTemplate: 'LeaseTemplate',
          ExceptionReason: 'ExceptionReason',
          PeriodYear: 'PeriodYear',
          data: 'ShortTermLeaseAndReportingExceptionCostCashBasisReporting',
        },
        {
          LeaseTemplate: 'Total',
          ExceptionReason: 'ExceptionReason',
          PeriodYear: 'PeriodYear',
          data: 'ShortTermLeaseAndReportingExceptionCostCashBasisReporting',
        },
      ],
    },
    {
      index: 4,
      name: 'Other Information',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      id: 'IFRS16-Annual-Other-Information',
      width: 200,
      summaryCellName: 'PeriodYear',
      sortingOrder: {
        'Cash Flows - Total': 0,
        'Cash Flows - Interest': 1,
        'Cash Flows - Principal Repayment': 2,
        'Right-of-use Assets Obtained In Exchange For New Finance Liabilities': 3,
        'Weighted-Average Remaining Years to Accounting Term': 4,
        'Weighted-Average Remaining Years to Expiration': 5,
        'Weighted-Average Incremental Borrowing Rate': 6,
      },
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Lease: 1,
        'JE Lease': 2,
        'Real Estate Lease': 3,
        'Equipment Lease': 4,
        'Office Equipment Lease': 5,
        Total: 10, // Relying on a LeaseTemplate with name "Total"
      },
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodYear',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
          expanded: 'true',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Cash Flows - Total',
          PeriodYear: 'PeriodYear',
          data: 'CashFlowsTotalReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Cash Flows - Interest',
          PeriodYear: 'PeriodYear',
          data: 'CashFlowsInterestReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Cash Flows - Principal Repayment',
          PeriodYear: 'PeriodYear',
          data: 'CashFlowsPrincipalRepaymentReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display:
            'Right-of-use Assets Obtained In Exchange For New Finance Liabilities',
          PeriodYear: 'PeriodYear',
          data: 'ROUAssetsObtainedInExchangeForNewFinanceLiabilities',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Weighted-Average Remaining Years to Accounting Term',
          PeriodYear: 'PeriodYear',
          data: 'WeightedAverageYearsRemainingToAccountingTermFinance',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Weighted-Average Remaining Years to Expiration',
          PeriodYear: 'PeriodYear',
          data: 'WeightedAverageYearsRemainingToExpirationFinance',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Weighted-Average Incremental Borrowing Rate',
          PeriodYear: 'PeriodYear',
          data: 'WeightedAverageIncrementalBorrowingRate',
        },
      ],
    },
    {
      index: 5,
      name: 'Liability Maturity',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      id: 'IFRS16-Annual-Liability-Maturity',
      filterData: [
        { displayKey: '5 years', valueKey: 6 },
        { displayKey: '10 years', valueKey: 11 },
      ],
      filterBy: 'PeriodYear',
      filterInitialValue: { displayKey: '5 years', valueKey: 6 },
      width: 200,
      sortingOrder: {
        Thereafter: 100,
      },
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Lease: 1,
        'JE Lease': 2,
        'Real Estate Lease': 3,
        'Equipment Lease': 4,
        'Office Equipment Lease': 5,
        Total: 10,
      },
      cardJSONSchema: [
        {
          dataField: 'PeriodYear',
          area: 'row',
          expanded: true,
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
          expanded: 'true',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          LeaseTemplate: 'LeaseTemplate',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'LeaseTemplate',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
        {
          LeaseTemplate: 'Total',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'LeaseTemplate',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
      ],
    },
    {
      index: 6,
      name: 'Reconciliation of Lease Liabilities',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      id: 'IFRS16-Annual-Reconciliation-of-Lease-Liabilities',
      width: 200,
      sortingOrder: {
        'Weighted-Average Remaining Years to Accounting Term': 0,
        'Weighted-Average Remaining Years to Expiration': 1,
        'Weighted-Average Incremental Borrowing Rate': 2,
        'Total Undiscounted Lease Liability': 3,
        'Imputed Interest': 4,
        'Total Discounted Lease Liability': 5,
      },
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Lease: 1,
        'JE Lease': 2,
        'Real Estate Lease': 3,
        'Equipment Lease': 4,
        'Office Equipment Lease': 5,
        Total: 10,
      },
      texts: {
        grandTotal: 'Total',
      },
      showColumnGrandTotals: false,
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
          expanded: 'true',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Weighted-Average Remaining Years to Accounting Term',
          data: 'WeightedAverageYearsRemainingToAccountingTerm',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Weighted-Average Remaining Years to Expiration',
          data: 'WeightedAverageYearsRemainingToExpiration',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Weighted-Average Incremental Borrowing Rate',
          data: 'WeightedAverageDiscountRate',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Total Undiscounted Lease Liability',
          data: 'TotalUndiscountedLeaseLiability',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Imputed Interest',
          data: 'ImputedInterest',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Total Discounted Lease Liability',
          data: 'TotalDiscountedLeaseLiability',
        },
      ],
    },
    {
      index: 7,
      name: 'Future Commitments',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      id: 'IFRS16-Annual-Future-Commitments',
      width: 200,
      sortingOrder: {},
      fillMissingYears: true,
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Lease: 1,
        'JE Lease': 2,
        'Real Estate Lease': 3,
        'Equipment Lease': 4,
        'Office Equipment Lease': 5,
        Total: 10,
      },
      filterData: [
        { displayKey: '5 years', valueKey: 6 },
        { displayKey: '10 years', valueKey: 11 },
      ],
      filterBy: 'PeriodYear',
      filterInitialValue: { displayKey: '5 years', valueKey: 6 },
      cardJSONSchema: [
        {
          dataField: 'PeriodYear',
          area: 'row',
          expanded: true,
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
          expanded: 'true',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          LeaseTemplate: 'LeaseTemplate',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'LeaseTemplate',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
        {
          LeaseTemplate: 'Total',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'LeaseTemplate',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
      ],
    },
  ],
};

export const dashboardIFRSQuarterly: DashboardConfig = {
  dashboardId: 7,
  pendoId: 'IFRSQuarterlyDisclosures',
  localCardConfig: [
    {
      index: 0,
      id: 'IFRS16-Quarterly-Lease-Counts',
      name: 'Lease Counts',
      summaryCellName: 'PeriodQuarter',
      allowToggleCardView: false, // Allows to change between PivotGrid and DataGrid
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false, // When allowToggleCardView is true, choose the default Grid type
      chartActive: false,
      chartVisible: false,
      format: {
        type: 'fixedPoint',
        precision: 0,
      },
      sortingOrder: {
        'Opening Lease Count': 1,
        '- Leases Added': 2,
        '- Leases Expired/Cancelled': 3,
        'Closing Lease Count': 4,
      },
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Lease: 0,
        'Real Estate Lease': 1,
        'Equipment Lease': 2,
        'Office Equipment Lease': 3,
        Total: 4,
      },
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodQuarter',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Opening Lease Count',
          PeriodQuarter: 'PeriodQuarter',
          data: 'OpeningCount',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: '- Leases Added',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AddedCount',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: '- Leases Expired/Cancelled',
          PeriodQuarter: 'PeriodQuarter',
          data: 'EndedCount',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Closing Lease Count',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ClosingCount',
        },
        // Totals
        {
          LeaseTemplate: 'Total',
          Display: 'Opening Lease Count',
          PeriodQuarter: 'PeriodQuarter',
          data: 'OpeningCount',
        },
        {
          LeaseTemplate: 'Total',
          Display: '- Leases Added',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AddedCount',
        },
        {
          LeaseTemplate: 'Total',
          Display: '- Leases Expired/Cancelled',
          PeriodQuarter: 'PeriodQuarter',
          data: 'EndedCount',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Closing Lease Count',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ClosingCount',
        },
      ],
    },
    {
      index: 1,
      id: 'IFRS16-Quarterly-Asset-Balance',
      name: 'Assets and Liabilities Balances',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      chartActive: false,
      chartVisible: false,
      width: 200,
      summaryCellName: 'PeriodQuarter',
      sortingOrder: {
        'ROU Asset Balance - Opening': 1,
        'ROU Asset Balance - Added': 2,
        'ROU Asset Balance - Amortization': 3,
        'ROU Asset Balance - Adjustment': 4,
        'ROU Asset Balance - Closing': 5,

        'Short Term Liability Balance': 6,
        'Long Term Liability Balance': 7,
        'Total Liability Balance': 8,
      },
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Lease: 0,
        'Real Estate Lease': 1,
        'Equipment Lease': 2,
        'Office Equipment Lease': 3,
        Total: 4,
      },
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodQuarter',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        // First Part
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'ROU Asset Balance - Opening',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AssetBalanceOpeningReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'ROU Asset Balance - Added',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AssetBalanceAddedReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'ROU Asset Balance - Amortization',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AssetBalanceAmortizationReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'ROU Asset Balance - Adjustment',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AssetBalanceAdjustmentReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'ROU Asset Balance - Closing',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AssetBalanceClosingReporting',
        },
        // Second Part
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Short Term Liability Balance',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ShortTermLiabilityClosingReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Long Term Liability Balance',
          PeriodQuarter: 'PeriodQuarter',
          data: 'LongTermLiabilityClosingReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Total Liability Balance',
          PeriodQuarter: 'PeriodQuarter',
          data: 'LiabilityBalanceClosingReporting',
        },
        // Totals
        // First Part
        {
          LeaseTemplate: 'Total',
          Display: 'ROU Asset Balance - Opening',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AssetBalanceOpeningReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'ROU Asset Balance - Added',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AssetBalanceAddedReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'ROU Asset Balance - Amortization',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AssetBalanceAmortizationReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'ROU Asset Balance - Adjustment',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AssetBalanceAdjustmentReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'ROU Asset Balance - Closing',
          PeriodQuarter: 'PeriodQuarter',
          data: 'AssetBalanceClosingReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Short Term Liability Balance',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ShortTermLiabilityClosingReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Long Term Liability Balance',
          PeriodQuarter: 'PeriodQuarter',
          data: 'LongTermLiabilityClosingReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Total Liability Balance',
          PeriodQuarter: 'PeriodQuarter',
          data: 'LiabilityBalanceClosingReporting',
        },
      ],
    },
    {
      index: 2,
      name: 'Lease Cost',
      id: 'IFRS16-Quarterly-Lease-Cost',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      chartActive: false,
      chartVisible: false,
      width: 200,
      summaryCellName: 'PeriodQuarter',
      combineWithIndex: 3,
      mergeBy: [
        { PeriodYearMonth: 'PeriodYearMonth' },
        { PeriodQuarter: 'PeriodQuarter' },
      ],
      sortingOrder: {
        'Finance Lease Cost': 0,
        '- Depreciation of right-of-use Assets': 1,
        '- Interest on Lease Liabilities': 2,
        'Reporting Exceptions Cost Short-Term Leases': 3,
        'Reporting Exceptions Cost Low-Value Leases': 4,
        'Other Reporting Exceptions': 5,
        'Variable Lease Cost': 6,
        'Variable Cost of Indexed Payments': 7,
        'Sublease Income': 8,
        'Total Lease Cost': 9,
      },
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Lease: 1,
        'JE Lease': 2,
        'Real Estate Lease': 3,
        'Equipment Lease': 4,
        'Office Equipment Lease': 5,
        Total: 10,
      },
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodQuarter',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Finance Lease Cost',
          PeriodQuarter: 'PeriodQuarter',
          data: 'FinanceLeaseCostReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: '- Depreciation of right-of-use Assets',
          PeriodQuarter: 'PeriodQuarter',
          data: 'DepreciationOfROUAssets',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: '- Interest on Lease Liabilities',
          PeriodQuarter: 'PeriodQuarter',
          data: 'LeaseLiabilityInterestReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Reporting Exceptions Cost Short-Term Leases',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ShortTermLeaseCostReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Reporting Exceptions Cost Low-Value Leases',
          PeriodQuarter: 'PeriodQuarter',
          data: 'LowValueLeaseCostReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Other Reporting Exceptions',
          PeriodQuarter: 'PeriodQuarter',
          data: 'OtherExceptionCostReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Variable Lease Cost',
          PeriodQuarter: 'PeriodQuarter',
          data: 'VariableLeaseCostReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Variable Cost of Indexed Payments',
          PeriodQuarter: 'PeriodQuarter',
          data: 'VariableLeaseCostOfIndexedPaymentsReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Sublease Income',
          PeriodQuarter: 'PeriodQuarter',
          data: 'SubleaseIncome',
        },
        // Totals
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Total Lease Cost',
          PeriodQuarter: 'PeriodQuarter',
          dataCalculation:
            '${DepreciationOfROUAssets} + ' +
            '${LeaseLiabilityInterestReporting} + ' +
            '${ShortTermLeaseCostReporting} + ' +
            '${LowValueLeaseCostReporting} + ' +
            '${OtherExceptionCostReporting} + ' +
            '${VariableLeaseCostReporting} + ' +
            '${VariableLeaseCostOfIndexedPaymentsReporting} + ' +
            '${SubleaseIncome}',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Finance Lease Cost',
          PeriodQuarter: 'PeriodQuarter',
          data: 'FinanceLeaseCostReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: '- Depreciation of right-of-use Assets',
          PeriodQuarter: 'PeriodQuarter',
          data: 'DepreciationOfROUAssets',
        },
        {
          LeaseTemplate: 'Total',
          Display: '- Interest on Lease Liabilities',
          PeriodQuarter: 'PeriodQuarter',
          data: 'LeaseLiabilityInterestReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Reporting Exceptions Cost Short-Term Leases',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ShortTermLeaseCostReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Reporting Exceptions Cost Low-Value Leases',
          PeriodQuarter: 'PeriodQuarter',
          data: 'LowValueLeaseCostReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Other Reporting Exceptions',
          PeriodQuarter: 'PeriodQuarter',
          data: 'OtherExceptionCostReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Variable Lease Cost',
          PeriodQuarter: 'PeriodQuarter',
          data: 'VariableLeaseCostReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Variable Cost of Indexed Payments',
          PeriodQuarter: 'PeriodQuarter',
          data: 'VariableLeaseCostOfIndexedPaymentsReporting',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Sublease Income',
          PeriodQuarter: 'PeriodQuarter',
          data: 'SubleaseIncome',
        },
        {
          LeaseTemplate: 'Total',
          Display: 'Total Lease Cost',
          PeriodQuarter: 'PeriodQuarter',
          dataCalculation:
            '${DepreciationOfROUAssets} + ' +
            '${LeaseLiabilityInterestReporting} + ' +
            '${ShortTermLeaseCostReporting} + ' +
            '${LowValueLeaseCostReporting} + ' +
            '${OtherExceptionCostReporting} + ' +
            '${VariableLeaseCostReporting} + ' +
            '${VariableLeaseCostOfIndexedPaymentsReporting} + ' +
            '${SubleaseIncome}',
        },
      ],
    },
    {
      index: 3,
      name: 'Reporting Exceptions Cost',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      chartActive: false,
      chartVisible: false,
      id: 'IFRS16-Quarterly-Reporting-Exceptions-Cost',
      width: 200,
      sortedColumnFieldName: 'LeaseTemplate',
      summaryCellName: 'PeriodQuarter',
      columnSortingOrder: {
        Lease: 1,
        'JE Lease': 2,
        'Real Estate Lease': 3,
        'Equipment Lease': 4,
        'Office Equipment Lease': 5,
        Total: 10,
      },
      cardJSONSchema: [
        {
          dataField: 'ExceptionReason',
          area: 'row',
        },
        {
          dataField: 'PeriodQuarter',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
          expanded: 'true',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          LeaseTemplate: 'LeaseTemplate',
          ExceptionReason: 'ExceptionReason',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ShortTermLeaseAndReportingExceptionCostCashBasisReporting',
        },
        {
          LeaseTemplate: 'Total',
          ExceptionReason: 'ExceptionReason',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ShortTermLeaseAndReportingExceptionCostCashBasisReporting',
        },
      ],
    },
    {
      index: 4,
      name: 'Other Information',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      chartActive: false,
      chartVisible: false,
      id: 'IFRS16-Quarterly-Other-Information',
      width: 200,
      summaryCellName: 'PeriodQuarter',
      sortingOrder: {
        'Cash Flows - Total': 0,
        'Cash Flows - Interest': 1,
        'Cash Flows - Principal Repayment': 2,
        'Right-of-use Assets Obtained In Exchange For New Finance Liabilities': 3,
        'Weighted-Average Remaining Years to Accounting Term': 4,
        'Weighted-Average Remaining Years to Expiration': 5,
        'Weighted-Average Incremental Borrowing Rate': 6,
      },
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Lease: 0,
        'Real Estate Lease': 1,
        'Equipment Lease': 2,
        'Office Equipment Lease': 3,
        Total: 4, // Relying on a LeaseTemplate with name "Total"
      },
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'PeriodQuarter',
          area: 'column',
          expanded: true,
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
          expanded: 'true',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Cash Flows - Total',
          PeriodQuarter: 'PeriodQuarter',
          data: 'CashFlowsTotalReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Cash Flows - Interest',
          PeriodQuarter: 'PeriodQuarter',
          data: 'CashFlowsInterestReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Cash Flows - Principal Repayment',
          PeriodQuarter: 'PeriodQuarter',
          data: 'CashFlowsPrincipalRepaymentReporting',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display:
            'Right-of-use Assets Obtained In Exchange For New Finance Liabilities',
          PeriodQuarter: 'PeriodQuarter',
          data: 'ROUAssetsObtainedInExchangeForNewFinanceLiabilities',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Weighted-Average Remaining Years to Accounting Term',
          PeriodQuarter: 'PeriodQuarter',
          data: 'WeightedAverageYearsRemainingToAccountingTermFinance',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Weighted-Average Remaining Years to Expiration',
          PeriodQuarter: 'PeriodQuarter',
          data: 'WeightedAverageYearsRemainingToExpirationFinance',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Weighted-Average Incremental Borrowing Rate',
          PeriodQuarter: 'PeriodQuarter',
          data: 'WeightedAverageIncrementalBorrowingRate',
        },
      ],
    },
    {
      index: 5,
      name: 'Liability Maturity',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      chartActive: false,
      chartVisible: false,
      id: 'IFRS16-Quarterly-Liability-Maturity',
      filterData: [
        { displayKey: '5 years', valueKey: 6 },
        { displayKey: '10 years', valueKey: 11 },
      ],
      filterBy: 'PeriodYear',
      filterInitialValue: { displayKey: '5 years', valueKey: 6 },
      width: 200,
      sortingOrder: {
        Thereafter: 100,
      },
      showColumnTotals: false,
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Lease: 0,
        'Real Estate Lease': 1,
        'Equipment Lease': 2,
        'Office Equipment Lease': 3,
        Total: 4,
      },
      cardJSONSchema: [
        {
          dataField: 'PeriodYear',
          area: 'row',
          expanded: true,
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
          expanded: 'true',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          LeaseTemplate: 'LeaseTemplate',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'LeaseTemplate',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
        {
          LeaseTemplate: 'Total',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'LeaseTemplate',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
      ],
    },
    {
      index: 6,
      name: 'Reconciliation of Lease Liabilities',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      chartActive: false,
      chartVisible: false,
      id: 'IFRS16-Quarterly-Reconciliation-of-Lease-Liabilities',
      width: 200,
      sortingOrder: {
        'Weighted-Average Remaining Years to Accounting Term': 0,
        'Weighted-Average Remaining Years to Expiration': 1,
        'Weighted-Average Incremental Borrowing Rate': 2,
        'Total Undiscounted Lease Liability': 3,
        'Imputed Interest': 4,
        'Total Discounted Lease Liability': 5,
      },
      sortedColumnFieldName: 'LeaseTemplate',
      columnSortingOrder: {
        Lease: 0,
        'Real Estate Lease': 1,
        'Equipment Lease': 2,
        'Office Equipment Lease': 3,
        Total: 4,
      },
      texts: {
        grandTotal: 'Total',
      },
      showColumnGrandTotals: false,
      cardJSONSchema: [
        {
          dataField: 'Display',
          area: 'row',
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
          expanded: 'true',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Weighted-Average Remaining Years to Accounting Term',
          data: 'WeightedAverageYearsRemainingToAccountingTerm',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Weighted-Average Remaining Years to Expiration',
          data: 'WeightedAverageYearsRemainingToExpiration',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Weighted-Average Incremental Borrowing Rate',
          data: 'WeightedAverageDiscountRate',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Total Undiscounted Lease Liability',
          data: 'TotalUndiscountedLeaseLiability',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Imputed Interest',
          data: 'ImputedInterest',
        },
        {
          LeaseTemplate: 'LeaseTemplate',
          Display: 'Total Discounted Lease Liability',
          data: 'TotalDiscountedLeaseLiability',
        },
      ],
    },
    {
      index: 7,
      name: 'Future Commitments',
      allowToggleCardView: false,
      defaultCardView: 'pivotGrid',
      showMenuSave: false,
      showMenuReset: false,
      chartActive: false,
      chartVisible: false,
      id: 'IFRS16-Quarterly-Future-Commitments',
      width: 200,
      sortingOrder: {},
      fillMissingYears: true,
      filterData: [
        { displayKey: '5 years', valueKey: 6 },
        { displayKey: '10 years', valueKey: 11 },
      ],
      filterBy: 'PeriodYear',
      filterInitialValue: { displayKey: '5 years', valueKey: 6 },
      cardJSONSchema: [
        {
          dataField: 'PeriodYear',
          area: 'row',
          expanded: true,
        },
        {
          dataField: 'LeaseTemplate',
          area: 'column',
          expanded: 'true',
        },
        {
          dataField: 'data',
          area: 'data',
          summaryType: 'sum',
        },
      ],
      fieldTransform: [
        {
          LeaseTemplate: 'LeaseTemplate',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'LeaseTemplate',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
        {
          LeaseTemplate: 'Total',
          PeriodYear: 'PeriodYear',
          data: 'ScheduledPaymentsReporting',
          modify: {
            replace: 'ScheduledPaymentsReporting',
            newData: 'RemainingPaymentsReporting',
            compareWith: 'PeriodYear',
            compareWithX: 'LeaseTemplate',
            offset: -1,
            indexes: 'last',
            caption: 'Thereafter',
          },
        },
      ],
    },
  ],
};
