import { CommonModule, Location } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
  QueryList,
  ViewChild,
  ViewChildren,
  ChangeDetectorRef,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SearchModule } from '@mango/ui-shared/cosmos';
import {
  ButtonModule,
  CremToastService,
  DropdownModule,
  LibUiElementsModule,
  LoaderModule,
  ModalModule,
  PageHeaderComponent,
  ToastComponent,
} from '@mango/ui-shared/lib-ui-elements';
import {
  DxDataGridComponent,
  DxDataGridModule,
  DxLoadPanelModule,
} from 'devextreme-angular';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  Subscription,
  combineLatest,
  of,
} from 'rxjs';
import {
  catchError,
  debounceTime,
  filter,
  finalize,
  map,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';

import { DynamicFormsFacade } from '@forms/+state/dynamic-forms.facade';
import { AmIVisibleDirective } from '@forms/am-ivisible.directive';
import {
  AllowedObjectTypes,
  ISection,
  RenderFormItemDetails,
  SaveRenderFormCommand,
  SaveRenderFormDto,
} from '@forms/model/dynamic-forms.interface';
import { DynamicFormsService } from '@forms/services/dynamic-forms.service';
import {
  IChangeLossPreventedComponent,
  MangoDialogService,
} from '@mango/core-shared';
import {
  BreadCrumb,
  ComposeEmailCommand,
  ContactRecord,
  EmailNoteType,
  ObjectType,
  Pill,
  ProjectsEmailInfo,
  RenderFormHeaderData,
  SharedLeftNavLink,
  StatusPill,
  ToastState,
} from '@mango/data-models/lib-data-models';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { environment } from '@mangoSpa/src/environments/environment.local';
import { DynamicFormSectionComponent } from './dynamic-form-sections/dynamic-form-section.component';
import { ListPageService } from '@list-pages/components/listpage/core/services/listpage.service';
import { CopyLeaseComponent } from '@forms/admin-render-forms/dynamic-form/dynamic-form-actions/copy-lease/copy-lease.component';
import { HttpResponse } from '@angular/common/http';
import { GlobalSessionService } from '@mangoSpa/src/app/services/global-session.service';
import { DynamicFormAssociateComponent } from './dynamic-form-actions/dynamic-form-associate/dynamic-form-associate.component';
import { ComposeEmailComponent } from '@mango/ui-shared/lib-ui-shared';
import { DashboardService } from '@project-dashboard/services/dashboard.service';
import { DynamicFormAddBookmarkComponent } from './dynamic-form-actions/dynamic-form-add-bookmark/dynamic-form-add-bookmark.component';
import { Title } from '@angular/platform-browser';
import { ArchiveCompanyAndContactComponent } from './dynamic-form-actions/archive/archive-company-and-contact/archive-company-and-contact.component';
import { DynamicFormLeaseVerificationComponent } from './dynamic-form-actions/dynamic-form-lease-verification/dynamic-form-lease-verification.component';
import { ArchiveLeaseComponent } from './dynamic-form-actions/archive/archive-lease/archive-lease.component';
import { FilesService } from '../../../../../../apps/mango-crem-features/object-actions/src/app/shared/services/files.service';
import { MangoNavigationService } from '@mangoSpa/src/app/services/navigation.service';
import { AssociateToProjectComponent } from './dynamic-form-actions/associate-project/associate-project.component';
import { LeaseAlertsModule } from '@micro-components/lease-alerts/lease-alerts.module';
import { AddContactModalComponent } from 'libs/ui-shared/lib-ui-shared/src/lib/add-contact-modal/add-contact-modal.component';
import { DxTooltipModule } from 'devextreme-angular';

@Component({
  selector: 'mango-dynamic-form',
  standalone: true,
  imports: [
    CommonModule,
    AmIVisibleDirective,
    DynamicFormSectionComponent,
    ReactiveFormsModule,
    LibUiElementsModule,
    SearchModule,
    ButtonModule,
    MatIconModule,
    DxDataGridModule,
    DxLoadPanelModule,
    ModalModule,
    MatMenuModule,
    MatButtonModule,
    FontAwesomeModule,
    MatDialogModule,
    LoaderModule,
    DropdownModule,
    LeaseAlertsModule,
    ToastComponent,
    PageHeaderComponent,
    DxTooltipModule,
  ],
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss'],
  providers: [ListPageService],
})
export class DynamicFormComponent
  implements OnInit, OnDestroy, IChangeLossPreventedComponent
{
  private readonly subs = new Subscription();
  private readonly SECTIONS_INITIAL_LOAD_COUNT = 6;

  @ViewChild('availableSectionsGrid')
  availableSectionsGrid: DxDataGridComponent;
  @ViewChild('dynamicFormContent') dynamicFormContent: ElementRef;
  @ViewChildren(DynamicFormSectionComponent)
  childForms: QueryList<DynamicFormSectionComponent>;
  @ViewChild(DynamicFormSectionComponent)
  dynamicFormSectionComponent!: DynamicFormSectionComponent;

  form: FormGroup;
  sectionsVisible: ISection[] = [];
  lastVisibleIndex = 0;
  externalCremLink: string;
  renderFormError: boolean = false;

  // State flags
  isLoading = false;
  isActionLoading = false;
  actionButtonText: string;
  errorLoading = false;
  isRenderForm = false;
  editMode = false;
  hasParentObjectLinker = false;
  isAddingSection = false;
  isToastVisible = false;
  disableSaveAndApply = false;
  reload: boolean = false;
  expandAll = true as boolean;
  showCannotLoadForm = true;
  companyModuleUser = { hasAddRights: false };
  contactModuleUser = { hasAddRights: false };
  isLeaseLocked = false;

  // Form data
  userMessage = '';
  formId?: number;
  objectId: number;
  objectTypeId: number;
  objectTypeTypeId: number;
  groupId: number;
  relationshipDefinitionId: number;
  parentObjectId: number;
  parentObjectTypeId: number;
  relatedObjectId: number;
  relatedObjectTypeId: number;
  sectionIdToBeAdded = 0;
  toastMessageHeader = '';
  toastState: ToastState;
  statusPillInfo: StatusPill;

  private currentUserInfo$: Observable<ContactRecord>;
  isSuperUser: boolean = false;
  tabTitle: string;
  pageTitle: string;
  objectName: string = '';
  displayString: string;

  allFormItemsKeys: RenderFormItemDetails[] = [];
  changedFormItemKeys: SaveRenderFormDto[] = [];
  invalidControls: any[];
  invalidNotify: string =
    'There are fields that are either required or incorrectly formatted. Please update and try again. \n\n';

  readonly selectFormActions$ = this.dynamicFormsFacade.selectedFormActions$;
  readonly selectAvailableFormSections$ =
    this.dynamicFormsFacade.selectAvailableFormSections$;
  readonly selectFormSections$ = this.dynamicFormsFacade.selectFormSections$;
  readonly selectFormName$ = this.dynamicFormsFacade.selectFormName$;
  readonly breadcrumbs$ = this.mangoAppFacade.breadcrumbs$;
  readonly dropdownFormActions$ = this.returnActionsDropdown();
  readonly buttonFormActions$ = this.returnActionsButtons();
  readonly loadingRenderFormError$ = this.dynamicFormsFacade.renderFormError$;

  public googleMapAPIKey: any;
  public googleMappingChannel: any;
  public tempMapLoadFlag: boolean = false;
  public canLoadMap: boolean = false;

  public formTitle: string = '';
  hidePremise: boolean = false;

  public defaultNoteType: EmailNoteType = <EmailNoteType>{};
  isComposeEmailOpen: boolean = false;
  formsEmailInfo: ProjectsEmailInfo = <ProjectsEmailInfo>{};
  emailNote: string = `By including the unapproved tasks, each user will receive an individual email, 
  otherwise everyone will be Carbon Copied.`;
  includeFilesText: string = `If File Paths is checked, selected file(s) will be included as path 
  to the application rather than an attachment(s)`;
  allowedObjectTypes = Object.values(AllowedObjectTypes);
  funcLoadAllSectionsForScroll: any = this.loadAllSectionsForScroll;
  formItmToHide: any[] = [];
  reloadSections: boolean = false;
  updatedSection: any;

  formDataObjectId: number;
  formDataObjectTypeId: number;

  constructor(
    private location: Location,
    private fb: FormBuilder,
    private dynamicFormsFacade: DynamicFormsFacade,
    private mangoAppFacade: MangoAppFacade,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: MangoDialogService,
    private dialog: MatDialog,
    private listpageService: ListPageService,
    private renderer2: Renderer2,
    private dynamicFormsService: DynamicFormsService,
    private dashboardService: DashboardService,
    private toastService: CremToastService,
    private titleService: Title,
    private fileService: FilesService,
    private navService: MangoNavigationService,
    private ref: ChangeDetectorRef
  ) {}

  tryPreventChangeLoss(): Observable<boolean> {
    return this.changedFormItemKeys.length
      ? this.handleChangeLossPrevention()
      : of(true);
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupInitialState();
    this.statusPillInfo = this.getStatus();

    this.checkAddRights(ObjectType.COMPANY, this.companyModuleUser);
    this.checkAddRights(ObjectType.CONTACT, this.contactModuleUser);

    this.currentUserInfo$ = this.mangoAppFacade.contactRecord$;
    this.subs.add(
      this.currentUserInfo$.subscribe((contact) => {
        this.isSuperUser =
          contact.userRoleName.toLowerCase().trim() == 'superuser'
            ? true
            : false;
      })
    );

    this.fileService
      .getObjectName(this.objectId, this.objectTypeId)
      .subscribe((res) => {
        if (res.success) {
          this.objectName = res.data[0].objectType.trim() + ': ';
          this.displayString = res.data[0].displayString;
          if (this.displayString)
            this.displayString = this.displayString.replace(
              /<\/?[^>]+(>|$)/g,
              ''
            );
        }
      });

    this.configGoogleMapKey();

    this.subs.add(
      this.dashboardService.getClientPreference('HidePremise').subscribe(
        (res: any) => {
          if (res && res.success && res.data) {
            this.hidePremise = res.data == '1' ? true : false;
          } else {
            this.notifyErrorMessage(
              'There was an issue loading details. Please review and try again.'
            );
          }
        },
        (error: any) => {
          this.notifyErrorMessage(
            'There was an error loading details. Please review and try again.'
          );
        }
      )
    );

    this.form.valueChanges
      .pipe(
        debounceTime(300),
        tap((changes) => {
          if (!this.editMode) {
            this.form.markAsPristine();
            this.form.markAsUntouched();
          } else {
            this.findChangedControl(this.form, changes);
          }
        })
      )
      .subscribe();

    this.subs.add(
      this.loadingRenderFormError$
        .pipe(
          switchMap((error) => {
            if (error) {
              this.showCannotLoadForm = true;
              this.errorLoading = true;
              this.isLoading = false;
              this.renderFormError =
                error.name && error.name == 'getRenderForm' ? true : false;
              this.userMessage = error.message ? error.message : error;
            }
            return EMPTY;
          })
        )
        .subscribe()
    );
  }

  checkAddRights(module: any, _moduleUser: any): void {
    if (this.isSuperUser) _moduleUser.hasAddRights = true;
    else
      this.listpageService
        .getUserModuleRights(module.toString())
        .subscribe((result) => {
          let rights = result.data.filter((r: any) => r.hasAddRights);
          _moduleUser.hasAddRights =
            rights.length > 0 ? rights[0]['hasAddRights'] : false;
        });
  }

  findChangedControl(formGroup: FormGroup, changes: any) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.findChangedControl(control, changes[key]); // Recursive call for nested form groups
      } else if (control instanceof FormControl) {
        if (control.dirty) {
          this.getChangedFormItems(key, control.value);
          control.markAsPristine(); //prevent changes from being detected while others controls are being updated
        }
      }
    });
  }

  private transformDataForSaveApi(
    formItemData: any,
    value: any,
    clauseDetailField: string,
    changeClauseValue: boolean = true
  ) {
    ///convert the form item answer to a string for saving
    if (
      ['4'].some((typeId) => formItemData.formItemTypeId === typeId) &&
      typeof value === 'boolean'
    ) {
      let returnValue = value ? 'Yes' : 'No';
      return returnValue;
    }

    if (
      ['10'].some((typeId) => formItemData.formItemTypeId === typeId) &&
      changeClauseValue
    ) {
      //If formItemTypeId is 10 and clauseDetail is null, the description field needs to be updated
      clauseDetailField = clauseDetailField ?? 'ClauseText';
      let returnValue = formItemData.hasOwnProperty('newValue')
        ? formItemData.newValue
        : JSON.parse(JSON.stringify(formItemData.oldValue));

      returnValue[clauseDetailField] =
        clauseDetailField === 'Date' ? value.toLocaleString('en-US') : value;

      //Use this to keep track of the clause items that are changed
      formItemData.oldValue['ClauseChanged'] = true;

      return returnValue;
    }

    return value;
  }

  async getChangedFormItems(key, value) {
    let clauseDetailField: any = null;
    let keyStr = key.toString();

    if (keyStr.includes('_')) {
      let keyStrParts = keyStr.split('_');
      key = keyStrParts[0];
      clauseDetailField = keyStrParts[1];
    }

    let item: any = this.changedFormItemKeys.find(
      (formItem) => formItem.formItemId == key
    );
    if (item) {
      item.newValue = this.transformDataForSaveApi(
        item,
        value,
        clauseDetailField
      );
    } else {
      let formItem = this.allFormItemsKeys.find(
        (formItem) => formItem.formItemId == key
      );
      let changedItem = {
        formItemId: formItem.formItemId,
        formItemTypeId: formItem.formItemTypeId,
        oldValue: this.transformDataForSaveApi(
          formItem,
          formItem.oldValue,
          clauseDetailField,
          false
        ),
        newValue: this.transformDataForSaveApi(
          formItem,
          value,
          clauseDetailField
        ),
        type: formItem.type,
      };
      this.changedFormItemKeys.push(changedItem);
    }
    let updateSections = false;
    for (let index = 0; index < this.changedFormItemKeys.length; index++) {
      let formItemName = this.allFormItemsKeys.find(
        (formItm) =>
          formItm.formItemId === this.changedFormItemKeys[index].formItemId
      ).labelName;
      if (
        formItemName === 'Is Vendor' ||
        formItemName === 'Is Customer' ||
        formItemName == 'Subscribe to Reminders'
      ) {
        updateSections = true;
        break;
      }
    }
    if (updateSections) {
      await this.loadUpdatedSections();
      this.dynamicFormsFacade.loadFormSections(
        this.formId,
        this.groupId,
        this.objectId
      );

      var allSections = this.updatedSection?.data
        ? this.updatedSection?.data
        : [];

      for (let index = 0; index < this.changedFormItemKeys.length; index++) {
        const element = this.changedFormItemKeys[index];
        if (element.formItemId != null) {
          let sectionExistLst = allSections.filter(
            (s) => s.formInputId1 == element.formItemId
          );

          if (sectionExistLst && sectionExistLst.length > 0) {
            sectionExistLst.forEach((section) => {
              let sectionToUpdate = allSections.find(
                (s) => s.formSectionID == section.formSectionID
              );
              if (sectionToUpdate)
                sectionToUpdate.sectionVisibility =
                  element.newValue == '1'
                    ? true
                    : element.newValue == '0'
                    ? false
                    : false;
            });
          }
        }
      }
      this.sectionsVisible = allSections.filter(
        (s) => s.sectionVisibility == true || s.sectionVisibility == null
      );
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      formName: [''],
      objectType: [''],
    });
  }

  private setupInitialState(): void {
    this.isLoading = true;
    this.showOldDynamicFormLink();
    this.handleRouting();
    this.registerFormSaving();
  }

  private handleRouting(): void {
    this.handleNavigationEvents();
    this.handleRouteParams();
  }

  private handleNavigationEvents(): void {
    this.subs.add(
      this.router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          map(() => {
            let route = this.router.routerState.root;
            while (route.firstChild) route = route.firstChild;
            return route;
          }),
          filter((route) => route.outlet === 'primary'),
          map((route) =>
            route.snapshot.url.map((segment) => segment.path).join('/')
          ),
          filter((url) => url.includes('render-form'))
        )
        .subscribe(() => window.location.reload())
    );
  }

  private handleRouteParams(): void {
    this.subs.add(
      this.route.params.subscribe(() => {
        const segments = this.route.snapshot.url;
        this.isRenderForm = segments.some(
          (segment) => segment.path === 'render-form'
        );

        const queryParams = this.toLowerParams(this.route.snapshot.queryParams);
        this.setQueryParams(queryParams);

        this.load();
      })
    );
  }

  private setQueryParams(params: Params): void {
    this.objectId = Number(this.removeEndingQueryString(params['oid']));
    this.objectTypeId = Number(this.removeEndingQueryString(params['otid']));
    this.objectTypeTypeId = Number(
      this.removeEndingQueryString(params['ottid'])
    );
    this.formId = Number(this.removeEndingQueryString(params['fid']));
    this.groupId =
      !params['ffsgid'] ||
      params['ffsgid'].toLowerCase() === 'undefined' ||
      params['ffsgid'].toLowerCase() === 'null'
        ? 0
        : Number(this.removeEndingQueryString(params['ffsgid']));

    this.relationshipDefinitionId =
      !params['rdid'] ||
      params['rdid'].toLowerCase() === 'undefined' ||
      params['rdid'].toLowerCase() === 'null'
        ? 0
        : Number(this.removeEndingQueryString(params['rdid']));

    this.parentObjectId =
      !params['poid'] ||
      params['poid'].toLowerCase() === 'undefined' ||
      params['poid'].toLowerCase() === 'null'
        ? 0
        : Number(this.removeEndingQueryString(params['poid']));

    this.parentObjectTypeId =
      !params['potid'] ||
      params['potid'].toLowerCase() === 'undefined' ||
      params['potid'].toLowerCase() === 'null'
        ? 0
        : Number(this.removeEndingQueryString(params['potid']));

    this.relatedObjectId =
      !params['roid'] ||
      params['roid'].toLowerCase() === 'undefined' ||
      params['roid'].toLowerCase() === 'null'
        ? 0
        : Number(this.removeEndingQueryString(params['roid']));

    this.relatedObjectTypeId =
      !params['rotid'] ||
      params['rotid'].toLowerCase() === 'undefined' ||
      params['rotid'].toLowerCase() === 'null'
        ? 0
        : Number(this.removeEndingQueryString(params['rotid']));
  }

  private removeEndingQueryString(value: string) {
    const questionMarkIndex = !!value ? value.indexOf('?') : -1;
    if (questionMarkIndex < 0) return value;

    const returnValue = value.substring(0, questionMarkIndex);

    return returnValue;
  }

  private load(): void {
    if (!this.formId) return;
    this.allFormItemsKeys = [];
    this.dynamicFormsFacade.loadDynamicForm(
      this.formId,
      this.objectId,
      this.objectTypeId,
      this.objectTypeTypeId,
      this.relationshipDefinitionId,
      this.parentObjectId,
      this.relatedObjectId,
      this.relatedObjectTypeId
    );
    this.handleDynamicFormResponse();
  }

  private handleDynamicFormResponse(): void {
    this.subs.add(
      this.dynamicFormsFacade.selectDynamicFormApiResponse$
        .pipe(
          filter((res) => res.dynamicFormApiResponse !== null),
          take(1),
          switchMap(({ dynamicFormApiResponse }) => {
            if (!dynamicFormApiResponse.success) {
              return this.handleError(dynamicFormApiResponse);
            }
            return this.handleSuccess(dynamicFormApiResponse.data);
          }),
          catchError((error) => this.handleLoadError(error)),
          finalize(() => {
            this.isLoading = false;
            this.form.markAsPristine();
            this.form.markAsUntouched();
          })
        )
        .subscribe()
    );
  }

  private returnActionsDropdown(): Observable<any> {
    return this.selectFormActions$.pipe(
      map((formAction) => {
        if (!!formAction) {
          let filteredFormActions = formAction.filter(
            (fa) => fa.formActionGroup === 'sActionMenu'
          );
          return filteredFormActions;
        }

        return formAction;
      })
    );
  }

  private returnActionsButtons(): Observable<any> {
    return this.selectFormActions$.pipe(
      map((formAction) => {
        if (!!formAction) {
          let filteredFormActions = formAction.filter(
            (fa) => fa.formActionGroup === 'sButtons'
          );
          let buttonsDataList = [];
          filteredFormActions.forEach((ffa) => {
            let buttonColor =
              ffa.formActionLabel === 'Save' ? 'primary' : 'secondary';

            buttonsDataList.push({
              id: `dynamic_button_${ffa.formActionLabel}_id`,
              text: ffa.formActionLabel,
              color: buttonColor,
            });
          });

          return buttonsDataList;
        }

        return [];
      })
    );
  }

  showPropertyHeaderAndUpdateBreadcrumbName(): void {
    const formNameSubject = new BehaviorSubject<string | null>(null);

    const selectFormNameSubscription = this.dynamicFormsFacade.selectFormName$
      .pipe(filter((formData) => formData !== null))
      .subscribe((formName) => {
        formNameSubject.next(formName);
        this.tabTitle = this.getTabTitle();
        this.pageTitle = this.getPageTitle();
        const renderFormHeaderData = new RenderFormHeaderData(true, {
          formName,
          objectTypeId: this.objectTypeId,
        });
        window.dispatchEvent(
          new CustomEvent('RenderFormShowPropertyHeader', {
            detail: renderFormHeaderData,
          })
        );
      });

    // const combinedSubscription = combineLatest([
    //   formNameSubject,
    //   this.mangoAppFacade.breadcrumbs$.pipe(take(1)),
    // ]).subscribe(([formName, breadCrumbs]: [string | null, BreadCrumb[]]) => {
    //   if (breadCrumbs?.length && formName) {
    //     //this.updateBreadcrumbs(breadCrumbs, formName);
    //   }
    // });

    this.subs.add(selectFormNameSubscription);
    //this.subs.add(combinedSubscription);
  }

  private updateBreadcrumbs(breadCrumbs: BreadCrumb[], formName: string): void {
    let updatedBreadcrumbs = breadCrumbs.map((crumb) =>
      crumb.url === '/crem/forms/render-form'
        ? { ...crumb, label: formName }
        : crumb
    );

    if (breadCrumbs.length === 1) {
      const initialBreadCrumbs = this.populateInitialBreadCrumbs();
      updatedBreadcrumbs.unshift(...initialBreadCrumbs);
    }

    this.mangoAppFacade.setBreadcrumbs(updatedBreadcrumbs);
    GlobalSessionService.setBreadcrumbsCookieProperty(updatedBreadcrumbs);
  }

  // If the user manually navigates to the render form page,
  // they will only have the one render form breadcrumb.
  // This function builds the breadcrumb hierarchy for the render form page
  populateInitialBreadCrumbs(): BreadCrumb[] {
    const breadcrumbMap: { [key: number]: BreadCrumb[] } = {
      1: [
        this.createDefaultBreadCrumb(
          'Projects',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'projects'])
          ),
          'Projects'
        ),
        this.createDefaultBreadCrumb(
          'Tasks',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'projects', 'tasks'])
          ),
          'Tasks'
        ),
      ],
      3: [
        this.createDefaultBreadCrumb(
          'Portfolio',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'portfolio'])
          ),
          'Portfolio'
        ),
        this.createDefaultBreadCrumb(
          'Buildings',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'portfolio', 'buildings'])
          ),
          'Building'
        ),
      ],
      4: [
        this.createDefaultBreadCrumb(
          'Portfolio',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'portfolio'])
          ),
          'Portfolio'
        ),
        this.createDefaultBreadCrumb(
          'Leases',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'portfolio', 'leases'])
          ),
          'Abstract'
        ),
      ],
      5: [
        this.createDefaultBreadCrumb(
          'Contacts',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'contacts'])
          ),
          'Contacts'
        ),
        this.createDefaultBreadCrumb(
          'Contacts',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'contacts', 'contacts-list'])
          ),
          'Contacts'
        ),
      ],
    };

    return (
      breadcrumbMap[this.objectTypeId] || [
        this.createDefaultBreadCrumb('', '', ''),
      ]
    );
  }

  private createDefaultBreadCrumb(
    label: string,
    url: string,
    activeLink: string
  ): BreadCrumb {
    return { label, url, activeLink };
  }

  toggleEditViewMode() {
    this.editMode = !this.editMode;
  }

  getMoreSections(visible: boolean, sectionId: number): void {
    if (
      !this.isRenderForm ||
      !visible ||
      sectionId !== this.sectionsVisible.length
    ) {
      return;
    }

    this.subs.add(
      this.selectFormSections$
        .pipe(
          filter((sections) => sections !== null),
          take(1)
        )
        .subscribe((sections) => {
          this.setSectionsVisibility(sections);
          this.loadMoreSections(sections);
        })
    );
  }

  setSectionsVisibility(sections: any[]) {
    if (sections != null && sections.length > 0) {
      this.formItmToHide = sections.filter(
        (s) => s.sectionVisibility === false || s.sectionVisibility === true
      );
      let sectionsToSplice = sections.filter(
        (s) => s.sectionVisibility === false
      );
      for (let index = 0; index < sectionsToSplice.length; index++) {
        let sectionIndex = sections.findIndex(
          (s) => s.formSectionID === sectionsToSplice[index].formSectionID
        );
        if (sectionIndex > -1) {
          sections.splice(sectionIndex, 1);
        }
      }
    }
  }

  loadAllSectionsForScroll(navLink: SharedLeftNavLink): Observable<any> {
    let elementId = navLink.linkUrl.replace('#', '');
    let element = document.getElementById(elementId);

    if (!!element) {
      return of(false);
    } else {
      return this.getAllSections();
    }
  }

  private getAllSections(): Observable<boolean> {
    return this.selectFormSections$.pipe(
      filter((sections) => sections !== null),
      take(1),
      map((sections) => {
        let moreSectionsLoaded = false;
        if (!!sections) {
          let sectionElementsCount = document.querySelectorAll(
            "[id^='dynamic-form_section']"
          ).length;
          while (sectionElementsCount < sections.length) {
            moreSectionsLoaded = true;
            this.loadMoreSections(sections);
            sectionElementsCount += 6; //Number of sections loaded per call to loadMoreSections
          }

          return moreSectionsLoaded;
        } else {
          return false;
        }
      })
    );
  }

  loadNextSections() {
    let getAllSectionsObservable = this.getAllSections();
    this.subs.add(
      getAllSectionsObservable.subscribe((sectionsLoaded) => {
        if (sectionsLoaded) {
          this.ref.detectChanges();
        }
      })
    );
  }

  handleHasParentObjectLinkerChange(value: boolean): void {
    if (!this.hasParentObjectLinker) {
      this.hasParentObjectLinker = value;
      this.dynamicFormsFacade.loadParentLink(
        this.formDataObjectId ?? this.objectId,
        this.formDataObjectTypeId ?? this.objectTypeId
      );
    }
  }

  designModeClicked(): void {
    this.router.navigate(['/crem/forms/admin-forms/dynamic-form'], {
      relativeTo: this.route,
      queryParams: { FID: this.formId },
      queryParamsHandling: 'merge',
    });
  }

  scrollToTop(): void {
    document
      .getElementById('scroll-to-top-div')
      ?.scrollIntoView({ behavior: 'smooth' });
  }

  close(): void {
    this.location.back();
  }

  getTabTitle(): string {
    if (!this.isRenderForm) {
      const objectType = this.form?.get('objectType').value?.toUpperCase();
      const titleMap: { [key: string]: string } = {
        LEASE: 'Lease Abstract',
        BUILDING: 'Building Details',
        CONTACT: 'Contact Details',
      };
      return titleMap[objectType] || 'Default Content';
    }

    return this.objectName;
  }

  getPageTitle(): string {
    let pageTitle = '';
    this.selectFormName$.pipe(take(1)).subscribe((res) => (pageTitle = res));
    this.formTitle = pageTitle;
    this.titleService.setTitle(pageTitle);
    return this.displayString ? this.displayString : pageTitle;
  }

  getStatus(): StatusPill {
    let statusPill = {} as StatusPill;

    this.subs.add(
      this.dynamicFormsService
        .getLockingInfo(this.objectId, this.objectTypeId)
        .subscribe((res) => {
          if (res != null && res.success && res.data != null) {
            this.isLeaseLocked = res?.data?.isLocked ?? false;
            if (!res.data.leaseActive) {
              statusPill.text = 'Archived';
              statusPill.type = Pill.BASIC;
              statusPill.displayLockIcon = true;
            } else if (res.data.isLocked) {
              statusPill.text = 'Locked';
              statusPill.type = Pill.BASIC;
              statusPill.titleOnHover = '';
              statusPill.lockedMessage =
                res.data.lockedReason +
                '<br><br>' +
                '<i>Locked records cannot be edited. Records will be unlocked when the batch has completed processing or has been canceled.</i>';
              statusPill.displayLockIcon = true;
            }
          }
        })
    );

    return statusPill;
  }

  trackBySection(_: number, section: ISection): number {
    return section.formSectionID;
  }

  searchAvailableSectionsDataGrid(searchText: string): void {
    this.availableSectionsGrid.instance.searchByText(searchText);
  }

  onActionButtonClick(buttonLabel: string) {
    this.actionButtonText = buttonLabel;
    switch (buttonLabel.toLowerCase()) {
      case 'edit': {
        this.editMode = true;
        this.changedFormItemKeys = [];
        this.dynamicFormsFacade.loadFormActions(
          this.formId,
          this.objectId,
          this.objectTypeId,
          this.objectTypeTypeId,
          this.relationshipDefinitionId,
          this.parentObjectId,
          this.parentObjectTypeId,
          this.editMode
        );
        break;
      }
      case 'compose email': {
        this.openEmailTemplate();
        break;
      }
      case 'save': {
        if (!this.disableSaveAndApply) {
          this.disableSaveAndApply = true;
          this.validateAndSaveForm('save');
        }
        break;
      }
      case 'apply': {
        if (!this.disableSaveAndApply) {
          this.disableSaveAndApply = true;
          this.validateAndSaveForm('apply');
        }
        break;
      }
      case 'cancel': {
        this.editMode = false;
        this.cancelExistingChanges();
        this.dynamicFormsFacade.loadFormActions(
          this.formId,
          this.objectId,
          this.objectTypeId,
          this.objectTypeTypeId,
          this.relationshipDefinitionId,
          this.parentObjectId,
          this.parentObjectTypeId,
          this.editMode
        );
        break;
      }
      default: {
        break;
      }
    }
  }

  private removeClauseChangedField(value: any) {
    if (!!value && value.hasOwnProperty('ClauseChanged')) {
      delete value.ClauseChanged;
    }

    return value;
  }

  validateAndSaveForm(oper: string) {
    if (!this.form.valid) {
      this.invalidControls = [];
      this.getAllInvalidControls(this.form);
      let invalidFormItemLabels = this.invalidNotify;
      this.invalidControls.forEach((invControl) => {
        let controlName = invControl.name;
        let clauseDetailField: string = '';

        if (controlName.includes('_')) {
          let controlNameParts = controlName.split('_');
          controlName = controlNameParts[0];
          clauseDetailField = ' ' + controlNameParts[1];
        }

        const obj = this.allFormItemsKeys.find(
          (item) => item.formItemId == controlName
        );
        invalidFormItemLabels += obj.labelName + clauseDetailField + '\n';
      });
      this.disableSaveAndApply = false;
      this.dialogService.alert(
        'Invalid Form Items',
        invalidFormItemLabels,
        'OK'
      );
      return;
    } else if (!this.changedFormItemKeys.length) {
      this.disableSaveAndApply = false;
      this.editMode = oper.toLowerCase() === 'save' ? false : true;
      this.dynamicFormsFacade.loadFormActions(
        this.formId,
        this.objectId,
        this.objectTypeId,
        this.objectTypeTypeId,
        this.relationshipDefinitionId,
        this.parentObjectId,
        this.parentObjectTypeId,
        this.editMode
      );
      return;
    }

    let itemsToSave = JSON.parse(JSON.stringify(this.changedFormItemKeys));
    let saveFormData: SaveRenderFormCommand = {
      isDynamicPopup: false,
      formId: this.formId,
      objectId: this.objectId,
      objectTypeId: this.objectTypeId,
      objectTypeTypeId: null,
      relatedObjectId: null,
      relatedObjectTypeId: null,
      relationshipDefinitionId: null,
      formItems: [],
    };

    itemsToSave.forEach((changedControl) => {
      let item: SaveRenderFormDto = {
        formItemId: changedControl.formItemId,
        formItemTypeId: changedControl.formItemTypeId,
        oldValue:
          Array.isArray(changedControl.oldValue) ||
          typeof changedControl.oldValue === 'boolean'
            ? changedControl.oldValue.toString()
            : typeof changedControl.oldValue === 'object'
            ? JSON.stringify(
                this.removeClauseChangedField(changedControl.oldValue)
              )
            : changedControl.oldValue,
        newValue:
          Array.isArray(changedControl.newValue) ||
          typeof changedControl.newValue === 'boolean'
            ? changedControl.newValue.toString()
            : typeof changedControl.newValue === 'object'
            ? JSON.stringify(changedControl.newValue)
            : changedControl.newValue,
        type: changedControl.type,
      };
      saveFormData.formItems.push(item);
    });

    saveFormData.formItems = saveFormData.formItems.filter(
      (item) => item.oldValue !== item.newValue
    );
    if (!saveFormData.formItems.length) {
      this.disableSaveAndApply = false;
      this.changedFormItemKeys = [];
      this.editMode = oper.toLowerCase() === 'save' ? false : true;
      !this.editMode &&
        this.dynamicFormsFacade.loadFormActions(
          this.formId,
          this.objectId,
          this.objectTypeId,
          this.objectTypeTypeId,
          this.relationshipDefinitionId,
          this.parentObjectId,
          this.parentObjectTypeId,
          this.editMode
        );
      return;
    }

    for (let index = 0; index < saveFormData.formItems.length; index++) {
      const formItmId = saveFormData.formItems[index].formItemId;
      let formItemName = this.allFormItemsKeys.find(
        (formItm) => formItm.formItemId === formItmId
      ).labelName;
      if (
        formItemName === 'Is Vendor' ||
        formItemName === 'Is Customer' ||
        formItemName == 'Subscribe to Reminders'
      ) {
        //reload the sections
        this.reloadSections = true;
        break;
      }
    }

    this.dynamicFormsFacade.saveRenderForm(saveFormData);
    this.handleSaveResponse(oper);
  }

  handleSaveResponse(oper) {
    let saveSubscription = this.dynamicFormsFacade.saveRenderFormResponse$
      .pipe(
        filter((response) => !!response.saveRenderFormResponse),
        map((response) => {
          saveSubscription.unsubscribe();
          if (
            response.saveRenderFormResponse &&
            response.saveRenderFormResponse.success
          ) {
            this.changedFormItemKeys = [];
            this.dynamicFormsFacade.clearDynamicFormsState();
            this.editMode = oper.toLowerCase() === 'save' ? false : true;
            this.reloadTheForm();
          } else {
            this.toastService.show(
              'The Form could not be saved. Please review and try again',
              'Error',
              ToastState.ERROR
            );
            this.dynamicFormsFacade.clearSaveFormState();
          }

          this.disableSaveAndApply = false;
        }),
        catchError((error) => {
          this.disableSaveAndApply = false;
          this.toastService.show(
            'Error Saving the Form. Please review and try again',
            'Error',
            ToastState.ERROR
          );
          this.dynamicFormsFacade.clearSaveFormState();
          return of(null);
        })
      )
      .subscribe(() => {
        saveSubscription?.unsubscribe();
      });
  }

  getAllInvalidControls(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.getAllInvalidControls(control);
      } else if (control instanceof FormControl) {
        if (control.invalid) {
          this.invalidControls.push({ control: control, name: key });
        }
      }
    });
  }

  reloadTheForm() {
    this.configGoogleMapKey();
    this.sectionsVisible = [];
    this.reloadComponent();
    this.setupInitialState();
    this.canLoadMap = false;
    this.canLoadMap = this.tempMapLoadFlag;
  }

  reloadComponent() {
    this.reload = true;
    setTimeout(() => (this.reload = false), 0);
  }

  cancelExistingChanges() {
    if (this.changedFormItemKeys.length) {
      this.changedFormItemKeys = [];
      this.dynamicFormsFacade.clearDynamicFormsState();
      this.reloadTheForm();
    }
  }

  getControl(form: FormGroup, key: string): AbstractControl | null {
    if (form.contains(key)) {
      return form.get(key);
    }
    for (const controlName in form.controls) {
      const control = form.get(controlName);
      if (control instanceof FormGroup) {
        const foundControl = this.getControl(control, key);
        if (foundControl) {
          return foundControl;
        }
      }
    }
    return null;
  }

  openEmailTemplate() {
    if (this.isComposeEmailOpen) return;
    this.isComposeEmailOpen = true;

    this.subs.add(
      this.dynamicFormsService
        .getComposeEmailInfo(this.objectId, this.objectTypeId)
        .subscribe((res: any) => {
          if (res && res.success) {
            this.formsEmailInfo = res.data;
            let obj = this.formsEmailInfo.noteTypes.find(
              (noteType) =>
                noteType.commonNoteType.toLocaleLowerCase().trim() == 'email'
            );
            this.defaultNoteType = obj ? obj : this.defaultNoteType;
            let dialogRef = this.dialog.open(ComposeEmailComponent, {
              width: '520px',
              height: '700px',
              panelClass: 'composeEmailModal',
              data: {
                objectId: this.objectId,
                objectTypeId: this.objectTypeId,
                contacts: this.formsEmailInfo.contacts,
                noteTypes: this.formsEmailInfo.noteTypes,
                fileItems: this.formsEmailInfo.fileItems,
                defaultNoteType: this.defaultNoteType,
                inclUnappdTsksSel: this.objectTypeId == 1 ? true : false,
                emailNote: this.objectTypeId == 1 ? this.emailNote : '',
                includeFileInfo: this.includeFilesText,
                emailSendHandler: this.sendEmail.bind(this),
              },
              disableClose: true,
            });
            this.subs.add(
              dialogRef.afterClosed().subscribe(() => {
                this.isComposeEmailOpen = false;
              })
            );
          } else {
            let message = `Forms Email Info could not be fetched.`;
            this.subs.add(
              this.dialogService
                .alert('Error getting Forms Email Info', message, 'OK')
                .subscribe()
            );
          }
        })
    );
  }

  sendEmail(data: ComposeEmailCommand) {
    return this.dashboardService.sendComposedEmail(data);
  }

  private loadMoreSections(sections: any[]): void {
    const currentLength = this.sectionsVisible.length;
    const endLimit = currentLength + this.SECTIONS_INITIAL_LOAD_COUNT;
    const endIndex = Math.min(endLimit, sections.length);

    const filteredSections = sections
      .slice(this.lastVisibleIndex, endIndex)
      .map((section, index) => ({
        ...section,
        id: currentLength + index + 1,
      }));

    this.sectionsVisible = [...this.sectionsVisible, ...filteredSections];
    this.lastVisibleIndex = endIndex;
  }

  private handleLoadError(error: any): Observable<null> {
    console.error('Error loading dynamic form:', error);
    this.showCannotLoadForm = true;
    this.errorLoading = true;
    this.userMessage = 'Error loading dynamic form';
    return of(null);
  }

  private handleSuccess(formData: any): Observable<null> {
    this.loadFormData(formData);
    return of(null);
  }

  private handleError(response: any): Observable<null> {
    this.showCannotLoadForm = true;
    this.errorLoading = true;
    if (response.statusCode === 403) {
      this.userMessage = response.clientErrorMessage;
    } else if (
      response.statusCode === 400 &&
      response.clientErrorMessage.toLowerCase() === 'no records found'
    ) {
      this.userMessage = response.clientErrorMessage;
      this.showCannotLoadForm = false;
    }

    return EMPTY;
  }

  private async loadFormData(formData: any): Promise<void> {
    if (this.reloadSections) await this.loadUpdatedSections();

    this.formDataObjectId = formData.objectId;
    this.formDataObjectTypeId = formData.objectTypeId;

    this.dynamicFormsFacade.loadFormSections(
      this.formId,
      this.groupId,
      this.objectId
    );
    this.handleFormSectionsLoad();
    this.dynamicFormsFacade.loadFormActions(
      this.formId,
      this.objectId,
      this.objectTypeId,
      this.objectTypeTypeId,
      this.relationshipDefinitionId,
      this.parentObjectId,
      this.parentObjectTypeId,
      this.editMode
    );

    if (!this.isRenderForm) {
      this.loadDesignModeData(formData);
    } else {
      this.loadRenderModeData(formData);
    }
  }

  async loadUpdatedSections() {
    {
      this.updatedSection = await this.dynamicFormsService
        .getFormSections(this.formId, this.groupId, this.objectId)
        .pipe(
          filter((sections) => sections !== null),
          take(1)
        )
        .toPromise();
    }
  }
  private loadDesignModeData(formData: any): void {
    this.dynamicFormsFacade.loadAvailableSections(
      this.formId,
      formData.objectTypeId
    );
    this.dynamicFormsFacade.loadAvailableFields(
      this.formId,
      formData.objectTypeId
    );
    this.dynamicFormsFacade.loadFormItemControlTypes();
    this.dynamicFormsFacade.loadFormItemDataTypes();
    this.dynamicFormsFacade.loadFormItemDatabaseTables();
  }

  private loadRenderModeData(formData: any): void {
    this.dynamicFormsFacade.setObjectId(this.objectId);
    this.dynamicFormsFacade.loadRenderForm(
      formData.formId,
      this.objectId,
      this.objectTypeId,
      formData.objectId,
      formData.objectTypeId,
      this.parentObjectId,
      this.parentObjectTypeId
    );
    this.dynamicFormsFacade.setisRenderForm(this.isRenderForm);
    this.showPropertyHeaderAndUpdateBreadcrumbName();
    this.form.patchValue(formData);
  }

  private toLowerParams(params: Params): Params {
    return Object.keys(params).reduce((acc, key) => {
      acc[key.toLowerCase()] = params[key];
      return acc;
    }, {} as Params);
  }

  private registerFormSaving(): void {
    this.subs.add(
      this.dynamicFormsFacade.selectRenderFormResponse$
        .pipe(
          filter((response) => !!response.selectRenderFormResponse),
          map((response) => {
            this.toastMessageHeader = response.selectRenderFormResponse.success
              ? 'Successfully Saved'
              : 'Error Saving';
            this.toastState = response.selectRenderFormResponse.success
              ? ToastState.SUCCESS
              : ToastState.ERROR;
            this.showToast();
          }),
          catchError(() => {
            this.toastMessageHeader = 'Error Saving';
            this.toastState = ToastState.ERROR;
            this.showToast();
            return of(null);
          })
        )
        .subscribe()
    );
  }

  // TODO: Refactor out this method and make error handling
  // more consistent with dynamic-form-widget.component.
  private showToast(): void {
    setTimeout(() => {
      this.isToastVisible = true;
    });
  }

  private showOldDynamicFormLink(): void {
    const renderFormParams = this.router.url.split('?')[1];
    this.subs.add(
      this.mangoAppFacade.clientKey$.subscribe((clientKey) => {
        this.externalCremLink = `${environment.cremBaseUrl.replace(
          '[CLIENT]',
          clientKey
        )}/v06/Forms/OldRenderForm.aspx?${renderFormParams}`;
      })
    );
  }

  private handleFormSectionsLoad(): void {
    this.subs.add(
      this.selectFormSections$
        .pipe(
          filter((sections) => sections !== null),
          take(1)
        )
        .subscribe((sections) => {
          this.setSectionsVisibility(sections);
          if (this.isRenderForm) {
            this.handleRenderFormSections(sections);
          } else {
            this.handleDesignFormSections(sections);
          }
        })
    );
  }

  private handleRenderFormSections(sections: any[]): void {
    const initialSections = sections
      .slice(0, this.SECTIONS_INITIAL_LOAD_COUNT)
      .map((section, index) => ({
        ...section,
        id: index + 1,
      }));

    this.sectionsVisible = [...this.sectionsVisible, ...initialSections];
    this.lastVisibleIndex = this.SECTIONS_INITIAL_LOAD_COUNT;
  }

  private handleDesignFormSections(sections: any[]): void {
    if (this.isAddingSection) {
      this.handleSectionAddition(sections);
    } else {
      this.sectionsVisible = [...this.sectionsVisible, ...sections];
      this.lastVisibleIndex = this.SECTIONS_INITIAL_LOAD_COUNT;
    }
  }

  private handleSectionAddition(sections: any[]): void {
    const sectionsArray = Object.values(sections);
    const sectionToBeAdded = sectionsArray.find(
      (item) => item.formSectionID === this.sectionIdToBeAdded
    );

    if (sectionToBeAdded) {
      this.sectionsVisible = [...this.sectionsVisible, sectionToBeAdded];
      this.isAddingSection = false;
      this.sectionIdToBeAdded = 0;
    }
  }

  // Handle Browser Native Navigation events
  @HostListener('window:beforeunload', ['$event'])
  async windowBeforeUnload($event: any): Promise<void> {
    if (this.changedFormItemKeys.length) $event.preventDefault();
  }

  handleChangeLossPrevention(
    { title, message }: { title?: string; message?: string } = {
      message: null,
      title: null,
    }
  ) {
    this.mangoAppFacade.setChangeLossPreventIsActive(true);
    return this.dialogService
      .confirm(
        title ?? 'Changes Made!',
        message ??
          'Changes you made have not been saved. Would you like to continue editing or leave?',
        'Continue',
        'Leave'
      )
      .pipe(map((continueEdit) => !continueEdit));
  }

  configGoogleMapKey() {
    this.subs.add(
      combineLatest([
        this.listpageService.getGoogleMapAPIKey(),
        this.listpageService.getGoogleMappingChannel(),
      ])
        .pipe(
          take(1),
          filter(([gmk, gmc]) => !!gmk && !!gmc),
          tap(([gmk, gmc]) => {
            this.googleMapAPIKey = gmk.data.googleMapAPIKey;
            this.googleMappingChannel = gmc.data.googleMappingChannel;
            this.loadGoogleMapsAPIScript();
          })
        )
        .subscribe()
    );
  }

  loadGoogleMapsAPIScript() {
    const googleUrl = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapAPIKey}&channel=${this.googleMappingChannel}`;
    const s = this.renderer2.createElement('script');
    s.type = 'text/javascript';
    s.src = googleUrl;
    s.async = true;
    this.renderer2.appendChild(document.body, s);
    this.tempMapLoadFlag = true;
    this.canLoadMap = this.tempMapLoadFlag;
  }

  performFormAction(formAction: any) {
    const action: string = formAction.formActionLabel.toLowerCase().trim();

    if (action === 'copy' && this.objectTypeId == ObjectType.LEASE) {
      this.copyLease();
    } else if (action === 'print to pdf') {
      this.downloadToPdf();
    } else if (action === 'print to excel') {
      this.downloadToExcel();
    } else if (action.startsWith('associate')) {
      this.performAssociatePopup(action);
    } else if (action === 'archive' || action === 'archive (new)') {
      this.archive();
    } else if (action === 'change status') {
      this.openLeaseVerificationModal();
    } else if (action === 'attach existing') {
      this.attachExisting();
    } else if (action === 'assign items') {
      this.navService.navigateToClassicAspAdminUrl(
        '/forms/admin/maintFOrmItems.asp',
        {
          queryParams: {
            fFOrmID: this.formId,
          },
          newTab: true,
        }
      );
    } else if (action === 'assign sections') {
      this.navService.navigateToClassicAspAdminUrl(
        '/forms/admin/maintformSections.asp',
        {
          queryParams: {
            fFOrmID: this.formId,
          },
          newTab: true,
        }
      );
    } else if (action === 'format item details') {
      this.navService.navigateToClassicAspAdminUrl(
        '/forms/admin/FormItemSectionDetails.asp',
        {
          queryParams: {
            FormID: this.formId,
          },
          newTab: true,
        }
      );
    } else if (action === 'add contact') {
      this.openAddContactModal();
    } else if (
      action === 'generate universal changes form' ||
      action === 'generate compliance form'
    ) {
      if (formAction.formAction) {
        let urlLink = formAction.formAction;
        urlLink = urlLink
          .replace('window.open', '')
          .replace(/[()';]/g, '')
          .replace(/\@FOID/, this.objectId)
          .replace(/\@FOTID/, this.objectTypeId);
        this.router.navigateByUrl(urlLink);
      }
    }
  }

  /**
   * Expands all cards
   * @param e
   */
  toggleAllCards(state: boolean) {
    this.expandAll = state;
  }

  addBookmark() {
    let dialogRef = this.dialog.open(DynamicFormAddBookmarkComponent, {
      height: '350px',
      width: '500px',
      panelClass: 'df-add-book-mark-component',
      data: {
        formId: this.formId,
        objectId: this.objectId,
        objectTypeId: this.objectTypeId,
        objectTypeTypeId: this.objectTypeTypeId,
        objectName: this.formTitle,
      },
    });
    dialogRef.afterClosed();
  }

  showAssociatePopup(type: string) {
    let dialogRef = this.dialog.open(DynamicFormAssociateComponent, {
      disableClose: true,
      height:
        type === 'lease' ? (this.hidePremise ? '540px' : '640px') : '480px',
      width: '700px',
      panelClass: 'df-associate-component',
      data: {
        objectId: this.objectId,
        objectTypeId: this.objectTypeId,
        associateType: type,
        hidePremise: this.hidePremise,
      },
    });
    dialogRef.afterClosed();
  }

  performAssociatePopup(action: string) {
    this.subs.add(
      this.dashboardService
        .getObjectTypeNames([
          ObjectType.PREMISE,
          ObjectType.BUILDING,
          ObjectType.LEASE,
        ])
        .subscribe(
          (res: any) => {
            if (res && res.success && res.data) {
              let leaseName = res.data.find(
                (t) => t.objectTypeId === ObjectType.LEASE
              ).objectTypeName;

              let buildingName = res.data.find(
                (t) => t.objectTypeId === ObjectType.BUILDING
              ).objectTypeName;

              let premiseName = res.data.find(
                (t) => t.objectTypeId === ObjectType.PREMISE
              ).objectTypeName;

              if (action === 'associate ' + leaseName.toLowerCase().trim()) {
                this.showAssociatePopup('lease');
              } else if (
                action ===
                'associate ' + buildingName.toLowerCase().trim()
              ) {
                this.showAssociatePopup('building');
              } else if (
                action ===
                'associate ' + premiseName.toLowerCase().trim()
              ) {
                this.showAssociatePopup('premise');
              }
            } else {
              this.notifyErrorMessage(
                'There was an issue loading details. Please review and try again.'
              );
            }
          },
          (error: any) => {
            this.notifyErrorMessage(
              'There was an error loading details. Please review and try again.'
            );
            console.log(
              'Error occurred while loading ObjectTypeNames: ',
              error
            );
          }
        )
    );
  }

  private notifyErrorMessage(errorMessage: string, title = 'Error') {
    this.toastService.show(errorMessage, title, ToastState.ERROR, {
      position: 'bottom right',
      maxWidth: '350px',
    });
  }

  private notifiyProcessingExport() {
    this.toastService.show(
      'The export file will be downloaded shortly.',
      '',
      ToastState.SUCCESS,
      {
        position: 'bottom right',
        maxWidth: '350px',
      }
    );
  }

  copyLease(): void {
    this.dialog.open(CopyLeaseComponent, {
      height: '400px',
      width: '800px',
      panelClass: 'df-addLeasePopup',
      data: {
        lease: this.formTitle,
        leaseId: this.objectId,
        hidePremise: this.hidePremise,
      },
      disableClose: true,
    });
  }

  archive(): void {
    let sub: Subscription;

    if (
      this.objectTypeId === ObjectType.CONTACT ||
      this.objectTypeId === ObjectType.COMPANY
    ) {
      sub = combineLatest([this.dynamicFormsFacade.selectFormName$])
        .pipe(
          filter(([formName]) => !!formName),
          tap(([formName]) => {
            this.dialog.open(ArchiveCompanyAndContactComponent, {
              disableClose: true,
              width: '400px',
              data: {
                archiveType:
                  this.objectTypeId === ObjectType.CONTACT
                    ? 'Contact'
                    : 'Company',
                OID: this.objectId,
                OTTID: this.objectTypeTypeId,
                objectName: formName,
              },
            });
          })
        )
        .subscribe();
    } else if (
      this.objectTypeId === ObjectType.LEASE ||
      this.objectTypeId === ObjectType.BUILDING ||
      this.objectTypeId === ObjectType.PREMISE
    ) {
      this.dialog.open(ArchiveLeaseComponent, {
        disableClose: true,
        height: '780px',
        width: '75%',
        data: {
          archiveType:
            Number(this.objectTypeId) === ObjectType.BUILDING
              ? 'Building'
              : Number(this.objectTypeId) === ObjectType.PREMISE
              ? 'Premise'
              : 'Lease',
          OID: this.objectId,
          OTTID: this.objectTypeTypeId,
          hiddenPremise: this.hidePremise ? 1 : 0,
        },
      });
    }

    this.subs.add(sub);
  }

  openAddContactModal() {
    const dialogRef = this.dialog.open(AddContactModalComponent, {
      disableClose: true,
      height: '50vh',
      width: '58vw',
      panelClass: 'addContactModal',
      data: {
        objectTypeId: this.objectTypeId,
        companyID: this.objectId,
      },
    });
    dialogRef.afterClosed().subscribe(() => {
      this.dynamicFormsFacade.clearDynamicFormsState();
      this.reloadTheForm();
    });
  }

  openLeaseVerificationModal() {
    const dialogRef = this.dialog.open(DynamicFormLeaseVerificationComponent, {
      minWidth: '45vw',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        formId: this.formId,
        objectId: this.objectId,
        objectTypeId: this.objectTypeId,
        objectTypeTypeId: this.objectTypeTypeId,
        parentObjectId: this.parentObjectId,
        parentObjectTypeId: this.parentObjectTypeId,
      },
    });
    dialogRef.afterClosed().subscribe((results) => {
      if (results) {
        // Reload the form when the Lease Verification Status is updated.
        this.dynamicFormsFacade.clearDynamicFormsState();
        this.reloadTheForm();
      } else {
        return;
      }
    });
  }

  downloadToExcel(): void {
    const objectId = this.formDataObjectId ?? this.objectId;
    const objectTypeId = this.formDataObjectTypeId ?? this.objectTypeId;
    this.isActionLoading = true;
    this.notifiyProcessingExport();

    this.dynamicFormsService
      .downloadExcel(this.formId, objectId, objectTypeId, this.objectTypeTypeId)
      .subscribe({
        next: (response) => {
          const defaultFileName = `${
            environment.production ? '' : environment.name + '-'
          }${this.formId}-${objectId}-${objectTypeId}-${
            this.objectTypeTypeId
          }.xlsx`;
          const filename =
            this.getFilenameFromResponse(response) || defaultFileName;

          this.isActionLoading = false;
          this.downloadFile(filename, response);
        },
        error: (err) => {
          this.isActionLoading = false;
          this.toastMessageHeader = 'Error Printing To Excel.';
          this.notifyErrorMessage(this.toastMessageHeader, '');
        },
      });
  }

  downloadToPdf(): void {
    const objectId = this.formDataObjectId ?? this.objectId;
    const objectTypeId = this.formDataObjectTypeId ?? this.objectTypeId;
    this.isActionLoading = true;
    this.notifiyProcessingExport();

    this.dynamicFormsService
      .downloadPdf(this.formId, objectId, objectTypeId, this.objectTypeTypeId)
      .subscribe({
        next: (response) => {
          const defaultFileName = `${this.formId}-${objectId}-${objectTypeId}.pdf`;
          const filename =
            this.getFilenameFromResponse(response) || defaultFileName;

          this.isActionLoading = false;
          this.downloadFile(filename, response);
        },
        error: (err) => {
          this.isActionLoading = false;
          this.toastMessageHeader = 'Error Printing To PDF.';
          this.notifyErrorMessage(this.toastMessageHeader, '');
        },
      });
  }

  attachExisting(): void {
    this.dialog.open(AssociateToProjectComponent, {
      height: '500px',
      width: '800px',
      panelClass: 'df-attachExistingPopup',
      data: {
        OID: this.objectId,
        OTID: this.objectTypeId,
        OTTID: this.objectTypeTypeId,
      },
      disableClose: true,
    });
  }

  private getFilenameFromResponse(response: any): string | null {
    const contentDisposition = response.headers.get('Content-Disposition');
    if (!contentDisposition) return null;

    const match = contentDisposition.match(/filename="([^"]+)"/);
    return match ? match[1] : null;
  }

  private downloadFile = (fileName: string, data: HttpResponse<Blob>) => {
    const downloadedFile = new Blob([data.body], { type: data.body.type });
    const a = document.createElement('a');
    a.setAttribute('style', 'display:none;');
    document.body.appendChild(a);
    a.download = fileName;
    a.href = URL.createObjectURL(downloadedFile);
    a.target = '_blank';
    a.click();
    document.body.removeChild(a);
  };

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  getFormId() {
    // this format is driven by the API
    return `dynamic-form_${this.formId}`;
  }

  getFormSectionId(section) {
    // this format is driven by the API
    return `dynamic-form_section_${section.formSectionID}`;
  }
}
