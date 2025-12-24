import { Component } from '@angular/core';
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
import { MatDialogRef } from '@angular/material/dialog';
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

  constructor(
    public dialogRef: MatDialogRef<AddServiceAccountComponent>,
    private userMaintenanceService: UserMaintenanceService,
    private fb: FormBuilder,
    private clientDeliveryService: ClientDeliveryService
  ) {
    this.serviceAccountForm = this.fb.group({
      emailAddress: new FormControl('', [
        Validators.required,
        Validators.pattern(
          '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$'
        ),
      ]),
      //name: new FormControl('', [Validators.required]),
      //description: new FormControl('', [Validators.required]),
      //expires: new FormControl('90', [Validators.required]),
      //requestedScopes: new FormArray([]),
    });
  }

  ngOnInit() {
    this.clientDeliveryService.getScopes().subscribe((res) => {
      if (res && res.success) this.scopes = res.data;

      //this.scopes.forEach(() => { this.requestedScopesArray.push(new FormControl(false)) });
    });
  }

  get requestedScopesArray() {
    return this.serviceAccountForm.controls.requestedScopes as FormArray;
  }

  AddServiceAccount(rowFG: any) {
    let request: CreateClientRequest = {
      email: this.serviceAccountForm.get('emailAddress').value,
      //name: this.serviceAccountForm.get('name').value,
      //description: this.serviceAccountForm.get('description').value,
      //accessTokenLifetimeInSeconds: this.serviceAccountForm.get('expires').value
      //requestedScopes: this.serviceAccountForm.value.requestedScopes.map((j: any, i: number) => (j ? this.scopes[i].scopeName : null)).filter((j) => j !== null),
    };

    if (rowFG.valid) {
      let existingEmailAddresses: string[];
      this.userMaintenanceService.getServiceAccounts().subscribe((accounts) => {
        existingEmailAddresses = accounts.map(
          (account) => account.contactEmailAddress
        );

        if (existingEmailAddresses.includes(request.email)) {
          this.errorMsg = 'This email address already exists';
        } else {
          this.errorMsg = '';
          this.dialogRef.close(request);
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
