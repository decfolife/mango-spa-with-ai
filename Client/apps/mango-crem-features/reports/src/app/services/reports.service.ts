import { HttpClient } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { Observable } from 'rxjs';
import { EndpointService, UtilitiesService } from '@mango/core-shared';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { Api } from '@mango/data-models/lib-data-models';
import {
  DeleteReportUsersGroups,
  ReportUsersGroups,
  ReportTag,
} from '@reports/models';

@Injectable()
export class ReportsService extends EndpointService {
  reportsUrl: string = UtilitiesService.getBaseApiUrl(Api.reports);
  dashboardsUrl: string = UtilitiesService.getBaseApiUrl(Api.dashboards);
  public dateFormat: string;

  constructor(protected http: HttpClient, @Optional() facade: MangoAppFacade) {
    super(http, facade);
  }

  favoriteReport(reportBody: any): Observable<any> {
    const url = `${this.reportsUrl}ReportsPage/FavoriteReport`;
    return this.callHttpPost(url, 'favoriteReport', reportBody);
  }

  unFavoriteReport(contactReportId: number): Observable<any> {
    const url = `${this.reportsUrl}ReportsPage/DeleteFavoriteReport/${contactReportId}`;
    return this.callHttpPost(url, 'deleteFavoriteReport', null);
  }

  getReportsList(): Observable<any> {
    const url = `${this.reportsUrl}ReportsPage/GetUserReports`;
    return this.callHttpGet(url, 'getUserReports');
  }

  getUserModuleRights(objectTypeIds: any[]): Observable<any> {
    const url = `${this.reportsUrl}ReportsPage/GetUserModuleRights`;
    return this.callHttpPost(url, 'getUserModuleRights', { objectTypeIds });
  }

  getUserMaxModuleRights(moduleID: Array<number>): Observable<any> {
    const url = `${this.reportsUrl}reports/getusermaxmodulerights/${moduleID}`;
    return this.callHttpGet(url, 'getUserMaxModuleRights');
  }

  getAllReportTags(): Observable<ReportTag[]> {
    const url = `${this.reportsUrl}ReportsPage/GetAllReportTags`;
    return this.callHttpGet(url, 'getAllReportTags');
  }

  getReportTagsByUser(): Observable<ReportTag[]> {
    const url = `${this.reportsUrl}ReportsPage/GetReportTagsByUser`;
    return this.callHttpGet(url, 'getReportTagsByUser');
  }

  addReportTag(reportTag: string): Observable<any> {
    const url = `${this.reportsUrl}ReportsPage/AddReportTag`;
    return this.callHttpPost(url, 'addReportTag', { tagName: reportTag });
  }

  assignReportTags(
    reportId: number,
    reportType: string,
    tags: ReportTag[]
  ): Observable<any> {
    const url = `${this.reportsUrl}ReportsPage/AssignReportTags`;
    return this.callHttpPost(url, 'assignReportTags', {
      reportId: reportId,
      reportType: reportType,
      reportTags: tags,
    });
  }

  unAssignReportTags(reportId: number, tagIds: number[]): Observable<any> {
    const url = `${this.reportsUrl}ReportsPage/UnAssignReportTags/${reportId}`;
    return this.callHttpDeleteWithBody(url, 'unAssignReportTags', {
      reportId: reportId,
      reportTagIDs: tagIds,
    });
  }

  editReportTag(reportTagId: number, reportTag: string): Observable<any> {
    const url = `${this.reportsUrl}ReportsPage/EditReportTag`;
    return this.callHttpPut(url, 'editReportTag', {
      reportTagID: reportTagId,
      tagName: reportTag,
    });
  }

  removeReportTag(reportTagId: number): Observable<any> {
    const url = `${this.reportsUrl}ReportsPage/RemoveReportTag/${reportTagId}`;
    return this.callHttpDelete(url, 'removeReportTag');
  }

  getUpdateRunCount(reportType: string, reportId: number): Observable<any> {
    const url = `${this.reportsUrl}ReportsPage/GetUpdateRunCount`;
    return this.callHttpPost(url, 'GetUpdateRunCount', {
      reportType,
      reportId,
    });
  }

  deleteReport(reportId: number): Observable<any> {
    const url = `${this.reportsUrl}ReportsPage/DeleteReport/${reportId}`;
    return this.callHttpPost(url, 'deleteReport', null);
  }

  public getPortfolios() {
    const url = `${this.reportsUrl}ReportsSegments/Portfolios`;
    return this.callHttpGet(url, 'getPortfolios');
  }

  public getNonDependentCriteria(criteriaSetId: number, portfolioId: number) {
    const url = `${this.reportsUrl}ReportsSegments/NonDependentCriteria`;
    return this.callHttpGet(url, 'getNonDependentCriteria', {
      CriteriaSetID: criteriaSetId,
      PortfolioID: portfolioId,
    });
  }

