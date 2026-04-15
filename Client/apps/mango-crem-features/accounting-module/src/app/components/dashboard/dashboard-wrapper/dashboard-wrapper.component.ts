import { InAppDisclosureService } from '@accounting-dashboard/services/in-app-disclosure.service';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { Subscription, timer } from 'rxjs';

import { UserSettingsComponent } from '../modal/user-settings/user-settings.component';
import { WorkflowAndAlertsComponent } from '../views/workflow-and-alerts/workflow-and-alerts.component';
import { MangoDisclosureViewComponent } from '../view/disclosure-dashboard-view.component';
import { switchMap, tap } from 'rxjs/operators';
import { LargeModal } from '@mangoSpa/src/assets/enum/modal.model';
import {
  DashboardConfig,
  ToastState,
} from '@mango/data-models/lib-data-models';
import { CreateSegmentComponent } from '@reports/components/modal/create-segment/create-segment.component';

import { ModuleDropdownUtil } from 'libs/ui-shared/lib-ui-elements/src/lib/dropdown/util/module.util';
import {
  selectBoxMenuItems,
  byItemMoreMenuOptions,
} from 'libs/ui-shared/lib-ui-elements/src/lib/dropdown/definitions';
import { ReportsService } from '@reports/services/reports.service';
import { UserService } from '@mango/core-shared';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { environment } from '@mangoSpa/src/environments/environment.local';
import { AccountingToastService } from '@accounting-summary/services/accounting-toast.service';

export interface DropdownSelection {
  // Todo: Move to type definition file
  display: string;
  id: number;
}
export interface AccountingViewData {
  id: number;
  displayValue: string;
}

@Component({
  selector: 'mango-dashboard-wrapper',
  templateUrl: './dashboard-wrapper.component.html',
  styleUrls: ['./dashboard-wrapper.component.scss'],
})
export class DashboardWrapperComponent implements OnInit, OnDestroy {
  public featureFlagEnabled = false as boolean;
  public accountingViewData: AccountingViewData[] = [];
  public accountingYearData: any[] = [];
  public accountingSegmentData: any[] = [];
  public selectedSegment: number;
  public appliedSegment: number;
  public selectedView = 1 as number;
  public selectedYear = 2022 as number;
  public loading = true as boolean;
  public criteriaSet: number;
  public workflowAlertsCriteriaSet: number;
  _subs$: Subscription[] = [];
  public hasSegmentDeleteRight: boolean;
  public hasSegmentsAddRight: boolean;
  public hasSegmentsViewRight: boolean;
  public isSegmentEdited = false as boolean;
  public editingSegment: number;
  public selectedCurrency: string;
  private isLowerEnvironment = false;

  /**
   * For the export button, changes the state of the button
   */
  public exportingReport = false as boolean;

  public moreMenuSegment: any;

  // itemMenuInnerOptions: Initial structure for the segment 'more menu' or ellipsis
  itemMenuInnerOptions: selectBoxMenuItems;

  // bySegmentMoreMenuOptions: Once itemMenuInnerOptions is provided 'prepareMoreMenu'
  // creates a menu for each segment with the right data, e.g. permissions or rights
  bySegmentMoreMenuOptions: byItemMoreMenuOptions;

  @ViewChild(WorkflowAndAlertsComponent) workflowAndAlertsComponent;

  viewConfiguration: DashboardConfig;
  @ViewChild(MangoDisclosureViewComponent) MangoDisclosureASCAnnually;
  @ViewChild(MangoDisclosureViewComponent) MangoDisclosureASCQuarterly;
  @ViewChild(MangoDisclosureViewComponent) MangoDisclosureIFRSAnnually;
  @ViewChild(MangoDisclosureViewComponent) MangoDisclosureIFRSQuarterly;

