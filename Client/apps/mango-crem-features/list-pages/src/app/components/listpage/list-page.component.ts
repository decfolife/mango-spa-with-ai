import { async } from '@angular/core/testing';
/* eslint-disable no-prototype-builtins */
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  Renderer2,
} from '@angular/core';

import {
  faCaretDown,
  faEllipsisH,
  faList,
  faMap,
  faExclamationTriangle,
  faSearch,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { Row } from 'devextreme/ui/data_grid';
import DataGrid from 'devextreme/ui/data_grid';
import { format } from 'sql-formatter';

import { ListPageService } from './core/services/listpage.service';
import { UtilitiesService } from './core/services/utilities.service';
import {
  ApiResponse,
  CellNav,
  ColumnDefinition,
  CommonNote,
  EditPage,
  GetGridDataRequest,
  GetViewDropdownDataRequest,
  ListView,
  ObjectSecurityRequest,
  ViewDropDownData,
  Portfolio,
  HideListViewRequest,
  SetDefaultListViewRequest,
  ListPageObjectTypeSession,
  LeaseInfo,
} from './shared/models';
import { ShareViewPopupComponent } from './share-view-popup/share-view-popup.component';
import {
  ListPageViewMode,
  FieldType,
  ListViewType,
  SecurityType,
  SessionVariables,
  ObjectTypeIds,
  ArchiveToggleValue,
} from './shared/enums';
import { DropdownComponent } from '@mango/ui-shared/lib-ui-elements';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AddFormWizardComponent } from '@micro-components/form-wizard/modal/add-form-wizard/add-form-wizard.component';
import { TaskApprovalComponent } from '@project-dashboard/components/modal/task-approval/task-approval.component';
import { NoopScrollStrategy } from '@angular/cdk/overlay';
import { PaymentDetailsPopupComponent } from './payment-details/payment-details-popup.component';
import { DxFormComponent } from 'devextreme-angular';
import { formatDate } from '@angular/common';
import CheckBox from 'devextreme/ui/check_box';
import { ExportDevexDatagridService } from '@mango/core-shared';
import { AddCompanyModalComponent } from '@mango/ui-shared/lib-ui-shared';
import { AddContactModalComponent } from 'libs/ui-shared/lib-ui-shared/src/lib/add-contact-modal/add-contact-modal.component';
import { ObjectType, RequestType } from '@mango/data-models/lib-data-models';
import { AddNoteComponent } from 'libs/ui-shared/lib-ui-shared/src/lib/add-note/add-note.component';

type VBBool = boolean | string;

