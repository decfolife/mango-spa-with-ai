import { Injectable } from '@angular/core';
import { evaluate } from 'mathjs';

import {
  CardConfig,
  CardDataItem,
  CardDataItemModify,
} from '@mango/data-models/lib-data-models';
import {
  rowSort,
  GridType,
} from '@accounting-dashboard/shared/models/card-config.model';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';

@Injectable({
  providedIn: 'root',
})
export class UtilityService {
  private _debug = false as boolean;

  /**
   * Finds an element in an array of objects by ID and returns its index.
   * Used to locate a card given an {id} and a list of card configurations.
   *
   * @param {CardConfig[]} cardConfigs
   * @param {string} id
   * @return {number}
   * @memberof UtilityService
   */
  findObjectByID(cardConfigs: CardConfig[], id: string): number {
    return cardConfigs.findIndex((item) => item.id === id);
  }

  /**
   * It builds the DevExtreme's PivotGridDataSource object
   *
   * @param {Array<any>} IADCardData
   * @param {CardConfig[]} localCardConfig
   * @param {number} reportingYear
   * @param {Array<any>} cardFieldConfigs
   * @return {*}  {{ pivotDataSources: Array<PivotGridDataSource>; gridDataSources: Array<any> }}
   * @memberof InAppDisclosureService
   */
  public buildDataSources(
    IADCardData: Array<any>,
    localCardConfig: CardConfig[],
    reportingYear: number,
    cardFieldConfigs: CardConfig[],
    debug?: boolean
  ): {
    pivotDataSources: Array<PivotGridDataSource>;
    gridDataSources: Array<any>;
  } {
    this._debug = debug;
    const pivotDataSources: Array<PivotGridDataSource> = [];
    const gridDataSources: Array<any> = [];
    const skipIndex: Array<number> = []; // Keep track of indexes to skip if they has been merged with other IADCardData
    const IADCards = [...IADCardData];
    const debugObject = [];

    localCardConfig.map((cardConfig, i: number) => {
      // If localCardConfig doesn't exist for the IADCardConfig skip iteration
      if (!IADCards[i]) {
        console.error(
          'There is a configuration mismatch between localCardConfig and IADCardData'
        );
        return;
      }

      // iterate per cardData.ts configuration object
      let pivotGrid: PivotGridDataSource;
      let dataGrid: any;

      if (cardConfig.combineWithIndex && cardConfig.combineWithIndex !== 0) {
        // 1) Merge Cards
        const mergedCards = this.mergeArraysOfObjects(
          IADCards[i],
          IADCards[cardConfig.combineWithIndex],
          cardConfig.mergeBy
        );
        // 2) Set Pivot Grid
        pivotGrid = this.setPivotGrid(
          mergedCards,
          cardFieldConfigs[i],
          cardConfig,
          reportingYear
        );
        // 3) Set Data Grid
        dataGrid = this.setDataGrid(
          mergedCards,
          cardFieldConfigs[i],
          cardConfig,
          reportingYear
        );
        skipIndex.push(cardConfig.combineWithIndex); // Keep track of the used index
        IADCards.splice(cardConfig.combineWithIndex, 1); // Removed IADCardData index because it was merged
        debugObject.push({
          id: cardConfig.id,
          i: i,
          cardConfig: cardConfig,
          IADCardsI: IADCards[i],
          cardConfigsI: cardFieldConfigs[i],
          mergedCards: mergedCards,
          pivotGrid: pivotGrid,
          dataGrid: dataGrid,
        });
      } else {
        // 1) Set Pivot Grid
        pivotGrid = this.setPivotGrid(
          IADCards[i],
          cardFieldConfigs[i],
          cardConfig,
          reportingYear
        );
        // 2) Set Data Grid
        dataGrid = this.setDataGrid(
          IADCards[i],
          cardFieldConfigs[i],
          cardConfig,
          reportingYear
        );
        debugObject.push({
          id: cardConfig.id,
          i: i,
          cardConfig: cardConfig,
          IADCardsI: IADCards[i],
          cardConfigsI: cardFieldConfigs[i],
          pivotGrid: pivotGrid,
          dataGrid: dataGrid,
        });
      }
      // 1) Build the Pivot and Data Grid
      pivotDataSources.push(pivotGrid);
      gridDataSources.push(dataGrid);
    });

    this._debug && console.debug('debugObject', debugObject);

    return { pivotDataSources, gridDataSources };
  }

