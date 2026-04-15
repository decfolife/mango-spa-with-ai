import { Component, DoCheck, Inject } from '@angular/core';
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
export class AddAiLeaseModalComponent extends AddLeaseModalComponent implements DoCheck {
  selectedFiles: File[] = [];

  isSaving = false;
  isSavingNew = false;
  isLaunching = false;
  private _prevSaveClicked = false;

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

  ngDoCheck(): void {
    // Reset per-button spinner flags when the parent finishes saving
    if (this._prevSaveClicked && !this.saveClicked) {
      this.isSaving = false;
      this.isSavingNew = false;
      this.isLaunching = false;
    }
    this._prevSaveClicked = this.saveClicked;
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

  get selectedFileName(): string | null {
    if (this.selectedFiles.length === 0) return null;
    if (this.selectedFiles.length === 1) return this.selectedFiles[0].name;
    return `${this.selectedFiles.length} files selected`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFiles = Array.from(input.files);
      this.addLeaseFormGroup.get('leaseDocument').setValue(this.selectedFiles);
    }
  }

  private validateForm(): boolean {
    if (!this.addLeaseFormGroup.valid || !this.datesAreValid()) {
      this.toastService.show(VALIDATION_ERROR, '', ToastState.ERROR, {
        position: 'bottom right',
        maxWidth: '350px',
      });
      return false;
    }
    return true;
  }

  override save(e: any): void {
    if (!this.validateForm()) return;
    this.isSaving = true;
    super.save(e);
  }

  override saveAndNew(e: any): void {
    if (!this.validateForm()) return;
    this.isSavingNew = true;
    super.saveAndNew(e);
  }

  override launch(e: any): void {
    if (!this.validateForm()) return;
    this.isLaunching = true;
    super.launch(e);
  }
}