  constructor(
    private inAppDisclosureService: InAppDisclosureService,
    private reportsService: ReportsService,
    private userService: UserService,
    private facade: MangoAppFacade,
    public dialog: MatDialog,
    private toastService: AccountingToastService
  ) {
    this.itemMenuInnerOptions = [
      // todo: This needs to be moved to a conf file
      {
        type: 'menu',
        name: 'Make Default',
        attribute: 'segmentID',
        action: () =>
          this.setDefaultSegment(
            this.moreMenuSegment.segmentID,
            this.selectedView == 1
              ? this.workflowAlertsCriteriaSet
              : this.criteriaSet
          ),
        stopPropagation: true,
        transform: [
          {
            comparingKey: 'default',
            operator: '=',
            comparingValue: 1,
            disabled: true,
            title: 'This segment is already the default option.',
          },
        ],
      },
      {
        type: 'separator',
      },
      {
        type: 'menu',
        name: 'Edit',
        attribute: 'segmentID',
        action: () => this.edit(this.moreMenuSegment),
        stopPropagation: false,
        transform: [
          {
            comparingKey: 'activeRecordsVisibleToMe',
            operator: '=',
            comparingValue: true,
            title:
              'This segment is automatically generated and includes all records accessible to you.',
            disabled: true,
          },
          {
            comparingKey: 'securityTypeID',
            operator: '<',
            comparingValue: 4,
            name: 'View',
          },
          {
            comparingKey: 'securityTypeID',
            operator: '>=',
            comparingValue: 4,
            name: 'Edit',
          },
        ],
        // deprecated option: 'dataTransformer' and 'comparingValue',  use the 'transform' option instead
        comparingValue: 'rights',
        dataTransformer: [
          { condition: 'View', name: 'View' },
          { condition: 'Edit', name: 'Edit' },
          { condition: 'Delete', name: 'Edit' },
        ],
      },
      {
        type: 'separator',
      },
      {
        type: 'menu',
        name: 'Archive',
        attribute: 'segmentID',
        action: () => this.archiveAction(this.moreMenuSegment),
        stopPropagation: false,
        // Possible Responses: 1 Restricted View | 2 View | 3 Add | 4 Edit | 5 delete | 6 Block
        transform: [
          {
            comparingKey: 'securityTypeID',
            operator: '=',
            comparingValue: 4,
            disabled: true,
            title:
              'You have Edit rights to this segment. Ask your administrator to grant you Delete rights to archive this segment.',
          },
          {
            comparingKey: 'securityTypeID',
            operator: '=',
            comparingValue: 2,
            disabled: true,
            title:
              'You have View rights to this segment. Ask your administrator to grant you Delete rights to archive this segment.',
          },
        ],
      },
    ];
  }