  /**
   *
   *
   * @param {Array<any>} IADCardData
   * @param {*} fieldConfig
   * @param {CardConfig} cardConfig
   * @param {number} [reportingYear]
   * @param {number} [paramEnd]
   * @return {*}
   * @memberof UtilityService
   */
  setDataGrid(
    IADCardData: Array<any>,
    fieldConfig: any,
    cardConfig: CardConfig,
    reportingYear?: number,
    paramEnd?: number
  ) {
    const dataGrid: Partial<CardDataItem>[] = this.mapFieldsDataGrid(
      IADCardData,
      cardConfig,
      reportingYear,
      paramEnd
    );
    return this.removeBlankAttributes(dataGrid);
  }

  /**
   * Data Grid Field Configuration
   *
   * @param {Array<any>} IADCardData
   * @param {CardConfig} cardConfig
   * @param {number} [paramStart]
   * @param {number} [paramEnd]
   * @return {*}
   * @memberof UtilityService
   */
  mapFieldsDataGrid(
    IADCardData: Array<any>,
    cardConfig: CardConfig,
    paramStart?: number,
    paramEnd?: number
  ) {
    // Pre-filter IADCardData
    if (paramStart && cardConfig.filterInitialValue) {
      const endPeriod = !paramEnd
        ? Number(cardConfig.filterInitialValue.valueKey)
        : paramEnd;
      IADCardData = this.filterByKey(
        IADCardData,
        paramStart,
        paramStart + endPeriod
      );
    }

    // Transform cardData according to fieldTransform.modify object
    IADCardData = this.modifyCardData(IADCardData, cardConfig);

    return IADCardData;
  }

  /**
   * Set the DevExtreme PivotGrid data source object
   *
   * @param {Array<any>} IADCardData
   * @param {*} fieldConfig
   * @param {CardConfig} cardConfig
   * @param {number} [reportingYear]
   * @return {*}  {PivotGridDataSource}
   * @memberof InAppDisclosureService
   */
  setPivotGrid(
    IADCardData: Array<any>,
    fieldConfig: any,
    cardConfig: CardConfig,
    reportingYear?: number,
    paramEnd?: number
  ): PivotGridDataSource {
    const pivotCardDataStore: Partial<CardDataItem>[] = this.mapFieldsPivotGrid(
      IADCardData,
      cardConfig,
      reportingYear,
      paramEnd
    );
    // Create Pivot Grid
    const dataSource: PivotGridDataSource = new PivotGridDataSource({
      store: pivotCardDataStore,
      fields: fieldConfig,
    });

    return dataSource;
  }

