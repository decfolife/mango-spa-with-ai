import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService, UserService } from '@mango/core-shared';
import {
  ButtonModule,
  DropdownModule,
  ModalModule,
  InputComponent,
  IconModule,
  ToggleSliderComponent,
  CremFormsModule,
  CremToastService,
} from '@mango/ui-shared/lib-ui-elements';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { passwordMatchValidator } from '../../../../../../../apps/mango-crem-features/central-auth/src/app/components/reset-password/password-validator';
import { StartPage, ToastState } from '@mango/data-models/lib-data-models';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'mango-user-preferences',
  standalone: true,
  templateUrl: './user-preferences.component.html',
  styleUrls: ['./user-preferences.component.scss'],
  imports: [
    CommonModule,
    ModalModule,
    ButtonModule,
    DropdownModule,
    InputComponent,
    FontAwesomeModule,
    IconModule,
    ToggleSliderComponent,
    ReactiveFormsModule,
    CremFormsModule,
  ],
})
export class UserPreferencesComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<UserPreferencesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private facade: MangoAppFacade,
    private formBuilder: UntypedFormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private toastService: CremToastService
  ) {}

  private contactInfo;
  private clientKey;
  public userPreferencesForm: UntypedFormGroup;
  public updatePasswordForm: UntypedFormGroup;
  public dateTypes = [
    { display: 'mm/dd/yyyy', value: 0 },
    { display: 'dd.mm.yyyy', value: 1 },
  ];
  public measurements;
  public currencyMappings;
  public possibleStartPages;
  public userPreferences;
  public quickSearchModules;
  public isPasswordEnabled = false;
  //temporary workaround since shared component display not working
  public dateStyleValue;
  public initialStartPageValue;

  ngOnInit(): void {
    this.facade.contactRecord$.subscribe((c) => {
      // For reference, 'requireSSO' is 'Allow Normal Login' parameter on V06
      this.isPasswordEnabled = !c.requireSSO;
      this.userPreferences = c.preferences;
      this.contactInfo = c;
      this.initialStartPageValue =
        c.preferences.contactStartPage == null
          ? ''
          : c.preferences.contactStartPage.split('|')[1];
    });
    this.userService.currencyMappingTable$.subscribe((cmt) => {
      this.currencyMappings = cmt.sort((a, b) =>
        a.currencyName.localeCompare(b.currencyName)
      );
    });
    this.userService
      .getPossibleUserStartPages()
      .subscribe((startPages: StartPage[]) => {
        this.possibleStartPages = startPages.sort((a, b) =>
          a.pageName.localeCompare(b.pageName)
        );
      });
    this.userService.getMeasurementUnits().subscribe((measurementunits) => {
      this.measurements = measurementunits.sort((a, b) =>
        a.measureUnitType.localeCompare(b.measureUnitType)
      );
    });
    this.userService.getUserQuickSearchModules().subscribe((modules) => {
      this.quickSearchModules = modules.data.sort((a, b) =>
        a.objectTypeType.localeCompare(b.objectTypeType)
      );

      const existModule = modules.data.find(
        (x: { objectTypeTypeId: any }) =>
          x.objectTypeTypeId ===
          this.userPreferences.defaultQuickSearchObjectTypeTypeID
      );
      if (
        !this.userPreferences.defaultQuickSearchObjectTypeTypeID ||
        !existModule
      ) {
        this.userPreferences.defaultQuickSearchObjectTypeTypeID = 99;
      }
    });

    this.facade.clientKey$.subscribe((k) => (this.clientKey = k));
    this.createForm();
  }

  savePreferences(): void {
    let showingError = false;
    if (
      (this.isPasswordEnabled &&
        this.checkPasswordFormChanges() &&
        !this.checkPasswordFormFilled()) ||
      !this.checkPreferencesFormFilled()
    ) {
      this.toastService.show(
        'Please fill in all required fields.',
        'Error',
        ToastState.ERROR,
        { duration: 5000 }
      );
      showingError = true;
      return;
    } else if (
      this.isPasswordEnabled &&
      this.checkPasswordFormChanges() &&
      this.checkPasswordFormFilled() &&
      !this.updatePasswordForm.valid
    ) {
      this.toastService.show(
        'The new password and confirm password do not match. Please try again.',
        'Error',
        ToastState.ERROR,
        { duration: 5000 }
      );
      showingError = true;
      return;
    }

    if (
      this.isPasswordEnabled &&
      this.updatePasswordForm.valid &&
      this.checkPasswordFormChanges() &&
      this.checkPasswordFormFilled()
    ) {
      this.authService
        .changePassword({
          email: this.contactInfo.email,
          newPassword: this.updatePasswordForm.value.password,
          oldPassword: this.updatePasswordForm.value.currentPassword,
          confirmNewPassword: this.updatePasswordForm.value.confirmPassword,
          contactId: this.contactInfo.contactID,
          clientKey: this.clientKey,
        })
        .pipe(
          catchError((error) => {
            this.toastService.show(
              error.error.message ? error.error.message : error.error.title,
              'Error',
              ToastState.ERROR,
              { duration: 15000 }
            );
            showingError = true;
            return error;
          })
        )
        .subscribe(() => {});
    }

    let startPageValue =
      Array.isArray(this.userPreferencesForm.value.startPage) &&
      this.userPreferencesForm.value.startPage.length > 0
        ? this.userPreferencesForm.value.startPage[0]
        : this.userPreferencesForm.value.startPage;

    let startPageModule = this.possibleStartPages.find(
      (page) => (page.pagePath = startPageValue)
    ).moduleID;
    this.userService
      .updateUserPreferences({
        //temporary workaround since shared component display isnt working
        contactDatesEU: Boolean(this.dateStyleValue),
        contactConsolidatedEmails: Boolean(
          this.userPreferencesForm.value.consolidateProjectEmails
        ),
        contactCurrency: this.userPreferencesForm.value.currency[0],
        contactMeasurements: Array.isArray(
          this.userPreferencesForm.value.measurement
        )
          ? this.userPreferencesForm.value.measurement[0]
          : this.userPreferencesForm.value.measurement,
        contactStartPage: String(startPageModule) + '|' + startPageValue,
        contactRequireSSO: !this.isPasswordEnabled, // Same as 'c.requireSSO', which is why it is reverted to the opposite value of contactExcludedSSO.
        defaultQuickSearchObjectTypeTypeID:
          this.userPreferencesForm.value.quickSearchModule[0],
      })
      .subscribe(() => {
        if (!showingError) {
          this.toastService.show(
            'Settings saved successfully.',
            'Success',
            ToastState.SUCCESS,
            { duration: 3000 }
          );
        }
        this.userService
          .getContactRecord(this.contactInfo.contactID)
          .subscribe((cr) => this.facade.updateContactRecord(cr));
        this.dialogRef.close();
      });
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  createForm() {
    this.updatePasswordForm = this.formBuilder.group(
      {
        currentPassword: [''],
        password: [''],
        confirmPassword: [''],
      },
      { validator: passwordMatchValidator }
    );
    this.userPreferencesForm = this.formBuilder.group({
      dateStyle: [this.userPreferences.contactDatesEU ? 1 : 0],
      measurement: [this.userPreferences.contactMeasurements],
      currency: [this.userPreferences.contactCurrency],
      startPage: [this.initialStartPageValue],
      consolidateProjectEmails: [
        this.userPreferences.contactConsolidatedEmails,
      ],
      quickSearchModule:
        this.userPreferences.defaultQuickSearchObjectTypeTypeID,
    });
  }

  checkPasswordFormChanges(): boolean {
    return !(
      this.updatePasswordForm.controls.currentPassword.value === '' &&
      this.updatePasswordForm.controls.confirmPassword.value === '' &&
      this.updatePasswordForm.controls.password.value === ''
    );
  }

  checkPasswordFormFilled(): boolean {
    return (
      this.updatePasswordForm.controls.currentPassword.value !== '' &&
      this.updatePasswordForm.controls.confirmPassword.value !== '' &&
      this.updatePasswordForm.controls.password.value !== ''
    );
  }

  checkPreferencesFormFilled(): boolean {
    return (
      this.dateStyleValue != -1 &&
      this.userPreferencesForm.controls.measurement.value.length > 0 &&
      this.userPreferencesForm.controls.startPage.value.length > 0 &&
      this.userPreferencesForm.controls.currency.value.length > 0
    );
  }

  //temporary workaround since shared component display not working
  dateStyleChanged(event: any) {
    if (event.length > 0) {
      this.dateStyleValue = event[0].value;
    } else {
      this.dateStyleValue = -1;
    }
  }
}
