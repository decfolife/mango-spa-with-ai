import { Pipe, PipeTransform } from '@angular/core';
import {
  FormWizardFieldType,
  FormWizardTypeID,
  FormWizardTypeIDType,
  FormWizardDataTypeID,
  FormWizardDataTypeIDType,
} from '@forms/model/dynamic-forms.interface';
import { InputMask } from '@mango/ui-shared/lib-ui-elements';

/**
 * Pipe that determines the appropriate control type for a form field.
 * It uses the specific type (`FormWizardDataTypeIDType` or `FormWizardFieldType`)
 * to infer which input control to render (e.g., dropdown, text input, date picker).
 *
 * @export
 * @class FieldTypePipe
 * @implements {PipeTransform}
 */
@Pipe({
  name: 'getFieldType',
  standalone: true,
})
export class GetFieldTypePipe implements PipeTransform {
  transform(
    itemType: number,
    dataType: number,
    fieldName: string
  ): FormWizardDataTypeIDType | FormWizardFieldType {
    const itemTypeName: FormWizardTypeIDType = FormWizardTypeID[
      itemType
    ] as FormWizardTypeIDType;
    const dataTypeName: FormWizardDataTypeIDType = FormWizardDataTypeID[
      dataType
    ] as FormWizardDataTypeIDType;

    switch (itemTypeName) {
      case 'LIST_BOX': {
        return itemTypeName;
      }
      case 'COMMENT_AREA': {
        return itemTypeName;
      }
      default:
      case 'CALCULATED':
      case 'TEXT_FIELD': {
        switch (dataTypeName) {
          case 'DATE': {
            return 'DATE';
          }
          case 'CURRENCY': {
            return 'CURRENCY';
          }
          case 'PERCENT': {
            return 'PERCENT';
          }
          case 'EMAIL': {
            // fixme: Check if contains the keyword email on the label, dataTypeName is not reliable
            if (fieldName.includes('Email')) {
              return 'EMAIL';
            } else {
              return 'TEXT_FIELD';
            }
          }
          case 'SMALL_INT':
          case 'INTEGER':
          case 'DOUBLE':
          case 'NUMBER': {
            return 'NUMBER';
          }
          default: {
            // fixme: Check if contains the keyword email on the label, dataTypeName is not reliable
            if (fieldName.includes('Email')) {
              return 'EMAIL';
            }
            return 'TEXT_FIELD';
          }
        }
      }
    }
  }
}

@Pipe({
  name: 'maskInput',
  standalone: true,
})
export class MaskInputPipe implements PipeTransform {
  transform(
    mask: InputMask,
    format?: string,
    fieldType?: FormWizardDataTypeIDType | FormWizardFieldType
  ): InputMask {
    let fieldMask: InputMask = {
      ...mask,
      showMaskTyped: false,
      dropSpecialCharacters: true,
    };

    switch (fieldType) {
      case 'CURRENCY': {
        if (format !== '') {
          fieldMask = {
            ...this.parseNumberMask(format),
            prefix: '', // $ for instance
            ...mask,
          };
        } else {
          fieldMask = {
            prefix: '', // $ for instance
            ...mask,
          };
        }
        break;
      }
      case 'PERCENT': {
        if (format !== '') {
          fieldMask = {
            ...this.parseNumberMask(format),
            suffix: '%',
            ...mask,
          };
        } else {
          fieldMask = {
            suffix: '%',
            ...mask,
          };
        }
        break;
      }
      case 'DOUBLE': {
        fieldMask = {
          mask: 'separator',
          thousandSeparator: ',',
        };
        break;
      }
      case 'NUMBER': {
        if (format !== '') {
          fieldMask = {
            thousandSeparator: ',',
            ...this.parseNumberMask(format),
            ...mask,
          };
        } else {
          fieldMask = {
            mask: 'separator',
            thousandSeparator: ',',
            allowNegativeNumbers: true,
            ...mask,
          };
        }
        break;
      }
      case 'SMALL_INT': {
        fieldMask = {
          mask: 'separator.0',
          thousandSeparator: ',',
          allowNegativeNumbers: true,
          ...mask,
        };
        break;
      }
      case 'INTEGER': {
        fieldMask = {
          mask: 'separator.0',
          thousandSeparator: ',',
          allowNegativeNumbers: true,
          ...mask,
        };
        break;
      }
      default: {
        break;
      }
    }

    return fieldMask;
  }

  parseNumberMask(format) {
    format = format.trim();
    const hasDecimal = format.includes('.');
    const decimalPlaces = hasDecimal ? format.split('.')[1].length : 0;

    const decimalMarker = hasDecimal ? '.' : '';

    return {
      mask: hasDecimal
        ? `separator${decimalMarker}${decimalPlaces}`
        : 'separator.0',
      thousandSeparator: format.includes(',') ? ',' : '',
      allowNegativeNumbers: true,
      dropSpecialCharacters: true,
    };
  }
}

/**
 * Pipe to evaluate whether a field is required based on a string value,
 * typically used when the input is "yes" or "no" in string format.
 * Helps keep the component lean by avoiding extra logic in templates.
 *
 * @export
 * @class IsFieldRequiredPipe
 * @implements {PipeTransform}
 */
@Pipe({
  name: 'isFieldRequired',
  standalone: true,
})
export class IsFieldRequiredPipe implements PipeTransform {
  transform(isRequired: string | null | undefined): boolean {
    return isRequired?.toLowerCase() === 'yes';
  }
}
