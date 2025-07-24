import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ButtonModule,
  CremPopupComponent,
  CremToastService,
  DropdownModule,
  IconModule,
  InputLabelComponent,
  LibUiElementsModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { DxDataGridModule, DxListModule } from 'devextreme-angular';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DataTypeLabel } from '@forms/model/enums/data-types-label.enum';
import { ToastState } from '@mango/data-models/lib-data-models';
import { DynamicFormsService } from '@forms/services/dynamic-forms.service';
import { MangoDialogService } from 'libs/core-shared/src/lib/services/mango-dialog.service';
import {
  BehaviorLookup,
  Behaviors,
  BehaviorType,
  FormItemsLookup,
} from '@forms/model/behaviors.interface';
import { Subscription } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'mango-dynamic-form-behaviors',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ModalModule,
    DropdownModule,
    LibUiElementsModule,
    InputLabelComponent,
    ReactiveFormsModule,
    DxDataGridModule,
    DxListModule,
    IconModule,
    CremPopupComponent,
  ],
  templateUrl: './dynamic-form-behaviors.component.html',
  styleUrls: ['./dynamic-form-behaviors.component.scss'],
})
export class DynamicFormBehaviorsComponent implements OnInit, OnDestroy {
  componentName = 'form-behaviors';
  behaviorsFormGroup: FormGroup;
  private subscription: Subscription[] = [];
  formID: number;
  formSectionID: number;

  showInputs = false;
  showInput1;
  showInput2 = false;
  showRequestType = false;
  showOutput = false;
  behaviorEditMode = false;

  behaviorTypes: BehaviorType[];
  behaviorLookups: BehaviorLookup[];
  behaviorsGridData: Behaviors[];
  formItemInputsLookup: FormItemsLookup[];
  filteredFormItemInputsLookup1: FormItemsLookup[];
  filteredFormItemInputsLookup2: FormItemsLookup[];
  formItemOutputLookup: FormItemsLookup[];
  selectedBehavior: any;
  modalTitle = 'Behaviors';
  showConfirmationPopup = false;
  continueToEdit: boolean;
  doesOutputExist: boolean;
  isInitialLoad = true;

