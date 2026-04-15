import { CommonModule, formatCurrency, formatDate } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  AfterViewInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { DynamicFormsFacade } from '@forms/+state/dynamic-forms.facade';
import { DynamicFormEditFieldDialogComponent } from '@forms/admin-render-forms/dynamic-form-edits/dynamic-form-edit-field-dialog/dynamic-form-edit-field-dialog.component';
import {
  IFieldDetails,
  IFields,
  ISection,
  RenderFormItemDetails,
  SaveRenderFormDto,
} from '@forms/model/dynamic-forms.interface';
import { UseDynamicFormFieldConfigDirective } from '@forms/pipes/use-dynamic-form-field-config.pipe';
import { DynamicFormsService } from '@forms/services/dynamic-forms.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { ListPageService } from '@list-pages/components/listpage/core/services/listpage.service';
import {
  MapDataRequest,
  Marker,
} from '@list-pages/components/listpage/shared/models';
import { SearchModule } from '@mango/ui-shared/cosmos';
import {
  ButtonModule,
  CremRadioComponent,
  CremRadioGroupComponent,
  CremToastService,
  DatePickerModule,
  DropdownModule,
  FieldHistoryComponent,
  IconModule,
  InputComponent,
  InputLabelComponent,
  LibUiElementsModule,
  LoaderModule,
  ModalModule,
  SkeletonModule,
} from '@mango/ui-shared/lib-ui-elements';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { environment } from '@mangoSpa/src/environments/environment.local';
import { DxDataGridComponent } from 'devextreme-angular';
import { DxSortableTypes } from 'devextreme-angular/ui/sortable';
import { DevExpressModule } from 'libs/ui-shared/lib-external-libraries/src/lib/3rdParty/dev-express.module';
import { CheckBoxComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/checkbox';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  Observable,
  Subject,
  Subscription,
  combineLatest,
  forkJoin,
  from,
  of,
} from 'rxjs';
import {
  catchError,
  concatMap,
  filter,
  map,
  switchMap,
  take,
  takeUntil,
  tap,
  toArray,
} from 'rxjs/operators';
import { FieldsControlService } from '../../../services/fields-control.service';
import { DynamicFormFieldDocSecPageComponent } from '../dynamic-form-fields/dynamic-form-field-doc-sec-page/dynamic-form-field-doc-sec-page.component';
import { DynamicFormWidgetComponent } from '../dynamic-form-widgets/dynamic-form-widget.component';
import { DynamicFormComponent } from '../dynamic-form.component';
import {
  ParseFormItemParametersPipe,
  transform as parseFormItemParametersPipeTransform,
} from '../pipes/parse-form-item-parameters';
import { isTruthy, MangoDialogService } from '@mango/core-shared';
import { isNumeric } from 'rxjs/util/isNumeric';
import { DomSanitizer } from '@angular/platform-browser';
import {
  FieldHistoryDataSource,
  ObjectType,
  ObjectTypeType,
  ToastState,
} from '@mango/data-models/lib-data-models';
import { BookmarksService } from '@micro-components/services/bookmarks.service';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { redirectorLinks } from '@mangoSpa/src/app/+state/app/app.selectors';
import { IsNumericPipe } from '../pipes/is-numeric.pipe';
import { renderSelectFields } from '@forms/model/enums/render-selects.enums';
import { FormWizardService } from '@micro-components/services/form-wizard.service';
import { DynamicFormBehaviorsComponent } from '../dynamic-form-actions/dynamic-form-behaviors/dynamic-form-behaviors.component';
import { BehaviorType } from '@forms/model/enums/behaviors.enums';
import { DataType } from 'libs/data-models/lib-data-models/src/lib/enums/index';

export class tempList {
  columnNum: number;
  listOfFields: IFields[];
}

type DxoItemDraggingProperties = DxSortableTypes.Properties;

// map for radio button values
const booleanStringMap = {
  ['True']: '1',
  ['False']: '0',
};
const truthyRadioVals = ['1', 'true', 'yes', true, 'y'];
const falsyRadioVals = ['0', 'false', 'no', false, 'n'];

@Component({
  selector: 'mango-dynamic-form-section',
  standalone: true,
  templateUrl: './dynamic-form-section.component.html',
  styleUrls: ['./dynamic-form-section.component.scss'],
  providers: [FieldsControlService, ListPageService],
  imports: [
    CommonModule,
    DynamicFormWidgetComponent,
    DynamicFormFieldDocSecPageComponent,
    ReactiveFormsModule,
    LibUiElementsModule,
    LoaderModule,
    SearchModule,
    ButtonModule,
    MatIconModule,
    ModalModule,
    MatMenuModule,
    MatButtonModule,
    FontAwesomeModule,
    NgxSkeletonLoaderModule,
    LoaderModule,
    MatDialogModule,
    MatCardModule,
    DropdownModule,
    DevExpressModule,
    InputComponent,
    SkeletonModule,
    DynamicFormEditFieldDialogComponent,
    InputLabelComponent,
    FieldHistoryComponent,
    DatePickerModule,
    IconModule,
    CremRadioGroupComponent,
    CheckBoxComponent,
    CremRadioComponent,
    UseDynamicFormFieldConfigDirective,
    ParseFormItemParametersPipe,
    GoogleMapsModule,
    IsNumericPipe,
  ],
  animations: [
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({ height: '0px', overflow: 'hidden', opacity: 0 })
      ),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out')),
    ]),
  ],
})
export class DynamicFormSectionComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit
{
  @ViewChild('availableFieldsGrid') availableFieldsGrid: DxDataGridComponent;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  @ViewChildren('SectionMenuItem') menuItemsElements: QueryList<ElementRef>;
  @ViewChild('sectionTitle') sectionTitle: ElementRef;

  /**
   * Interact with Dynamic Form Widget (data grid)
   *
   * @type {ElementRef<>}
   * @memberof DynamicFormSectionComponent
   */
  @ViewChild(DynamicFormWidgetComponent)
  dynamicFormWidget: DynamicFormWidgetComponent;

  /**
   * This is used with Dynamic Form widget to show the download button on the card's header
   *
   * @private
   * @memberof DynamicFormSectionComponent
   */
  private canShowDownload = false as boolean;

  private currentSecMenuFocusIndex = 0;
  private subs: Subscription = new Subscription();

