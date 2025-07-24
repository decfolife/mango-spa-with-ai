import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

import { AlertsService } from '../shared/service/alerts.service';
import { AlertCountAndSeverityLevel, ApiResponse } from '../shared/models';

import { format } from 'date-fns';

@Component({
  selector: 'mango-alerts-popup',
  templateUrl: './alerts-popup.component.html',
  styleUrls: ['./alerts-popup.component.scss'],
  // The popup needs this since the default Angular attribute encapsulation doesn't
  // work with the way the popup is injected into the DOM by DevExtreme. Instead,
  // the styles are encapsulated by an ID selector.
  encapsulation: ViewEncapsulation.None,
})
export class AlertsPopupComponent implements OnInit {
  @Input()
  leaseAbstractID: number;

  popupVisible = false;
  alertCount: number;
  severityLevel: string;
  cachedDate: Date;

  constructor(private alertsService: AlertsService) {}

  ngOnInit(): void {
    this.getAlertCountAndSeverityLevel();
  }

  openLeaseAlertsPopup(): void {
    this.popupVisible = true;
  }

  getButtonClass(): string {
    let classString =
      this.severityLevel === 'critical'
        ? 'danger'
        : this.severityLevel === 'high'
        ? 'warning'
        : 'button-info';

    if (this.alertCount === undefined || this.alertCount === 0) {
      classString += ' grey-button';
    }

    return classString;
  }

  getButtonText(): string {
    return `Alerts (${this.alertCount ?? '...'})`;
  }

  refreshButton(): void {
    this.alertCount = undefined;
    this.severityLevel = undefined;
    this.cachedDate = undefined;

    this.getAlertCountAndSeverityLevel();
    document.getElementById('openLeaseAlertsPopupButton').focus();
  }

  getCachedDateString(): string {
    if (this.cachedDate) {
      return this.alertsService.isEuroDateFormat
        ? 'Last updated ' + format(this.cachedDate, 'dd.MM.yyyy HH:mm:ss')
        : 'Last updated ' + format(this.cachedDate, 'M/d/yyyy h:mm:ss aa');
    }
    return '';
  }

  private getAlertCountAndSeverityLevel(): void {
    this.alertsService
      .getUndismissedLeaseAlertsStats(this.leaseAbstractID)
      .subscribe((response: ApiResponse) => {
        const res = response.data as AlertCountAndSeverityLevel;

        this.alertCount = res.alertCount;

        this.severityLevel = res.hasCritical
          ? 'critical'
          : res.hasHigh
          ? 'high'
          : 'warning';

        this.cachedDate = undefined;

        if (res.cachedDate) this.cachedDate = new Date(res.cachedDate);
      });
  }
}
