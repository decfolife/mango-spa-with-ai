import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DataService } from '@mango/core-shared';
import {
  CURRENCY_DROPDOWN_ERROR,
  ContactRecord,
  EQUIPMENT_LEASE_TEMPLATE_ID,
  EQUIPMENT_OTID,
  EQUIPMENT_RENDER_SELECT_SUPPLIER_ID,
  EQUIPMENT_RENDER_SELECT_TEMPLATE_ID,
  EQUIPMENT_WIZARD_SAVE_ERROR,
  EQUIPMENT_WIZARD_SAVE_SUCCESS,
  PORTFOLIO_DROPDOWN_ERROR,
  ToastState,
  VALIDATION_ERROR,
} from '@mango/data-models/lib-data-models';
import {
  ButtonModule,
  CremFormsModule,
  CremToastService,
  DatePickerComponent,
  DatePickerModule,
  DropdownComponent,
  DropdownModule,
  InputComponent,
  LibUiElementsModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { FormWizardService } from '@micro-components/services/form-wizard.service';
import { Subscription, combineLatest, of } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { filter, map, switchMap } from 'rxjs/operators';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';

@Component({
  selector: 'crem-add-equipment-modal',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ModalModule,
    DropdownModule,
    LibUiElementsModule,
    InputComponent,
    ReactiveFormsModule,
    CremFormsModule,
    DatePickerModule,
  ],
  templateUrl: './add-equipment-modal.component.html',
  styleUrls: ['./add-equipment-modal.component.scss'],
  providers: [DatePipe],
})
export class AddEquipmentModalComponent implements OnInit, OnDestroy {
  @ViewChild('portfolioDropdown') portfolioDropdown: DropdownComponent;
  @ViewChild('supplierDropdown') supplierDropdown: DropdownComponent;
  @ViewChild('templateDropdown') templateDropdown: DropdownComponent;
  @ViewChild('currencyDropdown') currencyDropdown: DropdownComponent;
  @ViewChild('beginDatePicker') BeginDate: DatePickerComponent;
  @ViewChild('endDatePicker') EndDate: DatePickerComponent;

  componentName = 'Add-equipment-modal';
  equipmentForm: FormGroup;
  iscurrencyTypeRequired: boolean;
  showToast = false;
  selectedTemplateID: string;
  selectedSupplierID: string;
  legalEntityName: string;
  saveClicked: boolean = false;
  saveNewClicked: boolean = false;
  saveLaunchClicked: boolean = false;
  disableButton: boolean = false;
  dateFormat: string = '';

  private currentUserInfo$: Observable<ContactRecord>;

  public portfolioDropdownItem: any = [];
  public supplierDropdownItem: any = [];
  public templateDropdownItem: any = [];
  private subscriptions = new Subscription();
  subs: Subscription[] = [];
  isUserDatesEU = true;
  public currencyDropdownItem: any = [];
  defaultCurrency: number;
  selectedPortfolio: any;
  initialSelectedPortfolio: number;
  selectedSupplier: any;
  private redirectorLinks: any[] = null;
  hasPassedSupplier = !!(this.data.objectId && this.data.objectName);
  savedALease = false; // true when "save and new" used at lease once

  constructor(
    public dialogRef: MatDialogRef<AddEquipmentModalComponent>,
    private formWizardService: FormWizardService,
    private router: Router,
    private fb: FormBuilder,
    private toastService: CremToastService,
    public datePipe: DatePipe,
    private dataService: DataService,
    private facade: MangoAppFacade,

    @Inject(MAT_DIALOG_DATA)
    public data: {
      objectTypeName: string;
      objectTypeId: number;
      objectId: number;
      objectName: string;
    }
  ) {
    if (this.hasPassedSupplier) {
      this.supplierDropdownItem = [
        {
          objectID: this.data.objectId,
          objectName: this.data.objectName,
        },
      ];

      this.selectedSupplierID = this.supplierDropdownItem[0].objectID;
    }

    this.getDropdownData();
  }

