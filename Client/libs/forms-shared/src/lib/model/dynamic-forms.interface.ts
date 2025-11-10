export interface IDynamicForm {
  id: number;
  formId: number;
  formName: string;
  formTypeName: string;
  //objectId: number;
  objectTypeId: number;
  objectType: string;
  lastModifiedDate: Date;
  formActive: boolean;
  formConstant: string;
  isImportType: boolean;
}

// export interface IAvailableFields{
// formItemID: number,
// formItemName: string
// }
export class ISection {
  formSectionID: number;
  formSectionName: string;
  formSectionColumns: number;
  formSectionDisplayHeading: boolean;
  formSectionSortOrder: number;
  formsectionSystemName: string;
  vpDictionaryFormSectionDesc: string;
  sectionVisibility: null;
}

export class IFields {
  formItemID: number;
  formItemName: string;
  formID: number;
  formSectionID: number;
  formItemLabel: string;
  formItemTypeID: number;
  dataTypeID: number;
  sourcetable: string;
  formItemActive: number;
  objectTypeID: number;
  sourceJoinColumn: string;
  sourceColumn: string;
  formItemParameters: string;
  existing: number;
  formItemDropdownSource: string;
  formatType: string;
  viewSQL: string;
  formItemMaximumLength: number;
  dropdownSourceType: string;
  dropdownID: number;
  formItemFriendlyName: string;
  numDecimals: number;
  sourceType: string;
  defaultValue: string;
  formItemMaxValue: number;
  formItemMinValue: number;
  formItemDescription: string;
  helpText: string;
  clauseTypeID: number;
  widgetID: number;
  formItemSystemName: string;
  dropdownBlankOption: string;
  formItemConstant: string;
  useDefaultValue: number;
  defaultValueType: string;
  formItemDefaultLabel: string;
  formItemLocalLabel: string;
  formItemSectionID: number;
  columnNum: number;
  formItemSortOrder: number;
  formItemMandatory: string;
  formItemMandatoryStep: number;
  formItemViewOnly: string;
  formItemTabIndex: number;
  formItemTop: number;
  formItemLeft: number;
  formItemLabelPlacement: string;
  formItemLabelWidth: string;
  formItemLabelColor: string;
  formItemLabelWeight: string;
  formItemLabelAlign: string;
  formItemLabelPrefix: string;
  formItemLabelSuffix: string;
  formItemDisplayLabel: string;
  formItemFieldWidth: number;
  formItemFieldColor: string;
  formItemFieldWeight: string;
  formItemFieldAlign: string;
  formItemFieldHeight: number;
  formItemFieldSpan: number;
  formItemFieldSpanCSS: string;
  formItemTotalWidth: number;
  formItemTotalHeight: number;
  formItemViewPrefix: string;
  formItemViewSuffix: string;
  formItemEditPrefix: string;
  formItemEditSuffix: string;
  containerCSS: string;
  dataTypeLabel: string;
  isParent: boolean;
  isChild: boolean;
  triggerWorkflowChange: string;
  formItemDictionaryText: string;
  formItemJavaScript: string;
  parentID: number;
  isAuditable: boolean;
  vpDictionaryFormItemDesc: string;
  requestTypeID: number;
  formItemInput1ID: number;
  formItemInput2ID: number;
  formItemOutputID: number;
  formItemOutputIDs: Array<number>;
  behaviorTypeID: number;
  formItemSectionDetail: IFieldDetails;
  formItemType: FormItemTypes;
  formItemAnswer?: any;
  formObjectId: number;
}

export class IFieldDetails {
  //formID: number;
  //objectTypeID: number;
  formSectionID: number;
  formItemDefaultLabel: string;
  formItemID: number;
  //formItemLocalLabel: string;
  formItemLabel: string;
  //formItemSectionID: number;
  columnNum: number;
  formItemSortOrder: number;
  formItemMandatory: string;
  formItemMandatoryStep: number;
  formItemViewOnly: string;
  //formItemTabIndex: number;
  //formItemTop: number;
  //formItemLeft: number;
  //formItemLabelPlacement: string;
  //formItemLabelWidth: number;
  //formItemLabelColor: string;
  //formItemLabelWeight: string;
  //formItemLabelAlign: string;
  formItemLabelPrefix: string;
  formItemLabelSuffix: string;
  formItemDisplayLabel: string;
  //formItemFieldWidth: number;
  //formItemFieldColor: string;
  //formItemFieldWeight: string;
  //formItemFieldAlign: string;
  //formItemFieldHeight: number;
  //formItemFieldSpan: number;
  //formItemFieldSpanCSS: string;
  //formItemTotalWidth: number;
  //formItemTotalHeight: number;
  //formItemViewPrefix: string;
  //formItemViewSuffix: string;
  //formItemEditPrefix: string;
  //formItemEditSuffix: string;
  //containerCSS: string;
  //dataTypeLabel: string;
  //isParent: boolean;
  //isChild: boolean;
  //triggerWorkflowChange: string;
  //formItemDictionaryText: string;
  formItemJavaScript: string;
  //parentID: number;
  //isAuditable: boolean;
  //vpDictionaryFormItemDesc: string;
}

