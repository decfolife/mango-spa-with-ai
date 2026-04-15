import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import { DatePipe } from '@angular/common';
import { UserInfoResponse } from '@accounting-summary/models/user-info-response.modal';
import { AccountingToastService } from '@accounting-summary/services/accounting-toast.service';

@Component({
  selector: 'mango-je-retro-popup',
  templateUrl: './je-retro-popup.component.html',
  styleUrls: ['./je-retro-popup.component.scss'],
})
export class JeRetroPopupComponent implements OnInit, OnChanges, OnDestroy {
  @Input() amortizationGridRowClickEvent: any;
  @Input() eventScheduleData: any;
  @Input() gridColumnsForRetroPopup: any[];
  @Input() rightsInfo: any;
  @Input() wfStatusRights: any;
  @Input() userInfo: UserInfoResponse;
  @Input() classificationType: string;
  @Input() amortizationProfileName: string;
  @Input() isPopupForRetroGridClick = false;
  @Input() newRetroEventJeStatus = '';
  @Input() showPaymentTabOnPeriodPopup = true;
  @Output() jeRetroPopupClosedEvent: EventEmitter<any> = new EventEmitter();
  @Output() retroAdjustmentGridRowClickEvent: EventEmitter<any> =
    new EventEmitter();

  activeTabIndex = 0;
  dateFormat = 'MM/dd/yyyy';
  displayPeriodTitle: string;
  showRetroScheduleTab = false;
  jeRetroPopupVisible = false;
  jeProcessingPopupData: any;
  jePopupTitle: string;
  jePaymentPopupData: any;
  componentName = 'amortization-period-popup';
  retrospectiveAdjustmentPopupData: any;
  tabs: any[] = null;
  private subscription = new Subscription();

  constructor(
    public accountingSummaryService: AccountingSummaryService,
    private accountingToastService: AccountingToastService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.accountingSummaryService.jeActionTaken$.subscribe(
        (jeActionTaken) => {
          if (jeActionTaken && this.jeProcessingPopupData) {
            this.getJeProcessingPopupData(
              this.jeProcessingPopupData?.leaseRecognitionPeriodID
            );
          }
        }
      )
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.retrospectiveAdjustmentPopupData = null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      !!changes.amortizationGridRowClickEvent &&
      changes.amortizationGridRowClickEvent.currentValue !== undefined
    ) {
      this.setupJeRetroPopup(this.amortizationGridRowClickEvent);
    }

    if (!!changes.userInfo && changes.userInfo.currentValue !== undefined) {
      if (this.userInfo?.useDateEU) {
        this.dateFormat = 'dd.MM.yyyy';
      }
    }

