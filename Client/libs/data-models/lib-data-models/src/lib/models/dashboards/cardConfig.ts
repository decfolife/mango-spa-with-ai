import { Dropdown } from '@mango/data-models/lib-data-models';

/**
 * Configuration for the Disclosure Dashboard.
 *
 * This interface defines the properties required to configure a dashboard view,
 * including its unique ID, associated Pendo ID, card configurations,
 * and caching behavior.
 *
 * @export
 * @interface DashboardConfig
 */
export interface DashboardConfig {
  /**
   * Unique identifier for the dashboard.
   * @type {number}
   */
  dashboardId: number;

  /**
   * Identifier for Pendo analytics tracking.
   * @type {string}
   */
  pendoId: string;

  /**
   * Configuration for local dashboard cards.
   * @type {CardConfig[]}
   */
  localCardConfig: CardConfig[];

  /**
   * Determines whether data should be cached.
   * Defaults to `true` if not specified.
   * @type {boolean}
   */
  cache?: boolean;
}

export interface CardRequest {
  dashboardId: number;
  selectedSegment: number;
  reportingYear: number;
  selectedCurrency?: string;
}

export interface FormatObject {
  type: string;
  precision: number;
}

// Type guard: Checks if the given object is a Format Type
export function isFormatObject(obj: any): obj is FormatObject {
  return 'type' in obj;
}

// Sorting Object used to defined order of rows in a table
export interface SortingOrder {
  [key: string]: number;
}
export interface ColumnSortingOrder {
  [key: string]: SortingOrder;
}

/**
 * Pivot Data Type
 *
 * Represents the data structure for items used in the dashboard cards.
 *
 * @export
 * @typedef {Object} CardDataItem
 */
export type CardDataItem = {
  /** The count of items added. */
  AddedCount?: number | string;

  /** The count of items being closed. */
  closingCount?: number | string;

  /**
   * The classification of disclosure.
   * When 'Total' is passed, data transformation is handled differently.
   */
  DisclosureClassification?: string | 'Total';

  /** The count of items that have ended. */
  EndedCount?: number | string;

  /** The template used for leasing. */
  LeaseTemplate?: string;

  /** The count of items being opened. */
  OpeningCount?: number | string;

  /** The display text for the card item. */
  Display?: string;

  /** The year or period associated with the data. */
  PeriodYear?: number | string;

  /** The quarter or period associated with the data. */
  PeriodQuarter?: number | string;

  /** The type of data (number or string). */
  dataType?: number | string;

  /** The actual data associated with the card item. */
  data?: any;

  /**
   * Defines custom row calculations when data is not present.
   * This allows you to specify the columns or rows for custom calculations.
   * If `dataCalculation` is provided, it will be used to compute values dynamically.
   *
   * @example
   * // Example of fieldTransform array with custom calculations
   * fieldTransform: [
   *   ...
   *   {
   *     LeaseTemplate: 'LeaseTemplate',
   *     Display: 'Sublease Income',
   *     PeriodYear: 'PeriodYear',
   *     data: 'SubleaseIncome',
   *   },
   *   {
   *     LeaseTemplate: 'LeaseTemplate',
   *     Display: 'Sublease Income',
   *     PeriodYear: 'PeriodYear',
   *     data: 'LeaseLiabilityInterestReporting',
   *   },
   *   {
   *     LeaseTemplate: 'LeaseTemplate',
   *     Display: 'Sublease Income',
   *     PeriodYear: 'PeriodYear',
   *     dataCalculation: '${SubleaseIncome} + ${LeaseLiabilityInterestReporting}', // Custom calculation
   *   },
   * ]
   *
   * @type {string | number}
   * The calculation expression as a string or a numerical value directly.
   */
  dataCalculation?: string | number;

  /** Optional modifier for the card data item. */
  modify?: CardDataItemModify;
  ExceptionReason?: string;
};

