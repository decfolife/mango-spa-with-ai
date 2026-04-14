import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormWizardService } from '@micro-components/services/form-wizard.service';
import {
  AiFormField,
  AiDropdownItem,
  AiFormSection,
  AiRentScheduleSection,
  AiRadioOption,
} from '../../models/ai-form.model';
import { AiSidebarService } from '../../ai-sidebar/ai-sidebar.service';

@Component({
  selector: 'mango-ai-form-section',
  templateUrl: './ai-form-section.component.html',
  styleUrls: ['./ai-form-section.component.scss'],
})
export class AiFormSectionComponent implements OnInit {
  @Input() section: AiFormSection;
  @Input() formGroup: FormGroup;
  @Input() editMode = false;
  @Input() isExpanded = true;
  @Input() isSuperUser = false;

  rentSchedule: AiRentScheduleSection | null = null;

  constructor(
    private readonly formWizardService: FormWizardService,
    private readonly aiSidebarService: AiSidebarService
  ) {}

  readonly rentScheduleColumns = [
    { dataField: 'startMonth', caption: 'Start Mo.', width: 90 },
    { dataField: 'endMonth', caption: 'End Mo.', width: 90 },
    {
      dataField: 'startDate',
      caption: 'Start Date',
      dataType: 'date',
      format: 'MM/dd/yyyy',
      width: 120,
    },
    {
      dataField: 'endDate',
      caption: 'End Date',
      dataType: 'date',
      format: 'MM/dd/yyyy',
      width: 120,
    },
    {
      dataField: 'monthlyBaseRent',
      caption: 'Monthly Base Rent',
      dataType: 'number',
      format: { type: 'currency', precision: 0 },
      width: 160,
    },
  ];

