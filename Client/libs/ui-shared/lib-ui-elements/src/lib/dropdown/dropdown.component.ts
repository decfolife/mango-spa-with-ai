import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ContentChild,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  DxDataGridComponent,
  DxDropDownBoxComponent,
  DxFormComponent,
  DxSelectBoxComponent,
  DxValidatorComponent,
} from 'devextreme-angular';
import { CremValidatedComponent } from '../base';
import { dxValidatorResult } from 'devextreme/ui/validator';
import CustomStore from 'devextreme/data/custom_store';

/**
 *
 * @export Dropdown Component
 * @class DropdownComponent
 * @description More info: https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Widgets/dxSelectBox/
 * @implements {OnInit}
 * @implements {OnChanges}
 */
@Component({
  selector: 'crem-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: DropdownComponent,
    },
    {
      provide: CremValidatedComponent,
      useExisting: DropdownComponent,
    },
  ],
})
export class DropdownComponent
  extends CremValidatedComponent
  implements OnInit, OnChanges, AfterViewInit, ControlValueAccessor
{
  public data: any[];
  public value: string[];
  public selections: any = [];
  public selectedObjects: any = [];
  public wrapperAttr: any;
  public selectBoxWrapperAttr: any;
  public selectedDisplay: any[] = [];
  public isDropDownBoxOpened = false as boolean;
  public modalValueChanging = false as boolean;
  public loading = true as boolean;
  private clearButton: any;
  private selectBoxOpenFlag = false;

  @Output() selectedItems = new EventEmitter<any[]>();
  @Output() moreMenuItemClicked = new EventEmitter<any>();
  @Output() gridDropdownValueChanged = new EventEmitter<boolean>();
  @Output() blur = new EventEmitter<any>();
  @Output() selectionClosed = new EventEmitter<void>();
  @ViewChild('dropdownTemplate', { static: false })
  dropdownTemplate: DxDataGridComponent;
  @ViewChild(DxSelectBoxComponent) selectBox: DxSelectBoxComponent;
  @ViewChild(DxDropDownBoxComponent) dropDown: DxDropDownBoxComponent;
  @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
  @ViewChild('SelectBoxValidator', { static: false })
  SelectBoxValidator: DxValidatorComponent;
  @ViewChild('DropdownBoxValidator', { static: false })
  DropdownBoxValidator: DxValidatorComponent;

  /**
   * Defines the HTML ID attribute
   *
   * @type {string}
   * @memberof DropdownComponent
   */
  @Input() public id: string;
  @Input() public initialSelectedValue: any;
  @Input() public placeholder = 'Select...' as string;
  /**
   * Only used for fieldTemplate, will be rendered inside the input field
   *
   * @type {string}
   * @memberof DropdownComponent
   */
  @Input() public label?: string;
  public valueKey: string;
  /**
   * If true it uses 'dx-select-box', if false/undefined it will use 'dx-drop-down-box'
   *
   * @type {boolean}
   * @memberof DropdownComponent
   */
  @Input() public useSelectBox?: boolean = false;
  /**
   * The selected element shown in the input field
   *
   * @type {*}
   * @memberof DropdownComponent
   */
  @Input() public selectBoxValue?: any;
  /**
   * (DevExtreme) Specifies the name of the data source item field whose value is displayed by the widget.
   *
   * @type {string}
   * @memberof DropdownComponent
   */
  @Input() public valueExpr?: string = 'valueKey';
  @Input() keyExpr?: string = null;

  /**
   * Allows sorting dropdowns
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/Data_Layer/DataSource/Configuration/#sort
   *
   * @type {Array<string>}
   * @memberof DropdownComponent
   */
  @Input() sort: string;

  /**
   * (DevExtreme) Specifies the name of the data source item field whose value is displayed by the widget.s
   *
   * @type {string}
   * @memberof DropdownComponent
   */
  @Input() public displayExpr?: string = 'displayKey';
  @Input() public isSearchable?: boolean;
  @Input() public contentTemplate?: any;
  @Input() public hoverText?: string;
  @Input() public columnHeader?: boolean;
  @Input() public showHeader?: boolean = false;
  @Input() public showClearButton?: boolean = true;
  @Input() public selectMode?: 'single' | 'multiple' = 'single';
  @Input() public dropdownHeaderDisplay: string;
  @Input() public showColumnHeader?: boolean = false;
  @Input() public required?: boolean = false;
  @Input() public isVisible?: boolean = true;
  @Input() public dataField?: string;
  @Input() public readOnly?: boolean = false;
  @Input() public showRedBorder?: boolean = false;
  @Input() public customRequireValidation?: boolean = false;
  /**
   * Auto Selects if the dropdown it has only one value
   *
   * @type {boolean}
   * @memberof DropdownComponent
   */
  @Input() public autoSelect?: boolean = false;
  /**
   * Specifies whether data items should be grouped.
   *
   * @type {boolean}
   * @memberof DropdownComponent
   */
  @Input() public grouped?: boolean = false;
  @Input() public emitWholeEvent?: boolean = false;
  @Input() public showTooltip?: boolean = false;
  @Input() public useArrayOfKeys?: boolean = false;
  @Input() public getWholeObject?: boolean = false;
  @Input() public useCustomGroupTemplate?: boolean = false;
  @Input() public showCheckBoxesMode?:
    | 'onClick'
    | 'onLongTap'
    | 'always'
    | 'none' = 'none';
  /**
   * Select options' dropdown
   *
   * @type {(any)}
   * @memberof DropdownComponent
   */
  @Input() public dataSource: any; // TODO: 'any' is being used while code is being cleaned and types standardize to use 'Dropdown' type instead for type safety

  /**
   * It allows the search/type-ahead functionality.
   *
   * @type {boolean}
   * @memberof DropdownComponent
   */
  @Input() public allowSearch?: boolean = false;
  /**
   * (DevExtreme) Specifies the container in which the UI Component is rendered, addressing issues related to dropdown container miscalculation on the y-axis. Read more at https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxPopup/Configuration/#container
   *
   * @type {boolean}
   * @memberof DropdownComponent
   */
  @Input() containerized = true;
  @Input() isDisabled = false;
  @Input() dropDownContainerCustomClass: string;
  /**
   * Show/Hide DevExtreme default tooltip
   *
   * @type {boolean}
   * @memberof DropdownComponent
   */
  @Input() showDefaultValidationTooltip?: boolean = true;
  /**
   * (DevExtreme) Use a different item template, make sure to pass any additional parameter that may be needed by the template
   *
   * @type {('defaultItem' | 'withMenu')}
   * @memberof DropdownComponent
   */
  @Input() itemTemplate?: 'defaultItem' | 'withMenu';
  /**
   * (DevExtreme) Specifies a custom template for the text field. Must contain the TextBox UI component.
   *
   * @type {'withLabel'}
   * @memberof DropdownComponent
   */
  @Input() fieldTemplate?: 'withLabel';

  /**
   * (DevExtreme) Specifies a comparison operation used to search UI component items.
   * Searching works when inputting a plain data structure only.
   * If you're using the 'contains' mode, make sure to define and pass the searchExpr
   *
   * @url https://js.devexpress.com/Angular/Documentation/Guide/UI_Components/SelectBox/Configure_Search_Parameters/
   * @url https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxSelectBox/Configuration/#searchMode
   * @memberof DropdownComponent
   */
  @Input() searchMode?: 'startswith' | 'contains' | 'equals' = 'contains';

  /**
   * (DevExtreme) Specifies the time delay, in milliseconds, after the last character has been typed in, before a search is executed.
   *
   * @url https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxSelectBox/Configuration/#searchTimeout
   * @type {number}
   * @memberof DropdownComponent
   */
  @Input() searchTimeout: number;

  /**
   * (DevExtreme) Use the minSearchLength property to increase the number of characters that triggers the search.
   *
   * @url https://js.devexpress.com/Angular/Documentation/Guide/UI_Components/SelectBox/Configure_Search_Parameters/
   * @type {number}
   * @memberof DropdownComponent
   */
  @Input() minSearchLength = 1;

  /**
   * (DevExtreme) Specifies the name of a data source item field or an expression whose value is compared to the search criterion.
   * Assign an array of field names to this property if you need to search several fields.
   *
   * @url https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxSelectBox/Configuration/#searchExpr
   * @type {number}
   * @memberof DropdownComponent
   */
  @Input() searchExpr?: string | Array<string>;

  @Input() labelledby?: string;
  @Input() inputId?: string;
  @Input() readOnlyStyle: 'input' | 'text-only' = 'input';

  // exsting usages of dropdown may rely on sourcing selectedDisplay from the valueExpr. setting this to false this allows the provided displayExpr to be used to drive the selectedDisplay
  @Input() useImplictValueExpr: boolean = true;

  @Input() formControlName!: string;

  isTooltipVisible = false;
  isdisplayExprTooltipVisible = false;
  displayExprTooltipText = '';
  toolTipTarget = '';
  btnDisabledReason = '';
  public touched = false;

  @ContentChild('customHeaderTemplate') customHeaderTemplate: TemplateRef<any>;
  @ViewChild(DxFormComponent, { static: false }) form: DxFormComponent;
  @ViewChild('dropDownBox', { static: false }) dropDownBox: any;

  constructor(
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    super();
  }

  onChange = (value: string) => {};
  onTouched = () => {
    this.touched = true;
  };

  get selectBoxInputAttr(): Record<string, string> {
    const attr: Record<string, string> = {
      title: this.hoverText || this.placeholder,
      'aria-controls': this.id + '_select-box',
    };
    if (this.inputId) {
      attr['id'] = this.inputId;
    }
    if (this.labelledby) {
      attr['aria-labelledby'] = this.labelledby;
    } else {
      attr['aria-label'] = this.hoverText || this.placeholder;
    }
    return attr;
  }

  get dropDownBoxInputAttr(): Record<string, string> {
    const attr: Record<string, string> = {
      title: this.placeholder,
      'aria-controls': this.id + 'dropdownContainer',
    };
    if (this.inputId) {
      attr['id'] = this.inputId;
    }
    if (this.labelledby) {
      attr['aria-labelledby'] = this.labelledby;
    } else {
      attr['aria-label'] = this.placeholder;
    }
    return attr;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { previousValue, currentValue } = changes.dataSource || {};

    if (this.sort && Array.isArray(this.dataSource)) {
      this.dataSource = this.sortByParameter(this.dataSource, this.sort);
    }

    if (
      previousValue !== currentValue &&
      currentValue &&
      currentValue.length > 0
    ) {
      this.initializeDropdown();
    }
  }

  sortByParameter(array: any[], parameter: string): any[] {
    return array.sort((a, b) => {
      const paramA = a[parameter]?.toLowerCase() || '';
      const paramB = b[parameter]?.toLowerCase() || '';
      return paramA.localeCompare(paramB);
    });
  }

  ngAfterViewInit() {
    this.clearButton = document.querySelector(
      '.dx-icon-clear'
    ) as HTMLElement | null;
    if (this.clearButton) {
      this.clearButton.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          this.dropDownBox.instance.option('value', null);
        }
      });
    }
  }

  initializeDropdown(): void {
    this.selectedDisplay = [];
    this.selections = [];

    this.setDropdownvalue(this.initialSelectedValue);
    this.setDropDownAttr();
  }

  onKeyDown(e) {
    if (e.event.code === 'Tab') {
      let iconElement = e.element.querySelector('span.dx-icon.dx-icon-clear');
      iconElement.tabIndex = 0;
      iconElement.onkeydown = (event) => {
        if (event.code === 'Enter') {
          iconElement.click();
          this.focusDropdown();
        }
      };
    }
  }

  ngOnInit() {
    this.elementRef.nativeElement.id = this.id;

    this.dropdownHeaderDisplay = this.dropdownHeaderDisplay || this.placeholder;

    // If the ID is not present, a random ID is generated to render the dropdown inside the input field of the dropdown.
    // Random IDs are also used for selecting the right component among other instances
    this.id = this.id ? this.id : this.getRandomID();

    this.wrapperAttr = {
      class: this.dropDownContainerCustomClass
        ? 'crem-select-box' + ' ' + this.dropDownContainerCustomClass
        : 'crem-select-box',
      id: 'crem-select-box',
    };
    this.selectBoxWrapperAttr = {
      id: 'crem-select-box',
      class: this.dropDownContainerCustomClass
        ? 'crem-select-box' + ' ' + this.dropDownContainerCustomClass
        : 'crem-select-box',
    };

    if (
      this.initialSelectedValue === null ||
      this.initialSelectedValue === undefined ||
      this.dataSource === null ||
      this.dataSource === undefined
    ) {
      this.loading = false;

      return;
    }
    this.loading = false;
    // this.adaAttributes();
  }

  // TODO: Check if this function is beingused anywhere. If not remove it.
  getEle() {
    const idEle = document.getElementById('dropdownContainer');
  }

  onMouseLeave() {
    this.isTooltipVisible = false;
    this.isdisplayExprTooltipVisible = false;
  }

  onMouseEnter(e, itemData) {
    if (this.showTooltip && itemData?.disabled) {
      this.isTooltipVisible = itemData.disabled;
      this.toolTipTarget = e.target;
      this.btnDisabledReason = itemData.disabledReason;
    }
  }

  onDisplayExprMouseEnter(e, itemData) {
    if (itemData?.name?.length > 22) {
      this.isdisplayExprTooltipVisible = true;
      this.toolTipTarget = e.target;
      this.displayExprTooltipText = itemData.name;
    }
  }

  dropdownOnValueChanged($event) {
    //If the value is null that means that the dropdown has been cleared of the selected value.
    //We want to emit this back to let the parent component know that the dropdown was cleared.
    if ($event.value === null && !this.useSelectBox) {
      this.dataGrid.instance ? this.dataGrid.instance.clearSelection() : null;
      this.selectedItems.emit([]);
    } else if (this.useSelectBox) {
      // When dataSource is a DataSource with a CustomStore, we can't iterate _items
      // because only the currently loaded page is available. Use byKey instead.
      const store = this.dataSource?.store?.();
      if (store instanceof CustomStore && store.key() && $event.value != null) {
        store.byKey($event.value).then((item) => {
          if (item) {
            if (this.emitWholeEvent) {
              this.selectedItems.emit($event);
            } else {
              this.modalValueChanging = true;
              this.selectedItems.emit([item]);
              setTimeout(() => {
                this.selectBox.instance.close();
              });
              setTimeout(() => {
                this.modalValueChanging = false;
              }, 400);
            }
          } else {
            this.clearSelectBox();
            this.selectedItems.emit([]);
          }
        });
      } else {
        let index = -1;
        let itemIndex = -1;
        let groupIndex = -1;
        if (this.grouped) {
          (this.dataSource?._items || this.dataSource || []).forEach(
            (group, gIndex) => {
              const tempItemIndex = group.items?.findIndex((data) => {
                return data?.[this.valueExpr] === $event?.value;
              });

              if (tempItemIndex !== -1) {
                groupIndex = gIndex;
                itemIndex = tempItemIndex;
              }
            }
          );
        } else {
          index = (this.dataSource?._items || this.dataSource || []).findIndex(
            (data) => {
              return data?.[this.valueExpr] === $event?.value;
            }
          );
        }

        if (this.emitWholeEvent) {
          this.selectedItems.emit($event);
        } else {
          if (!this.grouped && index !== -1) {
            this.modalValueChanging = true;
            this.selectedItems.emit([
              (this.dataSource?._items || this.dataSource || [])[index],
            ]);
            setTimeout(() => {
              this.selectBox.instance.close();
            });
            setTimeout(() => {
              this.modalValueChanging = false;
            }, 400);
          } else if (this.grouped && itemIndex !== -1) {
            this.modalValueChanging = true;
            this.selectedItems.emit([
              (this.dataSource?._items || this.dataSource || [])[groupIndex]
                .items[itemIndex],
            ]);
            setTimeout(() => {
              this.selectBox.instance.close();
            });
            setTimeout(() => {
              this.modalValueChanging = false;
            }, 400);
          } else {
            this.clearSelectBox();
            this.selectedItems.emit([]);
          }
        }
      }
    }
    this.onChange($event.value);
    this.onTouched();
  }

  onCellClick(event) {
    if (
      this.selectMode === 'multiple' &&
      (!event.column.type || event.column.type !== 'selection')
    ) {
      this.dataGrid.instance.selectRows([event.key], true);
    }
    if (event.rowType == 'header') {
      if (
        this.selectMode === 'multiple' &&
        (!event.column.type || event.column.type !== 'selection')
      ) {
        if (
          this.dataGrid.instance.getSelectedRowKeys().length ==
          this.dataGrid.instance.getDataSource().items().length
        ) {
          this.clearDropdown();
        } else {
          this.dataGrid.instance.selectAll();
        }
      }
      const headerCheckboxContainer = event.component
        .$element()
        .find('.dx-header-row .dx-checkbox-container');
      const headerCheckboxAttr = event.component
        .$element()
        .find(
          '.dx-widget.dx-checkbox.dx-select-checkbox.dx-datagrid-checkbox-size'
        )
        .attr('aria-checked');
      if (headerCheckboxAttr === 'true') {
        headerCheckboxContainer.attr('aria-live', 'polite');
        headerCheckboxContainer.attr(
          'aria-label',
          'All checkboxes are checked '
        );
      } else {
        headerCheckboxContainer.attr('aria-live', 'polite');
        headerCheckboxContainer.attr(
          'aria-label',
          'All checkboxes are un-checked'
        );
      }
    }
  }

  getSelectedRowsData($event) {
    this.ngZone.run(() => {
      const selections = $event.selectedRowsData;
      if (!selections) {
        return;
      }
      this.selectedDisplay = selections.map(
        (data) => data?.[this.resolveSelectedDisplaySource()]
      );
      if (this.selectMode == 'single' && this.selectedDisplay.length) {
        this.focusDropdown();
        setTimeout(() => {
          this.isDropDownBoxOpened = false;
          this.selectionClosed.emit();
        }, 400);
      }

      this.gridDropdownValueChanged.emit(true);
      this.selectedItems.emit(selections);

      this.cdr.detectChanges(); // Manually trigger change detection
    });
  }

  /**
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxSelectBox/Methods/#clear
   *
   * @memberof DropdownComponent
   */
  clearSelectBox() {
    this.selectedDisplay = [];

    if (this.selectBox?.instance) {
      this.selectBox.instance.clear();
    }
  }

  clearDropdown() {
    this.selectedDisplay = [];
    this.dataGrid.instance ? this.dataGrid.instance.clearSelection() : null;
  }

  onKeyUp(event) {
    const targetElement = event.target as HTMLElement;
    if (
      targetElement &&
      targetElement.tagName === 'INPUT' &&
      targetElement.getAttribute('role') === 'textbox'
    ) {
      const filterValue = (targetElement as HTMLInputElement).value || '';
      targetElement.setAttribute(
        'aria-label',
        filterValue ? 'Search filter: ' + filterValue : 'Search filter'
      );
    }
  }

  onBlur(event) {
    this.blur.emit(event);
  }

  setDropdownvalue(value: any) {
    // When auto-selects is true and dataSource is one, automatically select the element
    const autoSelect = this.dataSource?.length === 1 && this.autoSelect;

    if (this.selectMode == 'single') {
      if (autoSelect) {
        this.selectBoxValue =
          this.dataSource[0]?.[this.valueExpr || this.keyExpr];
      }

      (this.dataSource?._items || this.dataSource || []).forEach((data) => {
        if (data?.[this.valueExpr] === value) {
          this.selectedDisplay = [data?.[this.resolveSelectedDisplaySource()]];

          this.selections = [data?.[this.keyExpr || this.valueExpr]];
        }
      });
    } else if (this.selectMode == 'multiple') {
      if (autoSelect) {
        this.selectedDisplay =
          this.dataSource[0]?.[this.valueExpr || this.keyExpr];
      }

      if (value) {
        (this.dataSource?._items || this.dataSource || []).forEach((data) => {
          if (
            value.includes(data?.[this.valueExpr]?.toString()) ||
            value.includes(data?.[this.valueExpr])
          ) {
            this.selectedDisplay.push(
              data?.[this.resolveSelectedDisplaySource()]
            );

            if (!this.useArrayOfKeys) {
              this.selections.push(data);
            }
            if (this.getWholeObject) {
              this.selectedObjects.push(data);
            }
          }
        });
        if (this.useArrayOfKeys) {
          this.selections = value;
        }
      }

      if (this.getWholeObject) {
        this.selectedItems.emit(this.selectedObjects);
      } else {
        this.selectedItems.emit(this.selections);
      }
    }
    this.onChange(value);
    this.onTouched();
  }

  private resolveSelectedDisplaySource() {
    return this.useImplictValueExpr ? this.valueExpr : this.displayExpr;
  }

  focusDropdown() {
    if (!this.useSelectBox) {
      this.dropDown.instance.focus();
    } else {
      this.selectBox.instance.focus();
    }
  }

  isDropdownOpen() {
    if (this.useSelectBox) {
      return this.selectBox.instance.option().opened;
    } else {
      return this.dropDown.instance.option().opened;
    }
  }

  openDropdown(e) {
    this.setDropDownAttr();
    this.setDropDownHeaderAttr();
    this.touched = true;
  }

  getWithLabelValue(item): string {
    if (!item) return '';
    // FIXME: All these name checks is because we lack a better types for 'dataSource' and 'selectBoxValue'
    const baseValue: string =
      item.name ??
      item.displayValue ??
      item.value ??
      item.valueKey ??
      item['displayExpr'];
    return `${baseValue}`;
  }

  /**
   * It will try to find the right key used for the select value of the select box
   * FIXME: All these name checks is because we lack a better types for 'dataSource' and 'selectBoxValue'
   *
   * @param {*} item
   * @return {*}  {string}
   * @memberof DropdownComponent
   */
  getWithLabelKey(item): string {
    switch (true) {
      case item.name:
        return 'name';
      case item.displayValue:
        return 'displayValue';
      case item.value:
        return 'value';
      case item.valueKey:
        return 'valueKey';
      default:
      case item['displayExpr']:
        return 'displayExpr';
    }
  }

  setDropDownAttr() {
    // Add title attribute to all dropdown options
    if (!this.useSelectBox) {
      const dropdownOverLayContainer =
        document.querySelector('#crem-select-box');
      const dropdownElement =
        dropdownOverLayContainer?.getElementsByClassName('dx-row dx-data-row');
      setTimeout(() => {
        const arr = dropdownElement ? Array.from(dropdownElement) : [];
        if (arr?.length) {
          arr.forEach((el) => {
            const childElment = Array.from(el.children);
            if (childElment.length) {
              childElment.forEach((childEl) => {
                if (childEl.innerHTML.length > 0) {
                  if (childEl?.classList?.contains('dx-command-select')) {
                    if (childElment?.[1]) {
                      const dropdownText =
                        childElment?.[1]?.textContent?.trim() || '';
                      const checkboxElement =
                        childElment[0].querySelector('.dx-checkbox');
                      if (checkboxElement) {
                        checkboxElement.setAttribute(
                          'aria-label',
                          'Select ' + dropdownText
                        );
                        checkboxElement.removeAttribute('aria-readonly');
                      }
                    }
                  } else {
                    childEl.setAttribute(
                      'title',
                      childEl.innerHTML.replace(/<[^>]*>/g, '')
                    );
                  }
                }
              });
            }
          });
        }
      }, 100);

      const searchIconElement = document.getElementsByClassName(
        'dx-item dx-menu-item dx-menu-item-has-icon dx-menu-item-has-submenu'
      );
      setTimeout(() => {
        const iconArr = Array.from(searchIconElement);
        if (iconArr?.length) {
          iconArr.forEach((iconEl) => {
            iconEl.setAttribute('title', 'search');
          });
        }
      });

      if (
        this.showCheckBoxesMode === 'always' &&
        this.selectMode === 'multiple'
      ) {
        const collection = document.getElementsByClassName(
          'dx-datagrid-filter-row'
        );
        setTimeout(() => {
          const arr = Array.from(collection);
          if (arr.length) {
            arr.forEach((el) => {
              const childElment = Array.from(el.children);
              if (childElment.length) {
                childElment.forEach((childEl) => {
                  if (childEl.className == 'dx-editor-cell') {
                    childEl.setAttribute('colSpan', '2');
                  }
                });
              }
            });
          }
        }, 100);
      }
    } else {
      //add title to all selectbox options

      const selectBoxPopupElement =
        document.getElementsByClassName('crem-select-box');
      const selectDisabledElement =
        document.getElementsByClassName('dx-state-disabled');
      setTimeout(() => {
        const selectBoxPopupElementarr = Array.from(selectBoxPopupElement);
        const selectDisabledElementarr = Array.from(selectDisabledElement);
        if (selectBoxPopupElementarr.length) {
          selectBoxPopupElementarr.forEach((element) => {
            const selectBoxElement = element.getElementsByClassName(
              'dx-list-item-content'
            );
            setTimeout(() => {
              const arr = Array.from(selectBoxElement);
              if (arr.length) {
                arr.forEach((el) => {
                  if (el?.innerHTML?.length > 0) {
                    el.setAttribute(
                      'title',
                      el.innerHTML.replace(/<[^>]*>/g, '')
                    );
                  }
                });
              }
            }, 100);
          });
        }
        if (selectDisabledElementarr.length) {
          selectDisabledElementarr.forEach((disabled) => {
            const disabledTitles = disabled.getElementsByClassName(
              'dx-list-item-content'
            );
            setTimeout(() => {
              const disArr = Array.from(disabledTitles);
              if (disArr.length) {
                disArr.forEach((el) => {
                  el.setAttribute('title', '');
                });
              }
            }, 100);
          });
        }
      }, 100);
    }
  }

  setDropDownHeaderAttr() {
    // Add aria-label attribute to header dropdown options
    if (!this.useSelectBox) {
      const dropdownElement = document.getElementsByClassName(
        'dx-row dx-header-row'
      );
      setTimeout(() => {
        const arr = Array.from(dropdownElement);
        if (arr?.length) {
          arr.forEach((el) => {
            const childElment = Array.from(el.children);
            if (
              childElment.length &&
              childElment[0]?.classList?.contains('dx-command-select')
            ) {
              if (childElment?.[1]) {
                const checkboxElement = childElment[0].children[0];
                const inputTag = checkboxElement?.querySelector('input');
                checkboxElement?.setAttribute('aria-label', 'Select All');
              }
            }
          });
        }
      }, 100);
    }
  }

  resetSelections() {
    if (this.dropDown) {
      this.dropDown.instance.reset();
    }
    if (this.dataGrid) {
      this.dataGrid.instance.clearFilter();
    }
  }

  public validate() {
    if (this.touched) {
      if (this.useSelectBox) {
        const validation = this.SelectBoxValidator.instance.validate();
        return validation;
      } else {
        const validation = this.DropdownBoxValidator.instance.validate();
        return validation;
      }
    } else if (this.required) {
      const result: dxValidatorResult = {
        isValid: false,
      };
      return result;
    }
    const result: dxValidatorResult = {
      isValid: true,
    };
    return result;
  }

  ADAattributes(e: any) {
    // Search for the span element with class dx-datagrid-nodata
    const spanElement = e.component.$element().find('.dx-datagrid-nodata');
    if (spanElement.length > 0) {
      spanElement.attr('role', 'alert');
      spanElement.attr('aria-live', 'polite');
    }

    // Check if e.element is a jQuery object:
    const element = e.element && e.element.jquery ? e.element[0] : e.element;

    // Aria requirements for search icon in the drop down
    const searchIcons = element.querySelectorAll('.dx-menu-item-has-icon');
    if (!searchIcons) {
      return;
    } else {
      searchIcons.forEach((searchIcon) => {
        if (!searchIcon) return;

        // Remove the aria-haspopup attribute
        searchIcon.removeAttribute('aria-haspopup');

        // Make the searchIcon focusable
        searchIcon.setAttribute('tabindex', '0');

        // Set initial aria-label and aria-expanded attributes
        searchIcon.setAttribute('aria-label', 'Search Button');
        searchIcon.setAttribute('aria-expanded', 'false');

        // Event listener for mouse hover
        searchIcon.addEventListener('mouseover', () => {
          searchIcon.setAttribute('aria-expanded', 'true');
        });

        // Reset on mouseout
        searchIcon.addEventListener('mouseout', () => {
          searchIcon.setAttribute('aria-expanded', 'false');
        });
      });

      const spanSearchInput = e.component
        .$element()
        .find('.dx-texteditor-input');
      if (spanSearchInput.length > 0) {
        spanSearchInput.attr('aria-label', 'Search Filter Text');
      }
    }

    // For multi-select grids, enhance checkbox labels with item names
    if (this.selectMode === 'multiple') {
      const rows = element.querySelectorAll('.dx-data-row');
      rows.forEach((row) => {
        const checkbox = row.querySelector('.dx-select-checkbox');
        const textCell = row.querySelector('td:not(.dx-command-select)');
        if (checkbox && textCell) {
          const itemText = textCell.textContent?.trim() || '';
          checkbox.setAttribute('aria-label', 'Select ' + itemText);
        }
      });
    }
  }

  closeSelectBox() {
    this.selectBox?.instance?.close();
  }

  onSelectBoxOpened(event) {
    this.selectBoxOpenFlag = true;
  }

  onContentReady(event: any): void {
    const ariaId = this.id;
    const listItemsElement = event.component
      .content()
      .querySelector('.dx-list-items');

    if (listItemsElement)
      // Add ID to dropdown overlay
      listItemsElement.id = ariaId;

    if (!this.id)
      console.warn(
        'The dropdown is missing an ID required for proper functionality.'
      );
  }

  onSelectBoxClosed(event) {
    this.selectBoxOpenFlag = false;
  }

  onSelectBoxDropDownKeyUp(event) {
    const instanceToOpen = this.useSelectBox
      ? this.selectBox.instance
      : this.dropDown.instance;
    const openSelectBox = this.useSelectBox && !this.selectBoxOpenFlag;
    if (
      event?.event?.originalEvent?.key === ' ' ||
      event?.event?.originalEvent?.key === 'ArrowDown' ||
      event?.event?.originalEvent?.key === 'Enter'
    ) {
      if (!this.useSelectBox || openSelectBox) {
        instanceToOpen.open();
        event.event.preventDefault();
      }
    }
    const iconClearElement = document.querySelector(
      '.dx-icon-clear'
    ) as HTMLElement | null;
    if (iconClearElement) {
      iconClearElement.setAttribute('tabindex', '0');
      iconClearElement.setAttribute('role', 'button');
      iconClearElement.setAttribute('aria-label', 'Clear Search Filter');
    }
  }

  onGridKeyDown(event: any) {
    if (event?.event?.key === 'Escape') {
      if (
        this.dropDown &&
        this.dropDown.instance &&
        typeof this.dropDown.instance.close === 'function'
      ) {
        this.focusDropdown();
        this.dropDown.instance.close();
      }
    }

    if (event?.event?.key === 'Enter') {
      const rowIndex = this.dataGrid?.instance?.option('focusedRowIndex');
      if (rowIndex != null && rowIndex >= 0) {
        const rowKey = this.dataGrid.instance.getKeyByRowIndex(rowIndex);
        if (rowKey != null) {
          if (this.selectMode === 'multiple') {
            const selected = this.dataGrid.instance.getSelectedRowKeys() || [];
            const isSelected = selected.some(
              (k) => JSON.stringify(k) === JSON.stringify(rowKey)
            );
            if (isSelected) {
              this.dataGrid.instance.deselectRows([rowKey]);
            } else {
              this.dataGrid.instance.selectRows([rowKey], true);
            }
          } else {
            this.dataGrid.instance.selectRows([rowKey], false);
          }
          event.event.preventDefault();
        }
      }
    }
  }

  moreMenuDropdownClick(item: any) {
    this.moreMenuItemClicked.emit(item);
  }

  /**
   * Selects the inner dx-text-box when using the withLabel field template.
   *
   * @memberof DropdownComponent
   */
  onClickSelectBox(): void {
    document.getElementById(this.id)?.querySelector('input')?.select();
    // this.selectBox.instance ? this.selectBox.instance.reset() : null
  }

  /**
   * This re-selects the previous value of the 'withLabel' select.
   *
   * @param e
   * @memberof DropdownComponent
   */
  onValueChangedWithLabel(e: any, item: any, inputRef?: any): void {
    if (!e.value && e.previousValue) {
      this.selectBox.instance.option(
        this.getWithLabelKey(item),
        this.getWithLabelValue(item)
      );
    }

    if (!inputRef) return;
    // Update input's aria-expanded value
    const inputElement = inputRef.instance.element().querySelector('input');
    const ariaExpanded = Boolean(inputElement.getAttribute('aria-expanded'));
    inputElement.setAttribute('aria-expanded', !ariaExpanded);
  }

  onContentReadyWithLabel(e: any, inputRef: any): void {
    const inputElement = inputRef.instance.element().querySelector('input');
    // Add aria-expanded to input
    if (inputElement) {
      const ariaExpanded = Boolean(inputElement.getAttribute('aria-expanded'));
      inputElement.setAttribute('aria-expanded', !ariaExpanded);
      inputElement.setAttribute('role', 'combobox');
    }
  }

  /**
   * Generates a random ID used for various logic. If the ID will be used for testing, please provide an ID to the crem-dropdown component to prevent changing IDs.
   *
   * @return {*}  {string}
   * @memberof DropdownComponent
   */
  getRandomID(): string {
    return this.id
      ? this.id
      : 'rand-' + Math.random().toString(36).substring(2);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  writeValue(selection: any): void {
    this.setDropdownvalue(selection);
    if (!selection || (selection && selection.length === 0)) {
      this.clearSelectBox();
    }
  }

  cremSharedComponentValidator() {
    return this.status === 'error';
  }

  formatReadOnlySelection() {
    if (this.selectedDisplay?.length > 0) {
      return this.selectedDisplay
        .map((key) => {
          const item = this.dataSource.find(
            (item) => item[this.keyExpr || this.valueExpr] === key
          );
          return item ? item[this.displayExpr] : '';
        })
        .filter(Boolean)
        .join(', ');
    }
    return '';
  }
}
@Directive({
  selector: 'dropdownButton',
})
export class DropDownButtonDirective {}

@Directive({
  selector: 'dropdownTemplate',
})
export class DropdownTemplateDirective {}
