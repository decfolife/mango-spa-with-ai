import { Component, OnDestroy, OnInit } from '@angular/core';
import { AccountingSummaryService } from '../../services/accounting-summary.service';
import { Router, ActivatedRoute } from '@angular/router';
import { LeaseInfoResponse } from '../../models/lease-info-response.modal';
import { Subscription, combineLatest } from 'rxjs';
import { UserInfoResponse } from '@accounting-summary/models/user-info-response.modal';
import { AccountingEventSelector } from '@accounting-summary/models/interfaces/accounting-events-selector.interfaces';
import { WorkFlowStatusHistory } from '@accounting-summary/models/interfaces/workflow-status-history.interfaces';
import { WorkflowStatusInformation } from '@accounting-summary/models/interfaces/workflow-status-information.interface';
import { PortfolioSettingsResponse } from '@accounting-summary/models/portfolio-settings-response.modal';
import { AccountingToastService } from '@accounting-summary/services/accounting-toast.service';

@Component({
  selector: 'mango-accounts-summary',
  templateUrl: './accounts-summary.component.html',
  styleUrls: ['./accounts-summary.component.scss'],
})
export class AccountsSummaryComponent implements OnInit, OnDestroy {
  componentName = 'accounting-summary';
  readonly allowedPageSizes = ['all'];
  isAddButtonDisabled = true;
  eventSchedule: any;
  gridState: any;
  leaseInfoResponse: LeaseInfoResponse;
  portfolioSettings: PortfolioSettingsResponse;
  isLocked = false;
  isArchived = false;
  rightsInfo: any;
  wfStatusRights: any;
  userInfo: UserInfoResponse;
  workflowStatusInfo: WorkflowStatusInformation;
  workflowStatusHistory: WorkFlowStatusHistory;
  noUserAddRights = false;
  disableBtnReason =
    'Accounting Event cannot be added when user or lease information is not loaded.';
  isTooltipVisible = false;
  isChangeByTooltipVisible = false;
  private subscription = new Subscription();
  masterScheduleID: number;
  leaseRecognitionScheduleID: number;
  classificationID: number;
  modifiedByID: number;
  modifiedByName: string;
  modifiedDate: Date;
  modifiedDescription = '';
  modifiedComment = '';
  amortizationProfileName: string;
  classificationType: string;
  isAccountingEventEmpty: boolean;
  sendToExcelClicked = false;
  accountingEventSelector: AccountingEventSelector;
  leaseRecognitionScheduleIDs: number[];
  summaryServiceLock = false;

  constructor(
    public accountingSummaryService: AccountingSummaryService,
    public router: Router,
    private activatedRoute: ActivatedRoute,
    private accountingToastService: AccountingToastService
  ) {
    this.subscription.add(
      this.accountingSummaryService.lockAddButton.subscribe((lockAddButton) => {
        this.summaryServiceLock = lockAddButton;
        this.disableBtnReason = this.summaryServiceLock
          ? 'Accounting Event modification in progress.'
          : this.disableBtnReason;
      })
    );
  }

