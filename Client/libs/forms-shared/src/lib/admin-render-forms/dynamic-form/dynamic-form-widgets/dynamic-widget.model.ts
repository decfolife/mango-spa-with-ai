import { FormGroup } from '@angular/forms';
import { Widget } from '@forms/model/dynamic-forms.interface';
import {
  DataGridConf,
  DataPivotConfig,
  FieldHistoryDataSource,
  PopoverConf,
} from '@mango/data-models/lib-data-models';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';
import type { Properties } from 'devextreme/ui/popup';
import { ColumnFields } from '@forms/model/dynamic-forms.interface';

export interface DynamicWidgetConfiguration {
  dataGridConf: Partial<DataGridConf>;
  dataPivotConf: Partial<DataPivotConfig>;
  gridView: 'dataGrid' | 'pivotGrid';
  /**
   * Allows changing the 'gridView' if different views
   * are available, based on the presence of schemaPerWidgetType (pivotGridConf).
   */
  allowChangeView: boolean;
  pivotGridConf: any; // todo: add type
  /**
   * Show the widget's Title `widgetName`
   */
  showTitle: boolean;
  /**
   * Grid's Max height
   */
  maxHeight: number;
  /**
   * Text when dataSource is empty
   */
  noDataText: string;
  /**
   * Grid configuration for the history tooltip
   */
  historyGridConf: Partial<DataGridConf>;
  /**
   * Field History Popover Configuration
   */
  historyPopOverConf: Partial<PopoverConf>;
  /**
   * The amount of instances of skeletons to show
   * todo: If this field is not provided, the amount of instances is inferred
   */
  _skeletonInstances: number;
}

export interface RenderFormData {
  section: any;
  form: FormGroup;
  objectId: number;
  objectTypeId: number;
  objectTypeTypeId: number;
  formId: number;
}

/**
 * Options List for DevExtreme's dropdown
 *
 * @export
 * @interface SettingsDropdownOptions
 */
export interface SettingsDropdownOption {
  id: number;
  text: string;
  option: string;
}
export type SettingsDropdownOptions = Partial<SettingsDropdownOption>[];

/**
 * Settings Configuration for DevExtreme's dropdown (settings)
 */
interface SettingsDropDownConfigProps extends Properties {
  /**
   * Specifies the data field whose values should be displayed in the drop-down menu.
   * Make sure to use with keyExpr
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDropDownButton/Configuration/#displayExpr
   */
  displayExpr: string;
  /**
   * Specifies which data field provides keys used to distinguish between the selected drop-down menu items.
   * Make sure to use with displayExpr
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDropDownButton/Configuration/#keyExpr
   */
  keyExpr: string;
  /**
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDropDownButton/Configuration/#elementAttr
   */
  elementAttr: Record<string, string>;
}
export type SettingsDropDownConfig = Partial<SettingsDropDownConfigProps>;

/**
 * A full collection of data/config/settings required to render a widget in the grid
 * including UI elements.
 *
 * @export
 * @interface WidgetRenderContext
 */
export interface WidgetRenderContext {
  widgetData: Widget | null;
  gridConfig: Partial<DynamicWidgetConfiguration> | null;
  gridMasterDetail: GridMasterDetail | null;
  widgetHistoryData: Partial<FieldHistoryDataSource> | null;
  rowHistoryData: Partial<FieldHistoryDataSource> | null;
  renderFormData: Partial<RenderFormData> | null;
  settingsDropDownOptions: SettingsDropdownOptions | null;
  settingsDropDownConfig: SettingsDropDownConfig | null;
  pivotGridDataSource: PivotGridDataSource | null;
}

/**
 *
 * DevExtreme's seems that doesn't have a clear type to import for fields
 *
 * @export
 * @interface PivotGridField
 */
export interface PivotGridField {
  dataField?: string;
  area?: 'row' | 'column' | 'data' | 'filter';
  areaIndex?: number;
  expanded?: boolean;
  summaryType?: 'sum' | 'avg' | 'min' | 'max' | 'count' | string;
  dataType?: 'string' | 'number' | 'date' | 'boolean';
  caption?: string;
  /**
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDataGrid/Configuration/columns/#format
   */
  format?: Partial<Format>;
  allowSorting?: boolean;
  allowFiltering?: boolean;
  allowExpandAll?: boolean;
  width?: number;
  sortOrder?: 'asc' | 'desc';
  customizeText?: any;
}
export type PivotGridFields = Array<PivotGridField>;

/**
 * Column field configuration that can be used for additional
 * front-end settings, such as hiding certain fields on pivot grids.
 */
export interface ColumnFieldsExtended extends Partial<ColumnFields> {
  groupByData: boolean;
  visible: boolean;
}

export interface GridMasterDetail {
  columnFields: Partial<ColumnFields[]>;
  masterView: Record<string, any>;
}

/**
 * DevExtreme 23 doesn't have an exportable Format interface
 * manually defined here.
 * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDataGrid/Configuration/columns/#format
 * @see https://js.devexpress.com/Angular/Documentation/ApiReference/Common/Object_Structures/Format/
 */
export interface Format {
  type: string; // one of the predefined formats
  precision: number; // the precision of values
  currency: string; // a specific 3-letter code for the "currency" format
}