  readonly abatementColumns = [
    { dataField: 'startMonth', caption: 'Start Mo.', width: 90 },
    { dataField: 'endMonth', caption: 'End Mo.', width: 90 },
    {
      dataField: 'startDate',
      caption: 'Start Date',
      dataType: 'date',
      format: 'MM/dd/yyyy',
      width: 120,
    },
    {
      dataField: 'endDate',
      caption: 'End Date',
      dataType: 'date',
      format: 'MM/dd/yyyy',
      width: 120,
    },
    {
      dataField: 'discountAmount',
      caption: 'Abatement Amount',
      dataType: 'number',
      format: { type: 'currency', precision: 0 },
      width: 160,
    },
    {
      dataField: 'discountPercent',
      caption: 'Discount %',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 1 },
      width: 110,
    },
  ];

  ngOnInit(): void {
    if (this.section?.rentSchedule) {
      this.rentSchedule = this.section.rentSchedule;
    }

    this.loadDropdownOptions();
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  onKeyDownOnLabel(event: KeyboardEvent, field: AiFormField): void {
    if (event.key === 'Enter') {
      this.openLabelLink(field);
    }
  }

  openLabelLink(field: AiFormField): void {
    if (!this.isSuperUser || !field.key) {
      return;
    }

    window.open(`/Forms/admin/formitemAE.asp?fFormItemID=${field.key}`, '_blank');
  }

  hasSearchableValue(field: AiFormField): boolean {
    if (['boolean', 'image', 'password', 'hidden', 'textonly'].includes(field.type)) {
      return false;
    }
    const display = this.formatDisplayValue(field);
    return display !== '—' && display.trim() !== '';
  }

  searchInDocument(field: AiFormField): void {
    const query = this.formatDisplayValue(field);
    if (query && query !== '—') {
      this.aiSidebarService.searchDocument(query);
    }
  }

  getFieldControl(fieldKey: string): any {
    return this.formGroup?.get(fieldKey);
  }

  getColumnTemplate(): string {
    const columns = Math.max(
      1,
      Math.min(this.section?.columnGroups?.length || this.section?.columns || 1, 4)
    );
    return `repeat(${columns}, minmax(0, 1fr))`;
  }

  formatDisplayValue(field: AiFormField): string {
    const val = this.getCurrentFieldValue(field);
    if (val == null || val === '') return '—';

    switch (field.type) {
      case 'multiselect':
        return this.getMultiSelectDisplayValue(field, val);
      case 'dropdown':
        return this.getDropdownDisplayValue(field, val);
      case 'boolean':
        return val === true || val === 'true' ? 'Yes' : 'No';
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(Number(val));
      case 'percent':
        return `${Number(val).toFixed(2)}%`;
      case 'number':
        return Number(val).toLocaleString();
      case 'date':
        return val ? new Date(val).toLocaleDateString('en-US') : '—';
      default:
        if (field.displayValue) {
          return field.displayValue;
        }
        return String(val);
    }
  }

  getCurrentFieldValue(field: AiFormField): any {
    return this.getFieldControl(field.key)?.value ?? field.value;
  }

  shouldRenderField(field: AiFormField): boolean {
    return field.type !== 'hidden';
  }

  isDropdownField(field: AiFormField): boolean {
    return field.type === 'dropdown';
  }

  isMultiSelectField(field: AiFormField): boolean {
    return field.type === 'multiselect';
  }

  isTextAreaField(field: AiFormField): boolean {
    return field.type === 'textarea';
  }

  isDateField(field: AiFormField): boolean {
    return field.type === 'date';
  }

  isBooleanField(field: AiFormField): boolean {
    return field.type === 'boolean';
  }

  isRadioField(field: AiFormField): boolean {
    return field.type === 'radio';
  }

  isImageField(field: AiFormField): boolean {
    return field.type === 'image';
  }

  isEmailField(field: AiFormField): boolean {
    return field.type === 'email';
  }

  isPasswordField(field: AiFormField): boolean {
    return field.type === 'password';
  }

  isTextOnlyField(field: AiFormField): boolean {
    return field.type === 'textonly';
  }

  isStandardInputField(field: AiFormField): boolean {
    return ![
      'dropdown',
      'multiselect',
      'boolean',
      'date',
      'textarea',
      'radio',
      'image',
      'email',
      'textonly',
      'hidden',
    ].includes(field.type);
  }

  getInputType(field: AiFormField): 'text' | 'number' | 'password' {
    if (field.type === 'number' || field.type === 'currency' || field.type === 'percent') {
      return 'number';
    }

    if (field.type === 'password') {
      return 'password';
    }

    return 'text';
  }

  getDropdownValueExpr(field: AiFormField): string {
    return field.valueExpr || 'id';
  }

  getDropdownDisplayExpr(field: AiFormField): string {
    return field.displayExpr || 'name';
  }

  onDropdownSelected(field: AiFormField, selectedItems: any[]): void {
    const valueExpr = this.getDropdownValueExpr(field);
    const nextValue = field.type === 'multiselect'
      ? (selectedItems ?? [])
          .filter((item) => item && valueExpr in item)
          .map((item) => item[valueExpr])
      : (() => {
          const selectedItem = selectedItems?.[0];
          return selectedItem && valueExpr in selectedItem
            ? selectedItem[valueExpr]
            : null;
        })();

    this.getFieldControl(field.key)?.setValue(nextValue);
    field.value = nextValue;
  }

  hasAbatements(): boolean {
    return (this.rentSchedule?.abatementItems?.length ?? 0) > 0;
  }

  private loadDropdownOptions(): void {
    (
      this.section?.columnGroups?.reduce(
        (allFields, group) => allFields.concat(group.fields),
        [] as AiFormField[]
      ) ??
      this.section?.fields ??
      []
    )
      ?.filter(
        (field) =>
          (field.type === 'dropdown' || field.type === 'multiselect') &&
          !field.dropdownItems?.length &&
          !!field.requestTypeId
      )
      .forEach((field) => {
        this.formWizardService.getRenderSelect('', field.requestTypeId!).subscribe({
          next: (result: any) => {
            const items = this.normalizeDropdownItems(result?.data);
            if (items.length) {
              field.dropdownItems = items;
            }
          },
        });
      });
  }

  private normalizeDropdownItems(items: any): AiDropdownItem[] {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item) => ({
      id:
        item.id ??
        item.value ??
        item.lookupID ??
        item.formItemID ??
        item.objectTypeTypeID ??
        item.leaseTypeID,
      name:
        item.name ??
        item.text ??
        item.label ??
        item.value ??
        item.lookupName ??
        item.formItemLabel ??
        item.objectTypeTypeName ??
        item.leaseTypeName,
    }));
  }

  private getDropdownDisplayValue(field: AiFormField, value: any): string {
    const items = field.dropdownItems ?? [];
    const valueExpr = this.getDropdownValueExpr(field);
    const displayExpr = this.getDropdownDisplayExpr(field);
    const matchedItem = items.find((item: any) => item?.[valueExpr] === value);

    if (!matchedItem) {
      if (field.displayValue) {
        return field.displayValue;
      }
      return String(value);
    }

    return String(matchedItem?.[displayExpr] ?? value);
  }

  private getMultiSelectDisplayValue(field: AiFormField, value: any): string {
    const values = Array.isArray(value)
      ? value
      : typeof value === 'string' && value.length
        ? value.split(',').map((item) => item.trim()).filter(Boolean)
        : [];

    if (!values.length) {
      return '—';
    }

    return values
      .map((item) => this.getDropdownDisplayValue(field, item))
      .join(', ');
  }

  getRadioOptions(field: AiFormField): AiRadioOption[] {
    return field.radioOptions ?? [];
  }

  getImageWidth(field: AiFormField): number {
    return field.formItemFieldWidth || 400;
  }

  getImageHeight(field: AiFormField): number {
    return field.formItemFieldHeight || 300;
  }
}
