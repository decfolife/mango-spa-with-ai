import { Injectable } from '@angular/core';
import {
  DynamicWidgetConfiguration,
  RenderFormData,
  SettingsDropDownConfig,
  SettingsDropdownOption,
  SettingsDropdownOptions,
  WidgetRenderContext,
  PivotGridFields,
  PivotGridField,
  ColumnFieldsExtended,
  Format,
  GridMasterDetail,
} from './dynamic-widget.model';
import {
  defaultWidgetGridConf as defaultGridConfig,
  fieldTransform,
  settingsDropDownConfig,
  settingsDropDownOptions,
  uiNameTitles,
} from './widget-schema.config';
import {
  FieldHistoryDataSource,
  ObjectType,
} from '@mango/data-models/lib-data-models';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Widget,
  ColumnFields,
  DeleteSubObjectRequest,
} from '@forms/model/dynamic-forms.interface';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';
import { Environment } from '@mango/data-models/lib-data-models';
import { DataType } from 'libs/data-models/lib-data-models/src/lib/enums/index';

@Injectable()
export class DynamicWidgetService {
  /**
   * Whole Widget Configuration
   *
   * @private
   * @memberof DynamicWidgetService
   */
  private _widgetViewData$ = new BehaviorSubject<WidgetRenderContext>({
    widgetData: null,
    gridConfig: null,
    gridMasterDetail: null,
    widgetHistoryData: null,
    rowHistoryData: null,
    renderFormData: null,
    settingsDropDownOptions: null,
    settingsDropDownConfig: null,
    pivotGridDataSource: null,
  });
  WidgetViewData$ = this._widgetViewData$.asObservable();

  /**
   * Loading indicator to know when all the transformation are ready
   */
  private _isLoading$ = new BehaviorSubject<boolean>(true);
  isLoading$ = this._isLoading$.asObservable();

  /**
   * Updates when error present
   */
  private _error$ = new BehaviorSubject(false);
  IsError$ = this._error$.asObservable();

  /**
   * When true show the console.debugs
   */
  private _debug = false as boolean;

  _defaultDecimalPrecision = 2 as number;

  renderFormData: Partial<RenderFormData>;

  // Make configuration imports available to the class
  defaultWidgetGridConf: Partial<DynamicWidgetConfiguration>;

  // Settings Default Options and Configuration
  settingsDropDownOptions: SettingsDropdownOptions = settingsDropDownOptions;
  settingsDropDownConfig: SettingsDropDownConfig = settingsDropDownConfig;

  // Static Schemas per Widget Type
  fieldTransform = fieldTransform;

  uiNameTitles = uiNameTitles;

