import {
  Component,
  EventEmitter,
  Inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { ReportsService } from '@reports/services/reports.service';
import { DynamicFormComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/dynamic-form/dynamic-form.component';
import { DropdownComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/dropdown/dropdown.component';
import { IForm } from 'libs/ui-shared/lib-ui-elements/src/lib/dynamic-form/definitions';
import { criteriaOrder } from '@reports/shared/consts/criteria-order';

@Component({
  selector: 'mango-criteria-form-segment',
  templateUrl: './criteria-form-segment.component.html',
  styleUrls: ['./criteria-form-segment.component.scss'],
})
export class CriteriaFormSegmentComponent {
  @Input() criteriaSetId: number;
  @Input() isReportCriteriaSet: boolean;
  @Input() defaultValues: any;
  @Input() readOnly: boolean;
  @Input() idPrefix: string = 'criteriaForm';
  @Output() loadingCallback = new EventEmitter<boolean>();
  @Output() onFormItemChange = new EventEmitter<boolean>();
  @Output() onCriteriaLoadedChange = new EventEmitter<boolean>();
  public dependentCriteriaConfig: IForm;
  public criteriaConfig: IForm;
  public portfolioConfig: IForm;
  public portfolioSelected: boolean = true;
  public addSegment: boolean = false;
  public portfolioData: any = [];
  public loading: boolean = true;
  public criteriaLoading: boolean = true;
  public dependentCriteriaLoading: boolean = true;
  public isItemSelected: boolean = false;
  public isDependentItemSelected: boolean = false;
  public dropdownKey: any = {};
  public dependentDropdownKey: any = {};
  public saveObject: any = {};
  public reportProcessingPage: string;
  public reportObject: string;
  public selectedPortfolio: number;
  public isSegment: boolean = false;
  public portfolioSelectionModified: boolean = false;
  public criteriaDataFieldKey: any = {};
  @ViewChild('SegmentPortfolioDropdown')
  segmentPortfolioDropdown: DropdownComponent;
  @ViewChild('CriteriaDynamicForm') criteriaDynamicForm: DynamicFormComponent;
  @ViewChild('DependentCriteriaDynamicForm')
  dependentCriteriaDynamicForm: DynamicFormComponent;
  @ViewChild('PortfolioForm') portfolioForm: DynamicFormComponent;

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    this.reportsService.getPortfolios().subscribe((result) => {
      this.portfolioData = result.data;
      this.setconfigObjects();
    });
  }

  private stripTime(date: Date): string {
    return date?.toISOString().split('T')[0];
  }

  public setconfigObjects() {
    this.loading = true;
    let selectedPortfolioIndex;
    if (
      this.defaultValues != null &&
      Object.keys(this.defaultValues).length > 0
    ) {
      selectedPortfolioIndex = this.portfolioData.find((portfolio) => {
        return portfolio.masterGroupID === this.defaultValues.PortfolioID;
      });
    }
    this.portfolioConfig = {
      section: [
        {
          sectionId: 'Portfolio',
          hideBorder: true,
          colCount: 2,
          formObjects: [
            {
              sectionItems: [
                {
                  dataField: 'PortfolioID',
                  fieldType: 'custom',
                  caption: 'Portfolio',
                  required: true,
                  displayExpr: 'companyName',
                  valueExpr: 'masterGroupID',
                  dataSource: this.portfolioData,
                  selectMode: 'single',
                  hoverText: 'Select the portfolio of the project',
                  disabled: false,
                  value: selectedPortfolioIndex ? [selectedPortfolioIndex] : [],
                },
              ],
            },
          ],
        },
      ],
    };
    if (selectedPortfolioIndex) {
      this.onDropdownChange({
        values: { PortfolioID: { value: [selectedPortfolioIndex] } },
      });
    } else if (!this.isReportCriteriaSet) {
      this.onDropdownChange({
        values: { IsReportCriteriaSet: { value: false } },
      });
    }
    this.loading = false;
    this.setLoadingCallback(false);
  }

  public onChange(config) {
    this.isItemSelected = this.criteriaDynamicForm?.isItemSelected();
    this.portfolioSelected =
      this.portfolioConfig.section[0].formObjects[0].sectionItems[0].value
        ?.length ||
      (!this.isReportCriteriaSet && this.isDependentItemSelected);
    if (
      this.portfolioConfig.section[0].formObjects[0].sectionItems[0].value
        ?.length
    ) {
      this.portfolioSelectionModified = true;
    }
    this.onFormItemChange.emit(this.isItemSelected || this.portfolioSelected);
  }

  public onDependentChange(config) {
    this.criteriaLoading = true;
    this.setLoadingCallback(true);
    this.onCriteriaLoadedChange.emit(true);
    this.isDependentItemSelected =
      this.dependentCriteriaDynamicForm?.isItemSelected();
    if (this.isDependentItemSelected && config !== null) {
      const config = this.dependentCriteriaDynamicForm.getConfig();
      let saveObject = [];
      saveObject = this.getSaveObject(config, saveObject, true);
      this.reportsService
        .getCriteria(
          this.criteriaSetId,
          this.selectedPortfolio,
          saveObject,
          this.isReportCriteriaSet
        )
        .subscribe((result) => {
          if (result.data) {
            this.setCriteriaFields(result.data, false);
          }
        });
    } else {
      this.setLoadingCallback(false);
    }
  }

  public clearPortfolioDropdown() {
    this.segmentPortfolioDropdown.clearSelectBox();
  }

  public onDropdownChange(event) {
    if (event.values.PortfolioID) {
      const portfolioItem = event.values.PortfolioID.value;
      this.portfolioConfig.section[0].formObjects[0].sectionItems[0].value =
        event.values.PortfolioID.value;

      setTimeout(() => {
        if (portfolioItem?.length) {
          setTimeout(() => {
            this.criteriaLoading = true;
            this.setLoadingCallback(true);
            this.onCriteriaLoadedChange.emit(true);
            this.onFormItemChange.emit(true);
            this.dependentCriteriaLoading = true;
            this.selectedPortfolio = portfolioItem[0].masterGroupID;
            this.reportsService
              .getNonDependentCriteria(
                this.criteriaSetId,
                this.selectedPortfolio
              )
              .subscribe((result) => {
                this.dropdownKey = {};
                this.dependentDropdownKey = {};
                if (result.data?.dependentCriteriaCount > 0) {
                  this.setCriteriaFields(result.data?.criteria, true);
                } else {
                  this.setCriteriaFields(result.data?.criteria, false);
                }
              });
          });
        } else if (this.selectedPortfolio !== 0) {
          setTimeout(() => {
            this.selectedPortfolio = 0;
            this.setLoadingCallback(false);
            this.onCriteriaLoadedChange.emit(false);
            this.onFormItemChange.emit(false);
            this.dependentCriteriaLoading = true;
            this.criteriaLoading = true;
          });
        }
      });
    } else if (event.values.IsReportCriteriaSet) {
      setTimeout(() => {
        this.criteriaLoading = true;
        this.setLoadingCallback(true);
        this.onCriteriaLoadedChange.emit(true);
        this.onFormItemChange.emit(true);
        this.dependentCriteriaLoading = true;
        this.reportsService
          .getNonDependentCriteria(this.criteriaSetId, -1)
          .subscribe((result) => {
            this.dropdownKey = {};
            this.dependentDropdownKey = {};
            if (result.data?.dependentCriteriaCount > 0) {
              this.setCriteriaFields(result.data?.criteria, true);
            } else {
              this.setCriteriaFields(result.data?.criteria, false);
            }
          });
      });
    }
  }

  public setCriteriaFields(criteriaItem, isDependent: boolean) {
    if (isDependent) {
      this.dependentCriteriaConfig = {
        section: [
          {
            sectionId: 'DependentCriteria',
            colCount: 2,
            hideBorder: true,
            formObjects: [
              {
                sectionItems: [],
              },
            ],
          },
        ],
      };
    } else {
      this.criteriaConfig = {
        section: [
          {
            sectionId: 'Criteria',
            colCount: 2,
            hideBorder: true,
            formObjects: [
              {
                sectionItems: [],
              },
            ],
          },
        ],
      };
    }

    let skipNextItem = false;
    let noDefaultValues =
      this.defaultValues == null ||
      Object.keys(this.defaultValues).length === 0;
    criteriaItem.forEach((item, index) => {
      if (!skipNextItem) {
        let itemObject;
        if (item.criteriaControlType === 'LISTBOX') {
          let valueKey = item.criteriaSourceFieldName;
          let displayName = item.criteriaSourceDisplayFieldName;

          if (
            (item.values?.length &&
              valueKey.toUpperCase() in item?.values?.[0]) ||
            (item?.values?.[1] && valueKey.toUpperCase() in item?.values?.[1])
          ) {
            valueKey = valueKey.toUpperCase();
            displayName = displayName.toUpperCase();
          }

          if (isDependent) {
            this.dependentDropdownKey[item.criteriaID] = valueKey;
            this.dropdownKey[item.criteriaID] = valueKey;
          } else {
            this.dropdownKey[item.criteriaSourceFieldName] = valueKey;
          }

          if (item.criteriaAllowMultiSelect) {
            //multi select dropdown
            // This block apparently helps populate the default selection of multi-selects.
            // Entropy-ridden code wears down a coder’s soul, unraveling their spirit line by line, as fading control takes its toll. Then he asks, who wrote this which suck a wrenched soul?
            let defaultValueArray = [];
            if (this.defaultValues?.[item.criteriaID]) {
              if (Array.isArray(this.defaultValues?.[item.criteriaID])) {
                defaultValueArray = this.defaultValues?.[item?.criteriaID];
              } else {
                defaultValueArray = this.defaultValues?.[
                  item?.criteriaID
                ].split(item.criteriaDelimeter ? item.criteriaDelimeter : ',');
              }
            } else if (noDefaultValues && !isDependent) {
              switch (valueKey) {
                case 'SYSTEMLEASESTATUS': {
                  defaultValueArray?.push('' + item.values[0][valueKey]); // The 'Active' option is selected
                  break;
                }
                case 'HIERARCHY1ID':
                case 'HIERARCHY2ID':
                case 'HIERARCHY3ID':
                case 'HIERARCHY4ID':
                case 'HIERARCHY5ID':
                case 'LEASETEMPLATE':
                case 'COUNTRY':
                case 'STATENAME':
                case 'ACCOUNTINGTYPE':
                case 'LEASESTATUS':
                case 'ACCOUNTINGWORKFLOWSTATUS':
                case 'JOURNALENTRYPROFILEID':
                case 'AMORTIZATIONPROFILEID':
                case 'LEASEALLOCATIONDISPLAYSTRING2': {
                  //Don't populate default values
                  break;
                }
                default: {
                  item.values.forEach((x) => {
                    defaultValueArray.push('' + x[valueKey]);
                  });
                  break;
                }
              }
            }

            if (defaultValueArray[0] === '') {
              if (defaultValueArray?.[1] === '') {
                if (
                  item.values?.[0]?.[valueKey] === null &&
                  item.values?.[0]?.[valueKey] === ''
                ) {
                  defaultValueArray[0] = null;
                }
              } else {
                if (
                  item.values?.[0]?.[valueKey] === null &&
                  item.values?.[0]?.[valueKey] !== ''
                ) {
                  defaultValueArray[0] = null;
                }
              }
            }

            itemObject = {
              // Portfolio Field *********************************
              sort: displayName,
              dataField: isDependent
                ? item.criteriaID
                : item.criteriaSourceFieldName,
              fieldType: 'dropdown',
              caption: item.criteriaDesc,
              required:
                item.criteriaSourceFieldName === 'PortfolioID' ? true : false,
              displayExpr: displayName,
              valueExpr: valueKey,
              dataSource: item.values,
              selectMode: 'multiple',
              hoverText: 'Select the ' + item.criteriaDesc + ' of the project',
              disabled: false,
              value: defaultValueArray ? defaultValueArray : [],
              delimeter: item.criteriaDelimeter,
              data: {
                criteriaID: item.criteriaID,
              },
              criteriaDataType: item.criteriaDataType,
            };
            if (this.defaultValues?.[item.criteriaID]) {
              this.defaultValues[item.criteriaID] = '';
            }
          } else {
            //single select dropdown
            let selectedIndex = item.values.find((object) => {
              return (
                object[valueKey]?.toString() ===
                this.defaultValues?.[item.criteriaID]?.toString()
              );
            });
            if (!selectedIndex && noDefaultValues) {
              selectedIndex = item.values?.[0];
            }

            itemObject = {
              dataField: isDependent
                ? item.criteriaID
                : item.criteriaSourceFieldName,
              fieldType: 'dropdown',
              caption: item.criteriaDesc,
              required: true,
              displayExpr: displayName,
              valueExpr: valueKey,
              dataSource: item.values,
              selectMode: 'single',
              hoverText: 'Select the ' + item.criteriaDesc + ' of the project',
              disabled: false,
              delimeter: item.criteriaDelimeter,
              value: selectedIndex ? [selectedIndex] : [],
              data: {
                criteriaID: item.criteriaID,
              },
              criteriaDataType: item.criteriaDataType,
            };

            if (this.defaultValues?.[item.criteriaID]) {
              this.defaultValues[item.criteriaID] = [];
            }
          }
        } else if (item.criteriaControlType === 'HIERARCHYDROPDOWN') {
          let valueKey = 'companyID';
          let displayName = 'companyName';
          let parentIdKey = 'parentGroup';

          // Transform data: set parentGroup to null for root items
          const transformedData = item.values?.map((v) => ({
            ...v,
            parentGroup:
              v.parentGroup === v.masterGroupID ? null : v.parentGroup,
          }));

          if (isDependent) {
            this.dependentDropdownKey[item.criteriaID] = valueKey;
            this.dropdownKey[item.criteriaID] = valueKey;
          } else {
            this.dropdownKey[item.criteriaSourceFieldName] = valueKey;
          }

          // Handle initial selected value
          let initialValue = null;
          if (this.defaultValues?.[item.criteriaID]) {
            if (item.criteriaAllowMultiSelect) {
              // For multiple selection, expect array of IDs
              if (Array.isArray(this.defaultValues[item.criteriaID])) {
                initialValue = this.defaultValues[item.criteriaID];
              } else {
                initialValue = this.defaultValues[item.criteriaID].split(
                  item.criteriaDelimeter ? item.criteriaDelimeter : ','
                );
              }
            } else {
              // For single selection, use the value directly
              initialValue = this.defaultValues[item.criteriaID];
            }
          }

          // Get root value from first item's masterGroupID
          const rootValue =
            item.values?.length > 0 ? item.values[0].masterGroupID : null;

          itemObject = {
            dataField: isDependent
              ? item.criteriaID
              : item.criteriaSourceFieldName,
            fieldType: 'hierarchyDropdown',
            caption: item.criteriaDesc,
            required: false,
            displayExpr: displayName,
            valueExpr: valueKey,
            parentIdExpr: parentIdKey,
            dataSource: transformedData,
            selectMode: item.criteriaAllowMultiSelect ? 'multiple' : 'single',
            hoverText: 'Select the ' + item.criteriaDesc,
            disabled: false,
            value: initialValue,
            delimeter: item.criteriaDelimeter,
            placeholder: 'Select ' + item.criteriaDesc + '...',
            dropDownContainerCustomClass: 'criteriaHierarchyDropDown',
            data: {
              criteriaID: item.criteriaID,
            },
            criteriaDataType: item.criteriaDataType,
          };

          if (this.defaultValues?.[item.criteriaID]) {
            this.defaultValues[item.criteriaID] = item.criteriaAllowMultiSelect
              ? []
              : null;
          }
        } else if (item.criteriaControlType === 'Checkbox') {
          // Handle initial value - convert string 'true'/'false' to boolean
          let checkboxValue = true; // default value
          if (item.criteriaID in (this.defaultValues || {})) {
            const defaultVal = this.defaultValues[item.criteriaID];
            // Backend sends string 'true'/'false', convert to boolean
            if (typeof defaultVal === 'string') {
              checkboxValue = defaultVal.toLowerCase() === 'true';
            } else if (defaultVal !== undefined && defaultVal !== null) {
              checkboxValue = !!defaultVal;
            }
          }

          itemObject = {
            dataField: isDependent
              ? item.criteriaID
              : item.criteriaSourceFieldName,
            fieldType: 'checkbox',
            caption: item.criteriaDesc,
            hideLabel: true,
            required: false,
            value: checkboxValue,
            disabled: false,
            textDisplay: item.criteriaDesc,
            data: {
              criteriaID: item.criteriaID,
            },
            criteriaDataType: item.criteriaDataType,
          };

          if (item.criteriaID in (this.defaultValues || {})) {
            this.defaultValues[item.criteriaID] = undefined;
          }
        } else if (
          item.criteriaControlType === 'TEXTBOX' &&
          item.criteriaDataType === '7'
        ) {
          if (
            criteriaItem?.[index + 1]?.criteriaControlType === 'TEXTBOX' &&
            criteriaItem?.[index + 1]?.criteriaDataType === '7'
          ) {
            //combo datebox
            itemObject = {
              dataField: isDependent
                ? item.criteriaID
                : item.criteriaSourceFieldName,
              dataField1: isDependent
                ? item.criteriaID
                : item.criteriaSourceFieldName,
              dataField2: isDependent
                ? criteriaItem?.[index + 1].criteriaID
                : criteriaItem?.[index + 1].criteriaSourceFieldName,
              dataField1Caption: item.criteriaDesc,
              dataField2Caption: criteriaItem?.[index + 1].criteriaDesc,
              fieldType: 'toFromDate',
              caption: item.criteriaDesc,
              required: false,
              disabled: false,
              hideLabel: true,
              value: null,
              delimeter: item.criteriaDelimeter,
              value1: this.defaultValues
                ? this.defaultValues[item.criteriaID]
                : undefined,
              value2: this.defaultValues
                ? this.defaultValues[criteriaItem?.[index + 1]?.criteriaID]
                : undefined,
              data: {
                criteriaID1: item.criteriaID,
                criteriaID2: criteriaItem?.[index + 1].criteriaID,
              },
              criteriaDataType: item.criteriaDataType,
            };
            if (
              this.defaultValues &&
              this.defaultValues[item.criteriaID] &&
              this.defaultValues[criteriaItem?.[index + 1]?.criteriaID]
            ) {
              this.defaultValues[item.criteriaID] = undefined;
              this.defaultValues[criteriaItem?.[index + 1].criteriaID] =
                undefined;
            }

            skipNextItem = true;
          } else {
            //single datebox
            itemObject = {
              dataField: isDependent
                ? item.criteriaID
                : item.criteriaSourceFieldName,
              fieldType: 'date',
              caption: item.criteriaDesc,
              showClearButton: true,
              disabled: false,
              required: true,
              delimeter: item.criteriaDelimeter,
              value: this.defaultValues
                ? this.defaultValues[item.criteriaID]
                : undefined,
              data: {
                criteriaID: item.criteriaID,
              },
              criteriaDataType: item.criteriaDataType,
            };
            if (this.defaultValues[item.criteriaID]) {
              this.defaultValues[item.criteriaID] = undefined;
            }
          }
        } else if (item.criteriaControlType === 'HIDDEN') {
          //do nothing
        } else {
          //textbox
          itemObject = {
            dataField: isDependent
              ? item.criteriaID
              : item.criteriaSourceFieldName,
            fieldType: 'text',
            caption: item.criteriaDesc,
            required: false,
            value: this.defaultValues
              ? this.defaultValues[item.criteriaID]
              : undefined,
            disabled: false,
            delimeter: item.criteriaDelimeter,
            data: {
              criteriaID: item.criteriaID,
            },
            criteriaDataType: item.criteriaDataType,
          };
          if (this.defaultValues) {
            this.defaultValues[item.criteriaID] = undefined;
          }
        }
        if (itemObject && !isDependent) {
          this.criteriaConfig.section[0].formObjects[0].sectionItems.push(
            itemObject
          );
        } else if (itemObject && isDependent) {
          this.dependentCriteriaConfig.section[0].formObjects[0].sectionItems.push(
            itemObject
          );
        }
      } else {
        skipNextItem = false;
      }
    });

    // Sort criteria by defined order
    const sortCriteria = (items: any[]) =>
      items.sort((a, b) => {
        const indexA = criteriaOrder.indexOf(
          (a.dataField || '').toString().toUpperCase()
        );
        const indexB = criteriaOrder.indexOf(
          (b.dataField || '').toString().toUpperCase()
        );
        return (
          (indexA === -1 ? 9999 : indexA) - (indexB === -1 ? 9999 : indexB)
        );
      });

    if (!isDependent) {
      sortCriteria(this.criteriaConfig.section[0].formObjects[0].sectionItems);
    } else {
      sortCriteria(
        this.dependentCriteriaConfig.section[0].formObjects[0].sectionItems
      );
    }

    if (isDependent) {
      setTimeout(() => {
        this.dependentCriteriaLoading = false;
        this.setLoadingCallback(false);
        setTimeout(() => {
          this.onDependentChange(null);
        });
      });
    } else {
      setTimeout(() => {
        this.criteriaLoading = false;
        this.setLoadingCallback(false);
        this.onCriteriaLoadedChange.emit(false);
        setTimeout(() => {
          this.onChange(null);
        });
      });
    }
  }

  public onDependentLoading(event) {
    if (!event) {
      if (this.defaultValues) {
        this.onDependentChange({});
      }
    }
  }

  public setSegmentCondition() {
    this.addSegment = !this.addSegment;
  }

  public getSaveObject(config, saveObject, isDependent) {
    Object.keys(config).forEach((item) => {
      let saveItem = {};
      if (config[item].fieldType === 'toFromDate') {
        let saveItem1 = {};
        let saveItem2 = {};
        if (typeof config[item].value1 === 'string') {
          let localDate = new Date(config[item].value1);
          let utcDate = new Date(
            localDate.getFullYear(),
            localDate.getMonth(),
            localDate.getDate(),
            0,
            0,
            0,
            0
          );
          config[item].value1 = utcDate;
        } else if (config[item].value1) {
          let date = config[item].value1;
          config[item].value1 = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0,
            0,
            0,
            0
          );
        }
        if (typeof config[item].value2 === 'string') {
          let localDate = new Date(config[item].value2);
          let utcDate = new Date(
            localDate.getFullYear(),
            localDate.getMonth(),
            localDate.getDate(),
            0,
            0,
            0,
            0
          );
          config[item].value2 = utcDate;
        } else if (config[item].value2) {
          let date = config[item].value2;
          config[item].value2 = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0,
            0,
            0,
            0
          );
        }
        if (!isDependent) {
          saveItem1 = {
            FieldName: config[item].dataField1,
            DateData: this.stripTime(config[item].value1) || null,
          };

          saveItem2 = {
            FieldName: config[item].dataField2,
            DateData: this.stripTime(config[item].value2) || null,
          };
        } else {
          saveItem1 = {
            CriteriaID: config[item].dataField1,
            DateData: this.stripTime(config[item].value1) || null,
          };

          saveItem2 = {
            CriteriaID: config[item].dataField2,
            DateData: this.stripTime(config[item].value2) || null,
          };
        }

        saveObject.push(saveItem1);
        saveObject.push(saveItem2);
      } else if (config[item].fieldType === 'date') {
        if (!isDependent) {
          let saveItem = {
            FieldName: config[item].dataField,
            DateData: this.stripTime(config[item].value),
          };
        } else {
          let saveItem = {
            CriteriaID: config[item].dataField,
            Values: this.stripTime(config[item].value),
          };
        }

        saveObject.push(saveItem);
      } else if (config[item].fieldType === 'dropdown') {
        if (config[item].selectMode === 'single') {
          if (!isDependent) {
            if (config[item].criteriaDataType === '3') {
              saveItem = {
                FieldName: config[item].dataField,
                IntData: config[item].value?.length
                  ? config[item].value[0][this.dropdownKey[item]]
                  : null,
              };
            } else {
              saveItem = {
                FieldName: config[item].dataField,
                VarCharData: config[item].value?.length
                  ? config[item].value[0][this.dropdownKey[item]]?.toString()
                  : null,
              };
            }
          } else {
            if (config[item].criteriaDataType === '3') {
              saveItem = {
                CriteriaID: config[item].dataField,
                Values: config[item].value?.length
                  ? [config[item].value[0][this.dependentDropdownKey[item]]]
                  : [],
              };
            } else {
              saveItem = {
                CriteriaID: config[item].dataField,
                Values: config[item].value?.length
                  ? [
                      config[item].value[0][
                        this.dependentDropdownKey[item]
                      ]?.toString(),
                    ]
                  : [],
              };
            }
          }

          saveObject.push(saveItem);
        } else {
          // multi select
          if (!isDependent) {
            if (config[item].value?.length) {
              let multiDropdownValue = '';
              let isFirstValue = true;
              config[item].value?.forEach((dropdownItem) => {
                if (!isFirstValue) {
                  const delimeter = config[item].delimeter;
                  multiDropdownValue += delimeter ? delimeter : ',';
                }
                multiDropdownValue += dropdownItem?.toString() || '';
                isFirstValue = false;
              });
              saveItem = {
                FieldName: config[item].dataField,
                VarCharData: multiDropdownValue,
                Delimeter: config[item].delimeter
                  ? config[item].delimeter
                  : ',',
                CriteriaDataType: config[item].criteriaDataType,
              };
            } else {
              saveItem = {
                FieldName: config[item].dataField,
                VarCharData: null,
              };
            }
          } else {
            if (config[item].value?.length) {
              let multiDropdownValue = [];
              config[item].value?.forEach((dropdownItem) => {
                multiDropdownValue.push(dropdownItem?.toString());
              });

              saveItem = {
                CriteriaID: config[item].dataField,
                Values: multiDropdownValue,
              };
            } else {
              saveItem = {
                CriteriaID: config[item].dataField,
                Values: [],
              };
            }
          }

          saveObject.push(saveItem);
        }
      } else if (config[item].fieldType === 'hierarchyDropdown') {
        // Handle hierarchyDropdown - save only leaf nodes (lowest level items)
        if (config[item].selectMode === 'single') {
          // For single select, the value should already be a leaf node
          if (!isDependent) {
            if (config[item].criteriaDataType === '3') {
              saveItem = {
                FieldName: config[item].dataField,
                IntData: config[item].value || null,
              };
            } else {
              saveItem = {
                FieldName: config[item].dataField,
                VarCharData: config[item].value?.toString() || null,
              };
            }
          } else {
            if (config[item].criteriaDataType === '3') {
              saveItem = {
                CriteriaID: config[item].dataField,
                Values: config[item].value ? [config[item].value] : [],
              };
            } else {
              saveItem = {
                CriteriaID: config[item].dataField,
                Values: config[item].value
                  ? [config[item].value?.toString()]
                  : [],
              };
            }
          }
          saveObject.push(saveItem);
        } else {
          // multi select hierarchyDropdown - filter to keep only leaf nodes
          const leafValues = this.getLeafNodesOnly(
            config[item].value,
            config[item].dataSource,
            config[item].valueExpr,
            config[item].parentIdExpr
          );

          if (!isDependent) {
            if (leafValues?.length) {
              let multiDropdownValue = '';
              let isFirstValue = true;
              leafValues.forEach((dropdownItem) => {
                if (!isFirstValue) {
                  const delimeter = config[item].delimeter;
                  multiDropdownValue += delimeter ? delimeter : ',';
                }
                multiDropdownValue += dropdownItem?.toString() || '';
                isFirstValue = false;
              });
              saveItem = {
                FieldName: config[item].dataField,
                VarCharData: multiDropdownValue,
                Delimeter: config[item].delimeter
                  ? config[item].delimeter
                  : ',',
                CriteriaDataType: config[item].criteriaDataType,
              };
            } else {
              saveItem = {
                FieldName: config[item].dataField,
                VarCharData: null,
              };
            }
          } else {
            if (leafValues?.length) {
              const multiDropdownValue = [];
              leafValues.forEach((dropdownItem) => {
                multiDropdownValue.push(dropdownItem?.toString());
              });
              saveItem = {
                CriteriaID: config[item].dataField,
                Values: multiDropdownValue,
              };
            } else {
              saveItem = {
                CriteriaID: config[item].dataField,
                Values: [],
              };
            }
          }
          saveObject.push(saveItem);
        }
      } else if (config[item].fieldType === 'checkbox') {
        if (!isDependent) {
          saveItem = {
            FieldName: config[item].dataField,
            VarCharData: config[item].value ? 'true' : 'false',
          };
        } else {
          saveItem = {
            CriteriaID: config[item].dataField,
            Values: config[item].value ? 'true' : 'false',
          };
        }
        saveObject.push(saveItem);
      } else {
        if (!isDependent) {
          saveItem = {
            FieldName: config[item].dataField,
            VarCharData:
              config[item].value !== null || config[item].value !== undefined
                ? config[item].value
                : null,
          };
        } else {
          saveItem = {
            CriteriaID: config[item].dataField,
            Values:
              config[item].value !== null || config[item].value !== undefined
                ? config[item].value
                : null,
          };
        }

        saveObject.push(saveItem);
      }
    });
    return saveObject;
  }

  public setLoadingCallback(loading) {
    this.loadingCallback.emit(loading);
  }

  private getLeafNodesOnly(
    selectedValues: any[],
    dataSource: any[],
    valueExpr: string,
    parentIdExpr: string
  ): any[] {
    if (!selectedValues || selectedValues.length === 0) {
      return selectedValues;
    }

    // Create a map for quick lookup
    const selectedSet = new Set(selectedValues.map((v) => v?.toString()));
    const dataSourceMap = new Map();

    // Build a map of all items in dataSource
    dataSource?.forEach((item) => {
      dataSourceMap.set(item[valueExpr]?.toString(), item);
    });

    // Filter out any item that has a child in the selected set
    const leafNodes = selectedValues.filter((value) => {
      const valueStr = value?.toString();

      // Check if any other selected item has this item as parent
      const hasChildInSelection = selectedValues.some((otherValue) => {
        const otherValueStr = otherValue?.toString();
        if (otherValueStr === valueStr) return false; // Skip self

        const otherItem = dataSourceMap.get(otherValueStr);
        return otherItem && otherItem[parentIdExpr]?.toString() === valueStr;
      });

      // Keep only items that don't have children in the selection (leaf nodes)
      return !hasChildInSelection;
    });

    return leafNodes;
  }

  public getSaveSegmentObject(config, saveObject) {
    Object.keys(config).forEach((item) => {
      let saveItem = {};
      if (config[item].fieldType === 'toFromDate') {
        let saveItem1 = {};
        let saveItem2 = {};
        if (typeof config[item].value1 === 'string') {
          let localDate = new Date(config[item].value1);
          let utcDate = new Date(
            localDate.getFullYear(),
            localDate.getMonth(),
            localDate.getDate(),
            0,
            0,
            0,
            0
          );
          config[item].value1 = utcDate;
        } else if (config[item].value1) {
          let date = config[item].value1;
          config[item].value1 = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0,
            0,
            0,
            0
          );
        }
        if (typeof config[item].value2 === 'string') {
          let localDate = new Date(config[item].value2);
          let utcDate = new Date(
            localDate.getFullYear(),
            localDate.getMonth(),
            localDate.getDate(),
            0,
            0,
            0,
            0
          );
          config[item].value2 = utcDate;
        } else if (config[item].value2) {
          let date = config[item].value2;
          config[item].value2 = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0,
            0,
            0,
            0
          );
        }

        saveItem1 = {
          CriteriaID: config[item].data.criteriaID1,
          DateData: this.stripTime(config[item].value1) || null,
        };

        saveItem2 = {
          CriteriaID: config[item].data.criteriaID2,
          DateData: this.stripTime(config[item].value2) || null,
        };
        saveObject.push(saveItem1);
        saveObject.push(saveItem2);
      } else if (config[item].fieldType === 'date') {
        if (typeof config[item].value === 'string') {
          let localDate = new Date(config[item].value);
          let utcDate = new Date(
            localDate.getFullYear(),
            localDate.getMonth(),
            localDate.getDate(),
            0,
            0,
            0,
            0
          );
          config[item].value = utcDate;
        } else if (config[item].value) {
          let date = config[item].value;
          config[item].value = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0,
            0,
            0,
            0
          );
        }
        let saveItem = {
          CriteriaID: config[item].data.criteriaID,
          DateData: this.stripTime(config[item].value) || null,
        };

        saveObject.push(saveItem);
      } else if (config[item].fieldType === 'dropdown') {
        if (config[item].selectMode === 'single') {
          saveItem = {
            CriteriaID: config[item].data.criteriaID,
            VarCharData: config[item].value?.length
              ? config[item].value[0][this.dropdownKey[item]]?.toString()
              : null,
          };

          saveObject.push(saveItem);
        } else {
          // multi select

          if (config[item].value?.length) {
            let multiDropdownValue = '';
            let isFirstValue = true;
            config[item].value?.forEach((dropdownItem) => {
              if (!isFirstValue) {
                const delimeter = config[item].delimeter;
                multiDropdownValue += delimeter ? delimeter : ',';
              }
              multiDropdownValue += dropdownItem?.toString() || '';
              isFirstValue = false;
            });

            saveItem = {
              CriteriaID: config[item].data.criteriaID,
              VarCharData: multiDropdownValue,
            };
          } else {
            saveItem = {
              CriteriaID: config[item].data.criteriaID,
              VarCharData: null,
            };
          }

          saveObject.push(saveItem);
        }
      } else if (config[item].fieldType === 'hierarchyDropdown') {
        // Handle hierarchyDropdown in segments - save only leaf nodes
        if (config[item].selectMode === 'single') {
          // For single select, the value should already be a leaf node
          saveItem = {
            CriteriaID: config[item].data.criteriaID,
            VarCharData: config[item].value?.toString() || null,
          };
          saveObject.push(saveItem);
        } else {
          // multi select hierarchyDropdown - filter to keep only leaf nodes
          const leafValues = this.getLeafNodesOnly(
            config[item].value,
            config[item].dataSource,
            config[item].valueExpr,
            config[item].parentIdExpr
          );

          if (leafValues?.length) {
            let multiDropdownValue = '';
            let isFirstValue = true;
            leafValues.forEach((dropdownItem) => {
              if (!isFirstValue) {
                const delimeter = config[item].delimeter;
                multiDropdownValue += delimeter ? delimeter : ',';
              }
              multiDropdownValue += dropdownItem?.toString() || '';
              isFirstValue = false;
            });
            saveItem = {
              CriteriaID: config[item].data.criteriaID,
              VarCharData: multiDropdownValue,
            };
          } else {
            saveItem = {
              CriteriaID: config[item].data.criteriaID,
              VarCharData: null,
            };
          }
          saveObject.push(saveItem);
        }
      } else if (config[item].fieldType === 'checkbox') {
        saveItem = {
          CriteriaID: config[item].data.criteriaID,
          VarCharData: config[item].value ? 'true' : 'false',
        };
        saveObject.push(saveItem);
      } else {
        saveItem = {
          CriteriaID: config[item].data.criteriaID,
          VarCharData:
            config[item].value !== null || config[item].value !== undefined
              ? config[item].value
              : null,
        };

        saveObject.push(saveItem);
      }
    });
    return saveObject;
  }
}
