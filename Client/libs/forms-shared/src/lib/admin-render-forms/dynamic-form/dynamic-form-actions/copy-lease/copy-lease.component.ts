import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Building, CopyLease, Premise } from '@forms/model/copyLease';
import { DynamicFormsService } from '@forms/services/dynamic-forms.service';
import { faL } from '@fortawesome/free-solid-svg-icons';
import { ObjectType, ToastState } from '@mango/data-models/lib-data-models';
import {
  ButtonModule,
  CremToastService,
  DropdownModule,
  LoaderModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { DashboardService } from '@project-dashboard/services/dashboard.service';
import { EMPTY, Subscription } from 'rxjs';
import { filter, switchMap, take, tap } from 'rxjs/operators';

@Component({
  selector: 'mango-copy-lease',
  templateUrl: './copy-lease.component.html',
  styleUrls: ['./copy-lease.component.scss'],
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
export class CopyLeaseComponent {
  footerButtonDisabled: boolean = false;
  leaseName: string = 'Lease Name';
  userMsg: string = '';
  buildingErrMsg = `There was an issue with getting Buildings info. Please contact the system administrator.`;
  premiseErrMsg = `There was an issue with getting Building Premises info. Please contact the system administrator.`;
  copyErrMsg = `There was an issue with copying Lease. Please try again later or contact system Administrator`;
  premiseNotavailable = `There is no premise/store associated to this building/center.`;
  bldgReqTitle = `Please select a building`;
  premiseReqTitle = `Premise is required to Copy`;
  copyBtnTitle = ``;
  availableBuildings: Building[] = [];
  availablePremises: Premise[] = [];
  leaseId: number;
  selectedBuildingNum: number = 0;
  selectedPremiseId: number;
  hidePremise: boolean = true;
  loadingIndicator: boolean = true;
  buildingObjectTypeName: string = 'Building';
  premiseObjectTypeName: string = 'Premise';

  subs: Subscription[] = [];

  constructor(
    private dynamicFormsService: DynamicFormsService,
    private dashboardService: DashboardService,
    private toastService: CremToastService,
    public dialogRef: MatDialogRef<CopyLeaseComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.leaseName = this.data.lease;
    this.leaseId = this.data.leaseId;
    this.hidePremise = this.data.hidePremise;
    this.copyBtnTitle = this.bldgReqTitle;

    this.getObjectTypeNames();
    this.getBuildingsData();
  }

  onBuildingSelectionChanged(e) {
    this.userMsg = '';
    this.selectedBuildingNum = e[0].buildingID;
    if (!this.hidePremise) {
      this.selectedPremiseId = null;
      this.getBuildingPremises(e[0].buildingID);
      this.copyBtnTitle = this.premiseReqTitle;
    }
  }

  onPremiseSelectionChanged(e) {
    this.selectedPremiseId = e[0].premiseID;
    this.copyBtnTitle = '';
  }

  getCopyButtonStatus(): boolean {
    let disableStatus = this.loadingIndicator
      ? true
      : !this.selectedBuildingNum
      ? true
      : this.hidePremise
      ? false
      : !this.selectedPremiseId
      ? true
      : false;
    return disableStatus;
  }

  copyLease() {
    this.loadingIndicator = true;

    let copyLeaseObj = {
      buildingId: this.selectedBuildingNum,
      premiseId: this.selectedPremiseId,
      hidePremise: this.hidePremise,
      leaseAbstractId: this.leaseId,
    };

    this.subs.push(
      this.dynamicFormsService.copyLease(copyLeaseObj).subscribe((res: any) => {
        this.loadingIndicator = false;
        if (res && res.success) {
          this.toastService.show(
            'Copy Lease was successful.',
            'Success',
            ToastState.SUCCESS
          );
          this.closeModal();
        } else {
          this.userMsg = this.copyErrMsg;
          this.toastService.show(
            'Copy Lease was Not successful.',
            'Error',
            ToastState.ERROR
          );
        }
      })
    );
  }

  getObjectTypeNames() {
    this.subs.push(
      this.dashboardService
        .getObjectTypeNames([ObjectType.BUILDING, ObjectType.PREMISE])
        .subscribe((result) => {
          this.buildingObjectTypeName = result?.data?.find(
            (x) => x.objectTypeId === ObjectType.BUILDING
          )?.objectTypeName;
          this.premiseObjectTypeName = result?.data?.find(
            (x) => x.objectTypeId === ObjectType.PREMISE
          )?.objectTypeName;
        })
    );
  }

  getBuildingsData() {
    this.subs.push(
      this.dynamicFormsService
        .getBuildings(this.hidePremise)
        .pipe(
          switchMap((res) => {
            if (!!res && res.success && res.data && res.data.length) {
              this.availableBuildings = res.data;
            } else {
              this.availableBuildings = [];
              this.userMsg = this.buildingErrMsg;
            }
            this.loadingIndicator = false;
            return EMPTY;
          })
        )
        .subscribe()
    );
  }

  getBuildingPremises(buildingId) {
    this.availablePremises = [];
    this.loadingIndicator = true;
    this.subs.push(
      this.dynamicFormsService
        .getBuildingPremises(buildingId)
        .pipe(take(1))
        .pipe(
          tap((res) => {
            if (!!res && res.success) {
              if (res.data && res.data.length) {
                this.availablePremises = res.data;
              } else {
                this.userMsg = this.premiseNotavailable;
              }
            } else {
              this.userMsg = this.premiseErrMsg;
            }
            this.loadingIndicator = false;
          })
        )
        .subscribe()
    );
  }

  closeModal() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
