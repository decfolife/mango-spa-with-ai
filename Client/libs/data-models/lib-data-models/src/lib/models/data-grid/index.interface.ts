export interface DataGridConfPaging {
  visible: boolean;
  showPageSizeSelector: boolean;
  allowedPageSizes: Array<number>;
  showNavigationButtons: boolean;
  showInfo: boolean;
  infoText: string;
}
export interface DataGridConfHeaderFilter {
  visible: boolean;
}
export interface DataGridConfHeaderScrolling {
  mode: 'standard' | 'virtual' | 'infinite';
}

export interface DataGridColumnChooser {
  /**
   * This completely deactivates the column chooser
   */
  visible: boolean;
  /**
   * Hides the native DevExtreme Icon
   * Use when want to keep the column chooser functionality
   * w/o showing the icon.
   */
  enabled: boolean;
  mode: 'dragAndDrop' | 'select';
  allowSearch: boolean;
  width: number | string;
  title: string;
  searchEditorOptions: Partial<{
    placeholder: string;
    mode: 'text';
  }>;
}
export interface DataGridConf {
  keyExpr: string;
  columnFixing: boolean;
  showColumnLines: boolean;
  showRowLines: boolean;
  showBorders: boolean;
  rowAlternationEnabled: boolean;
  allowColumnResizing: boolean;
  allowColumnReordering: boolean;
  columnAutoWidth: boolean;
  wordWrapEnabled: boolean;
  sortingMode: 'single' | 'multiple' | 'none';
  headerFilter: Partial<DataGridConfHeaderFilter>;
  paging: Partial<DataGridConfPaging>;
  scrolling: DataGridConfHeaderScrolling;
  fieldTransform: Partial<FieldTransform>;
  /**
   * DataGrid Column Choose configuration
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDataGrid/Configuration/columnChooser/
   */
  columnChooser: Partial<DataGridColumnChooser>;
  /**
   * Configures grouping.
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDataGrid/Configuration/grouping/
   */
  grouping: Partial<DataGridGrouping>;

  /**
   * Master-detail interface supplies a usual data row with an expandable section that contains the details on this data row.
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDataGrid/Configuration/masterDetail/
   */
  masterViewDetail: Partial<DataGridMasterViewDetail>;
}

export interface DataPivotConfig {
  /**
   * Strings that can be changed or localized in the PivotGrid UI component.
   *
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxPivotGrid/Configuration/texts/
   * @type {object}
   */
  texts?: PivotGridTexts;
  showBorders: boolean;
  showRowTotals: boolean;
  allowFiltering: boolean;
  showColumnTotals: boolean;
  showRowGrandTotals: boolean;
  showColumnGrandTotals: boolean;
  allowSortingBySummary: boolean;

  fieldChooser: {
    enabled: boolean;
  };
}

/**
 * Strings that can be changed or localized in the PivotGrid UI component.
 * todo: This is a duplicated interface
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

export interface DataGridGrouping {
  visible: boolean;
  autoExpandAll: boolean;
  contextMenuEnabled: boolean;
}

/**
 * Master-detail interface supplies a usual data row with an expandable section that contains the details on this data row.
 * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDataGrid/Configuration/masterDetail/
 */
export interface DataGridMasterViewDetail {
  enabled: boolean;
  autoExpandAll: boolean;
}

export interface FieldTransform {
  test: number; // TODO: Finish
}