  constructor(
    public dialogRef: MatDialogRef<DynamicFormBehaviorsComponent>,
    private fb: FormBuilder,
    private toastService: CremToastService,
    private dynamicFormService: DynamicFormsService,
    private dialogService: MangoDialogService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      renderFormData: any;
      formID: number;
      formSectionID: number;
    }
  ) {}

  ngOnInit(): void {
    this.formID = this.data?.formID;
    this.formSectionID = this.data?.formSectionID;
    this.initializeForm();
    this.populateDropdowns();
    this.getBehaviorConfigs();
    this.getBehaviors();
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => sub.unsubscribe());
  }

  private initializeForm(): void {
    this.behaviorsFormGroup = this.fb.group({
      behaviorType: new FormControl(null, Validators.required),
      formItemInput1: new FormControl(null),
      formItemInput2: new FormControl(null),
      requestType: new FormControl(null),
      formItemOutput: new FormControl(null, Validators.required),
    });
  }

  populateDropdowns() {
    this.formItemInputsLookup = this.data?.renderFormData.map((item) => ({
      formItemID: +item.formItemID,
      formItemTypeID: +item.formItemTypeID,
      dataTypeID: +item.dataTypeID,
      displayName: `${item.formItemLabel} - ${this.getDataTypeDisplayName(
        item.dataTypeID
      )}`,
    }));
  }

  editBehavior(data) {
    const formControlsHasValue = [
      'behaviorType',
      'formItemInput1',
      'requestType',
      'formItemInput2',
      'formItemOutput',
    ].some((formControl) => {
      const value = this.getDropdownValue(
        this.behaviorsFormGroup.get(formControl)?.value
      );
      return value;
    });

    formControlsHasValue
      ? (this.showConfirmationPopup = true)
      : (this.showConfirmationPopup = false);

    this.selectedBehavior = data;

    if (this.continueToEdit || this.isInitialLoad) {
      this.behaviorEditMode = true;
      this.updateModalTitle();
      this.behaviorsFormGroup
        ?.get('behaviorType')
        .setValue(this.selectedBehavior?.behaviorTypeID ?? null);

      setTimeout(() => {
        this.behaviorsFormGroup
          ?.get('formItemInput1')
          .setValue(this.selectedBehavior?.formItemInput1ID ?? null);

        this.behaviorsFormGroup
          ?.get('formItemInput2')
          .setValue(this.selectedBehavior?.formItemInput2ID ?? null);

        this.behaviorsFormGroup
          ?.get('requestType')
          .patchValue(this.selectedBehavior?.behaviorLookupID ?? null);

        this.behaviorsFormGroup
          ?.get('formItemOutput')
          .setValue(this.selectedBehavior?.formItemOutputID ?? null);
      }, 0);
    } else {
      return;
    }
  }

  getDataTypeDisplayName(id: number): string {
    return DataTypeLabel[id] || 'Unknown';
  }

  getId(
    componentName: string,
    uniqueName: string,
    elementType: string,
    componentType?: string
  ) {
    return componentType
      ? `${componentName}-${componentType}-${uniqueName}-${elementType}`
      : `${componentName}-${uniqueName}-${elementType}`;
  }

  onBehaviorSelected(event) {
    this.updateModalTitle();
    const behaviorType = event[0].id;
    this.continueToEdit = false;
    this.isInitialLoad = false;

    // Filters the Output dropdown to show only date values when "SetCompletedDate" behavior is selected.
    if (behaviorType === 10) {
      this.filteredFormItemInputsLookup1 = this.formItemInputsLookup.filter(
        (formItem) => formItem.formItemID == 50457
      );
      this.formItemOutputLookup = this.formItemInputsLookup?.filter(
        (item) => item.dataTypeID === 7
      );
    } else if (behaviorType == 13) {
      this.filteredFormItemInputsLookup1 = this.formItemInputsLookup?.filter(
        (item) => item.dataTypeID === 7
      );
      this.filteredFormItemInputsLookup2 = this.filteredFormItemInputsLookup1;
      this.formItemOutputLookup = this.formItemInputsLookup?.filter(
        (item) =>
          item.formItemTypeID === 2 && [200, 201, 202].includes(item.dataTypeID)
      );
    } else {
      this.filteredFormItemInputsLookup1 = this.formItemInputsLookup;
      this.filteredFormItemInputsLookup2 = this.formItemInputsLookup;
      this.formItemOutputLookup = this.formItemInputsLookup;
    }

    // Define behavior configurations
    const behaviorConfig = {
      // Difference
      2: {
        showInput1: true,
        showInput2: true,
        showRequestType: false,
        showOutput: true,
        validators: { input1: true, input2: true, requestType: false },
      },
      // SetCompletedDate
      10: {
        showInput1: true,
        showInput2: false,
        showRequestType: false,
        showOutput: true,
        validators: { input1: false, input2: false, requestType: false },
      },
      // CallToogleTextList
      11: {
        showInput1: true,
        showInput2: false,
        showRequestType: true,
        showOutput: true,
        validators: { input1: true, input2: false, requestType: true },
      },
      // DisplayNewItems
      12: {
        showInput1: true,
        showInput2: false,
        showRequestType: true,
        showOutput: true,
        validators: { input1: true, input2: false, requestType: true },
      },
      // CalcDateDifference
      13: {
        showInput1: true,
        showInput2: true,
        showRequestType: false,
        showOutput: true,
        validators: { input1: true, input2: true, requestType: false },
      },
    };

    // Default config if no behavior matches
    const config = behaviorConfig[behaviorType] || {
      showInput1: false,
      showInput2: false,
      showRequestType: false,
      showOutput: false,
      validators: { input1: false, input2: false, requestType: false },
    };

    // Reset form and apply visibility settings
    if (!this.behaviorEditMode) {
      this.resetForm();
    }
    this.showInput1 = config.showInput1;
    this.showInput2 = config.showInput2;
    this.showRequestType = config.showRequestType;
    this.showOutput = config.showOutput;

    // Apply validators based on the config
    this.setValidators('formItemInput1', config.validators.input1);
    this.setValidators('formItemInput2', config.validators.input2);
    this.setValidators('requestType', config.validators.requestType);
  }

  private setValidators(controlName: string, isRequired: boolean) {
    const control = this.behaviorsFormGroup.get(controlName);
    if (isRequired) {
      control?.setValidators(Validators.required);
    } else {
      control?.clearValidators();
    }
    control?.updateValueAndValidity();
  }

  resetForm() {
    Object.keys(this.behaviorsFormGroup.controls).forEach((key) => {
      if (key !== 'behaviorType') {
        this.behaviorsFormGroup.get(key)?.reset();
      }
    });
  }

  close() {
    this.dialogRef.close('');
  }

  updateModalTitle() {
    return (this.modalTitle = this.behaviorEditMode
      ? (this.modalTitle = 'Edit Behavior')
      : (this.modalTitle = 'Add Behavior'));
  }

  continueEditing() {
    this.continueToEdit = false;
    this.showConfirmationPopup = !this.showConfirmationPopup;
  }

  discardEditing() {
    this.continueToEdit = true;
    this.isInitialLoad = false;
    this.editBehavior(this.selectedBehavior);
    this.showConfirmationPopup = !this.showConfirmationPopup;
  }

  getDropdownValue(val: any) {
    return Array.isArray(val) ? val[0] : val ?? null;
  }

  getBehaviorConfigs() {
    this.subscription.push(
      this.dynamicFormService.getBehaviorConfigs().subscribe((response) => {
        if (response.success) {
          this.behaviorTypes = response.data.behaviorTypes
            .filter((behaviorType) => behaviorType.isActive)
            .sort((a, b) => a.behavior.localeCompare(b.behavior));

          this.behaviorLookups = response.data.behaviorLookups
            .filter((requestType) => requestType.isActive)
            .sort((a, b) => a.requestTypeName.localeCompare(b.requestTypeName));
        } else {
          this.toastService.show(
            'An error occurred. If the problem persists, please contact support.',
            'Error',
            ToastState.ERROR,
            {
              position: 'bottom right',
              maxWidth: '500px',
            }
          );
        }
      })
    );
  }

  getBehaviors() {
    this.subscription.push(
      this.dynamicFormService
        .getBehaviors(this.formSectionID, this.formID)
        .subscribe((response) => {
          if (response.success) {
            this.behaviorsGridData = response.data;
          } else {
            this.toastService.show(
              'An error occurred. If the problem persists, please contact support.',
              'Error',
              ToastState.ERROR,
              {
                position: 'bottom right',
                maxWidth: '500px',
              }
            );
          }
        })
    );
  }

  saveBehavior() {
    const behaviorObject = {
      ID: this.selectedBehavior?.id ?? null,
      FormID: this.formID,
      FormSectionID: this.formSectionID,
      BehaviorTypeID: this.getDropdownValue(
        this.behaviorsFormGroup?.value.behaviorType
      ),
      BehaviorLookupID: this.getDropdownValue(
        this.behaviorsFormGroup?.value.requestType
      ),
      FormItemInput1ID: this.getDropdownValue(
        this.behaviorsFormGroup?.value.formItemInput1
      ),
      FormItemInput2ID: this.getDropdownValue(
        this.behaviorsFormGroup?.value.formItemInput2
      ),
      FormItemOutputID: this.getDropdownValue(
        this.behaviorsFormGroup?.value.formItemOutput
      ),
    };

    this.doesOutputExist = this.behaviorsGridData.some(
      (output) =>
        output.formItemOutputID === behaviorObject.FormItemOutputID &&
        output.formItemOutputID !== this.selectedBehavior?.formItemOutputID
    );

    if (this.doesOutputExist) {
      this.toastService.show(
        'This output already exists. Please select another or edit existing output.',
        'Error',
        ToastState.ERROR,
        {
          position: 'bottom right',
          maxWidth: '500px',
        }
      );
      return;
    }

    if (this.behaviorsFormGroup.touched && this.behaviorsFormGroup.valid) {
      this.dynamicFormService
        .saveFormBehavior(behaviorObject)
        .subscribe((result) => {
          if (result && result.success) {
            this.behaviorsGridData = result.data;
            {
              this.toastService.show(
                'Behavior saved successfully.',
                'Success',
                ToastState.SUCCESS,
                {
                  position: 'bottom right',
                  maxWidth: '500px',
                }
              );
            }
          } else {
            this.toastService.show(
              'An error occurred while saving behavior. If the problem persists, please contact support.',
              'Error',
              ToastState.ERROR,
              {
                position: 'bottom right',
                maxWidth: '500px',
              }
            );
          }
        });
    } else {
      this.toastService.show(
        'Please fill out the required field(s).',
        'Error',
        ToastState.ERROR,
        {
          position: 'bottom right',
          maxWidth: '500px',
        }
      );
    }
  }

  saveAndNew() {
    this.saveBehavior();
    if (this.behaviorsFormGroup.valid) {
      this.resetForm();
    } else {
      return;
    }
  }

  save() {
    this.saveBehavior();
    if (this.behaviorsFormGroup.valid) {
      this.close();
    } else {
      return;
    }
  }

  deleteBehavior(event) {
    let confirmText = 'Are you sure you want to delete this behavior?';
    this.subscription.push(
      this.dialogService
        .confirm('Delete Behavior', confirmText, 'Continue', 'Cancel')
        .pipe(
          filter((confirmed) => !!confirmed),
          switchMap((_) =>
            this.dynamicFormService.deleteFormBehavior(event.data.id)
          ),
          tap((result) => {
            if (result && result.success) {
              this.behaviorsGridData = result.data;
              this.toastService.show(
                'Behavior deleted successfully.',
                'Success',
                ToastState.SUCCESS,
                {
                  position: 'bottom right',
                  maxWidth: '500px',
                }
              );
            } else {
              this.toastService.show(
                'An error occurred. If the problem persists, please contact support.',
                'Error',
                ToastState.ERROR,
                {
                  position: 'bottom right',
                  maxWidth: '500px',
                }
              );
            }
          })
        )
        .subscribe()
    );
  }
}