    if (
      !!changes.newRetroEventJeStatus &&
      changes.newRetroEventJeStatus.currentValue !== undefined &&
      changes.newRetroEventJeStatus.currentValue !== ''
    ) {
      const foundEvent = this.retrospectiveAdjustmentPopupData.find(
        (ret) => ret.jeStatus !== null
      );
      foundEvent.jeStatus = changes.newRetroEventJeStatus.currentValue;
    }
  }

  onRetroAdjustmentGridRowClick(event) {
    this.retroAdjustmentGridRowClickEvent.emit(event);
  }

  onTabChange(e) {
    this.activeTabIndex = e;
  }

  setupJeRetroPopup(event: any) {
    const { leaseRecognitionPeriodID, displayPeriod, periodStart, periodEnd } =
      event.data;
    this.showRetroScheduleTab =
      this.eventScheduleData.retroScheduleID &&
      event.data.scheduleIndex === this.eventScheduleData.scheduleIndex &&
      event.data.isImpactedByRetro &&
      (this.eventScheduleData.adjustment ||
        this.eventScheduleData.adjustment === 0 ||
        this.eventScheduleData.functional_AssetAdjustmentAmount ||
        this.eventScheduleData.functional_AssetAdjustmentAmount === 0 ||
        this.eventScheduleData.liabilityAdjustmentAmount ||
        this.eventScheduleData.liabilityAdjustmentAmount === 0);

    this.tabs = [{ title: 'Journal Entry', template: 'jeProcessingData' }];
    this.getJeProcessingPopupData(leaseRecognitionPeriodID);

    if (!this.isPopupForRetroGridClick) {
      this.tabs.push({
        title: 'Payment Detail',
        template: 'paymentDetailData',
      });
      this.getJePaymentPopupData(leaseRecognitionPeriodID);

      if (this.showRetroScheduleTab) {
        this.tabs.push({
          title: 'Retrospective Adjustment',
          template: 'retrospectiveAdjustmentData',
        });
        this.getRetrospectiveAdjustmentPopupData(
          this.eventScheduleData.retroScheduleID
        );
      }
    }

    this.jeRetroPopupVisible = true;
    const formattedStart = this.datePipe.transform(
      periodStart,
      this.dateFormat
    );
    const formattedEnd = this.datePipe.transform(periodEnd, this.dateFormat);
    displayPeriod === 'Beginning Balance'
      ? (this.jePopupTitle = `Period: ${displayPeriod}`)
      : (this.jePopupTitle = `Period: ${displayPeriod} (${formattedStart}${
          formattedEnd ? ' - ' + formattedEnd : ''
        })`);

    this.displayPeriodTitle = displayPeriod;
  }

  closePopup() {
    this.jeRetroPopupVisible = !this.jeRetroPopupVisible;
    const copyOfJeProcessingPopupData = JSON.parse(
      JSON.stringify(this.jeProcessingPopupData)
    );
    this.jeRetroPopupClosedEvent.emit(copyOfJeProcessingPopupData);
    this.jeProcessingPopupData = null;
    this.activeTabIndex = 0;
    this.retrospectiveAdjustmentPopupData = null;
  }

  onJeRetroPopupHidden() {
    this.jeRetroPopupVisible = false;
    const copyOfJeProcessingPopupData = JSON.parse(
      JSON.stringify(this.jeProcessingPopupData)
    );
    this.jeRetroPopupClosedEvent.emit(copyOfJeProcessingPopupData);
    this.jeProcessingPopupData = null;
  }

  private getJeProcessingPopupData(leaseRecognitionPeriodID: number) {
    const jeProcessingDetails =
      this.accountingSummaryService.getJeProcessingPopupData(
        leaseRecognitionPeriodID
      );

    this.subscription.add(
      jeProcessingDetails.subscribe((res) => {
        const jeProcessingDetailsResponse = res;

        if (jeProcessingDetailsResponse === null) {
          this.accountingToastService.displayContactSystemAdminMessage();
        } else if (!jeProcessingDetailsResponse.success) {
          this.accountingToastService.errorNotify(
            jeProcessingDetailsResponse.clientErrorMessage
          );
        } else {
          this.jeProcessingPopupData = jeProcessingDetailsResponse.data;
        }
      })
    );
  }

  private getJePaymentPopupData(leaseRecognitionPeriodID: number) {
    const jePaymentDetails =
      this.accountingSummaryService.getJePaymentPopupData(
        leaseRecognitionPeriodID
      );

    this.subscription.add(
      jePaymentDetails.subscribe((res) => {
        const jePaymentDetailsResponse = res;

        if (jePaymentDetailsResponse === null) {
          this.accountingToastService.displayContactSystemAdminMessage();
        } else if (!jePaymentDetailsResponse.success) {
          this.accountingToastService.errorNotify(
            jePaymentDetailsResponse.clientErrorMessage
          );
        } else {
          this.jePaymentPopupData = jePaymentDetailsResponse.data;
        }
      })
    );
  }

  private getRetrospectiveAdjustmentPopupData(leaseRecognitionScheduleID) {
    this.subscription.add(
      this.accountingSummaryService
        .getAmortizationDetails(leaseRecognitionScheduleID)
        .subscribe((response: any) => {
          if (response === null) {
            this.accountingToastService.displayContactSystemAdminMessage();
          } else if (response.success) {
            this.retrospectiveAdjustmentPopupData = response.data;
          } else {
            this.accountingToastService.errorNotify(
              response.clientErrorMessage
            );
          }
        })
    );
  }
}