export class FormItemTypes {
  formItemTypeID: number;
  formItemType: string;
}

export class FormItemDataTypes {
  dataTypeID: number;
  dataTypeLabel: string;
}

export class FormItemDatabaseTables {
  name: string;
  name2: string;
}

export class FormItemSourceColumnbySourceTable {
  name: string;
  name2: string;
}

export class Dropdowns {
  dropdownID: number;
  dropdownName: string;
  dropdownValues: DropdownValue[];
}
export class DropdownValue {
  dropdownValueID: number;
  dropdownID: number;
  dropdownValue: string;
  dropdownDisplay: string;
  dropdownValueActive: boolean;
  dropdownValueOrder: number;
}

export class RenderFormDropdowns {
  formItemId: number;
  dropdownValues: BasicSelect[];
}

export class BasicSelect {
  value: string;
  display: string;
}

export class ObjectParentLinker {
  formId: number;
  objectId: number;
  objectTypeTypeId: number;
  labelText: string;
  premiseFormId: number;
  premiseObjectId: number;
  premiseObjectTypeTypeId: number;
  premiseLabelText: string;
}

export class Widget {
  id: number;
  widgetID: number;
  widgetName: string;
  sourceURL: string;
  iFrameName: string;
  widgetSourceTable: string;
  widgetCopyColumns: string;
  dataGroupID: number;
  popUpSourceURL: string;
  wrapLastColumn: boolean;
  allowEdits: boolean;
  allowCreation: boolean;
  viewOnlyPopUp: boolean;
  formWidgetTypeID: FormWidgetTypeIDValue;
  columnGroupID: number;
  formID: number;
  relationshipDefinitionID: number;
  widgetDescription: string;
  allowExcelExport: boolean;
  allowLinking: boolean;
  allowImport: boolean;
  allowSelection: boolean;
  allowColumnSorting: boolean;
  allowColumnGrouping: boolean;
  lockHeaderRow: boolean;
  allowComparison: boolean;
  showFormWidgetHistory: boolean;
  widgetDisplayName: string;
  leaseOptionTypeID: number;
  validationFormItem: string;
  buttonAlignment: string;
  widgetHeight: string;
  childObjectTypeID: number;
  parentObjectTypeID: number;
  showHistoryOnParent: boolean;
  dataGroupCriteria: string;
  objectTypeID: number;
  widgetJSClickEvent: string;
  keyField: string;
  objectTypeTypeID: number;
  columnGroupInfo: ColumnGroupInfo;
  /**
   * The same as 'columnGroupInfo' but this is what the API returns
   * for the widgets
   */
  columnGroup: ColumnGroupInfo;
  renderFormWidgetData: any;
}

export class ColumnGroupInfo {
  columnGroupID: number;
  dataGroupID: number;
  columnGroupName: string;
  columnGroupAlign: string;
  columnGroupUnits: string;
  widgetAddButtonWidth: string;
  widgetAddButtonText: string;
  widgetJSClickEvent: string;
  totalsRowCSS: string;
  totalsColumnCSS: string;
  rowCSS: string;
  altRowCSS: string;
  widgetLinkButtonText: string;
  widgetImportButtonText: string;
  widgetSelectionButtonText: string;
  widgetComparisonButtonText: string;

  columnFields: ColumnFields[];
}