  /**
   * It constructs the fieldConfig by parsing the CardJSONSchema (i.e., JSON.parse(card.CardJSONSchema))
   * from the cardConfig and localCardConfig.
   *
   * The localCardConfig has higher priority than the cardConfig coming from the service. Therefore,
   * the final fieldConfig will primarily use the localCardConfig if defined; otherwise, it will fall
   * back to the cardConfig.
   *
   * @param {*} IADCardConfig: API response from inAppDisclosureService.getIADCardConfigs
   * @param {*} localCardConfig: Local CardConfig
   * @param {number} decimalPrecision
   * @return {*}  {CardConfig[]}
   * @memberof InAppDisclosureService
   */
  configureFieldsPerCard(
    IADCardConfig,
    localCardConfig: CardConfig[],
    decimalPrecision: number
  ): CardConfig[] {
    const fieldConfigs: Array<any> = [];

    IADCardConfig?.map((card, i) => {
      // If localCardConfig doesn't exist for the IADCardConfig skip iteration
      if (!localCardConfig[i]) {
        console.error(
          'There is a count mismatch between localCardConfig and IADCardConfig'
        );
        return;
      }

      // The PivotGrid Field configuration using the CardJSONSchema
      let fieldConfig: Array<any>;
      if (localCardConfig[i].cardJSONSchema) {
        fieldConfig = localCardConfig[i].cardJSONSchema; // Get Field Config from local client
      } else {
        fieldConfig = JSON.parse(card.CardJSONSchema); // Get Field Config from Mango_dashboards global conf
      }

      // Get Indexes of JSON Schema and apply methods
      const dataIndex: number = fieldConfig.findIndex(
        (e) => e.area === 'data' || e.dataField === 'data'
      );
      const rowIndex: number = fieldConfig.findIndex(
        (e) => e.area === 'row' || e.dataField === 'Display'
      );

      /**
       * Sorting using sortingMethod
       * @see https://js.devexpress.com/Angular/Documentation/ApiReference/Data_Layer/PivotGridDataSource/Configuration/fields/#sortingMethod
       */
      // Sorting Rows
      fieldConfig[rowIndex].sortingMethod = (a, b) =>
        rowSort(a, b, localCardConfig[i].sortingOrder);
      fieldConfig[dataIndex].sortingMethod = (a, b) =>
        rowSort(a, b, localCardConfig[i].sortingOrder);

      // Sorting Columns
      if (typeof localCardConfig[i].sortedColumnFieldName === 'object') {
        // When sortedColumnFieldName is a list
        for (const columnName in localCardConfig[i]
          .sortedColumnFieldName as any) {
          const columnIndex: number = fieldConfig.findIndex(
            (e) => e.dataField === columnName
          );
          if (columnIndex != -1) {
            const sortingOrder =
              localCardConfig[i].sortedColumnFieldName[columnName];
            fieldConfig[columnIndex].sortingMethod = (a, b) =>
              rowSort(a, b, sortingOrder);
          }
        }
      } else {
        // When sortedColumnFieldName is a string
        const columnIndex: number = fieldConfig.findIndex(
          (e) => e.dataField === localCardConfig[i].sortedColumnFieldName
        );
        if (columnIndex != -1) {
          const sortingOrder = localCardConfig[i].columnSortingOrder;
          fieldConfig[columnIndex].sortingMethod = (a, b) =>
            rowSort(a, b, sortingOrder);
        }
      }

      // Format Data
      if (localCardConfig[i]?.format || decimalPrecision) {
        fieldConfig[dataIndex].format = {
          type: localCardConfig[i]?.format?.type ?? 'fixedPoint',
          precision:
            localCardConfig[i]?.format?.precision ?? decimalPrecision ?? 2,
        };
      } else if (localCardConfig[i]?.format === null) {
        // When value is null we delete the key, to prevent false positives
        delete fieldConfig[dataIndex].format;
      }

      // Styling
      if (localCardConfig[i]?.width) {
        // Checks local cardConfigs, if false use API response
        fieldConfig[rowIndex].width = localCardConfig[i].width;
      } else if (localCardConfig[i]?.width === null) {
        delete fieldConfig[rowIndex].width;
      }

      // Summary: summaryType
      if (localCardConfig[i]?.summaryType) {
        fieldConfig[dataIndex].summaryType = localCardConfig[i].summaryType;
      } else if (localCardConfig[i]?.summaryType === null) {
        delete fieldConfig[dataIndex].summaryType;
      }

      // Summary: calculateSummaryValue
      switch (true) {
        case !!localCardConfig[i].summaryCellName &&
          !localCardConfig[i].summaryCellFormula: {
          // IF summaryCellName exists but summaryCellFormula not
          fieldConfig[dataIndex].calculateSummaryValue = (summaryCell) => {
            if (
              summaryCell.field('column')?.dataField ===
                localCardConfig[i].summaryCellName ||
              localCardConfig[i].summaryCellName.includes(
                summaryCell.field('column')?.dataField
              )
            )
              return summaryCell.value() / 2;
            else {
              if (summaryCell.value()) {
                return summaryCell.value();
              } else {
                return parseFloat('00').toFixed(
                  fieldConfig[dataIndex].format.precision
                );
              }
            }
          };
          break;
        }
        case !!localCardConfig[i].summaryCellName &&
          !!localCardConfig[i].summaryCellFormula: {
          // Use formula in a specific summaryCell
          fieldConfig[dataIndex].calculateSummaryValue = (summaryCell) => {
            if (
              summaryCell.field('column')?.dataField ===
                localCardConfig[i].summaryCellName ||
              localCardConfig[i].summaryCellName.includes(
                summaryCell.field('column')?.dataField
              )
            )
              return this.parseFormula(localCardConfig[i].summaryCellFormula, {
                x: summaryCell.value(),
                ...localCardConfig[i].summaryCellConstants,
              });
            else return summaryCell.value();
          };
          break;
        }
        case localCardConfig[i]?.calculateSummaryValue === null: {
          // Delete/overwrite if calculateSummaryValue is null
          delete fieldConfig[dataIndex].calculateSummaryValue;
          break;
        }
        case typeof localCardConfig[i]?.calculateSummaryValue === 'function': {
          // @deprecated, when passing the function directly
          fieldConfig[dataIndex].calculateSummaryValue =
            localCardConfig[i].calculateSummaryValue;
          break;
        }
        default: {
          // Just use the value
          fieldConfig[dataIndex].calculateSummaryValue = (summaryCell) =>
            summaryCell.value();
          break;
        }
      }

      // Summary: calculateCustomSummary
      if (localCardConfig[i]?.calculateCustomSummary) {
        fieldConfig[dataIndex].calculateCustomSummary =
          localCardConfig[i].calculateCustomSummary;
      } else if (localCardConfig[i]?.calculateCustomSummary === null) {
        delete fieldConfig[dataIndex].calculateCustomSummary;
      }
      // Push configuration Field
      fieldConfigs.push(fieldConfig);
    });

    return fieldConfigs;
  }