  constructor() {
    this.defaultWidgetGridConf = JSON.parse(JSON.stringify(defaultGridConfig));
  }
  /**
   * Entry Point of the service
   *
   * @param {Widget} widgetData
   * @param {Partial<RenderFormData>} [renderFormData]
   * @param {number} [decimalPrecision]
   * @param {boolean} [debug]
   * @return {*}  {Observable<boolean>}
   * @memberof DynamicWidgetService
   */
  onLoad(
    widgetData: Widget,
    renderFormData?: Partial<RenderFormData>,
    decimalPrecision?: number,
    debug?: boolean
  ): Observable<boolean> {
    this._debug = debug ?? false;
    this._isLoading$.next(true);
    this._defaultDecimalPrecision = decimalPrecision;

    // Make the 'Render Form data' (form, objectId, objectTypeId, etc) available to the service
    this.renderFormData = renderFormData;

    // 1) Determine if widget needs a pivot grid & create Pivot Data Source Object
    const pivotGridFieldConfig = this.getPivotGridFieldConfig(
      widgetData,
      this.fieldTransform,
      this._defaultDecimalPrecision
    ); // Check if the Widget Type is a Pivot Grid

    const pivotGridDataSource = this.setPivotGrid(
      widgetData.renderFormWidgetData,
      pivotGridFieldConfig
    );

    // 2) Create Initial Grid Configuration, and add any dynamic configuration
    const gridLogic: Partial<DynamicWidgetConfiguration> = {
      // Add Logic here to Dynamically change the configuration
      gridView: pivotGridFieldConfig.length !== 0 ? 'pivotGrid' : 'dataGrid', // Uses pivotGrid by default ifDualGrid
    };
    const gridConfig: Partial<DynamicWidgetConfiguration> =
      this.getGridConfiguration(
        widgetData,
        gridLogic,
        this.defaultWidgetGridConf
      );

    // Get the Master-Detail View configuration
    const gridMasterDetail = this.getColumnsAndDetailsView(
      widgetData.columnGroup?.columnFields
    );

    // 3) History Grid Configurations
    const [widgetHistoryData, rowHistoryData] = this.getHistoryInitialData(
      widgetData.widgetName
    );

    // 4) Dropdown configuration
    const settingsDropDownOptions: SettingsDropdownOptions =
      this.getDropdownOptions(gridConfig, gridLogic);
    const settingsDropDownConfig: SettingsDropDownConfig =
      this.getDropDownConfig(widgetData);

    // 5) Return Configurations
    const configObject: WidgetRenderContext = {
      // Widget Main Data and Configuration
      widgetData,
      // Grid Config
      gridConfig,
      gridMasterDetail,
      // Widget Pivot View
      pivotGridDataSource,
      // History Grid Data and Configuration
      widgetHistoryData,
      rowHistoryData,
      // Settings Options and Configuration
      settingsDropDownOptions,
      settingsDropDownConfig,
      // Additional Data
      renderFormData: this.renderFormData,
    };

    if (
      this._debug
      // && widgetData.widgetName === 'GL Scheduled Payments by Month and Category'
    ) {
      console.debug(
        `%c---${widgetData.widgetName}--- ${widgetData.formWidgetTypeID} (Pivot Grid)`,
        'background: #222; color: #bada55'
      );
      console.debug('configObject', configObject);
      console.debug('pivotGridFieldConfig', pivotGridFieldConfig);
    }

    // Make widgetData Available
    this._widgetViewData$.next(configObject);
    this._isLoading$.next(false);

    return this._isLoading$.asObservable();
  }

  /**
   * Processes the given column fields and constructs the `masterView` structure
   * by grouping fields according to their `listRow` value (if greater than 1).
   * This effectively organizes the fields into separate sections within the master view.
   *
   * @param {Partial<ColumnField>[]} columnFields - An array of column field objects to be processed.
   * @returns {Record<number, ColumnField[]>} A mapping of listRow values to their corresponding column fields.
   * @memberof DynamicWidgetService
   */
  getColumnsAndDetailsView(columnFields: Partial<ColumnFields[]>) {
    const gridMasterDetail: GridMasterDetail = {
      columnFields: [],
      masterView: {},
    };

    gridMasterDetail.columnFields = columnFields.map((e) => {
      if (e.columnListRow === 1 && e.showInListView) {
        return {
          ...e,
          visible: true,
        };
      }
      return {
        ...e,
        visible: false,
        exportOnly: e.showInListView, // To render temp grid to export
      };
    });

    // Generate Detail View Configuration
    const tempColumnFields = columnFields.filter(
      (e) => e.columnListRow > 1 && e.showInListView
    );

    tempColumnFields.forEach((e) => {
      if (!gridMasterDetail.masterView[e.columnListRow]) {
        gridMasterDetail.masterView[e.columnListRow] = [];
      }
      gridMasterDetail.masterView[e.columnListRow].push({
        ...e,
        label: e.columnHeader,
      });
    });

    return gridMasterDetail;
  }

  /**
   * This allows to create initial configuration for history grid base
   * on the grid observable results.
   *
   * @param {string} title
   * @return {*}  {[
   *     widgetHistoryData: Partial<FieldHistoryDataSource>,
   *     rowHistoryData: Partial<FieldHistoryDataSource>
   *   ]}
   * @memberof DynamicWidgetService
   */
  getHistoryInitialData(
    title: string
  ): [
    widgetHistoryData: Partial<FieldHistoryDataSource>,
    rowHistoryData: Partial<FieldHistoryDataSource>
  ] {
    const widgetHistoryData: Partial<FieldHistoryDataSource> = {
      helpTextSubject: 'History Details: ' + title,
      helpTextHistory: [],
    };

    const rowHistoryData: Partial<FieldHistoryDataSource> = {
      helpTextSubject: 'History Details: ' + title,
      helpTextHistory: [],
    };
    return [widgetHistoryData, rowHistoryData];
  }