  ngOnInit() {
    this.isLowerEnvironment = ['DEV', 'TEST'].includes(environment.name);
    this.selectedYear = new Date().getFullYear();
    this.featureFlagEnabled = true;

    this._subs$.push(
      this.inAppDisclosureService
        .getAccountingClassifications()
        .subscribe((r) => {
          const disclosureOptions = [
            // TODO: This data structure should fully come prepared from the API
            {
              condition: true,
              data: [{ id: 1, displayValue: 'Workflow and Alerts' }],
            },
            {
              condition: r.data.isASCActive,
              data: [
                { id: 2, displayValue: 'ASC 842 Annual Disclosures' },
                { id: 3, displayValue: 'ASC 842 Quarterly Disclosures' },
              ],
            },
            {
              condition: r.data.isIFRSActive,
              data: [
                { id: 4, displayValue: 'IFRS 16 Annual Disclosures' },
                { id: 5, displayValue: 'IFRS 16 Quarterly Disclosures' },
              ],
            },
          ];
          disclosureOptions.forEach((e) => {
            if (e.condition) {
              this.accountingViewData.push(...e.data);
            }
          });
          this.loading = false;
        })
    );

    this._subs$.push(
      this.inAppDisclosureService
        .getAccountingCriteriaSets()
        .subscribe((result) => {
          // TODO: Avoid direct subscriptions in nested callbacks, unify subscriptions with forkJoin or combineLatest for related streams
          this.criteriaSet = result.data[0].CriteriaSetID;

          if (result.data.length <= 1) {
            this.loading = false;
            return;
          }

          this.workflowAlertsCriteriaSet = result.data[1].CriteriaSetID;
          const observableItem = this.inAppDisclosureService
            .getSegments(
              this.selectedView == 1
                ? this.workflowAlertsCriteriaSet
                : this.criteriaSet,
              false
            )
            .subscribe((r) => {
              this.accountingYearData = [];
              for (let i = 10; i > -11; i--) {
                this.accountingYearData.push({
                  value: this.selectedYear + i,
                });
              }
              //fetch criteriaSetID for each view;
              this.accountingSegmentData = this.prepareSegmentDropdown(r.data);
              this.bySegmentMoreMenuOptions =
                ModuleDropdownUtil.prepareMoreMenu(
                  this.accountingSegmentData,
                  this.itemMenuInnerOptions
                );
              this.selectedSegment =
                this.accountingSegmentData?.find((s) => s.default === 1)
                  ?.segmentID || this.accountingSegmentData?.[0].segmentID;
              this.appliedSegment = this.selectedSegment;
              this.loading = false;
            });
          this._subs$.push(observableItem);
        })
    );
    this._subs$.push(
      this.reportsService.getSegmentsRights(0, 2).subscribe((result) => {
        if (result.data) {
          this.hasSegmentDeleteRight = result.data.securityTypeID >= 5;
          this.hasSegmentsAddRight = result.data.securityTypeID >= 3;
          this.hasSegmentsViewRight = result.data.securityTypeID >= 2;
        }
      })
    );

    this._subs$.push(
      this.facade.contactRecord$.subscribe((record) => {
        const selectedCurrencyID = record.preferences?.contactCurrency;
        this.userService.currencyMappingTable$.subscribe(
          (currencyMappingTable) => {
            this.selectedCurrency = currencyMappingTable.filter(
              (currency) => currency.currencyID === selectedCurrencyID
            )[0].currencyISO;
          }
        );
      })
    );
  }

  setDefaultSegment(segmentID: number, criteriaSetID: number): void {
    const setDefault$: Subscription = this.inAppDisclosureService
      .SetDefault(segmentID, criteriaSetID)
      .subscribe(
        (result) => {
          if (result.data !== -1) {
            this.getSegments(this.selectedView, false); //refresh
          } else {
            console.error('Failed setting the default segment', result.data);
          }
        },
        (error) => console.error(error)
      );

    this._subs$.push(setDefault$);
  }

  prepareSegmentDropdown(data: any): any {
    // Transform dropdown options data to be used by crem-dropdown
    const dropdownData = [];
    let visibleToMeIndex: number;
    data.map((e, i) => {
      if (e.default === 1) {
        // If default is on, add a secondary text
        e['secondaryText'] = '(Default)';
      }
      if (e.activeRecordsVisibleToMe) {
        // get the activeRecordsVisibleToMe's Index
        visibleToMeIndex = i;
        e['itemClass'] = 'visible-to-me'; // Add moreMenu class to segment 'Active records Visible to me'
      }
      dropdownData.push(e);
    });
    visibleToMeIndex &&
      dropdownData.unshift(dropdownData.splice(visibleToMeIndex, 1)[0]); // Move default 'Visible to Me' to index 0, if visibleToMeIndex exists

    return dropdownData;
  }

  async onAccountingViewChange(data: DropdownSelection[]) {
    this.exportingReport = false;
    this.getSegments(data[0].id, true);
  }

