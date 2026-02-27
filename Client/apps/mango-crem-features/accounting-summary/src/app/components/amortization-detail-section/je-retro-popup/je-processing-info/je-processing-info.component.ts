import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormattingService } from '@accounting-summary/services/formatting.service';
import { AmortizationGridColumnsService } from '@accounting-summary/services/amortization-grid-columns.service';
import { UserInfoResponse } from '@accounting-summary/models/user-info-response.modal';
import { Subscription } from 'rxjs';
import { DxDataGridComponent } from 'devextreme-angular';

@Component({
  selector: 'mango-je-processing-info',
  templateUrl: './je-processing-info.component.html',
  styleUrls: ['./je-processing-info.component.scss'],
})
export class JeProcessingInfoComponent
  implements OnChanges, OnInit, OnDestroy, AfterViewInit
{
  @ViewChild('JournalEntryProcessing')
  journalEntryProcessing: DxDataGridComponent;
  @Input() jeProcessingPopupData: any;
  @Input() userInfo: UserInfoResponse;
  @Input() amortizationdetailsGridData: any;
  @Input() eventScheduleData: any;
  @Input() rightsInfo: any;
  @Input() wfStatusRights: any;
  @Input() displayPeriodTitle: string;
  @Input() isPopupForRetroGridClick = false;

  jeProcessingGridColumns = [];
  showJournalEntries = false;
  componentName = 'je-processing-info';
  isEuroDateFormat = false;
  dateFormat = 'MM/dd/yyyy';
  displayNoDataText = 'Loading Data...';
  showActionButton = false;
  changeButtonText = '';
  isButtonDisabled = false;
  isTooltipVisible = false;
  disableBtnReason = '';
  showNoJeProfileSelected = false;
  actionsButtonId = '';
  private subscription = new Subscription();
  isLocked = false;
  isArchived = false;
  isActionButtonDisabled = false;

  constructor(
    public accountingSummaryService: AccountingSummaryService,
    public formattingService: FormattingService,
    public jeProcessingGridColumnsService: AmortizationGridColumnsService
  ) {}

  ngOnInit() {
    if (this.isPopupForRetroGridClick) {
      this.componentName = this.componentName + '-retro';
    }

    this.actionsButtonId = this.accountingSummaryService.getId(
      this.componentName,
      'ActionsButton',
      'button'
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    this.populateFields();
    this.jeProcessingInfoGridSetup();
  }

  onExporting(event) {
    const fileName = this.exportToExcelFileName();
    this.journalEntryProcessing.loadPanel.enabled = false;
    this.accountingSummaryService.exportToExcel(
      this.journalEntryProcessing.instance,
      fileName,
      'Sheet'
    );
  }

  ngAfterViewInit() {
    const findTitle = document.getElementsByTagName('crem-tab-item');
    Array.from(findTitle).forEach((element: HTMLElement) => {
      element.removeAttribute('title');
    });
  }

  private jeProcessingInfoGridSetup() {
    this.isEuroDateFormat = this.userInfo?.useDateEU;
    if (this.isEuroDateFormat) {
      this.dateFormat = 'dd.MM.yyyy';
    }
    this.jeProcessingGridColumns =
      this.jeProcessingGridColumnsService.getJournalEntryGridColumns();

    this.jeProcessingGridColumns.forEach((col) => {
      if (col.usesLocalFormat === 'true') {
        col.format = (value) =>
          this.formattingService.localFormat(
            +value,
            this.eventScheduleData.localCurrencyDecimalPrecision
          );
      }
      if (col.caption === 'Cost %') {
        col.format = (value) => this.formattingService.localFormat(+value, 4);
      }
    });
    return this.jeProcessingGridColumns;
  }

  populateFields() {
    this.displayNoDataText = 'Loading Data...';

    if (!this.eventScheduleData.isPublished) {
      this.showJournalEntries = false;
      this.showActionButton = false;

      return;
    }

    this.isLocked = this.accountingSummaryService.getIsLocked();
    if (this.isLocked) {
      this.isButtonDisabled = true;
      this.disableBtnReason =
        'This action cannot take place because the lease is Locked';
    }

    this.isArchived = this.accountingSummaryService.getIsArchived();
    if (this.isArchived) {
      this.isButtonDisabled = true;
      this.disableBtnReason =
        'This action cannot take place because the lease is Archived';
    }

    if (
      (this.jeProcessingPopupData.journalEntryProfileName === null ||
        this.jeProcessingPopupData.journalEntryProfileName === undefined) &&
      this.jeProcessingPopupData.jeStatus === 'Scheduled'
    ) {
      this.showNoJeProfileSelected = true;
      this.showActionButton = false;
      this.showJournalEntries = false;
      return;
    }

    switch (this.jeProcessingPopupData.jeStatus) {
      case 'Scheduled':
        if (!this.showNoJeProfileSelected) {
          this.changeButtonText = 'Approve';
          this.showJournalEntries = true;
          this.showActionButton = true;

          if (!this.isLocked && !this.isArchived) {
            this.isButtonDisabled = false;

            if (!this.wfStatusRights.wfStatusallowJEApproval) {
              this.isButtonDisabled = true;
              this.disableBtnReason =
                'Workflow status does not allow JE approval';
            } else if (!this.rightsInfo.canApproveJE) {
              this.showActionButton = true;
              this.isButtonDisabled = true;
              this.disableBtnReason = 'You do not have rights to Approve';
            } else if (this.eventScheduleData.isReportingException) {
              this.showActionButton = true;
              this.isButtonDisabled = true;
              this.disableBtnReason =
                'This accounting event is a reporting exception, which is excluded from journal entry processing.';
            } else if (
              !this.jeProcessingPopupData.journalEntries[0]?.isBalanced
            ) {
              this.showActionButton = true;
              this.isButtonDisabled = true;
              this.disableBtnReason =
                'Unbalanced Journal Entries cannot be approved here.';
            }
          }

          if (
            this.jeProcessingPopupData.journalEntries === null ||
            this.jeProcessingPopupData.journalEntries.length === 0
          ) {
            this.showJournalEntries = false;
          }
        }
        break;

      case 'Approved':
        this.changeButtonText = 'Unapprove';
        this.showJournalEntries = true;
        this.showActionButton = true;

        if (!this.isLocked && !this.isArchived) {
          this.isButtonDisabled = false;

          if (!this.rightsInfo.canUnapproveJE) {
            this.isButtonDisabled = true;
            this.disableBtnReason = 'You do not have rights to Unapprove';
          }
        }
        if (
          this.jeProcessingPopupData.journalEntries === null ||
          this.jeProcessingPopupData.journalEntries.length === 0
        ) {
          this.showJournalEntries = false;
        }

        break;

      case 'Exported':
        this.changeButtonText = 'Unexport';
        this.showJournalEntries = true;
        this.showActionButton = true;

        if (!this.isLocked && !this.isArchived) {
          this.isButtonDisabled = false;

          if (!this.rightsInfo.canUnexportJE) {
            this.isButtonDisabled = true;
            this.disableBtnReason = 'You do not have rights to Unexport';
          }
        }

        if (
          this.jeProcessingPopupData.journalEntries === null ||
          this.jeProcessingPopupData.journalEntries.length === 0
        ) {
          this.showJournalEntries = false;
        }
        break;
    }

    if (!this.jeProcessingPopupData.allowJEProcessing) {
      this.isButtonDisabled = true;
      this.disableBtnReason =
        'This action cannot take place because JE processing is not allowed for this period';
    }
  }

  actionButton() {
    this.isActionButtonDisabled = true;
    switch (this.changeButtonText) {
      case 'Approve':
        if (
          this.rightsInfo.canApproveJE &&
          this.wfStatusRights.wfStatusallowJEApproval
        ) {
          this.saveJournalEntryProcess(
            this.jeProcessingPopupData.leaseRecognitionPeriodID,
            this.changeButtonText
          );
        }
        break;

      case 'Unapprove':
        if (this.rightsInfo.canUnapproveJE) {
          this.saveJournalEntryProcess(
            this.jeProcessingPopupData.leaseRecognitionPeriodID,
            this.changeButtonText
          );
        }
        break;

      case 'Unexport':
        if (this.rightsInfo.canUnexportJE) {
          this.saveJournalEntryProcess(
            this.jeProcessingPopupData.leaseRecognitionPeriodID,
            this.changeButtonText
          );
        }
        break;
    }
  }

  saveJournalEntryProcess(periodID: number, actions: string) {
    this.subscription.add(
      this.accountingSummaryService
        .journalEntryProcess(periodID, actions)
        .subscribe((jeProcessResponse: any) => {
          if (jeProcessResponse === null) {
            this.accountingSummaryService.displayContactSystemAdminMessage();
            this.isActionButtonDisabled = false;
          } else if (jeProcessResponse.success) {
            switch (this.changeButtonText) {
              case 'Approve':
                this.accountingSummaryService.successNotify(
                  'Approved Successfully'
                );
                break;

              case 'Unapprove':
                this.accountingSummaryService.successNotify(
                  'Unapproved Successfully'
                );
                break;

              case 'Unexport':
                this.accountingSummaryService.successNotify(
                  'Unexported Successfully'
                );
                break;
            }
            this.accountingSummaryService.jeActionTaken$.next(true);
            this.isActionButtonDisabled = false;
          } else {
            this.accountingSummaryService.errorNotify(
              'The process failed. If the problem persists, please contact support.'
            );
            this.isActionButtonDisabled = false;
          }
        })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onMouseEnter() {
    if (this.isButtonDisabled) {
      this.isTooltipVisible = true;
    }
  }

  onMouseLeave() {
    this.isTooltipVisible = false;
  }

  setTabsHeight() {
    let element = document.getElementById('jeProcessingTab');
    let height = element.offsetHeight;
    console.log('Element is null: ', element == null ? 'true' : 'false');
    console.log('height: ' + height);
  }

  exportToExcelFileName(): string {
    const dateTimeStamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const formattedDisplayPeriodTitle = this.displayPeriodTitle.replace(
      /[\s-]/g,
      ''
    );
    const fileName = `Period_${formattedDisplayPeriodTitle}_Journal Entry_${dateTimeStamp}.xlsx`;
    return fileName;
  }

  localFormat = (value: number) =>
    this.formattingService.localFormat(
      +value,
      this.eventScheduleData.localCurrencyDecimalPrecision
    );

  customSummaryCalculation(options) {
    if (options.summaryProcess === 'start') {
      options.totalValue = 0;
      options.debits = 0;
      options.credits = 0;
    } else if (options.summaryProcess === 'calculate') {
      // Check for the debits and credits based on row data
      if (options.value.debitCredit === 'D') {
        options.debits += options.value.amount; // Add to debits
      } else if (options.value.debitCredit === 'C') {
        options.credits += options.value.amount; // Add to credits
      }

      // Depending on the summary name, perform the appropriate calculations
      switch (options.name) {
        case 'sumOfDebits':
          // Assign the accumulated debits to the total value
          options.totalValue = options.debits;
          break;
        case 'sumOfCredits':
          // Assign the accumulated credits to the total value
          options.totalValue = options.credits;
          break;
        case 'sumOfVariance':
          // Calculate the variance as the difference between debits and credits
          options.totalValue = options.debits - options.credits;
          break;
      }
    }
  }
}