  /**
   * Allows to manipulate the dropdown options depending on the widget configuration
   */
  getDropdownOptions(
    gridConfig,
    gridLogic: Partial<DynamicWidgetConfiguration>
  ): SettingsDropdownOptions {
    const dropDownOptions: SettingsDropdownOptions = [
      ...this.settingsDropDownOptions,
    ];

    // Dynamically Add Column chooser if Visible
    if (gridConfig.dataGridConf?.columnChooser?.visible) {
      dropDownOptions.push({ option: 'columnChooser', text: 'Column Chooser' });
    }

    if (gridConfig.allowChangeView && gridLogic.gridView) {
      dropDownOptions.push({
        option: 'changeGridView',
        text: `Change to ${
          gridLogic.gridView === 'dataGrid'
            ? uiNameTitles['pivotGrid']
            : uiNameTitles['dataGrid']
        }`,
      });
    }

    return this.addIdsToData(dropDownOptions);
  }

  /**
   * Creates a new list of dropdown objects based on the single option sent.
   *
   * @param {SettingsDropdownOptions} settingsDropDownOptions
   * @param {SettingsDropdownOption} settingsDropdownOption
   * @return {*}  {SettingsDropdownOptions}
   * @memberof DynamicWidgetService
   */
  public setDropDownOption(
    settingsDropDownOptions: SettingsDropdownOptions,
    settingsDropdownOption: SettingsDropdownOption
  ): SettingsDropdownOptions {
    const newSettingsDropDownOptions: SettingsDropdownOptions = [
      ...settingsDropDownOptions,
    ];

    // Find if option already exists
    const existingOptionIndex = newSettingsDropDownOptions.findIndex(
      (option) => option.option === settingsDropdownOption.option
    );

    if (existingOptionIndex !== -1) {
      newSettingsDropDownOptions[existingOptionIndex] = {
        ...newSettingsDropDownOptions[existingOptionIndex],
        ...settingsDropdownOption,
      };
    } else {
      // Otherwise, add the new option
      newSettingsDropDownOptions.push(settingsDropdownOption);
    }

    return newSettingsDropDownOptions;
  }

  /**
   * Dynamically creates the settings Configuration for the Settings dropdown
   *
   * @param {*} widgetData
   * @return {*}  {SettingsDropDownConfig}
   * @memberof DynamicWidgetService
   */
  getDropDownConfig(widgetData): SettingsDropDownConfig {
    const dropDownConfig: SettingsDropDownConfig = this.settingsDropDownConfig;

    // Create Element Attributes Configuration based on Grid Data
    dropDownConfig.elementAttr = {
      id: `render-form-widget-${widgetData.formWidgetTypeID ?? ''}-${
        widgetData.widgetID ?? ''
      }`,
    };

    return dropDownConfig;
  }

  /**
   * Get Initial Configuration for the Grid
   *
   * @return {*}  {DynamicWidgetConfiguration}
   * @memberof DynamicFormWidgetComponent
   */
  public getGridConfiguration(
    widgetData: Widget,
    gridOverrides: Partial<DynamicWidgetConfiguration>,
    gridConfig: Partial<DynamicWidgetConfiguration>
  ): Partial<DynamicWidgetConfiguration> {
    // Determine GrantTotals visibility
    const hasRowGrandTotal = widgetData.columnGroup?.columnFields?.some(
      (e) => e.totalByRow
    );
    const hasColumnGrandTotal = widgetData.columnGroup?.columnFields?.some(
      (e) => e.totalByColumn
    );
    gridConfig.dataPivotConf.showRowGrandTotals = hasRowGrandTotal;
    gridConfig.dataPivotConf.showColumnGrandTotals = hasColumnGrandTotal;

    // Calculate Rows for the skeletons
    gridOverrides._skeletonInstances = widgetData.renderFormWidgetData?.length;

    // Merge and override gridConfig existing values
    return { ...gridConfig, ...gridOverrides };
  }

