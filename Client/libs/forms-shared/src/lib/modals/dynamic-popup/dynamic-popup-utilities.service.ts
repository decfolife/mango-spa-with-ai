import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';
import { GetFieldTypePipe } from './dynamic-form-field.pipe';

@Injectable()
export class DynamicPopupUtilitiesService {
  constructor(private getFieldTypePipe: GetFieldTypePipe) {}

  /**
   * Retrieves role dropdown display data to maintain compatibility between V06 and Dynamic Popup.
   *
   * @description
   * In V06, Roles are saved by Value (RoleName) instead of Key (RoleId).
   * However, in Dynamic Popup, Roles were saved by RoleId, causing:
   * - Roles added from V06 not populating in Dynamic Popup
   * - Roles added from Dynamic Popup displaying Key (RoleId) and failing in V06
   *
   * This function resolves the issue with existing records by converting between the two formats.
   * Going forward, new Roles will be saved by RoleName to keep in sync with V06.
   *
   * @param {any} formItemId - The form item identifier used to locate role data
   * @param {any} value - The role value to search for in the display field
   * @returns {Promise<string>} The corresponding display data value, or empty string if not found
   *
   * @example
   * // Get display data for a specific role
   * const displayData = await getRoleDropDownDisplayData('role_dropdown_1', 'Administrator');
   *
   * @since Added to resolve V06 and Dynamic Popup role synchronization issues
   */
  async getRoleDropDownDisplayData(widgetDetails, formItemId: any, value: any) {
    let displayData = '';
    if (
      widgetDetails[1].data[formItemId].filter((d) => d.display === value)
        .length > 0
    ) {
      const itm = widgetDetails[1].data[formItemId].filter(
        (d) => d.display === value
      );
      displayData = itm[0].value;
    }
    return displayData;
  }

  /**
   *
   * @param {number} number
   * @param {number} [precision=2 as number]
   * @param {string} [decimalPoint='.' as string]
   * @param {string} [thousandsSeparator=',' as string]
   * @return {*}
   * @memberof DynamicPopupUtilitiesService
   */
  localFormat(
    number: number,
    precision = 2 as number,
    decimalPoint = '.' as string,
    thousandsSeparator = ',' as string
  ) {
    let isNegative = false;

    if (number < 0) {
      isNegative = true;
      number *= -1;
    }

    const toFixedFix = function (num, decimals) {
      const k = Math.pow(10, decimals);

      return '' + Math.round(num * k) / k;
    };

    const stringParts = (
      precision ? toFixedFix(number, precision) : '' + Math.round(number)
    ).split('.');

    if ((stringParts[1] || '').length < precision) {
      stringParts[1] = stringParts[1] || '';
      stringParts[1] += new Array(precision - stringParts[1].length + 1).join(
        '0'
      );
    }

    // trim whitespace
    if (stringParts[1]) {
      stringParts[1] = stringParts[1].replace(/\s+/g, '');

      while (stringParts[1].length < 2) {
        stringParts[1] += '0';
      }
    }

    let formatted =
      precision === 0 ? stringParts[0] : stringParts.join(decimalPoint);

    if (isNegative) {
      formatted = '(' + formatted + ')';
    }

    return formatted;
  }

  /**
   * Generate short string summary of form validation errors
   *
   * @param {Record<string, any>} errors
   * @return {string[]} List of error messages
   */
  getValidationErrorMessages(errors: Record<string, any>): string[] {
    const messages: string[] = [];

    Object.entries(errors).forEach(([field, fieldErrors]) => {
      Object.keys(fieldErrors || {}).forEach((errorKey) => {
        let message = '';
        const fieldName: string = this.formatFieldName(field);

        switch (errorKey) {
          case 'required':
            message = `${fieldName} is required.`;
            break;
          case 'email':
            message = `${fieldName} must be a valid email.`;
            break;
          case 'minlength':
            message = `${fieldName} must be at least ${fieldErrors[errorKey].requiredLength} characters.`;
            break;
          case 'maxlength':
            message = `${fieldName} must be no more than ${fieldErrors[errorKey].requiredLength} characters.`;
            break;
          case 'pattern':
            message = `${fieldName} format is invalid.`;
            break;
          default:
            message = `${fieldName} is invalid.`;
        }

        messages.push(message);
      });
    });

    return messages;
  }

  /**
   * Get List of Validation errors
   *
   * @param {FormGroup} form
   * @return {*}  {Record<string, any>}
   * @memberof DynamicPopupComponent
   */
  getFormValidationErrors(form: FormGroup): Record<string, any> {
    const errors: Record<string, any> = {};
    Object.entries(form.controls).forEach(([key, control]) => {
      if (control.invalid) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/[_-]/g, ' ') // Replace underscores/hyphens with space
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim() // Trim whitespace
      .replace(/^./, (s) => s.toUpperCase()); // Capitalize first letter
  }

  /**
   * Angular's Validators.email is very permissive which allows non-TLD emails.
   * Stricter regex is required.
   *
   * @param {AbstractControl} control
   * @return {*}  {(ValidationErrors | null)}
   * @memberof DynamicPopupComponent
   */
  strictEmailValidator(control: AbstractControl): ValidationErrors | null {
    const strictEmailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    const value = control.value;
    if (!value || strictEmailRegex.test(value)) {
      return null;
    }
    return { email: true };
  }

  /**
   * Workaround: The `dropSpecialCharacters` option in ngx-mask does not appear
   * to unmask the data as expected. This method manually unmasks fields
   * (e.g., numbers) using `maskService.removeMask()`.
   */
  unMaskFields(formItems: any[], popupData: any[]): any[] {
    const newFormItems = formItems.map((item, i) => {
      const popupItem = popupData.filter(
        (e) => item.formItemId === e.formItemID
      )[0];
      const { formItemTypeID } = popupItem.formItemType;
      const { dataTypeID, formItemLabel } = popupItem.formItemSectionDetail;

      const fieldType = this.getFieldTypePipe.transform(
        formItemTypeID,
        dataTypeID,
        formItemLabel
      );

      switch (fieldType) {
        case 'CURRENCY':
        case 'NUMBER': {
          return {
            ...item,
            newValue: this.unmaskDecimal(formItems[i].newValue),
            fieldType: fieldType,
          };
        }
        default: {
          return { ...item };
        }
      }
    });

    return newFormItems;
  }

  /**
   *
   */
  unmaskDecimal(value: string): string {
    return value.replace(/,/g, '');
  }
}