export type CardDataItemModify = {
  replace: string;
  indexes: 'first' | 'last' | number;
  compareWith: string;
  compareWithX?: string;
  offset: number;
  caption?: string;
  newData?: string | number;
};

/**
 * Represents the configuration for a field in a data set.
 * The key corresponds to the card configuration schema
 * The value corresponds to the API respond to pair with
 * @example fieldTransform: [
 *   {
 *      DisclosureClassification: 'DisclosureClassification',
 *      ...
 *   }
 * ]'
 * Where 'DisclosureClassification' is the PivotTable parameter
 * and 'DisclosureClassification' corresponds to the variable to
 * be used from the API response
 *
 * @see https://js.devexpress.com/Angular/Documentation/ApiReference/Data_Layer/PivotGridDataSource/Configuration/fields/
 *
 * @typedef {Object} CardDataTransformer
 */
export type CardDataTransformer = CardDataItem & object;

/**
 * Represents the configuration for a field in a data set.
 * @typedef {Object} CardConfig
 */
export type CardConfig = {
  /**
   * This is used to identify the card to be saved and as the HTML attribute ID
   * This value must be unique.
   *
   * @type {string}
   */
  id: string;

  /**
   * Card Name
   *
   * @type {string}
   */
  name: string;

  /**
   * The position of the Card.
   *
   * @type {number}
   */
  index: number;

  /**
   * Optional formatting information for the field.
   *
   * @type {FormatObject}
   */
  format?: FormatObject;

  /**
   * Width of the first column displaying the rows
   *
   * @type {number}
   */
  width?: number;

  /**
   * Card width.
   *
   * @type {boolean}
   */
  fullWidth?: boolean;

  /**
   * Allows to render the grid as a PivotGrid (default) or data grid (aka list page).
   *
   * @type {('pivotGrid' | 'dataGrid')}
   */
  defaultCardView?: 'pivotGrid' | 'dataGrid';

  /**
   * Allows to change the card view by adding the menu option in the card's more menu
   *
   * @type {boolean}
   */
  allowToggleCardView?: boolean;

  /**
   * When needed to combine with another IADCardData, the selected index will be removed
   * and not be used as a separated dashboard card. Please check the `inAppDisclosureService.getIADCardData`
   * to review the response's indexes.
   *
   * @type {number}
   */
  combineWithIndex?: number;

  /**
   * Optional row sorting order.
   *
   * @type {SortingOrder}
   */
  sortingOrder?: SortingOrder;

  /**
   *
   *
   * @type {SortingOrder}
   */
  columnSortingOrder?: SortingOrder;

  /**
   * Order of the columns corresponding to the cardJSONSchema's dataField
   * @example
   *  sortedColumnFieldName: {
   *			'LeaseTemplate': {
   *				Finance: 0,
   *				Operating: 1,
   *				Mixed: 2,
   *			},
   *			...
   *	}
   * @type {(ColumnSortingOrder | string)}
   */
  sortedColumnFieldName?: ColumnSortingOrder | string;

  /**
   * Allows to show/hide the field chooser for both Pivot and Grid Table.
   *
   * @type {boolean}
   */
  showFieldChooser?: boolean;

  showMenuToggleFullWidth?: boolean;
  showMenuSave?: boolean;
  showMenuReset?: boolean;

  /**
   * Activates the chart icon to render the data base con the card data.
   * Note: Chart only visible on PivotGrid mode, see the `defaultCardView` property
   *
   * @type {boolean}
   */
  chartActive?: boolean;

  /**
   * When `cartActive` is true, then you can make it hidden or visible by default.
   * Note: Chart only visible on PivotGrid mode, see the `defaultCardView` property
   *
   * @type {boolean}
   */
  chartVisible?: boolean;

  /**
   * Specifies how to aggregate data for the total summary item.
   * Default Value: 'count' when the parameter is not provided.
   *
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDataGrid/Configuration/summary/totalItems/#summaryType
   * @type {('sum' | 'min' | 'max' | 'avg' | 'count' | 'custom' | null)}
   */
  summaryType?: 'sum' | 'min' | 'max' | 'avg' | 'count' | 'custom' | null;

  /**
   * To display data in the PivotGrid, specify the fields[] array. Each object in it configures a
   * single pivot grid field. Specify the dataField property to populate the pivot grid field with data.
   *
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/Data_Layer/PivotGridDataSource/Configuration/fields/
   * @see https://js.devexpress.com/Angular/Documentation/Guide/UI_Components/PivotGrid/Getting_Started_with_PivotGrid/#Configure_Fields_and_Areas
   * @type {string}
   */
  cardJSONSchema?: Array<any>;

  /**
   * Stores the dataGrid field configuration. This helps to separate the pivotGrid configuration `cardJSONSchema`
   * from the dataGrid (or list view) schema.
   *
   * @type {Array<object>}
   */
  cardJSONSchemaGrid?: Array<object>;

  /**
   * How the incoming API data is going to be used on the grid
   *
   * @type {(Partial<CardDataTransformer[]> | undefined)}
   */
  fieldTransform?: Partial<CardDataTransformer[]> | undefined;

  allowSortingBySummary?: boolean;
  allowFiltering?: boolean;
  showBorders?: boolean;
  showRowGrandTotals?: boolean;
  showColumnGrandTotals?: boolean;
  showRowTotals?: boolean;
  showColumnTotals?: boolean;

  /**
   * Defines the fields used to merge arrays based on the 'combineWithIndex' property.
   * In the Record, the key represents the current array field, and the value represents
   * the corresponding 'combineWithIndex' field name.
   *
   * @example
   * mergeBy: [
   *   { 'PeriodYear': 'PeriodQuarter' }, // 'PeriodYear' corresponds to the current array field, and 'PeriodQuarter' corresponds to the 'combineWithIndex' field.
   * ],
   *
   * @type {Array<Record<string, string>>}
   */
  mergeBy?: Array<Record<string, string>>;

  /**
   * Strings that can be changed or localized in the PivotGrid UI component.
   *
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxPivotGrid/Configuration/texts/
   * @type {object}
   */
  texts?: PivotGridTexts;

  // Dropdown Options for 'crem-card'
  filterData?: Dropdown[];

  /**
   * filterBy is used with filterData, where filterBy is the key to use
   * from localCardConfig to compare against.
   *
   * @type {number}
   */
  filterBy?: string;

  customDropdownMenu?: boolean;
  filterInitialValue?: Dropdown;
  showFilterClearButton?: boolean;
  dropdownPlaceholder?: string;
  dropDisplay?: string;
  dropValue?: string;

  // Card Options for 'crem-card'
  title?: string;
  pendoTitleId?: string;
  subtitle?: string;
  // Search
  searchLabel?: string;
  searchPlaceholder?: string;

  /**
   * Data Grids / List view configurations
   * @see https://js.devexpress.com/Angular/Documentation/Guide/UI_Components/DataGrid/Columns/Overview/
   *
   * @type {DataGridParameters}
   */
  dataGrid?: DataGridParameters;

  /**
   * Data Grid, Helps defining the column definition for further control
   * Otherwise the data will be shown as is.
   *
   * @type {dataGridColumnDefinition}
   */
  dataGridColumnDefinition?: Partial<dataGridColumnDefinition>[];

  /**
   * When true, automatically fills in missing years with zero values for all dimension combinations.
   * This ensures future commitment tables display the full range (5 or 10 years)
   * even when no data exists for certain years.
   *
   * Works in conjunction with filterInitialValue to determine the year range.
   * Should be applied BEFORE the modify property processes "Thereafter" calculations.
   *
   * @type {boolean}
   */
  fillMissingYears?: boolean;

  /**
   * Specifies the columns against which the summary should be calculated.
   *
   * When an array of strings is provided, you can selectively determine which columns
   * the summarization formula will apply to.
   *
   * Use in conjunction with 'summaryCellFormula' and/or 'summaryCellConstants' to define
   * a specific formula for calculating the desired cell or column.
   *
   * E.g. ['PeriodYear','DisclosureClassification', 'LeaseTemplate'] or 'PeriodYear'.
   *
   * TODO: This process should be automatic when summaryCellName not provided, and added to the lower fieldConfig index
   *
   * @type {(string | string[])}
   */
  summaryCellName?: string | Array<string>;
  summaryCellConstants?: Record<string, number>;
  summaryCellFormula?: string;

  /**
   * Optional sorting method function for the field.
   * @deprecated Please avoid using this, as it will not survive parsing once
   * this object is integrated into the client's database.
   * @type {Function}
   */
  sortingMethod?: Function;

  /**
   * Specifies a custom post-processing function for summary values.
   * When using please set `summaryType` to `custom`
   * @see https://js.devexpress.com/Angular/Demos/WidgetsGallery/Demo/DataGrid/CustomSummaries/MaterialBlueLight/
   *
   * @deprecated Please avoid using this, as it will not survive parsing once
   * this object is integrated into the client's database.
   * @type {Function}
   */
  calculateSummaryValue?: Function;

  /**
   * Optional function for custom summary calculation.
   *
   * @deprecated Please avoid using this, as it will not survive parsing once
   * this object is integrated into the client's database.
   * @type {Function}
   */
  calculateCustomSummary?: Function;
};

