import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormsFacade } from '@forms/+state/dynamic-forms.facade';

import { DynamicWidgetService } from './dynamic-form.service';
import { IsObjectEmptyPipe, WidgetNamePipe } from './dynamic-widget.pipe';
import {
  ButtonModule,
  CremToastService,
  DropdownModule,
  FieldHistoryComponent,
  LibUiElementsModule,
  ModalModule,
  SkeletonModule,
  CremPopupComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { SearchModule } from '@mango/ui-shared/cosmos';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { DevExpressModule } from 'libs/ui-shared/lib-external-libraries/src/lib/3rdParty/dev-express.module';
import { EMPTY, Observable, Subject, combineLatest, forkJoin, of } from 'rxjs';
import {
  DeleteSubObjectRequest,
  FormWidgetTypeID,
  IFields,
  Widget,
} from '@forms/model/dynamic-forms.interface';
import { ObjectData } from '@forms/model/form-item-change-history';
import {
  catchError,
  filter,
  switchMap,
  take,
  map,
  takeUntil,
  finalize,
} from 'rxjs/operators';
import {
  DxDataGridComponent,
  DxDataGridTypes,
  DxDataGridModule,
} from 'devextreme-angular/ui/data-grid';
import {
  DxPivotGridModule,
  DxPivotGridComponent,
} from 'devextreme-angular/ui/pivot-grid';
import { AddLeaseModalComponent } from 'libs/ui-shared/lib-ui-shared/src/lib/add-lease-modal/add-lease-modal.component';
import { AddFormWizardComponent } from '@micro-components/form-wizard/modal/add-form-wizard/add-form-wizard.component';
import { AddEquipmentModalComponent } from 'libs/ui-shared/lib-ui-shared/src/lib/add-equipment-modal/add-equipment-modal.component';
import { AddPremiseModalComponent } from 'libs/ui-shared/lib-ui-shared/src/lib/add-premise-modal/add-premise-modal.component';
import { DynamicPopupComponent } from '@forms/modals/dynamic-popup/dynamic-popup.component';
import { DynamicFormsService } from '@forms/services/dynamic-forms.service';
import * as fileSaver from 'file-saver-es';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import {
  ContactRecord,
  ToastState,
  FieldHistoryDataSource,
} from '@mango/data-models/lib-data-models';
import { MangoNavigationService } from 'apps/mango/src/app/services/navigation.service';
import { Router } from '@angular/router';
import {
  DynamicWidgetConfiguration,
  RenderFormData,
  SettingsDropDownConfig,
  SettingsDropdownOptions,
  WidgetRenderContext,
  GridMasterDetail,
} from './dynamic-widget.model';
import { historyGridColumns, uiNameTitles } from './widget-schema.config';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';
import { DxDropDownButtonComponent } from 'devextreme-angular';
import { CremDataIdDirective } from '../../../../../../core-shared/src/lib/directives/data-id.directive';
import { SubObjectComparisonService } from '@reports/components/sub-object-comparison/sub-object-comparison.service';
import { DeleteSubObjectPopupComponent } from './delete-subobject-popup/delete-subobject-popup.component';
import { FormWizardService } from '@micro-components/services/form-wizard.service';
import { DynamicFormWidgetExportComponent } from './dynamic-form-widget-export';
import {
  ObjectType,
  ObjectTypeType,
  DataType,
} from 'libs/data-models/lib-data-models/src/lib/enums/index';
import { ListPageService } from 'apps/mango-crem-features/list-pages/src/app/components/listpage/core/services/listpage.service';
import { MasterDetailFormatPipe } from '../pipes/master-detail-format.pipe';
import { environment } from '@mangoSpa/src/environments/environment.local';

type redirectToLeaseOption = (params: {
  oid: number;
  otid: number;
  ottid: number;
  fid: number;
  leaseOptionID?: number;
  widgetID: number;
  edit: boolean;
}) => void;

type EditButtonFunctionMap = {
  LeaseOptions: redirectToLeaseOption;
};

@Component({
  selector: 'mango-dynamic-form-widget',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LibUiElementsModule,
    SearchModule,
    ButtonModule,
    MatIconModule,
    ModalModule,
    MatMenuModule,
    MatButtonModule,
    FontAwesomeModule,
    MatDialogModule,
    MatCardModule,
    DropdownModule,
    DevExpressModule,
    FontAwesomeModule,
    SkeletonModule,
    FieldHistoryComponent,
    DxDataGridModule,
    DxPivotGridModule,
    CremPopupComponent,
    DeleteSubObjectPopupComponent,
    DynamicFormWidgetExportComponent,
    WidgetNamePipe,
    IsObjectEmptyPipe,
    CremDataIdDirective,
    MasterDetailFormatPipe,
  ],
  providers: [
    DynamicFormsService,
    MangoNavigationService,
    DynamicWidgetService,
    SubObjectComparisonService,
  ],
  templateUrl: './dynamic-form-widget.component.html',
  styleUrls: ['./dynamic-form-widget.component.scss'],
})
export class DynamicFormWidgetComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() section!: any;
  @Input() form!: FormGroup;
  @Input() field!: IFields;
  @Input() editMode: boolean;

  /**
   * Object data types to get the object history
   */
  @Input() objectId: number;
  @Input() objectTypeId: number;
  @Input() objectTypeTypeId: number;
  @Input() formId: number;

  /**
   * Hides the button locally. Useful to hide the button here but still
   * show it on a parent component via canShowDownload output
   *
   * @type {boolean}
   * @memberof DynamicFormWidgetComponent
   */
  @Input() showDownloadButton = true as boolean;

  /**
   * Emits the widgetResponse.data.allowExcelExport value to show/hide download
   * button on the parent component
   *
   * @type {EventEmitter<boolean>}
   * @memberof DynamicFormWidgetComponent
   */
  @Output() canShowDownload: EventEmitter<boolean> = new EventEmitter();

  /**
   * gridConfig.gridView is 'pivotGrid', the pivot view will be available
   * to show.
   */
  pivotGridDataSource: PivotGridDataSource;

  isLoading: boolean;
  errorLoading: boolean;
  userMessage: string;
  objTypeList: number[] = [1, 2, 3, 4, 120];
  selectWidget$: Observable<Widget>;
  isRenderForm = this.dynamicFormsFacade.selectIsRenderForm$;
  showFileIcon = false;
  showActionColumn = false;
  dateFormat: string;
  loadedWidgetData: boolean;
  loadedUserPreferences: boolean;
  columnFormatMap: Map<string, string>;
  dataFieldTable: string;
  private _destroy$ = new Subject<void>();

  /**
   * Assign the columns configuration to the History Grid Configuration
   */
  historyGridColumns = historyGridColumns;

  numberColumnTypeIds = new Set([
    DataType.SINGLE.toString(),
    DataType.DOUBLE.toString(),
    DataType.DECIMAL.toString(),
    DataType.NUMERIC_9W.toString(),
    DataType.NUMERIC_10W.toString(),
    DataType.PERCENT.toString(),
  ]);
  DATE_COL_ID = '7';
  LEASE_OPTION_WIDGET_ID = 1;
  /* Grid Configuration */
  dynamicWidgetConfiguration: Partial<DynamicWidgetConfiguration>;

  @ViewChild('widgetPreferences', { static: false })
  widgetPreferences!: DxDropDownButtonComponent;

  @ViewChild('widgetDataGrid', { static: false })
  widgetDataGrid: DxDataGridComponent;

  @ViewChild('widgetPivotGrid', { static: false })
  widgetPivotGrid: DxPivotGridComponent;

  showFormWidgetHistory = false;
  allowLinking = false;
  allowEdits = false;

  widgetId: number;
  dataGroupID: number;
  columnGroupID: number;
  isSuperUser = false;

  widgetFormId: number;
  widgetObjectTypeId: number;
  widgetObjectTypeTypeId: number;
  widgetRelationshipDefId: number;
  widgetChildObjectTypeId: number;
  launchFormID: number;
  widgetSummary: FormWidgetTypeID.SUMMARY;
  widgetSummaryDynamic: FormWidgetTypeID.SUMMARY_DYNAMIC;
  actionsInclusions = {
    openFile: ['Document Index', 'Documents Index', 'Audit Tracker'],
  };

  /**
   *
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDataGrid/Configuration/masterDetail/
   * @type {*}
   * @memberof DynamicFormWidgetComponent
   */
  gridMasterDetail: GridMasterDetail;

  /**
   * Decimal Precision of the currency types
   * todo: This should be dynamically defined
   *
   * @memberof DynamicFormWidgetComponent
   */
  decimalPrecision = 2 as number;

  /**
   * Settings dropdown Options and Configurations
   */
  settingsDropDownOptions: SettingsDropdownOptions;
  settingsDropDownConfig: SettingsDropDownConfig;

  widgetHistoryData: Partial<FieldHistoryDataSource>;
  rowHistoryData: Partial<FieldHistoryDataSource>;

  /**
   * These are used for dynamic-form-widget-export sub-component,
   * @memberof DynamicFormWidgetComponent
   */
  shouldRenderExportGrid = false as boolean;
  isCreatingExport = false as boolean;

  oid: number;
  otid: number;
  ottid: number;
  fid: number;

  public env = environment; // expose for template

  constructor(
    private dynamicFormsFacade: DynamicFormsFacade,
    private dialog: MatDialog,
    private dynamicFormsService: DynamicFormsService,
    private facade: MangoAppFacade,
    private widgetService: DynamicWidgetService,
    private toastService: CremToastService,
    private navService: MangoNavigationService,
    private formWizardService: FormWizardService,
    private router: Router,
    private listPageService: ListPageService
  ) {
    this.onSettingsOptionClick = this.onSettingsOptionClick.bind(this);
    this.onOpenFileClick = this.onOpenFileClick.bind(this);
    this.onEditClick = this.onEditClick.bind(this);
    this.onCompare = this.onCompare.bind(this);
    this.onDeleteClick = this.onDeleteClick.bind(this);

    const urlParams = this.router.parseUrl(this.router.url).queryParamMap;
    this.oid = parseInt(urlParams.get('OID') || urlParams.get('oid'));
    this.otid = parseInt(urlParams.get('OTID') || urlParams.get('otid'));
    this.ottid = parseInt(urlParams.get('OTTID') || urlParams.get('ottid'));
    this.fid = parseInt(urlParams.get('FID') || urlParams.get('fid'));
  }

  async ngOnInit() {
    this.widgetSummary = FormWidgetTypeID.SUMMARY;
    this.widgetSummaryDynamic = FormWidgetTypeID.SUMMARY_DYNAMIC;
    this.isLoading = true;

    // Create renderFormData object that will be used widgetService
    const renderFormData: Partial<RenderFormData> = {
      section: this.section,
      form: this.form,
      objectId: this.objectId,
      objectTypeId: this.objectTypeId,
      objectTypeTypeId: this.objectTypeTypeId,
      formId: this.formId,
    };

    const contactPreferences$ =
      typeof this.getContactPreferences === 'function'
        ? this.getContactPreferences()
        : of(null);

    const loadWidget$ =
      typeof this.loadWidget === 'function' ? this.loadWidget() : of(null);

    // Get data
    forkJoin([contactPreferences$, loadWidget$])
      .pipe(
        takeUntil(this._destroy$),
        switchMap(() => {
          if (!this.selectWidget$) {
            console.error('selectWidget$ was not initialized by loadWidget()');
            return of(null);
          }

          return this.selectWidget$.pipe(
            switchMap((widgetData) => {
              return this.widgetService.onLoad(
                widgetData,
                renderFormData,
                this.decimalPrecision,
                false // show console.debug
              );
            }),
            switchMap(() => this.widgetService.WidgetViewData$)
          );
        })
      )
      .subscribe({
        next: (result: WidgetRenderContext) => {
          if (result) {
            // Initial Widget Grid Configuration
            this.dynamicWidgetConfiguration = result.gridConfig;

            // Grid Configs
            this.gridMasterDetail = result.gridMasterDetail;

            // Initial History Grid data and Configuration
            this.rowHistoryData = result.rowHistoryData;
            this.widgetHistoryData = result.widgetHistoryData;
            this.pivotGridDataSource = result.pivotGridDataSource;

            // Settings Configuration
            this.settingsDropDownOptions = result.settingsDropDownOptions;
            this.settingsDropDownConfig = result.settingsDropDownConfig;
          }
        },
        error: (err) => {
          console.error('Error in initializing widget:', err);
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });

    // Bind to service's loading state
    this.widgetService.isLoading$.subscribe(
      (isLoading) => (this.isLoading = isLoading)
    );

    this.showFileIcon = this.actionsInclusions.openFile.includes(
      this.section?.formSectionName
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editMode']) {
      this.showActionColumn = this.checkShowActionColumn();
    }
  }

  private loadWidget(): Observable<void> {
    this.dynamicFormsFacade.loadWidgetByWidgetId(
      this.field.widgetID,
      this.field.formObjectId ?? this.objectId
    );

    return this.dynamicFormsFacade
      .selectFormItemWidgetsApiResponseByWidgetId(this.field.widgetID)
      .pipe(
        filter((res) => res !== null && res !== undefined),
        take(1),
        map((widgetResponse) => {
          if (!widgetResponse.data?.widgetID) {
            return EMPTY;
          }
          const clone = JSON.parse(JSON.stringify(widgetResponse));
          clone.data.renderFormWidgetData = this.widgetService.getUniqueByOid(
            clone.data.renderFormWidgetData
          );
          clone.data = this.convertDateStrings(clone.data);
          this.columnFormatMap = this.buildColumnFormatting(clone.data);
          return clone;
        }),
        switchMap((widgetResponse) => {
          if (!widgetResponse.success) {
            this.errorLoading = true;
            if (widgetResponse.statusCode === 400) {
              this.userMessage = widgetResponse.clientErrorMessage;
            }
            return EMPTY;
          } else {
            this.allowEdits = widgetResponse.data.allowEdits;
            this.allowLinking = widgetResponse.data.allowLinking;
            this.showFormWidgetHistory =
              widgetResponse.data.showFormWidgetHistory;
            this.widgetId = widgetResponse.data.widgetID;
            this.dataGroupID = widgetResponse.data.dataGroupID;
            this.columnGroupID = widgetResponse.data.columnGroupID;
            this.dataFieldTable =
              widgetResponse.data.columnGroup.columnGroupName;
            this.widgetFormId = widgetResponse.data.formID;
            this.widgetObjectTypeId = widgetResponse.data.objectTypeID;
            this.widgetObjectTypeTypeId = widgetResponse.data.objectTypeTypeID;
            this.widgetRelationshipDefId =
              widgetResponse.data.relationshipDefinitionID;
            this.widgetChildObjectTypeId =
              widgetResponse.data.childObjectTypeID;
            this.showActionColumn = this.checkShowActionColumn();

            if (widgetResponse.data.subObject) {
              this.dynamicFormsService
                .getFormForObjectTypeType(this.widgetObjectTypeTypeId)
                .subscribe((result) => {
                  this.launchFormID = result.data.formID;
                });
            }
            this.selectWidget$ = of(widgetResponse.data);

            this.canShowDownload.emit(widgetResponse.data.allowExcelExport);
            return of(null);
          }
        }),
        catchError((error) => {
          console.error('Error loading widget:', error);
          return of(null);
        })
      );
  }

  private getContactPreferences(): Observable<ContactRecord> {
    return this.facade.contactRecord$.pipe(
      take(1),
      map((contact) => {
        this.isSuperUser = contact.userRoleName === 'SuperUser';
        this.dateFormat = contact.preferences.contactDatesEU
          ? 'dd.MM.yyyy'
          : 'MM/dd/yyyy';
        return contact;
      })
    );
  }

  /**
   * Get the Widget's History Data
   *
   * @param {*} widgetData
   * @param {number} objectId
   * @param {number} [objectTypeId]
   * @memberof DynamicFormWidgetComponent
   */
  getWidgetHistoryData(widgetData, objectId: number, objectTypeId?: number) {
    const objectDataParams: Partial<ObjectData> = {
      ObjectTypeID: widgetData.objectTypeID,
      ObjectTypeTypeID: widgetData.objectTypeTypeID ?? '',
      RelatedObjectID: objectId, //,
      RelatedObjectTypeID: objectTypeId,
      RelationshipDefinitionID: widgetData.relationshipDefinitionID,
    };

    this.dynamicFormsService
      .getFormItemChangeHistory(objectDataParams)
      .pipe(takeUntil(this._destroy$))
      .subscribe(
        (res) => {
          if (!res.success) {
            return;
          }

          this.widgetHistoryData.helpTextHistory = res.data.length
            ? this.widgetService.addIdsToData(res.data)
            : [];
        },
        (err) => {
          console.error('An error has occurred. Please try again.', err);
          this.toastService.show(
            'An error has occurred. Please try again.',
            '',
            ToastState.ERROR,
            {
              position: 'bottom right',
              maxWidth: '350px',
            }
          );
        }
      );
  }

  /**
   * Get data for the row history
   *
   * @param {ObjectData} controlData
   * @memberof DynamicFormWidgetComponent
   */
  getRowHistoryData(
    widgetData,
    currentRowData?,
    objectId?: number,
    objectTypeId?: number
  ) {
    const objectDataParams: ObjectData = {
      ObjectID: currentRowData?.data?.oid,
      ObjectTypeID: widgetData.objectTypeID,
      ObjectTypeTypeID:
        widgetData.objectTypeTypeID ??
        currentRowData?.data?.objecttypetypeid ??
        '',
      RelatedObjectID: objectId,
      RelatedObjectTypeID: objectTypeId,
      RelationshipDefinitionID: widgetData.relationshipDefinitionID,
    };

    if (!objectDataParams.ObjectTypeTypeID) {
      return;
    }

    this.dynamicFormsService
      .getFormItemChangeHistory(objectDataParams)
      .pipe(takeUntil(this._destroy$))
      .subscribe(
        (res) => {
          if (!res.success) {
            return;
          }

          // Assign results to widget History
          if (res.data?.length) {
            // Filter data, the API returns everything no matter the parameters
            const filteredRowData = [
              ...this.widgetService.addIdsToData(
                this.widgetService.filterByKeyAndValue(
                  res.data,
                  'ObjectID',
                  objectDataParams.ObjectID
                )
              ),
            ];
            this.rowHistoryData.helpTextHistory = filteredRowData;
          } else {
            this.rowHistoryData.helpTextHistory = [];
          }
        },
        (err) => {
          console.error('An error has occurred. Please try again.', err);
          this.toastService.show(
            'An error has occurred. Please try again.',
            '',
            ToastState.ERROR,
            {
              position: 'bottom right',
              maxWidth: '350px',
            }
          );
        }
      );
  }

  convertDateStrings(widget: any): any {
    const columnFields = widget.columnGroup?.columnFields as Array<any>;
    const columnRowData = widget?.renderFormWidgetData;

    if (!(columnFields && columnRowData)) {
      return;
    }

    const dateFields = columnFields
      .filter((x) => x.dataFieldDataType === this.DATE_COL_ID)
      .map((x) => x.dataFieldTableField?.toLowerCase());

    for (let i = 0; i < columnRowData.length; i++) {
      for (let j = 0; j < dateFields.length; j++) {
        if (
          columnRowData[i][dateFields[j]] &&
          !Number.isNaN(Date.parse(columnRowData[i][dateFields[j]])) &&
          // We need at least 6 chars to have a proper date (YYYYMMDD)
          // otherwise, leave it as a string
          columnRowData[i][dateFields[j]].length > 6
        ) {
          columnRowData[i][dateFields[j]] = new Date(
            columnRowData[i][dateFields[j]]
          );
        }
      }
    }

    return widget;
  }

  // Used to get column formatting so it can be applied again on excel export
  buildColumnFormatting(widget: any): Map<string, string> {
    const columnFields = widget?.columnGroup?.columnFields as Array<any>;

    if (!columnFields) {
      return;
    }

    const columnFormatMap = columnFields.reduce(
      (acc: Map<string, string>, columnField) => {
        if (columnField.dataTypeFormatString) {
          acc.set(columnField.columnHeader, columnField.dataTypeFormatString);
        } else if (
          this.numberColumnTypeIds.has(columnField.dataFieldDataType)
        ) {
          const twoDecimalsFmt = '#,##0.00';
          acc.set(columnField.columnHeader, twoDecimalsFmt);
          // Set so we can read this property in the template instead of calling a function
          // and creating more work in each re-render.
          columnField.dataTypeFormatString = twoDecimalsFmt;
        }

        return acc;
      },
      new Map()
    ) as Map<string, string>;

    return columnFormatMap;
  }

  checkShowActionColumn(): boolean {
    if (this.editMode) {
      return this.allowLinking || this.allowEdits || this.showFormWidgetHistory;
    }

    return this.allowLinking || this.showFormWidgetHistory;
  }

  /**
   * Handle Widget Preferences Actions
   *
   * @param {*} event
   * @memberof DynamicFormWidgetComponent
   */
  onSettingsOptionClick(event) {
    const option: string = event.itemData.option;

    switch (option) {
      case 'v06-EditWidget': {
        const url = this.router.serializeUrl(
          this.router.createUrlTree([
            `/v06/Forms/admin/Widgets/FormwidgetsAddEdit.aspx?widgetID=${this.widgetId}`,
          ])
        );
        window.open(url, '_blank');
        break;
      }
      case 'v06-DataGroup': {
        this.navService.navigateToClassicAspAdminUrl(
          '/admin/DataGroups/DataGroupFields.asp',
          {
            queryParams: {
              DGID: this.dataGroupID,
              strFuction: 'EDIT',
            },
            newTab: true,
          }
        );
        break;
      }
      case 'v06-ColumnFields': {
        const url = this.router.serializeUrl(
          this.router.createUrlTree([
            `/v06/admin/ColumnField/ColumnFields.aspx?ColumnGroupID=${this.columnGroupID}&ColumnGroup=${this.dataFieldTable}`,
          ])
        );
        window.open(url, '_blank');
        break;
      }
      case 'v06-ColumnGroups': {
        this.navService.navigateToClassicAspAdminUrl(
          '/admin/ColumnGroups/ColumnGroupAE.asp',
          {
            queryParams: {
              ColumnGroupID: this.columnGroupID,
              ColumnGroup: this.dataFieldTable,
            },
            newTab: true,
          }
        );
        break;
      }
      case 'columnChooser': {
        this.widgetDataGrid.instance.showColumnChooser();
        break;
      }
      case 'changeGridView': {
        if (this.dynamicWidgetConfiguration.gridView === 'dataGrid') {
          // Updates the Dropdown Names
          this.settingsDropDownOptions = this.widgetService.setDropDownOption(
            this.settingsDropDownOptions,
            {
              ...event.itemData,
              text: `Change to ${uiNameTitles['dataGrid'] ?? 'ERROR'}`,
            }
          );
          // Set the view to the opposite of dataGrid
          this.dynamicWidgetConfiguration.gridView = 'pivotGrid';
          // Close the Dropdown
          this.widgetPreferences.instance.close();
        } else {
          this.settingsDropDownOptions = this.widgetService.setDropDownOption(
            this.settingsDropDownOptions,
            {
              ...event.itemData,
              text: `Change to ${uiNameTitles['pivotGrid'] ?? 'ERROR'}`,
            }
          );
          this.dynamicWidgetConfiguration.gridView = 'dataGrid';
          this.widgetPreferences.instance.close();
        }
        break;
      }
    }
  }

  redirectToLeaseOption(params: {
    oid: number;
    otid: number;
    ottid: number;
    fid: number;
    widgetID: number;
    edit: boolean;
    leaseOptionID?: number;
  }) {
    const { oid, otid, ottid, fid, widgetID } = params;
    const pgMode = params.edit ? 'edit' : 'create';
    const leaseOptionID = params.edit ? params.leaseOptionID : oid;

    const url = this.router.serializeUrl(
      this.router.createUrlTree([
        `/v06/LeaseRecognition/Options.aspx?OID=${oid}&WidgetID=${widgetID}&OTTID=${ottid}&OTID=${otid}&ROID=&ROTID=&FID=${fid}&RDID=&pgMode=${pgMode}&fldFocus=dd&parentOID=${oid}&FFSGID=&leaseOptionID=${leaseOptionID}`,
      ])
    );

    window.open(url, '_self');
  }

  widgetActionFactory<K extends keyof EditButtonFunctionMap>(
    key: K
  ): EditButtonFunctionMap[K] {
    const functions: EditButtonFunctionMap = {
      LeaseOptions: this.redirectToLeaseOption.bind(this),
    };

    return functions[key];
  }

  getLeaseModalData(): Observable<{ objectId: number; objectName: string }> {
    if (this.ottid === ObjectTypeType.Premise) {
      return combineLatest([
        this.dynamicFormsFacade.selectRenderParentLink$,
      ]).pipe(
        take(1),
        takeUntil(this._destroy$),
        map(([parentLink]) => ({
          objectId: parentLink.objectId,
          objectName: parentLink.labelText,
        }))
      );
    } else {
      return combineLatest([
        this.dynamicFormsFacade.selectObjectId$,
        this.dynamicFormsFacade.selectFormName$,
      ]).pipe(
        take(1),
        takeUntil(this._destroy$),
        map(([objectId, objectName]) => ({ objectId, objectName }))
      );
    }
  }

  onAddWidget(widget: any) {
    if (
      widget?.columnGroup != null &&
      widget.columnGroup.widgetJSClickEvent != null &&
      widget.columnGroup.widgetJSClickEvent != ''
    ) {
      const modalConfig = {
        disableClose: true,
        width: '70vw',
        minWidth: '320px',
        maxWidth: '1100px',
        maxHeight: '90vh',
        data: {
          objectTypeId: Number(widget.objectTypeID),
        },
      };
      if (widget?.columnGroup.widgetJSClickEvent?.indexOf('Add Lease') > 0) {
        this.getLeaseModalData().subscribe(({ objectId, objectName }) => {
          const dialogLeaseRef = this.dialog.open(AddLeaseModalComponent, {
            ...modalConfig,
            data: {
              ...modalConfig.data,
              objectId,
              objectName,
              premiseId: this.otid === ObjectType.PREMISE ? this.oid : null,
            },
          });
          dialogLeaseRef
            .afterClosed()
            .pipe(filter((x) => !!x))
            .subscribe(this.handleDialogClose);
        });
      }
      if (
        widget.columnGroup.widgetJSClickEvent?.indexOf('Add Equipment Lease') >
        0
      ) {
        combineLatest([
          this.dynamicFormsFacade.selectObjectId$,
          this.dynamicFormsFacade.selectFormName$,
        ])
          .pipe(take(1), takeUntil(this._destroy$))
          .subscribe(([selectedObjectId, selectedFormName]) => {
            const dialogLeaseRef = this.dialog.open(
              AddEquipmentModalComponent,
              {
                ...modalConfig,
                data: {
                  ...modalConfig.data,
                  objectId: selectedObjectId,
                  objectName: selectedFormName,
                },
              }
            );
            dialogLeaseRef
              .afterClosed()
              .pipe(filter((x) => !!x))
              .subscribe(this.handleDialogClose);
          });
      }
      if (widget.columnGroup.widgetJSClickEvent.indexOf('AddNewPremise') > 0) {
        this.getLeaseModalData().subscribe(({ objectId, objectName }) => {
          const dialogRef = this.dialog.open(AddPremiseModalComponent, {
            ...modalConfig,
            data: {
              ...modalConfig.data,
              objectId,
              objectName,
            },
          });

          dialogRef
            .afterClosed()
            .pipe(filter((x) => !!x))
            .subscribe(this.handleDialogClose);
        });
      }
      if (
        widget.columnGroup.widgetJSClickEvent?.indexOf(
          'openNewProjectWizardModal'
        ) > 0
      ) {
        const dialogRef = this.dialog.open(AddFormWizardComponent, modalConfig);

        dialogRef.afterClosed();
      }
    } else {
      if (widget.leaseOptionTypeID === this.LEASE_OPTION_WIDGET_ID) {
        this.widgetActionFactory('LeaseOptions')({
          oid: this.oid,
          otid: this.otid,
          ottid: this.ottid,
          fid: this.fid,
          edit: false,
          widgetID: widget.widgetID,
        });
      } else {
        const dialogRef = this.dialog.open(DynamicPopupComponent, {
          disableClose: true,
          width: '40vw',
          minWidth: '320px',
          maxWidth: '1100px',
          maxHeight: '90vh',
          data: {
            isSubObject: widget.subObject,
            launchFormID: widget.subObject ? this.launchFormID : 0,
            formId: widget.formID,
            objectTypeId: widget.objectTypeID,
            objectTypeTypeId: widget.objectTypeTypeID,
            relatedObjectId: this.objectId,
            relatedObjectTypeId: this.objectTypeId,
            relatedDefinitionId: widget.relationshipDefinitionID,
            parentfid: this.fid,
          },
        });
        dialogRef
          .afterClosed()
          .pipe(filter((x) => !!x))
          .subscribe(this.handleDialogClose);
      }
    }
  }

  onImport() {
    //Import Logic
  }

  onCompare(widget: Widget) {
    if (widget.renderFormWidgetData.length < 1) {
      this.toastService.show(
        'Add at least one deal to compare.',
        '',
        ToastState.ERROR,
        {
          position: 'bottom right',
          maxWidth: '350px',
        }
      );

      return;
    }

    this.dynamicFormsService
      .getFormForObjectTypeType(this.widgetObjectTypeTypeId)
      .pipe(take(1))
      .subscribe((result) => {
        const formID = result.data.formID;
        const subObjectIds = widget.renderFormWidgetData.map((x) => x.oid);

        const url = this.router.serializeUrl(
          this.router.createUrlTree(
            [
              '/crem/reports/sub-object-comparison',
              formID,
              this.widgetChildObjectTypeId,
              this.oid,
              this.otid,
              this.widgetId,
            ],
            {
              queryParams: {
                subObjectIds: subObjectIds,
              },
            }
          )
        );

        window.open(url, '_blank');
      });
  }

  exportToExcel() {
    this.isCreatingExport = true;
    this.shouldRenderExportGrid = true;
  }

  exportDone(success: boolean) {
    this.isCreatingExport = false;
    this.shouldRenderExportGrid = false;

    this.toastService.show(
      success
        ? 'Exported to Excel successfully!'
        : 'An error has occurred. Please try again.',
      '',
      success ? ToastState.SUCCESS : ToastState.ERROR,
      {
        position: 'bottom right',
        maxWidth: '350px',
      }
    );
  }

  onOpenFileClick(e: any): void {
    const path: Array<string> = e.data.doclinkpath?.split('/').slice(-2);

    if (!path) {
      console.error('Error getting doclinkPath');
      return;
    }

    const urlPath = `${path[0]}/${path[1]}`;

    this.dynamicFormsService.downloadDocument(urlPath).subscribe(
      (data) => {
        fileSaver.saveAs(data.body, path[1]);
      },
      (error) => {
        console.error('Error downloading file', error);
      }
    );
  }

  onEditClick(rowData: any, widget: any): void {
    if (widget.leaseOptionTypeID === this.LEASE_OPTION_WIDGET_ID) {
      this.widgetActionFactory('LeaseOptions')({
        oid: this.oid,
        otid: this.otid,
        ottid: this.ottid,
        fid: this.fid,
        leaseOptionID: rowData.data.leaseoptionid,
        edit: true,
        widgetID: widget.widgetID,
      });
    }
    //Adding below code to match code with v06
    else if (widget.objectTypeID === ObjectType.COMMON_TEAM) {
      this.openDynamicPopup(widget, rowData);
    } else if (
      widget.allowLinking &&
      widget.formWidgetTypeID !== FormWidgetTypeID.SUMMARY &&
      widget.formWidgetTypeID !== FormWidgetTypeID.SUMMARY_DYNAMIC
    ) {
      this.buildRedirectLink(rowData, widget, 'edit');
    } else if (widget.formID > 0) this.openDynamicPopup(widget, rowData);
  }

  openDynamicPopup(widget: any, rowData: any) {
    const dialogRef = this.dialog.open(DynamicPopupComponent, {
      disableClose: true,
      width: '40vw',
      minWidth: '320px',
      maxWidth: '1100px',
      maxHeight: '90vh',
      data: {
        isSubObject: widget.subObject,
        launchFormID: widget.subObject ? this.launchFormID : 0,
        isEdit: true,
        formId: this.widgetFormId,
        objectId: rowData.data.oid,
        objectTypeId: this.widgetObjectTypeId,
        objectTypeTypeId: rowData.data.objecttypetypeid,
        relatedObjectId: this.objectId,
        relatedObjectTypeId: this.objectTypeId,
        relatedDefinitionId: this.widgetRelationshipDefId,
        rowData: rowData,
      },
    });
    dialogRef
      .afterClosed()
      .pipe(filter((x) => !!x))
      .subscribe(this.handleDialogClose);
  }

  getDeleteCall(widget: Widget, payload: DeleteSubObjectRequest) {
    if (widget.objectTypeID === ObjectType.VENDOR) {
      return this.dynamicFormsService.deleteVendor(payload);
    } else if (widget.objectTypeID === ObjectType.OPTION) {
      return this.listPageService.deleteLeaseOption(
        payload.objectId,
        payload.relatedObjectId
      );
    }

    return this.dynamicFormsService.deleteSubObject(payload);
  }

  handleDeleteDialog(
    dialogRes: boolean,
    rowData: any,
    widget: Widget,
    hasCharges: boolean
  ) {
    const errMsg = 'An error has occurred. Please try again.';
    const permssionMsg = 'User does not have delete rights';

    if (dialogRes === false) {
      this.isLoading = false;
      return; // User closed the dialog. Do nothing
    }

    if (dialogRes && hasCharges) {
      this.router.navigate(['/v06/Financials/Admin/ChargeList.aspx'], {
        queryParams: {
          VendorID: rowData.data.oid,
          masterGroupID: rowData.data.mastergroupid,
          VendorCustomer: rowData.data.objecttypetypeid,
          CompanyID: rowData.data.companyid,
        },
      });
    }

    this.isLoading = true;

    const payload = this.widgetService.buildDeleteRequestPayload({
      rowData,
      widget,
      oid: this.oid,
      otid: this.otid,
    });

    this.getDeleteCall(widget, payload)
      .pipe(
        take(1),
        finalize(() => (this.isLoading = false))
      )
      .subscribe(
        (res) => {
          if (res?.success && res?.statusCode === 200) {
            this.dynamicFormsService
              .getFormItemWidgetByWidgetId(this.field.widgetID, this.oid)
              .pipe(take(1))
              .subscribe((resp) => {
                resp.data.renderFormWidgetData =
                  this.widgetService.getUniqueByOid(
                    resp.data.renderFormWidgetData
                  );
                this.selectWidget$ = of(resp.data);
                this.toastService.show(
                  'Item deleted successfully!',
                  '',
                  ToastState.SUCCESS,
                  {
                    position: 'bottom right',
                    maxWidth: '350px',
                  }
                );
              });

            if (res?.data?.warning) {
              this.toastService.show(res.data.warning, '', ToastState.WARNING, {
                position: 'bottom right',
                maxWidth: '350px',
                duration: 10000,
              });
            }
          } else if (
            res?.statusCode === 400 &&
            res?.clientErrorMessage === 'Vendor has charges'
          ) {
            this.router.navigate(['/v06/Financials/Admin/ChargeList.aspx'], {
              queryParams: {
                VendorID: rowData.data.oid,
                masterGroupID: rowData.data.mastergroupid,
                VendorCustomer: rowData.data.objecttypetypeid,
                CompanyID: rowData.data.companyid,
              },
            });
          } else {
            const msg = res?.statusCode === 403 ? permssionMsg : errMsg;
            this.toastService.show(msg, '', ToastState.ERROR, {
              position: 'bottom right',
              maxWidth: '350px',
            });
          }
        },
        (err) => {
          this.toastService.show(errMsg, '', ToastState.ERROR, {
            position: 'bottom right',
            maxWidth: '350px',
          });
        }
      );
  }

  onDeleteClick(rowData: any, widget: Widget): void {
    this.isLoading = true;

    if (widget.objectTypeID === ObjectType.VENDOR) {
      this.dynamicFormsService
        .getVendorHasCharges(rowData.data.oid)
        .pipe(
          take(1),
          finalize(() => (this.isLoading = false))
        )
        .subscribe((res) => {
          if (res.success) {
            const hasCharges = res.data.hasCharges;
            const dialogRef = this.dialog.open(DeleteSubObjectPopupComponent, {
              data: {
                hasCharges,
              },
            });

            dialogRef
              .afterClosed()
              .pipe(take(1))
              .subscribe((dialogRes) => {
                this.handleDeleteDialog(dialogRes, rowData, widget, hasCharges);
              });
          }
        });
    } else {
      const dialogRef = this.dialog.open(DeleteSubObjectPopupComponent, {
        data: {
          hasCharges: false,
        },
      });

      dialogRef
        .afterClosed()
        .pipe(take(1))
        .subscribe((dialogRes) => {
          this.handleDeleteDialog(dialogRes, rowData, widget, false);
        });
    }
  }

  onGoClick(rowData: any, widget: any): void {
    if (widget.leaseOptionTypeID === this.LEASE_OPTION_WIDGET_ID) {
      this.widgetActionFactory('LeaseOptions')({
        oid: this.oid,
        otid: this.otid,
        ottid: this.ottid,
        fid: this.fid,
        leaseOptionID: rowData.data.leaseoptionid,
        edit: true,
        widgetID: widget.widgetID,
      });
    } else {
      this.buildRedirectLink(rowData, widget);
    }
  }

  buildRedirectLink(rowData: any, widget: any, pgMode: any = 'view') {
    let queryParams: any;
    const launch_oid = rowData.key?.linkedobjectid ?? rowData.key.oid;
    const launch_otid = rowData.key?.linkedobjecttypeid ?? widget.objectTypeID;
    const launch_ottid =
      rowData.key?.linkedobjecttypetypeid ?? rowData.key.objecttypetypeid;

    let launch_fid;
    queryParams = {
      oid: launch_oid,
      otid: launch_otid,
      ottid: launch_ottid,
      roid: this.field.formObjectId ?? this.objectId,
      rotid: this.field.objectTypeID ?? this.objectTypeId,
      poid: this.objectId,
      potid: this.objectTypeId,
    };
    if (rowData.key.keyeditformid > 0) {
      launch_fid = rowData.key.keyeditformid;
      (queryParams.rdid = widget.relationshipDefinitionID),
        (queryParams.fid = launch_fid);
      queryParams.pgmode = pgMode;
      queryParams.parentfid = this.fid;
      this.router.navigate(['/crem/forms/render-form'], { queryParams });
    } else if (widget.UseSecurity) {
      //logic to do
    } else {
      let navUrl = '';
      this.formWizardService
        .getRedirectorLink(launch_otid, launch_ottid)
        .subscribe((result) => {
          if (result.success && result.data?.length > 0) {
            navUrl = result.data[0].basePageUrl;
            launch_fid = parseInt(
              this.router
                .parseUrl(result.data[0].basePageUrl)
                .queryParamMap.get('FID') ||
                this.router
                  .parseUrl(result.data[0].basePageUrl)
                  .queryParamMap.get('fid')
            );
            if (Number.isNaN(launch_fid)) {
              queryParams.navpageid = rowData.key?.keyeditnavpageid;
              this.router.navigate([navUrl], {
                queryParams,
              });
            } else {
              queryParams.fid = launch_fid;
              queryParams.pgmode = pgMode;
              queryParams.parentfid = this.fid;
              this.router.navigate(['/crem/forms/render-form'], {
                queryParams,
              });
            }
          }
        });
    }
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  addTabIndex() {
    Array.from(
      document.getElementsByClassName('dx-datagrid-group-opened')
    ).forEach((i) => {
      i.setAttribute('tabindex', '0');
    });
  }

  handleDialogClose = () => {
    this.isLoading = true;

    this.dynamicFormsService
      .getFormItemWidgetByWidgetId(this.field.widgetID, this.oid)
      .pipe(
        take(1),
        map((resp) => {
          resp.data.renderFormWidgetData = this.widgetService.getUniqueByOid(
            resp.data.renderFormWidgetData
          );
          return resp;
        }),
        finalize(() => (this.isLoading = false))
      )
      .subscribe((resp) => {
        this.selectWidget$ = of(resp.data);
      });
  };

  SummaryRowTabs() {
    let grid = document.getElementsByClassName('dx-row dx-data-row');
    if (grid)
      Array.from(grid).forEach((e) => {
        Array.from(e.getElementsByTagName('td')).forEach((i) => {
          i.setAttribute('class', '');
          i.setAttribute('tabindex', '0');
          if (i.innerHTML == '&nbsp;') i.innerHTML = '<a></a>';
        });
      });
  }
}