(DataGrid as any).registerModule('columnChooserSorting', {
  extenders: {
    controllers: {
      columns: {
        // This is not the most efficient code, however, it is the only way to sort columns in the column chooser
        // based on the displayOrder from the database.
        // Notice this "static" method does not have the ListPage component in scope, thusly, ListPage component properties
        // can't be accessed here. On the other hand, this can't be placed in the ListPageCompennet because
        // <here>this != <there>this.datagrid.instance and <here>this.callBase() cannot be accessed in <there(ListPageComponent>)>
        // To get around this, the filterFields, which feed the filter dialog are saved to local storage during grid load and only
        // after the filterFields go through a custom sort function based on displayOrder.
        // In this "static" function local storage can be accessed so deserialize the filterFields and use them to determine
        // sort order in the custom sort order below. (This terribly inefficient function will have to be used until DE decides
        // to support custom sorting like in the filter dialog --> THIS IS A HACK o_O )
        // NOTE: This internal function will be called numerous times per any column related event
        // Sometimes the col1Model and col2Model can be undefined
        getChooserColumns: function (loadAllColumns: any) {
          const filterFields = JSON.parse(
            sessionStorage.getItem(SessionVariables.DisplayOrderFilterFields)
          );
          const result = this.callBase(loadAllColumns);

          result.sort(function (col1: any, col2: any) {
            if (filterFields === null)
              return col1.caption?.localeCompare(col2.caption);

            const col1Model = filterFields.filter(
              (x: any) => x.dataField === col1.dataField
            )[0];
            const col2Model = filterFields.filter(
              (x: any) => x.dataField === col2.dataField
            )[0];

            if (col1Model === undefined || col2Model === undefined)
              return col1.caption?.localeCompare(col2.caption);

            return col1Model.displayOrder - col2Model.displayOrder;
          });

          return result;
        },
      },
    },
  },
});

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-list-page',
  templateUrl: './list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class ListPageComponent implements OnInit, OnDestroy {
  @Input() oIds = '';
  @Input() objectTypeId = 4;
  @Input() overrideInputSettings = true;
  @Input() userId: number;
  @Input() set initialListPageRequestedId(value: number) {
    this._intitialListPageRequestedId = value;
  }
  @Input() keyExpr = null;

  @ViewChild('DataGrid', { static: true }) dataGrid: DxDataGridComponent;
  @ViewChild('shareListViewPopup') shareListViewPopup: ShareViewPopupComponent;
  @ViewChild(DropdownComponent) cremDropdownComponent: DropdownComponent;
  @ViewChild('RangeDateForm', { static: false }) rangeDateForm: DxFormComponent;

  public googleMapAPIKey: any;
  public googleMappingChannel: any;
  public googleMapAPIKeyLoaded = false;
  public googleMappingChannelLoaded = false;

  intervals: string[];
  beforeAfter: string[];
  selectDate: string[];
  rangeDateFilterFields: any[];
  customDateSelected: boolean = false;
  dateColumnSelected: boolean = false;

  listViews: ViewDropDownData;
  activeListViewCount: number;
  currentListView: ListView = null;
  currentListViewName: string;
  currentPortfolio: Portfolio | null;
  faCaretDown = faCaretDown;
  faEllipsisH = faEllipsisH;
  faList = faList;
  faMap = faMap;
  faSearch = faSearch;
  faPlus = faPlus;
  faExclamationTriangle = faExclamationTriangle;
  originalViewObject;

  storedRangeFormData: any;
  storedFilterBuilderTemplate: any;
  dateGridColumns: string[];
  filteredDateGridColumns: string[];

  columns: ColumnDefinition[] = [];
  gridData: any[] = [];
  rowLinks: any[] = [];
  columnsDef: ColumnDefinition[] = [];
  portfolios: Portfolio[] = [];
  paymentDetails: any;
  userPrefDateFormat: string;
  //This is sometimes not set when we need it in the filter popup and calling the function
  //to populate throws an error.  We will get it from the embedded element in the page.
  userPrefDateFormatForFilter: string;
  modalIsOpen: boolean = false;

  searchText: string = null;
  archiveField: any[] = [];
  //oIds = '';
  listPageViewMode = ListPageViewMode.ListPageGrid;
  archiveToggleHint: string;

  collapsed = false;
  isExpanded = true;
  showClearFilters = false;
  showMap = false;
  showResetView = true;
  chargesOnLease = false;
  includeActive = false;
  includeArchived = false;
  numberOfItemsSelectedLessThanTwo = true;
  disableTerminateLeaseCharges = false;
  filterButtonEnabled = true;
  moreButtonEnabled = true;
  searchTextBoxEnabled = true;
  filterBuilderVisible = false;
  filterBuilderMapVisible = false;
  portfolioButtonEnabled = true;
  sqlPopupVisible = false;
  isHoldPayments = false;
  isLeaseArchived = false;
  isLeaseLocked = false;
  showHoldPayments = false;
  isGLEvent: boolean = false;
  isCopyCharge: boolean = false;
  isChargeAction: boolean = false;

  headerHtmlCellElement: any;
  headerCheckBox: any;
  vendorOrCustomer: string = '';
  noteData: any;
  showNotes = false;
  isButtonClick = false;
  approveRejectTask = false;
  actionsMenuClicked = false;
  clickedCellData: any;

  filterFields: any[];
  customOperations: any[];
  includedDataFieldsFromLastGridReload: string[];
  editPages: EditPage[];
  leaseInfoReq: LeaseInfo;
  archivedLabel: string = '';

  //This is only used as an unmodified version of editpages so we can change the url "Income" query parameter
  //When switching between Expense and Revenue in the Lease Payments List Pages
  unModifiedEditPages: EditPage[];

  //This is only used for Lease Payments List Pages to determine if we need to reload the editPages urls when
  //we switch between Expense and Revenue
  isIncomeValue: string = '';

  sharingListView: ListView;

  formattedSql = '';
  popupInfo = {
    popupVisible: false,
    popupMessage: '',
    popupTitle: 'Information',
    cancelButtonOptions: null,
    actionButtonOptions: null,
    dragEnabled: false,
    width: '300',
    isFormatted: false,
  };

  filterValue: any;
  inDisabledUIState = false;
  inCriticalViewDataError = false;
  lastGridDataRequest: GetGridDataRequest;
  public urlOID: number;
  public urlOTID: number;
  public urlOTTID: number;
  public urlNavPageId: number;
  public noDataText: string = 'No Data';

  private _userHasAddRights = false;
  private _intitialListPageRequestedId: number = 0;
  private _isSuperUser = true;
  private _canEditNotes = true;
  private _showPortfolioPicker = true;
  private _showListViewSelector = true;
  private _showListMapToggle = true;
  private _showFilterButton = true;
  private _showSearch = true;
  private _showMoreMenu = true;
  private _showSaveAs = true;
  private _showSave = true;
  private _showShare = true;
  private _showExpandCollapse = true;
  private _showColumnChooser = true;
  private _showExport = true;
  private _showCaching = false;
  private _showAddButton = true;
  private _showDeleteButton = true;
  private _showHeaderFilter = true;

  private hasListener = false;
  private unmodifiedOriginalListView: ListView = null;
  public initializingApplication = true;
  private isCurrentViewRemoved = false;

  private asBool = (value: VBBool) =>
    value?.toString().toLowerCase() === 'true';

  private listPageSessionKey: string = 'ListPageState';
  private isViewChanged = false;
  private isInitialLoad = true;

  navigationButtonsObserver: MutationObserver;
  pagingButtonsObserver: MutationObserver;

  @Input()
  set isSuperUser(value: VBBool) {
    this._isSuperUser = this.asBool(value);
  }
  get isSuperUser(): VBBool {
    return this._isSuperUser;
  }

  @Input()
  set canEditNotes(value: VBBool) {
    this._canEditNotes = this.asBool(value);
  }
  get canEditNotes(): VBBool {
    return this._canEditNotes;
  }

  @Input()
  set showPortfolioPicker(value: VBBool) {
    this._showPortfolioPicker = this.asBool(value);
  }
  get showPortfolioPicker(): VBBool {
    return this._showPortfolioPicker;
  }

  @Input()
  set showListViewSelector(value: VBBool) {
    this._showListViewSelector = this.asBool(value);
  }
  get showListViewSelector(): VBBool {
    return this._showListViewSelector;
  }

  @Input()
  set showListMapToggle(value: VBBool) {
    this._showListMapToggle = this.asBool(value);
  }
  get showListMapToggle(): VBBool {
    return this._showListMapToggle;
  }

  @Input()
  set showFilterButton(value: VBBool) {
    this._showFilterButton = this.asBool(value);
  }
  get showFilterButton(): VBBool {
    return this._showFilterButton;
  }

  @Input()
  set showSearch(value: VBBool) {
    this._showSearch = this.asBool(value);
  }
  get showSearch(): VBBool {
    return this._showSearch;
  }

  @Input()
  set showMoreMenu(value: VBBool) {
    this._showMoreMenu = this.asBool(value);
  }
  get showMoreMenu(): VBBool {
    return this._showMoreMenu;
  }

  @Input()
  set showSaveAs(value: VBBool) {
    this._showSaveAs = this.asBool(value);
  }
  get showSaveAs(): VBBool {
    return this._showSaveAs;
  }

  @Input()
  set showSave(value: VBBool) {
    this._showSave = this.asBool(value);
  }
  get showSave(): VBBool {
    return this._showSave;
  }

  @Input()
  set showShare(value: VBBool) {
    this._showShare = this.asBool(value);
  }
  get showShare(): VBBool {
    return this._showShare;
  }

  @Input()
  set showExpandCollapse(value: VBBool) {
    this._showExpandCollapse = this.asBool(value);
  }
  get showExpandCollapse(): VBBool {
    return this._showExpandCollapse;
  }

  @Input()
  set showColumnChooser(value: VBBool) {
    this._showColumnChooser = this.asBool(value);
  }
  get showColumnChooser(): VBBool {
    return this._showColumnChooser;
  }

  @Input()
  set showExport(value: VBBool) {
    this._showExport = this.asBool(value);
  }
  get showExport(): VBBool {
    return this._showExport;
  }

  @Input()
  set showCaching(value: VBBool) {
    this._showCaching = this.asBool(value);
  }
  get showCaching(): VBBool {
    return this._showCaching;
  }

  @Input()
  set showAddButton(value: VBBool) {
    this._showAddButton = this.asBool(value);
  }
  get showAddButton(): VBBool {
    return this._showAddButton;
  }

  @Input()
  set showDeleteButton(value: VBBool) {
    this._showDeleteButton = this.asBool(value);
  }
  get showDeleteButton(): VBBool {
    return this._showDeleteButton;
  }

  @Input()
  set showHeaderFilter(value: VBBool) {
    this._showHeaderFilter = this.asBool(value);
  }
  get showHeaderFilter(): VBBool {
    return this._showHeaderFilter;
  }

  // Fat-arrow function for proper `this` context
  customizeColumns = (columns: any[]) => {
    columns.forEach((col) => {
      if (col.dataType !== 'string') {
        return;
      }

      const maxLength = this.gridData.reduce((len, d) => {
        const dLen = d[col.dataField]?.length;

        return Math.min(len, dLen);
      }, 0);

      if (maxLength <= col.dataField?.length + 20) {
        return;
      }

      return col?.width ? col.width : '400px';
    });
  };

  isCoStarListView = (listView: ListView) => {
    return listView?.listViewType === ListViewType.CoStar;
  };

  constructor(
    private activatedroute: ActivatedRoute,
    public service: ListPageService,
    public cdRef: ChangeDetectorRef,
    private exportToExcelService: ExportDevexDatagridService,
    private dialog: MatDialog,
    private router: Router,
    private renderer2: Renderer2
  ) {
    // initialize currentPortfolio to allow use it properties in [displayExpr] and [valueExpr] in crem-dropdown component
    this.currentPortfolio = null;
    this.listViews = {} as any;
    this.customOperations = UtilitiesService.getCustomFilterOperation();
    this.intervals = UtilitiesService.intervals;
    this.beforeAfter = UtilitiesService.beforeAfter;
    this.selectDate = UtilitiesService.selectDate;
    this.rangeDateFilterFields = UtilitiesService.rangeDateFilterFields;
    UtilitiesService.filterFieldsForRangeDate = this.rangeDateFilterFields;

    window.onbeforeunload = () => {
      this.saveStateToSession();
    };
  }

  ngOnDestroy() {
    if (this.navigationButtonsObserver) {
      this.navigationButtonsObserver.disconnect();
    }
    if (this.pagingButtonsObserver) {
      this.pagingButtonsObserver.disconnect();
    }
  }

  ngOnInit(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const upperCaseParams = {};
    urlParams.forEach(
      (value, key) => (upperCaseParams[key.toUpperCase()] = value)
    );
    this.urlOID = upperCaseParams['OID']
      ? parseInt(upperCaseParams['OID'])
      : null;
    this.urlOTID = upperCaseParams['OTID']
      ? parseInt(upperCaseParams['OTID'])
      : null;
    this.urlOTTID = parseInt(upperCaseParams['OTTID'] || '0');
    this.urlNavPageId = parseInt(upperCaseParams['NAVPAGEID'] || '0');

    //Set the objectTypeId from the value passed in the route instead of from the service if overrideInputSettings is true
    if (this.overrideInputSettings) {
      this.activatedroute.data.subscribe((routeData) => {
        this.objectTypeId = routeData.objectTypeId;
      });
    }

    this.service.getGoogleMapAPIKey().subscribe((x) => {
      //console.log(x)
      this.googleMapAPIKey = x.data.googleMapAPIKey;
      this.googleMapAPIKeyLoaded = true;
      this.service.getGoogleMappingChannel().subscribe((x) => {
        //console.log(x)
        this.googleMappingChannel = x.data.googleMappingChannel;
        this.googleMappingChannelLoaded = true;
        this.loadGoogleMapsAPIScript();
      });
    });

    let glpoid = this.urlOID ? this.urlOID : 0;
    let glpotid = this.objectTypeId;
    let glpnavpageid = this.urlNavPageId;
    this.service
      .getListPageProperties(glpoid, glpotid, glpnavpageid)
      .subscribe((res: ApiResponse) => {
        if (this.overrideInputSettings === true && res && res.data) {
          this._intitialListPageRequestedId = res.data.listPage ?? 0;
          this._isSuperUser = res.data.isSuperUser;
          this._canEditNotes = res.data.canEditNotes;
          this._showPortfolioPicker = res.data.showPortfolioPicker;
          this._showAddButton = res.data.showAddButton;
          this._showDeleteButton = res.data.showDeleteButton;
          this._showListMapToggle = res.data.showListMapToggle;
          this.disableTerminateLeaseCharges =
            !res.data.showTerminateLeaseCharges;
        }

        this.dataGrid.loadPanel.enabled = true;

        this.service.getRedirectorLinkList().subscribe((res: ApiResponse) => {
          this.rowLinks = res.data.redirectorLinks;
        });

        this.isGLEvent = this.checkGLEvent(this.objectTypeId);
        this.service
          .getAddWizards(this.objectTypeId, this.urlOTTID, this.urlNavPageId)
          .subscribe((result) => {
            let tempEditPages = [];
            if (result.data && result.data.addWizards) {
              tempEditPages = result.data.addWizards;
            } else {
              console.log(
                `Response from addWizards API is either empty or invalid`
              );
            }
            if (this.isGLEvent) {
              this.archivedLabel = 'deleted';
              this.unModifiedEditPages = tempEditPages;
            } else {
              this.archivedLabel = 'archived';
              this.editPages = tempEditPages;
            }
          });

        (window as any).OpenPopup = (url: string) => {
          const params = url.split('?')[1].split('&');
          const OID = params[0].split('=')[1];
          const OTID = params[1].split('=')[1];
          const NotetypeId = params[2].split('=')[1];
          const CommonNoteTypeID =
            NotetypeId === '2' || NotetypeId === '13' ? NotetypeId : 0;

          this.noteData = { OID, OTID, CommonNoteTypeID };
          this.showNotes = true;
        };

        if (sessionStorage.getItem(this.listPageSessionKey) === null) {
          this.populateListViewMenu(
            true,
            false,
            this._intitialListPageRequestedId > 0
          );
          return;
        }

        this.populateListViewMenu(true, true);
      });

    this.service
      .getUserModuleRights(ObjectType.CONTACT.toString())
      .subscribe((u) => {
        this._userHasAddRights = u.data.filter((r: any) => r.hasAddRights)[0][
          'hasAddRights'
        ];
      });
  }

  loadGoogleMapsAPIScript() {
    const googleUrl = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapAPIKey}&channel=${this.googleMappingChannel}`;
    const s = this.renderer2.createElement('script');
    s.type = 'text/javascript';
    s.src = googleUrl;
    s.async = true;
    this.renderer2.appendChild(document.body, s);
  }

  disposingNumOfIntervals() {
    this.setStoredRangeFormDataToDefaultValues();
    this.customDateSelected = false;
    this.dateColumnSelected = false;
    this.cdRef.detectChanges();
  }

  setPrefDateFormatForFilter() {
    if (
      this.userPrefDateFormatForFilter === undefined ||
      this.userPrefDateFormatForFilter === null
    ) {
      if (this.userPrefDateFormat !== undefined)
        this.userPrefDateFormatForFilter = this.userPrefDateFormat;
      else {
        const isEuroElement = document.getElementById('IsEuroDateFormat');
        let isEuroDateFormat =
          isEuroElement !== null &&
          isEuroElement.innerHTML.toLowerCase() === 'true';

        if (isEuroDateFormat) this.userPrefDateFormatForFilter = 'dd.MM.yyyy';
        else this.userPrefDateFormatForFilter = 'MM/dd/yyyy';
      }
    }
  }

  getRangeFilterText() {
    this.setPrefDateFormatForFilter();

    let isEmptyObject = JSON.stringify(this.rangeDateForm.formData) === '{}';

    if (isEmptyObject) return undefined;

    let setIntervalToSingular = false;
    let rangeDateFilterStrArray: any = [];

    this.rangeDateFilterFields.forEach((ff) => {
      if (
        this.rangeDateForm.formData.hasOwnProperty(ff.fieldName) &&
        ff.fieldName !== 'customDate' &&
        ff.fieldName !== 'dateColumn'
      ) {
        let displayStr = this.rangeDateForm.formData[ff.fieldName];

        if (ff.fieldName === 'numOfIntervals' && displayStr === 1) {
          setIntervalToSingular = true;
        }

        if (ff.fieldName === 'intervalType' || ff.fieldName === 'beforeAfter') {
          displayStr = displayStr.toLowerCase();
          if (ff.fieldName === 'intervalType' && setIntervalToSingular)
            displayStr = displayStr.slice(0, displayStr.length - 1);
        }

        if (ff.fieldName === 'selectDate' && displayStr !== 'Today') {
          if (displayStr === 'Date Field') {
            //Using a date column
            displayStr = this.rangeDateForm.formData['dateColumn'];
          } else {
            //Using a custom date
            let customDateStr =
              this.rangeDateForm.formData['customDate'] === undefined
                ? ''
                : this.rangeDateForm.formData['customDate'];
            if (customDateStr !== '' && customDateStr instanceof Date) {
              let localStr = this.userPrefDateFormatForFilter.indexOf('.')
                ? 'en-EU'
                : 'en-US';
              displayStr = formatDate(
                this.rangeDateForm.formData['customDate'],
                this.userPrefDateFormatForFilter,
                localStr
              );
            }
          }
        }

        rangeDateFilterStrArray.push(displayStr);
      }
    });

    let displayStr = `${rangeDateFilterStrArray.join(' ')}`;

    return displayStr;
  }

  convertRangeFilterTextToObject(filterBuilderTemplate) {
    //This is a hacky way to get the filterbuilder instance so we can call setValue
    //in other places in the code.  There probably is a better solution but I could
    //not find one at the time.
    this.storedFilterBuilderTemplate = filterBuilderTemplate;
    let rangeFilterText = filterBuilderTemplate.value;

    //This means that this is a new filter so we set storedRangeFormData to the default values
    if (rangeFilterText === null) {
      return;
    }

    let parseRangeFilterReturnObj =
      UtilitiesService.parseRangeFilterDateStr(rangeFilterText);
    this.filteredDateGridColumns = this.dateGridColumns.filter(
      (dgc) => dgc !== this.storedFilterBuilderTemplate.field.caption
    );

    //Set customDateSelected and dateColumnSelected flags if they are true
    if (parseRangeFilterReturnObj.customDateSelected)
      this.customDateSelected = parseRangeFilterReturnObj.customDateSelected;
    if (parseRangeFilterReturnObj.dateColumnSelected)
      this.dateColumnSelected = parseRangeFilterReturnObj.dateColumnSelected;

    this.storedRangeFormData = parseRangeFilterReturnObj.rangeDateFilterObj;
  }

  numOfIntervalsInputEvent(e) {
    let inputElement = e.event.currentTarget;

    if (inputElement.value.length > 4)
      inputElement.value = inputElement.value.slice(0, 4);
  }

  setRangeDateFormValue(dataFieldName, e) {
    let value = e.value;

    if (dataFieldName == 'numOfIntervals') {
      value = Number(value);
      let defaultValue = this.rangeDateFilterFields.find(
        (ff) => ff.fieldName === dataFieldName
      ).defaultValue;

      if (value < defaultValue) {
        value = defaultValue;
      }
    } else if (dataFieldName == 'selectDate') {
      this.customDateSelected = false;
      this.dateColumnSelected = false;

      if (value === 'Date Field') {
        this.dateColumnSelected = true;
        if (
          this.rangeDateForm.formData['dateColumn'] === null ||
          this.rangeDateForm.formData['dateColumn'] === undefined
        ) {
          let foundFilterField = this.rangeDateFilterFields.find(
            (ff) => ff.fieldName == 'dateColumn'
          );

          this.filteredDateGridColumns = this.dateGridColumns.filter(
            (dgc) => dgc !== this.storedFilterBuilderTemplate.field.caption
          );
          foundFilterField.defaultValue =
            this.filteredDateGridColumns.length > 0
              ? this.filteredDateGridColumns[0]
              : null;
          this.rangeDateForm.formData['dateColumn'] =
            foundFilterField.defaultValue;
        }
      } else if (value === 'Direct Entry') {
        this.customDateSelected = true;
        if (
          this.rangeDateForm.formData['customDate'] === null ||
          this.rangeDateForm.formData['customDate'] === undefined
        )
          this.rangeDateForm.formData['customDate'] = new Date();
      }
    }

    this.rangeDateForm.formData[dataFieldName] = value;
    this.storedRangeFormData = this.rangeDateForm.formData;
    this.storedFilterBuilderTemplate.setValue(this.getRangeFilterText());
    this.cdRef.detectChanges();
  }

  setStoredRangeFormDataToDefaultValues() {
    this.storedRangeFormData = {};

    this.rangeDateFilterFields.forEach((ff) => {
      this.storedRangeFormData[ff.fieldName] = ff.defaultValue;
    });
  }

  fillDateGridColumns() {
    this.dateGridColumns = [];

    this.columns.forEach((col) => {
      if (col.dataType === 'date') this.dateGridColumns.push(col.caption);
    });
  }

  checkGLEvent(objectTypeId: number): boolean {
    return (
      objectTypeId == ObjectTypeIds.Expense ||
      objectTypeId == ObjectTypeIds.Revenue
    );
  }

  getCellTemplate(column) {
    if (column.urlLink !== '') {
      return 'linkTemplate';
    } else if (
      column.dataField == 'CustomAction' &&
      this.objectTypeId == ObjectTypeIds.Tasks
    ) {
      return 'tasksActionTemplate';
    } else if (column.dataField == 'CustomAction' && this.isGLEvent) {
      return 'leasePaymentsActionTemplate';
    } else {
      return '';
    }
  }

  public onGridSelectionChanged(e) {
    var notActiveKeys = e.selectedRowKeys.filter(
      (srk) => srk.IsActive === 'Deleted'
    );

    //Set numberOfItemsSelectedLessThanTwo to the selected rows minus the ones that are not active
    this.numberOfItemsSelectedLessThanTwo =
      e.selectedRowKeys.length - notActiveKeys.length < 2;
  }

  actionsClicked() {
    this.actionsMenuClicked = true;
  }

  approve(task, actionName) {
    this.approveRejectTask = true;
    let selectedTask = {
      taskName: task.TaskName,
      projectRequiredTaskNotes:
        task.projectRequiredTaskNotes == '1' ? true : false,
      taskID: task.taskID,
      approvalID: task.ApprovalID,
      transactionID: task.OID,
      taskNumber: task.TaskStepNumber,
    };

    let dialogRef = this.dialog.open(TaskApprovalComponent, {
      scrollStrategy: new NoopScrollStrategy(),
      height: '240px',
      width: '600px',
      panelClass: 'taskApprovalModal',
      data: { selectedTask, actionName },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'Approve') {
        this.saveStateToSession();
        this.populateGrid(true);
      }
    });
  }

  showPaymentDetails(glEventData) {
    this.getDateFormat();

    if (this.modalIsOpen) {
      return;
    }
    this.modalIsOpen = true;
    this.isChargeAction = true;
    this.service
      .getGLEventInfo(glEventData.OID, glEventData.GLEventID)
      .subscribe(
        (res) => {
          this.isChargeAction = false;
          if (!res.data) {
            this.modalIsOpen = false;
            console.warn('GLEventInfo - no data fetched');
            return;
          }
          if (res.data) {
            this.paymentDetails = res.data;

            let dialogRef = this.dialog.open(PaymentDetailsPopupComponent, {
              height: '780px',
              panelClass: 'paymentDetailsModal',
              data: {
                paymentDetails: this.paymentDetails,
                dateFormat: this.userPrefDateFormat,
                vendorORCustomer: this.vendorOrCustomer,
              },
              disableClose: true,
            });
            dialogRef.afterClosed().subscribe((result) => {
              this.modalIsOpen = false;
            });
          }
        },
        (error) => {
          this.isChargeAction = false;
          console.warn('Error fetching GLEvent Info data');
        }
      );
  }
  gridRowClick(evt: any) {
    if (
      evt.rowType === 'group' ||
      this.isButtonClick ||
      this.approveRejectTask ||
      this.actionsMenuClicked
    ) {
      this.isButtonClick = false;
      this.approveRejectTask = false;
      this.actionsMenuClicked = false;
      return;
    }

    if (this.isGLEvent) {
      this.showPaymentDetails(evt.data);
      return;
    }

    this.dataGrid.instance.beginCustomLoading('Redirecting...');
    this.saveStateToSession();
    this.router.navigate(['/v06/Forms/RenderForm.aspx'], {
      queryParams: {
        oid: evt.data.OID,
        otid: evt.data.OTID,
        ottid: evt.data.OTTID,
      },
    });
  }

  gridInitialized(evt: any) {
    this.dataGrid.instance.beginCustomLoading('Initializing...');
    return;
  }

  checkBoxAttributes(e: any) {
    const checkBox = document.getElementsByClassName('dx-checkbox');
    const checkBoxarr = Array.from(checkBox);
    checkBoxarr.forEach((element) => {
      element.setAttribute('title', 'CheckBox');
    });

    if (
      this.isGLEvent &&
      (this.isLeaseArchived || this.isLeaseLocked || !this._showAddButton)
    ) {
      if (!!this.headerCheckBox) this.headerCheckBox.option('disabled', true);
      if (this.headerHtmlCellElement) {
        this.headerHtmlCellElement.style.pointerEvents = 'none';
      }
    }
  }

  AdaAttributesInEmptyColumns(e: any) {
    // Add aria-label to empty columns
    const rows = e.component.$element().find('.dx-row');
    rows.each((index: number, rowElement: any) => {
      const tdElements = rowElement.querySelectorAll('td');
      tdElements.forEach((tdElement: any) => {
        const cellValue = tdElement.innerText;
        if (cellValue === '\xa0') {
          tdElement.setAttribute('aria-label', 'No Data');
        }
      });
    });
  }

  gridCellClick(data: any) {
    this.clickedCellData = data;
  }

  getTemplateLink(evt: any): CellNav {
    const col = this.columns.find((x) => x.dataField === evt.column.dataField);

    if (!col?.urlLink || this.currentListView === null) {
      return;
    }

    const cellNav: CellNav = {
      objectId: evt.data.OID,
      objectIdField: 'OID',

      objectTypeId: evt.data.OTID,
      objectTypeIdField: 'OTID',

      objectTypeTypeId: evt.data.OTTID,
      objectTypeTypeIdField: 'OTTID',

      fieldType: col.fieldType,
      securityTypeId: evt.data.SecurityTypeID,
      urlLink: col.urlLink,
      useDefaultObjectFields: col.useDefaultObjectFields,

      relationshipDefinitionId: this.currentListView.relationshipDefinitionId,
    };

    if (cellNav.fieldType === FieldType.PopupWindow) {
      if (this.canEditNotes as boolean) {
        const regex = /\[([a-zA-Z]+)\]/gm;

        cellNav.urlLink.match(regex)?.forEach((match) => {
          const prop = match.replace('[', '').replace(']', '');

          cellNav.urlLink = cellNav.urlLink.replace(`${match}`, evt.data[prop]);
        });

        return cellNav;
      }

      return;
    }

    const redirectorIdFields = cellNav.urlLink
      .replace(/\[BasePageUrl\]/, '')
      .split('&');

    redirectorIdFields.forEach((field) => {
      cellNav.objectIdField = field.startsWith('OID=')
        ? field.replace('OID=', '').replace('[', '').replace(']', '')
        : cellNav.objectIdField;

      cellNav.objectTypeIdField = field.startsWith('OTID=')
        ? field.replace('OTID=', '').replace('[', '').replace(']', '')
        : cellNav.objectTypeIdField;

      cellNav.objectTypeTypeIdField = field.startsWith('OTTID=')
        ? field.replace('OTTID=', '').replace('[', '').replace(']', '')
        : cellNav.objectTypeTypeIdField;
    });

    if (
      !evt.data[cellNav.objectIdField] ||
      !evt.data[cellNav.objectTypeIdField] ||
      !evt.data[cellNav.objectTypeTypeIdField]
    ) {
      return;
    }

    cellNav.objectId = evt.data[cellNav.objectIdField];
    cellNav.objectTypeId = 193; //evt.data[cellNav.objectTypeIdField];
    cellNav.objectTypeTypeId = evt.data[cellNav.objectTypeTypeIdField];

    const rdid = cellNav.relationshipDefinitionId
      ? cellNav.relationshipDefinitionId.toString()
      : '';
    cellNav.urlLink = cellNav.urlLink.replace('[RDID]', rdid);

    if (cellNav.fieldType === FieldType.Redirector) {
      const found = this.rowLinks.find(
        (x) =>
          x.objectTypeId === cellNav.objectTypeId &&
          x.objectTypeTypeId === cellNav.objectTypeTypeId
      );

      if (!found) {
        return;
      }

      const basePageUrl =
        found.basePageUrl.indexOf('?') === -1
          ? found.basePageUrl + '?'
          : found.basePageUrl + '&';

      cellNav.urlLink = cellNav.urlLink.replace(/\[BasePageUrl\]/, basePageUrl);
      const regex = /\[([a-zA-Z]+)\]/gm;

      cellNav.urlLink.match(regex)?.forEach((match) => {
        const prop = match.replace('[', '').replace(']', '');
        cellNav.urlLink = cellNav.urlLink.replace(`${match}`, evt.data[prop]);
      });
    }

    if (cellNav.fieldType === FieldType.Custom) {
      const regex = /\[([a-zA-Z]+)\]/gm;

      cellNav.urlLink.match(regex)?.forEach((match) => {
        const prop = match.replace('[', '').replace(']', '');
        cellNav.urlLink = cellNav.urlLink.replace(`${match}`, evt.data[prop]);
      });
    }

    if (cellNav.urlLink.indexOf('[') === -1) {
      return cellNav;
    }

    return;
  }

  updateRowNote(latestNote: CommonNote) {
    const update = this.gridData.find((x) => x === this.clickedCellData.data);
    const key = this.clickedCellData.column.dataField;
    const dataType = this.clickedCellData.column.dataType;

    if (latestNote.commonNoteType.includes('Email') && dataType === 'date') {
      this.updateRowNoteDate(latestNote, update, key);

      return;
    }

    if (dataType === 'date') {
      return;
    }

    const columnNoteType = this.clickedCellData.column.caption.replace(' ', '');
    const isLastNoteColumn = columnNoteType.toLowerCase() === 'lastnote';

    if (columnNoteType !== latestNote.commonNoteType && !isLastNoteColumn) {
      return;
    }

    const id = this.gridData.indexOf(update);

    update[key] = latestNote.commonNote;
    this.gridData[id] = update;
  }

  validateSecurity(cellNav: CellNav) {
    this.isButtonClick = true;
    const objectId = cellNav?.objectId;
    const objectTypeId = cellNav?.objectTypeId;
    if (cellNav.fieldType === FieldType.PopupWindow) {
      this.saveStateToSession();
      this.openNotesModal(objectId, objectTypeId);
      return;
    }

    const secRequest: ObjectSecurityRequest = {
      relationshipDefinitionId: cellNav.relationshipDefinitionId,
      canEditNotes: this.canEditNotes as boolean,
      fieldTypeId: cellNav.fieldType,
      useDefaultObjectFields: cellNav.useDefaultObjectFields,
      objectId: cellNav.objectId,
      objectTypeId: cellNav.objectTypeId,
      objectTypeTypeId: cellNav.objectTypeTypeId,
      securityTypeId: cellNav.securityTypeId,
    };

    this.service.getObjectSecurity(secRequest).subscribe((res) => {
      const data = res.data;

      if (
        !data.securityTypeId ||
        data.securityTypeId === 1 ||
        data.securityTypeId === 6
      ) {
        this.showInformationPopup(
          'You do not have permission to access this item.'
        );

        return;
      }

      if (
        cellNav.objectId !== data.objectId ||
        cellNav.objectTypeId !== data.objectTypeId ||
        cellNav.objectTypeTypeId !== data.objectTypeTypeId
      ) {
        cellNav.urlLink = cellNav.urlLink.replace(
          'OID=' + cellNav.objectId.toString(),
          'OID=' + data.objectId.toString()
        );

        cellNav.urlLink = cellNav.urlLink.replace(
          'OTID=' + cellNav.objectTypeId.toString(),
          'OTID=' + data.objectId.toString()
        );

        cellNav.urlLink = cellNav.urlLink.replace(
          'OTTID=' + cellNav.objectTypeTypeId.toString(),
          'OID=' + data.objectId.toString()
        );
      }

      this.saveStateToSession();
      this.router.navigateByUrl(cellNav.urlLink);
    });
  }

  setCurrentListView(selectedListView: ListView) {
    this.isViewChanged = true;
    if (selectedListView.id === this.currentListView.id) {
      return;
    }

    this.dataGrid.instance.clearFilter();

    this.showMap = false;
    this.currentListView = selectedListView;

    this.populateListViewMenu(true, false);
  }

  setDefaultListView(listView: ListView) {
    listView.isDefault = true;

    const request: SetDefaultListViewRequest = {
      listViewId: listView.id,
      listViewType: listView.listViewType,
      objectTypeId: this.objectTypeId,
      clearDefault: false,
    };

    this.service.setDefaultListView(request).subscribe(() => {
      this.populateListViewMenu(false, true);
    });
  }

  shareListView(listView: ListView) {
    if (this.doesListViewNeedSaving(listView.id)) {
      this.showCustomPopup(
        'Unsaved Changes',
        'There are unsaved changes to the current view. Please be sure to ' +
          'save the latest changes before attempting to share this List View.'
      );

      return;
    }

    this.sharingListView = listView;
    this.shareListViewPopup.showPopup();
  }

  reloadListViewMenu() {
    if (this.shareListViewPopup.isDeleteConfirm) {
      return;
    }

    this.populateListViewMenu(false, true);
  }

  hideListView(listView: ListView, isHidden: boolean) {
    if (isHidden && this.activeListViewCount === 1) {
      this.cannotHideOrDeleteAllListViews();

      return;
    }

    const request: HideListViewRequest = {
      listViewId: listView.id,
      listViewType: listView.listViewType,
      isHidden: isHidden,
    };

    this.service.hideListView(request).subscribe(() => {
      this.populateListViewMenu(false, true);
    });
  }

  deleteListView(data: ListView, isConfirmed = false) {
    if (this.activeListViewCount === 1) {
      this.cannotHideOrDeleteAllListViews();

      return;
    }

    if (!isConfirmed && (data.isSharedWithOthers || data.isSharedWithMe)) {
      this.sharingListView = data;
      this.shareListViewPopup.showPopup(true);

      return;
    }

    const isActiveListView =
      data.listViewType === this.currentListView.listViewType &&
      data.id === this.currentListView.id;

    this.service.deleteUserView(data.id).subscribe(() => {
      if (isActiveListView) {
        this.currentListView = null;
        this.populateListViewMenu(true, false);

        return;
      }

      this.populateListViewMenu(false, true);
    });
  }

  clearDefault(listView: ListView) {
    listView.isDefault = false;

    const request: SetDefaultListViewRequest = {
      listViewId: listView.id,
      listViewType: listView.listViewType,
      objectTypeId: this.objectTypeId,
      clearDefault: true,
    };

    this.service.setDefaultListView(request).subscribe(() => {
      this.populateListViewMenu(false, true);
    });
  }

  public searchDataGrid(data: string): void {
    this.searchText = data;
    this.dataGrid?.instance?.searchByText(data);
    this.saveStateToSession();
  }

  portfolioChanged(portfolio: Portfolio) {
    // Value comes from portfolio dropdown, which return data as Portfolio[0]
    if (!this.isViewChanged && !this.isInitialLoad) {
      this.currentPortfolio = portfolio ? portfolio[0] : null;
      this.saveStateToSession();
      this.populateGrid(true);
    }
  }

  getClearFiltersText() {
    const count = this.getFilterCount();

    return `Clear ${count} Filter${count > 1 ? 's' : ''}`;
  }

  getFilterCount() {
    if (typeof this.dataGrid.instance.state !== 'function') {
      return '';
    }

    const filters = this.dataGrid.instance.state().filterValue;

    if (!filters || (filters && filters.length === 0)) {
      return '';
    }

    const arrayCount = (filters as any[]).reduce((acc: number, item: any) => {
      if (Array.isArray(item)) {
        acc += 1;
      }

      return acc;
    }, 0);

    if (arrayCount) {
      return arrayCount;
    }

    return '1';
  }

  clearFilters(evt: MouseEvent) {
    evt.stopPropagation();
    this.dataGrid.instance.clearFilter();
    this.saveStateToSession();

    this.showClearFilters = false;
  }

  showFilterBuilder() {
    if (this.listPageViewMode === ListPageViewMode.ListPageMap) {
      this.filterBuilderMapVisible = true;

      return;
    }

    this.filterBuilderVisible = true;
  }

  onFilterPopupVisibleChange(isOpening: boolean) {
    if (isOpening) {
      this.fillDateGridColumns();
      this.setStoredRangeFormDataToDefaultValues();
      return;
    }

    this.saveStateToSession();

    setTimeout(() => {
      if (this.gridData.length === 0) {
        return;
      }

      const fieldsInFilter: string[] = this.getFilterFieldsFromFilter(
        this.dataGrid.filterValue
      );

      if (
        !this.doesLeftArrayIncludeRight(
          this.includedDataFieldsFromLastGridReload,
          fieldsInFilter
        )
      ) {
        this.populateGrid(true);
      }
    }, 1000);
  }

  navigateToEditPage() {
    this.saveStateToSession();
  }

  reLoadGrid(e: any) {
    this.populateGrid();
  }

  toggleListMap(viewMode: ListPageViewMode, saveToSession: boolean = true) {
    viewMode = viewMode ?? this.listPageViewMode;

    if (viewMode === ListPageViewMode.ListPageMap) {
      const visibleIds: string[] = this.getVisibleFieldValuesFromGrid('OID');

      this.oIds = visibleIds.slice(0, 1500).join(',');

      if (!this.oIds) {
        this.showMap = false;
        viewMode = ListPageViewMode.ListPageGrid;

        this.showErrorPopup('No row is displayed in grid view');
      }
    }

    const isMap = viewMode === ListPageViewMode.ListPageMap;
    const isGrid = viewMode === ListPageViewMode.ListPageGrid;

    this.showMap = isMap;
    this.showExpandCollapse = isGrid;
    this.showColumnChooser = isGrid;
    this.showExport = isGrid;
    this.filterButtonEnabled = isGrid;
    this.moreButtonEnabled = isGrid;
    this.searchTextBoxEnabled = isGrid;
    this.portfolioButtonEnabled = isGrid;
    this.listPageViewMode = viewMode;

    if (saveToSession) {
      this.saveStateToSession();
    }
  }

  showDynamicSQL() {
    this.service.getDynamicSQL(this.lastGridDataRequest).subscribe((res) => {
      const leftRegEx = new RegExp('\\[\\s', 'g');
      const rightRegEx = new RegExp('\\s\\]', 'g');
      if (!res.success) {
        this.showErrorPopup(
          'An error occurred while generating the sql for this view. Please see the error logs for futher details.'
        );
        return;
      }
      this.formattedSql = format(res.data, {
        language: 'tsql',
        uppercase: true,
      })
        .replace(leftRegEx, '[')
        .replace(rightRegEx, ']');

      this.sqlPopupVisible = true;
    });
  }

  copyToClipboard() {
    const sql = document.getElementById('dynamic-sql').innerText;
    const el = document.createElement('textarea');

    el.value = sql;

    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  closeSqlPopup = () => {
    this.sqlPopupVisible = false;
  };

  createListView(name: string) {
    if (name.length > 50) {
      this.showErrorPopup(`List View names must be 50 characters or fewer.
        Please try again with a shorter List View name.`);

      return;
    }

    const userListView: ListView = {
      id: 0,
      listViewType: ListViewType.User,
      objectTypeId: this.objectTypeId,
      listPageId: this.currentListView.listPageId,
      name: name,
      view: JSON.stringify(this.dataGrid.instance.state()),
      isExpandAllSelected: this.isExpanded,
      archiveToggleValue: this.currentListView.archiveToggleValue,
      masterGroupId: this.currentPortfolio?.masterGroupId ?? null,
    };

    this.service.createUserListView(userListView).subscribe((newListViewId) => {
      const { data: id } = newListViewId;
      const request: GetViewDropdownDataRequest = {
        objectTypeId: this.objectTypeId,
        isSuperUser: this._isSuperUser,
      };

      this.service.getListViewSelectorItems(request).subscribe((result) => {
        this.listViews = result.data;

        this.activeListViewCount =
          this.listViews.coStarListViews.length +
          this.listViews.myListViews.length +
          this.listViews.sharedListViews.length;

        const newListView = this.listViews.myListViews.find((x) => x.id == id);

        this.currentListView = newListView;
        this.configCurrentListView(true, false);
      });
    });
  }

  updateListView() {
    const gridState = this.dataGrid.instance.state();

    gridState.searchText = null;
    this.currentListView.view = JSON.stringify(gridState);
    this.currentListView.isExpandAllSelected = this.isExpanded;
    this.currentListView.masterGroupId =
      this.currentPortfolio?.masterGroupId ?? null;
    this.currentListView.archiveToggleValue = this.getArchiveToggleValue();
    this.setUnmodifiedOriginalListView();

    const dto = {
      id: this.currentListView.id,
      listViewType: this.currentListView.listViewType,
      view: this.currentListView.view,
      archiveToggleValue: this.currentListView.archiveToggleValue,
      isExpandAllSelected: this.currentListView.isExpandAllSelected,
      masterGroupId: this.currentListView.masterGroupId,
    };

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.service.updateListView(dto).subscribe(() => {});
  }

  resetListView() {
    this.service.getListView(this.currentListView).subscribe((result) => {
      this.currentListView = result.data;

      this.configCurrentListView(true, false);

      this.dataGrid.instance.clearFilter();

      if (this.cremDropdownComponent) {
        this.cremDropdownComponent.clearDropdown();
      }

      this.filterValue = JSON.parse(this.currentListView.view).filterValue;
    });
  }

  toggleExpanded() {
    this.isExpanded
      ? this.dataGrid.instance.collapseAll()
      : this.dataGrid.instance.expandAll();

    this.isExpanded = !this.isExpanded;
    this.currentListView.isExpandAllSelected = this.isExpanded;

    this.saveStateToSession();
  }

  displayColumnChooser() {
    this.dataGrid.instance.showColumnChooser();

    setTimeout(() => {
      const choosers = document.getElementsByClassName(
        'dx-datagrid-column-chooser'
      );

      for (let i = 0; i < choosers.length; i++) {
        const closeButton =
          choosers[i].getElementsByClassName('dx-closebutton')[0];

        if (closeButton && !this.hasListener) {
          closeButton.addEventListener('click', () => {
            this.columnChooserClosed();
          });

          this.hasListener = true;
        }
      }
    }, 100);
  }

  columnChooserClosed() {
    if (
      !this.doesLeftArrayIncludeRight(
        this.includedDataFieldsFromLastGridReload,
        this.dataGrid.instance.getVisibleColumns().map((item) => item.dataField)
      ) ||
      this.gridData?.length === 0
    ) {
      this.saveStateToSession();
      this.populateGrid(true);
    }
  }

  exportExcel() {
    this.exportToExcelService.exportToExcel(
      this.dataGrid.instance,
      this.currentListViewName
    );
  }

  toggleShowActive(includeActive: boolean) {
    this.includeActive = includeActive;
    this.updateArchiveToggleValue();
  }

  toggleShowArchived(includeArchived: boolean) {
    this.includeArchived = includeArchived;
    this.updateArchiveToggleValue();
  }

  public btnAddItemNewClick(objectId) {
    switch (objectId) {
      // Add Project Modal
      case ObjectType.PROJECT: {
        const dialogRef = this.dialog.open(AddFormWizardComponent, {
          disableClose: true,
          height: '80vh',
          width: '70vw',
          minWidth: '320px',
          maxWidth: '1100px',
          minHeight: '420px',
          data: {
            objectTypeId: this.objectTypeId,
            userId: this.userId,
            objectId: objectId,
          },
        });
        break;
      }
      // Add Contact Modal
      case ObjectType.CONTACT: {
        const dialogRef = this.dialog.open(AddContactModalComponent, {
          disableClose: true,
          height: '50vh',
          width: '70vw',
          minWidth: '320px',
          maxWidth: '1100px',
          minHeight: '420px',
          data: {
            objectTypeId: this.objectTypeId,
            userId: this.userId,
          },
        });
        dialogRef.afterClosed().subscribe(() => {
          this.populateGrid(true);
        });
        break;
      }
    }
  }

  public btnAddCompany() {
    const dialogRef = this.dialog.open(AddCompanyModalComponent, {
      disableClose: true,
      height: '40vh',
      width: '70vw',
      minWidth: '320px',
      maxWidth: '1100px',
      minHeight: '420px',
      data: {
        objectTypeId: this.objectTypeId,
        userId: this.userId,
      },
    });

    dialogRef.afterClosed();
  }
  private updateArchiveToggleValue() {
    this.currentListView.archiveToggleValue = this.getArchiveToggleValue();

    this.archiveToggleHint =
      this.currentListView.archiveToggleValue ===
      ArchiveToggleValue.ActiveAndArchived
        ? `(Showing both active and ${this.archivedLabel} records)`
        : this.currentListView.archiveToggleValue ===
          ArchiveToggleValue.ActiveOnly
        ? `(Showing active records only)`
        : this.currentListView.archiveToggleValue ===
          ArchiveToggleValue.ArchivedOnly
        ? `(Showing ${this.archivedLabel} records only)`
        : `(Showing neither active nor ${this.archivedLabel} records)`;

    this.saveStateToSession();
    this.populateGrid(true);
  }

  private expandGroupRowsFromSession() {
    const expandedRows: any[] =
      this.safeGetFromSession(SessionVariables.ExpandCollapse) ?? [];

    expandedRows.forEach((row: Row) => {
      this.dataGrid.instance.expandRow(row.key);
    });
  }

  private getArchiveToggleValue() {
    return !this.includeArchived && !this.includeActive
      ? ArchiveToggleValue.None
      : this.includeArchived && !this.includeActive
      ? ArchiveToggleValue.ArchivedOnly
      : !this.includeArchived && this.includeActive
      ? ArchiveToggleValue.ActiveOnly
      : ArchiveToggleValue.ActiveAndArchived;
  }

  private configCurrentListView(
    refreshGrid: boolean,
    useSessionState: boolean = false,
    overrideDefaultListPage = false
  ) {
    if (useSessionState) {
      this.currentListView = this.safeGetFromSession(
        SessionVariables.CurrentListView
      );
      this.unmodifiedOriginalListView = this.safeGetFromSession(
        SessionVariables.UnmodifiedOriginalCurrentListView
      );
    }

    const viewResolutionSequence = [
      this.listViews?.coStarListViews?.find((x) => x.isDefault),
      this.listViews?.myListViews?.find((x) => x.isDefault),
      this.listViews?.sharedListViews?.find((x) => x.isDefault),
      this.listViews?.coStarListViews?.[0],
      this.listViews?.myListViews?.[0],
      this.listViews?.sharedListViews?.[0],
      this.listViews?.hiddenListViews?.[0],
    ];

    if (overrideDefaultListPage) {
      const overrideView = this.listViews?.coStarListViews?.find(
        (x) => x.listPageId === this._intitialListPageRequestedId
      );
      // unshift view to the front of the list sources
      viewResolutionSequence.unshift(
        overrideView,
        this.createInvalidListView()
      );

      // clear the requested list page id
      this._intitialListPageRequestedId = -1;
    }

    // viewResolutionSequence is in order of importance so we can stop at the first non-null view
    let selectedListView = viewResolutionSequence.find((view) => !!view);

    this.currentListView = this.currentListView ?? selectedListView;
    this.originalViewObject = JSON.parse(
      selectedListView.view,
      this.parseIsoDateStrToDate
    );

    const listViewSources = [
      this.listViews.coStarListViews,
      this.listViews.myListViews,
      this.listViews.sharedListViews,
      this.listViews.hiddenListViews,
    ];

    const isInListViews = listViewSources.map((viewGroup) =>
      viewGroup.some((x) => x.id === this.currentListView.id)
    );

    // the view is no longer available, show error popup and use the default view
    if (!isInListViews) {
      this.showErrorPopup('This list view is no longer available.');
      if (this.currentListView !== selectedListView) {
        this.isCurrentViewRemoved = true;
        this.currentListView = selectedListView;
      } else {
        return;
      }
    }

    const listView = this.currentListView;
    const viewDataObject = JSON.parse(listView.view);

    this.currentListViewName = listView.name;
    this.searchText = viewDataObject.searchText;
    this.dataGrid.instance.searchByText(this.searchText);

    // even if we have session state, that doesnt mean there will be an entry for the current view, look in the porfolio list instead of returning null prematurely
    // try to get current portfolio from sequence of sources
    this.currentPortfolio =
      this.safeGetFromSession(SessionVariables.Portfolio) ||
      this.portfolios.find(
        (x) => x.masterGroupId === this.currentListView.masterGroupId
      ) ||
      null;

    const isHiddenListView = this.listViews.hiddenListViews.some(
      (x) => x.id === this.currentListView.id
    );
    const isMyListView = this.listViews.myListViews.some(
      (x) => x.id === this.currentListView.id
    );

    this.showSave =
      !this.isCoStarListView(this.currentListView) &&
      (isMyListView ||
        ((listView.isSharedWithMe || isHiddenListView) &&
          listView.securityType !== SecurityType.RestrictedView &&
          listView.securityType !== SecurityType.View));

    this.isExpanded = listView.isExpandAllSelected;

    if (useSessionState) {
      this.expandGroupRowsFromSession();
    }

    this.includeActive =
      listView.archiveToggleValue === ArchiveToggleValue.ActiveAndArchived ||
      listView.archiveToggleValue === ArchiveToggleValue.ActiveOnly;

    this.includeArchived =
      listView.archiveToggleValue === ArchiveToggleValue.ActiveAndArchived ||
      listView.archiveToggleValue === ArchiveToggleValue.ArchivedOnly;

    this.archiveToggleHint =
      listView.archiveToggleValue === ArchiveToggleValue.ActiveAndArchived
        ? `(Showing both active and ${this.archivedLabel} records)`
        : listView.archiveToggleValue == ArchiveToggleValue.ActiveOnly
        ? `(Showing active records only)`
        : listView.archiveToggleValue == ArchiveToggleValue.ArchivedOnly
        ? `(Showing ${this.archivedLabel} records only)`
        : `(Showing neither active nor ${this.archivedLabel} records)`;

    this.dataGrid.instance.pageSize(viewDataObject.pageSize);
    this.dataGrid.instance.pageIndex(viewDataObject.pageIndex);

    if (refreshGrid) {
      if (this.isCurrentViewRemoved) {
        this.populateGrid(false);
      } else {
        this.populateGrid(useSessionState);
      }
    }
  }

  private closePopup = () => {
    this.popupInfo.popupVisible = false;
  };

  private showErrorPopup(message: string) {
    this.resetPopupInfo();

    this.popupInfo.popupMessage = message;
    this.popupInfo.popupVisible = true;
    this.popupInfo.popupTitle = 'Error';
    this.popupInfo.actionButtonOptions = null;

    this.popupInfo.cancelButtonOptions = {
      text: 'Close',
      onClick: this.closePopup,
    };
  }

  private resetPopupInfo() {
    this.popupInfo = {
      popupVisible: false,
      popupMessage: '',
      popupTitle: 'Information',
      cancelButtonOptions: null,
      actionButtonOptions: null,
      dragEnabled: false,
      width: '300',
      isFormatted: false,
    };
  }

  private setUnmodifiedOriginalListView() {
    setTimeout(() => {
      this.unmodifiedOriginalListView = Object.assign({}, this.currentListView);
      this.unmodifiedOriginalListView.view = JSON.stringify(
        this.dataGrid.instance.state()
      );

      this.saveStateToSession();
    }, 1500);
  }

  private saveStateToSession() {
    //Remove the session item for the current object type if exists
    const session = sessionStorage.getItem(this.listPageSessionKey);
    let listPageObjectTypeSessions: ListPageObjectTypeSession[] = [];
    if (session !== null) {
      listPageObjectTypeSessions = JSON.parse(session);
      let index = listPageObjectTypeSessions.findIndex(
        (x) => x.objectTypeId === this.objectTypeId
      );
      // remove the current list page session if it exists
      if (index >= 0) listPageObjectTypeSessions.splice(index, 1);
    }

    //Add the session item back for the current object type
    const state = this.dataGrid.instance.state();
    state.searchText = this.searchText;
    state.filterValue = this.dataGrid.filterValue;
    this.currentListView.view = JSON.stringify(state);

    const listPageObjectTypeSession: ListPageObjectTypeSession = {
      objectTypeId: this.objectTypeId,
      currentListView: JSON.stringify(this.currentListView),
      portfolio: JSON.stringify(this.currentPortfolio),
      listPageViewMode: this.listPageViewMode,
      expandCollapse: JSON.stringify(
        this.dataGrid.instance
          .getVisibleRows()
          .filter((x) => x.rowType === 'group' && x.isExpanded)
          .map((x) => ({ key: x.key }))
      ),
      filterFields: JSON.stringify(JSON.stringify(this.filterFields)),
      archiveToggleValue: this.getArchiveToggleValue(),
      unmodifiedOriginalCurrentListView: JSON.stringify(
        this.unmodifiedOriginalListView
      ),
    };

    listPageObjectTypeSessions.push(listPageObjectTypeSession);

    sessionStorage.setItem(
      this.listPageSessionKey,
      JSON.stringify(listPageObjectTypeSessions)
    );
  }

  private safeGetFromSession(getType: SessionVariables) {
    const listPageSessionValue = sessionStorage.getItem(
      this.listPageSessionKey
    );
    if (listPageSessionValue === undefined || listPageSessionValue === null) {
      return null;
    }

    const listPageObjectTypeSessions = JSON.parse(
      listPageSessionValue
    ) as ListPageObjectTypeSession[];
    const listPageObjectTypeSession = listPageObjectTypeSessions.find(
      (x) => x.objectTypeId === this.objectTypeId
    );
    if (
      listPageObjectTypeSession === undefined ||
      listPageObjectTypeSession === null
    )
      return null;

    switch (getType) {
      case SessionVariables.ArchiveToggleValue:
        return listPageObjectTypeSession?.archiveToggleValue;
      case SessionVariables.CurrentListView:
        return JSON.parse(listPageObjectTypeSession?.currentListView);
      case SessionVariables.ExpandCollapse:
        return JSON.parse(listPageObjectTypeSession?.expandCollapse);
      case SessionVariables.FilterFields:
        return listPageObjectTypeSession?.filterFields;
      case SessionVariables.ListPageViewMode:
        return listPageObjectTypeSession?.listPageViewMode;
      case SessionVariables.Portfolio:
        if (
          listPageObjectTypeSession.portfolio === undefined ||
          listPageObjectTypeSession.portfolio === 'null' ||
          listPageObjectTypeSession.portfolio === null
        ) {
          return null;
        } else {
          return JSON.parse(listPageObjectTypeSession.portfolio);
        }
      case SessionVariables.UnmodifiedOriginalCurrentListView:
        return JSON.parse(
          listPageObjectTypeSession.unmodifiedOriginalCurrentListView
        );
      default:
        return null;
    }
  }

  getDataGridAllRows() {
    let grid: DataGrid | undefined = this.dataGrid?.instance;
    let filterExpr = grid?.getCombinedFilter(true);
    const dataSource = grid?.getDataSource();
    const loadOptions = dataSource?.loadOptions();
    let allrows: any[] = [];
    dataSource
      ?.store()
      .load({
        filter: filterExpr,
        sort: loadOptions?.sort,
        group: loadOptions?.group,
      })
      .then((result: any) => {
        allrows = result;
      });
    return allrows;
  }

  private getVisibleFieldValuesFromGrid(fieldName: string): string[] {
    const result: string[] = [];
    const datagridAllRows = this.getDataGridAllRows();
    datagridAllRows.forEach((row) => {
      if (row.hasOwnProperty('items') && Array.isArray(row.items)) {
        row.items.forEach((item) => {
          result.push(item[fieldName]);
        });
      } else {
        result.push(row[fieldName]);
      }
    });

    return result;
  }

  private getFilterFieldsFromFilter(filterValue: string[]): string[] {
    const fieldsInFilter: string[] = [];

    if (filterValue === null) return fieldsInFilter;

    if (
      (filterValue?.length === 3 || filterValue?.length === 2) &&
      !Array.isArray(filterValue[0])
    ) {
      // Only one item in filter - more efficent than checking in each recursive frame
      fieldsInFilter.push(filterValue[0]);
    } else {
      this.recursivelyGetDataFieldsFromFilter(fieldsInFilter, filterValue);
    }
    return fieldsInFilter;
  }

  private recursivelyGetDataFieldsFromFilter(
    listToFill: string[],
    filterValue: any[]
  ): string[] {
    // A valid filter will be either an array[2] or array[3] in which case
    // array[0] is not an array, otherwise it is one of these:
    // 1. A nested Filter - Array[Array[2|3],[..],[..]]..
    //    filters can be bound in positions or 3,
    //    such as ["FieldName", "=", "Foo"]
    //    or ["DateColumn", "CutsomFilterCondition"]
    // 2. A Filter Condtion - "and|or|>="
    // 3. A Filter Value - "01/01/2021"
    // The only thing needed are the filter fields.

    for (let x = 0; x <= filterValue?.length; x++) {
      if (!Array.isArray(filterValue[x])) {
        continue;
      }

      if (
        (filterValue[x].length === 3 || filterValue[x].length === 2) &&
        !Array.isArray(filterValue[x][0])
      ) {
        listToFill.push(filterValue[x][0]);
        continue;
      }

      this.recursivelyGetDataFieldsFromFilter(listToFill, filterValue[x]);
    }

    // Remove duplicates
    return listToFill.filter((element, i) => i === listToFill.indexOf(element));
  }

  private doesLeftArrayIncludeRight(source: string[], mustInclude: string[]) {
    for (const column of mustInclude) {
      if (!source.includes(column)) {
        return false;
      }
    }

    return true;
  }

  private cannotHideOrDeleteAllListViews() {
    this.showInformationPopup('Cannot delete or hide all views in the list.');
  }

  private areObjectArraysEqual(left: any[], right: any[]) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  private doesListViewNeedSaving(listViewId: number) {
    // simply comparing currentListView to original view will not work because
    // there are items like searchText that do not persists when saving.

    if (listViewId !== this.currentListView.id) {
      return false;
    }

    if (
      (this.currentPortfolio?.masterGroupId ?? null) !==
        (this.unmodifiedOriginalListView?.masterGroupId ?? null) ||
      this.currentListView.isExpandAllSelected !==
        this.unmodifiedOriginalListView?.isExpandAllSelected ||
      this.currentListView.archiveToggleValue !==
        this.unmodifiedOriginalListView?.archiveToggleValue
    ) {
      return true;
    }

    const currentViewDataObject = this.dataGrid.instance.state();
    const unmodifiedOriginalListViewDataObject = JSON.parse(
      this.unmodifiedOriginalListView.view
    );

    //Filter arrays
    if (
      !this.areObjectArraysEqual(
        currentViewDataObject.filterValue,
        unmodifiedOriginalListViewDataObject.filterValue
      ) ||
      currentViewDataObject.filterText !==
        unmodifiedOriginalListViewDataObject.filterText
    ) {
      return true;
    }

    // The columns hold all the state for sorting, grouping, visibility
    // and "column" filtering grid operations.
    const currentColumns = [];
    currentViewDataObject.columns.forEach((item: any) => {
      const newItem = Object.assign({}, item);
      delete newItem.width;
      currentColumns.push(newItem);
    });

    const unModifiedColumns = [];
    unmodifiedOriginalListViewDataObject.columns.forEach((item: any) => {
      const newItem = Object.assign({}, item);
      delete newItem.width;
      unModifiedColumns.push(newItem);
    });

    if (!this.areObjectArraysEqual(currentColumns, unModifiedColumns)) {
      return true;
    }

    return false;
  }

  private showCustomPopup(title: string, message: string) {
    this.resetPopupInfo();

    this.popupInfo.popupMessage = message;
    this.popupInfo.popupVisible = true;
    this.popupInfo.popupTitle = title;
    this.popupInfo.actionButtonOptions = null;

    this.popupInfo.cancelButtonOptions = {
      text: 'Close',
      onClick: this.closePopup,
    };
  }

  private showInformationPopup(message: string) {
    this.resetPopupInfo();

    this.popupInfo.popupMessage = message;
    this.popupInfo.popupVisible = true;
    this.popupInfo.popupTitle = 'Information';
    this.popupInfo.actionButtonOptions = null;

    this.popupInfo.cancelButtonOptions = {
      text: 'Close',
      onClick: this.closePopup,
    };
  }

  private updateRowNoteDate(latestNote: CommonNote, update: any, key: string) {
    const id = this.gridData.indexOf(update);

    update[key] = latestNote.commonNote;
    this.gridData[id] = update;
  }

  private getObjectsValuesFrom(object: any) {
    const result: string[] = [];

    Object.keys(object).map(function (key) {
      result.push(key);
    });

    return result;
  }

  checkExpRevOptions() {
    //**** this is for lease payments page - expense and revenue **/
    this.vendorOrCustomer = '';
    if (this.objectTypeId == ObjectTypeIds.Expense) {
      this.vendorOrCustomer = 'Vendor';
    } else {
      this.vendorOrCustomer = 'Customer';
    }
  }

  getLeaseInfo(leaseId: number) {
    this.service.getLeaseInfo(leaseId).subscribe((res) => {
      if (!res.success) {
        console.log('LeaseInfo API is not successful');
        return;
      }
      if (res.data) {
        this.showHoldPayments = true;
        this.isHoldPayments = res.data.nonPayLease;
        this.isLeaseArchived =
          res.data.leaseActive &&
          res.data.leaseActive.trim().toLowerCase() == 'archived'
            ? true
            : false;
        this.isLeaseLocked = res.data.isLocked;
      }
    });
  }

  setLeaseInfo(isHoldPayments: boolean) {
    this.leaseInfoReq = {
      leaseAbstractID: this.urlOID,
      nonPayLease: isHoldPayments,
    };
    this.service.postLeaseInfo(this.leaseInfoReq).subscribe((res) => {
      if (!res.success) {
        console.log('LeaseInfo API update is not successful');
        return;
      }
    });
  }

  getDateFormat() {
    let obj;
    obj = this.columnsDef.find((ele) => {
      if (ele.hasOwnProperty('dataField') && ele.dataField == 'StartDate') {
        return ele;
      }
    });

    this.userPrefDateFormat = obj.format ? obj.format : 'MM/dd/yyyy';
  }

  setEditPagesForLeasePayments() {
    let newIsIncomeValue: string = '';

    if (this.vendorOrCustomer == 'Vendor') {
      newIsIncomeValue = 'False';
    } else {
      newIsIncomeValue = 'True';
    }

    if (newIsIncomeValue !== this.isIncomeValue) {
      this.isIncomeValue = newIsIncomeValue;

      //Create a copy of the unModifiedEditPages array
      let tempEditPages = JSON.parse(JSON.stringify(this.unModifiedEditPages));

      tempEditPages.forEach((ep) => {
        ep.navigationUrl = this.replaceQueryParamsInLeasePaymentUrl(
          ep.navigationUrl,
          null
        );
      });

      this.editPages = tempEditPages;
    }
  }

  dataGridOnCellPrepared(e) {
    if (
      this.isGLEvent &&
      e.rowType == 'header' &&
      e.column.command == 'select'
    ) {
      this.headerHtmlCellElement =
        e.cellElement.length === undefined ? e.cellElement : e.cellElement[0];
      this.headerCheckBox = CheckBox.getInstance(
        this.headerHtmlCellElement.querySelector('.dx-select-checkbox')
      );
    }

    if (this.isGLEvent && e.rowType === 'data') {
      if (
        e.data.IsTaxable === 'Yes' &&
        e.column.dataField === 'GLEventName' &&
        e.data.GLEventName.indexOf('(Taxable)') < 0
      )
        e.data.GLEventName = e.data.GLEventName.trim() + ' (Taxable)';

      if (
        e.data.TaxableGLEventID > 0 &&
        e.column.dataField === 'GLEventName' &&
        e.data.GLEventName.indexOf('(Tax)') < 0
      )
        e.data.GLEventName = e.data.GLEventName.trim() + ' (Tax)';

      if (
        (e.data.IsActive === 'Deleted' ||
          this.isLeaseArchived ||
          this.isLeaseLocked ||
          !this._showAddButton) &&
        e.column.command === 'select'
      ) {
        //In mangospa the td element is in e.cellElement but in CREM it is in an array so we use e.cellElement[0]
        let htmlCellElement =
          e.cellElement.length === undefined ? e.cellElement : e.cellElement[0];
        var editor = CheckBox.getInstance(
          htmlCellElement.querySelector('.dx-select-checkbox')
        );
        if (!!editor) {
          if (e.data.IsActive === 'Deleted') {
            editor.option('visible', false);
          } else {
            editor.option('disabled', true);
          }
        }

        htmlCellElement.style.pointerEvents = 'none';
      }
    }
  }

  editSelectedCharges() {
    let editChargeUrl: string = `/v06/financials/EditCharge.aspx?OID=&OTID=4&OTTID=${this.urlOTTID}&GLGroup=&IsIncome=&Mode=Edit&paramFinView=Status&NavPageId=${this.urlNavPageId}`;
    let scheduledCharges = this.dataGrid.selectedRowKeys.filter(
      (srk) => srk.IsActive === 'Active'
    );

    if (scheduledCharges.length <= 0) {
      alert('There are not any charges to edit.');
      return;
    }

    this.isChargeAction = true;
    let glEventIdList: number[] = scheduledCharges.map((sc) => sc.GLEventID);
    editChargeUrl = this.replaceQueryParamsInLeasePaymentUrl(
      editChargeUrl,
      glEventIdList
    );
    this.navigateToUrl(editChargeUrl);
  }

  deleteSelectedCharges() {
    const leaseObjectTypeTypeId: number = this.urlOTTID;

    let allChargesWithIndex = this.dataGrid.selectedRowKeys.every(
      (c) => c.IndexRule
    );
    let someChargesWithIndex = allChargesWithIndex
      ? false
      : this.dataGrid.selectedRowKeys.some((c) => c.IndexRule);

    let inProcessOrHistoricalExist: boolean =
      this.dataGrid.selectedRowKeys.find(
        (re) =>
          re.ProcessingStatus.toLowerCase() == 'in process' ||
          re.ProcessingStatus.toLowerCase() == 'historical'
      ) !== undefined;
    let deleteMsg: string = inProcessOrHistoricalExist
      ? 'All selected Scheduled charges will be deleted! Historical or In Process Charges cannot be deleted!'
      : 'All selected charges will be deleted! Do you wish to continue?';

    if (confirm(deleteMsg)) {
      let scheduledCharges = this.dataGrid.selectedRowKeys.filter(
        (srk) => srk.IsActive === 'Active'
      );
      if (inProcessOrHistoricalExist || someChargesWithIndex) {
        //Get all scheduled charges with no index rule
        scheduledCharges = scheduledCharges.filter(
          (sc) =>
            (sc.ProcessingStatus.toLowerCase() == 'scheduled' ||
              sc.ProcessingStatus.toLowerCase() == 'estimated') &&
            !sc.IndexRule
        );
      }

      if (allChargesWithIndex) {
        alert(
          'To delete this charge(s) you must first remove the charge from the charge group.'
        );
        return;
      }

      if (scheduledCharges.length <= 0) {
        alert('There are not any scheduled charges to delete.');
        return;
      } else {
        this.isChargeAction = true;
      }

      let glEventIdList: number[] = scheduledCharges.map((sc) => sc.GLEventID);

      this.service.deleteCharge(leaseObjectTypeTypeId, glEventIdList).subscribe(
        (res) => {
          this.isChargeAction = false;
          if (res !== null && res.success) {
            if (res.data !== null) alert(res.data);
            else if (someChargesWithIndex) {
              alert(
                'Some charges may not have been deleted. Please review and try again.'
              );
            } else {
              alert('The charges were deleted.');
            }

            this.populateGrid(false);
          } else {
            alert(
              'The charges were not deleted. Please review and try again later.'
            );
          }
        },
        (error) => {
          this.isChargeAction = false;
          alert(
            'An error occurred deleting the charges. Please review and try again later.'
          );
        }
      );
    }
  }

  terminateLeaseCharges() {
    let terminateLeaseChargesUrl: string = `/v06/financials/TerminateLease.aspx?OID=&OTID=4&OTTID=${this.urlOTTID}&Mode=Edit&IsIncome=&paramFinView=Status&NavPageId=${this.urlNavPageId}`;
    terminateLeaseChargesUrl = this.replaceQueryParamsInLeasePaymentUrl(
      terminateLeaseChargesUrl,
      null
    );
    this.isChargeAction = true;
    this.navigateToUrl(terminateLeaseChargesUrl);
  }

  changeVendorOrCustomer() {
    let changeUrl = `/v06/financials/ChangeVendor.aspx?OID=${this.urlOID}&OTID=4&OTTID=${this.urlOTTID}&Mode=Edit&IsIncome=${this.isIncomeValue}&paramFinView=Status&NavPageId=${this.urlNavPageId}`;
    this.isChargeAction = true;
    this.router.navigateByUrl(changeUrl);
  }

  changeDefaultVendorOrCustomer() {
    let changeDefaultVendorOrCustomerUrl: string = `javascript:loadDefaultVendor('/v06/financials/ChangeDefaultVendor.aspx?OID=&OTID=4&OTTID=${this.urlOTTID}&Mode=Edit&IsIncome=&paramFinView=Status&NavPageId=${this.urlNavPageId}');`;
    changeDefaultVendorOrCustomerUrl = this.replaceQueryParamsInLeasePaymentUrl(
      changeDefaultVendorOrCustomerUrl,
      null
    );
    this.navigateToUrl(changeDefaultVendorOrCustomerUrl);
  }

  stopLeasePaymentCharge(leaseCharge) {
    let isTaxable = leaseCharge.IsTaxable === 'Yes';
    let isTaxCharge = leaseCharge.TaxableGLEventID > 0;
    let taxStr = '';
    let parentChargeStr = '';

    if (isTaxable || isTaxCharge) {
      taxStr = 'Tax';

      if (isTaxable) parentChargeStr = '&IsParentCharge=True';
      else parentChargeStr = '&IsParentCharge=False';
    }

    this.isChargeAction = true;
    let stopChargeUrl: string = `/v06/financials/Stop${taxStr}Charge.aspx?OID=&OTID=4&GLEID=&OTTID=${this.urlOTTID}&IsIncome=&status=In%20Process${parentChargeStr}&NavPageId=${this.urlNavPageId}`;
    stopChargeUrl = this.replaceQueryParamsInLeasePaymentUrl(stopChargeUrl, [
      leaseCharge.GLEventID,
    ]);
    this.navigateToUrl(stopChargeUrl);
  }

  editLeasePaymentCharge(leaseCharge) {
    let editChargeUrl: string = `/v06/financials/EditCharge.aspx?OID=&OTID=4&OTTID=${this.urlOTTID}&GLEID=&GLGroup=&IsIncome=&Mode=Edit&NavPageId=${this.urlNavPageId}`;
    editChargeUrl = this.replaceQueryParamsInLeasePaymentUrl(editChargeUrl, [
      leaseCharge.GLEventID,
    ]);
    this.isChargeAction = true;
    this.navigateToUrl(editChargeUrl);
  }

  copyLeasePaymentCharge(leaseCharge) {
    let copyMsg: string = 'Are you sure you want to copy the selected charge?';

    if (confirm(copyMsg)) {
      this.isCopyCharge = true;
      this.service.copyCharge(leaseCharge.GLEventID).subscribe((res) => {
        if (res.success) {
          //If copy charge is successful use the GLEventId return to build the string
          let copyChargeUrl: string = `/v06/Financials/EditCharge.aspx?OID=&OTID=4&OTTID=${this.urlOTTID}&GLEID=&GLGroup=&IsIncome=&mode=edit&copy=1&NavPageId=${this.urlNavPageId}`;
          let newGLEventId: number = res.data; //Set to the one returned from the API
          copyChargeUrl = this.replaceQueryParamsInLeasePaymentUrl(
            copyChargeUrl,
            [newGLEventId]
          );
          this.navigateToUrl(copyChargeUrl);
        } else {
          this.isCopyCharge = false;
        }
      });
    }
  }

  deleteLeasePaymentCharge(leaseCharge: any) {
    const leaseObjectTypeTypeId: number = this.urlOTTID;
    if (
      leaseCharge.ProcessingStatus.toLowerCase() === 'in process' ||
      leaseCharge.ProcessingStatus.toLowerCase() === 'historical' ||
      leaseCharge.IsActive === 'Deleted'
    ) {
      alert('This charge can not be deleted.');
      return;
    }

    let deleteMsg: string = 'Are you sure you want to delete this charge?';

    if (confirm(deleteMsg)) {
      this.isChargeAction = true;
      this.service
        .deleteCharge(leaseObjectTypeTypeId, [leaseCharge.GLEventID])
        .subscribe(
          (res) => {
            this.isChargeAction = false;
            if (res !== null && res.success) {
              if (res.data !== null) alert(res.data);
              else alert('The charge was deleted.');

              this.populateGrid(false);
            } else {
              alert(
                'The charge was not deleted. Please review and try again later.'
              );
            }
          },
          (error) => {
            this.isChargeAction = false;
            alert(
              'An error occurred deleting the charge. Please review and try again later.'
            );
          }
        );
    }
  }

  private replaceQueryParamsInLeasePaymentUrl(
    url: string,
    gleventIdList: number[]
  ): string {
    url = url.replace('OID=', `OID=${this.urlOID}`);
    url = url.replace('IsIncome=', `IsIncome=${this.isIncomeValue}`);

    if (gleventIdList !== null && gleventIdList.length > 0) {
      url = url.replace('GLEID=', `GLEID=${gleventIdList.join(',')}`);
      url = url.replace('GLGroup=', `GLGroup=${gleventIdList.join(',')}`);
    }

    return url;
  }

  private navigateToUrl(url) {
    this.navigateToEditPage();
    this.router.navigateByUrl(url);
  }

  private ensureJavaScript(htmlLink: string) {
    return htmlLink.startsWith('javascript:')
      ? htmlLink
      : `javascript:${htmlLink}`;
  }

  private populateGrid(useSessionState: boolean = false) {
    this.dataGrid.instance.beginCustomLoading('Loading...');
    this.inCriticalViewDataError = false;
    this.inDisabledUIState = true;
    this.initializingApplication = false;
    this.isCurrentViewRemoved = false;
    this.chargesOnLease = false;
    this.showHoldPayments = false;
    try {
      const currentViewInSession = this.safeGetFromSession(
        SessionVariables.CurrentListView
      );
      const viewDataObject =
        useSessionState && currentViewInSession
          ? JSON.parse(currentViewInSession.view, this.parseIsoDateStrToDate)
          : JSON.parse(this.currentListView.view, this.parseIsoDateStrToDate);

      const initViewDataObject = this.originalViewObject;

      this.service
        .getListPageColumns(this.currentListView.listPageId)
        .subscribe((result) => {
          this.columnsDef = result.data.columnDefinitions;
          this.columns = [];

          const listViewColumns = viewDataObject.columns;
          const initListViewColumns = initViewDataObject.columns;

          const filters = this.getFilterFieldsFromFilter(
            viewDataObject.filterValue
          );

          this.columnsDef.forEach((col: any) => {
            let listViewColumn;
            if (listViewColumns) {
              listViewColumn = listViewColumns.filter(
                (x: any) => x.dataField === col.dataField
              )[0];
            }

            let initListViewColumn;
            if (initListViewColumns) {
              initListViewColumn = initListViewColumns.filter(
                (x: any) => x.dataField === col.dataField
              )[0];
            }

            let column = {
              dataField: col.dataField,
              fieldType: col.fieldType,
              caption:
                col.caption === null
                  ? col.dataField.replace('_', ' ')
                  : col.caption,
              visible: listViewColumn ? listViewColumn.visible : false,
              dataType: col.dataType,
              visibleIndex: listViewColumn ? listViewColumn.visibleIndex : -1,
              format: col.format,
              showInColumnChooser: initListViewColumn
                ? initListViewColumn.showInColumnChooser
                : true,
              allowReordering: initListViewColumn
                ? initListViewColumn.allowReordering
                : true,
              type: initListViewColumn ? initListViewColumn.type : '',
              urlLink: col.urlLink,
              useDefaultObjectFields: col.useDefaultObjectFields,
              width: col.width,
              fixed: col.fixed,
              fixedPosition: col.fixedPosition,
              displayOrder: col.displayOrder,
              allowSorting: initListViewColumn
                ? initListViewColumn.allowSorting
                : true,
              allowFiltering: initListViewColumn
                ? initListViewColumn.allowFiltering
                : true,
              allowResizing: initListViewColumn
                ? initListViewColumn.allowResizing
                : true,
              allowGrouping: initListViewColumn
                ? initListViewColumn.allowGrouping
                : true,
              isInFilter:
                filters.filter((x: any) => x === col.dataField).length > 0,
              allowExporting: col.allowExporting ? col.allowExporting : true,
            };

            column = Object.assign(column, listViewColumn);

            // restore date format overwritten by Object.assign
            // These values are configured in the database and take precedence
            // over what was last stored in grid view state. If a user changes
            // a dataType from  string to number we need to pick up on that change
            column.caption =
              col.caption === null
                ? col.dataField.replace('_', ' ')
                : col.caption;
            column.urlLink = col.urlLink;
            column.useDefaultObjectFields = col.useDefaultObjectFields;
            column.fieldType = col.fieldType;
            column.dataType = col.dataType;
            column.format = col.format;
            column.displayOrder = col.displayOrder;
            this.columns.push(column);
          });

          // The state has already been applied before the column order was
          // overriden by the loop assignment above - need to resort
          this.columns.sort((n1, n2) => n1.visibleIndex - n2.visibleIndex);

          //This is used for the range date filter
          UtilitiesService.gridColumns = this.columns;

          this.filterFields = this.columns.slice();

          this.filterFields.sort((a, b) => {
            return a.displayOrder - b.displayOrder;
          });

          sessionStorage.setItem(
            SessionVariables.DisplayOrderFilterFields,
            JSON.stringify(this.filterFields)
          );

          this.lastGridDataRequest = {
            listPageId:
              this.currentListView.listViewType === ListViewType.CoStar
                ? this.currentListView.id
                : this.currentListView.listPageId,
            userViewId:
              this.currentListView.listViewType === ListViewType.User
                ? this.currentListView.id
                : null,
            masterGroupId: this.currentPortfolio?.masterGroupId ?? null,
            gridStateOverride: this.currentListView.view,
            tempArchiveToggleValue: this.getArchiveToggleValue(),
            oid: this.urlOID,
          };

          this.service
            .getGridData(this.lastGridDataRequest)
            .subscribe((res) => {
              this.gridData = res.data;

              if (this.isGLEvent) {
                this.checkExpRevOptions();
                if (this.unModifiedEditPages || this.editPages) {
                  this.setEditPagesForLeasePayments();
                }
                this.getLeaseInfo(this.urlOID);
                if (this.gridData.length) {
                  this.chargesOnLease = true;
                }
                this.groupTaxableChargesTogether();
              }

              setTimeout(() => {
                //Only visible grid columns and columns in an active filter will show in filter dialog
                this.filterFields = this.filterFields.filter(
                  (x: any) =>
                    x.dataField !== 'CustomAction' &&
                    (x.visible === true || x.isInFilter === true)
                );
                this.filterValue = viewDataObject.filterValue;

                this.includedDataFieldsFromLastGridReload = listViewColumns
                  .filter((x: { visible: boolean }) => x.visible)
                  .map((x: { dataField: string }) => x.dataField);

                this.isExpanded
                  ? this.dataGrid.instance.expandAll()
                  : this.dataGrid.instance.collapseAll();

                if (useSessionState) {
                  this.toggleListMap(
                    this.safeGetFromSession(
                      SessionVariables.ListPageViewMode
                    ) as ListPageViewMode,
                    false
                  );

                  this.unmodifiedOriginalListView ??
                    this.setUnmodifiedOriginalListView();
                } else {
                  this.setUnmodifiedOriginalListView();
                }
              }, 300);

              this.inDisabledUIState = false;
              this.dataGrid.instance.endCustomLoading();
              this.isViewChanged = false;
              this.isInitialLoad = false;
            });
        });
    } catch (exception) {
      // This is bad but feel better with it here
      console.log(exception);
      this.enterCriticalGridLoadErrorState(
        'There was an error retrieving the data for this list view.'
      );
    }
  }

  private parseIsoDateStrToDate(key, value) {
    var isoDateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?Z$/;
    if (typeof value === 'string' && isoDateFormat.test(value)) {
      return new Date(value);
    }
    return value;
  }

  private enterCriticalGridLoadErrorState(erroMessage: string) {
    this.dataGrid.instance.endCustomLoading();
    //inDisabledUIState shuts down the UI except for the view chooser
    //It is reset to false each time a grid data load is attempted.
    //If that load fails, theis function is called.
    this.gridData = [];
    this.inCriticalViewDataError = true;
    this.inDisabledUIState = true;
    this.showErrorPopup(erroMessage);
  }

  private groupTaxableChargesTogether() {
    let taxCharges = this.gridData.filter(
      (gdi) => gdi.TaxableGLEventID !== null
    );
    let newGridData = this.gridData.filter(
      (gdi) => gdi.TaxableGLEventID === null
    );
    taxCharges.forEach((tcgdi) => {
      let insertIndex =
        newGridData.findIndex(
          (ngdi) => ngdi.GLEventID === tcgdi.TaxableGLEventID
        ) + 1;
      newGridData.splice(insertIndex, 0, tcgdi);
    });

    this.gridData = newGridData;
  }

  private populateListViewMenu(
    refreshGrid: boolean,
    useSessionState: boolean,
    overrideDefaultListPage: boolean = false
  ) {
    const request: GetViewDropdownDataRequest = {
      objectTypeId: this.objectTypeId,
      isSuperUser: this._isSuperUser,
    };

    this.service.getListViewSelectorItems(request).subscribe((result) => {
      this.listViews = result.data;
      if (
        this.listViews &&
        Object.keys(this.listViews).length &&
        Object.values(this.listViews).some((x) => x.length)
      ) {
      } else {
        this.dataGrid.instance.endCustomLoading();
        this.noDataText =
          'This page could not load due to a missing object.  Please contact support.';
        console.log(
          `The response from ListViewSelectorItems API is either Empty or Invalid.`
        );
        return;
      }

      this.activeListViewCount =
        this.listViews.coStarListViews.length +
        this.listViews.myListViews.length +
        this.listViews.sharedListViews.length;

      if (this.showPortfolioPicker) {
        this.service.getPortfolios().subscribe((result) => {
          if (
            result.data &&
            result.data.portfolios &&
            result.data.portfolios.length
          ) {
            this.portfolios = result.data.portfolios;
          }
          this.configCurrentListView(
            refreshGrid,
            useSessionState,
            overrideDefaultListPage
          );
        });
      } else {
        this.configCurrentListView(
          refreshGrid,
          useSessionState,
          overrideDefaultListPage
        );
      }
    });
  }

  private createInvalidListView(): ListView {
    return {
      id: -1,
      listViewType: -1,
      objectTypeId: -1,
      listPageId: -1,
      name: 'Empty ListView',
      view: 'Invalid View',
      archiveToggleValue: -1,
      isExpandAllSelected: false,
      relationshipDefinitionId: null,
      masterGroupId: -1,
    };
  }

  adaAttr(e: any) {
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

  onKeyUpEvent(event) {
    const targetElement = event.target as HTMLElement;
    if (targetElement.nodeName.toLowerCase() == 'input') {
      targetElement.setAttribute(
        'aria-label',
        'Search Filter For - ' + event.target.value + ' applied'
      );
    }
  }

  adaAttrNoDataGrid(e: any) {
    // Select the header row elements
    const dxGridwithTables = e.component
      .$element()
      .find(
        '.dx-datagrid-scrollable-simulated.dx-datagrid-content.dx-datagrid-scroll-container'
      );

    // Function to set role attribute
    if (dxGridwithTables && dxGridwithTables.length > 0) {
      dxGridwithTables.each((index: number, element: any) => {
        if (element) {
          element.setAttribute('role', 'grid');
        }
      });
    }
  }

  openNotesModal(objectId, objectTypeId) {
    const dataForNote = {
      objectId: objectId,
      objectTypeId: objectTypeId,
    };

    const dialogRef = this.dialog.open(AddNoteComponent, {
      height: 'auto',
      width: '30vw',
      minHeight: '70vh',
      minWidth: '25vw',
      panelClass: 'addNoteDialog',
      data: dataForNote,
    });

    dialogRef.afterClosed().subscribe((results) => {
      if (results.saveSuccessful) {
        this.populateGrid(true);
      } else {
        return;
      }
    });
  }
}