interface DataGridParameters {
  /**
   * @see https://js.devexpress.com/Angular/Documentation/Guide/UI_Components/DataGrid/Columns/Column_Chooser/
   *
   * @type {boolean}
   * @memberof DataGridParameters
   */
  columnChooser?: boolean; // FIXME: This is affecting PivotGrid as well, should only apply to dataGrids
  columnChooserMode?: 'select' | 'dragAndDrop';
  headerFilterVisible?: boolean;
  headerFilterAllowSearch?: boolean;
  sorting?: 'multiple';
  /**
   * @see https://js.devexpress.com/Angular/Documentation/Guide/UI_Components/DataGrid/Columns/Column_Fixing/
   *
   * @type {boolean}
   * @memberof DataGridParameters
   */
  columnFixing?: boolean;
  /**
   * @see https://js.devexpress.com/Angular/Documentation/Guide/UI_Components/DataGrid/Paging/
   *
   * @type {number}
   * @memberof DataGridParameters
   */
  pageSize?: number;
  /**
   * Pager component
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDataGrid/Configuration/pager/
   *
   * @type {boolean}
   * @memberof DataGridParameters
   */
  showPageSizeSelector?: boolean;
  allowedPageSizes?: Array<number>;
  showInfo?: boolean;
  showNavigationButtons?: boolean;
}

/**
 * Strings that can be changed or localized in the PivotGrid UI component.
 *
 * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxPivotGrid/Configuration/texts/
 * @interface pivotGridTexts
 */
interface PivotGridTexts {
  collapseAll?: string;
  dataNotAvailable?: string;
  expandAll?: string;
  exportToExcel?: string;
  grandTotal?: string;
  noData?: string;
  removeAllSorting?: string;
  showFieldChooser?: string;
  sortColumnBySummary?: string;
  sortRowBySummary?: string;
  total?: string;
}

/**
 * Data Grid column configuration
 * todo: implementation pending
 * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDataGrid/Configuration/columns/
 *
 * @export
 * @interface dataGridColumnDefinition
 */
export interface dataGridColumnDefinition {
  caption: string;
  dataField: string;
  dataType: string;
  fieldType: number;
  format: string | null;
  urlLink: string;
  visibleIndex: number;
  useDefaultObjectFields: boolean | null;
  displayOrder: number;
}
