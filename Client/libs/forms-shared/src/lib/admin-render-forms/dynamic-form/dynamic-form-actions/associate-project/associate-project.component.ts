import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Building, CopyLease, Premise } from '@forms/model/copyLease';
import { LeaseInfo } from '@forms/model/lease';
import { DynamicFormsService } from '@forms/services/dynamic-forms.service';
import { faL } from '@fortawesome/free-solid-svg-icons';
import {
  ObjectType,
  RequestType,
  ToastState,
} from '@mango/data-models/lib-data-models';
import {
  ButtonModule,
  CremToastService,
  DropdownModule,
  LoaderModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { FormWizardService } from '@micro-components/services/form-wizard.service';
import { DashboardService } from '@project-dashboard/services/dashboard.service';
import { EMPTY, forkJoin, Subscription } from 'rxjs';
import { filter, switchMap, take, tap } from 'rxjs/operators';

export interface Project {
  transactionID: number;
  transactionName: string;
}

@Component({
  selector: 'mango-associate-project',
  templateUrl: './associate-project.component.html',
  styleUrls: ['./associate-project.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    LoaderModule,
    DropdownModule,
    ModalModule,
  ],
  providers: [DynamicFormsService],
})
export class AssociateToProjectComponent {
  footerButtonDisabled: boolean = false;
  userMsg: string = '';
  saveBtnTitle = '';
  projects: Project[] = [];
  selectedProject: Project;
  hidePremise: boolean = true;
  loadingIndicator: boolean = true;
  leaseInfo: LeaseInfo;

  subs: Subscription[] = [];

  constructor(
    private dynamicFormsService: DynamicFormsService,
    private formWizardService: FormWizardService,
    private toastService: CremToastService,
    public dialogRef: MatDialogRef<AssociateToProjectComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      OID: number;
      OTID: number;
      OTTID: number;
    }
  ) {}

  ngOnInit() {
    this.getAvailableSubProjects();

    if (this.data.OTID === ObjectType.LEASE) {
      this.getLeaseInfo();
    }
  }

  getAvailableSubProjects() {
    this.projects = [];
    this.loadingIndicator = true;

    this.subs.push(
      this.formWizardService
        .getRenderSelect(this.data.OID, RequestType.GET_AVAILABLE_SUB_PROJECTS)
        .pipe(
          switchMap((res) => {
            if (!!res && res.success && res.data && res.data.length) {
              this.projects = res.data;
            } else {
              this.projects = [];
              this.userMsg = `There was an issue getting projects info. Please contact the system administrator.`;
            }
            this.loadingIndicator = false;
            return EMPTY;
          })
        )
        .subscribe()
    );
  }

  // Get building and premise data associated with the lease
  getLeaseInfo() {
    this.leaseInfo = null;
    this.loadingIndicator = true;

    this.subs.push(
      this.formWizardService
        .getLeaseInfo(this.data.OID)
        .pipe(
          switchMap((res) => {
            if (!!res && res.success && res.data) {
              this.leaseInfo = res.data;
            } else {
              this.leaseInfo = null;
              this.userMsg = `There was an issue getting lease info. Please contact the system administrator.`;
            }
            this.loadingIndicator = false;
            return EMPTY;
          })
        )
        .subscribe()
    );
  }

  onProjectSelectionChanged(e) {
    this.userMsg = '';
    this.selectedProject = e[0];
  }

  associateToProject() {
    this.loadingIndicator = true;

    if (this.data.OTID === ObjectType.LEASE) {
      let associateRequest = {
        leaseAbstractID: this.data.OID,
        buildingID: this.leaseInfo.buildingID,
        projectID: this.selectedProject.transactionID,
        premiseID: this.leaseInfo.premiseID,
      };
      this.associateLeaseToProject(associateRequest);
    } else if (this.data.OTID === ObjectType.BUILDING) {
      let buildingRequest = {
        buildingID: this.data.OID,
        projectID: this.selectedProject.transactionID,
      };
      this.associateBuildingToProject(buildingRequest);
    }
  }

  associateLeaseToProject(associateLeaseRequest: any) {
    this.subs.push(
      this.dynamicFormsService
        .setAssociateLeaseToProject(associateLeaseRequest)
        .subscribe(
          (res) => {
            this.loadingIndicator = false;

            if (res && res.success) {
              this.toastService.show(null, 'Success', ToastState.SUCCESS);
              this.dialogRef.close();
            } else {
              this.toastService.show(
                'Error associating the project to the lease',
                'Error',
                ToastState.ERROR
              );
            }
          },
          (error: any) => {
            this.loadingIndicator = false;
            this.toastService.show(
              'Error associating the project to the lease',
              'Error',
              ToastState.ERROR
            );
          }
        )
    );
  }

  associateBuildingToProject(associateBuildingRequest: any) {
    this.subs.push(
      this.dynamicFormsService
        .setAssociateBuildingToProject(associateBuildingRequest)
        .subscribe(
          (res) => {
            this.loadingIndicator = false;

            if (res && res.success) {
              this.toastService.show(null, 'Success', ToastState.SUCCESS);
              this.dialogRef.close();
            } else {
              this.toastService.show(
                'Error associating the project to the building',
                'Error',
                ToastState.ERROR
              );
            }
          },
          (error: any) => {
            this.loadingIndicator = false;
            this.toastService.show(
              'Error associating the project to the building',
              'Error',
              ToastState.ERROR
            );
          }
        )
    );
  }

  isSaveButtonDisabled(): boolean {
    if (this.loadingIndicator || !this.selectedProject) return true;

    return false;
  }

  closeModal() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
