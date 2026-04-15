import { HttpClient } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { environment } from '@mangoSpa/src/environments/environment.local';
import { EndpointService, UtilitiesService } from '@mango/core-shared';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver-es';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { PortfolioSettingsResponse } from '@accounting-summary/models/portfolio-settings-response.modal';
import { Api } from '@mango/data-models/lib-data-models';
import { ClassificationTypeName } from '@mango/data-models/lib-data-models';
import { LeaseDetails } from '@accounting-summary/models/lease-info-response.modal';

@Injectable({
  providedIn: 'root',
})
export class AccountingSummaryService extends EndpointService {
  private apiUrl: string;
  private navPageId: number;
  leaseInfoSubject: BehaviorSubject<any>;
  public jeActionTaken$ = new BehaviorSubject<boolean>(false);
  public newCreatedSchedule = new BehaviorSubject<number>(0);
  public lastApprovedOrExportedDate$ = new BehaviorSubject<Date | null>(null);
  public isAmortizationDataLoaded$ = new BehaviorSubject<boolean>(false);
  preferenceSavePendingMessage = ' - You have unsaved preference changes.';
  public lockAddButton = new BehaviorSubject<boolean>(false);
  isLocked: boolean;
  isArchived: boolean;
  portfolioSettings: PortfolioSettingsResponse;
  headerRowHeight: number;
  gridHeightPixelCorrection: number;

  constructor(protected http: HttpClient, @Optional() facade: MangoAppFacade) {
    super(http, facade);
    this.apiUrl = UtilitiesService.getBaseApiUrl(Api.accountingSummary);
    const storedTitle = JSON.parse(sessionStorage.getItem('accSumLeaseInfo'));
    this.leaseInfoSubject = new BehaviorSubject<any>(storedTitle || {});
    this.portfolioSettings = this.getSavedPortfolioSettings();
  }

  setLeaseAbstractId(leaseId: number) {
    const currentLeaseInfo = this.getLeaseInfoFromSession();
    currentLeaseInfo.leaseAbstractID = leaseId;
    this.setLeaseInfo(currentLeaseInfo);
  }

  getLeaseAbstractId(): number {
    const leaseInfo = this.getLeaseInfoFromSession();
    return leaseInfo?.leaseAbstractID || 0;
  }

  setNavPageId(navPageId: number) {
    this.navPageId = navPageId;
  }

  getNavPageId(): number {
    return this.navPageId;
  }

  /**
   * Returns the Classification Name from the corresponding enum given a ClassificationID
   *
   * @param {number} classificationID
   * @return {*}  {(string | undefined)}
   * @memberof AccountingSummaryService
   */
  getClassificationName(classificationID: number): string | undefined {
    for (const key in ClassificationTypeName) {
      if (
        ClassificationTypeName[key as keyof typeof ClassificationTypeName] ===
        classificationID
      ) {
        return key;
      }
    }
    return undefined;
  }

  getTitleInfoFromSubject(): Observable<any> {
    return this.leaseInfoSubject.asObservable();
  }

  delayGridPanelCollapseWhenFilterIsVisible() {
    const filterObject = document.querySelector(
      "[aria-label='Filter options']:not(.dx-state-invisible)"
    );
    if (filterObject !== null) {
      const delay = 400;
      const start = new Date().getTime();
      while (new Date().getTime() < start + delay);
    }
  }

  getLeaseInfo() {
    return this.callHttpGet(
      `${
        this.apiUrl
      }AccountingSummary/GetLeaseInformation/lease/${this.getLeaseAbstractId()}`,
      'getLeaseInfo'
    );
  }

  getAccountingEvents() {
    return this.callHttpGet(
      `${
        this.apiUrl
      }AccountingSummary/GetAccountingEventsSelector/lease/${this.getLeaseAbstractId()}`,
      'getAccountingEvents'
    );
  }

  getUserInformation() {
    return this.callHttpGet(
      `${this.apiUrl}AccountingSummary/GetUserInformation`,
      'getUserInformation'
    );
  }

  getUserNavPageRight() {
    return this.callHttpGet(
      `${this.apiUrl}AccountingSummary/GetUserNavPageRight/navPage/${this.navPageId}`,
      'getUserNavPageRight'
    );
  }

  getAccountingSummaryRights() {
    return this.callHttpGet(
      `${this.apiUrl}AccountingSummary/GetAccountingSummaryRights/navPage/${
        this.navPageId
      }/lease/${this.getLeaseAbstractId()}`,
      'getAccountingSummaryRights'
    );
  }

  getWorkflowStatusInformation() {
    return this.callHttpGet(
      `${
        this.apiUrl
      }AccountingSummary/GetWorkflowStatusInformation/lease/${this.getLeaseAbstractId()}`,
      'getWorkflowStatusInformation'
    );
  }

