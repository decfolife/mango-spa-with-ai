export interface ISectionItem {
  dataField?: string;
  caption?: string;
  displayExpr?: string;
  valueExpr?: string;
  fieldType:
    | 'dropdown'
    | 'text'
    | 'toggle'
    | 'checkbox'
    | 'date'
    | 'customCombination'
    | 'empty'
    | 'toFromDate'
    | 'custom'
    | 'hierarchyDropdown';
  value?: any;
  required?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  dataSource?: any;
  trueDisplay?: any;
  falseDisplay?: any;
  maxLengthMessage?: string;
  maxLength?: number;
  showClearButton?: boolean;
  textDisplay?: string;
  textDisplayFontSize?: number;
  dropdownFields?: any;
  defaultValue?: any;
  combinationType?: string;
  initialFocus?: boolean;
  hoverText?: string;
  selectMode?: string;
  placeholder?: string;
  customRequireValidation?: boolean;
  dataField1?: string;
  dataField2?: string;
  parentIdExpr?: string; // for hierarchyDropdown
  rootValue?: any; // for hierarchyDropdown - value that identifies root items
  dropDownContainerCustomClass?: string; // for hierarchyDropdown styling
}
export interface IForm {
  formTitle?: string;
  section: {
    sectionTitle?: string;
    sectionId?: string;
    hideBorder?: boolean;
    showBottomBorder?: boolean;
    colCount?: number;
    formObjects: {
      subSectionId?: string;
      sectionItems: ISectionItem[];
    }[];
  }[];
}
