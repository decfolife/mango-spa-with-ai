import {
  AfterViewInit,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  TemplateRef,
  ViewChildren,
} from '@angular/core';

import { DxFormComponent } from 'devextreme-angular/ui/form';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { ToggleSliderComponent } from '../toggle-slider/toggle-slider.component';
import { HierarchyDropdownComponent } from '../hierarchy-dropdown/hierarchy-dropdown.component';

import { InputComponent } from '../input';
import { IForm } from './definitions';

@Component({
  selector: 'crem-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss'],
})
export class DynamicFormComponent implements OnInit, AfterViewInit {
  @Input() config: IForm;
  @Input() configKey: any = {};
  @Input() initialFocusElement: string;
  @Input() dateFormat: string;
  @Input() idPrefix = '';
  @Input() labelPosition: 'top' | 'left' | 'right' = 'top';
  @Input() readOnly: boolean;
  @Output() changeEvent = new EventEmitter();
  @Output() isLoading = new EventEmitter();

  @ViewChildren(DxFormComponent) form: QueryList<DxFormComponent>;
  @ViewChildren('CremDropdown') cremDropdown: QueryList<DropdownComponent>;
  @ViewChildren('CremDatePicker')
  cremDatePicker: QueryList<DatePickerComponent>;
  @ViewChildren('CremTextBox') cremTextBox: QueryList<InputComponent>;
  @ViewChildren('CremToggleSlider')
  cremToggleSlider: QueryList<ToggleSliderComponent>;
  @ViewChildren('CremHierarchyDropdown')
  cremHierarchyDropdown: QueryList<HierarchyDropdownComponent>;
  @ContentChild(TemplateRef) templateRef: TemplateRef<any>;

  public formValid = true;
  public loading = true;
  public dropdownFocusing = false;

  ngOnInit() {
    this.idPrefix = this.idPrefix ? this.idPrefix + '__' : '';
    this.config?.section.forEach((section) => {
      section?.formObjects?.forEach((sectionItem) => {
        sectionItem?.sectionItems?.forEach((item) => {
          this.configKey[item.dataField] = item;
        });
      });
    });
    this.loading = false;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.isLoading.emit(false);
    });
  }

  public onChange(event, changeType, dataField) {
    if (event !== null) {
      if (changeType === 'slider') {
        this.configKey[dataField].value = event.checked;
        setTimeout(() => {
          this.cremToggleSlider?.forEach((toggleSliderComponent) => {
            if (toggleSliderComponent) {
              toggleSliderComponent.focus(dataField);
            }
          });
        });
      } else if (changeType === 'dropdown' && event) {
        if (this.configKey[dataField].selectMode === 'multiple') {
          if (
            event?.length &&
            event[0][this.configKey[dataField].valueExpr] !== undefined
          ) {
            this.configKey[dataField].value = event.map((multiItem) => {
              return multiItem[this.configKey[dataField].valueExpr];
            });
          } else {
            this.configKey[dataField].value = event.map((multiItem) => {
              return multiItem?.toString();
            });
          }
        } else {
          this.configKey[dataField].value = event;
        }
        if (!this.dropdownFocusing) {
          this.dropdownFocusing = true;
          setTimeout(() => {
            this.dropdownFocusing = false;
            this.cremDropdown?.forEach((dropdownComponent) => {
              if (
                dropdownComponent.dataField === dataField &&
                this.configKey[dataField].selectMode !== 'multiple'
              ) {
                dropdownComponent.focusDropdown();
              }
            });
          }, 350);
        }
      } else if (changeType === 'date' && event) {
        this.configKey[dataField].value = event.value;
      } else if (changeType === 'text' && event) {
        this.configKey[dataField].value = event;
      } else if (changeType === 'checkbox' && event) {
        this.configKey[dataField].value = event.value;
      } else if (changeType === 'toFromDate1' && event) {
        this.configKey[dataField].value1 = event.value;
      } else if (changeType === 'toFromDate2' && event) {
        this.configKey[dataField].value2 = event.value;
      } else if (changeType === 'hierarchyDropdown' && event) {
        if (this.configKey[dataField].selectMode === 'multiple') {
          this.configKey[dataField].value = event.map((item) => item.valueKey);
        } else {
          this.configKey[dataField].value =
            event && event.length > 0 ? event[0].valueKey : null;
        }
      }

      if (this.changeEvent) {
        const data = {} as any;
        data.values = this.configKey;
        data.dataField = dataField;
        this.changeEvent.emit(data);
      }
    }
  }

  public onInitialized(e, datafield) {
    setTimeout(() => {
      if (this.initialFocusElement === datafield) {
        e.component.focus();
      }
    }, 200);
  }

  public validate() {
    let formValid = true;
    this.form?.forEach((form) => {
      const formValidObject = form.instance.validate();
      formValid = formValid && formValidObject?.isValid;
    });
    let dropdownsValid = true;
    this.cremDropdown?.forEach((dropdownComponent) => {
      if (dropdownComponent) {
        const isValid = dropdownComponent.validate();
        dropdownsValid = dropdownsValid && isValid?.isValid;
      }
    });

    let datePickerValid = true;
    this.cremDatePicker?.forEach((datePickerComponent) => {
      const isValid = datePickerComponent.validate();
      datePickerValid = datePickerValid && isValid;
    });

    let textBoxValid = true;
    this.cremTextBox?.forEach((textBoxComponent) => {
      const isValid = textBoxComponent.validate();
      textBoxValid = textBoxValid && isValid;
    });

    this.formValid =
      formValid && dropdownsValid && datePickerValid && textBoxValid;
    return this.formValid;
  }

  public isItemSelected(): boolean {
    // check if any item is selected in the form
    const hasEmptyObject = Object.keys(this.configKey).every((item) => {
      switch (this.configKey[item].fieldType) {
        case 'dropdown':
          if (this.configKey[item].value?.length) {
            return false;
          }
          break;
        case 'toFromDate':
          if (this.configKey[item].value1 || this.configKey[item].value2) {
            return false;
          }
          break;
        default:
          if (this.configKey[item].value || this.configKey[item].value !== 0) {
            return false;
          }
          break;
      }
      return true;
    });
    return !hasEmptyObject;
  }

  public clearForm() {
    this.cremDropdown?.forEach((dropdown) => {
      dropdown.clearSelectBox();
    });
    this.config.section.forEach((section) => {
      section.formObjects?.forEach((formObjects) => {
        formObjects?.sectionItems?.forEach((formItem) => {
          if (formItem.fieldType === 'text') {
            formItem.value = '';
          } else if (formItem.fieldType === 'toggle') {
            formItem.value = formItem.defaultValue
              ? formItem.defaultValue
              : false;
          } else if (formItem.fieldType === 'checkbox') {
            formItem.value = formItem.defaultValue
              ? formItem.defaultValue
              : false;
          } else if (formItem.fieldType === 'dropdown') {
            formItem.value = [];
          } else if (formItem.fieldType === 'date') {
            formItem.value = null;
            this.configKey[formItem.dataField].value = null;
          }
        });
      });
    });
  }

  public getConfig() {
    return this.configKey;
  }
}