  getWorkflowStatusHistory() {
    return this.callHttpGet(
      `${
        this.apiUrl
      }AccountingSummary/GetWorkflowStatusHistory/lease/${this.getLeaseAbstractId()}`,
      'getWorkflowStatusHistory'
    );
  }

  getEventDetails(masterScheduleId: number) {
    return this.callHttpGet(
      `${this.apiUrl}AccountingSummary/GetAccountingEvents/masterschedule/${masterScheduleId}`,
      'getEventDetails'
    );
  }

  getPaymentDetails(leaseRecognitionScheduleId: number) {
    return this.callHttpGet(
      `${this.apiUrl}Payments/GetHistoricalPayments/schedule/${leaseRecognitionScheduleId}`,
      'getPaymentDetails'
    );
  }

  getPaymentPopupData(leaseRecognitonScheduleEventId: number) {
    return this.callHttpGet(
      `${this.apiUrl}Payments/GetHistoricalTransactions/scheduleevent/${leaseRecognitonScheduleEventId}`,
      'getPaymentPopupData'
    );
  }

  getOtherCharge(glEventId: number) {
    return this.callHttpGet(
      `${this.apiUrl}Payments/getothercharge/${glEventId}`,
      'getOtherCharge'
    );
  }

  getJeProcessingPopupData(leaseRecognitionPeriodID: number) {
    return this.callHttpGet(
      `${this.apiUrl}AmortizationPeriods/getJournalEntryProcessing/period/${leaseRecognitionPeriodID}`,
      'getJeProcessingPopupData'
    );
  }

  getJePaymentPopupData(leaseRecognitionPeriodID: number) {
    return this.callHttpGet(
      `${this.apiUrl}AmortizationPeriods/GetPeriodPayments/period/${leaseRecognitionPeriodID}`,
      'getJePaymentPopupData'
    );
  }

  getPortfolioSettings() {
    return this.callHttpGet(
      `${
        this.apiUrl
      }AccountingSummary/GetPortfolioSettings/lease/${this.getLeaseAbstractId()}`,
      'getPortfolioSettings'
    );
  }

  getGridPreferences() {
    return this.callHttpGet(
      `${
        this.apiUrl
      }AccountingSummary/GetGridStates/lease/${this.getLeaseAbstractId()}`,
      'getGridStates'
    );
  }

  journalEntryProcess(periodID: number, actions: string) {
    return this.callHttpPost(
      `${this.apiUrl}AmortizationPeriods/JournalEntryAction`,
      'journalEntryProcess',
      JSON.stringify({ PeriodId: periodID, Action: actions })
    );
  }

  updateWorkflowStatus(workflowStatusId: number, comment: string) {
    return this.callHttpPost(
      `${this.apiUrl}AccountingSummary/UpdateWorkflowStatus`,
      'updateWorkflowStatus',
      JSON.stringify({
        leaseAbstractID: this.getLeaseAbstractId(),
        workflowStatusID: workflowStatusId,
        comment: comment,
      })
    );
  }

  exportPresentValuePreviewFile(pvPayload: any) {
    return this.callHttpPostWithBlobResponse(
      `${this.apiUrl}accountingevents/exportpresentvaluepreviewfile`,
      'exportpresentvaluepreviewfile',
      JSON.stringify(pvPayload)
    );
  }

  exportPresentValueFile(scheduleId: number) {
    return this.http.get(
      `${this.apiUrl}accountingevents/exportpresentvaluefile/${scheduleId}`,
      { responseType: 'blob' }
    );
  }

  saveGridPreferences(classificationId: number, gridName: string, columnJson) {
    return this.callHttpPost(
      `${this.apiUrl}AccountingSummary/UpdateGridStates`,
      'saveGridPreferences',
      JSON.stringify({
        leaseAbstractID: this.getLeaseAbstractId(),
        classificationID: classificationId,
        gridName: gridName,
        columnJson: columnJson,
      })
    );
  }

  resetGridPreferences(classificationId: number, gridName: string) {
    return this.callHttpPost(
      `${this.apiUrl}AccountingSummary/ResetGridState`,
      'resetGridState',
      JSON.stringify({
        leaseAbstractID: this.getLeaseAbstractId(),
        classificationID: classificationId,
        gridName: gridName,
      })
    );
  }

  getAmortizationDetails(leaseRecognitionScheduleID: number) {
    return this.callHttpGet(
      `${this.apiUrl}AmortizationPeriods/GetAmortizationPeriods/Schedule/${leaseRecognitionScheduleID}`,
      'getAmortizationDetails'
    );
  }

  getId(
    componentName: string,
    uniqueName: string,
    elementType: string,
    componentType?: string
  ) {
    return componentType
      ? `${componentName}-${componentType}-${uniqueName}-${elementType}`
      : `${componentName}-${uniqueName}-${elementType}`;
  }

