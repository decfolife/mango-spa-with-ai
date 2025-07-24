import { Component, Inject, ViewChild, ChangeDetectorRef } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { FormWizardService } from '@micro-components/services/form-wizard.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';

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

import {
  ObjectType,
  RequestType,
  ToastState,
  ObjectTypeTypeID,
  VALIDATION_ERROR,
  RegexPatterns,
  CONTACT_WIZARD_MESSAGES,
} from '@mango/data-models/lib-data-models';

import { CommonModule } from '@angular/common';
import { Toast } from 'ngx-toastr';
import { DataService } from '@mango/core-shared';

import { Observable, Subscription, combineLatest } from 'rxjs';

import { filter, tap } from 'rxjs/operators';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import DataSource from 'devextreme/data/data_source';

@Component({
  selector: 'crem-add-contact-modal-component',
  templateUrl: './add-contact-modal.component.html',
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
    Toast,
    FormsModule,
    CremFormsModule,
    DxSelectBoxModule,
  ],
  styleUrls: ['./add-contact-modal.component.scss'],
})
export class AddContactModalComponent {
  @ViewChild('subGroupDropDown') subGroupDropDown: DropdownComponent;
  @ViewChild('groupDropDown') groupDropDown: DropdownComponent;
  @ViewChild('companyDropDown') companyDropDown: DropdownComponent;
  @ViewChild('isPublicDropDown') isPublicDropDown: DropdownComponent;

  componentName = 'Add-contact-modal';
  contactForm: FormGroup;
  isSubGroupRequired: boolean;
  isGroupRequired: boolean;
  showToast = false;
  selectedTemplateID: string;
  saveClicked: boolean = false;
  saveNewClicked: boolean = false;
  saveLaunchClicked: boolean = false;
  disableButton: boolean = false;
  companyDataSource: any;
  searchTimeoutOption = 600;
  contactGroupDefaultValue: any;

  public contactGroupDropDownItem: any[];
  private subscriptions = new Subscription();
  private subs: Subscription[] = [];
  public subGroupDropDownItem: any[];
  selectedPortfolio: any[];
  private redirectorLinks: any[] = null;

  constructor(
    public dialogRef: MatDialogRef<AddContactModalComponent>,
    private formWizardService: FormWizardService,
    private router: Router,
    private fb: FormBuilder,
    private toastService: CremToastService,
    private dataService: DataService,
    private changeDetector: ChangeDetectorRef,

    @Inject(MAT_DIALOG_DATA)
    public data: {
      objectTypeName: string;
      objectTypeId: number;
      companyID: number;
    }
  ) {
    this.initCompanyDataSource();
    this.selectCompanyDropDownValue();
  }

  selectCompanyDropDownValue(): void {
    setTimeout(() => {
      if (this.data.companyID)
        this.companyDropDown.selectBoxValue = this.data.companyID.toString();
    }, 250);
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadContactGroupDropDown().subscribe();
    this.fetchRedirectorLinks();
  }