export class ColumnFields {
  columnFieldID: number;
  columnGroupID: number;
  dataFieldID: number;
  columnHeader: string;
  columnLabel: string;
  columnWidth: number;
  columnSortOrder: number;
  showInListView: boolean;
  columnListRow: number;
  groupByRow: boolean;
  groupByColumn: boolean;
  groupByRowDataTypeID: number;
  groupByColumnDataTypeID: number;
  sumField: string;
  sumFieldDataTypeID: number;
  totalByRow: boolean;
  totalByColumn: boolean;
  columnHeaderCSS: string;
  columnCellCSS: string;
  columnColspan: number;
  showMultiFilter: boolean;
  defaultViewField: boolean;
  selectableField: boolean;
  linkField: boolean;
  redirector_OIDField: string;
  redirector_OTIDField: string;
  redirector_OTTIDField: string;
  otidValue: number;
  listPageFieldType: string;
  popupWindowID: number;
  dataFieldName: string;
  dataFieldSQL: string;
  dataFieldTable: string;
  dataFieldJoinSQL: string;
  systemGroupID: number;
  dataFieldDataType: string;
  formItemID: number;
  dataFieldTableField: string;
  dataFieldRequiresDistinct: boolean;
  dataTypeFormatString: string;
  dataFieldDescription: string;
  dataFieldConstant: string;
}

export class SaveRenderFormDto {
  formItemId: string;
  formItemTypeId: string;
  oldValue: string;
  newValue: string;
  type: string;
}

export class SaveRenderFormCommand {
  isDynamicPopup: boolean = false;
  formId: number;
  objectId: number;
  objectTypeId: number;
  objectTypeTypeId: number;
  relatedObjectId: number;
  relatedObjectTypeId: number;
  relationshipDefinitionId: number;
  formItems: SaveRenderFormDto[];
}

export enum AllowedObjectTypes {
  PROJECT = 1,
  PREMISE = 2,
  BUILDING = 3,
  LEASE = 4,
  REPORT = 7,
}

export class RenderFormItemDetails {
  formItemId: string;
  formItemTypeId: string;
  oldValue: string;
  type: string;
  labelName: string;
  section: string;
}

export interface WorkFlowStatus {
  wfsID: number;
  wfsStep: number;
  wfsName: string;
}

export interface UpdateLeaseVerificationStatusRequest {
  objectID: number;
  objectTypeID: number;
  status: number;
  oldStatus: number;
  comments: string;
}

/**
 * Widget Type, corresponding to the 'Configure Widget' page
 */
export enum FormWidgetTypeID {
  COMPARE_ITEM = 6,
  COMPARISON = 3,
  CROSS_TAB = 2,
  DYNAMIC = 9,
  EDIT_LIST = 1,
  GROUPED_LIST = 8,
  LINKLIST = 5,
  PIVOT_DYNAMIC = 11,
  REPORT_ITO = 4,
  SUMMARY = 7,
  SUMMARY_DYNAMIC = 1,
}

/**
 * Extracts only the values of the enum to be used as a type for Widget class
 */
export type FormWidgetTypeIDValue = `${FormWidgetTypeID}` extends `${number}`
  ? number
  : never;

export interface DeleteSubObjectRequest {
  objectId: number;
  objectTypeId: number;
  relatedObjectId: number;
  relatedObjectTypeId: number;
  relationshipDefinitionId: number;
}

/**
 * Enum representing control type IDs used in the form wizard.
 * These IDs correspond to different types of form input controls such as dropdowns, text fields, etc.
 *
 * Mapped from `formItemType.formItemTypeID` in the data model.
 * Examples: dropdown, input, text-area, date.
 * Note: Use tblFormItemType as a reference
 *
 * @export
 * @enum {number}
 */
export enum FormWizardTypeID {
  LIST_BOX = 1, // Dropdown or list selection
  TEXT_FIELD = 2, // Single-line text input
  COMMENT_AREA = 3, // Multi-line text area
  RADIO_BUTTON = 5,
  WIDGET = 8,
  CALCULATED = 9,
  MULTI_SELECT = 13,
}
export type FormWizardTypeIDType = keyof typeof FormWizardTypeID;

/**
 * Enum representing data type IDs used to determine input masking behavior.
 * These are contextually dependent on the selected `FormWizardTypeID`.
 *
 * Mapped from `formItemSectionDetail.dataTypeID` in the data model.
 * Examples: currency, double, percent, date, etc.
 * Note: Use tblDataTypes as a reference
 *
 * @export
 * @enum {number}
 */
export enum FormWizardDataTypeID {
  SMALL_INT = 2,
  INTEGER = 3,
  DOUBLE = 5,
  CURRENCY = 6,
  DATE = 7,
  NUMBER = 131,
  CHAR = 200,
  EMAIL = 201,
  W_CHAR = 202,
  PERCENT = 206,
}
export type FormWizardDataTypeIDType = keyof typeof FormWizardDataTypeID;

export type FormWizardFieldType =
  | FormWizardTypeIDType
  | FormWizardDataTypeIDType;