  public getSegments(view: number, refresh: boolean) {
    this.accountingSegmentData = [];

    this._subs$.push(
      this.inAppDisclosureService
        .getAccountingCriteriaSets()
        .pipe(
          switchMap((r) => {
            switch (view) {
              case 1: {
                // Workflow and Alerts
                this.criteriaSet = r.data[1].CriteriaSetID;
                break;
              }
              default: {
                // Accounting Disclosure Reports
                this.criteriaSet = r.data[0].CriteriaSetID;
                break;
              }
            }
            return this.inAppDisclosureService.getSegments(
              this.criteriaSet,
              false
            );
          }),
          tap((r) => {
            this.accountingSegmentData = this.prepareSegmentDropdown(r.data);
            this.bySegmentMoreMenuOptions = ModuleDropdownUtil.prepareMoreMenu(
              this.accountingSegmentData,
              this.itemMenuInnerOptions
            );
            switch (true) {
              case refresh && !this.isSegmentEdited: {
                this.selectedSegment =
                  this.accountingSegmentData.find((s) => s.default === 1)
                    ?.segmentID || this.accountingSegmentData[0].segmentID;
                this.appliedSegment = this.selectedSegment;
                break;
              }
              case this.isSegmentEdited: {
                this.selectedSegment = this.editingSegment;
                break;
              }
              default: {
                this.selectedSegment =
                  this.accountingSegmentData?.find((s) => s.default === 1)
                    ?.segmentID || this.accountingSegmentData?.[0].segmentID;
                break;
              }
            }
            this.selectedView = view;
          })
        )
        .subscribe()
    );
  }

  public onAccountingYearChange(data) {
    if (data.length) {
      this.selectedYear = data[0].value;
      this.exportingReport = false;
    }
  }

  public onAccountingSegmentChange(data) {
    if (data.length) {
      this.selectedSegment = data[0].segmentID;
      this.exportingReport = false;
    }
  }

  public apply() {
    this.exportingReport = false;
    this.appliedSegment = this.selectedSegment;
    switch (this.selectedView) {
      default:
      case 1: {
        this.workflowAndAlertsComponent.refreshCardData();
        break;
      }
      case 2: {
        this.MangoDisclosureASCAnnually.refreshCards();
        break;
      }
      case 3: {
        this.MangoDisclosureASCQuarterly.refreshCards();
        break;
      }
      case 4: {
        this.MangoDisclosureIFRSAnnually.refreshCards();
        break;
      }
      case 5: {
        this.MangoDisclosureIFRSQuarterly.refreshCards();
        break;
      }
    }
  }

  public export() {
    this.exportingReport = true;
    this.toastService.showToast(
      'A link to the report will be emailed to you shortly.',
      'Processing Export',
      ToastState.SUCCESS
    );
    this.inAppDisclosureService
      .exportIADData(
        this.selectedSegment,
        this.selectedYear,
        this.selectedCurrency,
        this.selectedView + 2
      )
      .subscribe((error) => console.error(error));
    timer(180000).subscribe(() => (this.exportingReport = false));
  }

  launchSettingsModal() {
    this.dialog.open(UserSettingsComponent, {
      width: '600px',
      height: '570px',
      panelClass: 'user-settings-dialog',
      disableClose: true,
      data: {
        modalTitle: this.accountingViewData.find(
          (obj) => obj.id === this.selectedView
        ).displayValue,
      },
    });
  }

  /**
   * Get view Name
   *
   * @param {number} viewID
   * @param {boolean} [safeName=false as boolean]
   * @return {*}  {string}
   * @memberof DashboardWrapperComponent
   */
  getViewName(viewID: number, safeName = false as boolean): string {
    if (!safeName) {
      return this.accountingViewData.find((e) => e.id === viewID).displayValue;
    }
    return this.accountingViewData
      .find((e) => e.id === viewID)
      .displayValue.trim() // Removes leading and trailing spaces
      .replace(/\s+/g, '-') // Replaces inner spaces with hyphens (or remove `.replace` to eliminate spaces)
      .replace(/[^a-zA-Z0-9-]/g, ''); // Removes non-alphanumeric characters except hyphens
  }

