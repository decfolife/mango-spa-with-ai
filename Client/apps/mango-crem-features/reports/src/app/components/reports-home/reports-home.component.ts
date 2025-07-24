import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ReportsService } from '../../services/reports.service';
import { ReportsList } from '../../models';
import { DxDataGridComponent } from 'devextreme-angular';
import { DeleteReportComponent } from '../modal/delete-report/delete-report.component';
import { MatDialog } from '@angular/material/dialog';
import { SearchComponent } from '@mango/ui-shared/cosmos';
import { CriteriaReportComponent } from '../modal/criteria-report/criteria-report.component';
import { LargeModal } from '@mangoSpa/src/assets/enum/modal.model';
import { ShareReportComponent } from './modals/share-report/share-report.component';
import { Router } from '@angular/router';
import { ManageTagsComponent } from '../modal/manage-tags/manage-tags.component';
import { AssignTagsComponent } from '../modal/assign-tags/assign-tags.component';

// Magic to access objects declared outside Angular
declare var launchUploadFileWizard;

@Component({
  selector: 'reports-home',
  templateUrl: './reports-home.component.html',
  styleUrls: ['./reports-home.component.scss'],
})
export class ReportsHomeComponent implements OnInit, OnDestroy {
  @ViewChild('ReportsDataGrid') reportsDataGrid: DxDataGridComponent;
  @ViewChild('SearchBox') searchBox: SearchComponent;

  reportTags: any;
  reports: ReportsList[];
  favoriteReports: ReportsList[];
  filteredReports: ReportsList[];
  tagFilters: string[] = [];
  isExpanded: boolean = true;
  rptTagAdminRight: boolean = false;
  offlineContentRight: boolean = false;
  createReportAdminRight: boolean = false;
  showFavorites: boolean = false;
  searchText: string = '';
  dataRetrieved: boolean = false;
  isDateEU: boolean = false;
  rcssFlagActive: boolean = false;
  isCriteriaReport = {
    SQLRSCriteria: true,
    SQLRSCriteria05: true,
    SQLRSCriteria12: true,
    SQLRSBatch: true,
    CICriteria: true,
    CICriteria2: true,
  };

  navigationButtonsObserver: MutationObserver;
  pagingButtonsObserver: MutationObserver;