  @Input() section!: ISection;
  @Input() form!: FormGroup;
  @Input() editMode: boolean;
  @Input() isRenderForm: boolean;
  @Input() hidePremise: boolean;
  @Input() hasParentObjectLinker = false as boolean;
  @Input() isSuperUser = false as boolean;
  @Input() canLoadMap = false as boolean;
  @Input() allFormItemsKeys: RenderFormItemDetails[];
  /**
   * Controls the card expansion state
   * Controls the ExpandAll and CollapseAll from the Menu Action
   *
   * @memberof DynamicFormSectionComponent
   */
  @Input() isExpanded = true as boolean;
  @Output() hasParentObjectLinkerChange: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  @Input() formGroupName: string;
  childForm: FormGroup = new FormGroup({});

  @Output() loadNextSections: EventEmitter<any> = new EventEmitter();

  faCog = faCog;
  sampleRadioItems: string[] = ['Option A', 'Option B', 'Option C'];
  tempList: tempList[] = [];

  formId?: number;
  objectId: number;
  objectTypeId: number;
  objectTypeTypeId: number;

  isLoading: boolean;

  /**
   * Controls how many instances of the skeleton to show per card
   *
   * @private
   * @type {number}
   * @memberof DynamicFormSectionComponent
   */
  private _skeletonInstances: number;

  private canExpand: boolean;
  showLoader: boolean;

  selectedFormItem: IFields;
  formItemPopupTitle: string;
  formSectionPopupVisible: boolean;
  isDropdownValuesLoading = false;
  initialData: any;
  sectionFields$: Observable<IFields[]>;
  selectAvailableFormFieldsBySectionId$: Observable<IFields[]>;
  dropdownValues$: Observable<any[]>;
  lastSection: string;
  selectRenderFormData: any;
  validationErrors: any;
  showParentLinker = false;
  showSectionHeader = true;
  sectionLabelMenuEntered = false as boolean;
  sectionLabelMenuOpened = false as boolean;
  sectionLabelEntered = false as boolean;
  externalCremLink: string;
  clientKey = '' as string;
  sectionEditUrl = '' as string;
  formItemDetailsUrl = '' as string;

  selectRenderParentLink$ = this.dynamicFormsFacade.selectRenderParentLink$;
  dateFormatPreference$ = this.mangoFacade.dateFormatPreference$;
  private dateFormatPreferenceValue: string;
  isTruthy = isTruthy;

  //*********** Google Maps ***************/