  /**
   * Returns the fieldConfig for the Widget
   * Built using the columnFields
   *
   * @param formWidgetTypeID
   */
  getPivotGridFieldConfig(
    widgetData: Widget,
    fieldTransform,
    decimalPrecision: number
  ) {
    // Create Schemas
    const fieldConf: Partial<PivotGridFields> = [];
    const columnFields: Partial<ColumnFieldsExtended>[] =
      widgetData.columnGroup?.columnFields;

    // Verify if we need to create
    if (!columnFields || columnFields.length === 0) {
      //No Column Field configuration
      return [];
    }

    // Check if the Widget Type ID is include to show the Pivot Grid
    if (!fieldTransform[widgetData.formWidgetTypeID]) {
      return [];
    }

    // Transform the Column Field Configuration (Schema) if needed
    const transformedColumnFields = this.getTransformedColumnFields(
      columnFields,
      fieldTransform[widgetData.formWidgetTypeID]?.transform
    );

    // Build Pivot Grid Schema using transformedColumnFields
    transformedColumnFields.map(async (field) => {
      if (!field.visible) {
        return;
      } // If false the field is not meant to be shown
      const tempField: Partial<PivotGridField> = {};

      // Define area and formatting
      switch (true) {
        case field.visible && field.groupByColumn && !field.groupByRow: {
          tempField.area = 'column';
          tempField.width = field.columnWidth !== 0 ? field.columnWidth : null;
          break;
        }
        case field.visible && !field.groupByColumn && field.groupByRow: {
          tempField.area = 'row';
          tempField.width = field.columnWidth !== 0 ? field.columnWidth : null;
          break;
        }
        case field.visible && field.groupByData: {
          // GroupByData is created in the frontend
          tempField.area = 'data';
          tempField.summaryType = 'sum';
          tempField.format = await this.getFormattedField(
            field,
            decimalPrecision
          );
          tempField.customizeText = (cellInfo) => {
            if (typeof cellInfo.value === 'number') {
              return cellInfo.value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            }
            return cellInfo.value;
          };
          break;
        }
        case !field.visible: {
          tempField.area = undefined; // The field is not visible
          break;
        }
      }

      fieldConf.push({
        expanded: true,
        caption: this.splitPascalCase(field.columnHeader),
        dataField: field.dataFieldTableField.toLocaleLowerCase(),
        ...tempField, // Needs to be last to use the appropriate mapping
      });
    });

    // Store Schemas
    return fieldConf;
  }

  /**
   * This uses the fieldTransform configuration to modify
   * the columnFields from the API based on data type ID
   *
   * @param {Partial<ColumnFieldsExtended>[]} columnFields
   * @param {object} fieldTransformConf
   * @return {*}
   * @memberof DynamicWidgetService
   */
  getTransformedColumnFields(
    columnFields: Partial<ColumnFieldsExtended>[],
    fieldTransformConf: any
  ) {
    // Nothing to transform
    if (!fieldTransformConf) {
      return [...columnFields];
    }

    // Begin Transformation
    const newColumnFields: Partial<ColumnFieldsExtended>[] = [];

    columnFields.forEach((field) => {
      // Show Parameters, hide everything
      if (
        (!field.groupByColumn || !field.groupByRow) &&
        field.showInListView &&
        !field.dataFieldTableField.endsWith('ID') // Any field that ends with 'id' will automatically hidden
      ) {
        newColumnFields.push({
          ...field,
          visible: true,
          groupByData: true,
        });
        return;
      }

      newColumnFields.push({
        ...field,
        visible: false,
        groupByData: false,
      });
    });

    return newColumnFields;
  }

  /**
   * Determine Field format for Dx based on 'dataFieldDataType'
   *
   * @param field
   * @returns
   */
  async getFormattedField(
    field,
    decimalPrecision: number
  ): Promise<undefined | Partial<Format>> {
    const dataType: number = field.dataFieldDataType;
    const formatString = field.dataTypeFormatString;

    // Return Format Object
    switch (
      dataType // Verify that format string is provided
    ) {
      case DataType.CURRENCY: {
        return {
          type: 'currency',
          precision: this.extractPrecisionFromFormatString(
            formatString,
            decimalPrecision
          ),
          // currency: 'usd', // todo: this should be dynamic
        };
      }
      default:
      case DataType.PERCENT:
      case DataType.NUMERIC_9W: {
        return {
          type: 'decimal',
          precision: this.extractPrecisionFromFormatString(
            formatString,
            decimalPrecision
          ),
        };
      }
    }
  }