  constructor(
    private reportsService: ReportsService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnDestroy() {
    this.navigationButtonsObserver.disconnect();
    this.pagingButtonsObserver.disconnect();
  }

  ngOnInit(): void {
    this.getReportTags();
    this.getUserModuleRights();
    this.reportsService.getRCSSFeatureFlag().subscribe((rcssFlag) => {
      this.getReportsGridData();
      if (rcssFlag?.data) {
        this.rcssFlagActive = true;
      }
    });

    // API call for user preferences needs to be implemented so that userDateFormat is respective of that.
    // this.getUserPreferences();
    this.reportsService.setUserDateFormat(false);
  }

  ngAfterViewInit(): void {
    window.addEventListener(
      'RefreshReportTagsDropdown',
      this.getReportTags.bind(this)
    );
    window.addEventListener(
      'RefreshReportsGrid',
      this.getReportsGridData.bind(this)
    );
  }

  loadState() {
    return JSON.parse(sessionStorage.getItem('reportsGridState'));
  }

  saveState(state) {
    state.searchText = '';
    sessionStorage.setItem('reportsGridState', JSON.stringify(state));
  }

  getUserModuleRights() {
    let objectIds = [77, 92, 97, 149, 7];

    this.reportsService.getUserModuleRights(objectIds).subscribe(
      (res: any) => {
        if (res.success) {
          let rptTagAdminObj = res.data.filter((r) => r.moduleId == 149);
          if (rptTagAdminObj[0].hasAddRights) {
            this.rptTagAdminRight = true;
          }
          let offlineContentObj = res.data.filter(
            (r) => r.moduleId == 77 || r.moduleId == 92 || r.moduleId == 97
          );
          this.offlineContentRight = offlineContentObj.some(
            (obj) => obj.hasAddRights != null
          );
          let createReportAdminObj = res.data.filter((r) => r.moduleId == 7);
          if (createReportAdminObj.length) {
            if (createReportAdminObj[0].hasAddRights) {
              this.createReportAdminRight = true;
            }
          }
        } else {
          console.log('API call to get user module rights is not successful');
        }
      },
      (error: any) =>
        console.log(
          'Error occurred getting Portfolio User Module rights: ',
          error
        ),
      () => {}
    );
  }

  getReportsGridData() {
    this.reportsService.getReportsList().subscribe(
      (res: any) => {
        if (res.success) {
          this.reports = res.data.map(this.addRightsProperty);
          this.filteredReports = this.reports;
          this.favoriteReports = this.reports.filter((rpt) => rpt.isFavorite);
          this.dataRetrieved = true;
        } else {
          this.dataRetrieved = true;
          console.log(
            'The report list API call is not successful...please check the response.'
          );
        }
      },
      (error: any) => {
        console.log('Error has occurred while getting reports data: ', error);
      },
      () => {}
    );
  }

  addRightsProperty(report) {
    if (report.type.toLowerCase().trim() == 'adhoc') {
      if (!report.canEdit && !report.canDelete) {
        report.rights = 'VIEW';
      } else if (report.canEdit && !report.canDelete) {
        report.rights = 'EDIT';
      } else if (report.canEdit && report.canDelete) {
        report.rights = 'DELETE';
      } else {
        report.rights = '';
      }
    } else {
      report.rights = '';
    }
    return report;
  }

  getReportTags() {
    this.reportsService.getAllReportTags().subscribe(
      (res: any) => {
        if (res.success) {
          this.reportTags = res.data;
        } else {
          console.log(
            'The report Tags API call is not successful...please check the response.'
          );
        }
      },
      (error: any) => {
        console.log('Error getting AllReportTags: ', error);
      },
      () => {}
    );
  }

  favoriteReport(rpt: any) {
    this.reportsService
      .favoriteReport({
        reportId: rpt.data.id,
        reportType: rpt.data.type,
        folderId: rpt.data.folderId,
      })
      .subscribe(
        (res: any) => {
          if (res.success) {
            this.setContactReportdId(rpt, res.data);
            this.toggleFavorite(rpt, true);
          } else {
            console.log(
              'The FavoriteReport API call is not successful...please check the response.'
            );
          }
        },
        (error: any) => {
          console.log(
            'Error has occurred while FavoriteReport API call: ',
            error
          );
        },
        () => {}
      );
  }

  unFavoriteReport(rpt) {
    this.reportsService.unFavoriteReport(rpt.data.contactReportId).subscribe(
      (res: any) => {
        if (res.success) {
          this.toggleFavorite(rpt, false);
        } else {
          console.log(
            'The DeleteFavoriteReport API call is not successful...please check the response.'
          );
        }
      },
      (error: any) => {
        console.log(
          'Error has occurred while DeleteFavoriteReport API call: ',
          error
        );
      },
      () => {}
    );
  }

  onKeydownMakeFavorite(event: KeyboardEvent, data: any) {
    if (event.key === 'Enter' || event.key === ' ') {
      this.favoriteReport(data);
    }
  }
  onKeydownMakeUnFavorite(event: KeyboardEvent, data: any) {
    if (event.key === 'Enter' || event.key === ' ') {
      this.unFavoriteReport(data);
    }
  }
  private toggleFavorite(rpt: any, flag: boolean) {
    let report = this.reports.find((r) => r.id === rpt.data.id);
    if (report) {
      report.isFavorite = flag;
    }

    let filteredReport = this.filteredReports.find((r) => r.id === rpt.data.id);
    if (filteredReport) {
      filteredReport.isFavorite = flag;
    }

    let favoriteReport = this.favoriteReports.find((r) => r.id === rpt.data.id);
    if (favoriteReport) {
      favoriteReport.isFavorite = flag;
    }
  }

  private setContactReportdId(rpt: any, contactReportId: number) {
    let report = this.reports.find((r) => r.id === rpt.data.id);
    if (report) {
      report.contactReportId = contactReportId;
    }

    let filteredReport = this.filteredReports.find((r) => r.id === rpt.data.id);
    if (filteredReport) {
      filteredReport.contactReportId = contactReportId;
    }

    let favoriteReport = this.favoriteReports.find((r) => r.id === rpt.data.id);
    if (favoriteReport) {
      favoriteReport.contactReportId = contactReportId;
    }
  }

  toggleShowFavorites() {
    this.favoriteReports = this.reports.filter((itm) => itm.isFavorite);
    this.showFavorites = !this.showFavorites;
    this.applyTagsAndFavorites();
  }

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
  }