  googleMapPath: string = '/v06/mapping/GoogleMapsWidgetV3.aspx';
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: false,
    disableDoubleClickZoom: false,
    zoom: 15,
    maxZoom: 20,
    minZoom: 0,
  };
  zoom = 4;
  loadMapFlag$: Observable<boolean>;
  markers: Marker[];
  advMarkers: any;
  objectTypeText = '';
  //*** end Google maps */

  dfHelpTextToggle = false as boolean;

  //*****************field-history*******************

  controlInfoHistData: FieldHistoryDataSource = {
    helpTextPage: '',
    helpTextSubject: '',
    helpTextName: 'Help Text',
    helpTextText: '',
    helpTextImage: '',
    helpTextHistory: [],
  };

  //*************************************************

  // ********toggleChildBehavior*********************
  formItemsToHide = new Set<number>();
  //*************************************************
  constructor(
    private dynamicFormsFacade: DynamicFormsFacade,
    private mangoFacade: MangoAppFacade,
    public dialog: MatDialog,
    private fcs: FieldsControlService,
    private route: ActivatedRoute,
    private router: Router,
    private listpageService: ListPageService,
    private dynamicFormContainer: DynamicFormComponent,
    private dynamicFormsService: DynamicFormsService,
    private sanitized: DomSanitizer,
    private dialogService: MangoDialogService,
    private bookmarksService: BookmarksService,
    private formWizardService: FormWizardService,
    private toastService: CremToastService
  ) {}

  ngAfterViewInit(): void {
    this.onContentReady();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this._skeletonInstances = 3; // TODO: Dynamically calculate the shape of the skeleton, instead of being hard-coded

    this.form.addControl(this.formGroupName, this.childForm);

    this.subs.add(
      this.route.queryParamMap.subscribe((queryParamMap) => {
        const segments = this.route.snapshot.url;
        const getQueryParamValue = (key: string): number | null => {
          const lowerCaseKey = key.toLowerCase();
          const value =
            queryParamMap.get(lowerCaseKey) ||
            queryParamMap.get(lowerCaseKey.toUpperCase());
          return value !== null ? parseInt(value) : null;
        };

        this.objectId = getQueryParamValue('oid');
        this.objectTypeId = getQueryParamValue('otid');
        this.objectTypeTypeId = getQueryParamValue('ottid');
        this.formId = getQueryParamValue('fid');
      })
    );

    this.subs.add(
      this.dateFormatPreference$.subscribe((dfpValue) => {
        this.dateFormatPreferenceValue = dfpValue;
      })
    );

    this.subs.add(
      this.mangoFacade.clientKey$.subscribe((clientKey) => {
        this.clientKey = clientKey;
      })
    );

    this.loadSectionFormFields();
    this.loadAvailableSectionFields();
    this.sectionEditUrl = this.getSectionEditUrl(this.section?.formSectionID);
    this.formItemDetailsUrl = this.getFormItemDetailsUrl(
      this.section?.formSectionID
    );

    if (this.objectTypeId == ObjectType.PREMISE) this.hidePremise = true;

    this.dynamicFormsFacade.selectFormSections$
      .pipe(
        map(
          (result) =>
            (this.lastSection =
              result != null ? result[result.length - 1].formSectionName : '')
        )
      )
      .subscribe();
  }

  loadSectionFormFields(): void {
    this.showSectionHeader = this.section.formSectionDisplayHeading;
    if (!this.showSectionHeader) {
      // Always expands if is missing card title
      this.isExpanded = true;
    }

    this.subs.add(
      this.dynamicFormsFacade.selectedDynamicForm$
        .pipe(
          filter((dynamicForm) => dynamicForm !== null),
          take(1),
          switchMap((dynamicForm) => {
            this.dynamicFormsFacade.loadFields(
              dynamicForm.formId,
              this.section.formSectionID,
              dynamicForm.objectTypeId
            );

            return combineLatest([
              this.dynamicFormsFacade
                .selectFormFieldsBySectionId(this.section.formSectionID)
                .pipe(
                  filter((fields) => !!fields),
                  take(1)
                ),
              this.dynamicFormsFacade.selectRenderFormData$.pipe(
                filter((renderFormData) => !!renderFormData),
                take(1),
                concatMap((renderFormData) =>
                  this.transformDataForUi(renderFormData)
                )
              ),
            ]);
          })
        )
        .subscribe({
          next: ([fields, renderFormData]) => {
            if (this.isRenderForm) {
              this.selectRenderFormData = renderFormData;
              const formObjectId = renderFormData.filter(
                (s) => s.formObjectId
              )?.[0]?.formObjectId;

              const clonedFields = fields.map((element) => ({
                ...element,
                formObjectId: formObjectId ? Number(formObjectId) : 0,
              }));
              this.processFormFields(clonedFields);
              this.setupRenderFormDropdownsSubscription();
              this.filterRenderFormData();
              this.updateChildFormAddRenderFormData();
            }
          },
        })
    );
  }

  onRadioGroupChange(selectedValue: any, field?: IFields): void {
    if (!field?.formItemOutputIDs?.length) {
      return;
    }

    const normalized = this.normalizeRadioValue(selectedValue);
    if (normalized === null) {
      return;
    }

    const updated = new Set(this.formItemsToHide);
    field.formItemOutputIDs.forEach((id) => {
      if (normalized) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
    });

    this.formItemsToHide = updated;
  }

  private normalizeRadioValue(value: any): boolean | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }

    const normalized = `${value}`.trim().toLowerCase();

    if (truthyRadioVals.includes(normalized)) {
      return true;
    }

    if (falsyRadioVals.includes(normalized)) {
      return false;
    }

    return null;
  }

  processFormFields(data: any[]): void {
    if (data && data.length > 0) {
      this.tempList = [];
      this.sectionFields$ = of(data); // Convert array to observable

      if (this.section.formSectionColumns > 4)
        this.section.formSectionColumns = 4;

      const outlier = data.filter(
        (field) =>
          field.formItemSectionDetail.columnNum >
          this.section.formSectionColumns
      );

      for (let i = 1; i <= this.section.formSectionColumns; i++) {
        let fieldsInColumn = data.filter(
          (field) => field.formItemSectionDetail.columnNum === i
        );

        if (outlier.length && i == 1)
          fieldsInColumn = fieldsInColumn.concat(outlier);

        fieldsInColumn = this.addAdditionalInfoToFields(fieldsInColumn);

        if (fieldsInColumn.length) {
          this.tempList.push({ columnNum: i, listOfFields: fieldsInColumn });
        }
      }

      this.formItemsToHide = this.buildFormItemsToHide(this.tempList);

      this.sectionFields$ = of(data);
    }

    this.isLoading = false;
  }

  // For toggleChild behavior
  private buildFormItemsToHide(list: tempList[]): Set<number> {
    const formItemsToHide = new Set<number>();

    list.forEach((item) => {
      item.listOfFields
        .filter((field) => {
          let ans = field.formItemAnswer;
          if (typeof ans === 'string') {
            ans = field.formItemAnswer?.toLowerCase();
          }

          const isToggleChild =
            field.behaviorTypeID === BehaviorType.ToggleChild;
          const isNegativeAnswer = falsyRadioVals.includes(ans);

          return isToggleChild && isNegativeAnswer;
        })
        .forEach((field) => {
          field.formItemOutputIDs?.forEach((x) => {
            formItemsToHide.add(x);
          });
        });
    });
    return formItemsToHide;
  }

  private addAdditionalInfoToFields(fieldsArray: any[]): any[] {
    //Created a function just in case we need to add more fields
    const modifiedFieldsArray = [];
    fieldsArray.map((f) => {
      const newField = JSON.parse(JSON.stringify(f));
      newField['dataTypeID'] = null;
      newField['formItemAnswer'] = null;
      newField['formItemAnswerViewMode'] = null;
      newField['formItemName'] = null;
      newField['formItemViewOnly'] = null;
      newField['sourceURL'] = null;
      newField['formItemFieldWidth'] = null;
      newField['formItemFieldHeight'] = null;
      newField['formItemParameters'] = null;
      newField['numDecimals'] = null;
      newField['sourceDocument'] = null;
      newField['sourcePage'] = null;
      newField['sourceSection'] = null;
      newField['sourceDate'] = null;
      newField['formItemSectionID'] = null;
      newField['formItemMandatory'] = null;

      const formItemData = this.getMatchingItem(f.formItemID);
      if (!!formItemData) {
        newField.dataTypeID = formItemData.dataTypeID;
        newField.formItemAnswer = formItemData.formItemAnswer;
        newField.sourceURL = formItemData.sourceURL;
        newField.formItemName = formItemData.formItemName;
        newField.formItemViewOnly = formItemData.formItemViewOnly === 'True';
        newField.formItemFieldWidth = formItemData.formItemFieldWidth;
        newField.formItemFieldHeight = formItemData.formItemFieldHeight;
        newField.formItemParameters = formItemData.formItemParameters;
        newField.numDecimals = formItemData.numDecimals;
        newField.helpText = formItemData.helpText;
        newField.sourceDocument = formItemData.sourceDocument;
        newField.sourcePage = formItemData.sourcePage;
        newField.sourceSection = formItemData.sourceSection;
        newField.sourceDate = formItemData.sourceDate;
        newField.formItemSectionID = formItemData.formItemSectionID;
        newField.formItemMandatory = formItemData.formItemMandatory;

        /// format date field for view labels
        if (
          ['2', '9'].some((typeId) => formItemData.formItemTypeID === typeId) &&
          formItemData.dataTypeID === DataType.DATE.toString()
        ) {
          if (!!formItemData.formItemAnswer) {
            newField.formItemAnswerViewMode = formatDate(
              formItemData.formItemAnswer,
              this.dateFormatPreferenceValue,
              'en-US'
            );
          }
        }
      }

      modifiedFieldsArray.push(newField);
    });

    return modifiedFieldsArray;
  }

  filterRenderFormData(): void {
    if (this.sectionFields$) {
      this.subs.add(
        this.sectionFields$
          .pipe(
            filter((fields) => {
              return fields && fields.length > 0;
            }),
            tap((fields) => {
              this.selectRenderFormData = this.selectRenderFormData.filter(
                (item) =>
                  fields.some(
                    (field) => field.formItemID === Number(item.formItemID)
                  )
              );
            })
          )
          .subscribe()
      );
    }
  }

  private setupRenderFormDropdownsSubscription(): void {
    this.subs.add(
      this.dynamicFormsFacade.selectRenderFormDropdowns$
        .pipe(filter((formData) => formData !== null))
        .subscribe((data) => {
          const dropdownValues = this.selectRenderFormData.reduce(
            (
              acc: { [key: string]: { value: string; display: string }[] },
              item: any
            ) => {
              return acc;
            },
            {}
          );
          let transformedData = { ...data, ...dropdownValues };

          const observables =
            this.getBehaviorDropdownObservables(transformedData);
          if (observables.length > 0) {
            this.subs.add(
              forkJoin(observables).subscribe(() => {
                this.dropdownValues$ = of(transformedData);
              })
            );
          } else {
            this.dropdownValues$ = of(transformedData);
          }

          this.isDropdownValuesLoading = false;
        })
    );
  }

  private createOldClauseObject(formItemData: any): any {
    const oldClauseValue = {
      ClauseTypeId: formItemData.clauseTypeID,
      ClauseText: formItemData.formItemAnswer,
      Document: formItemData.sourceDocument,
      Section: formItemData.sourceSection,
      Page: formItemData.sourcePage,
      ClauseDate: formItemData.sourceDate,
    };

    return oldClauseValue;
  }

  updateChildFormAddRenderFormData(): void {
    this.childForm = this.fcs.toFormGroup(
      this.selectRenderFormData,
      this.editMode
    );

    this.selectRenderFormData.forEach((formItem) => {
      const item = {
        formItemId: formItem.formItemID,
        formItemTypeId: formItem.formItemTypeID,
        oldValue:
          formItem.formItemTypeID === '10'
            ? this.createOldClauseObject(formItem)
            : formItem.formItemAnswer,
        type: formItem.formItemName.includes('Dynamic')
          ? 'Dynamic'
          : formItem.formItemName.includes('Existing')
          ? 'Existing'
          : formItem.formItemName.includes('Clause')
          ? 'Clause'
          : 'Dynamic',
        labelName: formItem.formItemLabel,
      };

      const copiedObject = JSON.parse(JSON.stringify(item));
      this.allFormItemsKeys.push(copiedObject);
      if (formItem.formItemAnswer?.toString().includes(this.googleMapPath)) {
        this.extractMapParms(formItem.formItemAnswer);
      } else if (formItem.sourceURL?.toString().includes(this.googleMapPath)) {
        this.extractMapParms(formItem.sourceURL);
      }
    });
    this.form.setControl(this.formGroupName, this.childForm);

    // Store the initial data for later comparison
    this.initialData = this.childForm.value;

    // we have to attach to the child form to prevent falsely detecting changes as new form sections are added to the container and rendered
  }

  /**
   * Calls to bring back the available fields in the section (add fields button)
   */
  loadAvailableSectionFields() {
    if (!this.isRenderForm) {
      this.subs.add(
        this.dynamicFormsFacade.selectAvailableFormFields$
          .pipe(filter((formData) => formData !== null))
          .subscribe(() => {
            this.dynamicFormsFacade.loadAvailableFieldsToSection(
              this.section.formSectionID
            );
          })
      );

      this.selectAvailableFormFieldsBySectionId$ =
        this.dynamicFormsFacade.selectAvailableFieldsBySectionId(
          this.section.formSectionID
        );
    }
  }

  /**
   * Adds the available field(s) selected to the section
   */
  addFields() {
    const newFields = this.availableFieldsGrid.instance.getSelectedRowsData();
    newFields.forEach((field: IFields) => {
      /**
       * Shallow copy the field state object - as it's immutable
       */
      const tempField = { ...field };
      tempField.formItemSectionDetail = this.createDefaultFieldDetails();
      tempField.formItemType = field.formItemType;
      tempField.formItemSectionDetail.formItemID = field.formItemID;
      tempField.formItemSectionDetail.formItemLabel = field.formItemLabel;
      tempField.formItemSectionDetail.formSectionID =
        this.section.formSectionID;
      tempField.formItemSectionDetail.columnNum = 1;
      this.dynamicFormsFacade.addAvailableFieldToSection(
        this.section.formSectionID,
        tempField
      );
    });

    this.availableFieldsGrid.instance.clearSelection();
  }

  searchAvailableFieldsDataGrid(data) {
    this.availableFieldsGrid.instance.searchByText(data);
  }

  onFormDataChange(formData: any) {
    // Dispatch an action to update the form data in the store
    // this.store.dispatch(DynamicFormsActions.dynamicFormUpdateRenderForm({ formData }));
  }

  createNewField() {
    // let newField = new FormField(0, "My New Field", '', 'input', 'Building', null, null, null, null, null, null, null, null, null, null, null, null, null, [], false, null, null);
    // this.currentFormItem = newField;
    // this.sectionFields.push(this.currentFormItem);
    // this.launchFormItemPopup({ name : 0 });
  }

  launchFormItemPopup(data) {
    this.subs.add(
      this.sectionFields$.pipe(take(1)).subscribe((items) => {
        /**
         * Shallow copy the field state object - as it's immutable
         */
        this.selectedFormItem = {
          ...items.find((item) => item.formItemID === data.name.formItemID),
        };
        this.selectedFormItem.formItemSectionDetail = {
          ...this.selectedFormItem.formItemSectionDetail,
        };
        this.selectedFormItem.formItemType = {
          ...this.selectedFormItem.formItemType,
        };
      })
    );

    this.dialog.open(DynamicFormEditFieldDialogComponent, {
      disableClose: false,
      height: '90%',
      width: '95%',
      data: {
        form: this.form,
        section: this.section,
        field: this.selectedFormItem,
      },
    });
  }

  launchFormSectionPopup() {
    this.formSectionPopupVisible = true;
  }

  // ******************************************************** UI FUNCTIONS BELOW ********************************************************
  isWidgetObjectLinker(dataField: any): boolean {
    if (
      typeof this.selectRenderFormData === 'undefined' ||
      this.selectRenderFormData === null
    ) {
      return false;
    }
    if (this.hasParentObjectLinker) {
      return false;
    }

    const matchingDataForFormItem = this.selectRenderFormData.find(
      (item) => item.formItemID === dataField.toString()
    );
    if (
      matchingDataForFormItem &&
      matchingDataForFormItem.sourceURL
        .toLowerCase()
        .includes('objectlinker.aspx')
    ) {
      setTimeout(() => {
        this.hasParentObjectLinkerChange.emit(true);
        this.showParentLinker = true;
      });
    }

    return false;
  }

  goToPage(OTID: number) {
    this.showLoader = true;
    this.subs.add(
      this.selectRenderParentLink$.subscribe((data) => {
        if (data) {
          let queryParams: any;
          if (OTID == ObjectType.PREMISE) {
            queryParams = {
              fid: data?.premiseFormId,
              oid: data?.premiseObjectId,
              otid: OTID,
              ottid: data?.premiseObjectTypeTypeId,
            };
          } else if (this.objectTypeTypeId == ObjectTypeType.Equipment_Lease) {
            queryParams = {
              fid: data?.premiseFormId,
              oid: data?.objectId,
              otid: ObjectType.BUILDING,
              ottid: data?.objectTypeTypeId,
            };
          } else if (this.objectTypeTypeId == ObjectTypeType.Lease) {
            queryParams = {
              fid: data?.formId,
              oid: data?.objectId,
              otid: ObjectType.BUILDING,
              ottid: data?.objectTypeTypeId,
            };
          } else if (
            this.objectTypeTypeId == ObjectTypeType.Building ||
            this.objectTypeTypeId == ObjectTypeType.Premise
          ) {
            queryParams = {
              fid: data?.formId,
              oid: data?.objectId,
              otid: ObjectType.BUILDING,
              ottid: data?.objectTypeTypeId,
            };
          } else {
            return;
          }

          this.router.navigate(['/crem/forms/render-form'], { queryParams });
        }
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.editMode && this.form) {
      //this.toggleFormControls();
    }
    if (changes.canLoadMap && changes.canLoadMap.currentValue) {
      setTimeout(() => {
        this.loadMapFlag$ = of(this.canLoadMap);
      }, 2000);
    }
  }

  onCanShowDownload(e) {
    if (e) {
      // canShowDownload calculates if the Download Button should be shown or not
      this.canShowDownload = !!this.sectionTitle?.nativeElement?.innerText && e;
    }
  }

  /**
   * Access the method on dynamic-form-widgets to download file
   * if downloading available
   *
   * @memberof DynamicFormSectionComponent
   */
  onWidgetDownloadFile(e) {
    this.dynamicFormWidget.exportToExcel();
  }

  toggleFormControls() {
    if (this.editMode) {
      //this.isDropdownValuesLoading = true;
      this.enableDisableFormControls(this.form, true);
    } else {
      this.enableDisableFormControls(this.form, false);
    }
  }

  // Recursively enable/disable form controls
  private enableDisableFormControls(control: AbstractControl, enable: boolean) {
    if (control instanceof FormGroup) {
      Object.values(control.controls).forEach((childControl) => {
        this.enableDisableFormControls(childControl, enable);
      });
    } else {
      if (enable) {
        control.enable();
      } else {
        control.disable();
      }
    }
  }

  onDragStart: DxoItemDraggingProperties['onDragStart'] = (e) => {
    e.itemData = e.fromData[e.fromIndex];
  };

  onAdd: DxoItemDraggingProperties['onAdd'] = (e) => {
    e.toData.splice(e.toIndex, 0, e.itemData);
  };

  onRemove: DxoItemDraggingProperties['onRemove'] = (e) => {
    e.fromData.splice(e.fromIndex, 1);
  };

  onReorder: DxoItemDraggingProperties['onReorder'] = (e) => {
    this.onRemove(e as DxSortableTypes.RemoveEvent);
    this.onAdd(e as DxSortableTypes.AddEvent);
  };

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  private createDefaultFieldDetails(): IFieldDetails {
    return {
      formSectionID: 0,
      formItemDefaultLabel: '',
      formItemID: 0,
      formItemLabel: '',
      columnNum: 0,
      formItemSortOrder: 0,
      formItemMandatory: '',
      formItemMandatoryStep: 0,
      formItemViewOnly: '',
      formItemLabelPrefix: '',
      formItemLabelSuffix: '',
      formItemDisplayLabel: '',
      formItemJavaScript: '',
    };
  }

  onSectionEnterKey(e) {
    if (!this.sectionLabelEntered) {
      this.openSectionLabelMenu();
    } else {
      this.closeSectionLabelMenu();
    }
  }

  onAccordionEnterKey(e: Event) {
    if (this.isSuperUser && !this.editMode) {
      e.preventDefault();
      if (!this.sectionLabelEntered) {
        this.openSectionLabelMenu();
      } else {
        this.closeSectionLabelMenu();
      }
    }
  }

  handleKeyboardEventsSection(e) {
    if (this.trigger.menuOpen) {
      if (e.key === 'ArrowDown') {
        this.currentSecMenuFocusIndex = Math.min(
          this.currentSecMenuFocusIndex + 1,
          this.menuItemsElements.length - 1
        );
        this.menuItemsElements
          .toArray()
          [this.currentSecMenuFocusIndex].nativeElement?.focus();
      } else if (e.key === 'ArrowUp') {
        this.currentSecMenuFocusIndex = Math.max(
          this.currentSecMenuFocusIndex - 1,
          0
        );
        this.menuItemsElements
          .toArray()
          [this.currentSecMenuFocusIndex].nativeElement?.focus();
      } else if (
        e.key === 'Tab' &&
        e.shiftKey &&
        this.currentSecMenuFocusIndex === 0
      ) {
        this.trigger.closeMenu();
        this.sectionTitle.nativeElement?.focus();
      }
    }
  }

  onSectionMenuClosed() {
    this.sectionLabelEntered = false;
  }

  openSectionLabelMenu() {
    this.sectionLabelEntered = true;
    this.sectionLabelMenuOpened = true;
    this.sectionLabelMenuEntered = false;
    this.trigger.openMenu();
    this.currentSecMenuFocusIndex = 0;
    setTimeout(() => {
      this.menuItemsElements.first.nativeElement?.focus();
    }, 0);
  }

  closeSectionLabelMenu() {
    this.sectionLabelEntered = false;
    setTimeout(() => {
      !this.sectionLabelMenuEntered &&
        !this.sectionLabelEntered &&
        this.trigger.closeMenu();
    }, 500);
  }

  sectionLabelMenuLeave() {
    this.sectionLabelMenuEntered = false;
    this.closeSectionLabelMenu();
  }

  getSectionEditUrl(sectionID: number) {
    return `${environment.cremBaseUrl.replace(
      '[CLIENT]',
      this.clientKey
    )}/V06/Forms/admin/FormSections/FormSectionAddEdit.aspx?btnSUbmit=edit&keyID=${sectionID}`;
  }

  getFormItemDetailsUrl(sectionID: number) {
    return `${environment.cremBaseUrl.replace(
      '[CLIENT]',
      this.clientKey
    )}/Forms/admin/FormItemSectionDetails.asp?FormID=${
      this.formId
    }&SectionID=${sectionID}`;
  }

  transformDataForUi(renderFormData: any): Observable<any[]> {
    return from(renderFormData).pipe(
      concatMap(async (dataItem: any) => {
        const result = { ...dataItem };
        /// images
        if (['7', '17'].some((typeId) => result.formItemTypeID === typeId)) {
          // convert form item answer (file-path) into an embedded image uri
          if (isTruthy(result.formItemAnswer)) {
            result.formItemAnswer = await this.createEmbeddedImage(
              result.formItemAnswer
            ).toPromise();
          }
        }
        /// parse radio button values
        if (['5'].some((typeId) => result.formItemTypeID === typeId)) {
          result.formItemAnswer = this.parseRadioButtonInitialValue(
            result,
            renderFormData
          );
        }
        ///convert form item answer to a boolean
        if (['4'].some((typeId) => result.formItemTypeID === typeId)) {
          result.formItemAnswer = result.formItemAnswer === 'true';
        }
        /// parse multi-select values into array of values
        if (['13', '18'].some((typeId) => result.formItemTypeID === typeId)) {
          result.formItemAnswer = result.formItemAnswer?.split('|') ?? [];
        }
        /// format the decimals for Int(3), Numeric(5), Money(6), Percent(206) datatypes
        if (
          [
            DataType.INTEGER,
            DataType.DOUBLE,
            DataType.CURRENCY,
            DataType.PERCENT,
          ]
            .map(String)
            .some((dataTypeId) => result.dataTypeID === dataTypeId)
        ) {
          if (
            isTruthy(result.numDecimals) &&
            isTruthy(result.formItemAnswer) &&
            isNumeric(result.formItemAnswer)
          ) {
            result.formItemAnswer = Number(result.formItemAnswer).toFixed(
              result.numDecimals
            );
          }
        }

        return result;
      }),
      toArray()
    );
  }

  /**
   * return base64 embed for the requested image uri
   *
   * @private
   * @param {*} uri
   * @returns {Observable<string>}
   */
  private createEmbeddedImage(uri: any): Observable<string> {
    return this.dynamicFormsService.getImageData(uri).pipe(
      map((response) => response?.data || '') // Return an empty string if response is null/undefined
    );
  }

  /**
   * parses boolean form answers and options
   *
   * @private
   * @param {*} formItem
   * @param {*} datasource
   * @returns {value} parsed formItemAnswer
   */
  private parseRadioButtonInitialValue(formItem: any, datasource: any) {
    const options = parseFormItemParametersPipeTransform(
      formItem.formItemID,
      datasource
    );

    let initialState = formItem.formItemAnswer;
    let result = initialState;

    const optionValues = options.map(({ value }) => value).map(Number);
    const hasMixedValues = optionValues.some(Number.isNaN);

    if (!hasMixedValues && options.length === 2) {
      // all values are number like and we only have 2 options
      const lowVal = Math.min(...optionValues);
      const highVal = Math.max(...optionValues);
      if (lowVal === 0 && highVal === 1) {
        // we have a boolean optionset
        if (Object.keys(booleanStringMap).includes(initialState)) {
          // the initial value is boolean
          result = booleanStringMap[initialState];
        }
      }
    }

    return result;
  }

  extractMapParms(mapString: string) {
    let tempParms = mapString.split('>')[0]?.split('?');
    if (tempParms?.length == 2) {
      let obj = this.stringToObject(tempParms[1]);
      this.getMapMarkers(obj);
    }
  }

  stringToObject(str: string): { [key: string]: string } {
    const obj: { [key: string]: string } = {};
    const pairs = str.split('&');

    pairs.forEach((pair) => {
      const [key, value] = pair.split('=');
      if (key && value) {
        obj[key.trim()] = value.trim();
      }
    });
    return obj;
  }

  getMapMarkers(mapParms: any) {
    this.advMarkers = [];
    const request: MapDataRequest = {
      objectTypeId: Number(mapParms.otid),
      objectIds: mapParms.oid,
      MapId: mapParms.mapid,
      vpMapType: mapParms.vp_map_type,
    };

    this.listpageService.getMarkerList(request).subscribe((res) => {
      if (
        res &&
        res.success &&
        res.data &&
        res.data.mapMarkers &&
        res.data.mapMarkers.length
      ) {
        this.markers = res.data.mapMarkers;
        this.loadMap();
      }
    });
  }

  loadMap() {
    this.markers.forEach((marker) => {
      const labelList = marker.goToUrl.split('Go to');
      this.objectTypeText = labelList[1].replace('</a>', '').replace(' ', '');

      const advMarker = {
        position: {
          lat: Number(marker.latitude),
          lng: Number(marker.longitude),
        },
        title: marker.name,
        info: this.getMarkerContent(marker, true),
      };

      this.advMarkers.push(advMarker);
    });
  }

  getMarkerContent(marker: Marker, isOnMap: boolean): string {
    let content = isOnMap && marker.name ? `<b>${marker.name}</b>` : '';
    content += !isOnMap && marker.address1 ? marker.address1 : '';
    content += isOnMap && marker.address1 ? `<br>${marker.address1}` : '';
    content += marker.address2 ? `<br>${marker.address2}` : '';
    content += marker.country ? `<br>${marker.country}` : '';
    content += marker.redirectorUrl
      ? `<br><a [routerLink]="[${marker.redirectorUrl}]">${this.objectTypeText}</a>`
      : '';

    return content;
  }

  private sanitizedHtmlMap = new Map<string, any>();
  private processedItems = new Set<string>();
  transform(
    value: any | null,
    key: string,
    dataTypeID: number,
    numDecimals: string
  ) {
    if (!value) return null;

    if (dataTypeID == DataType.CURRENCY) {
      return formatCurrency(value, 'en-US', '$', '1.2-2').replace(
        /2/gi,
        numDecimals ? numDecimals : '0'
      );
    }

    const strValue = value.toString().toLowerCase();
    if (
      !strValue.includes('img src') &&
      !strValue.includes('a target') &&
      !strValue.includes('a href')
    ) {
      return value;
    }

    if (this.processedItems.has(key)) {
      return this.sanitizedHtmlMap.get(key);
    }

    // Sanitize and store
    const sanitizedValue = this.sanitized.bypassSecurityTrustHtml(value);
    this.sanitizedHtmlMap.set(key, sanitizedValue);
    this.processedItems.add(key);

    return sanitizedValue;
  }

  getAccessibleReadOnlyText(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const html = String(value);
    const textContainer = document.createElement('div');
    textContainer.innerHTML = html;

    return (textContainer.textContent || textContainer.innerText || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  getAccessibleFieldValue(value: any): string {
    const text = this.getAccessibleReadOnlyText(value);
    return text.length ? text : 'No value';
  }

  isHtmlContent(value: any): boolean {
    if (!value) return false;
    const str = value.toString().toLowerCase();
    return (
      str.includes('a href') ||
      str.includes('a target') ||
      str.includes('img src')
    );
  }

  // leaving this here till we know more about section groups
  getFormSectionGroupId(sectionGroup) {
    // this format is driven by the API
    return `dynamic-form_section_group_${sectionGroup.sectionGroupId}`;
  }

  getMatchingItem(dataField) {
    if (
      typeof this.selectRenderFormData === 'undefined' ||
      this.selectRenderFormData === null
    ) {
      return null;
    }
    const matchingItem = this.selectRenderFormData.find(
      (item) => item.formItemID === dataField.toString()
    );

    return matchingItem ? matchingItem : null;
  }

  onKeyDownonLabel(e: any, formItemID: number) {
    if (e.key == 'Enter') {
      this.openLabelLink(formItemID);
    }
  }

  openLabelLink(formItemID: number) {
    if (!this.isSuperUser) return;

    const url = `/Forms/admin/formitemAE.asp?fFormItemID=${formItemID}`;
    window.open(url, '_blank');
  }

  onContentReady() {
    const card = document.getElementById('Lease_ParentLink');
    const widget = document.getElementById('Widget_Lease_ParentLink');

    if (widget) {
      if (widget.getElementsByClassName('dx-datagrid-nodata'))
        widget.parentElement.remove();

      if (!card.getElementsByClassName('df-formSection-field').length)
        card.remove();
    }

    let focusable = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable[focusable.length - 2].addEventListener('focus', (e) => {
      if (!document.getElementById(this.lastSection)) {
        this.loadNextSections.emit();
      }
    });
  }

  onDecimalValueChanged(e, numDecimals: number, formItemId: any) {
    if (!isTruthy(e)) return;

    if (!isTruthy(numDecimals)) {
      numDecimals = 0;
    }

    const parts = e.split('.');
    if (parts.length == 1) return;

    if (parts.length == 2 && parts[1].length > numDecimals) {
      this.subs.add(
        this.dialogService
          .alert(
            'Invalid Form Items',
            `Please enter a number with up to ${numDecimals} decimal places. Please try again.`,
            'OK'
          )
          .subscribe((res) => {
            if (res) {
              this.getFormItem(formItemId.toString())?.setValue('');
            }
          })
      );
    }
  }

  getFormItem(itemId: string) {
    if (this.form.contains(itemId)) {
      return this.form.get(itemId);
    }
    for (const itemName in this.form.controls) {
      const item = this.form.get(itemName);
      if (item instanceof FormGroup) {
        if (item.contains(itemId)) {
          return item.get(itemId);
        }
      }
    }
    return null;
  }

  getInitialHepTextInfo(controlData) {
    this.controlInfoHistData.helpTextSubject =
      controlData.name?.formItemSectionDetail?.formItemLabel;
    this.controlInfoHistData.helpTextText = controlData?.name?.helpText;
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  getFieldHistoryData(controlData) {
    this.controlInfoHistData.helpTextHistory = [];
    this.subs.add(
      this.dynamicFormsService
        .getChangeHistory(
          controlData.name.formItemSectionDetail.formItemID,
          this.objectId,
          this.objectTypeId
        )
        .pipe(
          take(1),
          tap((res) => {
            if (res && res.success) {
              this.controlInfoHistData.helpTextHistory = res.data.length
                ? res.data
                : [];
            }
          })
        )
        .subscribe()
    );
  }

  openFormBehaviorsModal() {
    const dialogRef = this.dialog.open(DynamicFormBehaviorsComponent, {
      minWidth: '50vw',
      maxWidth: '100vw',
      width: '55vw',
      maxHeight: 'auto',
      data: {
        renderFormData: this.selectRenderFormData,
        formID: this.formId,
        formSectionID: this.section?.formSectionID,
        objectID: this.objectId,
        objectTypeID: this.objectTypeId,
        formSectionName: this.section?.formSectionName,
      },
    });
    dialogRef.afterClosed();
  }

  handleBehavior(
    requestTypeID,
    formItemInput1ID,
    formItemInput2ID,
    formItemOutputID,
    behaviorTypeID,
    e,
    dropdownBlankOption = undefined
  ) {
    if (formItemInput1ID == 0 || !e || e.length == 0) return;

    if (behaviorTypeID == BehaviorType.SetCompletedDate) {
      this.setCompletedDate(formItemOutputID, e[0].value);
    } else if (behaviorTypeID == BehaviorType.CalcDateDifference) {
      this.calcDateDifference(
        formItemInput1ID,
        formItemInput2ID,
        formItemOutputID,
        e
      );
    } else if (
      behaviorTypeID == BehaviorType.CallToogleTextList ||
      behaviorTypeID == BehaviorType.DisplayNewItems
    ) {
      this.populateBehaviorDropdown(
        requestTypeID,
        formItemInput1ID,
        formItemInput2ID,
        formItemOutputID,
        behaviorTypeID,
        e[0].value,
        dropdownBlankOption
      );
    }
  }

  calcDateDifference(
    formItemInput1ID: number,
    formItemInput2ID: number,
    formItemOutputID: number,
    e
  ) {
    let valInput1 = this.getFormItem(formItemInput1ID.toString())?.value;
    let valInput2 = this.getFormItem(formItemInput2ID.toString())?.value;

    if (!valInput1 || !valInput2) return;
    let inputDate1 =
      typeof valInput1 === 'string' ? this.parseDate(valInput1) : valInput1;
    let inputDate2 =
      typeof valInput2 === 'string' ? this.parseDate(valInput2) : valInput2;

    if (inputDate1 > inputDate2) {
      this.getFormItem(formItemOutputID.toString())?.patchValue('');
      this.dialogService.alert(
        'Invalid Dates',
        `Commencement Date must come before the Expiration Date.`,
        'OK'
      );
    } else {
      let dateDiff = this.dateDifference(inputDate1, inputDate2);
      setTimeout(() => {
        this.getFormItem(formItemOutputID.toString())?.patchValue(dateDiff);
      });
    }
  }

  dateDifference(date1, date2) {
    const start = new Date(date1);
    const end = new Date(date2);
    end.setDate(end.getDate() + 1); //Adjust enddate 1 day ahead to include input date logic - V06 logic

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months--;
      const lastDayOfMonth = new Date(
        end.getFullYear(),
        end.getMonth(),
        0
      ).getDate();
      days += lastDayOfMonth;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    let dates = [
      this.getValue(years, 'year'),
      this.getValue(months, 'month'),
      this.getValue(days, 'day'),
    ];
    let dateString = dates.filter(Boolean).join(', ');

    return dateString;
  }

  getValue(val, ymd) {
    return val <= 0 ? '' : val == 1 ? '1 ' + ymd : val + ' ' + ymd + 's';
  }

  parseDate(dateString) {
    if (dateString.length && dateString.length == 10) {
      if (dateString.split('/')[0].length == 4) {
        const [year, month, day] = dateString.split('/').map(Number);
        return new Date(year, month - 1, day); // month is 0-indexed
      } else {
        const [month, day, year] = dateString.split('/').map(Number);
        return new Date(year, month - 1, day); // month is 0-indexed
      }
    } else {
      this.dialogService.alert(
        'Unknown Date Format',
        `Date Format could not be determined - ${dateString}`,
        'OK'
      );
    }
  }

  private notifyErrorMessage(errorMessage: string) {
    this.toastService.show(errorMessage, 'Error', ToastState.ERROR, {
      position: 'bottom right',
      maxWidth: '350px',
    });
  }

  changeFormItemType(
    formItemID: number,
    formItemType: string,
    formItemTypeID: number
  ) {
    this.tempList.forEach((col) => {
      let formItem = col.listOfFields.find((f) => f.formItemID == formItemID);
      if (formItem && formItem.formItemType.formItemType != formItemType) {
        formItem.formItemType.formItemType = formItemType;
        formItem.formItemType.formItemTypeID = formItemTypeID;
        formItem.formItemTypeID = formItemTypeID;
      }
    });
  }

  setCompletedDate(formItemOutputID: number, formItemValue: any) {
    if (formItemValue == 3) {
      let dateValue = formatDate(new Date(), 'MM/dd/yyyy', 'en-US');
      this.getFormItem(formItemOutputID.toString())?.setValue(
        dateValue.toString()
      );
    } else {
      this.getFormItem(formItemOutputID.toString())?.setValue('');
    }
  }

  private populateBehaviorDropdown(
    requestTypeID: number,
    formItemInput1ID: number,
    formItemInput2ID: number,
    formItemOutputID: number,
    behaviorTypeID: number,
    formItemValue: any,
    dropdownBlankOption: string
  ): void {
    if (requestTypeID === 0) return;

    const [valueIndex, displayIndex] = renderSelectFields[requestTypeID] || [];
    if (valueIndex === undefined || displayIndex === undefined) return;

    const isToogleTextList = behaviorTypeID === BehaviorType.CallToogleTextList;
    this.subs.add(
      this.formWizardService
        .getRenderSelect(formItemValue, requestTypeID)
        .subscribe({
          next: (res) => {
            if (!res?.success) {
              this.notifyErrorMessage(
                'There was an issue loading details. Please review and try again.'
              );
              return;
            }

            if (isToogleTextList) {
              if (res.data.length === 0) {
                this.changeFormItemType(formItemOutputID, 'Text Field', 2);
              } else {
                this.changeFormItemType(formItemOutputID, 'List Box', 1);
              }
            }

            const dropdownOptions = this.buildDropdownOptions(
              res.data,
              valueIndex,
              displayIndex,
              dropdownBlankOption
            );
            this.dropdownValues$ = this.dropdownValues$.pipe(
              map((dropdownMap) => {
                dropdownMap[formItemOutputID] = dropdownOptions;
                return dropdownMap;
              })
            );
          },
          error: (err) => {
            this.notifyErrorMessage(
              'There was an error loading details. Please review and try again.'
            );
            console.error('Error occurred while loading render selects:', err);
          },
        })
    );
  }

  private getBehaviorDropdownObservables(dropdowns): any[] {
    const observables = [];
    this.tempList.forEach((col) => {
      col.listOfFields.forEach((field) => {
        if (
          field.formItemID !== field.formItemInput1ID ||
          field.requestTypeID === 0
        )
          return;

        const formItemData = this.getMatchingItem(field.formItemID);
        if (!formItemData?.formItemAnswer) return;

        const [valueIndex, displayIndex] =
          renderSelectFields[field.requestTypeID] || [];
        if (valueIndex === undefined || displayIndex === undefined) return;

        const isToogleTextList =
          field.behaviorTypeID === BehaviorType.CallToogleTextList;
        const obs$ = this.formWizardService
          .getRenderSelect(formItemData.formItemAnswer, field.requestTypeID)
          .pipe(
            tap((res) => {
              if (res.success) {
                if (isToogleTextList) {
                  if (res.data.length === 0) {
                    this.changeFormItemType(
                      field.formItemOutputID,
                      'Text Field',
                      2
                    );
                  } else {
                    this.changeFormItemType(
                      field.formItemOutputID,
                      'List Box',
                      1
                    );
                  }
                }

                const dropdownOptions = this.buildDropdownOptions(
                  res.data,
                  valueIndex,
                  displayIndex,
                  field.dropdownBlankOption
                );
                dropdowns[field.formItemOutputID] = dropdownOptions;
              } else {
                this.notifyErrorMessage(
                  'There was an issue loading details. Please review and try again.'
                );
              }
            }),
            catchError((err) => {
              this.notifyErrorMessage(
                'There was an error loading details. Please review and try again.'
              );
              console.error(
                'Error occurred while loading render selects:',
                err
              );
              return of(null); // continue with other observables
            })
          );
        observables.push(obs$);
      });
    });
    return observables;
  }

  private buildDropdownOptions(
    data: any[],
    valueIndex: number,
    displayIndex: number,
    dropdownBlankOption: string
  ): { value: string; display: string; redirector: string }[] {
    const options = data.map((item) => {
      const keys = Object.keys(item);
      const valueKey = keys[valueIndex] || '';
      const displayKey = keys[displayIndex] || '';
      return {
        value: item[valueKey].toString() ?? '',
        display: item[displayKey].toString() ?? '',
        redirector: '',
      };
    });

    if (dropdownBlankOption?.toLowerCase() === 'true') {
      options.unshift({ value: '', display: '', redirector: '' });
    }

    return options;
  }
}