  /**
   * Merges two arrays of objects based on specified fields. By default, it uses 'DueYear' and 'PeriodYear'
   * as merge keys. If `mergeBy` is provided, it will be used instead. Additionally, it includes 'LeaseTemplate'
   * and 'DisclosureClassification' in the composite key if they exist in both `data1` and `data2`.
   *
   * @param {{ [key: string]: any }[]} data1 - The current cardData index (matching localCardConfig index)
   * 																					 containing the combineWithIndex field.
   * @param {{ [key: string]: any }[]} data2 - The combineWithIndex result, which is cardData[combineWithIndex],
   *                                           allowing data1 to merge with data2.
   * @param {Array<Record<string, string>>} [mergeBy] - Fields used for merging, where each Record maps
   *                                                   a field in `data1` to a corresponding field in `data2`.
   * @return {Array<object>} - The merged array of objects.
   * @memberof UtilityService
   */
  mergeArraysOfObjects(
    data1: { [key: string]: any }[],
    data2: { [key: string]: any }[],
    mergeBy?: Array<Record<string, string>>
  ): Array<object> {
    if (data1.length === 0 && data2.length === 0) return [];
    if (data1.length === 0) return data2;
    if (data2.length === 0) return data1;

    // Fallback merge logic if no `mergeBy` is provided
    const defaultMergeBy: Array<Record<string, string>> = [
      { DueYear: 'PeriodYear' },
    ];
    const mergeFields = mergeBy || defaultMergeBy;

    // Check if both `data1` and `data2` contain `LeaseTemplate` and `DisclosureClassification`
    const hasLeaseTemplate =
      data1.some((item) => 'LeaseTemplate' in item) &&
      data2.some((item) => 'LeaseTemplate' in item);
    const hasDisclosureClassification =
      data1.some((item) => 'DisclosureClassification' in item) &&
      data2.some((item) => 'DisclosureClassification' in item);

    // Create a Map from data2 using a composite key based on `mergeFields` and optional keys
    const hashMap = new Map<string, { [key: string]: any }>(
      data2.map((item2) => {
        const compositeKey = [
          ...mergeFields.map((field) => {
            const [key1, key2] = Object.entries(field)[0]; // Get the mapping key
            return item2[key2] ?? key2; // Use value from data2 or fallback to key2
          }),
          hasLeaseTemplate ? item2['LeaseTemplate'] : undefined,
          hasDisclosureClassification
            ? item2['DisclosureClassification']
            : undefined,
        ]
          .filter((key) => key !== undefined) // Remove undefined keys
          .join('-'); // Create a unique composite key

        // this._debug && console.debug('compositeKey',compositeKey)
        return [compositeKey, item2];
      })
    );
    // Track which items from data2 we've already used
    const usedItems = new Set<string>();

    // Merge data1 with data2 based on composite keys
    const mergedArray = data1.map((item1) => {
      const compositeKey = [
        ...mergeFields.map((field) => {
          const [key1, key2] = Object.entries(field)[0];
          return item1[key1] ?? key1; // Use value from data1 or fallback to key1
        }),
        hasLeaseTemplate ? item1['LeaseTemplate'] : undefined,
        hasDisclosureClassification
          ? item1['DisclosureClassification']
          : undefined,
      ]
        .filter((key) => key !== undefined) // Remove undefined keys
        .join('-'); // Create a unique composite key

      const itemToMerge = hashMap.get(compositeKey);
      if (itemToMerge && typeof itemToMerge === 'object') {
        // this._debug && console.debug(compositeKey,{ ...item1, ...itemToMerge })
        usedItems.add(compositeKey);
        return { ...item1, ...itemToMerge };
      }

      return item1;
    });

    // Add remaining items from data2 that weren't merged
    for (const [key, item] of hashMap.entries()) {
      if (!usedItems.has(key)) {
        mergedArray.push(item);
      }
    }
    // this._debug && console.debug({hasLeaseTemplate, hasDisclosureClassification,data1,data2,mergeBy,mergedArray})

    return mergedArray;
  }

