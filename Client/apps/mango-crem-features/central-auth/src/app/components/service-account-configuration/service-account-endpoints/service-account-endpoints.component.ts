import {
  Component,
  Input,
  EventEmitter,
  OnDestroy,
  Output,
} from '@angular/core';
import {
  ServiceAccountEndpoint,
  ServiceAccountToggle,
} from 'libs/data-models/lib-data-models/src/lib/models/central-auth/service-account-info';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ServiceAccountService } from '../../../services/service-account.service';
import { UpdateServiceAccountEndPointAccessRequest } from '@mango/data-models/lib-data-models';

@Component({
  standalone: true,
  imports: [MatCardModule, MatSlideToggleModule, CommonModule],
  selector: 'mango-service-account-endpoints',
  templateUrl: './service-account-endpoints.component.html',
  styleUrls: ['./service-account-endpoints.component.scss'],
})
export class ServiceAccountEndpointsComponent implements OnDestroy {
  @Input() scopes: ServiceAccountEndpoint[];
  @Input() availableScopes: ServiceAccountEndpoint[];
  @Output() endPointAccessUpdated = new EventEmitter<boolean>();

  subs: Subscription[] = [];
  endpoints: ServiceAccountToggle[] = [];
  addScopes: string[] = [];
  removeScopes: string[] = [];

  constructor(private serviceAccountService: ServiceAccountService) {}

  ngOnInit() {
    this.scopes.forEach((i) =>
      this.endpoints.push({
        scopeName: i.scopeName,
        description: i.description,
        selected: true,
      })
    );
    this.availableScopes.forEach((i) =>
      this.endpoints.push({
        scopeName: i.scopeName,
        description: i.description,
        selected: false,
      })
    );
    this.endpoints.forEach(
      (i) =>
        (i.scopeName = i.scopeName
          .toLowerCase()
          .replace(/-/g, ' ')
          .replace('api.', '')
          .replace(/\b\w/g, (s) => s.toUpperCase()))
    );

    this.endpoints.sort((a, b) => {
      const scopeNameA = a.scopeName;
      const scopeNameB = b.scopeName;
      if (scopeNameA < scopeNameB) return -1;
      if (scopeNameA > scopeNameB) return 1;
      return 0;
    });
  }

  updateEndPointAccess(e: any, index: number) {
    if (e.checked)
      this.addScopes.push(
        'api.' +
          this.endpoints[index].scopeName.replace(/ /g, '-').toLowerCase()
      );
    else
      this.removeScopes.push(
        'api.' +
          this.endpoints[index].scopeName.replace(/ /g, '-').toLowerCase()
      );

    const request: UpdateServiceAccountEndPointAccessRequest = {
      addScopes: this.addScopes,
      removeScopes: this.removeScopes,
    };
    this.updateServiceAccountEndPointAccess(request);
  }

  private updateServiceAccountEndPointAccess(
    request: UpdateServiceAccountEndPointAccessRequest
  ) {
    this.subs.push(
      this.serviceAccountService
        .updateServiceAccountEndPointAccess(request)
        .subscribe((result) => {
          if (result) {
            this.endPointAccessUpdated.emit(result);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
