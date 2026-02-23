import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { DxDataGridModule } from 'devextreme-angular';
import { Observable, Subscription } from 'rxjs';
import { ServiceAccountHistory } from '@mango/data-models/lib-data-models';
import { ModalModule, ButtonModule } from '@mango/ui-shared/lib-ui-elements';
import { ClientDeliveryService } from '../../services/client-delivery.service';
import { ResetPasswordConfirmationComponent } from '../reset-password-confirmation/reset-password-confirmation.component';
import { UserMaintenanceService } from '../../../../../user-maintenance/src/app/components/user-maintenance/user-maintenance.service';
import { CremToastService } from '@mango/ui-shared/lib-ui-elements';
import { ToastState } from '@mango/data-models/lib-data-models';

@Component({
  standalone: true,
  imports: [CommonModule, ModalModule, ButtonModule, DxDataGridModule],
  selector: 'mango-service-account-details',
  templateUrl: './service-account-details.component.html',
  styleUrls: ['./service-account-details.component.scss'],
})
export class ServiceAccountDetailsComponent implements OnInit, OnDestroy {
  public modalTitle: string = 'Service Account Details';
  public closeButton = true;
  public closeOrCancelButtonText = 'Cancel';

  public emailAddress: string;
  public active: string;
  public changeHistoryData$: Observable<ServiceAccountHistory[]>;
  public columns: any;

  subs: Subscription[] = [];

  constructor(
    private userMaintenanceService: UserMaintenanceService,
    public dialogRef: MatDialogRef<ServiceAccountDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private service: ClientDeliveryService,
    private dialog: MatDialog,
    private toastService: CremToastService
  ) {}

  ngOnInit(): void {
    this.changeHistoryData$ =
      this.userMaintenanceService.getServiceAccountChangeHistory(
        this.data.contactId
      );

    this.changeHistoryData$.subscribe((data) => {
      if (data && data.length > 0) {
        this.active = this.data.contactActive ? 'Yes' : 'No';
        this.emailAddress = this.data.contactEmailAddress;
      } else {
        this.toastService.show(
          'Error fetching change history for this service account.',
          'Error',
          ToastState.ERROR
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  resetPassword() {
    let dialogRef = this.dialog.open(ResetPasswordConfirmationComponent, {
      width: '600px',
      panelClass: 'client-delivery-modal',
      data: this.data.contactEmailAddress,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.subs.push(
          this.service.resetPassword(this.emailAddress).subscribe((res) => {
            this.closeDialog();

            if (res && res === true) {
              this.toastService.show(
                'Password successfully reset for this service account.',
                'Success',
                ToastState.SUCCESS
              );
            } else {
              this.toastService.show(
                'Error resetting password for this service account.',
                'Error',
                ToastState.ERROR
              );
            }
          })
        );
      }
    });
  }

  public closeDialog() {
    this.dialogRef.close('');
  }
}
