export class ITemplate {
  templateId: number | null = 0;
  templateName: string | null = '';
  templateTypeId: number = 0;
  objectType: string | null = '';
  objectTypeId: number | null = null;
  objectTypeTypeId: number | null = 0;
  keyField: string | null = '';
  formId: number | null = 0;
  parentObjectTypeId: number | null = null;
  parentLookupValue: string | null = '';
  parentObjectText: string | null = '';
  isActive: boolean | null = null;
  createdBy: number | null = null;
  createdDate: string | null = null;
  modifiedBy: number | null = null;
  modifiedDate: string | null = null;
  keyFieldDisplayName: string | null = null;
  relationshipDefinitionID: number | null = null;
  formItemListID: number | null = null;
  updateOnly: boolean | null = false;
  tableViewName: string | null = null;
  isLocked: boolean | null = false;
  isReadOnly: boolean | null = false;
  setReadOnlyBy: number | null = null;
  setReadOnlyByContactName: string | null = null;
  isImportForAccounting: boolean | null = false;
  isImportForFinancials: boolean | null = false;
  canEdit: boolean | null = null;
  isCopy: boolean = false;

  static createDefaultTemplate(): ITemplate {
    return new ITemplate();
  }
}
