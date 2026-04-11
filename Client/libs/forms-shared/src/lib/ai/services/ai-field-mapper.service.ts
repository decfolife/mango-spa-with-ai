import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IFields, FormWizardDataTypeID, FormWizardTypeID } from '@forms/model/dynamic-forms.interface';
import { DynamicFormsService } from '../../services/dynamic-forms.service';
import { IAIOutput } from '../models/ai-output.model';
import { AiDropdownItem, AiFieldType, AiFormField, AiFormSection } from '../models/ai-form.model';

// ── Mapping rules ────────────────────────────────────────────────────────────
// Each entry lists the normalised key fragments that identify a field by
// formItemFriendlyName / formItemSystemName, and the accessor into IAIOutput.
// The mapper tests every key fragment against the normalised field name and
// stops at the first match, so order matters: more-specific keys first.

interface MappingRule {
  keys: string[];
  getValue: (ai: IAIOutput) => any;
}

const MAPPING_RULES: MappingRule[] = [
  // ── Basics ─────────────────────────────────────────────────────────────────
  { keys: ['tenantname', 'tenant'],                   getValue: ai => ai.basics?.tenant?.value },
  { keys: ['landlordname', 'landlord'],               getValue: ai => ai.basics?.landlord?.value },
  { keys: ['squarefootage', 'rentablearea', 'grossarea', 'leasedarea', 'sqft', 'netrentablearea'],
                                                       getValue: ai => ai.basics?.squareFootage?.value },
  { keys: ['suite', 'suiteno', 'suitenum'],           getValue: ai => ai.basics?.suite?.value },
  { keys: ['floor', 'floors'],                        getValue: ai => Array.isArray(ai.basics?.floors?.value) ? ai.basics.floors.value.join(', ') : ai.basics?.floors?.value },
  { keys: ['leasetype', 'type'],                      getValue: ai => ai.basics?.leaseType?.value },
  { keys: ['dealtype', 'deal'],                       getValue: ai => ai.basics?.dealType?.value },
  { keys: ['spaceuse', 'useofpremises', 'permitted'], getValue: ai => ai.basics?.spaceUse?.value },
  { keys: ['entirebuilding'],                         getValue: ai => ai.basics?.entireBuilding?.value },
  { keys: ['includesamendments', 'amendments'],       getValue: ai => ai.basics?.includesAmendments?.value },

  // ── Dates ──────────────────────────────────────────────────────────────────
  { keys: ['leasesigndate', 'signdate', 'executiondate', 'signeddate'],
                                                       getValue: ai => ai.dates?.leaseSignDate?.value },
  { keys: ['leasestartdate', 'begindate', 'startdate', 'leasebegindate'],
                                                       getValue: ai => ai.dates?.leaseStartDate?.value },
  { keys: ['leasecommencementdate', 'commencementdate', 'commencement'],
                                                       getValue: ai => ai.dates?.leaseCommencementDate?.value },
  { keys: ['rentcommencementdate', 'rentcommencement', 'rcd'],
                                                       getValue: ai => ai.dates?.rentCommencementDate?.value },
  { keys: ['leaseenddate', 'enddate', 'expirationdate', 'expiration', 'maturitydate'],
                                                       getValue: ai => ai.dates?.leaseEndDate?.value },
  { keys: ['leasetermmonths', 'termmonths', 'terminmonths', 'term'],
                                                       getValue: ai => ai.dates?.leaseTermInMonths?.value },

  // ── Rent ───────────────────────────────────────────────────────────────────
  { keys: ['effectiverent', 'baserent', 'annualrent', 'rentpersf'],
                                                       getValue: ai => ai.rent?.effectiveRent?.value },
  { keys: ['annualescalation', 'escalationrate', 'escalation', 'rentescalation'],
                                                       getValue: ai => ai.rent?.annualEscalation?.value?.percent },
  { keys: ['tiallowance', 'tenantimprovementallowance', 'tenantimprovement', 'tiamount'],
                                                       getValue: ai => ai.rent?.tenantImprovementAllowance?.value },

  // ── Expenses ───────────────────────────────────────────────────────────────
  { keys: ['servicetype', 'nettype', 'leasestructure', 'grossnet'],
                                                       getValue: ai => ai.expenses?.serviceTypeEstimate?.value },
  { keys: ['operatingexpenses', 'opex'],              getValue: ai => ai.expenses?.operatingExpenses?.value },
  { keys: ['cam', 'commonareamaintenance'],           getValue: ai => ai.expenses?.cam?.value },
  { keys: ['insurance'],                              getValue: ai => ai.expenses?.insurance?.value },
  { keys: ['taxes', 'realestatetaxes', 'propertytaxes'],
                                                       getValue: ai => ai.expenses?.taxes?.value },
  { keys: ['electricity', 'electric'],               getValue: ai => ai.expenses?.electricity?.value },
  { keys: ['gas'],                                    getValue: ai => ai.expenses?.gas?.value },
  { keys: ['water'],                                  getValue: ai => ai.expenses?.water?.value },
  { keys: ['hvac', 'heating', 'cooling'],            getValue: ai => ai.expenses?.hvac?.value },
  { keys: ['cleaning', 'janitorial'],                getValue: ai => ai.expenses?.cleaning?.value },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalise(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function matchRule(field: IFields, rule: MappingRule): boolean {
  const haystack = [
    normalise(field.formItemFriendlyName),
    normalise(field.formItemSystemName),
    normalise(field.formItemLabel),
    normalise(field.formItemConstant),
  ].join('|');

  return rule.keys.some(key => haystack.includes(key));
}

function resolveAiFieldType(field: IFields): AiFieldType {
  if (field.formItemTypeID === FormWizardTypeID.LIST_BOX) return 'dropdown';
  switch (field.dataTypeID) {
    case FormWizardDataTypeID.DATE:     return 'date';
    case FormWizardDataTypeID.CURRENCY: return 'currency';
    case FormWizardDataTypeID.PERCENT:  return 'percent';
    case FormWizardDataTypeID.INTEGER:
    case FormWizardDataTypeID.SMALL_INT:
    case FormWizardDataTypeID.DOUBLE:
    case FormWizardDataTypeID.NUMBER:   return 'number';
    default:                            return 'text';
  }
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AiFieldMapperService {
  constructor(private readonly dynamicFormsService: DynamicFormsService) {}

  /**
   * Loads all fields for the given form sections, applies IAIOutput values,
   * and returns AiFormSection[] ready for the ai-lease-form renderer.
   *
   * @param formId      The form ID (e.g. the standard lease form ID)
   * @param objectTypeId  Object type ID — 4 for leases
   * @param sections    Section definitions returned by getFormSections
   * @param aiOutput    Parsed AI output to populate field values from
   */
  loadAndMap(
    formId: number,
    objectTypeId: number,
    sections: any[],
    aiOutput: IAIOutput
  ): Observable<AiFormSection[]> {
    return this.dynamicFormsService
      .getFormFieldsForAllSections(formId, objectTypeId, sections as [])
      .pipe(
        map(response => {
          const allFields: IFields[] = response?.data ?? [];
          const populated = this.applyAiOutput(allFields, aiOutput);
          return this.groupIntoSections(populated, sections);
        })
      );
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private applyAiOutput(fields: IFields[], aiOutput: IAIOutput): IFields[] {
    return fields.map(field => {
      for (const rule of MAPPING_RULES) {
        if (matchRule(field, rule)) {
          const value = rule.getValue(aiOutput);
          if (value !== undefined && value !== null) {
            return { ...field, formItemAnswer: value };
          }
          break;
        }
      }
      return field;
    });
  }

  private groupIntoSections(fields: IFields[], sections: any[]): AiFormSection[] {
    return sections
      .slice()
      .sort((a, b) => a.formSectionSortOrder - b.formSectionSortOrder)
      .map(section => ({
        key: String(section.formSectionID),
        title: section.formSectionName,
        fields: fields
          .filter(f => f.formSectionID === section.formSectionID)
          .sort((a, b) => a.formItemSortOrder - b.formItemSortOrder)
          .map(f => this.toAiFormField(f)),
      }))
      .filter(s => s.fields.length > 0);
  }

  private toAiFormField(field: IFields): AiFormField {
    return {
      key:          String(field.formItemID),
      label:        field.formItemLabel || field.formItemFriendlyName || field.formItemName,
      type:         resolveAiFieldType(field),
      value:        field.formItemAnswer ?? null,
      // Wire up dynamic dropdowns via the existing renderSelect infrastructure
      requestTypeId: field.requestTypeID || undefined,
    };
  }
}
