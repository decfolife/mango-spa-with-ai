import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DataService } from '@mango/core-shared';
import {
  LEASE_WIZARD_OTID,
  ObjectType,
  RequestType,
  ToastState,
  VALIDATION_ERROR,
} from '@mango/data-models/lib-data-models';
import {
  CremToastService,
  DropdownComponent,
  InputComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { FormWizardService } from '@micro-components/services/form-wizard.service';
import { DashboardService } from '@project-dashboard/services/dashboard.service';
import DataSource from 'devextreme/data/data_source';
import notify from 'devextreme/ui/notify';
import { combineLatest, Subscription } from 'rxjs';

//Constants
const RENDER_SELECT_PORTFOLIO_ID = 62;
const RENDER_SELECT_BUILDINGS_ID = 130;
const RENDER_SELECT_PREMISE_ID = 27;
const RENDER_SELECT_LEASE_TYPES_ID = 31;
const RENDER_SELECT_ACCOUNTING_TYPE_ID = 127;
const RENDER_SELECT_CURRENCY_ID = 21;
const RENDER_SELECT_MEASUREMENT_ID = 20;
const RENDER_SELECT_TEMPLATE_ID = 56;
const RENDER_SELECT_PREMISE_TYPE_ID = 23;

@Component({
  selector: 'mango-add-lease-modal',
  templateUrl: './add-lease-modal.component.html',
  styleUrls: ['./add-lease-modal.component.scss'],
})
export class AddLeaseModalComponent implements OnInit, OnDestroy {
  @Input() OTID: number;
  @Input() OID: number = 0;
  public contentVisible = true;
  public enableStateTextBox: boolean = false;
  private newLeaseSaved = false;
  public loading = true;
  public modalTitle: string;
  public dynName: string;
  buildingsDataSource: any;
  searchTimeoutOption = 600;
  public portfolioDropdownItem: any = [];
  public buildingDropdownItems: any = [];
  public premiseDropdownItems: any = [];
  public premiseTypesDropdownItems: any = [];
  public leaseTypeItems: any = [];
  public leaseTemplateItems: any = [];
  public accountingTypeItems: any = [];
  public parentLeaseItems: any = [];
  public currencyItems: any = [];
  public measurementUnitItems: any = [];
  private subscriptions = new Subscription();
  selectedPortfolio: any;
  selectedBuilding: any;
  selectedTemplate: any;
  initialFocusElement: string;
  hidePremise: boolean = true;
  selectedPremise: any = null;
  selectedPremiseType: any = null;
  selectedAccountingType: any;
  selectedLeaseType: any;
  selectedParentLease: any;
  selectedCurrency: number;
  selectedCurrencyIndex: number = 0;
  selectedMeasurement: any;
  selectedMeasurementIndex: number = 0;
  selectedLeaseTemplate: any;
  leaseType: any = null;
  beginDate: any = null;
  endDate: any = null;
  public premiseObjectName: string = '';
  public leaseObjectName: string = '';
  public buildingObjectName: string;
  public addNewPremise: boolean = false;
  public newPremiseName: string = '';
  public addSubLeaseWizard: boolean;
  addLeaseFormGroup: FormGroup;
  saveClicked: boolean;
  private redirectorLinks: any[] = null;
  private subscription = new Subscription();
  dateFormat = '';
  isUserDatesEU: boolean;
  hasPassedBuilding = this.data.objectId && this.data.objectName;
  savedALease = false; // true when "save and new" used at lease once

  @Output() isLoading = new EventEmitter();
  @ViewChild('leasePortfolioId') leasePortfolioDropdown: DropdownComponent;
  @ViewChild('buildingId') buildingDropdown: DropdownComponent;
  @ViewChild('premiseId') premiseDropdown: DropdownComponent;
  @ViewChild('newPremiseName') premiseNameTextBox: InputComponent;
  @ViewChild('premiseTypeId') premiseTypeDropdown: DropdownComponent;
  @ViewChild('tenantName') tenantNameTextBox: InputComponent;
  @ViewChild('leaseTemplateId') leaseTemplateDropdown: DropdownComponent;
  @ViewChild('beginDate') beginDateTextBox: InputComponent;
  @ViewChild('endDate') endDateTextBox: InputComponent;
  @ViewChild('accountingType') accountingTypeDropdown: DropdownComponent;
  @ViewChild('parentLease') leaseParentDropdown: DropdownComponent;
  @ViewChild('currencyDropdown') currencyDropdown: DropdownComponent;
  @ViewChild('measurement') measurementDropdown: DropdownComponent;
  @ViewChild('leasePortfolioId') portfolioDropdown: DropdownComponent;

  constructor(
    public dialogRef: MatDialogRef<AddLeaseModalComponent>,
    private formWizardService: FormWizardService,
    private dashboardService: DashboardService,
    private router: Router,
    private dataService: DataService,
    private toastService: CremToastService,
    private facade: MangoAppFacade,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      objectTypeName: string;
      objectTypeId: number;
      objectId: number;
      objectName: string;
      premiseId: number;
    }
  ) {
    this.initBuildingsDataSource();
  }

  ngOnInit(): void {
    this.setupAddLeaseFormGroup();

    this.formWizardService.getUserPreferences().subscribe((response) => {
      if (response?.data?.isDatesEU === true) {
        this.dateFormat = 'dd.MM.yyyy';
      }
      this.selectedMeasurementIndex = response?.data?.unitOfMeasureId;
      this.selectedCurrencyIndex = response?.data?.currencyId;
    });

    // this.facade.contactRecord$.subscribe((contact) => {
    //   this.isUserDatesEU = contact.preferences.contactDatesEU;
    //   this.dateFormat = this.isUserDatesEU ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
    //   this.selectedCurrency = contact.preferences.contactCurrency;
    // })
    this.subscriptions.add(
      this.dialogRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') {
          this.close();
        }
      })
    );

    if (this.data.objectId) {
      this.handleSelectedBuilding(this.data.objectId);
    }

    this.getPortfolioDropdownData();
    this.getPremiseName();
    this.getLeaseName();
    this.getBuildingName();
    this.getAccountingTypes();
    this.getCurrencyTypes();
    this.getMeasurementTypes();
    this.getLeaseTypes();

    if (!this.data.objectTypeName) {
      this.subscriptions.add(
        this.dashboardService
          .getObjectTypeNames([LEASE_WIZARD_OTID])
          .subscribe((result) => {
            this.data.objectTypeName = result?.data?.[0]?.objectTypeName;
            this.buildModalTitle();
          })
      );
    } else {
      this.buildModalTitle();
    }

    const hidePremiseCall =
      this.formWizardService.getClientPreferenceByField('HidePremise');
    const addLeaseWizardCall =
      this.formWizardService.getClientPreferenceByField('AddLeaseWizard');

    this.subscription.add(
      combineLatest([hidePremiseCall, addLeaseWizardCall]).subscribe(
        (res: any) => {
          this.hidePremise =
            res[0].data[0].clientSetupFieldValue == '0' ? false : true;
          this.addSubLeaseWizard =
            res[1].data[0].clientSetupFieldValue.includes('AddSubLeaseWizard');
          if (this.hidePremise) {
            this.addLeaseFormGroup.get('premise').setValidators(null);
            this.addLeaseFormGroup.get('premiseType').setValidators(null);
          } else {
            this.addLeaseFormGroup
              .get('premise')
              .setValidators([Validators.required]);
            this.addLeaseFormGroup
              .get('premiseType')
              .setValidators([Validators.required]);
          }
        }
      )
    );

    if (this.redirectorLinks === null) {
      this.subscriptions.add(
        this.dataService.getRedirectorLinkList().subscribe((res) => {
          this.redirectorLinks = res.data;
        })
      );
    }
  }

  ngAfterViewInit(): void {
    this.isLoading.emit(this.loading);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Get Buildings
  initBuildingsDataSource() {
    if (this.hasPassedBuilding) {
      this.buildingsDataSource = [
        {
          buildingID: this.data.objectId,
          buildingName: this.data.objectName,
        },
      ];

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
            this.toastService.show(
              'An error has occurred. Please try again.',
              'Error',
              ToastState.ERROR,
              {
                position: 'top right',
                maxWidth: '350px',
              }
            );
            return { data: [], totalCount: 0 };
          }

          return {
            data: result.data.items,
            totalCount: result.data.totalItems,
          };
        } catch (error) {
          this.toastService.show(
            'An error has occurred. Please try again.',
            'Error',
            ToastState.ERROR,
            {
              position: 'top right',
              maxWidth: '350px',
            }
          );
          return { data: [], totalCount: 0 };
        }
      },
      paginate: true,
      pageSize: 100,
    });
  }

  setupAddLeaseFormGroup() {
    this.addLeaseFormGroup = new FormGroup({
      portfolio: new FormControl(
        '',
        this.hasPassedBuilding ? null : [Validators.required]
      ),
      building: new FormControl('', [Validators.required]),
      premise: new FormControl(''),
      newPremiseName: new FormControl(''),
      premiseType: new FormControl(''),
      leaseType: new FormControl('', [Validators.required]),
      tenantName: new FormControl('', [Validators.required]),
      accountingType: new FormControl('', [Validators.required]),
      parentLease: new FormControl(''),
      currencyTypeList: new FormControl('', [Validators.required]),
      measurement: new FormControl('', [Validators.required]),
      leaseTemplate: new FormControl('', [Validators.required]),
      beginDate: new FormControl(null),
      endDate: new FormControl(null),
    });

    if (this.hasPassedBuilding) {
      this.addLeaseFormGroup.get('building').disable();
    }

    if (this.data.premiseId) {
      this.addLeaseFormGroup.get('premise').disable();
    }
  }

  public getPortfolioDropdownData() {
    this.formWizardService
      .getRenderSelect('', RENDER_SELECT_PORTFOLIO_ID)
      .subscribe((result) => {
        this.portfolioDropdownItem = result.data;
      });
  }

  getPremiseTypes() {
    this.formWizardService
      .getRenderSelect(2, RENDER_SELECT_PREMISE_TYPE_ID)
      .subscribe((result) => {
        this.premiseTypesDropdownItems = result.data;
      });
  }

  getLeaseTypes() {
    this.formWizardService
      .getRenderSelect('', RENDER_SELECT_LEASE_TYPES_ID)
      .subscribe((result) => {
        this.leaseTypeItems = result.data;
        this.selectedLeaseType = result.data[0].leaseTypeID;
      });
  }

  getAccountingTypes() {
    this.formWizardService
      .getRenderSelect(0, RENDER_SELECT_ACCOUNTING_TYPE_ID)
      .subscribe((result) => {
        let filteredData = result.data.filter(
          (item) =>
            item !== null &&
            item !== undefined &&
            item !== '' &&
            item.accountType !== null &&
            /\S/g.test(item.accountType)
        );
        this.accountingTypeItems = filteredData;
        this.selectedAccountingType = filteredData[0].accountType;
      });
  }

  getCurrencyTypes() {
    this.formWizardService
      .getRenderSelect(0, RENDER_SELECT_CURRENCY_ID)
      .subscribe((result) => {
        this.currencyItems = result.data;
        if (this.selectedCurrencyIndex == 0 && result?.data?.length > 0)
          this.selectedCurrencyIndex = result.data[0].exchangeRateID;
        this.selectedCurrency = this.selectedCurrencyIndex;
      });
  }

  getMeasurementTypes() {
    this.formWizardService
      .getRenderSelect(0, RENDER_SELECT_MEASUREMENT_ID)
      .subscribe((result) => {
        this.measurementUnitItems = result.data;
        if (this.selectedMeasurementIndex == 0 && result?.data?.length > 0)
          this.selectedMeasurementIndex = result.data[0].measureUnitsID;
        this.selectedMeasurement = this.selectedMeasurementIndex;
      });
  }

  getLeaseTemplates() {
    this.formWizardService
      .getRenderSelect(0, RENDER_SELECT_TEMPLATE_ID)
      .subscribe((result) => {
        this.leaseTemplateItems = result.data;
        this.selectedLeaseTemplate = result.data.find(
          (x) => x.objectTypeTypeName === 'Lease'
        ).objectTypeTypeID;
      });
  }

  onPremiseValueChanged(e: any) {
    this.addNewPremise = false;
    this.selectedPremise = e[0].premiseID;
    if (e[0].premiseID == 0) {
      this.addNewPremise = true;
      this.getPremiseTypes();
    } else {
      this.addLeaseFormGroup.get('newPremiseName').setValidators(null);
      this.addLeaseFormGroup.get('newPremiseName').updateValueAndValidity();
      this.addLeaseFormGroup.get('premiseType').setValidators(null);
      this.addLeaseFormGroup.get('premiseType').updateValueAndValidity();
    }
  }

  onPortFolioValueChanged(e: any) {
    if (e.length == 0) {
      this.selectedPortfolio = null;
    } else {
      this.selectedPortfolio = e[0].companyID;
      this.buildingsDataSource.reload();
    }
  }

  onPremiseTypeChanged(e: any) {
    if (e.length == 0) {
      this.selectedPremiseType = null;
    } else {
      this.selectedPremiseType = e[0].premiseTypeID;
    }
  }

  onLeaseTemplateChanged(e: any) {
    if (e.length == 0) {
      this.selectedTemplate = null;
    } else {
      this.selectedTemplate = e[0].objectTypeTypeID;
    }
  }

  onLeaseTypeChanged(e: any) {
    if (e.length == 0) {
      this.leaseType = null;
    } else {
      this.leaseType = e[0].leaseTypeID;
    }
  }

  handleSelectedBuilding(buildingId: number) {
    this.selectedBuilding = buildingId;
    this.formWizardService
      .getRenderSelect(this.selectedBuilding, RENDER_SELECT_PREMISE_ID)
      .subscribe((result) => {
        if (this.hasPassedBuilding && this.data.premiseId) {
          this.premiseDropdownItems = result.data.filter(
            (x) => x.premiseID === this.data.premiseId
          );
        } else {
          this.premiseDropdownItems = result.data;
          this.premiseDropdownItems.unshift({
            premiseID: 0,
            premiseName: 'Add New',
          });
        }

        this.getLeaseTemplates();
      });

    this.loadParentLeases();
  }

  onBuildingChanged(e: any) {
    if (e.length == 0) {
      this.selectedBuilding = null;
      this.loadParentLeases();
    } else {
      this.handleSelectedBuilding(e[0].buildingID);
    }
  }

  onBeginDateChanged(e: any) {
    this.beginDate = e.value;
  }

  onEndDateChanged(e: any) {
    this.endDate = e.value;
  }

  onAccountingTypeChanged(e: any) {
    if (e.length == 0) {
      this.selectedAccountingType = null;
    } else {
      this.selectedAccountingType = e[0].accountType;
      this.loadParentLeases();
    }
  }

  loadParentLeases() {
    if (
      (this.selectedAccountingType === 'AR' ||
        this.selectedAccountingType == 'IC') &&
      this.selectedBuilding &&
      this.OTID != 3
    ) {
      //DisplayNewItems($("#selParentLeaseID")[0], $('#selBuildingID').val(), '112', '', '', 0, 0, 1, 'Not Applicable');
      this.formWizardService
        .getRenderSelect(this.selectedBuilding, 112)
        .subscribe((result) => {
          this.parentLeaseItems = result.data;
          this.parentLeaseItems.unshift({
            leaseAbstractID: 0,
            leaseName: 'Not Applicable',
          });
          this.selectedParentLease = this.parentLeaseItems[0].leaseAbstractID;
        });
    } else if (
      this.OTID == 3 &&
      (this.selectedAccountingType == 'AR' ||
        this.selectedAccountingType == 'IC')
    ) {
      this.formWizardService
        .getRenderSelect(this.OID, 112)
        .subscribe((result) => {
          this.parentLeaseItems = result.data;
          this.parentLeaseItems.unshift({
            leaseAbstractID: 0,
            leaseName: 'Not Applicable',
          });
          this.selectedParentLease = this.parentLeaseItems[0].leaseAbstractID;
        });
    } else {
      this.formWizardService.getRenderSelect(-1, 112).subscribe((result) => {
        this.parentLeaseItems = result.data;
        this.parentLeaseItems.unshift({
          leaseAbstractID: 0,
          leaseName: 'Not Applicable',
        });
        this.selectedParentLease = this.parentLeaseItems[0].leaseAbstractID;
      });
    }
  }

  onParentLeaseChanged(e: any) {
    if (e.length == 0) {
      this.selectedParentLease = null;
    } else {
      this.selectedParentLease = e[0].leaseAbstractID;
    }
  }

  onCurrencyTypeChanged(e: any) {
    if (e.length == 0) {
      this.selectedCurrency = null;
    } else {
      this.selectedCurrency = e[0].exchangeRateID;
    }
  }

  onMeasurementTypeChanged(e: any) {
    if (e.length == 0) {
      this.selectedMeasurement = null;
    } else {
      this.selectedMeasurement = e[0].measureUnitsID;
      this.portfolioDropdown?.selectBox.instance.focus();
    }
  }

  public buildModalTitle() {
    this.modalTitle = 'Add ' + this.data.objectTypeName;
    this.dynName = this.data.objectTypeName;
  }

  public close() {
    if (!this.newLeaseSaved) {
      this.dialogRef.close(this.savedALease);
    }
  }

  public showMessage() {
    notify({
      message: this.leaseObjectName + ' saved successfully.',
      type: 'success',
      displayTime: 2000,
      position: { at: 'bottom right', my: 'bottom right', offset: '-16 -16' },
      maxWidth: '400px',
      closeOnClick: true,
    });
  }

  getLeaseFromFormData() {
    const form = this.addLeaseFormGroup;
    if (this.selectedParentLease == undefined) {
      this.selectedParentLease = null;
    }
    return {
      PremiseID: form.get('premise').value,
      TenantName: form.get('tenantName').value,
      LeaseTypeID: form.get('leaseType').value[0],
      ObjectTypeTypeID: this.selectedTemplate,
      ParentLeaseAbstractID: this.selectedParentLease,
      BeginDate: this.beginDate,
      EndDate: this.endDate,
      AccountingType: this.selectedAccountingType,
      ExchangeRateID: form.get('currencyTypeList').value[0],
      MeasureUnitID: this.selectedMeasurement,
    };
  }

  private focusFirstItem() {
    setTimeout(() => {
      let buildingNameInput = document.getElementById('buildingName');
      buildingNameInput.focus();
    }, 200);
  }

  public save(e: any) {
    if (this.addLeaseFormGroup.valid && this.datesAreValid()) {
      this.getPremiseId().then((resolve) => {
        const lease = this.getLeaseFromFormData();
        lease.PremiseID = resolve;
        this.saveClicked = true;
        this.subscriptions.add(
          this.formWizardService.addLease(lease).subscribe((result) => {
            if (result.success) {
              this.toastService.show(
                this.dynName + ' created successfully',
                '',
                ToastState.SUCCESS,
                {
                  maxWidth: '500px',
                  duration: 5000,
                }
              );
              this.dialogRef.close(true);
              this.saveClicked = false;
            } else {
              this.toastService.show(
                'Save not successful',
                'Save failed.',
                ToastState.ERROR,
                {
                  position: 'bottom right',
                  maxWidth: '350px',
                }
              );
            }
          })
        );
      });
    } else {
      this.toastService.show(VALIDATION_ERROR, '', ToastState.ERROR, {
        position: 'bottom right',
        maxWidth: '350px',
      });
    }
  }

  public saveAndNew(e: any) {
    if (this.addLeaseFormGroup.valid && this.datesAreValid()) {
      this.saveClicked = true;
      this.getPremiseId().then((resolve) => {
        const lease = this.getLeaseFromFormData();
        lease.PremiseID = resolve;
        this.subscriptions.add(
          this.formWizardService.addLease(lease).subscribe((result) => {
            if (result.success) {
              this.toastService.show(
                this.dynName + ' created successfully.',
                '',
                ToastState.SUCCESS,
                {
                  position: 'bottom right',
                  maxWidth: '350px',
                }
              );
              this.saveClicked = false;
              this.savedALease = true;
              this.resetInputFields();
            } else {
              this.toastService.show(
                'An error has occurred. Please try again.',
                '',
                ToastState.ERROR,
                {
                  position: 'bottom right',
                  maxWidth: '350px',
                }
              );
            }
          })
        );
      });
    } else {
      this.toastService.show(VALIDATION_ERROR, '', ToastState.ERROR, {
        position: 'bottom right',
        maxWidth: '350px',
      });
    }
  }

  resetInputFields() {
    this.currencyDropdown.setDropdownvalue(this.selectedCurrencyIndex);
    this.leaseParentDropdown.clearSelectBox();

    if (!this.hasPassedBuilding) {
      this.portfolioDropdown.clearSelectBox();
      this.buildingDropdown.clearSelectBox();
      this.leaseTemplateDropdown.clearSelectBox();
    }
    if (this.premiseTypeDropdown != undefined) {
      this.premiseTypeDropdown.clearSelectBox();
    }
    if (this.premiseDropdown != undefined && !this.data.premiseId) {
      this.premiseDropdown.clearSelectBox();
    }
    this.measurementDropdown.setDropdownvalue(this.selectedMeasurementIndex);
    this.addLeaseFormGroup.get('beginDate').setValue('');
    this.addLeaseFormGroup.get('endDate').setValue('');
    this.tenantNameTextBox.value = '';
    if (this.premiseNameTextBox != undefined) {
      this.premiseNameTextBox.value = '';
    }
  }

  launch(data: any) {
    if (this.addLeaseFormGroup.valid && this.datesAreValid()) {
      this.getPremiseId().then((resolve) => {
        this.saveClicked = true;
        const lease = this.getLeaseFromFormData();
        lease.PremiseID = resolve;
        this.subscriptions.add(
          this.formWizardService.addLease(lease).subscribe((result) => {
            if (result.success) {
              this.saveClicked = false;
              this.dialogRef.close();
              let currURL = this.getRedirectorURL(
                result.data,
                ObjectType.LEASE,
                this.selectedTemplate
              );
              let pgEditUrl = currURL.replace(
                currURL,
                currURL + '&pgMode=Edit'
              );
              this.router.navigateByUrl(pgEditUrl);
            } else {
              this.toastService.show(
                'An error has occurred. Please try again.',
                '',
                ToastState.ERROR,
                {
                  position: 'bottom right',
                  maxWidth: '350px',
                }
              );
            }
          })
        );
      });
    } else {
      this.toastService.show(VALIDATION_ERROR, '', ToastState.ERROR, {
        position: 'bottom right',
        maxWidth: '350px',
      });
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

  private getLeaseName() {
    this.formWizardService.getObjectTypeName(4).subscribe((result) => {
      this.leaseObjectName = result.data[0].objectType;
    });
  }

  private getPremiseName() {
    this.formWizardService.getObjectTypeName(2).subscribe((result) => {
      this.premiseObjectName = result.data[0].objectType;
    });
  }

  private getBuildingName() {
    this.formWizardService.getObjectTypeName(3).subscribe((result) => {
      this.buildingObjectName = result.data[0].objectType;
    });
  }

  getPremiseId() {
    return new Promise((resolve) => {
      var premiseId = 0;
      if (this.selectedPremise == null || this.selectedPremise == 0) {
        if (
          this.selectedPremiseType == null ||
          this.premiseTypesDropdownItems.length == 0
        ) {
          this.selectedPremiseType = '200';
        }

        if (this.addNewPremise) {
          this.newPremiseName =
            this.addLeaseFormGroup.get('newPremiseName').value;
        }

        this.formWizardService
          .addPremise(
            this.selectedBuilding,
            this.selectedTemplate,
            this.newPremiseName,
            this.selectedPremiseType
          )
          .subscribe((result) => {
            premiseId = result.data;
            resolve(premiseId);
          });
      } else {
        resolve(this.selectedPremise);
      }
    });
  }

  datesAreValid() {
    if (Date.parse(this.endDate) < Date.parse(this.beginDate)) {
      return false;
    }
    return true;
  }
}