  /**
   * Using fieldTransform map the local IADCardData and the API response
   * returns the transformedStor
   *
   * @param {Array<any>} IADCardData
   * @param {CardConfig} cardConfig
   * @param {number} [paramStart]
   * @param {number} [paramEnd]
   * @return {*}
   * @memberof InAppDisclosureService
   */
  mapFieldsPivotGrid(
    IADCardData: Array<any>,
    cardConfig: CardConfig,
    paramStart?: number,
    paramEnd?: number
  ) {
    const transformedStore: any = [];
    let sortingItems = [];

    // Row Ordering
    if (cardConfig?.sortingOrder) {
      sortingItems = Object.entries(cardConfig.sortingOrder).map(
        ([key]) => key
      );
    } else {
      // Create sortOrder based on fieldTransform configuration if sortingOrder doesn't exists
      sortingItems = Object.entries(
        this.createSortOrder(
          cardConfig.fieldTransform,
          cardConfig.cardJSONSchema[0].dataField // Use first element of the cardJSONSchema
        )
      ).map(([key]) => key);
    }

    if (!cardConfig?.fieldTransform) return IADCardData; // Nothing to transform, return IADCardData as is

    // Pre-filter IADCardData
    if (paramStart && cardConfig.filterInitialValue) {
      const endPeriod = !paramEnd // todo: if !filterInitialValue defaults to filterData[0]
        ? Number(cardConfig.filterInitialValue.valueKey)
        : paramEnd;
      IADCardData = this.filterByKey(
        IADCardData,
        paramStart,
        paramStart + endPeriod
      );
    }

    // Fill missing years BEFORE applying modify transformations
    if (cardConfig.fillMissingYears) {
      IADCardData = this.fillMissingYears(IADCardData, cardConfig, paramStart);
    }

    // Transform cardData according to fieldTransform.modify object
    IADCardData = this.modifyCardData(IADCardData, cardConfig);

    // Transform & map values according to fieldTransform
    IADCardData.map((e) => {
      const builtEntries: Partial<CardDataItem>[] = [];

      Object.entries(cardConfig.fieldTransform).forEach(([_, value], i) => {
        const transformedObject: Partial<CardDataItem> = {};

        Object.entries(value).forEach(([k, v]) => {
          switch (true) {
            case value.LeaseTemplate === 'Total' ||
              value.DisclosureClassification === 'Total': {
              switch (true) {
                case k === 'Display': {
                  transformedObject[k] = v;
                  break;
                }
                case k === 'LeaseTemplate': {
                  transformedObject[k] = v;
                  if (value.DisclosureClassification === 'Total')
                    // For the sub-columns of pivot grids
                    transformedObject['LeaseTemplate'] = e['LeaseTemplate'];
                  break;
                }
                case k === 'DisclosureClassification': {
                  transformedObject[k] = v;
                  if (value.DisclosureClassification === 'Total')
                    // For the sub-columns of pivot grids
                    transformedObject['LeaseTemplate'] =
                      e['DisclosureClassification'];
                  break;
                }
                case k === 'dataCalculation': {
                  // Perform custom calculation on the Total column
                  transformedObject['data'] = this.interpolateAndEvaluate(e, v);
                  break;
                }
                default:
                  transformedObject[k] = e[v];
                  break;
              }
              break;
            }
            case k === 'dataCalculation': {
              // Perform custom calculations on the row using dataCalculation field, and save the result in the data object.
              transformedObject['data'] = this.interpolateAndEvaluate(e, v);
              break;
            }
            default: {
              transformedObject[k] = e[v];
              break;
            }
          }
        });

        if (
          sortingItems &&
          value.LeaseTemplate !== 'Total' &&
          value.DisclosureClassification !== 'Total'
        ) {
          transformedObject['Display'] = sortingItems[i];
        }

        builtEntries.push(transformedObject);
      });

      this._debug && console.debug('builtEntries', builtEntries);

      transformedStore.push(...builtEntries);
    });
    return transformedStore;
  }