  ngOnInit(): void {
    this.getUserInfo();
    this.setRightsAndLeaseInfo();
    this.getWorkflowHistoryInfo();
    this.setWorkflowStatusRight();
    this.getPortfolioSettings();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  returnLeaseAbstractId(): number {
    return this.accountingSummaryService.getLeaseAbstractId();
  }

  getUserInfo() {
    this.subscription.add(
      this.accountingSummaryService.getUserInformation().subscribe((res) => {
        if (res === null) {
          this.accountingToastService.displayContactSystemAdminMessage();
        } else if (res.success) {
          this.userInfo = res.data;
        } else {
          this.accountingToastService.errorNotify(res.clientErrorMessage);
        }
      })
    );
  }

  getDisabledBtnReason() {
    this.isAddButtonDisabled =
      this.isLocked || this.isArchived || this.noUserAddRights;
    switch (this.isAddButtonDisabled) {
      case this.noUserAddRights:
        this.disableBtnReason =
          'Accounting Event cannot be added when user does not have Add rights.';
        break;
      case this.isLocked:
        this.disableBtnReason =
          'Accounting Event cannot be added when Lease is Locked.';
        break;
      case this.isArchived:
        this.disableBtnReason =
          'Accounting Event cannot be added when Lease is Archived.';
        break;
    }
  }

  onDataChanged(data: any) {
    this.amortizationProfileName = data.amortizationProfileName;
    this.classificationType = data.classificationType;
    this.isAccountingEventEmpty = data.isAccountingEventEmpty;
    this.classificationID = data.classificationID;
  }

  addEvent(event) {
    const queryString = window.location.search;
    if (queryString !== '') {
      const queryParamObj = {};
      const queryParamArray = queryString.substring(1).split('&');
      queryParamArray.forEach((qp) => {
        const nameValue = qp.split('=');
        queryParamObj[nameValue[0]] = nameValue[1];
      });
      this.router.navigate(['addEvent'], {
        state: {
          data: {
            leaseRecognitionScheduleID: this.leaseRecognitionScheduleID,
            accountingEventSelector: this.accountingEventSelector,
          },
          measureEvent: 'Initial',
        },
        relativeTo: this.activatedRoute,
        queryParams: queryParamObj,
      });
    }
  }

  sendToExcel(leaseRecognitionScheduleID): void {
    this.sendToExcelClicked = true;
    const fileName = this.accountingSummaryService.getFileName(
      'AccountingEventSummary'
    );
    this.subscription.add(
      this.accountingSummaryService
        .exportAccountingEventSummaryReport(
          leaseRecognitionScheduleID,
          fileName
        )
        .subscribe((response) => {
          this.sendToExcelClicked = false;
          if (!response?.data) {
            this.accountingToastService.errorNotify(
              'Downloading the Accounting Event Summary failed.'
            );
          } else {
            this.accountingSummaryService.downloadExcel(
              response.data,
              fileName
            );
          }
        })
    );
  }

  sendToExcelMain() {
    this.sendToExcel([this.leaseRecognitionScheduleID]);
  }

  selectedOption(event) {
    const selectedOption = event.trim();

    selectedOption === 'Send All to Excel'
      ? this.sendToExcel(this.leaseRecognitionScheduleIDs)
      : this.openConsolidatedReport();
  }

  openConsolidatedReport(): void {
    const leaseAbstractID = this.accountingSummaryService.getLeaseAbstractId();
    const leaseStatus = this.leaseInfoResponse.isActive ? 1 : 0;
    const portfolioID = this.portfolioSettings.masterGroupID;
    const v06URL = `${window?.location?.protocol}//${(() => {
      const parts = window?.location?.hostname.split('.') || [];
      if (parts.length > 2) parts.splice(1, 1);
      return parts.join('.');
    })()}`;

    const baseReportPath =
      '/Vp%20Reports/Client/Generic/Costar_AmortizationDetailConsolidated';

    const reportParam =
      baseReportPath +
      '%26rs:ClearSession=True' +
      `%26SystemStatus=${leaseStatus}` +
      `%26ObjectID=${leaseAbstractID}` +
      `%26Portfolio=${portfolioID}` +
      '%26DataSource=@DataSource' +
      '%26rs:DisplayName=CoStar%20Amortization%20Detail' +
      '%26UserID=@UserID';

    const reportURL =
      v06URL +
      `/v06/Reporting/ReportLaunchpad.aspx?reportobject=SQLRS05&report=${reportParam}`;
    window.open(
      reportURL,
      '_blank',
      'status=no,toolbar=no,menubar=no,location=no,resizable=1'
    );
  }

  onChangeByTooltipMouseOver() {
    this.isChangeByTooltipVisible = true;
  }

  onChangeByTooltipMouseLeave() {
    this.isChangeByTooltipVisible = false;
  }

  onMouseEnter() {
    if (this.isAddButtonDisabled) {
      this.isTooltipVisible = true;
    }
  }

  onMouseLeave() {
    this.isTooltipVisible = false;
  }

  onWorkflowStatusSaved(workflowStatusSaved: boolean) {
    if (workflowStatusSaved) {
      this.getWorkflowHistoryInfo();
      this.setWorkflowStatusRight();
    }
  }

  private getWorkflowHistoryInfo() {
    this.subscription.add(
      this.accountingSummaryService
        .getWorkflowStatusHistory()
        .subscribe((response) => {
          if (response === null) {
            this.accountingToastService.displayContactSystemAdminMessage();
          } else if (response.success) {
            this.workflowStatusHistory = response.data.map((item) => ({
              ...item,
              comment:
                typeof item.comment === 'string'
                  ? item.comment.replace(/\n\n/g, '<br>')
                  : item.comment,
            }));
            if (response.data.length > 0) {
              this.modifiedByID = this.workflowStatusHistory[0].modifiedBy;
              this.modifiedByName =
                this.workflowStatusHistory[0].modifiedByName ?? '';
              this.modifiedDate =
                this.workflowStatusHistory[0].modifiedDate ?? '';
              this.modifiedDescription =
                this.workflowStatusHistory[0]?.description ?? '';
              this.modifiedComment =
                this.workflowStatusHistory[0]?.comment ?? '';
            }
          } else if (!response.success) {
            this.accountingToastService.errorNotify(
              response.clientErrorMessage
            );
          }
        })
    );
  }

  setLeaseRecognitionScheduleID(
    emittedEvent: [
      eventSchedule: any,
      gridState: any,
      accountingEventSelector: any
    ]
  ) {
    this.leaseRecognitionScheduleIDs = emittedEvent[2]?.map(
      (item) => item.leaseRecognitionScheduleID
    );
    this.gridState = emittedEvent[1];
    this.eventSchedule = emittedEvent[0];
    this.accountingEventSelector = emittedEvent[2];
    this.leaseRecognitionScheduleID =
      emittedEvent[0].leaseRecognitionScheduleID;
  }

  private setRightsAndLeaseInfo() {
    const userNavPageRight =
      this.accountingSummaryService.getUserNavPageRight();
    const userNavPageWithLeaseRights =
      this.accountingSummaryService.getAccountingSummaryRights();
    const leaseInformation = this.accountingSummaryService.getLeaseInfo();
    this.subscription.add(
      combineLatest([
        userNavPageRight,
        userNavPageWithLeaseRights,
        leaseInformation,
      ]).subscribe((res) => {
        const userNavPageRightResponse = res[0];
        const userNavPageWithLeaseRightsResponse = res[1];
        const leaseInformationResponse = res[2];

        if (
          userNavPageRightResponse === null ||
          userNavPageWithLeaseRightsResponse === null ||
          leaseInformationResponse === null
        ) {
          this.accountingToastService.displayContactSystemAdminMessage();
        } else if (!userNavPageRightResponse.success) {
          this.accountingToastService.errorNotify(
            userNavPageRightResponse.clientErrorMessage
          );
        } else if (!userNavPageWithLeaseRightsResponse.success) {
          this.accountingToastService.errorNotify(
            userNavPageWithLeaseRightsResponse.clientErrorMessage
          );
        } else if (!leaseInformationResponse.success) {
          this.accountingToastService.errorNotify(
            leaseInformationResponse.clientErrorMessage
          );
        } else {
          this.noUserAddRights =
            !userNavPageWithLeaseRightsResponse.data.canAddSchedule;

          this.leaseInfoResponse = leaseInformationResponse.data;
          this.isLocked = this.leaseInfoResponse.lockedReason != null;
          this.isArchived = !this.leaseInfoResponse.isActive;

          this.accountingSummaryService.setIsLocked(this.isLocked);
          this.accountingSummaryService.setIsArchived(this.isArchived);

          //send data to the title lease info subject so that the title component gets updated. This will save an extra api call to getLeaseInfo.
          const leaseInfo = {
            leaseAbstractID: this.leaseInfoResponse.leaseAbstractID,
            leaseName: this.leaseInfoResponse.objectName,
            isLocked: this.isLocked,
            isArchived: this.isArchived,
            lockedReason: this.leaseInfoResponse.lockedReason,
            accountingType: this.leaseInfoResponse.accountingType,
            exchangeRateID: this.leaseInfoResponse.exchangeRateID,
            leaseRecognitionID: this.leaseInfoResponse.leaseRecognitionID,
          };

          this.accountingSummaryService.setLeaseInfo(leaseInfo);
          this.rightsInfo = {
            userHasEditLeaseRights:
              userNavPageWithLeaseRightsResponse.data.leaseSecurityType >= 4 &&
              userNavPageWithLeaseRightsResponse.data.leaseSecurityType !== 6,
            userHasLeftNavEditRights:
              userNavPageRightResponse.data >= 4 &&
              userNavPageRightResponse.data !== 6,
            userCanAddSchedule:
              userNavPageWithLeaseRightsResponse.data.canAddSchedule,
            userCanDeleteSchedule:
              userNavPageWithLeaseRightsResponse.data.canDeleteSchedule,
            canApproveJE: userNavPageWithLeaseRightsResponse.data.canApproveJE,
            canUnapproveJE:
              userNavPageWithLeaseRightsResponse.data.canUnapproveJE,
            canUnexportJE:
              userNavPageWithLeaseRightsResponse.data.canUnexportJE,
          };

          this.getDisabledBtnReason();
        }
      })
    );
  }

  private setWorkflowStatusRight() {
    const workflowStatusOptions =
      this.accountingSummaryService.getWorkflowStatusInformation();
    this.subscription.add(
      workflowStatusOptions.subscribe((workflowStatusOptionsResponse) => {
        if (workflowStatusOptionsResponse === null) {
          this.accountingToastService.displayContactSystemAdminMessage();
        } else if (!workflowStatusOptionsResponse.success) {
          this.accountingToastService.errorNotify(
            workflowStatusOptionsResponse.clientErrorMessage
          );
        } else {
          if (
            workflowStatusOptionsResponse.clientErrorMessage ===
            'SetToReviewWorkflowStatus'
          ) {
            this.getWorkflowHistoryInfo();
            this.accountingToastService.showToast(
              'Workflow Status',
              'The prior active lease status has been marked as inactive. Due to this the status has been changed to the active review status.',
              'info'
            );
          } else {
            this.accountingToastService.clearToastBySummary('Workflow Status');
          }
          this.workflowStatusInfo = workflowStatusOptionsResponse.data;
          this.wfStatusRights = {
            wfStatusallowJEApproval:
              workflowStatusOptionsResponse.data.options.filter(
                (wfso) =>
                  wfso.workflowStatusId ===
                  workflowStatusOptionsResponse.data.workflowStatusID
              )[0].allowJEApproval,
            wfStatusUserHasEditRights:
              workflowStatusOptionsResponse.data.options.filter(
                (wfso) =>
                  wfso.workflowStatusId ===
                  workflowStatusOptionsResponse.data.workflowStatusID
              )[0].allowScheduleEdit,
          };
        }
      })
    );
  }

  getPortfolioSettings() {
    this.subscription.add(
      this.accountingSummaryService
        .getPortfolioSettings()
        .subscribe((response) => {
          if (response === null) {
            this.accountingToastService.displayContactSystemAdminMessage();
          } else if (response.success) {
            this.accountingSummaryService.setPortfolioSettings(response.data);
            this.portfolioSettings = response.data;
          } else {
            this.accountingToastService.errorNotify(
              response.clientErrorMessage
            );
          }
        })
    );
  }
}
