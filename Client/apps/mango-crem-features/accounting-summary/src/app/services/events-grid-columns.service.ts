import { Injectable } from '@angular/core';
import { FormattingService } from './formatting.service';
import { PortfolioSettingsResponse } from '@accounting-summary/models/portfolio-settings-response.modal';

@Injectable({
  providedIn: 'root',
})
export class EventsGridColumnsService {
  constructor(private formattingService: FormattingService) {}

  getDetailsColumns(
    classificationId: number,
    currencyInfo,
    portfolioSettings: PortfolioSettingsResponse,
    dateFormat: string
  ) {
    const columns = [];

    columns.push(
      {
        caption: 'Actions',
        name: 'actionsColumn',
        dataField: 'leaseRecognitionScheduleId',
        width: 100,
        alignment: 'center',
        cellTemplate: 'actionsTemplate',
        headerCellTemplate: 'accountingEventHeader',
        allowHiding: false,
        allowReordering: false,
        allowResizing: false,
        fixed: true,
        fixedPosition: 'right',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      },
      {
        caption: '#',
        dataField: 'scheduleIndex',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        allowHiding: false,
        allowReordering: false,
        allowResizing: false,
        width: 30,
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      },
      {
        caption: 'Event ID',
        dataField: 'leaseRecognitionScheduleID',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        visible: false,
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      },
      {
        caption: 'Classification',
        dataField: 'classificationType',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        visible: false,
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      },
      {
        caption: 'Amortization Profile',
        dataField: 'amortizationProfileName',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        visible: false,
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      },
      {
        caption: 'Is Published',
        dataField: 'isPublished',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        visible: false,
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        calculateCellValue: (rowData) => (rowData.isPublished ? 'Yes' : 'No'),
      },
      {
        caption: 'Measure Event',
        name: 'MeasureEvent',
        dataField: 'measureEvent',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      },
      {
        caption: 'Status',
        name: 'JEStatus',
        dataField: 'jeStatus',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      },
      {
        caption: 'JE Profile',
        name: 'JEProfile',
        dataField: 'journalEntryProfileName',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      },
      {
        caption: 'Begin Date Option',
        dataField: 'beginDateOption',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        visible: false,
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      },
      {
        caption: 'Begin Date',
        dataField: 'beginDate',
        dataType: 'date',
        format: dateFormat,
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      },
      {
        caption: 'End Date Option',
        dataField: 'endDateOption',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        visible: false,
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      },
      {
        caption: 'End Date',
        dataField: 'endDate',
        dataType: 'date',
        format: dateFormat,
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      },
      {
        caption: 'Term (Years)',
        dataField: 'termInYears',
        alignment: 'right',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        calculateCellValue: (rowData) =>
          (Math.round(rowData.termInYears * 10000) / 10000).toFixed(2),
      },
      {
        caption: 'Term (Months)',
        dataField: 'termInMonths',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        visible: false,
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) => value.toFixed(2),
      },
      {
        caption: 'Term (Days)',
        dataField: 'termInDays',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        visible: portfolioSettings?.leaseRecognitionCalendarID != 1,
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) => this.formattingService.formatNumber(+value, 0),
      },
      {
        caption: 'Term',
        dataField: 'termString',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        visible: false,
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      }
    );

    if (classificationId !== 4 && classificationId !== 5) {
      columns.push({
        caption: 'Remaining Economic Life',
        dataField: 'economicLifeYears',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        visible: false,
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) => value.toFixed(2),
      });
    }

    if (classificationId !== 0 && classificationId !== 5) {
      columns.push({
        caption: 'Payment Timing',
        dataField: 'paymentTiming',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        visible: false,
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      });
    }

    columns.push({
      caption: 'Compound Frequency',
      dataField: 'compoundFrequencyType',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      visible: false,
      appendsCurrency: 'false',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'false',
    });

    // leaseRecognitionCalendarID = 1 means that it is a standard calendar
    if (portfolioSettings?.leaseRecognitionCalendarID === 1) {
      columns.push({
        caption: '# of Periods',
        dataField: 'termInPeriods',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        alignment: 'right',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) => value.toFixed(2),
      });
    }

    columns.push({
      caption: 'Undiscounted Amount (' + currencyInfo.localCurrency + ')',
      dataField: 'totalAmount',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'true',
      usesLocalFormat: 'true',
      usesFunctionalFormat: 'false',
      format: (value) =>
        this.formattingService.localFormat(
          +value,
          currencyInfo.localCurrencyDecimalPrecision
        ),
    });

    columns.push({
      caption: 'Transaction Amount (' + currencyInfo.localCurrency + ')',
      dataField: 'totalTransactions',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      visible: false,
      appendsCurrency: 'true',
      usesLocalFormat: 'true',
      usesFunctionalFormat: 'false',
      format: (value) =>
        this.formattingService.localFormat(
          +value,
          currencyInfo.localCurrencyDecimalPrecision
        ),
    });

    columns.push({
      caption: 'Option Amount (' + currencyInfo.localCurrency + ')',
      dataField: 'totalOptions',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      visible: false,
      appendsCurrency: 'true',
      usesLocalFormat: 'true',
      usesFunctionalFormat: 'false',
      format: (value) =>
        this.formattingService.localFormat(
          +value,
          currencyInfo.localCurrencyDecimalPrecision
        ),
    });

    columns.push({
      caption: 'Other Charges Amount (' + currencyInfo.localCurrency + ')',
      dataField: 'totalOtherCharges',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      visible: false,
      appendsCurrency: 'true',
      usesLocalFormat: 'true',
      usesFunctionalFormat: 'false',
      format: (value) =>
        this.formattingService.localFormat(
          +value,
          currencyInfo.localCurrencyDecimalPrecision
        ),
    });

    columns.push({
      caption: 'Discount Rate Profile',
      dataField: 'discountRateProfileName',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      visible: false,
      appendsCurrency: 'false',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'false',
    });

    columns.push({
      caption: 'Discount Rate',
      dataField: 'discountRateDisplay',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'false',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'false',
    });

    if (classificationId !== 4 && classificationId !== 5) {
      columns.push({
        caption: 'Implicit Interest Rate',
        dataField: 'implicitRate',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        visible: false,
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) => (value * 100).toFixed(4) + '%',
      });
    }

    columns.push({
      caption: 'Effective Rate',
      dataField: 'effectiveRate',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      visible: false,
      appendsCurrency: 'false',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'false',
      format: (value) => value.toFixed(4),
    });

    columns.push({
      caption: 'Present Value (' + currencyInfo.localCurrency + ')',
      dataField: 'presentValue',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'clickable',
      appendsCurrency: 'true',
      usesLocalFormat: 'true',
      usesFunctionalFormat: 'false',
      format: (value) =>
        this.formattingService.localFormat(
          +value,
          currencyInfo.localCurrencyDecimalPrecision
        ),
    });

    if (classificationId !== 4 && classificationId !== 5) {
      columns.push({
        caption: 'Fair Market Value',
        dataField: 'fmv',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        visible: false,
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) =>
          this.formattingService.localFormat(
            +value,
            currencyInfo.localCurrencyDecimalPrecision
          ),
      });
    }

    // ==========================================================================================
    switch (classificationId) {
      case 0: // Operating 840
        columns.push({
          caption:
            portfolioSettings?.leaseRecognitionCalendarID != 1
              ? 'Straight Line Expense Daily'
              : 'Straight Line Expense',
          dataField:
            portfolioSettings?.leaseRecognitionCalendarID != 1
              ? 'straightLineExpenseDaily'
              : 'straightLineExpense',
          format: (value) =>
            portfolioSettings?.leaseRecognitionCalendarID != 1
              ? this.formattingService.formatNumber(+value, 14)
              : this.formattingService.localFormat(
                  +value,
                  currencyInfo.localCurrencyDecimalPrecision
                ),
          headerCellTemplate: 'accountingEventHeader',
          cellTemplate: 'pointer',
          appendsCurrency: 'false',
          usesLocalFormat: 'true',
          usesFunctionalFormat: 'false',
        });

        this.addBalanceColumns(columns, currencyInfo, classificationId);
        break;

      case 1: // Capital 840
      case 6: // Sales Type (Lessor)
        this.addBalanceColumns(columns, currencyInfo, classificationId);
        break;

      case 2: // Finance 842
      case 4: // IFRS 16
        if (portfolioSettings?.functionalCurrencyEnabled) {
          this.addFunctionalBalanceColumns(
            columns,
            currencyInfo,
            classificationId
          );
        } else {
          this.addBalanceColumns(columns, currencyInfo, classificationId);
        }

        columns.push({
          caption: 'Asset Amortization',
          dataField: 'assetAmortization',
          headerCellTemplate: 'accountingEventHeader',
          cellTemplate: 'pointer',
          appendsCurrency: 'false',
          usesLocalFormat: 'true',
          usesFunctionalFormat: 'false',
          format: (value) =>
            this.formattingService.localFormat(
              +value,
              currencyInfo.localCurrencyDecimalPrecision
            ),
        });
        break;

      case 3: // Operating 842
        if (portfolioSettings?.functionalCurrencyEnabled) {
          this.addFunctionalBalanceColumns(
            columns,
            currencyInfo,
            classificationId
          );
        } else {
          this.addBalanceColumns(columns, currencyInfo, classificationId);
        }

        if (portfolioSettings?.functionalCurrencyEnabled) {
          columns.push({
            caption: 'Level Expense (' + currencyInfo.functionalCurrency + ')',
            dataField: 'functionalLevelExpense',
            headerCellTemplate: 'accountingEventHeader',
            cellTemplate: 'pointer',
            appendsCurrency: 'true',
            usesLocalFormat: 'false',
            usesFunctionalFormat: 'true',
            alignment: 'right',
            format: (value) =>
              this.formattingService.localFormat(
                +value,
                currencyInfo.functionalCurrencyDecimalPrecision
              ),
          });
        } else {
          columns.push({
            caption: 'Level Expense (' + currencyInfo.localCurrency + ')',
            dataField: 'levelExpense',
            headerCellTemplate: 'accountingEventHeader',
            cellTemplate: 'pointer',
            appendsCurrency: 'true',
            usesLocalFormat: 'true',
            usesFunctionalFormat: 'false',
            alignment: 'right',
            format: (value) =>
              this.formattingService.localFormat(
                +value,
                currencyInfo.localCurrencyDecimalPrecision
              ),
          });
        }
        break;

      case 5: // Operating (Lessor)
        columns.push({
          caption:
            portfolioSettings?.leaseRecognitionCalendarID != 1
              ? 'Straight Line Income Daily'
              : 'Straight Line Income',
          dataField:
            portfolioSettings?.leaseRecognitionCalendarID != 1
              ? 'straightLineExpenseDaily'
              : 'straightLineExpense',
          format: (value) =>
            portfolioSettings?.leaseRecognitionCalendarID != 1
              ? this.formattingService.formatNumber(+value, 14)
              : this.formattingService.localFormat(
                  +value,
                  currencyInfo.localCurrencyDecimalPrecision
                ),
          headerCellTemplate: 'accountingEventHeader',
          cellTemplate: 'pointer',
          appendsCurrency: 'false',
          usesLocalFormat: 'true',
          usesFunctionalFormat: 'false',
        });

        this.addBalanceColumns(columns, currencyInfo, classificationId);
        break;
    }

    // ==========================================================================================
    // Every type gets currency, comments, lastmodifiedby, and lastmodified date
    // as the last columns.
    if (
      classificationId === 2 ||
      classificationId === 3 ||
      classificationId === 4
    ) {
      if (portfolioSettings?.functionalCurrencyEnabled) {
        columns.push({
          caption:
            'ROU Asset Obtained Amount (' +
            currencyInfo.functionalCurrency +
            ')',
          dataField: 'functionalROUAssetObtainedAmount',
          headerCellTemplate: 'accountingEventHeader',
          cellTemplate: 'pointer',
          appendsCurrency: 'true',
          usesLocalFormat: 'false',
          usesFunctionalFormat: 'true',
          alignment: 'right',
          format: (value) =>
            this.formattingService.localFormat(
              +value,
              currencyInfo.functionalCurrencyDecimalPrecision
            ),
        });
      } else {
        columns.push({
          caption:
            'ROU Asset Obtained Amount (' + currencyInfo.localCurrency + ')',
          dataField: 'rouAssetObtainedAmount',
          headerCellTemplate: 'accountingEventHeader',
          cellTemplate: 'pointer',
          appendsCurrency: 'true',
          usesLocalFormat: 'true',
          usesFunctionalFormat: 'false',
          alignment: 'right',
          format: (value) =>
            this.formattingService.localFormat(
              +value,
              currencyInfo.localCurrencyDecimalPrecision
            ),
        });
      }

      columns.push({
        caption: 'ROU Asset Obtained Date',
        dataField: 'rouAssetObtainedDate',
        headerCellTemplate: 'accountingEventHeader',
        dataType: 'date',
        format: dateFormat,
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      });

      columns.push({
        caption: 'ROU Asset Obtained Method',
        dataField: 'rouAssetObtainedMethod',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      });
    }

    columns.push({
      caption: 'Currency',
      dataField: 'currencyDisplay',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'false',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'false',
    });

    if (classificationId !== 4 && classificationId !== 5) {
      columns.push({
        caption: 'Test 1',
        dataField: 'test1',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        calculateCellValue: (rowData) =>
          rowData.test1 ? 'Yes' : rowData.test1 === null ? '' : 'No',
      });

      columns.push({
        caption: 'Test 2',
        dataField: 'test2',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        calculateCellValue: (rowData) =>
          rowData.test2 ? 'Yes' : rowData.test2 === null ? '' : 'No',
      });

      columns.push({
        caption: 'Test 3',
        dataField: 'test3',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) => `${value.toFixed(2)}%`,
      });

      columns.push({
        caption: 'Test 4',
        dataField: 'test4',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) => `${value.toFixed(2)}%`,
      });

      if (classificationId !== 0 && classificationId !== 1) {
        columns.push({
          caption: 'Test 5',
          dataField: 'test5',
          headerCellTemplate: 'accountingEventHeader',
          visible: false,
          cellTemplate: 'pointer',
          appendsCurrency: 'false',
          usesLocalFormat: 'false',
          usesFunctionalFormat: 'false',
          calculateCellValue: (rowData) =>
            rowData.test5 ? 'Yes' : rowData.test5 === null ? '' : 'No',
        });
      }

      columns.push({
        caption: 'Classification Test Result',
        dataField: 'classificationTestResult',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      });

      columns.push({
        caption: 'Classification Test Reason',
        dataField: 'classificationTestResultReason',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
      });

      columns.push({
        caption: 'Classification Matches Result (Yes/No)',
        dataField: 'isClassificationTestResultMatched',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        calculateCellValue: (rowData) => {
          if (rowData.isClassificationTestResultMatched === true) {
            return 'Yes';
          } else if (rowData.isClassificationTestResultMatched === false) {
            return 'No';
          } else {
            return 'Incomplete';
          }
        },
      });
    }

    if (classificationId !== 0 && classificationId !== 5) {
      columns.push({
        caption: 'Estimated Residual Value',
        dataField: 'estimatedResidualValue',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) =>
          this.formattingService.localFormat(
            +value,
            currencyInfo.localCurrencyDecimalPrecision
          ),
      });

      columns.push({
        caption: 'Guaranteed Amount Reflected in Payments',
        dataField: 'guaranteedAmtReflectedInPayments',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) =>
          this.formattingService.localFormat(
            +value,
            currencyInfo.localCurrencyDecimalPrecision
          ),
      });

      columns.push({
        caption: 'Residual Value Guaranteed',
        dataField: 'residualValue',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) =>
          this.formattingService.localFormat(
            +value,
            currencyInfo.localCurrencyDecimalPrecision
          ),
      });

      columns.push({
        caption: 'Lessor Explicitly Exempts Lessee',
        dataField: 'doesLessorExplicitlyExemptLessee',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        calculateCellValue: (rowData) =>
          rowData.doesLessorExplicitlyExemptLessee ? 'Yes' : 'No',
      });

      columns.push({
        caption: 'Residual Value Guaranteed by 3rd Party',
        dataField: 'residualValueGuaranteedBy3rdParty',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) =>
          this.formattingService.localFormat(
            +value,
            currencyInfo.localCurrencyDecimalPrecision
          ),
      });

      columns.push({
        caption: 'Residual Value Guaranteed by Lessee',
        dataField: 'residualValueGuaranteedByLessee',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) =>
          this.formattingService.localFormat(
            +value,
            currencyInfo.localCurrencyDecimalPrecision
          ),
      });

      columns.push({
        caption: 'Amount Probable of Being Owed by Lessee',
        dataField: 'amountProbableOfBeingOwedByLessee',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) =>
          this.formattingService.localFormat(
            +value,
            currencyInfo.localCurrencyDecimalPrecision
          ),
      });

      columns.push({
        caption: 'Unguaranteed Residual Value',
        dataField: 'unguaranteedResidualValue',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) =>
          this.formattingService.localFormat(
            +value,
            currencyInfo.localCurrencyDecimalPrecision
          ),
      });

      columns.push({
        caption: 'Amount Not Reflected in Present Value of Payments',
        dataField: 'amtNotReflectedInPVofPayments',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) =>
          this.formattingService.localFormat(
            +value,
            currencyInfo.localCurrencyDecimalPrecision
          ),
      });

      columns.push({
        caption: 'Present Value of Amount Not Reflected in Payments',
        dataField: 'presentValueOnAmtNotReflectedInPayments',
        headerCellTemplate: 'accountingEventHeader',
        visible: false,
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        format: (value) =>
          this.formattingService.localFormat(
            +value,
            currencyInfo.localCurrencyDecimalPrecision
          ),
      });
    }

    columns.push({
      caption: 'Reporting Exception',
      dataField: 'isReportingException',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'false',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'false',
      calculateCellValue: (rowData) =>
        rowData.isReportingException ? 'Yes' : 'No',
    });

    columns.push({
      caption: 'Exception Reason',
      dataField: 'exceptionReason',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      visible: false,
      appendsCurrency: 'false',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'false',
    });

    columns.push({
      caption: 'Charge Type',
      dataField: 'isIncome',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'false',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'false',
      calculateCellValue: (rowData) =>
        rowData.isIncome ? 'Income' : 'Expense',
    });

    columns.push({
      caption: 'Include Charges Due on First (Yes/No)',
      dataField: 'includeFromFirst',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      visible: false,
      appendsCurrency: 'false',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'false',
      calculateCellValue: (rowData) =>
        rowData.includeFromFirst ? 'Yes' : 'No',
    });

    if (classificationId !== 0 && classificationId !== 5) {
      columns.push({
        caption: 'Impaired',
        dataField: 'isImpaired',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        appendsCurrency: 'false',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'false',
        calculateCellValue: (rowData) => (rowData.isImpaired ? 'Yes' : 'No'),
      });
    }

    columns.push({
      caption: 'Comments',
      dataField: 'comments',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'false',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'false',
    });

    columns.push({
      caption: 'Last Modified By',
      dataField: 'lastModifiedBy',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'false',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'false',
    });

    columns.push({
      caption: 'Last Modified Date',
      dataField: 'lastModified',
      dataType: 'date',
      format: dateFormat + ' HH:mm:ss',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'false',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'false',
    });

    columns.push({
      caption: 'Batch ID',
      dataField: 'batchID',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      visible: false,
      appendsCurrency: 'false',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'false',
    });

    columns.push({
      caption: 'Source Import ID',
      dataField: 'sourceImportID',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      visible: false,
      appendsCurrency: 'false',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'false',
    });

    columns.forEach((c) => {
      c.allowSorting = c.dataField == 'scheduleIndex' ? true : false;
    });

    return columns;
  }

  // ==========================================================================================
  private addBalanceColumns(columns, currencyInfo, classificationId) {
    columns.push({
      caption: 'Direct Costs (' + currencyInfo.localCurrency + ')',
      dataField: 'directCosts',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      visible: classificationId !== 0 && classificationId !== 5 ? true : false,
      appendsCurrency: 'true',
      usesLocalFormat: 'true',
      usesFunctionalFormat: 'false',
      format: (value) =>
        this.formattingService.localFormat(
          +value,
          currencyInfo.localCurrencyDecimalPrecision
        ),
    });

    columns.push({
      caption: 'System Adjustment',
      dataField: 'systemAssetAdjustment',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'true',
      usesLocalFormat: 'true',
      usesFunctionalFormat: 'false',
      visible: false,
      format: (value) =>
        this.formattingService.localFormat(
          +value,
          currencyInfo.localCurrencyDecimalPrecision
        ),
    });

    columns.push({
      caption: 'Manual Adjustment',
      dataField: 'manualAssetAdjustment',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'true',
      usesLocalFormat: 'true',
      usesFunctionalFormat: 'false',
      visible: false,
      format: (value) =>
        this.formattingService.localFormat(
          +value,
          currencyInfo.localCurrencyDecimalPrecision
        ),
    });

    columns.push({
      caption: 'Total Adjustment',
      dataField: 'adjustment',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      visible: classificationId === 0 || classificationId === 5 ? true : false,
      appendsCurrency: 'true',
      usesLocalFormat: 'true',
      usesFunctionalFormat: 'false',
      format: (value) =>
        this.formattingService.localFormat(
          +value,
          currencyInfo.localCurrencyDecimalPrecision
        ),
    });

    if (classificationId !== 0 && classificationId !== 5) {
      columns.push({
        caption: 'Liability Adjustment',
        dataField: 'liabilityAdjustmentAmount',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        appendsCurrency: 'true',
        usesLocalFormat: 'true',
        usesFunctionalFormat: 'false',
        visible: false,
        format: (value) =>
          this.formattingService.localFormat(
            +value,
            currencyInfo.localCurrencyDecimalPrecision
          ),
      });
    }

    columns.push({
      caption: 'Termination Fee',
      dataField: 'terminationFee',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'true',
      usesLocalFormat: 'true',
      usesFunctionalFormat: 'false',
      visible: false,
      format: (value) =>
        this.formattingService.localFormat(
          +value,
          currencyInfo.localCurrencyDecimalPrecision
        ),
    });

    if (classificationId !== 0 && classificationId !== 5) {
      columns.push({
        caption: 'Gain/Loss',
        dataField: 'adjustmentGainLoss',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        appendsCurrency: 'true',
        usesLocalFormat: 'true',
        usesFunctionalFormat: 'false',
        visible: false,
        format: (value) =>
          this.formattingService.localFormat(
            +value,
            currencyInfo.localCurrencyDecimalPrecision
          ),
      });

      if (classificationId !== 1) {
        columns.push({
          caption:
            'Beginning Asset Balance (' + currencyInfo.localCurrency + ')',
          dataField: 'openingAssetBalance',
          headerCellTemplate: 'accountingEventHeader',
          cellTemplate: 'pointer',
          appendsCurrency: 'true',
          usesLocalFormat: 'true',
          usesFunctionalFormat: 'false',
          visible: classificationId !== 1 ? true : false,
          format: (value) =>
            this.formattingService.localFormat(
              +value,
              currencyInfo.localCurrencyDecimalPrecision
            ),
        });

        columns.push({
          caption:
            'Beginning Liability Balance (' + currencyInfo.localCurrency + ')',
          dataField: 'openingLiabilityBalance',
          headerCellTemplate: 'accountingEventHeader',
          cellTemplate: 'pointer',
          appendsCurrency: 'true',
          usesLocalFormat: 'true',
          usesFunctionalFormat: 'false',
          visible: classificationId !== 1 ? true : false,
          format: (value) =>
            this.formattingService.localFormat(
              +value,
              currencyInfo.localCurrencyDecimalPrecision
            ),
        });
      }
    }
  }

  private addFunctionalBalanceColumns(columns, currencyInfo, classificationId) {
    columns.push({
      caption: 'Direct Costs (' + currencyInfo.functionalCurrency + ')',
      dataField: 'functionalDirectCosts',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'true',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'true',
      format: (value) =>
        this.formattingService.functionalFormat(
          +value,
          currencyInfo.functionalCurrencyDecimalPrecision
        ),
    });

    columns.push({
      caption: 'System Adjustment (' + currencyInfo.functionalCurrency + ')',
      dataField: 'functionalSystemAssetAdjustment',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'true',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'true',
      visible: false,
      format: (value) =>
        this.formattingService.functionalFormat(
          +value,
          currencyInfo.functionalCurrencyDecimalPrecision
        ),
    });

    columns.push({
      caption: 'Manual Adjustment (' + currencyInfo.functionalCurrency + ')',
      dataField: 'functionalManualAssetAdjustment',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'true',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'true',
      visible: false,
      format: (value) =>
        this.formattingService.functionalFormat(
          +value,
          currencyInfo.functionalCurrencyDecimalPrecision
        ),
    });

    columns.push({
      caption: 'Total Adjustment',
      dataField: 'adjustment',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'true',
      usesLocalFormat: 'true',
      usesFunctionalFormat: 'false',
      visible: classificationId === 0 || classificationId === 5 ? true : false,
      format: (value) =>
        this.formattingService.localFormat(
          +value,
          currencyInfo.localCurrencyDecimalPrecision
        ),
    });

    if (classificationId !== 0 && classificationId !== 5) {
      columns.push({
        caption: 'Liability Adjustment',
        dataField: 'liabilityAdjustmentAmount',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        appendsCurrency: 'true',
        usesLocalFormat: 'true',
        usesFunctionalFormat: 'false',
        visible: false,
        format: (value) =>
          this.formattingService.localFormat(
            +value,
            currencyInfo.localCurrencyDecimalPrecision
          ),
      });
    }

    columns.push({
      caption: 'Termination Fee (' + currencyInfo.functionalCurrency + ')',
      dataField: 'functionalTerminationFee',
      headerCellTemplate: 'accountingEventHeader',
      cellTemplate: 'pointer',
      appendsCurrency: 'true',
      usesLocalFormat: 'false',
      usesFunctionalFormat: 'true',
      visible: false,
      format: (value) =>
        this.formattingService.functionalFormat(
          +value,
          currencyInfo.functionalCurrencyDecimalPrecision
        ),
    });

    if (classificationId !== 0 && classificationId !== 5) {
      columns.push({
        caption: 'Gain/Loss (' + currencyInfo.functionalCurrency + ')',
        dataField: 'functionalAdjustmentGainLoss',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        appendsCurrency: 'true',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'true',
        visible: false,
        format: (value) =>
          this.formattingService.functionalFormat(
            +value,
            currencyInfo.functionalCurrencyDecimalPrecision
          ),
      });

      columns.push({
        caption:
          'Beginning Asset Balance (' + currencyInfo.functionalCurrency + ')',
        dataField: 'functionalOpeningAssetBalance',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        appendsCurrency: 'true',
        usesLocalFormat: 'false',
        usesFunctionalFormat: 'true',
        format: (value) =>
          this.formattingService.functionalFormat(
            +value,
            currencyInfo.functionalCurrencyDecimalPrecision
          ),
      });

      columns.push({
        caption:
          'Beginning Liability Balance (' + currencyInfo.localCurrency + ')',
        dataField: 'openingLiabilityBalance',
        headerCellTemplate: 'accountingEventHeader',
        cellTemplate: 'pointer',
        appendsCurrency: 'true',
        usesLocalFormat: 'true',
        usesFunctionalFormat: 'false',
        format: (value) =>
          this.formattingService.localFormat(
            +value,
            currencyInfo.localCurrencyDecimalPrecision
          ),
      });
    }
  }
}