  /**
   * Fills in missing years with zero values for all dimension combinations.
   * Ensures maturity schedules show the full year range (5 or 10 years) even when data is missing.
   *
   * @param {Array<any>} IADCardData - The raw card data
   * @param {CardConfig} cardConfig - The card configuration
   * @param {number} [paramStart] - The starting year (reporting year) to begin filling from
   * @return {*}  {Array<any>} - Data with all years filled
   * @memberof UtilityService
   */
  fillMissingYears(
    IADCardData: Array<any>,
    cardConfig: CardConfig,
    paramStart?: number,
    debug = false
  ): Array<any> {
    this._debug = debug;
    if (!cardConfig.fillMissingYears || !cardConfig.filterInitialValue) {
      return IADCardData;
    }

    // Determine the year range from filterInitialValue
    const yearRange = Number(cardConfig.filterInitialValue.valueKey);
    if (!yearRange || isNaN(yearRange)) {
      return IADCardData;
    }

    // Determine starting and ending years from the data
    if (!IADCardData || IADCardData.length === 0) {
      return IADCardData;
    }

    const years = IADCardData.map((item) => Number(item.PeriodYear)).filter(
      (year) => !isNaN(year)
    );
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    if (!minYear || !maxYear || isNaN(minYear) || isNaN(maxYear)) {
      return IADCardData;
    }

    // Determine the starting year: use paramStart if provided and earlier than minYear
    const startYear = paramStart && paramStart < minYear ? paramStart : minYear;

    // Calculate the target end year based on starting year and range
    const targetEndYear = startYear + yearRange;

    // Extract unique dimension values from existing data
    const dimensions = this.extractDimensions(IADCardData);
    this._debug && console.debug('Extracted dimensions:', dimensions);

    // Start with existing data
    const completeData: Array<any> = [...IADCardData];

    // Add missing years at the BEGINNING (from startYear to minYear - 1)
    if (startYear < minYear) {
      const beginningEntries: Array<any> = [];
      // Future Commitments needs startYear + 1 (start at next year (the future))
      for (let year = startYear + 1; year < minYear; year++) {
        dimensions.combinations.forEach((combo) => {
          const zeroEntry = {
            PeriodYear: year,
            ...combo,
            ScheduledPaymentsReporting: 0,
            RemainingPaymentsReporting: 0,
          };
          this._debug &&
            console.debug(
              'Pushed missing year entry (beginning)',
              JSON.stringify(zeroEntry)
            );
          beginningEntries.push(zeroEntry);
        });
      }
      completeData.unshift(...beginningEntries);
    }

    // Add missing years at the END (from maxYear + 1 to targetEndYear)
    if (maxYear < targetEndYear) {
      for (let year = maxYear + 1; year <= targetEndYear; year++) {
        dimensions.combinations.forEach((combo) => {
          const zeroEntry = {
            PeriodYear: year,
            ...combo,
            ScheduledPaymentsReporting: 0,
            RemainingPaymentsReporting: 0,
          };
          this._debug &&
            console.debug(
              'Pushed missing year entry (end)',
              JSON.stringify(zeroEntry)
            );
          completeData.push(zeroEntry);
        });
      }
    }

    this._debug &&
      console.debug('fillMissingYears result:', {
        original: IADCardData.length,
        filled: completeData.length,
        yearRange,
        paramStart,
        startYear,
        minYear,
        maxYear,
        targetEndYear,
        dimensions,
      });

    return completeData;
  }

  /**
   * Extracts unique dimension values and their combinations from the data.
   *
   * @private
   * @param {Array<any>} data
   * @return {*}  {{ dimensionFields: string[], combinations: Array<any> }}
   * @memberof UtilityService
   */
  private extractDimensions(data: Array<any>): {
    dimensionFields: string[];
    combinations: Array<any>;
  } {
    if (!data || data.length === 0) {
      return { dimensionFields: [], combinations: [{}] };
    }

    // Identify dimension fields (excluding PeriodYear and data fields)
    const excludeFields = [
      'PeriodYear',
      'PeriodQuarter',
      'PeriodYearQuarter',
      'ScheduledPaymentsReporting',
      'RemainingPaymentsReporting',
    ];

    const sampleItem = data[0];
    const dimensionFields = Object.keys(sampleItem).filter(
      (key) => !excludeFields.includes(key)
    );

    // Extract unique values for each dimension
    const uniqueValues: Record<string, Set<any>> = {};
    dimensionFields.forEach((field) => {
      uniqueValues[field] = new Set();
    });

    data.forEach((item) => {
      dimensionFields.forEach((field) => {
        if (item[field] !== undefined && item[field] !== null) {
          uniqueValues[field].add(item[field]);
        }
      });
    });

    // Generate all combinations of dimension values
    const combinations: Array<any> = [];
    const generateCombinations = (fields: string[], current: any = {}) => {
      if (fields.length === 0) {
        combinations.push({ ...current });
        return;
      }

      const [field, ...rest] = fields;
      const values = Array.from(uniqueValues[field]);

      if (values.length === 0) {
        generateCombinations(rest, current);
      } else {
        values.forEach((value) => {
          generateCombinations(rest, { ...current, [field]: value });
        });
      }
    };

    generateCombinations(dimensionFields);

    return { dimensionFields, combinations };
  }

