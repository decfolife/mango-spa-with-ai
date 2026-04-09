import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DataService } from '@mango/core-shared';
import { ToastState, VALIDATION_ERROR } from '@mango/data-models/lib-data-models';
import { CremToastService } from '@mango/ui-shared/lib-ui-elements';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { FormWizardService } from '@micro-components/services/form-wizard.service';
import { DashboardService } from '@project-dashboard/services/dashboard.service';
import { AddLeaseModalComponent } from '../add-lease-modal/add-lease-modal.component';

@Component({
  selector: 'mango-add-ai-lease-modal',
  templateUrl: './add-ai-lease-modal.component.html',
  styleUrls: ['./add-ai-lease-modal.component.scss'],
})
export class AddAiLeaseModalComponent extends AddLeaseModalComponent {
  selectedFileName: string | null = null;
  selectedFile: File | null = null;

  constructor(
    public override dialogRef: MatDialogRef<AddAiLeaseModalComponent>,
    formWizardService: FormWizardService,
    dashboardService: DashboardService,
    router: Router,
    dataService: DataService,
    toastService: CremToastService,
    facade: MangoAppFacade,
    @Inject(MAT_DIALOG_DATA)
    public override data: {
      objectTypeName: string;
      objectTypeId: number;
      objectId: number;
      objectName: string;
      premiseId: number;
    }
  ) {
    super(dialogRef, formWizardService, dashboardService, router, dataService, toastService, facade, data);
  }

  override setupAddLeaseFormGroup(): void {
    super.setupAddLeaseFormGroup();

    // These fields are populated by the AI from the lease PDF — remove required validation
    ['tenantName', 'leaseType', 'currencyTypeList', 'beginDate', 'endDate'].forEach((field) => {
      const ctrl = this.addLeaseFormGroup.get(field);
      if (ctrl) {
        ctrl.clearValidators();
        ctrl.updateValueAndValidity();
      }
    });

    this.addLeaseFormGroup.addControl('includesAmendments', new FormControl(false));
    this.addLeaseFormGroup.addControl('abstractionNotes', new FormControl(''));
    this.addLeaseFormGroup.addControl('leaseDocument', new FormControl(null, Validators.required));
  }

  override buildModalTitle(): void {
    this.modalTitle = 'Add AI Lease Abstraction';
    this.dynName = this.data.objectTypeName ?? 'Lease';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;
      this.addLeaseFormGroup.get('leaseDocument').setValue(this.selectedFile);
    }
  }

  override save(e: any): void {
    if (!this.addLeaseFormGroup.valid || !this.datesAreValid()) {
      this.toastService.show(VALIDATION_ERROR, '', ToastState.ERROR, {
        position: 'bottom right',
        maxWidth: '350px',
      });
      return;
    }
    super.save(e);
  }

  override saveAndNew(e: any): void {
    if (!this.addLeaseFormGroup.valid || !this.datesAreValid()) {
      this.toastService.show(VALIDATION_ERROR, '', ToastState.ERROR, {
        position: 'bottom right',
        maxWidth: '350px',
      });
      return;
    }
    super.saveAndNew(e);
  }

  override launch(e: any): void {
    if (!this.addLeaseFormGroup.valid || !this.datesAreValid()) {
      this.toastService.show(VALIDATION_ERROR, '', ToastState.ERROR, {
        position: 'bottom right',
        maxWidth: '350px',
      });
      return;
    }
    super.launch(e);
  }
}
