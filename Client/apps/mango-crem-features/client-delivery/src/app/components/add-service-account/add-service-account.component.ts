import { Component, Inject } from '@angular/core';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { UtilitiesService } from '@mango/core-shared';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ModalModule, ButtonModule } from '@mango/ui-shared/lib-ui-elements';
import { UserMaintenanceService } from '../../../../../user-maintenance/src/app/components/user-maintenance/user-maintenance.service';
import { ClientDeliveryService } from '@service-accounts/services/client-delivery.service';
import { Api } from '@mango/data-models/lib-data-models';
import {
  CreateClientRequest,
  ClientScope,
} from '@mango/data-models/lib-data-models';
import { CommonModule } from '@angular/common';
import { CheckBoxComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/checkbox';
import { CremToastService } from '@mango/ui-shared/lib-ui-elements';
import { ToastState } from '@mango/data-models/lib-data-models';

@Component({
  standalone: true,
  imports: [
    ModalModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CommonModule,
    CheckBoxComponent,
  ],
  providers: [UserMaintenanceService, UtilitiesService],
  selector: 'mango-add-service-account',
  templateUrl: './add-service-account.component.html',
  styleUrls: ['./add-service-account.component.scss'],
})
export class AddServiceAccountComponent {
  modalTitle: 'Service Account Setup';
  serviceAccountForm: FormGroup;
  isEmailValid: boolean = false;
  errorMsg: string = '';
  authentication: string = UtilitiesService.getBaseApiUrl(Api.authentication);
  scopes: ClientScope[];
  serviceAccounts: any;

  constructor(
    public dialogRef: MatDialogRef<AddServiceAccountComponent>,
    private fb: FormBuilder,
    private clientDeliveryService: ClientDeliveryService,
    private toastService: CremToastService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.serviceAccountForm = this.fb.group({
      emailAddress: new FormControl('', [
        Validators.required,
        Validators.pattern(
          '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$'
        ),
      ]),
    });
  }

  ngOnInit() {
    this.serviceAccounts = this.data.serviceAccounts;
  }

  get requestedScopesArray() {
    return this.serviceAccountForm.controls.requestedScopes as FormArray;
  }

  AddServiceAccount(rowFG: any) {
    let request: CreateClientRequest = {
      email: this.serviceAccountForm.get('emailAddress').value,
    };

    const emailExists =
      this.serviceAccounts.filter(
        (account: any) => account.contactEmailAddress === request.email
      ).length > 0;

    if (emailExists) {
      this.errorMsg = 'This email address already exists.';
      return;
    }

    if (rowFG.valid) {
      this.clientDeliveryService.addServiceAccount(request).subscribe((res) => {
        if (res.success) {
          this.errorMsg = '';
          this.toastService.show(
            'Service account successfully added.',
            'Success',
            ToastState.SUCCESS
          );

          this.dialogRef.close(request);
        } else {
          this.errorMsg =
            'Failed to create the service account. Please try again or contact your administrator.';
        }
      });
    } else {
      this.errorMsg =
        request.email.length === 0
          ? 'Email address is required'
          : 'Email address is not in correct format';
    }
  }
}