  ngAfterContentChecked(): void {
    this.changeDetector.detectChanges();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): void {
    this.contactForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      emailAddress: [''],
      isPublic: ['', Validators.required],
      groupRightList: ['', Validators.required],
      companyName: ['', Validators.required],
      groupList: ['', Validators.required],
    });
  }

  private fetchRedirectorLinks(): void {
    if (this.redirectorLinks === null) {
      this.subs.push(
        this.dataService.getRedirectorLinkList().subscribe((res) => {
          this.redirectorLinks = res.data;
        })
      );
    }
  }

  initCompanyDataSource() {
    this.companyDataSource = new DataSource({
      load: async (loadOptions) => {
        try {
          const params = {
            page: loadOptions.skip / loadOptions.take + 1 || 1,
            pageSize: loadOptions.take || 1500,
            searchValue: loadOptions.searchValue || '',
          };

          var result = await this.formWizardService
            .getRenderSelect(
              params.searchValue,
              RequestType.CONTACT_COMPANY_LIST,
              '',
              '',
              '',
              '',
              params.page,
              params.pageSize
            )
            .toPromise();

          if (!result.success) {
            console.log(result.clientErrorMessage);
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

          result.data.items.forEach((e) => {
            e.companyID = e.companyID.toString();
          });

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
      pageSize: 1500,
    });
  }

  loadContactGroupDropDown(): Observable<any> {
    return combineLatest([this.formWizardService.getAllUserGroups()]).pipe(
      filter(([contactGroupDropDownItem]) => !!contactGroupDropDownItem),
      tap(([contactGroupDropDownItem]) => {
        contactGroupDropDownItem.data.forEach((e) => {
          e.companyID = e.companyID.toString();
        });
        this.contactGroupDropDownItem = contactGroupDropDownItem.data;
      })
    );
  }

  setButtonStates(activeButton: string): void {
    this.saveClicked = activeButton === 'save';
    this.saveNewClicked = activeButton === 'saveNew';
    this.saveLaunchClicked = activeButton === 'launch';
    this.disableButton = true;
  }

  private handleContactRequest(actionType: 'save' | 'saveNew' | 'launch') {
    if (!this.contactForm.valid) {
      this.showErrorToast(VALIDATION_ERROR);
    }
    if (this.contactForm.valid) {
      this.setButtonStates(actionType);
      const contactRequest = this.getContactData();

      if (!this.validateEmailAddress(contactRequest.emailAddress)) {
        this.resetSaveState(actionType);
        return;
      }

      this.subscriptions.add(
        this.formWizardService
          .addContact(contactRequest)
          .subscribe((result) => {
            if (result.success) {
              this.toastService.show(
                CONTACT_WIZARD_MESSAGES.CONTACT_WIZARD_SAVE_SUCCESS,
                '',
                ToastState.SUCCESS,
                {
                  position: 'bottom right',
                  maxWidth: '350px',
                }
              );

              this.resetSaveState(actionType);

              switch (actionType) {
                case 'save':
                  this.dialogRef.close();
                  break;
                case 'launch':
                  this.dialogRef.close();
                  const currURL = this.getRedirectorURL(
                    result.data,
                    ObjectType.CONTACT,
                    ObjectTypeTypeID.CONTACT_OTTID
                  );
                  this.router.navigateByUrl(currURL);
                  break;
                case 'saveNew':
                  this.resetSaveNew();
                  break;
              }
            } else {
              this.showErrorToast();
            }
          })
      );
    }
  }

  private resetSaveState(actionType: 'save' | 'saveNew' | 'launch') {
    switch (actionType) {
      case 'save':
        this.saveClicked = false;
        break;
      case 'saveNew':
        this.saveNewClicked = false;
        this.disableButton = false;
        break;
      case 'launch':
        this.saveLaunchClicked = false;
        break;
    }
  }

  private showErrorToast(
    message: string = CONTACT_WIZARD_MESSAGES.CONTACT_WIZARD_ERROR_MSG
  ) {
    this.toastService.show(message, '', ToastState.ERROR, {
      position: 'bottom right',
      maxWidth: '350px',
    });
  }

  public save() {
    this.handleContactRequest('save');
  }

  public saveAndNew() {
    this.handleContactRequest('saveNew');
  }

  public launch() {
    this.handleContactRequest('launch');
  }

  resetSaveNew() {
    this.contactForm.get('firstName').setValue('');
    this.contactForm.get('lastName').setValue('');
    this.contactForm.get('emailAddress').setValue('');
  }

  getContactData() {
    let contact = {
      firstName: this.contactForm.get('firstName').value,
      lastName: this.contactForm.get('lastName').value,
      emailAddress: this.contactForm.get('emailAddress').value,
      ContactPublic:
        this.contactForm.get('isPublic').value === 'true' ? true : false,
      CompanyID: this.contactForm.get('companyName').value,
      ContactGroup: this.contactForm.get('groupList').value,
      GroupSecurityLevel: this.contactForm.get('groupRightList').value,
      ObjectTypeTypeID: ObjectTypeTypeID.CONTACT_OTTID,
    };
    return contact;
  }

  validateEmailAddress(emailAddress: string): boolean {
    const isValidEmail =
      emailAddress.trim() !== '' &&
      RegexPatterns.ValidEmailAddress.test(emailAddress);
    if (isValidEmail) {
      return true;
    }
    if (!isValidEmail) {
      this.toastService.show(
        CONTACT_WIZARD_MESSAGES.INVALID_Email_Address,
        '',
        ToastState.ERROR,
        {
          position: 'bottom right',
          maxWidth: '350px',
        }
      );
      this.saveClicked = false;
      this.disableButton = false;
      return false;
    }
  }

  public close() {
    this.dialogRef.close();
  }

  getId(
    componentName: string,
    uniqueName: string,
    elementType: string,
    componentType?: string
  ) {
    if (componentType != undefined)
      return `${componentName}-${componentType}-${uniqueName}-${elementType}`;
    else return `${componentName}-${uniqueName}-${elementType}`;
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
