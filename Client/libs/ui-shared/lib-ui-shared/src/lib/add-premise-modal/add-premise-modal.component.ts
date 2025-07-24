import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DataService } from '@mango/core-shared';
import {
  ObjectType,
  ObjectTypeType,
  RequestType,
  ToastState,
  VALIDATION_ERROR,
} from '@mango/data-models/lib-data-models';
import {
  ButtonModule,
  CremFormsModule,
  CremToastService,
  DropdownComponent,
  DropdownModule,
  InputComponent,
  InputLabelComponent,
  LibUiElementsModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { FormWizardService } from '@micro-components/services/form-wizard.service';
import DataSource from 'devextreme/data/data_source';
import { Subscription } from 'rxjs';

@Component({
  selector: 'crem-add-premise-modal',
  templateUrl: './add-premise-modal.component.html',
  styleUrls: ['./add-premise-modal.component.scss'],
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
    FormsModule,
    CremFormsModule,
  ],
})
export class AddPremiseModalComponent implements OnInit, OnDestroy {
  public loading = true;
  public modalTitle: string;
  public dynName: string;
  dateFormat = '';
  addPremiseFormGroup: FormGroup;
  private redirectorLinks: any[] = null;
  private subscriptions = new Subscription();
  selectedPortfolio: any;
  selectedBuilding: any;
  buildingsDataSource: any;
  public buildingObjectName: string;
  private newPremiseSaved = false;
  public portfolioDropdownItem: any = [];
  public buildingDropdownItems: any = [];
  saveClicked: boolean;
  public premiseObjectName: string = 'Premise Name';
  public premiseTypesDropdownItems: any = [];
  public showPortfolio: boolean = true;
  public useBuildingDataSource: boolean = true;
  public useAutoSelectPremise: boolean | undefined;
  public useAutoSelectBuilding: boolean = true;
  hasPassedCenter = !!this.data.objectName;
  selectedPremiseType: any = null;
  selectedPremise: any = null;
  savedAPremise = false; // true when "save and new" used at lease once

  @ViewChild('premisePortfolioId') premisePortfolioDropdown: DropdownComponent;
  @ViewChild('buildingId') premiseBuildingDropdown: DropdownComponent;
  @ViewChild('premiseType') premiseTypeDropdown: DropdownComponent;
  @ViewChild('premiseName') premiseNameTextBox: InputComponent;

