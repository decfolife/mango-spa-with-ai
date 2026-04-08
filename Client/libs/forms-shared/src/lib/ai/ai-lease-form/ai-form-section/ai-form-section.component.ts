import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AiFormField, AiFormSection, AiRentScheduleSection } from '../../models/ai-form.model';

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

  rentSchedule: AiRentScheduleSection | null = null;

  readonly rentScheduleColumns = [
    { dataField: 'startMonth', caption: 'Start Mo.', width: 90 },
    { dataField: 'endMonth', caption: 'End Mo.', width: 90 },
    { dataField: 'startDate', caption: 'Start Date', dataType: 'date', format: 'MM/dd/yyyy', width: 120 },
    { dataField: 'endDate', caption: 'End Date', dataType: 'date', format: 'MM/dd/yyyy', width: 120 },
    { dataField: 'monthlyBaseRent', caption: 'Monthly Base Rent', dataType: 'number', format: { type: 'currency', precision: 0 }, width: 160 },
  ];

  readonly abatementColumns = [
    { dataField: 'startMonth', caption: 'Start Mo.', width: 90 },
    { dataField: 'endMonth', caption: 'End Mo.', width: 90 },
    { dataField: 'startDate', caption: 'Start Date', dataType: 'date', format: 'MM/dd/yyyy', width: 120 },
    { dataField: 'endDate', caption: 'End Date', dataType: 'date', format: 'MM/dd/yyyy', width: 120 },
    { dataField: 'discountAmount', caption: 'Abatement Amount', dataType: 'number', format: { type: 'currency', precision: 0 }, width: 160 },
    { dataField: 'discountPercent', caption: 'Discount %', dataType: 'number', format: { type: 'fixedPoint', precision: 1 }, width: 110 },
  ];

  ngOnInit(): void {
    if (this.section?.rentSchedule) {
      this.rentSchedule = this.section.rentSchedule;
    }
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  getFieldControl(fieldKey: string): any {
    return this.formGroup?.get(fieldKey);
  }

  formatDisplayValue(field: AiFormField): string {
    const val = field.value;
    if (val == null || val === '') return '—';

    switch (field.type) {
      case 'boolean':
        return val === true || val === 'true' ? 'Yes' : 'No';
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(val));
      case 'percent':
        return `${Number(val).toFixed(2)}%`;
      case 'number':
        return Number(val).toLocaleString();
      case 'date':
        return val ? new Date(val).toLocaleDateString('en-US') : '—';
      default:
        return String(val);
    }
  }

  hasAbatements(): boolean {
    return (this.rentSchedule?.abatementItems?.length ?? 0) > 0;
  }
}
