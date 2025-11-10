import { Injectable } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';

@Injectable()
export class FieldsControlService {
  createFormControl(
    value: any,
    validators: ValidatorFn[] = [],
    updateOn: 'change' | 'blur' | 'submit' = 'change'
  ): FormControl {
    return new FormControl(
      { value: value, disabled: false },
      { validators: validators, updateOn: updateOn }
    );
  }

  toFormGroup(fields, editMode: boolean) {
    const group: any = {};

    fields.forEach((field) => {
      let formControl: FormControl;
      // Array to hold the conditional validators based on the question properties
      const conditionalValidators: ValidatorFn[] = [];

      if (field.formItemTypeID == '16') {
        conditionalValidators.push(
          Validators.pattern(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
        );
      }

      if ((['2','3','10','11','14','15','16',].some((typeId) => field.formItemTypeID === typeId))
      ) {
        conditionalValidators.push(
          Validators.pattern(/^(?!.*(<.*|javascript:|eval\(|alert\(|document\.|window\.)).*$/)
        );
      }

      // Check and add required validator if necessary
      if (field.formItemMandatory == '1') {
        conditionalValidators.push(Validators.required);
      }

      // Check and add min validator if necessary
      if (field.formItemMinValue && Number(field.formItemMinValue) > 0) {
        conditionalValidators.push(
          Validators.min(Number(field.formItemMinValue))
        );
      }

      // Check and add max validator if necessary
      if (field.formItemMaxValue && Number(field.formItemMaxValue) > 0) {
        conditionalValidators.push(
          Validators.max(Number(field.formItemMaxValue))
        );
      }

      // Check and add maxLength validator if necessary
      // This check should not be added to dropdowns
      if (
        field.formItemMaximumLength &&
        Number(field.formItemMaximumLength) > 0 &&
        field.formItemTypeID != '1' &&
        field.formItemTypeID != '13' &&
        field.formItemTypeID != '18'
      ) {
        conditionalValidators.push(
          Validators.maxLength(Number(field.formItemMaximumLength))
        );
      }

      // Create the form control with conditional validators
      // eslint-disable-next-line prefer-const
      formControl = this.createFormControl(
        field.formItemAnswer,
        conditionalValidators
      );

      // Check if readonly
      if (field.formItemViewOnly == 'True') {
        formControl.disable();
      }

      // Assign the form control to the group
      group[field.formItemID] = formControl;
    });

    return new FormGroup(group);
  }
}