  constructor(
    public dialogRef: MatDialogRef<AddPremiseModalComponent>,
    private formWizardService: FormWizardService,
    private dataService: DataService,
    private router: Router,
    private toastService: CremToastService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      objectTypeName: string;
      objectTypeId: number;
      objectId: number;
      objectName: string;
    }
  ) {
    this.initBuildingsDataSource();
  }

  ngOnInit(): void {
    this.getUserDatePrefs();
    this.initialSetUp();
    this.setupAddPremiseFormGroup();
    this.getPortfolioDropdownData();
    this.getBuildingName();
    this.getPremiseTypes();
  }

  getUserDatePrefs() {
    this.subscriptions.add(
      this.formWizardService.getUserPreferences().subscribe((response) => {
        if (response?.data?.isDatesEU === true) {
          this.dateFormat = 'dd.MM.yyyy';
        }
      })
    );
  }

  initialSetUp() {
    if (this.selectedPremise == null || this.selectedPremise == 0) {
      if (
        this.selectedPremiseType == null ||
        this.premiseTypesDropdownItems.length == 0
      ) {
        this.selectedPremiseType = '200';
      }
    }
    this.subscriptions.add(
      this.dialogRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') {
          this.close();
        }
      })
    );
    if (this.redirectorLinks === null) {
      this.subscriptions.add(
        this.dataService.getRedirectorLinkList().subscribe((res) => {
          this.redirectorLinks = res.data;
        })
      );
    }
  }

  initBuildingsDataSource() {
    if (this.hasPassedCenter) {
      const result = {
        data: [
          {
            buildingID: this.data.objectId,
            buildingName: this.data.objectName,
          },
        ],
      };
      this.buildingDropdownItems = result.data;
      this.onBuildingChanged(result.data);
      this.useBuildingDataSource = false;
      return;
    }

    this.buildingsDataSource = new DataSource({
      load: async (loadOptions) => {
        try {
          if (!this.selectedPortfolio) {
            return { data: [], totalCount: 0 };
          }

          const params = {
            page: loadOptions.skip / loadOptions.take + 1 || 1,
            pageSize: loadOptions.take || 100,
            searchValue: loadOptions.searchValue || '',
          };

          var result = await this.formWizardService
            .getRenderSelect(
              this.selectedPortfolio,
              RequestType.BUILDINGS_LIST,
              params.searchValue,
              '',
              '',
              '',
              params.page,
              params.pageSize
            )
            .toPromise();

          if (!result.success) {
            this.displayMessage(
              'An error has occurred. Please try again.',
              true
            );
            // this.toastService.show(
            //   'An error has occurred. Please try again.',
            //   'Error',
            //   ToastState.ERROR,
            //   {
            //     position: 'top right',
            //     maxWidth: '350px',
            //   }
            // );
            return { data: [], totalCount: 0 };
          }

          return {
            data: result.data.items,
            totalCount: result.data.totalItems,
          };
        } catch (error) {
          this.displayMessage(
            'An error has occurred. Please try again: ' + error,
            true
          );
          return { data: [], totalCount: 0 };
        }
      },
      paginate: true,
      pageSize: 100,
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  setupAddPremiseFormGroup() {
    const NONE_SELECTED = '-1';
    this.addPremiseFormGroup = new FormGroup({
      portfolio: new FormControl(this.hasPassedCenter ? NONE_SELECTED : '', [
        Validators.required,
      ]),
      building: new FormControl(
        this.hasPassedCenter ? this.data.objectId : '',
        [Validators.required]
      ),
      premiseName: new FormControl('', [Validators.required]),
      premiseType: new FormControl('', [Validators.required]),
    });
    if (this.data.objectTypeId === ObjectType.PREMISE) {
      this.showPortfolio = false;
    }
  }

  public getPortfolioDropdownData() {
    if (!this.showPortfolio) {
      return;
    }
    this.subscriptions.add(
      this.formWizardService
        .getRenderSelect('', RequestType.PORTFOLIO_LIST)
        .subscribe((result) => {
          this.portfolioDropdownItem = result.data;
        })
    );
  }

  onPortFolioValueChanged(e: any) {
    if (e.length == 0) {
      this.selectedPortfolio = null;
    } else {
      this.selectedPortfolio = e[0].companyID;
      if (this.useBuildingDataSource) {
        this.buildingsDataSource.reload();
      }
    }
  }

  private getBuildingName() {
    this.formWizardService.getObjectTypeName(3).subscribe((result) => {
      this.buildingObjectName = result.data[0].objectType;
    });
  }

  onBuildingChanged(e: any) {
    if (e.length == 0) {
      this.selectedBuilding = null;
    } else {
      this.selectedBuilding = e[0].buildingID;
    }
  }

  getPremiseTypes() {
    this.subscriptions.add(
      this.formWizardService
        .getRenderSelect(2, RequestType.PREMISE_TYPE_ID)
        .subscribe((result) => {
          this.premiseObjectName = result.data[0].objectTypeTypeName;
          this.premiseTypesDropdownItems = result.data;
          this.useAutoSelectPremise = result.data.length === 1;
          this.loading = false; // This prevents from seeing the change of title while the PREMISE TYPE ID is being resolved
        })
    );
  }

  onPremiseTypeChanged(e: any) {
    if (e.length == 0) {
      this.selectedPremiseType = null;
    } else {
      this.selectedPremiseType = e[0].objectTypeTypeID;
    }
  }

  public close() {
    if (!this.newPremiseSaved) {
      this.dialogRef.close(this.savedAPremise);
    }
  }

  public save(e: any) {
    if (this.addPremiseFormGroup.valid) {
      const form = this.addPremiseFormGroup;
      this.saveClicked = true;
      var premiseId = 0;
      this.subscriptions.add(
        this.formWizardService
          .addPremise(
            this.selectedBuilding,
            ObjectTypeType.Building,
            form.get('premiseName').value,
            this.selectedPremiseType
          )
          .subscribe((result) => {
            if (result.success) {
              premiseId = result.data;
              this.displayMessage(
                this.premiseObjectName + ' created successfully',
                false
              );
              this.saveClicked = false;
              this.dialogRef.close(true);
            } else {
              this.displayMessage(
                'An error has occurred. Please try again.',
                true
              );
            }
          })
      );
    } else {
      this.displayMessage(VALIDATION_ERROR, true);
    }
  }

  getPremiseData() {
    const supplier = {
      buildingMasterGroupID:
        this.addPremiseFormGroup.get('portfolioList').value[0],
      buildingName: this.addPremiseFormGroup.get('supplierName').value,
      objectTypeTypeID: this.addPremiseFormGroup.get('templateList').value[0],
      portfolioSubGroupID:
        this.addPremiseFormGroup.get('subGroupList').value[0],
    };
    return supplier;
  }

  public saveAndNew(e: any) {
    if (this.addPremiseFormGroup.valid) {
      const form = this.addPremiseFormGroup;
      this.saveClicked = true;
      var premiseId = 0;
      this.subscriptions.add(
        this.formWizardService
          .addPremise(
            this.selectedBuilding,
            ObjectTypeType.Building,
            form.get('premiseName').value,
            this.selectedPremiseType
          )
          .subscribe((result) => {
            if (result.success) {
              premiseId = result.data;
              this.displayMessage(
                this.premiseObjectName + ' created successfully',
                false
              );
              this.saveClicked = false;
              this.savedAPremise = true;
              this.resetInputFields();
            } else {
              this.displayMessage(
                'An error has occurred. Please try again.',
                true
              );
            }
          })
      );
    } else {
      this.displayMessage(VALIDATION_ERROR, true);
    }
  }

  displayMessage(message: string, isError: boolean) {
    this.toastService.show(
      message,
      '',
      isError ? ToastState.ERROR : ToastState.SUCCESS,
      {
        position: 'bottom right',
        maxWidth: '350px',
      }
    );
  }

  resetInputFields() {
    let premiseDefaultValues = null;

    if (this.hasPassedCenter) {
      premiseDefaultValues = {
        portfolio: this.addPremiseFormGroup.get('portfolio').value,
        building: this.data.objectName,
      };
    }
    this.addPremiseFormGroup.reset({
      ...premiseDefaultValues,
      premiseType: this.addPremiseFormGroup.get('premiseType').value,
    });
    this.premisePortfolioDropdown.clearSelectBox();
    this.premiseBuildingDropdown.clearSelectBox();
    if (this.premiseTypeDropdown != undefined)
      this.premiseTypeDropdown.clearSelectBox();
    if (this.premiseNameTextBox != undefined)
      this.premiseNameTextBox.value = '';
  }

  launch(data: any) {
    if (this.addPremiseFormGroup.valid) {
      const form = this.addPremiseFormGroup;
      this.saveClicked = true;
      var premiseId = 0;
      this.subscriptions.add(
        this.formWizardService
          .addPremise(
            this.selectedBuilding,
            ObjectTypeType.Building,
            form.get('premiseName').value,
            this.selectedPremiseType
          )
          .subscribe((result) => {
            if (result.success) {
              premiseId = result.data;
              this.saveClicked = false;
              this.dialogRef.close();
              const currURL = this.getRedirectorURL(
                result.data,
                ObjectType.PREMISE,
                this.selectedPremiseType
              );
              this.router.navigateByUrl(currURL);
            } else {
              this.displayMessage(
                'An error has occurred. Please try again.',
                true
              );
            }
          })
      );
    } else {
      this.displayMessage(VALIDATION_ERROR, true);
    }
  }

  getRedirectorURL(
    objectId: number,
    objectTypeId: number,
    objectTypeTypeId: number
  ): string {
    let getURL = this.redirectorLinks.find(
      (x) =>
        x.objectTypeId === objectTypeId &&
        x.objectTypeTypeId === objectTypeTypeId
    );
    getURL =
      getURL ??
      this.redirectorLinks.find((x) => x.objectTypeId === objectTypeId);
    let urlLink = getURL ? getURL.urlLink : 'not found';
    urlLink = urlLink
      .replace(/\[OID\]/, objectId)
      .replace(/\[OTID\]/, objectTypeId)
      .replace(/\[OTTID\]/, objectTypeTypeId);
    return urlLink;
  }
}