  showColumnChooser() {
    this.reportsDataGrid.instance.showColumnChooser();
  }

  searchDataGrid(data) {
    this.searchText = data;
    this.reportsDataGrid.instance.searchByText(data);
  }

  resetGrid() {
    this.searchBox?.handleClear();
    this.reportsDataGrid.instance.state(null);
  }

  launchUploadOfflineTemplateModal() {
    launchUploadFileWizard();
  }

  public createReport() {
    // route
    this.router.navigateByUrl(
      '/v06/reporting/AdHocReporting/AdHocCreateEditReport.aspx?OTID=7'
    );
  }

  tagSelected(selectedTags) {
    this.tagFilters = [];
    if (selectedTags) {
      this.tagFilters = selectedTags.map((itm) => itm.reportTag);
    }
    this.applyTagsAndFavorites();
  }

  applyTagsAndFavorites() {
    if (this.tagFilters.length > 0) {
      if (this.showFavorites) {
        this.filteredReports = this.favoriteReports.filter((rpt) =>
          rpt.tags
            .map((t) => t.reportTag)
            .some((itm) => this.tagFilters.includes(itm))
        );
      } else {
        this.filteredReports = this.reports.filter((rpt) =>
          rpt.tags
            .map((t) => t.reportTag)
            .some((itm) => this.tagFilters.includes(itm))
        );
      }
    } else {
      if (this.showFavorites) {
        this.filteredReports = this.favoriteReports;
      } else {
        this.filteredReports = this.reports;
      }
    }
  }

  runReport(e) {
    // rcssFlagActive = useSegmentsFeature
    if (
      e.data.type.toLowerCase() === 'standard' &&
      this.rcssFlagActive &&
      this.isCriteriaReport[e.data.reportObject]
    ) {
      this.dialog.open(CriteriaReportComponent, {
        height: LargeModal.Height,
        width: LargeModal.Width,
        maxWidth: LargeModal.MaxWidth,
        maxHeight: LargeModal.MaxHeight,
        disableClose: true,
        data: {
          reportId: e.data.id,
          reportName: e.data.reportName,
        },
      });
    } else {
      this.runReportPage(e);
    }
  }

  editReport(e) {
    let reportId = e.data.id;
    this.router.navigateByUrl(
      `/v06/Reporting/AdhocReporting/AdHocCreateEditReport.aspx?ReportID=${reportId}&hasRDL=true`
    );
  }

  shareReport(e) {
    let reportId = e.data.id;
    let canEdit = e.data.canEdit;
    let canDelete = e.data.canDelete;
    let reportrights = 2;

    if (canDelete) {
      reportrights = 5;
    } else if (canEdit) {
      reportrights = 4;
    }

    let dialogRef = this.dialog.open(ShareReportComponent, {
      width: '40vw',
      height: '65vh',
      data: {
        reportId: reportId,
      },
    });
  }

  scheduleReport(e) {
    let reportId = e.data.id;
    this.router.navigateByUrl(
      `/v06/Reporting/Popup/ScheduleReportSinglePage.aspx?OID=${reportId}&OTID=7`
    );
  }

  manageReportTags() {
    this.dialog.open(ManageTagsComponent, {
      height: '500px',
      width: '800px',
      panelClass: 'manage-tags-modal',
      disableClose: true,
    });
  }

  assignReportTags(e) {
    let reportId = e.data.id;
    let reportType = e.data.type;

    let dialogRef = this.dialog.open(AssignTagsComponent, {
      height: '500px',
      width: '800px',
      panelClass: 'assign-tags-modal',
      disableClose: true,
      data: {
        reportId: reportId,
        reportType: reportType,
        reportAssignedTags: e.data.tags,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result.hasSavedChanges) {
        this.getReportsGridData();
      }
    });
  }