  modifyCardData(IADCardData: Array<any>, cardConfig: CardConfig): Array<any> {
    const builtEntries: Partial<CardDataItem>[] = [];
    let index;

    const el = cardConfig.fieldTransform?.find((e) => e.modify?.indexes); // Determine if Data Needs modification before mapping
    if (!el) return IADCardData;

    const cardDataCopy = JSON.parse(JSON.stringify(IADCardData)); // Making sure is not pointing to the same memory allocation, otherwise affects the original IADCardData

    switch (el.modify.indexes) {
      case 0:
      case 'first': {
        index = Math.min(
          ...IADCardData.map((item) => item[el.modify.compareWith])
        );
        break;
      }
      case -1:
      case 'last': {
        index = Math.max(
          ...IADCardData.map((item) => item[el.modify.compareWith])
        );
        break;
      }
      default: {
        index = el.modify.indexes;
        break;
      }
    }

    IADCardData.map((e, i) => {
      builtEntries.push(e);
      if (e[el.modify.compareWith] === index) {
        // Once it finds the right Index in the list of data make the modifications
        builtEntries[i][el.modify.compareWith] = el.modify.caption.toString();

        if (el.modify.compareWithX) {
          const prevRow = this._findPreviousMatchingRow(
            cardDataCopy,
            el.modify,
            index,
            i
          );
          builtEntries[i][el.modify.replace] =
            prevRow?.[el.modify.newData ? el.modify.newData : el.data];
        } else {
          builtEntries[i][el.modify.replace] =
            IADCardData[i + (el.modify.offset ? el.modify.offset : 0)][
              el.modify.newData ? el.modify.newData : el.data
            ]; // Offset allows to get a number from another row
        }
      } else {
        builtEntries[i][el.modify.compareWith] =
          IADCardData[i]?.[el.modify.compareWith]?.toString();
      }
    });
    return builtEntries;
  }

  /**
   * Modifies the IADCardData while being transformed.
   *
   * @private
   * @param {Array<any>} IADCardData
   * @param {CardDataItemModify} modify
   * @param {number} targetIndex
   * @param {*} IADIndex
   * @return {*}
   * @memberof UtilityService
   */
  private _findPreviousMatchingRow(
    IADCardData: Array<any>,
    modify: CardDataItemModify,
    targetIndex: number,
    IADIndex
  ) {
    return IADCardData.filter(
      (e) =>
        e[modify.compareWith] === targetIndex + modify.offset &&
        e[modify.compareWithX] === IADCardData[IADIndex][modify.compareWithX]
    )[0];
  }

  /**
   * Filter cardData given a numeric 'key' to compare against
   * For more complex comparisons is missing the comparison parameter.
   *
   * @param {*} data
   * @param {number} start
   * @param {number} end
   * @param {number} key
   * @return {*}  {*}
   * @memberof InAppDisclosureService
   */
  filterByKey(
    data: any,
    start: number,
    end: number,
    key = 'PeriodYear' as string
  ): any {
    return data.filter((item) => item[key] >= start && item[key] <= end);
  }

  /**
   * When cardConfig.sortingOrder is not present generate a sorting order
   * based on fieldTransform options.
   *
   * @param {Array<any>} arr
   * @param {string} customKey
   * @return {*}  {{[key: string]: number}}
   * @memberof UtilityService
   */
  createSortOrder(
    arr: Array<any>,
    customKey: string
  ): { [key: string]: number } {
    const result = {};
    arr.forEach((item, i) => {
      result[item.Display ?? customKey] = i;
    });
    return result;
  }

