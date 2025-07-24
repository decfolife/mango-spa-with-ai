import type { Column } from 'devextreme/ui/data_grid';
import {
  DynamicWidgetConfiguration,
  SettingsDropDownConfig,
  SettingsDropdownOptions,
} from './dynamic-widget.model';

/**
 * Default configuration for the data grid.
 * Used by the `DynamicWidgetService` to provide baseline settings for in-service transformations.
 * This configuration is applied to all widgets unless overridden by a specific `widgetData` instance.
 */
export const defaultWidgetGridConf: Partial<DynamicWidgetConfiguration> = {
  // maxHeight: 300,
  noDataText: 'No Data',
  showTitle: true,
  gridView: 'dataGrid',
  allowChangeView: false,
  // Widget Grid Configuration
  dataGridConf: {
    showBorders: true,
    sortingMode: 'multiple',
    showRowLines: false,
    columnAutoWidth: true,
    wordWrapEnabled: true,
    showColumnLines: false,
    allowColumnResizing: true,
    rowAlternationEnabled: true,
    allowColumnReordering: false,
    columnFixing: false,
    headerFilter: {
      visible: true,
    },
    grouping: {
      visible: false,
      autoExpandAll: false,
      contextMenuEnabled: true,
    },
    paging: {
      visible: true,
      showInfo: true,
      infoText: `Page {0} of {1}`,
      showPageSizeSelector: true,
      showNavigationButtons: true,
      allowedPageSizes: [10, 25, 50, 100],
    },
    masterViewDetail: {
      enabled: true,
      autoExpandAll: true,
    },
    scrolling: {
      mode: 'standard',
    },
    columnChooser: {
      visible: false,
      enabled: false,
      mode: 'select',
      allowSearch: true,
      width: '300px',
      searchEditorOptions: {
        placeholder: 'Search column',
        mode: 'text',
      },
    },
  },
  dataPivotConf: {
    texts: {
      grandTotal: 'Grand Total',
    },
  },
  // Default History Grid Configuration
  historyGridConf: {
    paging: {
      visible: true,
      showInfo: true,
      infoText: `Page {0} of {1}`,
      showPageSizeSelector: true,
      showNavigationButtons: true,
      allowedPageSizes: [10, 25, 50],
    },
    scrolling: {
      mode: 'standard',
    },
  },
  // History Popover Configuration
  historyPopOverConf: {
    width: '900px',
    height: '800px',
    position: 'left',
  },
  _skeletonInstances: 3,
};

/**
 * History';'s Grid Configuration
 */
export const historyGridColumns: Partial<Column>[] = [
  {
    caption: 'Record ID',
    dataField: 'ObjectID',
  },
  {
    caption: 'Field',
    dataField: 'SourceField',
  },
  {
    caption: 'Date',
    dataField: 'LastModified',
    format: {
      type: 'dateTime',
    },
    customizeText(cellInfo) {
      const date = new Date(cellInfo.value);
      return new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(date);
    },
  },
  {
    caption: 'User',
    dataField: 'ContactName',
  },
  {
    caption: 'Old Value',
    dataField: 'BeforeChange',
  },
  {
    caption: 'New Value',
    dataField: 'AfterChange',
  },
  {
    caption: 'Action',
    dataField: 'Description',
  },
];

export const settingsDropDownOptions: SettingsDropdownOptions = [
  { id: 1, option: 'v06-EditWidget', text: 'Edit Widget' },
  { id: 2, option: 'v06-DataGroup', text: 'Data Group' },
  { id: 3, option: 'v06-ColumnFields', text: 'Column Fields' },
  { id: 4, option: 'v06-ColumnGroups', text: 'Column Group' },
];

export const settingsDropDownConfig: SettingsDropDownConfig = {
  width: 150,
  displayExpr: 'text',
  keyExpr: 'id',
};

/**
 * Schema configuration based on widget ID to determine Pivot Grid usage.
 * Add in here the Widget Type ID's that would you like to be shown as Pivots.
 */
export const fieldTransform: any = {
  // todo: add type and only use entry key, e.g. 11: 'Data Grid'
  11: {
    // 11 corresponds to the  Widget 'Dynamic Pivot'
    transform: {},
  },
};

/**
 * String chains to be used against the defaultWidgetGridConf object
 */
export const uiNameTitles = {
  dataGrid: 'Data Grid',
  pivotGrid: 'Pivot Grid',
};