  public getCriteria(
    criteriaSetId: number,
    portfolioId: number,
    request,
    isReportCriteria: boolean = true
  ) {
    const url = `${this.reportsUrl}ReportsSegments/DependentCriteria`;
    return this.callHttpPost(url, 'getDependentCriteria', {
      CriteriaSetID: criteriaSetId,
      PortfolioID: portfolioId,
      DefinedCriteria: request,
      IsReportCriteria: isReportCriteria,
    });
  }

  public getReport(reportId: number) {
    const url = `${this.reportsUrl}ReportsSegments/Report`;
    return this.callHttpGet(url, 'getReport', { ReportID: reportId });
  }

  public insertSelectedCriteria(request) {
    const url = `${this.reportsUrl}ReportsSegments/InsertSelectedCriteria`;
    return this.callHttpPost(url, 'insertSelectedCriteria', {
      SelectedCriteria: request,
    });
  }

  public runBatchReport(reportGUID: string, reportId: number) {
    const url = `${this.reportsUrl}ReportsSegments/RunBatchReport`;
    return this.callHttpPost(url, 'runBatchReport', {
      ReportID: reportId,
      ReportGUID: reportGUID,
    });
  }

  public insertReportIssue(ReportString) {
    const url = `${this.reportsUrl}ReportsSegments/InsertReportIssue`;
    return this.callHttpPost(url, 'insertReportIssue', { ReportString });
  }

  public getSegments(criteriaSetID?, includeArchived: boolean = false) {
    let param;

    if (criteriaSetID) {
      param = {
        CriteriaSetID: criteriaSetID,
        includeArchived: includeArchived,
      };
    } else {
      param = { includeArchived: includeArchived };
    }

    const url = `${this.reportsUrl}ReportsSegments/Segments`;
    return this.callHttpGet(url, 'getSegments', param);
  }

  public getSegmentsFields(segmentId) {
    const url = `${this.reportsUrl}ReportsSegments/SegmentsFields`;
    return this.callHttpGet(url, 'getSegmentsFields', { SegmentID: segmentId });
  }

  public getSegmentsRights(objectId, securityTypeId) {
    // Possible Responses: 1 Restricted View | 2 View | 3 Add | 4 Edit | 5 delete | 6 Block
    const url = `${this.reportsUrl}ReportsSegments/SegmentsObjectRights`;
    return this.callHttpGet(url, 'getSegmentsObjectrights', {
      ObjectID: objectId,
      SecurityTypeID: securityTypeId,
    });
  }

  public GetCriteriaSetList(reportCriteria: number = 2) {
    const url =
      `${this.reportsUrl}ReportsSegments/CriteriaSetList?reportCriteria=` +
      reportCriteria;
    return this.callHttpGet(url, 'getCriteriaSetList', {});
  }

  public getRCSSFeatureFlag() {
    const url = `${this.reportsUrl}ReportsSegments/RCSSFeatureFlag`;
    return this.callHttpGet(url, 'getRCSSFeatureFlag', {});
  }

  public saveSegments(request) {
    const url = `${this.reportsUrl}ReportsSegments/SaveSegment`;
    return this.callHttpPost(url, 'saveSegment', request);
  }

  public archiveSegment(request) {
    const url = `${this.reportsUrl}ReportsSegments/ArchiveSegment`;
    return this.callHttpPost(url, 'ArchiveSegment', request);
  }

  public unarchiveSegment(request) {
    const url = `${this.reportsUrl}ReportsSegments/UnarchiveSegment`;
    return this.callHttpPost(url, 'UnarchiveSegment', request);
  }

  public getUserPreferences(): Observable<any> {
    const url = `${this.dashboardsUrl}Dashboards/GetUserPreferences`;
    return this.callHttpGet(url, 'GetUserPreferences', {});
  }

  public getReportUsersGroups(reportId: number): Observable<any> {
    const url = `${this.reportsUrl}reports/reportusersgroups/${reportId}`;
    return this.callHttpGet(url, 'getReportUsersGroups', {});
  }

  public updateReportUsersGroups(
    reportId: number,
    reportUsersGroups: ReportUsersGroups
  ): Observable<any> {
    const url = `${this.reportsUrl}reports/reportusersgroups/${reportId}`;
    return this.callHttpPut(url, 'updateReportUsersGroups', reportUsersGroups);
  }

  public getReportUsersShareOptions(type: string): Observable<any> {
    const url = `${this.reportsUrl}reports/reportusersgroups/shareoptions/${type}`;
    return this.callHttpGet(url, 'updateReportUsersGroups', {});
  }

  public deleteReportUsersShare(
    reportId: number,
    deleteReportUser: DeleteReportUsersGroups
  ): Observable<any> {
    const url = `${this.reportsUrl}reports/reportusersgroups/${reportId}`;
    return this.callHttpDeleteWithBody(
      url,
      'deleteReportUsersShare',
      deleteReportUser
    );
  }

  public setUserDateFormat(isDatesEU: boolean) {
    this.dateFormat = isDatesEU ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
  }
}