  ngOnInit(): void {
    this.initializeAddEquipmentFormGroup();

    this.currentUserInfo$ = this.facade.contactRecord$;
    this.subs.push(
      this.currentUserInfo$.subscribe((contact) => {
        this.dateFormat = contact.preferences.contactDatesEU
          ? 'dd.MM.yyyy'
          : 'MM/dd/yyyy';
        this.defaultCurrency = contact.preferences.contactCurrency;
      })
    );

    if (this.redirectorLinks === null) {
      this.subs.push(
        this.dataService.getRedirectorLinkList().subscribe((res) => {
          this.redirectorLinks = res.data;
        })
      );
    }
  }

  initializeAddEquipmentFormGroup(): void {
    this.equipmentForm = this.fb.group({
      portfolioList: ['', this.hasPassedSupplier ? null : Validators.required],
      supplierList: ['', Validators.required],
      templateList: ['', Validators.required],
      currencyTypeList: ['', Validators.required],
      legalEntityName: ['', Validators.required],
      beginDate: [null, Validators.required],
      endDate: [null, Validators.required],
    });

    if (this.hasPassedSupplier) {
      this.equipmentForm.get('supplierList').disable();
      this.equipmentForm.get('templateList').disable();
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  getDropdownData() {
    this.subscriptions.add(
      this.formWizardService
        .getRenderSelect('', 62)
        .subscribe((portfolioDropdownItem) => {
          if (portfolioDropdownItem) {
            this.portfolioDropdownItem = portfolioDropdownItem.data;
            if (this.portfolioDropdownItem.length === 1) {
              this.initialSelectedPortfolio =
                this.portfolioDropdownItem[0].companyID;
            }
          }
          if (
            portfolioDropdownItem === null ||
            !portfolioDropdownItem.success
          ) {
            this.toastService.show(
              PORTFOLIO_DROPDOWN_ERROR,
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

    this.subscriptions.add(
      this.formWizardService
        .getRenderSelect('', 21)
        .subscribe((currencyDropdownItem) => {
          if (currencyDropdownItem) {
            this.currencyDropdownItem = currencyDropdownItem.data;
          }
          if (currencyDropdownItem === null || !currencyDropdownItem.success) {
            this.toastService.show(
              CURRENCY_DROPDOWN_ERROR,
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

    if (this.hasPassedSupplier) {
      this.subscriptions.add(
        this.formWizardService
          .getRenderSelect(
            EQUIPMENT_LEASE_TEMPLATE_ID,
            EQUIPMENT_RENDER_SELECT_TEMPLATE_ID
          )
          .pipe(
            filter((v) => !!v),
            map((templates) => {
              this.templateDropdownItem = templates.data;
              if (
                this.templateDropdownItem &&
                this.templateDropdownItem.length > 0
              ) {
                this.selectedTemplateID =
                  this.templateDropdownItem[0].objectTypeTypeID;
              }
            })
          )
          .subscribe()
      );
    }
  }

  onPortfolioValueChange(e: any) {
    this.selectedPortfolio = e[0].companyID;
    of(this.selectedPortfolio)
      .pipe(
        filter((value) => !!value),
        switchMap((value) =>
          combineLatest([
            this.formWizardService
              .getRenderSelect(value, EQUIPMENT_RENDER_SELECT_TEMPLATE_ID)
              .pipe(filter((v) => !!v)),
            this.formWizardService
              .getRenderSelect(value, EQUIPMENT_RENDER_SELECT_SUPPLIER_ID)
              .pipe(filter((v) => !!v)),
          ])
        ),
        map(([templates, suppliers]) => {
          this.templateDropdownItem = templates.data;
          this.supplierDropdownItem = suppliers.data;
          if (
            this.templateDropdownItem &&
            this.templateDropdownItem.length > 0
          ) {
            this.selectedTemplateID =
              this.templateDropdownItem[0].objectTypeTypeID;
          }

          if (
            this.supplierDropdownItem &&
            this.supplierDropdownItem.length > 0
          ) {
            this.selectedSupplierID = this.supplierDropdownItem[0].objectID;
          }
        })
      )
      .subscribe();
  }

  setButtonStates(activeButton: string): void {
    this.saveClicked = activeButton === 'save';
    this.saveNewClicked = activeButton === 'saveNew';
    this.saveLaunchClicked = activeButton === 'launch';
    this.disableButton = true;
  }

  save() {
    if (this.equipmentForm.valid) {
      this.setButtonStates('save');
      this.saveClicked = true;
      const equipment = this.getEquipmentData();
      this.subscriptions.add(
        this.formWizardService.addEquipment(equipment).subscribe((result) => {
          if (result.success) {
            this.toastService.show(
              EQUIPMENT_WIZARD_SAVE_SUCCESS,
              '',
              ToastState.SUCCESS,
              {
                position: 'bottom right',
                maxWidth: '360px',
              }
            );
            this.dialogRef.close(true);
            this.saveClicked = false;
          } else {
            this.toastService.show(
              EQUIPMENT_WIZARD_SAVE_ERROR,
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
    } else {
      this.toastService.show(VALIDATION_ERROR, '', ToastState.ERROR, {
        position: 'bottom right',
        maxWidth: '350px',
      });
    }
  }

  saveAndNew() {
    if (this.equipmentForm.valid) {
      this.setButtonStates('saveNew');
      this.saveNewClicked = true;
      const equipment = this.getEquipmentData();
      this.subscriptions.add(
        this.formWizardService.addEquipment(equipment).subscribe((result) => {
          if (result.success) {
            this.toastService.show(
              EQUIPMENT_WIZARD_SAVE_SUCCESS,
              '',
              ToastState.SUCCESS,
              {
                position: 'bottom right',
                maxWidth: '350px',
              }
            );
            this.saveNewClicked = false;
            this.disableButton = false;
            this.savedALease = true;
            this.resetPopupSelection();
          } else {
            this.toastService.show(
              EQUIPMENT_WIZARD_SAVE_ERROR,
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
    } else {
      this.toastService.show(VALIDATION_ERROR, '', ToastState.ERROR, {
        position: 'bottom right',
        maxWidth: '350px',
      });
    }
  }

  launchEquipmentLeaseRenderForm() {
    if (this.equipmentForm.valid) {
      this.setButtonStates('launch');
      this.saveLaunchClicked = true;
      const equipment = this.getEquipmentData();
      this.subscriptions.add(
        this.formWizardService.addEquipment(equipment).subscribe((result) => {
          if (result.success) {
            this.saveNewClicked = false;
            this.dialogRef.close();
            const currURL = this.getRedirectorURL(
              result.data,
              EQUIPMENT_OTID,
              402
            );
            this.router.navigateByUrl(currURL);
          } else {
            this.toastService.show(
              EQUIPMENT_WIZARD_SAVE_ERROR,
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

  getEquipmentData() {
    let buildingID = this.equipmentForm.get('supplierList').value[0];
    let ottid = this.equipmentForm.get('templateList').value[0];

    if (this.hasPassedSupplier) {
      buildingID = this.data.objectId;
      ottid = EQUIPMENT_LEASE_TEMPLATE_ID;
    }

    const equipment = {
      PremiseName: '',
      BuildingID: buildingID,
      PremiseObjectTypeTypeID: 200,
      AccountingType: 'AP',
      BeginDate: this.formatDate(this.equipmentForm.get('beginDate').value),
      EndDate: this.formatDate(this.equipmentForm.get('endDate').value),
      ExchangeRateID: this.equipmentForm.get('currencyTypeList').value[0],
      LeaseTypeID: 3,
      MeasureUnitsID: 1,
      objectTypeTypeID: ottid,
      ParentLeaseAbstractID: 0,
      TenantName: this.equipmentForm.get('legalEntityName').value.trim(),
    };
    return equipment;
  }

  formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    if (this.isUserDatesEU)
      return this.datePipe.transform(
        [month, day, year].join('.'),
        'yyyy-MM-ddTHH:mm:ss.SSS',
        'UTC'
      );
    else
      return this.datePipe.transform(
        [month, day, year].join('/'),
        'yyyy-MM-ddTHH:mm:ss.SSS',
        'UTC'
      );
  }

  public close() {
    this.dialogRef.close(this.savedALease);
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

  resetPopupSelection() {
    let supplierDefaultedValues = null;

    if (this.hasPassedSupplier) {
      supplierDefaultedValues = {
        supplierList: this.data.objectId,
        templateList: this.equipmentForm.get('templateList').value,
      };
    }

    this.equipmentForm.reset({
      ...supplierDefaultedValues,
      currencyTypeList: this.defaultCurrency,
    });
  }
}
