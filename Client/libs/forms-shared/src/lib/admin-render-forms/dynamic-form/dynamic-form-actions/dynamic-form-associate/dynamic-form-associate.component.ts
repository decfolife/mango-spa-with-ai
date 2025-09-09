import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MangoDialogService } from '@mango/core-shared';
import { Subscription, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  ButtonModule,
  CremFormsModule,
  CremToastService,
  DatePickerModule,
  DropdownComponent,
  DropdownModule,
  LibUiElementsModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { DynamicFormsService } from '@forms/services/dynamic-forms.service';
import { ToastState } from '@mango/data-models/lib-data-models';
import { CheckBoxComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/checkbox';

@Component({
  selector: 'mango-dynamic-form-associate',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ModalModule,
    DropdownModule,
    LibUiElementsModule,
    ReactiveFormsModule,
    CremFormsModule,
    DatePickerModule,
    CheckBoxComponent,
  ],
  templateUrl: './dynamic-form-associate.component.html',
  styleUrls: ['./dynamic-form-associate.component.scss'],
})
export class DynamicFormAssociateComponent implements OnInit, OnDestroy {
  @ViewChild('countryDropdown') countryDropdown: DropdownComponent;
  @ViewChild('stateDropdown') stateDropdown: DropdownComponent;
  @ViewChild('buildingDropdown') buildingDropdown: DropdownComponent;
  @ViewChild('premiseDropdown') premiseDropdown: DropdownComponent;
  @ViewChild('leaseDropdown') leaseDropdown: DropdownComponent;

  constructor(
    public dialogRef: MatDialogRef<DynamicFormAssociateComponent>,
    private dynamicFormsService: DynamicFormsService,
    private toastService: CremToastService,
    private dialogService: MangoDialogService,
    private cd: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      objectId: number;
      associateType: string;
      objectTypeId: number;
      hidePremise: boolean;
    }
  ) {}

  public hidePremise: boolean;
  public associateType: string;
  private subscriptions = new Subscription();
  saveClicked: boolean = false;
  componentName: string = 'Lease';
  associateForm: any = new FormGroup({});

  public countryDropdownItem: any = [];
  public stateDropdownItem: any = [];
  public buildingDropdownItem: any = [];
  public premiseDropdownItem: any = [];
  public leaseDropdownItem: any = [];

  public selectedCountry: string = '';
  public selectedState: string = '';
  public selectedBuildingID: number = 0;
  public selectedPremiseID: number = 0;
  public selectedLeaseID: number = 0;
  public removeAssociation: boolean = false;

  associatedData: any;
  associateBuildingInfo: any;
  associateLeaseInfo: any;
  modalTitle: string;
  disableSaveButton: boolean = true;
  isAssociateLoading: boolean = true;
  changesMade: boolean = false;

  onCountryValueChange(e: any) {
    if (e.length != 0 && e[0].name) {
      this.selectedCountry = e[0].name;
      this.getStatesData(this.selectedCountry);
    } else {
      this.selectedCountry = '';
      this.stateDropdownItem = [];
    }
    this.changesMade = true;
    this.EnableSaveButton();
  }

  onStateValueChange(e: any) {
    if (e.length != 0 && (e[0].name !== undefined && e[0].name !== null)) {
      this.selectedState = e[0].name;
      this.getBuildings(this.selectedCountry, this.selectedState);
    } else {
      this.selectedState = '';
      this.buildingDropdownItem = [];
    }
    this.changesMade = true;
    this.EnableSaveButton();
    this.cd.detectChanges();
  }

  onBuildingValueChange(e: any) {
    if (e.length != 0) {
      this.selectedBuildingID = e[0].buildingID;
      if (this.hidePremise) {
        this.getLeasesData(this.selectedBuildingID, 0);
      } else {
        this.getPremiseData(this.selectedBuildingID);
      }
    } else {
      this.selectedBuildingID = 0;
      if (this.hidePremise) {
        this.leaseDropdownItem = [];
      } else {
        this.premiseDropdownItem = [];
      }
    }
    this.changesMade = true;
    this.EnableSaveButton();
    this.cd.detectChanges();
  }

  onPremiseValueChange(e: any) {
    if (e.length != 0) {
      this.selectedPremiseID = e[0].premiseID;
      this.getLeasesData(this.selectedBuildingID, this.selectedPremiseID);
    } else {
      this.selectedPremiseID = 0;
      this.leaseDropdownItem = [];
    }
    this.changesMade = true;
    this.EnableSaveButton();
    this.cd.detectChanges();
  }

  onLeaseValueChange(e: any) {
    if (e.length != 0) {
      this.selectedLeaseID = e[0].leaseAbstractID;
    } else {
      this.selectedLeaseID = 0;
    }
    this.changesMade = true;
    this.EnableSaveButton();
    this.cd.detectChanges();
  }

  EnableSaveButton() {
    this.disableSaveButton =
      this.selectedCountry === '' ||
      this.selectedState === '' ||
      this.selectedBuildingID === 0 ||
      (this.associateType === 'lease' &&
        !this.hidePremise &&
        this.selectedPremiseID === 0) ||
      (this.associateType === 'lease' && this.selectedLeaseID === 0);
  }

  getCountryData() {
    this.subscriptions.add(
      this.dynamicFormsService.getCountries().subscribe(
        (res) => {
          if (res && res.success) {
            this.countryDropdownItem = res.data.map((t) => {
              return { name: t, value: t };
            });

            this.countryDropdownItem.splice(0,0, { name: '[none]', value: '[none]' });
          } else {
            this.countryDropdownItem = [];
            this.notifyErrorMessage(
              'There was an issue loading details. Please review and try again.'
            );
          }
        },
        (error: any) => {
          this.notifyErrorMessage(
            'There was an error loading details. Please review and try again.'
          );
          console.log('Error occurred while loading Countries: ', error);
        }
      )
    );
  }

  getStatesData(country: string) {
    if (!country) return;
    this.subscriptions.add(
      this.dynamicFormsService.getStates(country).subscribe(
        (res) => {
          if (res && res.success) {
            this.stateDropdownItem = res.data.map((t) => {
              return { name: t, value: t };
            });

            this.stateDropdownItem.splice(0,0, { name: '[none]', value: '[none]' });
          } else {
            this.stateDropdownItem = [];
            this.notifyErrorMessage(
              'There was an issue loading details. Please review and try again.'
            );
          }
        },
        (error: any) => {
          this.notifyErrorMessage(
            'There was an error loading details. Please review and try again.'
          );
          console.log('Error occurred while loading States: ', error);
        }
      )
    );
  }

  getBuildings(country: string, state: string) {
    this.subscriptions.add(
      this.dynamicFormsService.getBuildingsForActions(country, state).subscribe(
        (res) => {
          if (res && res.success) {
            this.buildingDropdownItem = res.data;
          } else {
            this.buildingDropdownItem = [];
            this.notifyErrorMessage(
              'There was an issue loading details. Please review and try again.'
            );
          }
        },
        (error: any) => {
          this.notifyErrorMessage(
            'There was an error loading details. Please review and try again.'
          );
          console.log('Error occurred while loading Buildings: ', error);
        }
      )
    );
  }

  getPremiseData(buildingId: number) {
    this.subscriptions.add(
      this.dynamicFormsService.getPremises(buildingId).subscribe(
        (res) => {
          if (res && res.success) {
            this.premiseDropdownItem = res.data;
          } else {
            this.premiseDropdownItem = [];
            this.notifyErrorMessage(
              'There was an issue loading details. Please review and try again.'
            );
          }
        },
        (error: any) => {
          this.notifyErrorMessage(
            'There was an error loading details. Please review and try again.'
          );
          console.log('Error occurred while loading Premises: ', error);
        }
      )
    );
  }

  getLeasesData(buildingId: number, premiseId) {
    this.subscriptions.add(
      this.dynamicFormsService.getLeases(buildingId, premiseId).subscribe(
        (res) => {
          if (res && res.success) {
            this.leaseDropdownItem = res.data;
          } else {
            this.leaseDropdownItem = [];
            this.notifyErrorMessage(
              'There was an issue loading details. Please review and try again.'
            );
          }
        },
        (error: any) => {
          this.notifyErrorMessage(
            'There was an error loading details. Please review and try again.'
          );
          console.log('Error occurred while loading Leases: ', error);
        }
      )
    );
  }

  getAssociateBuildingToProject(projectId: number) {
    this.subscriptions.add(
      this.dynamicFormsService
        .getAssociateBuildingToProject(projectId)
        .subscribe(
          (res) => {
            if (res && res.success) {
              this.associatedData = res.data;
              this.populateAssociatedInfo();
              this.isAssociateLoading = false;
            } else {
              this.notifyErrorMessage(
                'There was an issue loading details. Please review and try again.'
              );
            }
          },
          (error: any) => {
            this.notifyErrorMessage(
              'There was an error loading details. Please review and try again.'
            );
            console.log(
              'Error occurred while loading Building Association: ',
              error
            );
          }
        )
    );
  }

  setAssociateBuildingToProject(buildingInfo: any) {
    this.subscriptions.add(
      this.dynamicFormsService
        .setAssociateBuildingToProject(buildingInfo)
        .subscribe(
          (res) => {
            if (res && res.success) {
              this.notifySuccessMessage();
              this.dialogRef.close();
            } else {
              this.notifyErrorMessage(
                'There was an issue saving details. Please review and try again.'
              );
            }
          },
          (error: any) => {
            this.notifyErrorMessage(
              'There was an error saving details. Please review and try again.'
            );
            console.log(
              'Error occurred while saving Building Association: ',
              error
            );
          }
        )
    );
  }

  getAssociateLeaseToProject(projectId: number) {
    this.subscriptions.add(
      this.dynamicFormsService.getAssociateLeaseToProject(projectId).subscribe(
        (res) => {
          if (res && res.success) {
            this.associatedData = res.data;
            this.populateAssociatedInfo();
            this.isAssociateLoading = false;
          } else {
            this.notifyErrorMessage(
              'There was an issue loading details. Please review and try again.'
            );
          }
        },
        (error: any) => {
          this.notifyErrorMessage(
            'There was an error loading details. Please review and try again.'
          );
          console.log(
            'Error occurred while loading Lease Association: ',
            error
          );
        }
      )
    );
  }

  setAssociateLeaseToProject(leaseInfo: any) {
    this.subscriptions.add(
      this.dynamicFormsService.setAssociateLeaseToProject(leaseInfo).subscribe(
        (res) => {
          if (res && res.success) {
            this.notifySuccessMessage();
            this.dialogRef.close();
          } else {
            this.notifyErrorMessage(
              'There was an issue saving details. Please review and try again.'
            );
          }
        },
        (error: any) => {
          this.notifyErrorMessage(
            'There was an error saving details. Please review and try again.'
          );
          console.log('Error occurred while saving Lease Association: ', error);
        }
      )
    );
  }

  private notifySuccessMessage() {
    let successMessage: string;
    if (this.associateType === 'lease') {
      successMessage = this.removeAssociation
        ? 'Lease was successfully unassociated.'
        : 'The lease has been associated.';
    } else if (this.associateType === 'building') {
      successMessage = this.removeAssociation
        ? 'Building was successfully unassociated.'
        : 'The building has been associated.';
    }
    this.toastService.show(successMessage, 'Success', ToastState.SUCCESS, {
      position: 'bottom right',
      maxWidth: '500px',
    });
  }

  private notifyErrorMessage(errorMessage: string) {
    this.toastService.show(errorMessage, 'Error', ToastState.ERROR, {
      position: 'bottom right',
      maxWidth: '350px',
    });
  }

  save() {
    if (this.associateType === 'lease') {
      let leaseInfo = {
        projectID: this.data.objectId,
        leaseAbstractID: this.selectedLeaseID,
        buildingID: this.selectedBuildingID,
        premiseID: this.selectedPremiseID,
        remove: this.removeAssociation,
      };
      this.setAssociateLeaseToProject(leaseInfo);
    } else if (this.associateType === 'building') {
      let buildingInfo = {
        projectID: this.data.objectId,
        buildingID: this.selectedBuildingID,
        remove: this.removeAssociation,
      };
      this.setAssociateBuildingToProject(buildingInfo);
    }
  }

  close() {
    if (this.changesMade) {
      this.dialogService
        .confirm(
          'Changes Made!',
          'Changes you made have not been saved. Would you like to continue editing or leave ?',
          'Continue',
          'Leave'
        )
        .pipe(
          switchMap((res) => {
            if (!res) {
              this.dialogRef.close('');
            }
            return of();
          })
        )
        .subscribe();
    } else {
      this.dialogRef.close('');
    }
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngOnInit(): void {
    this.associateType = this.data.associateType;
    this.hidePremise = this.data.hidePremise;

    if (this.associateType === 'lease') {
      this.modalTitle = 'Associate Lease';
      this.componentName = 'Lease';
      this.getAssociateLeaseToProject(this.data.objectId);
    } else if (this.associateType === 'building') {
      this.modalTitle = 'Associate Building';
      this.componentName = 'Building';
      this.getAssociateBuildingToProject(this.data.objectId);
    }
    this.changesMade = false;
  }

  populateAssociatedInfo() {
    this.getCountryData();

    if ((this.associateType === 'lease' && (!!this.associatedData.leaseAbstractID) && this.associatedData.leaseAbstractID > 0) ||
        (this.associateType === 'building' && (!!this.associatedData.buildingID) && this.associatedData.buildingID > 0)) {
          this.selectedCountry = !(!!this.associatedData.buildingCountry) || this.associatedData.buildingCountry === '' ? '[none]' : this.associatedData.buildingCountry;
          this.selectedState = !(!!this.associatedData.buildingState) || this.associatedData.buildingState === '' ? '[none]' : this.associatedData.buildingState;
    }
    
    this.selectedBuildingID = this.associatedData.buildingID;

    if (this.selectedCountry !== '' && this.selectedState !== '') {
        this.getStatesData(this.selectedCountry);
    }

    if (
      this.selectedBuildingID != 0 &&
      this.selectedCountry !== '' &&
      this.selectedState !== ''
    ) {
        this.getBuildings(this.selectedCountry, this.selectedState);
    }

    if (this.associateType === 'lease') {
      this.selectedPremiseID = this.associatedData.premiseID;
      this.selectedLeaseID = this.associatedData.leaseAbstractID;

      if (this.selectedPremiseID != 0 && this.selectedBuildingID != 0) {
        this.getPremiseData(this.selectedBuildingID);
      }

      if (
        this.selectedLeaseID != 0 &&
        this.selectedPremiseID != 0 &&
        this.selectedBuildingID != 0
      ) {
        this.getLeasesData(this.selectedBuildingID, this.selectedPremiseID);
      }
    }
  }

  removeAssociationChanged(e) {
    this.removeAssociation = e.value;
    this.countryDropdown.isDisabled = this.removeAssociation;
    this.stateDropdown.isDisabled = this.removeAssociation;
    this.buildingDropdown.isDisabled = this.removeAssociation;
    
    if (this.associateType === 'lease') {
      if (!this.hidePremise) {
        this.premiseDropdown.isDisabled = this.removeAssociation;
      }
      this.leaseDropdown.isDisabled = this.removeAssociation;
    }
  }
}
