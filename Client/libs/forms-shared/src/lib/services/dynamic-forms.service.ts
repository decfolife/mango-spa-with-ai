// item.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EndpointService } from '@mango/core-shared/lib-core-shared';
import {
  DeleteSubObjectRequest,
  SaveRenderFormCommand,
  UpdateLeaseVerificationStatusRequest,
} from '@forms/model/dynamic-forms.interface';
import { ObjectData } from '@forms/model/form-item-change-history';
import { ApiResponse } from '@mango/data-models/lib-data-models';
import { UtilitiesService } from '@mango/core-shared';
import { Api } from '@mango/data-models/lib-data-models';
import { CopyLease } from '@forms/model/copyLease';
import { HttpResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DynamicFormsService extends EndpointService {
  formWizardUrl: string = UtilitiesService.getBaseApiUrl(Api.formWizard);
  // formWizardUrl = `https://localhost:57320/api/`;
  objectActions: string = UtilitiesService.getBaseApiUrl(Api.objectActions);
  projectUrl: string = UtilitiesService.getBaseApiUrl(Api.projects);

  getItems(): Observable<any> {
    const url = `${this.formWizardUrl}AdminForms/GetAdminFormsList`;
    return this.callHttpGet(url, 'GetAdminFormsList');
  }

  getForm(
    formId: number,
    objectId: number,
    objectTypeId: number,
    objectTypeTypeId: number = null,
    relationshipDefinitionId: number = null,
    parentObjectId: number = null,
    relatedObjectId: number = null,
    relatedObjectTypeId: number = null
  ): Observable<any> {
    return this.callHttpGet(
      `${this.formWizardUrl}AdminForms/GetForm/${formId}/${objectId}/${objectTypeId}`,
      'getForm',
      {
        objectTypeTypeId,
        relationshipDefinitionId,
        parentObjectId,
        relatedObjectId,
        relatedObjectTypeId,
      }
    );
  }

  getFormActions(
    formId: number,
    objectId: number,
    objectTypeId: number,
    objectTypeTypeId: number,
    isEditMode: boolean,
    relationshipDefinitionId: number = null,
    parentObjectId: number = null,
    parentObjectTypeId: number = null
  ): Observable<any> {
    const url = `${this.formWizardUrl}AdminForms/GetFormActions`;
    return this.callHttpPost(url, 'GetFormActions', {
      formId,
      objectId,
      objectTypeId,
      objectTypeTypeId,
      isEditMode,
      relationshipDefinitionId,
      parentObjectId,
      parentObjectTypeId,
    });
  }

  getFormSections(
    formId: number,
    groupId: number,
    objectId: number = 0
  ): Observable<any> {
    const url = `${this.formWizardUrl}AdminForms/GetFormSections/${formId}/${groupId}/${objectId}`;
    return this.callHttpGet(url, 'GetFormSections');
  }

  getLockingInfo(objectId: number, objectTypeId: number): Observable<any> {
    const url = `${this.formWizardUrl}AdminForms/GetLockingInfo/${objectId}/${objectTypeId}`;
    return this.callHttpGet(url, 'getLockingInfo');
  }

  getImageData(filePath: string): Observable<any> {
    const url = `${this.formWizardUrl}RenderForms/GetImageData?fileurl=${filePath}`;
    return this.callHttpGet(url, 'GetImageData');
  }

  getAvailableFormSections(formId: number): Observable<any> {
    const url = `${this.formWizardUrl}AdminForms/GetFormAvailableSections/${formId}`;
    return this.callHttpGet(url, 'GetFormAvailableSections');
  }

  getFormFields(
    formId: number,
    sectionId: number,
    objectTypeId: number,
    objectId: number = null,
    relatedObjectId: number = null
  ): Observable<any> {
    return this.callHttpGet(
      `${this.formWizardUrl}AdminForms/GetFormFields/${formId}/${sectionId}/${objectTypeId}`,
      'GetFormFields',
      {
        objectId,
        relatedObjectId,
      }
    );
  }

  getFormFieldsForAllSections(
    formId: number,
    objectTypeId: number,
    formSections: []
  ): Observable<ApiResponse> {
    const url = `${this.formWizardUrl}AdminForms/GetFormFieldsForAllSections/${formId}/${objectTypeId}`;
    return this.callHttpPost(url, 'GetFormFieldsForAllSections', formSections);
  }

  getAvailableFormFields(
    formId: number,
    objectTypeId: number
  ): Observable<any> {
    const url = `${this.formWizardUrl}AdminForms/GetAvailableFormFields/${formId}/${objectTypeId}`;
    return this.callHttpGet(url, 'GetAvailableFormFields');
  }

  getFormItemDataTypes(): Observable<any> {
    const url = `${this.formWizardUrl}AdminForms/GetFormItemDataTypes`;
    return this.callHttpGet(url, 'GetFormItemDataTypes');
  }

  getFormItemControlTypes(): Observable<any> {
    const url = `${this.formWizardUrl}AdminForms/GetFormItemControlTypes`;
    return this.callHttpGet(url, 'GetFormItemControlTypes');
  }

  getFormItemWidgetByWidgetId(
    widgetId: number,
    objectId: number
  ): Observable<any> {
    const url = `${this.formWizardUrl}AdminForms/GetFormItemWidgetByWidgetId/${widgetId}/${objectId}`;
    return this.callHttpGet(url, 'GetFormItemWidgetByWidgetId');
  }

  getFormItemDatabaseTables(): Observable<any> {
    const url = `${this.formWizardUrl}AdminForms/GetFormItemDatabaseTables`;
    return this.callHttpGet(url, 'GetFormItemDatabaseTables');
  }

  getDatabaseColumnsByTableName(tableName: string): Observable<any> {
    const url = `${this.formWizardUrl}AdminForms/GetDatabaseColumnsByTableName/${tableName}`;
    return this.callHttpGet(url, 'GetDatabaseColumnsByTableName');
  }

  getFormItemDropdowns(): Observable<any> {
    const url = `${this.formWizardUrl}AdminForms/GetFormItemDropdowns`;
    return this.callHttpGet(url, 'GetFormItemDropdowns');
  }

  getRenderFormData(
    formId: number,
    objectId: number,
    objectTypeId: number,
    relatedObjectId: number = 0,
    relatedObjectTypeId: number = 0,
    isDynamicPopUp: boolean = false
  ): Observable<any> {
    const url = `${this.formWizardUrl}RenderForms/GetRenderForm/${formId}/${objectId}/${objectTypeId}/${relatedObjectId}/${relatedObjectTypeId}/${isDynamicPopUp}`;
    return this.callHttpGet(url, 'GetRenderFormData');
  }

  getFormName(
    formId: number,
    objectId: number,
    objectTypeId: number
  ): Observable<any> {
    const url = `${this.formWizardUrl}RenderForms/GetFormName/${formId}/${objectId}/${objectTypeId}`;
    return this.callHttpGet(url, 'GetFormName');
  }

  getRenderFormFormItemDropdowns(
    formId: number,
    objectId: number,
    objectTypeId: number,
    parentObjectId: number,
    parentObjectTypeId: number
  ): Observable<ApiResponse> {
    const url = `${this.formWizardUrl}RenderForms/GetFormItemDropdownValues/${formId}/${objectId}/${objectTypeId}/${parentObjectId}/${parentObjectTypeId}`;
    return this.callHttpGet(url, 'GetFormItemDropdownValues');
  }

  getParentLink(objectId: number, objectTypeId: number): Observable<any> {
    const url = `${this.formWizardUrl}RenderForms/GetParentLink/${objectId}/${objectTypeId}`;
    return this.callHttpGet(url, 'GetParentLink');
  }

  getBuildings(hidePremise) {
    const url = `${this.formWizardUrl}RenderForms/getbuildings?hidePremise=${hidePremise}`;
    return this.callHttpGet(url, 'GetBuildings');
  }

  getBuildingPremises(buildingId) {
    const url = `${this.formWizardUrl}RenderForms/getbuildingpremises/${buildingId}`;
    return this.callHttpGet(url, 'GetBuildingPremises');
  }

  getChangeHistory(
    controlId: number,
    objectId: number,
    objectTypeId: number
  ): Observable<any> {
    const url = `${this.formWizardUrl}RenderForms/getchangehistory/${controlId}/${objectId}/${objectTypeId}`;
    return this.callHttpGet(url, 'GetChangeHistory');
  }

  /**
   * Object Actions: GetFormItemChangeHistory
   *
   * @param {*} ObjectID
   * @param {*} ObjectTypeID
   * @param {*} ObjectTypeTypeID
   * @param {*} FormItemID
   * @param {*} RelatedObjectID
   * @param {*} RelatedObjectTypeID
   * @param {*} RelationshipDefinitionID
   * @memberof DynamicFormsService
   */
  getFormItemChangeHistory(
    objectDataParams: Partial<ObjectData>
  ): Observable<ApiResponse> {
    const url = `${this.objectActions}ObjectActions/GetFormItemChangeHistory`;
    return this.callHttpGet(url, 'GetFormItemChangeHistory', objectDataParams);
  }

  copyLease(copyLease: CopyLease) {
    const url = `${this.formWizardUrl}RenderForms/copylease`;
    return this.callHttpPost(url, 'copyLease', copyLease);
  }

  saveRenderForm(
    saveRenderFormCommand: SaveRenderFormCommand
  ): Observable<any> {
    const url = `${this.formWizardUrl}RenderForms/save`;
    return this.callHttpPost(url, 'RenderFormsSave', saveRenderFormCommand);
  }

  getCountries(): Observable<ApiResponse> {
    const url = `${this.projectUrl}projects/GetCountries`;
    return this.callHttpGet(url, 'getCountries');
  }

  getStates(country: string): Observable<ApiResponse> {
    const url = `${this.projectUrl}projects/GetStates?country=${country}`;
    return this.callHttpGet(url, 'getStates');
  }

  getBuildingsForActions(
    country: string,
    state: string
  ): Observable<ApiResponse> {
    const url = `${this.projectUrl}projects/GetBuildings`;
    return this.callHttpPost(url, 'getBuildingsForActions', {
      country: country,
      state: state,
    });
  }

  getPremises(buildingId: number): Observable<ApiResponse> {
    const url = `${this.projectUrl}projects/GetPremises/${buildingId}`;
    return this.callHttpGet(url, 'getPremises');
  }

  getLeases(buildingId: number, premiseId: number): Observable<ApiResponse> {
    const url = `${this.projectUrl}projects/GetLeases/${buildingId}/${premiseId}`;
    return this.callHttpGet(url, 'getLeases');
  }

  getAssociateBuildingToProject(projectId: number): Observable<ApiResponse> {
    const url = `${this.projectUrl}projects/AssociateBuildingToProject/${projectId}`;
    return this.callHttpGet(url, 'getAssociateBuildingToProject');
  }

  setAssociateBuildingToProject(buildingInfo: any): Observable<ApiResponse> {
    const url = `${this.projectUrl}projects/AssociateBuildingToProject/`;
    return this.callHttpPost(
      url,
      'setAssociateBuildingToProject',
      buildingInfo
    );
  }

  getAssociateLeaseToProject(projectId: number): Observable<ApiResponse> {
    const url = `${this.projectUrl}projects/AssociateLeaseToProject/${projectId}`;
    return this.callHttpGet(url, 'getAssociateLeaseToProject');
  }

  getComposeEmailInfo(objectId: number, ObjectTypeId: number) {
    const url = `${this.formWizardUrl}RenderForms/getcomposeemailinfo/${objectId}/${ObjectTypeId}`;
    return this.callHttpGet(url, 'getcomposeemailinfo');
  }

  setAssociateLeaseToProject(leaseInfo: any): Observable<ApiResponse> {
    const url = `${this.projectUrl}projects/AssociateLeaseToProject`;
    return this.callHttpPost(url, 'setAssociateLeaseToProject', leaseInfo);
  }

  addBookmark(bookmarkInfo: any): Observable<ApiResponse> {
    const url = `${this.formWizardUrl}RenderForms/AddBookmark`;
    return this.callHttpPost(url, 'addBookmark', bookmarkInfo);
  }

  downloadExcel(
    formId: number,
    objectId: number,
    objectTypeId: number,
    objectTypeTypeId: number
  ): Observable<any> {
    const url = `${this.formWizardUrl}adminForms/download/excel?formId=${formId}&objectId=${objectId}&objectTypeId=${objectTypeId}&objectTypeTypeId=${objectTypeTypeId}`;
    return this.http.get(url, {
      observe: 'response',
      responseType: 'blob',
    });
  }

  downloadPdf(
    formId: number,
    objectId: number,
    objectTypeId: number,
    objectTypeTypeId
  ): Observable<any> {
    const url = `${this.formWizardUrl}adminForms/download/pdf?formId=${formId}&objectId=${objectId}&objectTypeId=${objectTypeId}&objectTypeTypeId=${objectTypeTypeId}`;
    return this.http.get(url, {
      observe: 'response',
      responseType: 'blob',
    });
  }

  getClauseTypes(): Observable<ApiResponse> {
    const url = `${this.formWizardUrl}RenderForms/GetClauseTypes`;
    return this.callHttpGet(url, 'getClauseTypes');
  }

  getClauseBanks(clauseTypeId: number): Observable<ApiResponse> {
    const url = `${this.formWizardUrl}RenderForms/GetClauseBanks/${clauseTypeId}`;
    return this.callHttpGet(url, 'getClauseBanks');
  }

  saveClauseBank(clauseBankInfo: any): Observable<ApiResponse> {
    const url = `${this.formWizardUrl}RenderForms/SaveClauseBank`;
    return this.callHttpPost(url, 'saveClauseBank', clauseBankInfo);
  }

  deleteClauseBank(clauseBankId: number): Observable<ApiResponse> {
    const url = `${this.formWizardUrl}RenderForms/DeleteClauseBank/${clauseBankId}`;
    return this.callHttpPost(url, 'deleteClauseBank', null);
  }

  downloadDocument(filename: string): Observable<HttpResponse<Blob>> {
    const url = `${this.formWizardUrl}FormWizards/download/${filename}`;
    return this.downloadFile(url);
  }

  getLeaseVerificationStatuses(
    objectId: number,
    ObjectTypeId: number,
    objectTypeTypeId: number
  ) {
    const url = `${this.formWizardUrl}RenderForms/GetLeaseVerificationStatuses/${objectId}/${ObjectTypeId}/${objectTypeTypeId}`;
    return this.callHttpGet(url, 'getLeaseVerificationStatuses');
  }

  validateLeaseVerificationStatusRequiredFields(
    formId: number,
    objectId: number,
    ObjectTypeId: number,
    objectTypeTypeId: number
  ) {
    const url = `${this.formWizardUrl}RenderForms/ValidateLeaseVerificationStatusRequiredFields/${formId}/${objectId}/${ObjectTypeId}/${objectTypeTypeId}`;
    return this.callHttpGet(
      url,
      'validateLeaseVerificationStatusRequiredFields'
    );
  }

  updateLeaseVerificationStatus(
    leaseVerificationStatus: UpdateLeaseVerificationStatusRequest
  ): Observable<ApiResponse> {
    const url = `${this.formWizardUrl}RenderForms/UpdateLeaseVerificationStatus`;
    return this.callHttpPut(
      url,
      'updateLeaseVerificationStatus',
      leaseVerificationStatus
    );
  }

  getFormForObjectTypeType(ottid: number): Observable<ApiResponse> {
    const url = `${this.formWizardUrl}RenderForms/formid/${ottid}`;

    return this.callHttpGet(url, 'getFormForObjectTypeType');
  }

  //Form behaviors
  getBehaviorConfigs() {
    const url = `${this.formWizardUrl}behavior/GetBehaviorConfigs`;
    return this.callHttpGet(url, 'getBehaviorConfigs');
  }

  deleteSubObject(payload: DeleteSubObjectRequest): Observable<ApiResponse> {
    const url = `${this.formWizardUrl}RenderForms/SubObject`;

    return this.callHttpDeleteWithBody(url, 'deleteSubObject', payload);
  }

  deleteVendor(payload: DeleteSubObjectRequest): Observable<ApiResponse> {
    const url = `${this.formWizardUrl}RenderForms/Vendor`;

    return this.callHttpDeleteWithBody(url, 'deleteVendor', payload);
  }

  getBehaviors(formSectionId: number, formId: number) {
    const url = `${this.formWizardUrl}behavior/GetBehaviors/${formSectionId}/${formId}`;
    return this.callHttpGet(url, 'getBehaviors');
  }

  saveFormBehavior(formBehavior: object): Observable<ApiResponse> {
    const url = `${this.formWizardUrl}behavior/SaveBehavior`;
    return this.callHttpPost(url, 'saveBehavior', formBehavior);
  }

  deleteFormBehavior(formBehaviorID: string): Observable<ApiResponse> {
    const url = `${this.formWizardUrl}behavior/DeleteBehavior/${formBehaviorID}`;
    return this.callHttpDelete(url, 'deleteBehavior');
  }

  getVendorHasCharges(vendorId: number): Observable<ApiResponse> {
    const url = `${this.formWizardUrl}RenderForms/VendorHasCharges/${vendorId}`;

    return this.callHttpGet(url, 'getVendorHasCharges');
  }
}