  public edit(data) {
    if (this.hasSegmentsAddRight || this.hasSegmentsViewRight) {
      const dialogRef = this.dialog.open(CreateSegmentComponent, {
        height: LargeModal.Height,
        width: LargeModal.Width,
        maxWidth: LargeModal.MaxWidth,
        maxHeight: LargeModal.MaxHeight,
        disableClose: true,
        data: {
          openReportAction: 'edit',
          segmentID: data.segmentID,
          criteriaSetID: data.criteriaSetID,
          portfolioID: data.portfolioID,
          name: data.name,
          archived: !data.active,
          hideToastsOn: 'Accounting Workflow and Alerts',
        },
      });
      this.editingSegment = data.segmentID;
      dialogRef.afterClosed().subscribe((data) => {
        if (this.editingSegment == this.appliedSegment) {
          if (data === 'refresh') {
            this.loading = true;
            this.getSegments(this.selectedView, true);
            this.isSegmentEdited = true;
            this.exportingReport = false;
          } else if (data) {
            this.redirectDialog(data);
          }
        } else {
          if (data === 'refresh') {
            this.getSegments(this.selectedView, false);
          } else if (data) {
            this.redirectDialog(data);
          }
        }
      });
    }
  }

  public archiveAction(data) {
    const request: { SegmentID: any } = { SegmentID: data.segmentID };
    if (data.active) {
      this.reportsService.archiveSegment(request).subscribe((result) => {
        if (result) {
          if (data.segmentID === this.appliedSegment) {
            this.loading = true;
            this.getSegments(this.selectedView, true);
          } else {
            this.getSegments(this.selectedView, false);
          }
          this.toastService.showToast(
            'Segment archived successfully.',
            '',
            ToastState.SUCCESS
          );
        } else {
          //error
        }
      });
    } else {
      this.reportsService.unarchiveSegment(request).subscribe((result) => {
        if (result) {
          this.getSegments(this.selectedView, false);
          this.toastService.showToast(
            'Segment unarchived successfully.',
            '',
            ToastState.SUCCESS
          );
        } else {
          //error
        }
      });
    }
    this.archiveActionForDefault(data);
  }

  /**
   * Handles the archiving logic when a 'default' segment is archived
   */
  archiveActionForDefault(data: any) {
    if (data.default === 1) {
      // If user archiving the default segment, then make 'Visible to me' the default
      const visibleTomeSegmentId = this.accountingSegmentData.filter(
        (e) => e.activeRecordsVisibleToMe
      )[0].segmentID;
      if (visibleTomeSegmentId) {
        // If 'Visible to me' exists then make it the default
        this.setDefaultSegment(visibleTomeSegmentId, data.criteriaSetID);
      } else {
        // If 'Visible to me' doesn't exists, select the first element of the list as default
        this.setDefaultSegment(
          this.accountingSegmentData[0].segmentID,
          this.accountingSegmentData[0].criteriaSetID
        );
      }
      this.apply(); // Refresh cards view
    }
  }

  public redirectDialog(config: any) {
    const redirectRef = this.dialog.open(CreateSegmentComponent, config);
    redirectRef.afterClosed().subscribe((data) => {
      if (config.data.segmentID == this.appliedSegment) {
        if (data === 'refresh') {
          this.loading = true;
          this.getSegments(this.selectedView, true);
        } else if (data) {
          this.redirectDialog(config);
        }
      } else {
        if (data === 'refresh') {
          this.getSegments(this.selectedView, false);
        } else if (data) {
          this.redirectDialog(config);
        }
      }
    });
  }

  public onMoreMenuItemClicked(item) {
    this.moreMenuSegment = item;
  }

  ngOnDestroy(): void {
    this.cancelAllRequests();
  }

  /**
   * Destroys all active subscriptions
   *
   * @return {*}
   * @memberof DashboardWrapperComponent
   */
  public cancelAllRequests(): void {
    if (!this._subs$) return;

    this._subs$.forEach((s) => s.unsubscribe());
    this._subs$ = [];
  }
}