  /**
   * Set the DevExtreme PivotGrid data source object
   */
  setPivotGrid(
    renderFormWidgetData: Array<any>,
    fieldConfig: any
  ): PivotGridDataSource {
    const pivotCardDataStore: Partial<any>[] = renderFormWidgetData;
    // Create Pivot Grid
    const dataSource: PivotGridDataSource = new PivotGridDataSource({
      store: pivotCardDataStore,
      fields: fieldConfig,
    });

    return dataSource;
  }

  /**
   * Uses the API format `dataTypeFormatString` to extract the format precision
   * E.g. '$#,##0.00'
   * @param {string} formatString
   * @return {*}  {number}
   * @memberof DynamicWidgetService
   */
  extractPrecisionFromFormatString(
    formatString: string,
    decimalPrecision: number
  ): number {
    // No 'dataTypeFormatString' found
    if (!formatString && typeof formatString !== 'string') {
      return decimalPrecision;
    }

    // Returns decimal precision according to 'dataTypeFormatString'
    const decimalMatch = formatString.match(/\.(\d+)/);
    if (decimalMatch && decimalMatch[1]) {
      return decimalMatch[1].length;
    }

    // Malformed dataTypeFormatString, return default
    return decimalPrecision;
  }

  /**
   * Generate IDs in case they're missing
   * @see https://js.devexpress.com/Angular/Documentation/23_2/ApiReference/UI_Components/Errors_and_Warnings/#E1046
   *
   * @param {any[]} data
   * @return {*}  {any[]}
   * @memberof DynamicFormWidgetComponent
   */
  addIdsToData(data: any[]): any[] {
    return data.map((item, index) => ({
      ...item,
      id: item.id ?? index + 1,
    }));
  }

  /**
   * Filters an array of objects by a specific key and value.
   *
   * @template T - The type of objects in the array.
   * @param {T[]} arrayObjects - The array of objects to filter.
   * @param {keyof T} key - The key to filter by.
   * @param {string | number} value - The value to match.
   * @returns {T[]} - A filtered array containing only the matching objects.
   * @memberof DynamicWidgetService
   */
  filterByKeyAndValue<T extends Record<string, any>>(
    arrayObjects: T[],
    key: keyof T,
    value: string | number
  ): T[] {
    return arrayObjects.filter((obj) => obj[key] === value);
  }

  /**
   * Converts a Date to the format needed for the Excel export filename.
   * Example: 20250327T140520
   * @param date Date object to convert
   * @returns A string formatted for the Excel export filename
   */
  formatDateForExcelExport(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  }

  /**
   * Creates the filename for the excel export file
   * @param widgetName The name of the widget being exported to excel
   * @param environment The mango environment
   * @returns A filename for the Excel file
   */
  buildExcelFileName(widgetName: string, environment: Environment): string {
    const fileNameTimestamp = this.formatDateForExcelExport(new Date());
    let fileName = `${widgetName}_${fileNameTimestamp}`;

    if (!environment.production) {
      fileName += `_${environment.name}`;
    }

    return fileName;
  }

  buildDeleteRequestPayload(objectData: {
    oid: number;
    otid: number;
    rowData: any;
    widget: Widget;
  }) {
    const { oid, otid, rowData, widget } = { ...objectData };

    const relationshipDefinitionId =
      objectData.widget.objectTypeID === ObjectType.DEAL_TERM
        ? rowData.data.relationshipdefinitionid
        : widget.relationshipDefinitionID;

    const payload: DeleteSubObjectRequest = {
      objectId: rowData.data.oid,
      objectTypeId: widget.childObjectTypeID,
      relatedObjectId: oid,
      relatedObjectTypeId: otid,
      relationshipDefinitionId,
    };

    return payload;
  }

  /**
   * Transform strings into usable titles.
   * E.g. "LeaseGLCategoryTypeID" into "Lease GL Category Type ID".
   *
   * @param {*} str
   * @return {*}
   * @memberof DynamicWidgetService
   */
  splitPascalCase(str: string) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /**
   * Fallback for formatting of fields when the dataFieldDataType is wrong
   *
   * @param {*} str
   * @param {*} substring
   * @return {*}
   * @memberof DynamicWidgetService
   */
  containsSubstring(str, substring) {
    return str.includes(substring);
  }
}
