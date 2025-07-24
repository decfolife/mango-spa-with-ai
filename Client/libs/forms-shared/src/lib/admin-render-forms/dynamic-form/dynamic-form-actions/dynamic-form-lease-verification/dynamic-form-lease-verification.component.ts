import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ButtonModule,
  CremToastService,
  DropdownModule,
  InputComponent,
  InputHintComponent,
  InputLabelComponent,
  LibUiElementsModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { Subscription } from 'rxjs';
import { DynamicFormsService } from '@forms/services/dynamic-forms.service';
import { ToastState } from '@mango/data-models/lib-data-models';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiResponse } from '@mango/data-models/lib-data-models';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { DynamicFormsFacade } from '@forms/+state/dynamic-forms.facade';
import {
  UpdateLeaseVerificationStatusRequest,
  WorkFlowStatus,
} from '@forms/model/dynamic-forms.interface';

@Component({
  selector: 'mango-dynamic-form-lease-verification',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ModalModule,
    DropdownModule,
    LibUiElementsModule,
    InputComponent,
    InputLabelComponent,
    DropdownModule,
    InputHintComponent,
  ],
  templateUrl: './dynamic-form-lease-verification.component.html',
  styleUrls: ['./dynamic-form-lease-verification.component.scss'],
})
export class DynamicFormLeaseVerificationComponent
  implements OnInit, OnDestroy
{
  saveClicked: true;
  componentName = 'lease-verification';
  workFlowStatus: WorkFlowStatus[] = [];
  leaseVerificationFormData: any;
  selectedWorkflowStatus: number;
  comment: string;
  oldStatus: number;
  isLeaseVerificationCommentsRequired = true;
  isUpdateButtonDisabled: boolean;
  isUpdateButtonClicked: boolean;

  private subscription: Subscription[] = [];

  constructor(
    private dynamicFormService: DynamicFormsService,
    private dynamicFormsFacade: DynamicFormsFacade,
    private toastService: CremToastService,
    private appFacade: MangoAppFacade,
    public dialogRef: MatDialogRef<DynamicFormLeaseVerificationComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      formId: number;
      objectId: number;
      objectTypeId: number;
      objectTypeTypeId: number;
      parentObjectId: number;
      parentObjectTypeId: number;
    }
  ) {}

  ngOnInit(): void {
    this.getLeaseVerificationStatuses();
    this.subscription.push(
      this.appFacade.clientInfo$.subscribe((info) => {
        this.isLeaseVerificationCommentsRequired =
          info.isLeaseVerificationCommentsRequired;
      })
    );

    this.subscription.push(
      this.dynamicFormsFacade.selectRenderFormData$.subscribe(
        (selectRenderFormData) => {
          this.oldStatus = +selectRenderFormData[0].formItemAnswer;
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => sub.unsubscribe());
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

  onSelectedStatus(event) {
    this.selectedWorkflowStatus = event[0].wfsID;
    this.ValidateLeaseVerificationStatusRequiredFields();
  }

  onCommentsValueChange(event) {
    this.comment = event;
  }

  updateStatus() {
    this.isUpdateButtonDisabled = true;
    this.isUpdateButtonClicked = true;

    const leaseVerificationObject = {
      objectID: this.data.objectId,
      objectTypeID: this.data.objectTypeId,
      status: this.selectedWorkflowStatus,
      oldStatus: this.oldStatus,
      comments: this.comment,
    };

    if (!this.selectedWorkflowStatus) {
      this.toastService.show(
        'A status is required to proceed with the update.',
        'Error',
        ToastState.ERROR,
        {
          position: 'bottom right',
          maxWidth: '500px',
        }
      );
      this.isUpdateButtonDisabled = false;
      this.isUpdateButtonClicked = false;
    } else if (this.isLeaseVerificationCommentsRequired && !this.comment) {
      this.toastService.show(
        'A comment is required to update the lease verification status.',
        'Error',
        ToastState.ERROR,
        {
          position: 'bottom right',
          maxWidth: '500px',
        }
      );
      this.isUpdateButtonDisabled = false;
      this.isUpdateButtonClicked = false;
    } else {
      this.updateLeaseVerificationStatus(leaseVerificationObject);
    }
  }

  getLeaseVerificationStatuses() {
    this.subscription.push(
      this.dynamicFormService
        .getLeaseVerificationStatuses(
          this.data.objectId,
          this.data.objectTypeId,
          this.data.objectTypeTypeId
        )
        .subscribe((res: ApiResponse) => {
          if (res && res.success) {
            this.workFlowStatus = res.data;
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

  ValidateLeaseVerificationStatusRequiredFields() {
    this.subscription.push(
      this.dynamicFormService
        .validateLeaseVerificationStatusRequiredFields(
          this.data.formId,
          this.data.objectId,
          this.data.objectTypeId,
          this.selectedWorkflowStatus
        )
        .subscribe((res: ApiResponse) => {
          if (res && res.success) {
            this.leaseVerificationFormData = res.data;
            this.isUpdateButtonDisabled =
              res.data.length !== 0 ||
              this.oldStatus === this.selectedWorkflowStatus
                ? true
                : false;
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

  updateLeaseVerificationStatus(
    leaseVerificationStatus: UpdateLeaseVerificationStatusRequest
  ) {
    this.subscription.push(
      this.dynamicFormService
        .updateLeaseVerificationStatus(leaseVerificationStatus)
        .subscribe((res) => {
          if (res && res.success) {
            this.toastService.show(
              'Lease verification status updated successfully.',
              'Success',
              ToastState.SUCCESS,
              {
                position: 'bottom right',
                maxWidth: '500px',
              }
            );
            this.dialogRef.close(res.success);
            this.isUpdateButtonDisabled = false;
            this.isUpdateButtonClicked = false;
          } else {
            this.toastService.show(
              'Lease verification status failed to update successfully, please try again or contact support.',
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
}
