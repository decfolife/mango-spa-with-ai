import { CommonModule, formatDate } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  Inject,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  DeleteSubObjectRequest,
  FormWizardDataTypeID,
  FormWizardDataTypeIDType,
  SaveRenderFormCommand,
} from '@forms/model/dynamic-forms.interface';
import { DynamicFormsService } from '@forms/services/dynamic-forms.service';
import { ObjectType, ToastState } from '@mango/data-models/lib-data-models';
import {
  ButtonModule,
  CremToastService,
  DatePickerComponent,
  DatePickerModule,
  DropdownComponent,
  DropdownModule,
  InputComponent,
  LoaderModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { FormWizardService } from '@micro-components/services/form-wizard.service';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { filter, finalize, switchMap, take } from 'rxjs/operators';
import { CremPipesModule } from 'libs/core-shared/src/lib/pipes/pipes.module';
import { Router } from '@angular/router';
import {
  GetFieldTypePipe,
  IsFieldRequiredPipe,
  MaskInputPipe,
} from './dynamic-form-field.pipe';
import { DynamicPopupUtilitiesService } from './dynamic-popup-utilities.service';
import { DataType } from 'libs/data-models/lib-data-models/src/lib/enums/index';
import { DeleteSubObjectPopupComponent } from '@forms/admin-render-forms/dynamic-form/dynamic-form-widgets/delete-subobject-popup/delete-subobject-popup.component';
import { deepFreeze } from 'libs/core-shared/src/lib/utilities/utils';

// TODO: Replace this with the `FormWizardTypeID` and `FormWizardDataTypeID` enums
const RENDER_LOOKUP_SQL = 998;
const FORM_ITEM_LIST_BOX_ID = 1;
const FORM_ITEM_LIST_BOX = 'List Box';
const FORM_ITEM_MULTI_LIST_BOX_ID = 13;
const FORM_ITEM_TEXT_FIELD_ID = 2;
const FORM_ITEM_TEXT_FIELD = 'Text Field';
const FORM_ITEM_TEXT_AREA_FIELD_ID = 3;
const FORM_ITEM_DATE_FIELD = 7;
const FORM_ITEM_ROLE_TITLE = 'Role';
const FORM_ITEM_ROLE_FRIENDLY_NAME = 'CommonTeam_Role_Company';
const NUMERIC_DATA_TYPE_IDS: number[] = [
  DataType.SMALL_INT,
  DataType.INTEGER,
  DataType.DOUBLE,
  DataType.CURRENCY,
  DataType.IDISPATCH,
  DataType.NUMERIC_9W,
  DataType.PERCENT,
];

@Component({
  selector: 'mango-dynamic-popup',
  templateUrl: './dynamic-popup.component.html',
  styleUrls: ['./dynamic-popup.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    LoaderModule,
    DropdownModule,
    ModalModule,
    InputComponent,
    DatePickerModule,
    CremPipesModule,
    GetFieldTypePipe,
    IsFieldRequiredPipe,
    MaskInputPipe,
  ],
  providers: [DynamicPopupUtilitiesService, GetFieldTypePipe],
})
export class DynamicPopupComponent implements OnInit, OnDestroy {
  footerButtonDisabled = false as boolean;
  dynamicForm: FormGroup;
  popupData: any;
  sectionName: any;
  dropdownValues$: Observable<any[]>;
  isDropdownValuesLoading = true as boolean;
  dropdownData: any;
  initialSelectedValue: any = '';
  widgetDetails: any;
  widgetEditData: any;
  selectedItem = '' as string;
  renderSelectConst: any;
  controlValue: any = '';
  controlName: any = '';
  changedFormItemKeys: any[] = [];
  dropdownDtlList: any[] = [];
  textInputList: any[] = [];
  dateInputList: any[] = [];
  parentChildCtrlList: any[] = [];
  defaultDropDownIndex = -1 as number;
  isEditMode = false as boolean;
  isFormValid = false as boolean;
  isSubObject = false as boolean;

  _isLoading = true as boolean;
  _isSaving = false as boolean;
  _isSavingAndNew = false as boolean;
  _debug = false as boolean;
  private subs: Subscription = new Subscription();
  originalDropdownSelection: any[] = [];
  originalDropdownDS: any;
  @ViewChildren(DropdownComponent) dropdowns!: QueryList<DropdownComponent>;
  @ViewChildren(DatePickerComponent)
  datePickers!: QueryList<DatePickerComponent>;
  savedOnce = false;

  // TODO: This may need a service, this component seems to do too many things, please break down
  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<DynamicPopupComponent>,
    private dynamicFormsService: DynamicFormsService,
    private formWizardService: FormWizardService,
    private toastService: CremToastService,
    private router: Router,
    private dynamicPopupUtilities: DynamicPopupUtilitiesService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  async loadWidgetData() {
    this.widgetDetails = await this.dynamicFormsService
      .getFormSections(this.data.formId, 0)
      .pipe(
        filter((section) => section !== null),
        take(1),
        switchMap((section) => {
          this.sectionName = section.data[0].formSectionName;
          return combineLatest([
            this.dynamicFormsService
              .getFormFields(
                this.data.formId,
                section.data[0].formSectionID,
                this.data.objectTypeId,
                0,
                this.data.relatedObjectId
              )
              .pipe(
                filter((fields) => !!fields),
                take(1)
              ),
            this.dynamicFormsService
              .getRenderFormFormItemDropdowns(
                this.data.formId,
                0,
                this.data.objectTypeId,
                this.data.relatedObjectId,
                this.data.relatedObjectTypeId
              )
              .pipe(
                filter((renderFormData) => !!renderFormData),
                take(1)
              ),
          ]);
        })
      )
      .toPromise();

    if (this.widgetDetails[0].success) {
      if (this.data.isSubObject) this.isSubObject = true;
      if (this.data.isEdit == true) {
        await this.widgetDetails.push(this.widgetEditData);
      }
      this.popupData = this.widgetDetails[0].data;
      if (this.widgetDetails[1].success) {
        this.originalDropdownDS = this.widgetDetails[1].data;
        for (
          let index = 0;
          index < Object.keys(this.widgetDetails[1].data).length;
          index++
        ) {
          const formItemId = Object.keys(this.widgetDetails[1].data)[index];
          const selection =
            this.widgetDetails[0].data.find((d) => d.formItemID == formItemId)
              .defaultValue ?? this.widgetDetails[1].data[formItemId][0]?.value;
          this.widgetDetails[1].data[formItemId].selectedValue = selection;
          this.originalDropdownSelection[formItemId] = selection;
        }
        this.dropdownData = this.widgetDetails[1].data;
        this.dropdownValues$ = of(this.widgetDetails[1].data);
        this.isDropdownValuesLoading = false;
      }
      this._isLoading = false;
    }
    return this.widgetDetails;
  }

  async ngOnInit(): Promise<void> {
    if (this.data.isEdit == true) {
      this.isEditMode = true;
      await this.getWidgetData();
    }
    await this.loadWidgetData();

    this.dynamicForm = new FormGroup({});

    if (this.popupData && this.popupData.length > 0) {
      for (let index = 0; index < this.popupData.length; index++) {
        const validators = [];
        const { isRequired } = await this.isMandatoryField(index);

        // Identify data Type ID and add validators
        const dataTypeName: FormWizardDataTypeIDType = FormWizardDataTypeID[
          this.popupData[index].formItemSectionDetail.dataTypeID
        ] as FormWizardDataTypeIDType;

        if (
          dataTypeName === 'EMAIL' &&
          // fixme: Check if contains the keyword email on the label, dataTypeName is not always reliable
          this.popupData[index].formItemFriendlyName.includes('Email')
        ) {
          // Angular's Validators.email is very permissive. Reason why a custom validator is used
          validators.push(this.dynamicPopupUtilities.strictEmailValidator);
        }

        if (isRequired) {
          validators.push(Validators.required);
        }

        this.dynamicForm.addControl(
          this.popupData[index].formItemSectionDetail.formItemDisplayLabel
            .replace(/:/g, '')
            .trim(),
          new FormControl('', validators)
        );

        //Update Dynamic Form and save data for Prefilled form items
        if (
          this.widgetDetails[1].data[this.popupData[index].formItemID] !=
            null &&
          this.widgetDetails[1].data[this.popupData[index].formItemID]
            .selectedValue
        ) {
          if (
            this.popupData[index].formItemSectionDetail.formItemJavaScript !=
              null &&
            this.widgetDetails[1].data[this.popupData[index].formItemID]
              .selectedValue != 0
          ) {
            const selectedItem = [];
            selectedItem[0] = this.widgetDetails[1].data[
              this.popupData[index].formItemID
            ].find(
              (s) =>
                s.value ===
                this.widgetDetails[1].data[this.popupData[index].formItemID]
                  .selectedValue
            );

            await this.onDropdownValueChanged(
              selectedItem,
              this.popupData[index].formItemSectionDetail.formItemJavaScript,
              this.popupData[index],
              false
            );
          }

          //Added below code to save Role by Display text when blank text from Role Dropdown is selected
          if (
            this.popupData[index].formItemFriendlyName ===
              FORM_ITEM_ROLE_FRIENDLY_NAME ||
            this.popupData[index].formItemSectionDetail.formItemDisplayLabel ===
              FORM_ITEM_ROLE_TITLE
          )
            this.updateDynamicFormValues(
              this.popupData[index],
              this.widgetDetails[1].data[this.popupData[index].formItemID][0]
                .display,
              null
            );
          else {
            if (
              this.widgetDetails[1].data[this.popupData[index].formItemID]
                .selectedValue == '0' &&
              this.widgetDetails[1].data[this.popupData[index].formItemID][0]
                .display === ''
            )
              this.updateDynamicFormValues(this.popupData[index], null);
            else
              this.updateDynamicFormValues(
                this.popupData[index],
                this.widgetDetails[1].data[this.popupData[index].formItemID]
                  .selectedValue
              );
          }
        } else {
          if (
            this.popupData[index] != null &&
            this.popupData[index].defaultValue
          ) {
            this.updateDynamicFormValues(
              this.popupData[index],
              this.popupData[index].defaultValue.indexOf('SELECT @ROID') > -1
                ? this.data.relatedObjectId.toString()
                : this.popupData[index].defaultValue
            );
          }
        }
      }
    }

    if (this.data.isEdit == true) await this.populateWidgetData();
  }

  //Populate Widget data in edit mode
  async populateWidgetData() {
    const widgetDataToPopulate = this.widgetDetails[2];
    if (widgetDataToPopulate && widgetDataToPopulate.data?.length > 0) {
      for (let index = 0; index < widgetDataToPopulate.data.length; index++) {
        const element = widgetDataToPopulate.data[index];
        const formItemToEdit = this.popupData.find(
          (i) => i.formItemID == element.formItemID
        );
        if (
          element.formItemAnswer != null &&
          element.formItemAnswer != '' &&
          (element.formItemTypeID == FORM_ITEM_TEXT_FIELD_ID ||
            element.formItemTypeID == FORM_ITEM_TEXT_AREA_FIELD_ID)
        ) {
          let formattedValue = element.formItemAnswer;
          if (NUMERIC_DATA_TYPE_IDS.includes(+element.dataTypeID)) {
            formattedValue = this.dynamicPopupUtilities.localFormat(
              +element.formItemAnswer,
              +element.numDecimals
            );
          }
          this.textInputList[element.formItemID] = formattedValue;
        }
        if (+element.dataTypeID == FORM_ITEM_DATE_FIELD) {
          this.dateInputList[element.formItemID] = element.formItemAnswer;
        }
        if (
          element.formItemTypeID == FORM_ITEM_LIST_BOX_ID ||
          element.formItemTypeID == FORM_ITEM_MULTI_LIST_BOX_ID
        ) {
          const value = element.formItemAnswer;
          await this.onDropdownValueChanged(
            value,
            formItemToEdit.formItemSectionDetail.formItemJavaScript,
            formItemToEdit,
            true
          );
          const displayRoleData =
            await this.dynamicPopupUtilities.getRoleDropDownDisplayData(
              this.widgetDetails,
              element.formItemID,
              value
            );
          if (this.widgetDetails[1].data[element.formItemID])
            this.widgetDetails[1].data[element.formItemID].selectedValue =
              displayRoleData != '' ? displayRoleData : value;
        }
        this.updateDynamicFormValues(formItemToEdit, element.formItemAnswer);
      }
    }
  }

  async getWidgetData() {
    this.widgetEditData = await this.dynamicFormsService
      .getRenderFormData(
        this.data.formId,
        this.data.objectId,
        this.data.objectTypeId,
        this.data.relatedObjectId,
        this.data.relatedObjectTypeId,
        true
      )
      .toPromise();

    // Prevent changing the original form data.
    deepFreeze(this.widgetEditData);
  }

  private async isMandatoryField(index: any) {
    return {
      isRequired:
        this.popupData[
          index
        ].formItemSectionDetail.formItemMandatory.toLowerCase() == 'yes',
    };
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  async onDropdownValueChanged(
    e: any,
    formItemJavaScript: any,
    formItem: any,
    isEdit: boolean
  ) {
    if (e != null) {
      let isRole = false;
      let selectedValue: any;
      // Normalize selectedValue for edit mode (incoming value may be a comma-separated string)
      if (isEdit) {
        // If this is a list box / multi-select, convert to an array of strings
        if (formItem.formItemTypeID === FORM_ITEM_MULTI_LIST_BOX_ID) {
          if (Array.isArray(e)) {
            selectedValue = e.map((v: any) => v?.toString());
          } else if (typeof e === 'string') {
            selectedValue = e === '' ? [] : e.split(',').map((s) => s.trim());
          } else if (e == null) {
            selectedValue = [];
          } else {
            selectedValue = [e.toString()];
          }
        } else {
          selectedValue = e.toString();
        }
      } else {
        selectedValue =
          e.length == 1 && e[0]
            ? e[0].value.toString()
            : e.length > 1
            ? e.map((v: any) => v?.value.toString())
            : e.toString();
      }
      if (
        selectedValue &&
        selectedValue !== '0' &&
        selectedValue !== '-1' &&
        this.isEditMode &&
        this.dropdownData[formItem.formItemID]?.selectedValue?.toString() ===
          selectedValue?.toString()
      ) {
        console.warn('Duplicate Call, please return');
        return;
      }
      if (
        formItem.formItemFriendlyName === FORM_ITEM_ROLE_FRIENDLY_NAME ||
        formItem.formItemSectionDetail.formItemDisplayLabel ===
          FORM_ITEM_ROLE_TITLE
      )
        isRole = true;
      if (selectedValue && selectedValue !== '0' && selectedValue !== '-1') {
        if (isRole) {
          const displayRole =
            Array.isArray(e) && e[0]?.display
              ? e[0].display.toString()
              : await this.dynamicPopupUtilities.getRoleDropDownDisplayData(
                  this.widgetDetails,
                  formItem.formItemID,
                  selectedValue
                );
          this.updateDynamicFormValues(formItem, displayRole);
        } else this.updateDynamicFormValues(formItem, selectedValue);
        if (formItemJavaScript != null && formItemJavaScript.length > 0) {
          this.getChildDropDownDetails(
            formItemJavaScript,
            selectedValue,
            formItem.formItemID,
            isEdit
          );
        }
      } else {
        //if parent dropdown has default value selected, reload the child dropdown to display blank or respective default values
        if (
          this.parentChildCtrlList.findIndex(
            (c) => c.parentCtrlId == formItem.formItemID
          ) > -1
        ) {
          this.updateDynamicFormValues(formItem, '');
          let childCtrls = this.parentChildCtrlList.find(
            (c) => c.parentCtrlId == formItem.formItemID
          ).childCtrlId;
          childCtrls = childCtrls.split(',');
          for (let index = 0; index < childCtrls.length; index++) {
            const dropdownDataList = [];
            const value = this.defaultDropDownIndex;
            const display = '';
            const lookUpParent = this.popupData.find(
              (item) => item.formItemID == childCtrls[index]
            );
            this.updateDynamicFormValues(lookUpParent, '');
            if (lookUpParent?.formItemTypeID === FORM_ITEM_LIST_BOX_ID) {
              dropdownDataList.push({ value, display });
              this.widgetDetails[1].data[lookUpParent.formItemID] =
                dropdownDataList;
            }
            if (
              lookUpParent?.formItemTypeID === FORM_ITEM_TEXT_FIELD_ID ||
              lookUpParent?.formItemTypeID === FORM_ITEM_TEXT_AREA_FIELD_ID
            ) {
              this.textInputList[childCtrls[index]] = '';
            }
          }
        } else {
          this.updateDynamicFormValues(
            formItem,
            isRole
              ? e[0]?.display?.toString()
              : selectedValue === -1 && e[0]?.display.indexOf('[') >= 0
              ? ''
              : selectedValue === '0' && e[0]?.display === ''
              ? null
              : selectedValue
          );
        }
      }
    }
  }

  async onDateChanged(e: any, formItem: any) {
    let date = '';
    if (e.value !== null && e.value !== '') {
      date = formatDate(
        e.value,
        formItem.formItemSectionDetail.dataTypeFormatString === 'MM/DD/YYYY'
          ? 'MM/dd/yyyy'
          : 'MM/dd/yyyy',
        'en-US'
      );
    }
    this.dateInputList[formItem.formItemID] = date;
    this.updateDynamicFormValues(formItem, date);
  }

  //update Dynamic form
  updateDynamicFormValues(
    formItem: any,
    formItemValue: any,
    oldValue: any = ''
  ) {
    this.dynamicForm
      .get(
        formItem.formItemSectionDetail.formItemDisplayLabel
          .replace(/:/g, '')
          .trim()
      )
      .setValue(formItemValue);
    if (Array.isArray(formItemValue)) {
      formItemValue = formItemValue
        .map((v: any) => (v ?? '').toString())
        .join(',');
    }
    if (Array.isArray(oldValue)) {
      oldValue = oldValue.map((v: any) => (v ?? '').toString()).join(',');
    }
    this.updateFormItem(formItem, formItemValue, oldValue);
  }

  //Populate the child dropdown data based on formItemJavaScript from parent dropdown list
  async getChildDropDownDetails(
    formItemJavaScript: string,
    lookUpId: any,
    parentCtrlId: number,
    isEdit: boolean
  ) {
    //Updated code to handle ToggleListBox(for Country-State selection)
    const initialArr =
      formItemJavaScript.indexOf('DisplayNewItems') > -1
        ? formItemJavaScript.split('DisplayNewItems(')
        : formItemJavaScript.indexOf('ToogleTextList') > -1
        ? formItemJavaScript.split('ToogleTextList(')
        : '';

    if (formItemJavaScript.indexOf('ToogleTextList') > -1) {
      //Create/update dropdown list for parent-child relation
      if (
        this.parentChildCtrlList.length == 0 ||
        this.parentChildCtrlList.findIndex(
          (p) => p.parentCtrlId === parentCtrlId
        ) == -1
      ) {
        this.parentChildCtrlList.push({
          parentCtrlId: parentCtrlId,
          childCtrlId: '',
        });
      }
      for (let index = 1; index < initialArr.length; index++) {
        const lookupId = lookUpId;
        const firstItem = initialArr[index].replace(/&#39;/g, '');
        const splitJsArray = firstItem.split(',');
        const formItem = this.popupData.find(
          (s) => s.formItemConstant === splitJsArray[2].split('|')[1]
        );
        this.renderSelectConst = splitJsArray[1];
        this.updateParentChildCtrlList(parentCtrlId, formItem.formItemID);
        await this.buildChildDropDown(
          lookupId,
          this.renderSelectConst,
          formItem,
          this.selectedItem,
          '',
          isEdit,
          true
        );
      }
    } else {
      if (
        this.parentChildCtrlList.length == 0 ||
        this.parentChildCtrlList.findIndex(
          (p) => p.parentCtrlId === parentCtrlId
        ) == -1
      ) {
        this.parentChildCtrlList.push({
          parentCtrlId: parentCtrlId,
          childCtrlId: '',
        });
      }
      for (let index = 1; index < initialArr.length; index++) {
        let lookupId = lookUpId;
        this.selectedItem = '';
        const firstItem = initialArr[index].replace(/&#39;/g, '');
        const splitJsArray = firstItem.split(',');
        let formItemId;
        if (splitJsArray[0].indexOf('document.forms[0]') > -1) {
          splitJsArray[0].replace('document.forms[0].', '');
          const formItemCnst = splitJsArray[0].split('|')[1];
          formItemId = this.widgetDetails[0].data
            .find((itm) => itm.formItemConstant === formItemCnst)
            ?.formItemID.toString();
        } else formItemId = splitJsArray[0];
        const formItem = this.popupData.find((item) =>
          formItemId.indexOf(item.formItemID) > -1 ? item : ''
        );
        this.renderSelectConst = splitJsArray[2];
        if (splitJsArray.length > 8) {
          //LookUpID is based on multiple values
          if (splitJsArray[2].indexOf('+') > -1 && splitJsArray.length > 9) {
            this.renderSelectConst = splitJsArray[3];
            const lookUpParentId = splitJsArray[2];
            const lookUpParent = this.popupData.find((item) =>
              lookUpParentId.indexOf(item.formItemID) > -1 ? item : ''
            );
            const cntrlValue = this.dropdownDtlList.find(
              (ctrl) => ctrl.controlName == lookUpParent.formItemID
            )
              ? this.dropdownDtlList.find(
                  (ctrl) => ctrl.controlName == lookUpParent.formItemID
                ).controlValue
              : '';
            lookupId = lookupId + ',' + cntrlValue;
            this.selectedItem = splitJsArray[9].replace(/[();]/g, '');
          } else {
            this.selectedItem = splitJsArray[8].replace(/[();]/g, '');
          }
          this.selectedItem = this.selectedItem.substring(
            0,
            this.selectedItem.indexOf(']') + 1
          );
        }
        this.updateParentChildCtrlList(parentCtrlId, formItem.formItemID);
        if (
          splitJsArray.length == 7 &&
          splitJsArray[6].toLowerCase().indexOf('sp') > -1
        ) {
          const lookupSQlSP = splitJsArray[6].replace(
            ' + this.value)',
            lookUpId
          );
          await this.buildChildDropDown(
            lookupId,
            this.renderSelectConst,
            formItem,
            '',
            lookupSQlSP,
            isEdit
          );
        } else
          await this.buildChildDropDown(
            lookupId,
            this.renderSelectConst,
            formItem,
            this.selectedItem,
            '',
            isEdit
          );
        if (firstItem.toLowerCase().indexOf('toogletextvalue') > -1) {
          await this.getValueByLookupSQL(
            firstItem,
            lookupId,
            parentCtrlId,
            isEdit
          );
        }
      }
    }
  }

  /**
   * Maintain the list for parent child relationship of dropdown controls
   *
   * @param parentCtrlId
   * @param childCtrlId
   */
  updateParentChildCtrlList(parentCtrlId: any, childCtrlId: any) {
    if (
      this.parentChildCtrlList.length > 0 ||
      this.parentChildCtrlList.findIndex(
        (p) => p.parentCtrlId === parentCtrlId
      ) > -1
    ) {
      const parentIndex = this.parentChildCtrlList.findIndex(
        (p) => p.parentCtrlId == parentCtrlId
      );

      if (this.parentChildCtrlList[parentIndex].childCtrlId === '') {
        this.parentChildCtrlList[parentIndex].childCtrlId =
          childCtrlId.toString();
      } else {
        if (
          this.parentChildCtrlList[parentIndex].childCtrlId
            .toString()
            .indexOf(childCtrlId) == -1
        )
          this.parentChildCtrlList[parentIndex].childCtrlId =
            this.parentChildCtrlList[parentIndex].childCtrlId +
            ',' +
            childCtrlId;
      }
    }
  }

  /**
   * fetch data based on LookUpSQL
   *
   * @param {string} sqlText
   * @param {string} lookUpId
   * @param {*} parentCtrlId
   * @param {boolean} isEdit
   * @memberof DynamicPopupComponent
   */
  async getValueByLookupSQL(
    sqlText: string,
    lookUpId: string,
    parentCtrlId: any,
    isEdit: boolean
  ) {
    const lookupSQLArr = sqlText.toLowerCase().split('toogletextvalue')[1];
    const lookupParentCtrl = this.popupData.find((item) =>
      lookupSQLArr.split(',')[1].indexOf(item.formItemID) > -1 ? item : ''
    );
    this.updateParentChildCtrlList(parentCtrlId, lookupParentCtrl.formItemID);
    await this.buildChildDropDown(
      '',
      RENDER_LOOKUP_SQL,
      lookupParentCtrl,
      this.selectedItem,
      lookupSQLArr
        .split(',')[0]
        .replace(/[()]/g, '')
        .replace('+ this.value', lookUpId),
      isEdit
    );
  }

  /**
   * Fetch dropdown data using renderSelectAPI Call
   *
   * @param {*} lookupId
   * @param {*} requestTypeId
   * @param {*} formControl
   * @param {string} [selectedValue='' as string]
   * @param {string} [lookupSQL='' as string]
   * @param {boolean} [isEdit=false as boolean]
   * @return {*}
   * @memberof DynamicPopupComponent
   */
  async buildChildDropDown(
    lookupId: any,
    requestTypeId: any,
    formControl: any,
    selectedValue = '' as string,
    lookupSQL = '' as string,
    isEdit = false as boolean,
    isToggleList = false as boolean
  ) {
    try {
      const renderSelectResult = await this.formWizardService
        .getRenderSelect(
          lookupId,
          requestTypeId,
          lookupSQL,
          '',
          '',
          '',
          1,
          25,
          true
        )
        .pipe(
          filter((data) => data != null),
          take(1)
        )
        .toPromise();
      if (renderSelectResult?.success) {
        const dropdownDataList = [];
        const value = this.defaultDropDownIndex;
        const display = selectedValue;
        const itmArray =
          renderSelectResult.data?.items?.length > 0
            ? renderSelectResult.data.items
            : renderSelectResult.data;
        const isControlExist =
          this.dropdownDtlList.findIndex(
            (ctrl) => ctrl.controlName === formControl.formItemID
          ) > -1;

        if (
          (itmArray.length == 0 &&
            formControl.formItemTypeID === FORM_ITEM_LIST_BOX_ID) ||
          (itmArray.length == 0 &&
            formControl.formItemTypeID === FORM_ITEM_MULTI_LIST_BOX_ID)
        ) {
          if (isControlExist)
            this.dropdownDtlList.find(
              (ctrl) => ctrl.controlName === formControl.formItemID
            ).controlValue = '';
          if (!isToggleList) {
            if (selectedValue !== '') dropdownDataList.push({ value, display });
            this.widgetDetails[1].data[formControl.formItemID] =
              dropdownDataList;
            this.widgetDetails[1].data[formControl.formItemID].selectedValue =
              selectedValue !== '' ? value : '';
          } else {
            this.widgetDetails[0].data.find(
              (d) => d.formItemID == formControl.formItemID
            ).formItemType.formItemType = FORM_ITEM_TEXT_FIELD;
            this.widgetDetails[0].data.find(
              (d) => d.formItemID == formControl.formItemID
            ).formItemType.formItemTypeID = FORM_ITEM_TEXT_FIELD_ID;
            this.widgetDetails[1].data[formControl.formItemID].selectedValue =
              '';
            this.textInputList[formControl.formItemID] = '';
          }

          this.updateDynamicFormValues(
            formControl,
            '',
            this.isEditMode
              ? this.widgetDetails[2].data.find(
                  (item) => item.formItemID == formControl.formItemID
                )?.formItemAnswer
              : ''
          );
        }
        if (itmArray.length > 0) {
          if (isToggleList) {
            this.widgetDetails[0].data.find(
              (d) => d.formItemID == formControl.formItemID
            ).formItemType.formItemType = FORM_ITEM_LIST_BOX;
            this.widgetDetails[0].data.find(
              (d) => d.formItemID == formControl.formItemID
            ).formItemType.formItemTypeID = FORM_ITEM_LIST_BOX_ID;
          }
          this.controlName = formControl.formItemID;
          this.controlValue =
            Object.values(itmArray[0])[0] != null
              ? Object.values(itmArray[0])[0].toString()
              : '';
          //setup default dropdownindex  for dropdown list to set it as initial selected value
          if (formControl.formItemTypeID === FORM_ITEM_LIST_BOX_ID) {
            //store dropdown details(selected values)
            if (isControlExist) {
              this.dropdownDtlList.find(
                (ctrl) => ctrl.controlName === this.controlName
              ).controlValue = this.controlValue;
            } else {
              this.dropdownDtlList.push({
                controlName: formControl.formItemID,
                controlValue: this.controlValue,
              });
            }
            if (
              lookupSQL != '' ||
              (selectedValue === '' && itmArray.length == 1)
            ) {
              selectedValue =
                Object.values(itmArray[0])[1] != null
                  ? Object.values(itmArray[0])[1].toString()
                  : '';
            } else {
              dropdownDataList.push({ value, display });
            }
            for (let index = 0; index < itmArray.length; index++) {
              const value =
                Object.values(itmArray[index])[0] != null
                  ? Object.values(itmArray[index])[0]
                  : '';
              const display =
                Object.values(itmArray[index])[1] != null
                  ? Object.values(itmArray[index])[1]
                  : '';
              //update the datasource for dropdown list
              dropdownDataList.push({ value, display });
            }

            if (isEdit) {
              const selectedDropdownItem = dropdownDataList.find(
                (d) =>
                  d?.value?.toString() ===
                  this.widgetDetails[2].data.find(
                    (i) => i.formItemID == formControl.formItemID
                  )?.formItemAnswer
              );
              selectedValue = selectedDropdownItem
                ? selectedDropdownItem.value
                : dropdownDataList[0].value;
            }
            this.widgetDetails[1].data[formControl.formItemID] =
              dropdownDataList;

            // Normalize selectedValue for list-box controls to arrays
            if (formControl.formItemTypeID === FORM_ITEM_MULTI_LIST_BOX_ID) {
              let normalized: any = isEdit
                ? selectedValue
                : dropdownDataList[0].value;
              if (typeof normalized === 'string') {
                normalized = normalized === '' ? [] : normalized.split(',');
              } else if (normalized == null) {
                normalized = [];
              } else if (!Array.isArray(normalized)) {
                normalized = [normalized];
              }
              this.widgetDetails[1].data[formControl.formItemID].selectedValue =
                normalized;
            } else {
              this.widgetDetails[1].data[formControl.formItemID].selectedValue =
                isEdit ? selectedValue : dropdownDataList[0].value;
            }
          } else {
            this.textInputList[formControl.formItemID] = this.controlValue;
            this.updateDynamicFormValues(formControl, this.controlValue);
          }
        }
      }
    } catch (error) {
      console.error('error', error);
      this.showToast('Error', 'An error has occurred. Please try again.');
      return { data: [], success: false };
    }
  }

  onNewInput(e: any, formItem: any) {
    const formItemValue = e;
    this.textInputList[formItem.formItemID] = formItemValue;
    this.updateDynamicFormValues(formItem, formItemValue);
  }

  async saveAndNew() {
    await this.save(true);
    this.savedOnce = true;
    // reset text inputs
    for (
      let index = 0;
      index < Object.keys(this.textInputList).length;
      index++
    ) {
      this.textInputList[Object.keys(this.textInputList)[index]] = '';
      this.updateDynamicFormValues(
        this.widgetDetails[0].data.find(
          (d) => d.formItemID == Object.keys(this.textInputList)[index]
        ),
        ''
      );
    }
    this.widgetDetails[1].data = [];
    this.widgetDetails[1].data = this.originalDropdownDS;
    // Reset Dropdowns
    for (
      let index = 0;
      index < Object.keys(this.originalDropdownSelection).length;
      index++
    ) {
      const formItemId = Object.keys(this.originalDropdownSelection)[index];
      const formItem = this.widgetDetails[0].data.find(
        (d) =>
          d.formItemID == Object.keys(this.originalDropdownSelection)[index]
      );
      const originalSelection = this.originalDropdownSelection[formItemId];
      const selectedItem = this.originalDropdownDS[formItemId].filter(
        (d) => d.value === originalSelection?.toString()
      );
      await this.onDropdownValueChanged(
        selectedItem,
        formItem.formItemSectionDetail.formItemJavaScript,
        formItem,
        false
      );

      this.resetDropdownComponents(formItem, originalSelection);

      this.widgetDetails[1].data[formItemId].selectedValue = originalSelection;
      if (
        originalSelection == '0' &&
        this.widgetDetails[1].data[formItemId][0].display === ''
      )
        this.updateDynamicFormValues(formItem, null);
      else this.updateDynamicFormValues(formItem, originalSelection);

      this.dynamicForm.valueChanges.subscribe();
    }

    // reset datepickers
    this.datePickers.forEach((x) => (x.value = ''));
  }

  resetDropdownComponents(formItem: any, originalSelection: string | number) {
    const dropdown = this.dropdowns.find(
      (dropdown) => dropdown.formControlName === formItem.formItemFriendlyName
    );

    dropdown?.setDropdownvalue(originalSelection);
  }

  /**
   * When 'Save' button is pressed
   * @param e
   */
  async save(saveAndNew = false as boolean) {
    if (this.changedFormItemKeys.length === 0 && this.dynamicForm.valid) {
      this.showToast('Saved successfully!', '', ToastState.SUCCESS);
      this.dialogRef.close(true);
      return;
    }

    // Validating fields
    if (!this.dynamicForm.valid) {
      // Get Specific validation errors
      const validationErrors =
        this.dynamicPopupUtilities.getFormValidationErrors(this.dynamicForm);
      const validationMessageError =
        this.dynamicPopupUtilities.getValidationErrorMessages(validationErrors);

      this.showToast(validationMessageError[0]);

      this._debug
        ? console.debug(validationMessageError, this.popupData)
        : null;

      return;
    }

    this._isSaving = true;
    const saveFormData: SaveRenderFormCommand = {
      isDynamicPopup: true,
      formId: this.data.formId,
      objectId: this.data.isEdit ? this.data.objectId : 0,
      objectTypeId: this.data.objectTypeId,
      objectTypeTypeId: this.data.objectTypeTypeId,
      relatedObjectId: this.data.relatedObjectId,
      relatedObjectTypeId: this.data.relatedObjectTypeId,
      relationshipDefinitionId: this.data.relatedDefinitionId,
      formItems: [],
    };
    saveFormData.formItems = [
      ...this.dynamicPopupUtilities.unMaskFields(
        this.changedFormItemKeys,
        this.popupData
      ),
    ];

    if (this._debug) {
      console.debug({
        formItems: this.changedFormItemKeys,
        popupData: this.popupData,
        unMaskedFields: saveFormData.formItems,
        saveFormData: saveFormData,
      });
    }

    if (this._debug) {
      console.debug({
        formItems: this.changedFormItemKeys,
        popupData: this.popupData,
        unMaskedFields: saveFormData.formItems,
        saveFormData: saveFormData,
      });
    }

    this.dynamicFormsService
      .saveRenderForm(saveFormData)
      .subscribe((saveResponse) => {
        if (saveResponse.success) {
          this.showToast('Saved successfully!', '', ToastState.SUCCESS);
          if (!saveAndNew) {
            this.dialogRef.close(saveResponse.success);
          }
          this._isSaving = false;
        } else {
          this.showToast('Save not successful');
        }
      });
  }

  /**
   * Centralizes toast configuration.
   *
   * @param {string} [content]
   * @param {string} [title]
   * @memberof DynamicPopupComponent
   */
  showToast(content?: string, title?: string, toastState?) {
    this.toastService.show(
      content ?? '',
      title ?? '',
      toastState ?? ToastState.ERROR,
      {
        duration: 3000,
        position: 'bottom right',
        maxWidth: '350px',
      }
    );
  }

  updateFormItem(formItem: any, value: string, oldValue = null) {
    const changedItem = {
      formItemId: formItem.formItemID,
      formItemTypeId: formItem.formItemTypeID,
      oldValue: oldValue,
      newValue: value,
      type: formItem.formItemConstant.includes('Dynamic')
        ? 'Dynamic'
        : formItem.formItemConstant.includes('Existing')
        ? 'Existing'
        : formItem.formItemConstant.includes('Clause')
        ? 'Clause'
        : 'Dynamic',
    };
    const orginalFormData = this.widgetEditData?.data || [];
    const changedItmIdx = this.changedFormItemKeys.findIndex((s) => {
      return s.formItemId === changedItem.formItemId;
    });

    let valueBeforeSave = '';

    const editDataIdx = orginalFormData.findIndex((x) => {
      return +x.formItemID === +changedItem.formItemId;
    });

    if (editDataIdx !== -1) {
      valueBeforeSave = orginalFormData[editDataIdx].formItemAnswer;
    }

    // if we have this already, just update newValue
    // on new, it's always -1 and we continue on
    if (changedItmIdx > -1) {
      // Check value === valueBeforeSave for case where user changes value and undoes it (ex: backspace)
      if (value === valueBeforeSave) {
        this.changedFormItemKeys.splice(changedItmIdx, 1);
      } else {
        this.changedFormItemKeys[changedItmIdx].newValue = value;
      }

      return;
    }

    if (changedItmIdx === -1 && value !== valueBeforeSave) {
      changedItem.oldValue = valueBeforeSave;
      this.changedFormItemKeys.push(changedItem);
    }
  }

  getDeleteCall(widgetObjectTypeID: any, payload: DeleteSubObjectRequest) {
    if (widgetObjectTypeID === ObjectType.VENDOR) {
      return this.dynamicFormsService.deleteVendor(payload);
    }
    return this.dynamicFormsService.deleteSubObject(payload);
  }

  handleDeleteDialog(dialogRes: boolean, rowData: any, hasCharges: boolean) {
    const errMsg = 'An error has occurred. Please try again.';
    const permssionMsg = 'User does not have delete rights';
    this._isLoading = true;
    if (dialogRes === false) {
      this._isLoading = false;
      return; // User closed the dialog. Do nothing
    }

    if (dialogRes && hasCharges) {
      this.router.navigate(['/v06/Financials/Admin/ChargeList.aspx'], {
        queryParams: {
          VendorID: rowData.data.oid,
          masterGroupID: rowData.data.mastergroupid,
          VendorCustomer: rowData.data.objecttypetypeid,
          CompanyID: rowData.data.companyid,
        },
      });
    }

    const payload = this.buildDeleteRequestPayload({
      rowData,
      widgetobjectTypeID: this.data.objectTypeId,
      widgetRelDefID: this.data.relatedDefinitionId,
      oid: this.data.relatedObjectId,
      otid: this.data.relatedObjectTypeId,
    });

    this.getDeleteCall(this.data.objectTypeId, payload)
      .pipe(
        take(1),
        finalize(() => (this._isLoading = false))
      )
      .subscribe(
        (res) => {
          if (res?.success && res?.statusCode === 200) {
            this.showToast(
              'Item deleted successfully!',
              '',
              ToastState.SUCCESS
            );
            if (res?.data?.warning) {
              this.toastService.show(res.data.warning, '', ToastState.WARNING, {
                position: 'bottom right',
                maxWidth: '350px',
                duration: 10000,
              });
            }
            this.dialogRef.close(res.success);
          } else if (
            res?.statusCode === 400 &&
            res?.clientErrorMessage === 'Vendor has charges'
          ) {
            this.router.navigate(['/v06/Financials/Admin/ChargeList.aspx'], {
              queryParams: {
                VendorID: rowData.data.oid,
                masterGroupID: rowData.data.mastergroupid,
                VendorCustomer: rowData.data.objecttypetypeid,
                CompanyID: rowData.data.companyid,
              },
            });
          } else {
            const msg = res?.statusCode === 403 ? permssionMsg : errMsg;
            this.toastService.show(msg, '', ToastState.ERROR, {
              position: 'bottom right',
              maxWidth: '350px',
            });
          }
        },
        (err) => {
          this.toastService.show(errMsg, '', ToastState.ERROR, {
            position: 'bottom right',
            maxWidth: '350px',
          });
        }
      );
  }

  buildDeleteRequestPayload(objectData: {
    oid: number;
    otid: number;
    rowData: any;
    widgetobjectTypeID: any;
    widgetRelDefID: any;
  }) {
    const { oid, otid, rowData, widgetobjectTypeID, widgetRelDefID } = {
      ...objectData,
    };

    const relationshipDefinitionId =
      objectData.widgetobjectTypeID === ObjectType.DEAL_TERM
        ? rowData.data.relationshipdefinitionid
        : widgetRelDefID;

    const payload: DeleteSubObjectRequest = {
      objectId: rowData.data.oid,
      objectTypeId: widgetobjectTypeID,
      relatedObjectId: oid,
      relatedObjectTypeId: otid,
      relationshipDefinitionId,
    };

    return payload;
  }

  onDelete() {
    this._isLoading = true;
    if (this.data.objectTypeId === ObjectType.VENDOR) {
      this.dynamicFormsService
        .getVendorHasCharges(this.data.objectId)
        .pipe(
          take(1),
          finalize(() => (this._isLoading = false))
        )
        .subscribe((res) => {
          if (res.success) {
            const hasCharges = res.data.hasCharges;
            const dialogRef = this.dialog.open(DeleteSubObjectPopupComponent, {
              data: {
                hasCharges,
              },
            });

            dialogRef
              .afterClosed()
              .pipe(take(1))
              .subscribe((dialogRes) => {
                this.handleDeleteDialog(
                  dialogRes,
                  this.data?.rowData,
                  hasCharges
                );
              });
          }
        });
    } else {
      const dialogRef = this.dialog.open(DeleteSubObjectPopupComponent, {
        data: {
          hasCharges: false,
        },
      });

      dialogRef
        .afterClosed()
        .pipe(take(1))
        .subscribe((dialogRes) => {
          this.handleDeleteDialog(dialogRes, this.data?.rowData, false);
        });
    }
  }

  onLaunch() {
    if (this.dynamicForm.valid) {
      this._isSaving = true;
      const saveFormData: SaveRenderFormCommand = {
        isDynamicPopup: true,
        formId: this.data.formId,
        objectId: this.data.isEdit ? this.data.objectId : 0,
        objectTypeId: this.data.objectTypeId,
        objectTypeTypeId: this.data.objectTypeTypeId,
        relatedObjectId: this.data.relatedObjectId,
        relatedObjectTypeId: this.data.relatedObjectTypeId,
        relationshipDefinitionId: this.data.relatedDefinitionId,
        formItems: [],
      };
      saveFormData.formItems = this.changedFormItemKeys;
      this.dynamicFormsService
        .saveRenderForm(saveFormData)
        .subscribe((saveResponse) => {
          if (saveResponse.success) {
            this.dialogRef.close(saveResponse.success);
            this._isSaving = false;
            const queryParams = {
              fid: this.data?.launchFormID,
              oid: saveResponse.data,
              otid: this.data?.objectTypeId,
              ottid: this.data?.objectTypeTypeId,
              roid: this.data?.relatedObjectId,
              rotid: this.data?.relatedObjectTypeId,
              rdid: this.data?.relatedDefinitionId,
              parentfid: this.data?.parentfid,
              poid: this.data?.relatedObjectId,
              potid: this.data?.relatedObjectTypeId,
              pgmode: 'edit',
            };
            this.router.navigate(['/crem/forms/render-form'], { queryParams });
          } else {
            this.showToast('Save failed.', 'Save not successful');
          }
        });
    }
  }

  closeModal() {
    this.dialogRef.close(this.savedOnce);
  }

  /**
   * TrackBy helps Angular identify items uniquely for better performance
   * @see https://angular.dev/api/core/TrackByFunction
   *
   * @memberof DynamicPopupComponent
   */
  trackByFormItemId(i: number, item: any): number {
    return item.formItemID;
  }

  getDropdownInitialValue(formItemID: number): any {
    const val = this.dropdownData?.[formItemID]?.selectedValue;
    const formItem = this.popupData?.find(
      (p: any) => p.formItemID == formItemID
    );
    const isListBox = formItem?.formItemTypeID === FORM_ITEM_MULTI_LIST_BOX_ID;

    if (isListBox) {
      // Always return an array for multi-select/list-box controls
      if (val == null) return [];
      if (Array.isArray(val))
        return val.map((v) => (v == null ? v : v.toString()));
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '') return [];
        return trimmed.indexOf(',') > -1
          ? trimmed.split(',').map((s) => s.trim())
          : [trimmed];
      }
      // numbers or other single values -> wrap in array
      return [val];
    }

    // Single-select dropdowns: return single primitive or null
    if (val == null) return null;
    if (Array.isArray(val)) return val.length > 0 ? val[0] : null;
    return val;
  }

  /**
   * TODO: This needs a better logic and potentially moved to a pipe
   *
   * @param {*} d
   * @return {*}  {string}
   * @memberof DynamicPopupComponent
   */
  getDateFormat(d: any): string {
    return d.formItemSectionDetail?.dataTypeFormatString
      ? 'MM/dd/yyyy'
      : 'MM/dd/yyyy';
  }

  /**
   * Determine if any loading action is in process
   *
   * @return {*}  {boolean}
   * @memberof DynamicPopupComponent
   */
  isAnyActionLoading(): boolean {
    return this._isLoading || this._isSaving || this._isSavingAndNew;
  }
}