  /**
   * Parses and evaluates custom formulas as a string.
   *
   * @example const formula = '(x / 2) + 2';
   *			  const variables = { x: 10 };
   *
   *			  const result = this.evaluateFormula(formula, variables);
   *				console.log(result); // Outputs: 7
   *
   * @param {string} formula
   * @param {Record<string, number>} variables
   * @return {*}  {(number | boolean)}
   * @memberof UtilityService
   */
  parseFormula(
    formula: string,
    variables: Record<string, number>
  ): number | boolean {
    if (isNaN(variables.x)) return 0;

    try {
      // Create a dynamic function with variables in scope
      const variableKeys = Object.keys(variables);
      const variableValues = Object.values(variables);

      const dynamicFunction = new Function(
        ...variableKeys,
        `return ${formula};`
      ); // Generate a function that evaluates the formula

      return dynamicFunction(...variableValues); // Execute the function with the passed variable values
    } catch (error) {
      console.error('Error evaluating formula:', error); // throw new Error('Invalid formula or variables');
      return variables.x; // Just use the default and first variable to keep the cell showing
    }
  }

  /**
   * Build/Reconstruct Field Configuration from the pivot or grid data source,
   * this is used to be saved in the database.
   *
   * @param {*} dataSources
   * @param {GridType} [gridType]
   * @return {*}
   * @memberof UtilityService
   */
  buildConfigFields(dataSources, gridType?: GridType) {
    const fields = [];
    const fieldsToSave = [];

    switch (gridType) {
      case 'dataGrid': {
        break;
      }
      default:
      case 'pivotGrid': {
        const columns = dataSources.getAreaFields('column', false);
        const rows = dataSources.getAreaFields('row', false);
        const data = dataSources.getAreaFields('data', false);
        const filters = dataSources.getAreaFields('filter', false);

        columns.forEach((column) => {
          if (column.dataField && !fields.includes(column.dataField)) {
            const field = JSON.parse(JSON.stringify(column));

            delete field['groupInterval'];
            delete field['caption'];
            delete field['groupIndex'];
            delete field['groupName'];

            fields.push(field.dataField);
            fieldsToSave.push(field);
          }
        });

        rows.forEach((row) => {
          if (row.dataField && !fields.includes(row.dataField)) {
            const field = JSON.parse(JSON.stringify(row));

            delete field['groupInterval'];
            delete field['caption'];
            delete field['groupIndex'];
            delete field['groupName'];

            fields.push(field.dataField);
            fieldsToSave.push(field);
          }
        });

        data.forEach((e) => {
          if (e.dataField && !fields.includes(e.dataField)) {
            const field = JSON.parse(JSON.stringify(e));

            delete field['groupInterval'];
            delete field['caption'];
            delete field['groupIndex'];
            delete field['groupName'];

            fields.push(field.dataField);
            fieldsToSave.push(field);
          }
        });

        filters.forEach((filter) => {
          if (filter.dataField && !fields.includes(filter.dataField)) {
            const field = JSON.parse(JSON.stringify(filter));

            delete field['groupInterval'];
            delete field['caption'];
            delete field['groupIndex'];
            delete field['groupName'];

            fields.push(field.dataField);
            fieldsToSave.push(field);
          }
        });

        break;
      }
    }

    return fieldsToSave;
  }

  /**
   * Replaces placeholders in the given expression string with corresponding values from the provided object.
   * If a placeholder key is not found in the object, it is replaced with 0.
   * The resulting expression is then evaluated as a mathematical expression.
   *
   * @param {Object} e - The object containing key-value pairs for interpolation.
   * @param {string} v - The expression string with placeholders in the format "${key}".
   * @returns {number} - The result of the evaluated mathematical expression.
   *
   * @example
   * const e = { a: 10, b: 5 };
   * const v = "${a} + ${b} + ${c}";
   * console.log(interpolateAndEvaluate(e, v)); // Output: 15 (since c is missing, it defaults to 0)
   */
  interpolateAndEvaluate(e: Record<string, any>, v: string) {
    const expression = v.replace(/\${(.*?)}/g, (_, key) => e[key] ?? 0);
    return evaluate(expression);
  }

  /**
   * Removes invalid empty keys
   *
   * @template T
   * @param {T[]} arr
   * @return {*}  {T[]}
   * @memberof UtilityService
   */
  removeBlankAttributes<T extends Record<string, any>>(arr: T[]): T[] {
    return arr.map((obj) => {
      const hasBlankKeys = Object.keys(obj).some(
        (key) => key === '' || key === null || key === undefined
      );

      if (!hasBlankKeys) {
        return obj;
      }

      const filteredObj = Object.entries(obj)
        .filter(([key, _]) => key !== '' && key !== null && key !== undefined)
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, any>);

      return filteredObj as T;
    });
  }
}