  sanitizeExcelName(name: string): string {
    // eslint-disable-next-line no-useless-escape
    return name.replace(/[\\/:*?"<>|\[\]]/g, '_');
  }

  exportToExcel(component: any, filename: string, worksheetName: string): void {
    const workbook = new ExcelJS.Workbook();

    const sanitizedWorkSheetName = this.sanitizeExcelName(
      worksheetName || 'Sheet1'
    );
    const sanitizedFileName = this.sanitizeExcelName(filename || 'Export.xlsx');

    const worksheet = workbook.addWorksheet(sanitizedWorkSheetName);

    exportDataGrid({
      component: component,
      worksheet: worksheet,
    }).then(() => {
      worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
        row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
          cell.alignment = { wrapText: true, vertical: 'top' };
        });
      });

      workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
        saveAs(
          new Blob([buffer], { type: 'application/octet-stream' }),
          sanitizedFileName
        );
      });
    });
  }

  generateFileName(
    classificationType: string,
    amortizationProfileName: string,
    componentName?: string
  ): string {
    return `${this.getLeaseAbstractId()} ${
      componentName ? '- ' + componentName + ' -' : '-'
    } ${classificationType} - ${amortizationProfileName} - ${this.getTimeStamp().toLocaleString()}.xlsx`;
  }

  getTimeStamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}${minutes}${seconds}`;
  }

  getFileName(componentName) {
    const env = environment.name === 'PROD' ? '' : '_' + environment.name;
    const timeStamp = this.getTimeStamp();
    return `${componentName}_${timeStamp}${env}.xlsx`;
  }

  setIsLocked(isLocked: boolean) {
    this.isLocked = isLocked;
  }

  setIsArchived(isArchived: boolean) {
    this.isArchived = isArchived;
  }

  setLockAddButton(lock: boolean) {
    if (this.lockAddButton.value !== lock) {
      this.lockAddButton.next(lock);
    }
  }

  getIsLocked() {
    return this.isLocked;
  }

  getIsArchived() {
    return this.isArchived;
  }

  private getSavedPortfolioSettings() {
    return JSON.parse(
      sessionStorage.getItem('accSumPortfolioSettings') || '{}'
    ) as PortfolioSettingsResponse;
  }

  setLeaseInfo(leaseInfo: LeaseDetails) {
    sessionStorage.setItem('accSumLeaseInfo', JSON.stringify(leaseInfo));
    this.leaseInfoSubject.next(leaseInfo);
  }

  getLeaseInfoFromSession(): LeaseDetails {
    return (
      this.leaseInfoSubject.value ||
      JSON.parse(sessionStorage.getItem('accSumLeaseInfo') || '{}')
    );
  }

  setPortfolioSettings(settings: PortfolioSettingsResponse) {
    sessionStorage.setItem('accSumPortfolioSettings', JSON.stringify(settings));
    this.portfolioSettings = settings;
  }

  getPortfolioSettingsFromSession(): PortfolioSettingsResponse {
    return this.portfolioSettings || this.getSavedPortfolioSettings();
  }

  exportAccountingEventSummaryReport(scheduleId, fileName: string) {
    return this.callHttpPostWithBlobResponse(
      `${this.apiUrl}AccountingSummary/ExportAccountingEventSummaryReport`,
      'exportAccountingEventSummaryReport',
      JSON.stringify({ scheduleList: scheduleId, FileName: fileName })
    );
  }

  deleteAccountingEvent(scheduleId: number) {
    return this.callHttpDelete(
      `${this.apiUrl}accountingevents/deleteaccountingevent/${scheduleId}`,
      'deleteAccountingEvent'
    );
  }

  downloadExcel(data: Blob, fileName: string) {
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  clearGrid(grid: any, noData: string) {
    if (grid?.instance) {
      grid.instance.option('columns', []);
      grid.instance.option('dataSource', []);
      grid.instance.state(null);
      grid.instance.option('noDataText', noData);
      grid.instance.refresh();
    }
  }

  setGridHeight(gridName: any, numberOfRows: any): string {
    const gridHeaderRow: HTMLElement | null = gridName?.instance
      .element()
      .querySelector('.dx-datagrid-headers');
    if (!gridHeaderRow) {
      return '';
    }
    this.headerRowHeight = gridHeaderRow.clientHeight;
    if (this.headerRowHeight < 36) {
      this.gridHeightPixelCorrection = 5;
    } else {
      this.gridHeightPixelCorrection = 0;
    }
    const gridRowElement = gridName.instance.getRowElement(0);
    if (gridRowElement && gridRowElement.length > 0) {
      const rowHeight = gridRowElement[0].clientHeight;
      return `${
        rowHeight * numberOfRows +
        this.gridHeightPixelCorrection +
        this.headerRowHeight
      }px`;
    } else {
      return '';
    }
  }

  setDefaultGridHeight(gridName: any) {
    const totalRowCount = gridName.instance.totalCount();
    let customGridHeight: number | string;
    if (totalRowCount > 3) {
      customGridHeight = this.setGridHeight(gridName, 3);
    } else {
      customGridHeight = 'auto';
    }
    return customGridHeight;
  }
}
