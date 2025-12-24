import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GenerateApiKeyConfirmationComponent } from '../generate-apikey-confirmation/generate-apikey-confirmation.component';
import { CopyClipboardMessageComponent } from '../copy-clipboard-message/copy-clipboard-message.component';
import { Subscription } from 'rxjs';
import { ServiceAccountInfo } from '@mango/data-models/lib-data-models';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { ServiceAccountService } from '../../../services/service-account.service';

@Component({
  standalone: true,
  imports: [MatCardModule, CommonModule, MatDialogModule],
  selector: 'mango-service-account-api-keys',
  templateUrl: './service-account-api-keys.component.html',
  styleUrls: ['./service-account-api-keys.component.scss'],
})
export class ServiceAccountApiKeysComponent {
  @Input() serviceAccountInfo: ServiceAccountInfo;
  @Output() apiKeyUpdated = new EventEmitter<boolean>();

  subs: Subscription[] = [];

  constructor(
    private serviceAccountService: ServiceAccountService,
    private dialog: MatDialog
  ) {}

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  generateApiKey() {
    let dialogRef = this.dialog.open(GenerateApiKeyConfirmationComponent, {
      width: '600px',
      panelClass: 'client-delivery-modal',
      data: {},
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.subs.push(
          this.serviceAccountService
            .generateClientSecret()
            .subscribe((result) => {
              if (result) {
                this.apiKeyUpdated.emit(result);
                this.dialog.open(CopyClipboardMessageComponent, {
                  width: '650px',
                  height: '350px',
                  panelClass: 'client-delivery-modal',
                  data: {
                    apikey: result.data,
                  },
                  disableClose: true,
                });
              }
            })
        );
      }
    });
  }
}
