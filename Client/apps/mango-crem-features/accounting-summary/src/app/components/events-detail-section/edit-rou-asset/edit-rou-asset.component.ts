import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ButtonModule,
  CremFormsModule,
  CremToastService,
  DatePickerModule,
  DropdownModule,
  InputComponent,
  InputLabelComponent,
  LibUiElementsModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import { Toast } from 'ngx-toastr';
import { Subject, Subscription } from 'rxjs';
import { AddEditScheduleService } from '@accounting-summary/services/add-edit-schedule.service';
import { ROUAssetMethod } from '@accounting-summary/models/common-dropdowns.model';
import { ToastState } from '@mango/data-models/lib-data-models';
import { takeUntil } from 'rxjs/operators';
import { DxTooltipModule } from 'devextreme-angular';

@Component({
  selector: 'mango-edit-rou-asset',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ModalModule,
    DropdownModule,
    LibUiElementsModule,
    InputComponent,
    InputLabelComponent,
    ReactiveFormsModule,
    Toast,
    FormsModule,
    CremFormsModule,
    DatePickerModule,
    DxTooltipModule,
  ],
  templateUrl: './edit-rou-asset.component.html',
  styleUrls: ['./edit-rou-asset.component.scss'],
})
export class EditRouAssetComponent implements OnInit, OnDestroy {
  minROUActionDate: any;
  componentName = 'edit-rou-asset';
  selectedROUMethod: number;
  editROUAssetForm: FormGroup;
  rouAssetMethods: ROUAssetMethod;
  dateFormat: string;
  isSaveDisabled: boolean;
  isObtainedDateValid = true;
  eventRoutAssetData: any;
  isTooltipVisible = false;
  disabledButtonReason: string;
  initialDirectEntrySelected = true;
  private subscription$ = new Subscription();
  private formSubscription$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<EditRouAssetComponent>,
    public accountingSummaryService: AccountingSummaryService,
    public addEditScheduleService: AddEditScheduleService,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public accountingEventROUAssetData: any,
    private toastService: CremToastService
  ) {
    this.getROUAssetMethods();
  }

  ngOnInit(): void {
    this.eventRoutAssetData =
      this.accountingEventROUAssetData.eventRoutAssetData;
    this.dateFormat = this.eventRoutAssetData.dateFormat;
    this.selectedROUMethod = this.eventRoutAssetData.rouAssetMethodID;
    this.initializeEditROUAssetForm();
    this.obtainedDateValidation();
    this.formValidations();
  }

  initializeEditROUAssetForm() {
    this.editROUAssetForm = this.fb.group({
      RouAssetMethod: [
        this.eventRoutAssetData.rouAssetMethodID,
        Validators.required,
      ],
      ROUAssetAmount: [
        {
          value: this.eventRoutAssetData.rouAssetObtainedAmount,
          disabled: true,
        },
        Validators.required,
      ],
      ROUAssetObtainedDate: [
        this.eventRoutAssetData.rouAssetObtainedDate,
        Validators.required,
      ],
    });
  }

  formValidations() {
    this.editROUAssetForm.valueChanges
      .pipe(takeUntil(this.formSubscription$))
      .subscribe((formChanges) => {
        const ROUAssetAmount =
          this.editROUAssetForm.get('ROUAssetAmount').value;
        if (
          this.editROUAssetForm.valid &&
          this.isObtainedDateValid &&
          (ROUAssetAmount || ROUAssetAmount === 0)
        ) {
          this.isSaveDisabled = false;
        } else if (this.isObtainedDateValid) {
          this.isSaveDisabled = true;
          this.disabledButtonReason = 'Please fill the required fields';
        }
      });
  }

  obtainedDateValidation() {
    this.editROUAssetForm
      .get('ROUAssetObtainedDate')
      .valueChanges.pipe(takeUntil(this.formSubscription$))
      .subscribe((ROUAssetObtainedDateValue) => {
        const beginDate = new Date(this.eventRoutAssetData.beginDate);
        const endDate = new Date(this.eventRoutAssetData.endDate);
        const minDate = new Date(this.eventRoutAssetData.minROUActionDate);
        const measureEvent = this.eventRoutAssetData.measureEvent;
        const ROUAssetObtainedDate = new Date(ROUAssetObtainedDateValue);
        if (measureEvent === 'Initial' && ROUAssetObtainedDate > endDate) {
          this.disabledButtonReason =
            'Obtained date must be less than or equal to end date';
          this.isSaveDisabled = true;
          this.isObtainedDateValid = false;
        } else if (
          measureEvent !== 'Initial' &&
          (ROUAssetObtainedDate < minDate || ROUAssetObtainedDate > endDate)
        ) {
          this.disabledButtonReason =
            'Obtained date cannot be less than initial term begin date or greater than term end date';
          this.isSaveDisabled = true;
          this.isObtainedDateValid = false;
        } else {
          this.isSaveDisabled = false;
          this.isObtainedDateValid = true;
        }
      });
  }

  ngOnDestroy(): void {
    this.subscription$.unsubscribe();
    this.formSubscription$.next();
    this.formSubscription$.complete();
  }

  onRouAssetMethodChange(event) {
    this.editROUAssetForm.get('ROUAssetAmount').disable();
    let methodTypeID = event[0].id;

    if (this.initialDirectEntrySelected) {
      this.editROUAssetForm
        .get('ROUAssetAmount')
        .setValue(this.eventRoutAssetData.rouAssetObtainedAmount);
      this.initialDirectEntrySelected = false;
    } else {
      this.editROUAssetForm.get('ROUAssetAmount').setValue(null);
    }

    switch (methodTypeID) {
      case 1:
        methodTypeID = 1; //Direct Entry
        this.editROUAssetForm.get('ROUAssetAmount').enable();

        break;
      case 2:
        methodTypeID = 2; //Opening Asset Balance
        this.editROUAssetForm
          .get('ROUAssetAmount')
          .setValue(this.eventRoutAssetData.openingAssetBalance ?? 0);
        break;
      case 3:
        methodTypeID = 3; //System Asset Adjustment
        this.editROUAssetForm
          .get('ROUAssetAmount')
          .setValue(this.eventRoutAssetData.systemAssetAdjustment ?? 0);
        break;
      case 4:
        methodTypeID = 4; //Manual Asset Adjustment
        this.editROUAssetForm
          .get('ROUAssetAmount')
          .setValue(this.eventRoutAssetData.manualAssetAdjustment ?? 0);
        break;
      case 5:
        methodTypeID = 5; //Total Asset Adjustment
        this.editROUAssetForm
          .get('ROUAssetAmount')
          .setValue(this.eventRoutAssetData.adjustment ?? 0);
        break;
      case 6:
        methodTypeID = 6; //Prior Value
        this.editROUAssetForm
          .get('ROUAssetAmount')
          .setValue(this.eventRoutAssetData.rouAssetPriorAmount ?? 0);
        break;
      case 7:
        methodTypeID = 7; //Zero
        this.editROUAssetForm.get('ROUAssetAmount').setValue(0);
        break;
    }
  }

  private getROUAssetMethods() {
    this.subscription$.add(
      this.addEditScheduleService
        .getCommonDropdowns()
        .subscribe((response: any) => {
          if (response.success) {
            const measureEvent = this.eventRoutAssetData.measureEvent;
            if (measureEvent === 'Initial') {
              this.rouAssetMethods = response.data.rouAssetMethods.filter(
                (methods) => !methods.isInitialExempt
              );
            } else if (measureEvent === 'Impairment') {
              this.rouAssetMethods = response.data.rouAssetMethods.filter(
                (methods) => methods.id === 1 || methods.id === 7
              );
            } else {
              this.rouAssetMethods = response.data.rouAssetMethods;
            }
          } else if (response === null) {
            this.accountingSummaryService.displayContactSystemAdminMessage();
          } else {
            this.toastService.show(
              response.clientErrorMessage,
              'Error',
              ToastState.ERROR
            );
          }
        })
    );
  }

  onMouseEnter() {
    if (this.isSaveDisabled) {
      this.isTooltipVisible = true;
    }
  }

  onMouseLeave() {
    this.isTooltipVisible = false;
  }

  closeModal(ROUAssetSavedData) {
    this.dialogRef.close(ROUAssetSavedData);
  }

  private saveROUAssetObtained() {
    const scheduleId = this.eventRoutAssetData.scheduleId;
    const rouAssetMethodId =
      this.editROUAssetForm.get('RouAssetMethod').value[0];
    const rouAssetObtainedAmount =
      this.editROUAssetForm.get('ROUAssetAmount').value;
    const rouAssetObtainedDate = this.editROUAssetForm.get(
      'ROUAssetObtainedDate'
    ).value;

    this.subscription$.add(
      this.addEditScheduleService
        .saveROUAssetObtained(
          scheduleId,
          rouAssetMethodId,
          rouAssetObtainedAmount,
          rouAssetObtainedDate
        )
        .subscribe((response: any) => {
          if (response.success) {
            this.closeModal(response);
          } else if (response === null) {
            this.accountingSummaryService.displayContactSystemAdminMessage();
          } else {
            this.toastService.show(
              response.clientErrorMessage,
              'Error',
              ToastState.ERROR
            );
          }
        })
    );
  }

  saveRouAssetObtained() {
    this.saveROUAssetObtained();
  }
}