  viewReportHistory(e) {
    let reportId = e.data.id;
    this.router.navigateByUrl(
      `/v06/Reporting/AdhocReporting/AdHocReportHistory.aspx?ReportID=${reportId}&hasRDL=false`
    );
  }

  deleteReport(e) {
    let reportId = e.data.id;
    let reportName = e.data.reportName;

    let dialogRef = this.dialog.open(DeleteReportComponent, {
      height: '200px',
      width: '600px',
      data: { reportName },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'Yes') {
        console.log('Deleting Report:', reportId);

        this.performDeleteReport(reportId);
      }
    });
  }

  performDeleteReport(reportId) {
    this.reportsService.deleteReport(reportId).subscribe(
      (res: any) => {
        if (res.success) {
          this.reports = this.reports.filter(
            (report) => report.id !== reportId
          );
          this.favoriteReports = this.favoriteReports.filter(
            (report) => report.id !== reportId
          );
          this.filteredReports = this.filteredReports.filter(
            (report) => report.id !== reportId
          );
        } else {
          console.log('The Delete Report API call is not successful.');
        }
      },
      (error: any) => {
        console.log('Error deleting report: ', error);
      },
      () => {}
    );
  }

  clearAllFilters() {
    this.reportsDataGrid.instance.clearFilter();
    this.applyTagsAndFavorites();
    this.reportsDataGrid.instance.searchByText(this.searchText);
  }

  private runReportPage(item) {
    let reportType = item.data.type;
    let reportId = item.data.id;
    this.reportsService.getUpdateRunCount(reportType, reportId).subscribe(
      (res: any) => {
        if (res.success) {
          if (item.data.sameWindow) {
            document.location = item.data.reportUrl;
          } else {
            window.open(
              item.data.reportUrl,
              'Report',
              'toolbar=no,scrollbars=yes,location=no,statusbar=no,menubar=yes,resizable=yes'
            );
          }
        } else {
          console.log('API call to get update run count is not successful');
        }
      },
      (error: any) =>
        console.log(
          'Error occurred getting update run count for reports module: ',
          error
        ),
      () => {}
    );
  }

  public onCellClicked(item): void {
    if (item.column == undefined) return;
    if (
      item.column.caption !== 'Actions' &&
      item.column.dataField !== 'isFavorite' &&
      item !== undefined
    ) {
      this.runReport(item);
    }
  }
  public onCellPrepared(e) {
    if (
      e.rowType == 'data' &&
      e.column.dataField === 'Actions' &&
      e.column.dataField === 'isFavorite'
    ) {
      e.cellElement.className += ' not-clickable';
    }
  }

  adaAttr(e) {
    if (!e || !e.element) return;
    let buttons;
    if (e.element[0]) buttons = e.element[0].querySelectorAll('.dx-selection');
    else buttons = e.element.querySelectorAll('.dx-selection');

    buttons.forEach((button) => {
      if (!button || !button.hasAttribute('aria-label') || !button.classList)
        return;
      button.setAttribute('aria-current', 'page');

      this.pagingButtonsObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (!button.classList.contains('dx-selection')) {
            button.removeAttribute('aria-current');
          }
        });
      });
      this.pagingButtonsObserver.observe(button, {
        attributeFilter: ['class'],
      });
    });

    //dx-navigate-button remove tabindex tabbing to disabled button
    const navigationButtons = e.element.querySelectorAll('.dx-navigate-button');
    navigationButtons.forEach((button) => {
      if (button.classList.contains('dx-button-disable')) {
        button.setAttribute('tabindex', -1);
      }

      this.navigationButtonsObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (button.classList.contains('dx-button-disable')) {
            button.setAttribute('tabindex', -1);
          } else {
            button.setAttribute('tabindex', 0);
          }
        });
      });

      this.navigationButtonsObserver.observe(button, {
        attributeFilter: ['class'],
      });
    });
  }

  ADAattributes(e: any) {
    // Search for the span element with class dx-datagrid-nodata
    const spanElement = e.component.$element().find('.dx-datagrid-nodata');
    if (spanElement.length > 0) {
      spanElement.attr('role', 'alert');
      spanElement.attr('aria-live', 'polite');
    }
  }
}
