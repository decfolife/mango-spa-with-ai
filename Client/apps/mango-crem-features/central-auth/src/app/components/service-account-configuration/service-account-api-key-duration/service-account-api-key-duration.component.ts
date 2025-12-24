import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import {
  ServiceAccountInfo,
  UpdateServiceAccountExpiresInDaysRequest,
} from '@mango/data-models/lib-data-models';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { ServiceAccountService } from '../../../services/service-account.service';

@Component({
  standalone: true,
  imports: [MatCardModule],
  selector: 'mango-service-account-api-key-duration',
  templateUrl: './service-account-api-key-duration.component.html',
  styleUrls: ['./service-account-api-key-duration.component.scss'],
})
export class ServiceAccountApiKeyDurationComponent implements OnDestroy {
  @Input() serviceAccountInfo: ServiceAccountInfo;
  @Output() apiKeyExpiresInDaysUpdated = new EventEmitter<boolean>();

  subs: Subscription[] = [];

  constructor(private serviceAccountService: ServiceAccountService) {}

  saveExpiresInDays(days: string) {
    const request: UpdateServiceAccountExpiresInDaysRequest = {
      expiresInDays: Number(days) === 0 ? null : Number(days),
    };

    this.subs.push(
      this.serviceAccountService
        .updateServiceAccountExpiresInDays(request)
        .subscribe((result) => {
          if (result) {
            this.apiKeyExpiresInDaysUpdated.emit(result);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
