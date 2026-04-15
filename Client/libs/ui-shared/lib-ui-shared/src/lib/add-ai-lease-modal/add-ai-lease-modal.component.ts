import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DataService } from '@mango/core-shared';
import {
  ToastState,
  VALIDATION_ERROR,
} from '@mango/data-models/lib-data-models';
import { CremToastService } from '@mango/ui-shared/lib-ui-elements';
import { AiLeaseService } from '@mango/forms-shared';
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
  selectedFiles: File[] = [];
  isSubmitting = false;

  // Extensions blocked for security — executable / script / system file types
  private readonly BLOCKED_EXTENSIONS = new Set([
    'exe',
    'bat',
    'cmd',
    'sh',
    'ps1',
    'vbs',
    'msi',
    'dll',
    'com',
    'scr',
    'jar',
    'app',
    'deb',
    'rpm',
    'dmg',
    'pkg',
    'bin',
    'run',
    'pif',
    'ws',
    'wsf',
    'wsh',
    'hta',
    'reg',
    'inf',
    'lnk',
  ]);

  constructor(
    public override dialogRef: MatDialogRef<AddAiLeaseModalComponent>,
    formWizardService: FormWizardService,
    dashboardService: DashboardService,
    router: Router,
    dataService: DataService,
    public toastService: CremToastService,
    facade: MangoAppFacade,
    private readonly aiLeaseService: AiLeaseService,
    @Inject(MAT_DIALOG_DATA)
    public override data: {
      objectTypeName: string;
      objectTypeId: number;
      objectId: number;
      objectName: string;
      premiseId: number;
      formId?: number;
    }
  ) {
    super(
      dialogRef,
      formWizardService,
      dashboardService,
      router,
      dataService,
      toastService,
      facade,
      data
    );
  }

  override setupAddLeaseFormGroup(): void {
    super.setupAddLeaseFormGroup();

    // These fields are populated by the AI from the lease PDF — remove required validation
    [
      'tenantName',
      'leaseType',
      'currencyTypeList',
      'beginDate',
      'endDate',
    ].forEach((field) => {
      const ctrl = this.addLeaseFormGroup.get(field);
      if (ctrl) {
        ctrl.clearValidators();
        ctrl.updateValueAndValidity();
      }
    });

    this.addLeaseFormGroup.addControl(
      'includesAmendments',
      new FormControl(false)
    );
    this.addLeaseFormGroup.addControl('abstractionNotes', new FormControl(''));
    this.addLeaseFormGroup.addControl(
      'leaseDocument',
      new FormControl(null, Validators.required)
    );
  }

  override buildModalTitle(): void {
    this.modalTitle = 'Add AI Lease Abstraction';
    this.dynName = this.data.objectTypeName ?? 'Lease';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const rejected: string[] = [];
    Array.from(input.files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (this.BLOCKED_EXTENSIONS.has(ext)) {
        rejected.push(file.name);
        return;
      }
      if (!this.selectedFiles.some((f) => f.name === file.name)) {
        this.selectedFiles.push(file);
      }
    });

    if (rejected.length) {
      this.toastService.show(
        `File type not allowed: ${rejected.join(', ')}`,
        '',
        ToastState.ERROR,
        { position: 'bottom right', maxWidth: '350px' }
      );
    }

    this.addLeaseFormGroup
      .get('leaseDocument')
      ?.setValue(this.selectedFiles.length ? this.selectedFiles : null);
    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.addLeaseFormGroup
      .get('leaseDocument')
      ?.setValue(this.selectedFiles.length ? this.selectedFiles : null);
  }

  /** Launch: post to AI abstractions API, then navigate to the abstraction form. */
  override launch(e: any): void {
    if (!this.addLeaseFormGroup.valid) {
      this.toastService.show(VALIDATION_ERROR, '', ToastState.ERROR, {
        position: 'bottom right',
        maxWidth: '350px',
      });
      return;
    }

    if (!this.selectedFiles.length) {
      this.toastService.show(
        'At least one lease document is required.',
        '',
        ToastState.ERROR,
        {
          position: 'bottom right',
          maxWidth: '350px',
        }
      );
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append(
      'buildingId',
      String(this.selectedBuilding ?? this.data.objectId ?? 0)
    );
    formData.append(
      'includesAmendments',
      String(this.addLeaseFormGroup.get('includesAmendments')?.value ?? false)
    );
    formData.append(
      'abstractionNotes',
      this.addLeaseFormGroup.get('abstractionNotes')?.value ?? ''
    );

    if (this.selectedPortfolio != null) {
      formData.append('portfolioId', String(this.selectedPortfolio));
    }
    if (this.selectedPremise != null) {
      formData.append('premiseId', String(this.selectedPremise));
    }
    if (this.selectedPremiseType != null) {
      formData.append('premiseTypeId', String(this.selectedPremiseType));
    }
    if (this.addNewPremise) {
      formData.append(
        'newPremiseName',
        this.addLeaseFormGroup.get('newPremiseName')?.value ?? ''
      );
    }
    if (this.selectedTemplate != null) {
      formData.append('leaseTemplateId', String(this.selectedTemplate));
    }
    if (this.selectedAccountingType != null) {
      formData.append('accountingType', String(this.selectedAccountingType));
    }
    if (this.selectedMeasurement != null) {
      formData.append('measurementUnitId', String(this.selectedMeasurement));
    }
    if (this.selectedParentLease != null) {
      formData.append('parentLeaseId', String(this.selectedParentLease));
    }

    this.selectedFiles.forEach((file) =>
      formData.append('files', file, file.name)
    );

    this.aiLeaseService.createAbstraction(formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.dialogRef.close();
        this.router.navigate(['/crem/portfolio/ai-abstractions'], {
          queryParams: {
            buildingId: this.selectedBuilding ?? this.data.objectId ?? 0,
            createdAiAbstractionId: response.aiAbstractionId,
            ...(this.data?.formId ? { formId: this.data.formId } : {}),
          },
        });
      },
      error: () => {
        this.isSubmitting = false;
        this.toastService.show(
          'Failed to submit AI abstraction request. Please try again.',
          '',
          ToastState.ERROR,
          { position: 'bottom right', maxWidth: '350px' }
        );
      },
    });
  }

  // Save/SaveAndNew are not relevant for the AI abstraction flow — show informational toast
  override save(_e: any): void {
    this.toastService.show(
      'Use "Launch" to submit for AI abstraction.',
      '',
      ToastState.WARNING,
      { position: 'bottom right', maxWidth: '350px' }
    );
  }

  override saveAndNew(_e: any): void {
    this.save(_e);
  }
}
