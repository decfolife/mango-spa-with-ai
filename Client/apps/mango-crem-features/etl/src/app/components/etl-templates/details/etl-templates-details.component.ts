import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ETLService } from '@etl/services/etl.service';
import { Observable, Subscription, of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { DevExpressModule } from 'libs/ui-shared/lib-external-libraries/src/lib/3rdParty/dev-express.module';
import { SearchModule } from '@mango/ui-shared/cosmos';
import {
  CremFormsModule,
  DropdownModule,
  ButtonModule,
  LoaderModule,
  IconModule,
  LibUiElementsModule,
  ModalModule,
  DatePickerModule,
  InputComponent,
  CremRadioGroupComponent,
  CremRadioComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SharedLeftNavLink } from '@mango/data-models/lib-data-models';
import { TemplateTypes } from '@etl/model/template-types';
import { TemplateType } from '@etl/model/template-type-dto';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ITemplate } from '@etl/model/template-edit';
import { debounceTime, filter, map, tap } from 'rxjs/operators';
import * as _ from 'lodash';

import { FormInfo } from '@etl/model/form-info';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CheckBoxComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/checkbox';
import { DataGridQueryDto } from '@etl/model/data-grid-query-dto';
import notify from 'devextreme/ui/notify';
import { notZeroValidator } from '@etl/validators/formid-validator';
import { ExportDevexDatagridService } from '@mango/core-shared';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { GenericErrorComponent } from '@etl/components/genericError/genericError.component';

@Component({
  selector: 'mango-etl-templates-details',
  standalone: true,
  templateUrl: './etl-templates-details.component.html',
  styleUrls: ['./etl-templates-details.component.scss'],
  providers: [ExportDevexDatagridService],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CremFormsModule,
    InputComponent,
    ButtonModule,
    DropdownModule,
    DatePickerModule,
    LoaderModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatCardModule,
    MatDividerModule,
    DevExpressModule,
    NgxSkeletonLoaderModule,
    SearchModule,
    IconModule,
    MatIconModule,
    MatMenuModule,
    LibUiElementsModule,
    ModalModule,
    CremRadioGroupComponent,
    CremRadioComponent,
    CheckBoxComponent,
  ],
})
export class EtlTemplatesDetailsComponent implements OnInit, OnDestroy {
  @ViewChild('DataGrid', { static: false }) dataGrid: DxDataGridComponent;
  componentName = 'etl-template-edit';
  private subs: Subscription = new Subscription();
  isLoading = true;
  isFirstLoad = true;
  isResettingForm: boolean = false;
  dataRetrieved: boolean = false;
  isSaving = false;
  isKeyFieldLoading = true;
  isFormIdRequired: boolean;
  templateId: number;
  templateDetails: ITemplate;
  columns = [];
  forms: { formID: number; formName: string }[] = [];
  keyFields: { dataValueField: string; dataTextField: string }[] = [];
  gridData: any;
  parentLookups: { dataColumn: string }[] = [];
  parentObjects: { dataColumn: string }[] = [];
  templateTypes: any;
  objectTypeTemplates: { id: number; name: string }[] = [];
  selectedTemplateType: number;
  hasTypeError: boolean;
  userMessage = '';
  isUpdateOnlyVisible = false;
  isReadOnlyVisible = false;
  isIncludedColumnVisible: boolean = false;
  selectAllChecked = true;
  hasMultipleParentObjects = false;

  dataSource: any;
  initialData: any;

  templateForm: FormGroup;
  formInfo: FormInfo;

  constructor(
    private route: ActivatedRoute,
    @Inject(ETLService) public etlService: ETLService,
    public exportToExcelService: ExportDevexDatagridService,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.templateId = +params['id'];
    });

    this.setupTemplatesForm();
    this.updateLeftNav();
    this.subscribeToFormChanges();

    this.subs.add(
      this.etlService.getETLRight().subscribe((result) => {
        if (result.success) {
          if (result.data === true) {
            this.load();
          }
        } else {
          this.handleError(result.errorMessage);
        }
      })
    );
  }

  load() {
    if (this.templateId === 0) {
      this.initializeNewTemplate();
    } else {
      const loadTemplateSub = this.etlService
        .getTemplateDetails(this.templateId)
        .subscribe((result) => {
          if (result.success) {
            this.templateDetails = result.data;
            this.templateDetails.formId = this.templateDetails.formId ?? 0;
            this.setTemplateValues(this.templateDetails);

            if (this.templateDetails.formId === 0) {
              this.isFormIdRequired = false;
              const objectTypeSub = this.etlService
                .getObject(this.templateDetails.objectTypeId)
                .subscribe((result) => {
                  if (result?.success) {
                    this.templateDetails.objectType = result.data.objectType;
                  } else {
                    this.handleError(result.errorMessage);
                  }
                });
              this.subs.add(objectTypeSub);
              this.loadObjectTypeTemplate();
              this.checkUpdateOnlyVisibility();
              this.checkReadOnlyVisibility();
            } else {
              this.isFormIdRequired = true;
              this.loadFormDetails();
            }

            this.loadForms();
            this.loadKeyField();
            this.loadParentDetails();
            this.loadImportTemplateTypes();
            this.loadGrid();
            this.onFormChange();
            this.isLoading = false;
            this.subscribeToAllFormControls();
          } else {
            this.handleError(result.errorMessage);
          }
        });
      this.subs.add(loadTemplateSub);
    }
  }

  initializeNewTemplate() {
    this.isFormIdRequired = true;
    this.templateDetails = ITemplate.createDefaultTemplate();
    this.setTemplateValues(this.templateDetails);
    this.loadImportTemplateTypes();
    this.loadObjectTypeTemplate();
    this.loadForms();
    this.loadGrid();
    this.onFormChange();
    this.dataRetrieved = true;
    this.isLoading = false;
    this.isKeyFieldLoading = false;
    this.isIncludedColumnVisible = true;
    this.isUpdateOnlyVisible = true;
    this.isReadOnlyVisible = true;
    this.subscribeToAllFormControls();
  }

  // Setup the FormGroup
  setupTemplatesForm() {
    this.templateForm = new FormGroup({
      templateId: new FormControl(0),
      templateName: new FormControl('', [
        Validators.required,
        Validators.maxLength(256),
      ]),
      templateTypeId: new FormControl(0),
      formId: new FormControl(0, [Validators.required, notZeroValidator()]),
      objectTypeId: new FormControl(),
      objectTypeTypeId: new FormControl(0),
      parentObjectTypeId: new FormControl(),
      parentLookupValue: new FormControl(''),
      parentObjectText: new FormControl(''),
      updateOnly: new FormControl(false),
      isReadOnly: new FormControl(false),
      keyField: new FormControl(null, [Validators.required]),
      keyFieldDisplayName: new FormControl(''),
      isImportForAccounting: new FormControl(false),
      isImportForFinancials: new FormControl(false),
      isLocked: new FormControl(false),
      gridColumns: new FormArray([]),
    });
  }

  subscribeToFormChanges(): void {
    this.subs.add(this.onKeyFieldChange().subscribe());
    this.subs.add(this.onParentLookupValueChange().subscribe());
    this.subs.add(this.onTemplateNameChange().subscribe());
    this.subs.add(this.onImportTemplateTypeChange().subscribe());
    this.subs.add(this.onFormSelectionChange().subscribe());
    this.subs.add(this.onParentObjectChange().subscribe());
    this.subs.add(this.onObjectTypeTemplateChange().subscribe());
  }

  // Subscribe to all form controls
  subscribeToAllFormControls() {
    Object.keys(this.templateForm.controls).forEach((controlName) => {
      this.subscribeToFormControl(controlName);
    });
  }

  // Subscribe to a single form control value change
  subscribeToFormControl(controlName: string) {
    const control = this.templateForm.get(controlName);
    if (control) {
      const subscription = control.valueChanges.subscribe((value) => {
        this.templateDetails[controlName] = value;
      });
      this.subs.add(subscription);
    }
  }

  // Display the correct left nav items
  updateLeftNav() {
    setTimeout(() => {
      this.setCustomLeftNav(this.getTemplatesLeftNavData());
    });
  }

  // Listen to any Form Changes
  onFormChange() {
    this.templateForm.valueChanges
      .pipe(debounceTime(300))
      .subscribe((change) => {
        if (!this.isFormDirty()) {
          this.templateForm.markAsPristine();
        }
      });
  }

  // Listen to any Key Field Changes
  onKeyFieldChange(): Observable<any> {
    return this.templateForm.get('keyField').valueChanges.pipe(
      filter((data) => !!data && !this.isFirstLoad && !this.isResettingForm),
      map((data) =>
        this.keyFields.find((field) => field.dataValueField === data)
      ),
      filter((foundKeyField) => !!foundKeyField),
      tap((selectedKeyField) => {
        this.dataRetrieved = false;
        this.templateDetails.keyField = selectedKeyField.dataValueField;
        this.templateForm
          .get('keyFieldDisplayName')
          .setValue(
            this.templateDetails.templateTypeId === TemplateTypes.Forms &&
              selectedKeyField.keyFieldSelectedItemText
              ? selectedKeyField.keyFieldSelectedItemText
              : selectedKeyField.dataTextField
          );
        this.loadGrid();
      })
    );
  }

  // Listen to any Object Type Template Change.
  onObjectTypeTemplateChange(): Observable<any> {
    return this.templateForm.get('objectTypeTypeId').valueChanges.pipe(
      filter(
        (data) =>
          !!data &&
          !this.isFirstLoad &&
          this.templateDetails.templateTypeId === TemplateTypes.DocumentMapping
      ),
      debounceTime(500),
      tap((objectTemplateType) => {
        //There must be a way of doing this without resorting to a switch...
        let parentObjectName: string = '';
        switch (objectTemplateType) {
          case 1:
            parentObjectName = 'Project';
            break;
          case 2:
            parentObjectName = 'Store';
            break;
          case 3:
            parentObjectName = 'Building';
            break;
          case 4:
            parentObjectName = 'Lease';
            break;
        }
        this.templateForm.get('parentObjectText').setValue(parentObjectName);

        this.getParentLookupValues();
      })
    );
  }

  // Listen to any Parent Lookup dropdown Changes
  onParentLookupValueChange(): Observable<any> {
    return this.templateForm.get('parentLookupValue').valueChanges.pipe(
      filter(
        (data) =>
          !!data &&
          !this.isFirstLoad &&
          !this.isResettingForm &&
          this.dataRetrieved
      ),
      map((data) =>
        this.parentLookups.find((field) => field.dataColumn === data)
      ),
      filter((foundParent) => !!foundParent),
      tap((selectedObject) => {
        this.dataRetrieved = false;
        this.templateDetails.parentLookupValue = selectedObject.dataColumn;
        this.loadGrid();
      })
    );
  }

  // Listen to any template name Changes
  onTemplateNameChange(): Observable<any> {
    return this.templateForm.get('templateName').valueChanges.pipe(
      filter((data) => !!data && !this.isFirstLoad),
      debounceTime(500),
      tap((templateName) => {
        this.checkTemplateName(templateName);
      })
    );
  }

  // Listen to any template type Changes
  onImportTemplateTypeChange(): Observable<any> {
    return this.templateForm.get('templateTypeId').valueChanges.pipe(
      filter((_) => !this.isFirstLoad && !this.isResettingForm),
      tap((templateTypeId) => {
        if (
          templateTypeId === TemplateTypes.DocumentMapping ||
          templateTypeId === TemplateTypes.Notes
        )
          this.hasMultipleParentObjects = true;
        else this.hasMultipleParentObjects = false;

        this.setByTemplateType(templateTypeId);
        this.setFormIdValidators(templateTypeId);
      })
    );
  }

  // Listen to any Form dropdown changes
  onFormSelectionChange(): Observable<any> {
    return this.templateForm.get('formId').valueChanges.pipe(
      filter((data) => !!data && !this.isFirstLoad && !this.isResettingForm),
      tap((formId) => {
        setTimeout(() => {
          this.resetSpecificTemplateDetails();
          this.isResettingForm = true;
          this.templateForm.get('formId').setValue(formId);
        });

        this.subs.add(
          this.etlService
            .getForm(formId)
            .pipe()
            .subscribe((result) => {
              if (result.success) {
                this.dataRetrieved = false;
                this.isKeyFieldLoading = true;
                this.formInfo = result.data;
                this.templateDetails.formId = result.data.formID;
                this.templateForm
                  .get('objectTypeId')
                  .setValue(result.data.objectTypeID);
                this.templateForm
                  .get('objectTypeTypeId')
                  .setValue(result.data.objectTypeTypeID);
                this.templateDetails.objectType = this.formInfo.objectType;
                this.templateDetails.canEdit = true;
                this.isIncludedColumnVisible = true;
                this.loadObjectTypeTemplate();

                this.templateForm.get('keyField').setValue('none');
                this.templateForm.get('keyField').enable();
                this.templateForm.get('parentLookupValue').enable();

                this.subs.add(
                  this.etlService
                    .getKeyField(
                      this.templateDetails.formId ?? 0,
                      this.templateDetails.objectTypeId,
                      this.templateDetails.keyField,
                      this.templateDetails.templateTypeId,
                      this.templateDetails.updateOnly
                    )
                    .subscribe((result) => {
                      if (result.success) {
                        this.keyFields = result.data;

                        const containsSourceImportID = this.keyFields.find(
                          (field) => field.dataValueField === 'SourceImportID'
                        );
                        if (containsSourceImportID) {
                          this.templateForm
                            .get('keyField')
                            .setValue('SourceImportID');
                          this.templateForm
                            .get('keyFieldDisplayName')
                            .setValue('SourceImportID');
                        }
                        this.loadGrid();
                        this.isResettingForm = false;
                      } else {
                        this.handleError(result.errorMessage);
                      }
                      this.isKeyFieldLoading = false;
                    })
                );
                this.loadParentDetails();
              } else {
                this.handleError(result.errorMessage);
              }
            })
        );
      })
    );
  }

  // For Notes only and DocumentImport
  // Listen to if the parent object dropdown changes
  onParentObjectChange(): Observable<any> {
    return this.templateForm.get('parentObjectTypeId').valueChanges.pipe(
      filter((data) => !!data && !this.isFirstLoad),
      tap((parentObjectTypeId) => {
        this.templateDetails.parentObjectTypeId = parentObjectTypeId;
        this.getParentLookupValues();
      })
    );
  }

  isFormDirty(): boolean {
    const currentFormValue = this.templateForm.getRawValue();
    return (
      JSON.stringify(this.initialData) !== JSON.stringify(currentFormValue)
    );
  }

  loadParentDetails() {
    this.subs.add(
      this.etlService
        .getParent(
          this.templateDetails.objectTypeId,
          this.templateDetails.formId
        )
        .subscribe((result) => {
          if (result.success) {
            if (result.data === 'No Parent for this type') {
              // no parent object for these types
              this.templateForm.get('parentObjectText').setValue('None');
              this.parentLookups.push({ dataColumn: 'None' });
              this.templateForm.get('parentLookupValue').setValue('None');
              this.templateForm.get('parentLookupValue').disable();
            } else if (
              result.data.clienterrormessage ===
              'Selected Form is not configured correctly for ETL - Widget required.'
            ) {
              // TODO: show error to user
              console.error('message to user that invalid form');
            } else {
              if (
                this.templateDetails.templateTypeId !== TemplateTypes.Notes &&
                this.templateDetails.templateTypeId !==
                  TemplateTypes.DocumentMapping
              ) {
                this.parentLookups = result.data.lookupData;
                this.templateForm
                  .get('parentObjectText')
                  .setValue(result.data.parentObject.objectType);
                this.templateForm
                  .get('parentObjectTypeId')
                  .setValue(result.data.parentObject.objectTypeID);

                if (this.templateDetails.parentLookupValue == '') {
                  const containsSourceImportID = this.parentLookups.find(
                    (field) => field.dataColumn === 'SourceImportID'
                  );
                  if (containsSourceImportID) {
                    this.templateForm
                      .get('parentLookupValue')
                      .setValue('SourceImportID');
                    this.templateDetails.parentLookupValue = 'SourceImportID';
                  }
                }
              } else {
                this.hasMultipleParentObjects = true;
                this.parentObjects = result.data.lookupData;
                this.getParentLookupValues();
              }
            }

            if (this.isFirstLoad) {
              if (this.templateDetails.isLocked) {
                setTimeout(() => {
                  this.lockFields();
                });
              }

              if (this.templateDetails.updateOnly) {
                setTimeout(() => {
                  this.parentLookups.push({ dataColumn: 'None' });
                  this.templateForm.get('parentLookupValue').setValue('None');
                  this.templateForm.get('parentLookupValue').disable();
                  this.isUpdateOnlyVisible = true;
                });
              }
              this.configEditFields(this.templateDetails.canEdit);
            }
          } else {
            this.handleError(result.errorMessage);
          }
        })
    );
  }

  loadFormDetails() {
    if (this.templateDetails.formId > 0) {
      // Get the Form Details
      this.subs.add(
        this.etlService
          .getForm(this.templateDetails.formId)
          .subscribe((result) => {
            if (result.success) {
              this.formInfo = result.data;
              this.templateDetails.objectType = this.formInfo.objectType;
              this.loadObjectTypeTemplate();
              this.isUpdateOnlyVisible = true;
              this.isIncludedColumnVisible = true;
            } else {
              this.handleError(result.errorMessage);
            }
          })
      );
    }
  }

  loadForms(): void {
    this.subs.add(
      this.etlService.getForms().subscribe((result) => {
        if (result.success) {
          this.forms = result.data;
          if (this.templateDetails.templateTypeId !== TemplateTypes.Forms) {
            setTimeout(() => {
              this.forms.push({ formID: 0, formName: 'None' });
              this.templateForm.get('formId').setValue(0);
              this.templateForm.get('formId').disable();
            });
          }
        } else {
          this.handleError(result.errorMessage);
        }
      })
    );
  }

  loadImportTemplateTypes() {
    this.subs.add(
      this.etlService.getETLTemplateTypes().subscribe((result) => {
        if (result.success) {
          this.templateTypes = result.data;
        } else {
          this.handleError(result.errorMessage);
        }
      })
    );
  }

  loadKeyField() {
    this.subs.add(
      this.etlService
        .getKeyField(
          this.templateDetails.formId ?? 0,
          this.templateDetails.objectTypeId,
          this.templateDetails.keyField,
          this.templateDetails.templateTypeId,
          this.templateDetails.updateOnly
        )
        .subscribe((result) => {
          if (result.success) {
            this.keyFields = result.data;
          } else {
            this.handleError(result.errorMessage);
          }
          this.isKeyFieldLoading = false;
        })
    );
  }

  lockFields() {
    this.templateForm.get('templateName').disable();
    this.templateForm.get('templateTypeId').setValue(-1);
    this.templateForm.get('templateTypeId').disable();
    this.templateForm.get('formId').setValue(-1);
    this.templateForm.get('formId').disable();

    this.templateForm.get('objectTypeTypeId').setValue(-1);
    this.templateForm.get('objectTypeTypeId').disable();
    this.templateForm.get('keyField').setValue('');
    this.templateForm.get('keyField').disable();
    this.templateForm.get('updateOnly').disable();
    this.templateForm.get('isImportForAccounting').disable();
    this.templateForm.get('isImportForFinancials').disable();
  }

  loadGrid() {
    if (
      this.templateDetails.templateTypeId === TemplateTypes.Forms &&
      this.templateDetails.formId === 0
    ) {
      if (this.isFirstLoad) {
        this.initialData = this.templateForm.value;
        this.isFirstLoad = false;
      }
      this.dataRetrieved = true;
      return;
    }

    let data = new DataGridQueryDto();
    data.objectTypeId = this.templateDetails.objectTypeId;
    data.formId = this.templateDetails.formId ?? 0;
    data.initialDataFormId = this.isFirstLoad
      ? this.templateDetails.formId
      : this.initialData?.formId ?? 0;
    data.templateId = this.templateDetails.templateId;
    data.templateTypeId = this.templateDetails.templateTypeId;
    data.objectTypeTypeId = this.templateDetails.objectTypeTypeId;
    data.keySourceColumn = this.templateDetails.keyField;
    data.parentKeySourceColumn = this.templateDetails.parentLookupValue;
    data.updateOnly = this.templateDetails.updateOnly;
    data.keyFieldDisplayName = this.templateDetails.keyFieldDisplayName;

    if (
      this.templateDetails.templateTypeId === 0 &&
      this.templateDetails.templateId === 0 &&
      this.templateDetails.formId === 0
    ) {
      return;
    }

    this.etlService.getDataGridFields(data).subscribe((result) => {
      if (result.success) {
        this.gridData = result.data;
        if (
          !data.updateOnly &&
          this.templateDetails.parentLookupValue === 'SourceImportID' &&
          this.gridData.some((item) => item.required === 'Parent Key Field') &&
          this.templateDetails.templateTypeId !== TemplateTypes.DocumentMapping
        ) {
          // Remove existing "Parent Key Field"
          this.gridData = this.gridData.filter(
            (item) => item.required !== 'Parent Key Field'
          );

          // Add the new "Parent Key Field"
          this.gridData.splice(1, 0, {
            required: 'Parent Key Field',
            dataType: 'Text <= 100',
            displayLabel: this.templateDetails.parentLookupValue,
            included: true,
          });
        }

        this.gridData = this.gridData.map((rowData) => {
          return {
            ...rowData,
            hideCheckbox: this.shouldHideCheckbox(rowData),
          };
        });

        this.initializeGridColumns(this.gridData);

        if (this.isFirstLoad) {
          this.initialData = this.templateForm.value;
          this.isFirstLoad = false;
        }

        setTimeout(() => {
          this.dataRetrieved = true;
        });
      } else {
        this.handleError(result.errorMessage);
      }
    });
  }

  initializeGridColumns(gridData: any[]) {
    const gridColumnsFormArray = this.templateForm.get(
      'gridColumns'
    ) as FormArray;

    gridColumnsFormArray.clear();
    const columns: any[] = [];
    gridData.forEach((item, index) => {
      gridColumnsFormArray.push(
        new FormGroup({
          include: new FormControl(item.included || false),
          required: new FormControl(item.required || ''),
          formItemId: new FormControl(item.formItemId || ''),
          displayLabel: new FormControl(item.displayLabel || ''),
          controlType: new FormControl(item.controlType || ''),
          dataType: new FormControl(item.dataType || ''),
          helpText: new FormControl(item.helpText || ''),
        })
      );
      columns.push({
        dataField: item.dataField,
        caption: item.caption,
        width: item.width,
      });
    });

    // Update grid columns
    this.columns = columns;
  }

  onSelectAllChanged(e: any) {
    const selectAllChecked = e.value;
    const gridColumnsFormArray = this.templateForm.get(
      'gridColumns'
    ) as FormArray;

    this.gridData.forEach((item: any, rowIndex) => {
      if (!item.hideCheckbox) {
        item.included = selectAllChecked;
        const control = gridColumnsFormArray
          .at(rowIndex)
          .get('include') as FormControl;

        control.setValue(selectAllChecked);

        if (
          this.initialData?.gridColumns &&
          this.initialData.gridColumns[rowIndex]
        ) {
          const originalValue = this.initialData.gridColumns[rowIndex].include;
          if (selectAllChecked === originalValue) {
            control.markAsPristine();
          } else {
            control.markAsDirty();
          }
        } else {
          control.markAsDirty();
        }
      }
    });
  }

  onCheckboxValueChanged(rowIndex: number, $event: any): void {
    const gridColumnsFormArray = this.templateForm.get(
      'gridColumns'
    ) as FormArray;
    const control = gridColumnsFormArray.at(rowIndex).get('include');

    control.setValue($event.value);

    if (
      this.initialData?.gridColumns &&
      this.initialData.gridColumns[rowIndex]
    ) {
      const originalValue = this.initialData.gridColumns[rowIndex].include;
      if (control.value === originalValue) {
        control.markAsPristine();
      } else {
        control.markAsDirty();
      }
    } else {
      // If initialData.gridColumns is not defined, still mark control as dirty
      control.markAsDirty();
    }
  }

  resetSpecificTemplateDetails() {
    const defaultTemplate = ITemplate.createDefaultTemplate();

    this.templateDetails.objectTypeId = defaultTemplate.objectTypeId;
    this.templateDetails.objectTypeTypeId = defaultTemplate.objectTypeTypeId;
    this.templateDetails.keyField = defaultTemplate.keyField;
    this.templateDetails.formId = defaultTemplate.formId;
    this.templateDetails.parentObjectTypeId =
      defaultTemplate.parentObjectTypeId;
    this.templateDetails.parentLookupValue = defaultTemplate.parentLookupValue;
    this.templateDetails.parentObjectText = defaultTemplate.parentObjectText;
    this.templateDetails.keyFieldDisplayName =
      defaultTemplate.keyFieldDisplayName;
    this.templateDetails.relationshipDefinitionID =
      defaultTemplate.relationshipDefinitionID;
    this.templateDetails.formItemListID = defaultTemplate.formItemListID;
    this.templateDetails.updateOnly = defaultTemplate.updateOnly;
    this.templateDetails.isReadOnly = defaultTemplate.isReadOnly;
    this.templateDetails.setReadOnlyBy = defaultTemplate.setReadOnlyBy;
    this.templateDetails.setReadOnlyByContactName =
      defaultTemplate.setReadOnlyByContactName;
    this.templateDetails.isImportForAccounting =
      defaultTemplate.isImportForAccounting;
    this.templateDetails.isImportForFinancials =
      defaultTemplate.isImportForFinancials;

    // Update the form controls to match the new templateDetails values
    this.templateForm.patchValue({
      objectTypeId: this.templateDetails.objectTypeId,
      objectTypeTypeId: this.templateDetails.objectTypeTypeId,
      keyField: this.templateDetails.keyField,
      formId: this.templateDetails.formId,
      parentObjectTypeId: this.templateDetails.parentObjectTypeId,
      parentLookupValue: this.templateDetails.parentLookupValue,
      parentObjectText: this.templateDetails.parentObjectText,
      keyFieldDisplayName: this.templateDetails.keyFieldDisplayName,
      relationshipDefinitionID: this.templateDetails.relationshipDefinitionID,
      formItemListID: this.templateDetails.formItemListID,
      updateOnly: this.templateDetails.updateOnly,
      isReadOnly: this.templateDetails.isReadOnly,
      setReadOnlyBy: this.templateDetails.setReadOnlyBy,
      setReadOnlyByContactName: this.templateDetails.setReadOnlyByContactName,
      isImportForAccounting: this.templateDetails.isImportForAccounting,
      isImportForFinancials: this.templateDetails.isImportForFinancials,
    });
  }

  setByTemplateType(templateTypeId: number) {
    this.isResettingForm = true;
    this.resetSpecificTemplateDetails();
    this.templateForm.get('templateTypeId').setValue(templateTypeId);
    this.templateForm.get('updateOnly').enable();
    this.templateForm.get('keyField').enable();
    this.templateDetails.canEdit = true;
    switch (this.templateDetails.templateTypeId) {
      case TemplateTypes.Forms:
        this.isUpdateOnlyVisible = true;
        this.forms = this.forms.filter((item) => item.formName !== 'None');
        this.templateForm.get('formId').enable();
        if (this.formInfo) {
          this.templateForm
            .get('objectTypeId')
            .setValue(this.formInfo.objectTypeID);
        } else {
          this.templateForm.get('objectTypeId').setValue(null);
        }
        this.templateDetails.objectType = '';
        this.loadObjectTypeTemplate();
        this.keyFields.push({ dataValueField: '-1', dataTextField: 'None' });
        this.templateForm.get('keyField').setValue('-1');
        this.templateForm.get('keyField').disable();
        this.templateForm.get('parentObjectText').setValue('None');
        this.parentLookups.push({ dataColumn: 'None' });
        this.templateForm.get('parentLookupValue').setValue('None');
        this.templateForm.get('parentLookupValue').disable();
        this.gridData = [];
        this.dataRetrieved = true;
        this.isResettingForm = false;
        break;
      case TemplateTypes.Financials:
        this.forms.push({ formID: 0, formName: 'None' });
        this.templateForm.get('formId').setValue(0);
        this.templateForm.get('formId').disable();
        this.isUpdateOnlyVisible = true;
        this.etlService.getObject(32).subscribe((result) => {
          if (result.success) {
            this.dataRetrieved = false;
            this.templateDetails.objectType = result.data.objectType;
            this.loadObjectTypeTemplate();
            this.templateDetails.keyField = 'none';
            this.templateForm.get('objectTypeId').setValue(32);
            this.loadKeyField();
            this.loadParentDetails();
            this.templateForm.get('keyField').setValue('SourceImportID');
            this.templateForm
              .get('parentLookupValue')
              .setValue('SourceImportID');
            this.templateForm.get('parentLookupValue').enable();
            this.templateForm
              .get('keyFieldDisplayName')
              .setValue('SourceImportID');
            this.isIncludedColumnVisible = false;
            this.loadGrid();
            this.isResettingForm = false;
          } else {
            this.handleError(result.errorMessage);
          }
        });
        break;
      case TemplateTypes.Accounting:
        this.forms.push({ formID: 0, formName: 'None' });
        this.templateForm.get('formId').setValue(0);
        this.templateForm.get('formId').disable();
        this.isUpdateOnlyVisible = false;
        this.etlService.getObject(34).subscribe((result) => {
          if (result.success) {
            this.dataRetrieved = false;
            this.templateDetails.objectType = result.data.objectType;
            this.loadObjectTypeTemplate();
            this.templateDetails.keyField = 'none';
            this.templateForm.get('objectTypeId').setValue(34);
            this.loadKeyField();
            this.loadParentDetails();
            this.templateForm.get('keyField').setValue('SourceImportID');
            this.templateForm
              .get('parentLookupValue')
              .setValue('SourceImportID');
            this.templateForm.get('parentLookupValue').enable();
            this.templateForm
              .get('keyFieldDisplayName')
              .setValue('SourceImportID');
            this.isIncludedColumnVisible = false;
            this.loadGrid();
            this.isResettingForm = false;
          } else {
            this.handleError(result.errorMessage);
          }
        });
        break;
      case TemplateTypes.AccountingCalendar:
        this.forms.push({ formID: 0, formName: 'None' });
        this.templateForm.get('formId').setValue(0);
        this.templateForm.get('formId').disable();
        this.isUpdateOnlyVisible = false;
        this.etlService.getObject(162).subscribe((result) => {
          if (result.success) {
            this.dataRetrieved = false;
            this.templateDetails.objectType = result.data.objectType;
            this.loadObjectTypeTemplate();
            this.templateDetails.keyField = 'none';
            this.templateForm.get('objectTypeId').setValue(162);
            this.loadKeyField();
            this.loadParentDetails();
            this.templateForm.get('keyField').setValue('SourceImportID');
            this.templateForm.get('parentLookupValue').setValue('None');
            this.templateForm.get('parentLookupValue').disable();
            this.templateForm
              .get('keyFieldDisplayName')
              .setValue('SourceImportID');
            this.isIncludedColumnVisible = false;
            this.loadGrid();
            this.isResettingForm = false;
          } else {
            this.handleError(result.errorMessage);
          }
        });
        break;
      case TemplateTypes.Notes:
        this.forms.push({ formID: 0, formName: 'None' });
        this.templateForm.get('formId').setValue(0);
        this.templateForm.get('formId').disable();
        this.isUpdateOnlyVisible = false;
        this.etlService.getObject(129).subscribe((result) => {
          if (result.success) {
            this.templateForm.get('parentObjectTypeId').setValue(12);
            this.dataRetrieved = false;
            this.templateDetails.objectType = result.data.objectType;
            this.loadObjectTypeTemplate();
            this.templateDetails.keyField = 'none';
            this.templateForm.get('objectTypeId').setValue(129);
            this.loadKeyField();
            this.loadParentDetails();
            this.templateForm.get('keyField').setValue('SourceImportID');
            this.templateForm
              .get('keyFieldDisplayName')
              .setValue('SourceImportID');
            this.templateForm.get('parentLookupValue').enable();
            this.isIncludedColumnVisible = false;
            // we do this in the getParentLookupValues cause we need the parentLookupValue first
            // onParentObjectChange() is raised when we set the parentObjectTypeId.setValue(12);
            //this.loadGrid();
            this.isResettingForm = false;
          } else {
            this.handleError(result.errorMessage);
          }
        });
        break;
      case TemplateTypes.Options:
        this.forms.push({ formID: 0, formName: 'None' });
        this.templateForm.get('formId').setValue(0);
        this.templateForm.get('formId').disable();
        this.isUpdateOnlyVisible = true;
        this.etlService.getObject(38).subscribe((result) => {
          if (result.success) {
            this.dataRetrieved = false;
            this.templateDetails.objectType = result.data.objectType;
            this.loadObjectTypeTemplate();
            this.templateDetails.keyField = 'none';
            this.templateForm.get('objectTypeId').setValue(38);
            this.loadKeyField();
            this.loadParentDetails();
            this.templateForm.get('keyField').setValue('SourceImportID');
            this.templateForm
              .get('keyFieldDisplayName')
              .setValue('SourceImportID');
            this.templateForm
              .get('parentLookupValue')
              .setValue('SourceImportID');
            this.templateForm.get('parentLookupValue').enable();
            this.isIncludedColumnVisible = true;
            this.loadGrid();
            this.isResettingForm = false;
          } else {
            this.handleError(result.errorMessage);
          }
        });
        break;
      case TemplateTypes.OptionCharges:
        this.forms.push({ formID: 0, formName: 'None' });
        this.templateForm.get('formId').setValue(0);
        this.templateForm.get('formId').disable();
        this.isUpdateOnlyVisible = true;
        this.etlService.getObject(159).subscribe((result) => {
          if (result.success) {
            this.dataRetrieved = false;
            this.templateDetails.objectType = result.data.objectType;
            this.loadObjectTypeTemplate();
            this.templateDetails.keyField = 'none';
            this.templateForm.get('objectTypeId').setValue(159);
            this.loadKeyField();
            this.loadParentDetails();
            this.templateForm.get('keyField').setValue('SourceImportID');
            this.templateForm
              .get('keyFieldDisplayName')
              .setValue('SourceImportID');
            this.templateForm
              .get('objectTypeTypeId')
              .setValue(this.objectTypeTemplates[0].id);
            this.templateForm
              .get('parentLookupValue')
              .setValue('SourceImportID');
            this.templateForm.get('parentLookupValue').enable();
            this.isIncludedColumnVisible = false;
            this.loadGrid();
            this.isResettingForm = false;
          } else {
            this.handleError(result.errorMessage);
          }
        });
        break;
      case TemplateTypes.ExchangeRates:
        this.forms.push({ formID: 0, formName: 'None' });
        this.templateForm.get('formId').setValue(0);
        this.templateForm.get('formId').disable();
        this.isUpdateOnlyVisible = false;
        this.etlService.getObject(165).subscribe((result) => {
          if (result.success) {
            this.dataRetrieved = false;
            this.templateDetails.objectType = result.data.objectType;
            this.loadObjectTypeTemplate();
            this.templateDetails.keyField = 'none';
            this.templateForm.get('objectTypeId').setValue(165);
            this.loadKeyField();
            this.loadParentDetails();
            this.templateForm.get('keyField').setValue('(Empty)');
            this.templateForm.get('keyFieldDisplayName').setValue('(Empty)');
            this.templateForm
              .get('parentLookupValue')
              .setValue('SourceImportID');
            this.templateForm.get('parentLookupValue').enable();
            this.templateForm.get('isImportForAccounting').setValue(true);
            this.templateForm.get('isImportForFinancials').setValue(true);
            this.isIncludedColumnVisible = false;
            this.loadGrid();
            this.isResettingForm = false;
          } else {
            this.handleError(result.errorMessage);
          }
        });
        break;
      case TemplateTypes.PortfolioAllocations:
        this.forms.push({ formID: 0, formName: 'None' });
        this.templateForm.get('formId').setValue(0);
        this.templateForm.get('formId').disable();
        this.isUpdateOnlyVisible = true;
        this.etlService.getObject(156).subscribe((result) => {
          if (result.success) {
            this.dataRetrieved = false;
            this.templateDetails.objectType = result.data.objectType;
            this.loadObjectTypeTemplate();
            this.templateDetails.keyField = 'none';
            this.templateForm.get('objectTypeId').setValue(156);
            this.loadKeyField();
            this.loadParentDetails();
            this.templateForm.get('keyField').setValue('SourceImportID');
            this.templateForm
              .get('keyFieldDisplayName')
              .setValue('SourceImportID');
            this.templateForm.get('parentLookupValue').setValue('None');
            this.templateForm.get('parentLookupValue').disable();
            this.isIncludedColumnVisible = false;
            this.loadGrid();
            this.isResettingForm = false;
          } else {
            this.handleError(result.errorMessage);
          }
        });
        break;
      case TemplateTypes.LeaseAllocations:
        this.forms.push({ formID: 0, formName: 'None' });
        this.templateForm.get('formId').setValue(0);
        this.templateForm.get('formId').disable();
        this.isUpdateOnlyVisible = false;
        this.etlService.getObject(169).subscribe((result) => {
          if (result.success) {
            this.dataRetrieved = false;
            this.templateDetails.objectType = result.data.objectType;
            this.loadObjectTypeTemplate();
            this.templateDetails.keyField = 'none';
            this.templateForm.get('objectTypeId').setValue(169);
            this.loadKeyField();
            this.loadParentDetails();
            this.templateForm.get('keyField').setValue('GLAllocationsID');
            this.templateForm
              .get('keyFieldDisplayName')
              .setValue('Allocations ID');
            this.templateForm
              .get('parentLookupValue')
              .setValue('SourceImportID');
            this.templateForm.get('parentLookupValue').enable();
            this.isIncludedColumnVisible = false;
            this.loadGrid();
            this.isResettingForm = false;
          } else {
            this.handleError(result.errorMessage);
          }
        });
        break;
      case TemplateTypes.APHistory:
        this.forms.push({ formID: 0, formName: 'None' });
        this.templateForm.get('formId').setValue(0);
        this.templateForm.get('formId').disable();
        this.isUpdateOnlyVisible = true;
        this.templateForm.get('updateOnly').setValue(true);
        this.templateForm.get('updateOnly').disable();
        this.etlService.getObject(173).subscribe((result) => {
          if (result.success) {
            this.dataRetrieved = false;
            this.templateDetails.objectType = result.data.objectType;
            this.loadObjectTypeTemplate();
            this.templateDetails.keyField = 'none';
            this.templateForm.get('objectTypeId').setValue(173);
            this.loadKeyField();
            this.loadParentDetails();
            this.templateForm.get('keyField').setValue('GLTransactionID');
            this.templateForm
              .get('keyFieldDisplayName')
              .setValue('GL Transaction ID');
            this.templateForm.get('parentLookupValue').setValue('None');
            this.templateForm.get('parentLookupValue').enable();
            this.isIncludedColumnVisible = false;
            this.loadGrid();
            this.isResettingForm = false;
          } else {
            this.handleError(result.errorMessage);
          }
        });
        break;
      case TemplateTypes.DiscountRates:
        this.forms.push({ formID: 0, formName: 'None' });
        this.templateForm.get('formId').setValue(0);
        this.templateForm.get('formId').disable();
        this.isUpdateOnlyVisible = true;
        this.etlService.getObject(125).subscribe((result) => {
          if (result.success) {
            this.dataRetrieved = false;
            this.templateDetails.objectType = result.data.objectType;
            this.loadObjectTypeTemplate();
            this.templateDetails.keyField = 'none';
            this.templateForm.get('objectTypeId').setValue(125);
            this.loadKeyField();
            this.loadParentDetails();
            this.templateForm.get('keyField').setValue('SourceImportID');
            this.templateForm
              .get('keyFieldDisplayName')
              .setValue('SourceImportID');
            this.templateForm.get('parentLookupValue').setValue('None');
            this.templateForm.get('parentLookupValue').enable();
            this.isIncludedColumnVisible = true;
            this.loadGrid();
            this.isResettingForm = false;
          } else {
            this.handleError(result.errorMessage);
          }
        });
        break;
      case TemplateTypes.DocumentMapping:
        this.forms.push({ formID: 0, formName: 'None' });
        this.templateForm.get('formId').setValue(0);
        this.templateForm.get('formId').disable();
        this.isUpdateOnlyVisible = false;
        this.isReadOnlyVisible = false;
        this.etlService.getObject(197).subscribe((result) => {
          if (result.success) {
            this.dataRetrieved = false;
            this.templateDetails.objectType = result.data.objectType;
            this.templateTypes.push({ formID: 0, formName: 'None' });
            this.loadObjectTypeTemplate();
            this.templateDetails.keyField = 'none';
            this.templateForm.get('objectTypeId').setValue(197);
            this.loadKeyField();
            this.templateForm.get('keyField').setValue('SourceImportID');
            this.loadParentDetails();
            this.templateForm.get('parentObjectTypeId').setValue(3);
            this.templateForm
              .get('keyFieldDisplayName')
              .setValue('SourceImportID');
            this.templateForm
              .get('parentLookupValue')
              .setValue('SourceImportID');
            this.templateForm.get('parentLookupValue').enable();
            this.isIncludedColumnVisible = false;
            this.loadGrid();
            this.isResettingForm = false;
          } else {
            this.handleError(result.errorMessage);
          }
        });
        break;
      default:
        console.error('Unknown template type');
        break;
    }
  }

  setTemplateValues(values: ITemplate = {} as ITemplate) {
    values.isImportForAccounting = values.isImportForAccounting ?? false;
    values.isImportForFinancials = values.isImportForFinancials ?? false;

    this.templateForm.patchValue(values);
  }

  configEditFields(canEdit: boolean) {
    const controls = [
      'templateId',
      'templateName',
      'templateTypeId',
      'formId',
      'objectTypeId',
      'objectTypeTypeId',
      'parentObjectTypeId',
      'parentLookupValue',
      'isReadOnly',
      'updateOnly',
      'keyField',
      'isImportForAccounting',
      'isImportForFinancials',
    ];

    controls.forEach((controlName) => {
      const control = this.templateForm.get(controlName);
      if (control) {
        canEdit ? control.enable() : control.disable();
      }
    });

    if (this.templateDetails.templateTypeId !== TemplateTypes.Forms) {
      setTimeout(() => {
        this.templateForm.get('formId').disable();
      });
    }
  }

  onSendToExcel() {
    this.exportToExcelService.exportToExcel(
      this.dataGrid.instance,
      this.templateForm.get('templateName').value + this.formatDate()
    );
  }

  onSave(isApplying: boolean) {
    if (this.templateForm.dirty) {
      this.isSaving = true;
      const formValues = this.templateForm.value;

      // get the included rows
      const filteredGridColumns = formValues.gridColumns.filter(
        (column) => column.include
      );

      const finalValues = {
        ...formValues,
        gridColumns: filteredGridColumns,
      };

      this.etlService.saveTemplateForm(finalValues).subscribe((result) => {
        this.isSaving = false;
        if (result.success) {
          this.successNotify('Successfully Saved Template');
          if (isApplying) {
            if (!this.templateDetails.isReadOnly) {
              this.templateDetails.setReadOnlyBy = null;
            }
            // If applying, update the initial data and pristine the form
            this.router.navigate([
              '/crem/admin/etl/templates/details',
              result.data,
            ]);
            this.templateForm.get('templateId').setValue(result.data);
            this.initialData = this.templateForm.getRawValue();
            this.templateForm.markAsPristine();
          } else {
            // If saving, redirect after a delay
            setTimeout(() => {
              this.router.navigate(['/crem/admin/etl/templates'], {
                relativeTo: this.route,
                queryParamsHandling: 'merge',
              });
            }, 1000);
          }
        } else {
          this.handleError(
            result.errorMessage ||
              'An unexpected error occurred while saving template.'
          );
        }
      });
    } else {
      console.log('No changes detected.');
    }
  }

  loadObjectTypeTemplate() {
    this.objectTypeTemplates = [];
    const templateTypeId = this.templateForm.get('templateTypeId').value;
    const formId = this.templateForm.get('formId').value;
    const templateId = this.templateDetails.templateId;
    const objectTypeTypeIdControl = this.templateForm.get('objectTypeTypeId');

    const setDefault = (id: number, name: string, disable = true) => {
      this.objectTypeTemplates.push({ id, name });
      objectTypeTypeIdControl.setValue(id);
      disable
        ? objectTypeTypeIdControl.disable()
        : objectTypeTypeIdControl.enable();
    };

    switch (templateTypeId) {
      case TemplateTypes.Financials:
        setDefault(2, 'Expense', false);
        this.objectTypeTemplates.push({ id: 3, name: 'Income' });
        break;

      case TemplateTypes.Forms:
        formId === 0
          ? setDefault(-1, 'None')
          : setDefault(
              this.formInfo.objectTypeTypeID,
              this.formInfo.objectTypeType,
              false
            );
        break;

      case TemplateTypes.Accounting:
        templateId > 0
          ? setDefault(3400, 'Accounting')
          : setDefault(-1, 'None');
        break;

      case TemplateTypes.AccountingCalendar:
        templateId > 0 ? setDefault(3401, 'Calendar') : setDefault(-1, 'None');
        break;

      case TemplateTypes.Notes:
      case TemplateTypes.Options:
      case TemplateTypes.ExchangeRates:
      case TemplateTypes.DiscountRates:
        setTimeout(() => {
          formId === 0
            ? setDefault(-1, 'None')
            : setDefault(-1, this.formInfo.objectTypeType);
        });
        break;

      case TemplateTypes.OptionCharges:
        setDefault(2, 'Option Charge Expense', false);
        this.objectTypeTemplates.push({ id: 3, name: 'Option Charge Income' });
        break;

      case TemplateTypes.APHistory:
      case TemplateTypes.PortfolioAllocations:
      case TemplateTypes.LeaseAllocations:
      case TemplateTypes.DocumentMapping:
        setTimeout(() => setDefault(-1, 'None'));
        break;
      default:
        objectTypeTypeIdControl.disable();
        break;
    }
  }

  onCancel() {
    this.router.navigate(['/crem/admin/etl/templates'], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
    });
  }

  templateTypeSelected(event: any) {
    this.templateDetails.templateTypeId = this.selectedTemplateType;
  }

  setCustomLeftNav(data: any) {
    const customLeftNavDataList: SharedLeftNavLink[] = data;
    const evt = new CustomEvent('SetCustomLeftNavItems', {
      detail: customLeftNavDataList,
    });
    window.dispatchEvent(evt);
  }

  onUpdateOnlyChanged(e: any) {
    if (this.isResettingForm) return;

    this.dataRetrieved = false;
    this.templateForm.get('updateOnly').setValue(e.value);
    const templateTypeIds = [
      TemplateTypes.Financials,
      TemplateTypes.Forms,
      TemplateTypes.Options,
      TemplateTypes.OptionCharges,
      TemplateTypes.PortfolioAllocations,
      TemplateTypes.DiscountRates,
    ];

    if (templateTypeIds.includes(this.templateDetails.templateTypeId)) {
      this.loadKeyField();
    }
    if (e.value) {
      this.templateForm.get('parentLookupValue').disable();
      this.loadGrid();
    } else {
      if (this.templateDetails.parentObjectText !== 'None') {
        const containsSourceImportID = this.parentLookups.find(
          (field) => field.dataColumn === 'SourceImportID'
        );
        if (containsSourceImportID) {
          this.templateForm.get('keyField').setValue('SourceImportID');
          this.templateForm.get('parentLookupValue').setValue('SourceImportID');
        } else {
          this.loadGrid();
        }
      } else {
        this.templateForm.get('keyField').setValue('SourceImportID');
        this.parentLookups = [];
        this.templateForm.get('parentLookupValue').setValue('');
      }
      this.templateForm.get('parentLookupValue').enable();
    }
    this.isLoading = false;
  }

  shouldHideCheckbox(rowData: any): boolean {
    const formId = rowData.formItemId;
    const templateTypeId = this.templateForm.get('templateTypeId')?.value;
    const isOptionTemplate = templateTypeId === 2;

    const requiredField = rowData.required;
    const shouldSelect =
      (this.templateDetails.updateOnly && requiredField === 'Key Field') ||
      (!this.templateDetails.updateOnly &&
        !isOptionTemplate &&
        ['Key Field', 'Parent Key Field', 'Required'].includes(
          requiredField
        )) ||
      (!this.templateDetails.updateOnly &&
        isOptionTemplate &&
        requiredField === 'Required') ||
      (!this.templateDetails.updateOnly && !formId && !isOptionTemplate);

    return shouldSelect;
  }

  multiLineRowCellText(value: any): string {
    let multiLineText = '';
    if (value !== null && value !== undefined) {
      multiLineText = value.toString().replace(/Chr\(13\)/g, '<br />');
    }
    return multiLineText;
  }

  checkUpdateOnlyVisibility(): void {
    const excludedTypes = [
      TemplateTypes.Accounting,
      TemplateTypes.AccountingCalendar,
      TemplateTypes.Notes,
      TemplateTypes.ExchangeRates,
      TemplateTypes.LeaseAllocations,
      TemplateTypes.DocumentMapping,
    ];

    if (!excludedTypes.includes(this.templateDetails.templateTypeId)) {
      this.isUpdateOnlyVisible = true;
    }
  }

  checkReadOnlyVisibility(): void {
    const excludedTypes = [TemplateTypes.DocumentMapping];

    if (!excludedTypes.includes(this.templateDetails.templateTypeId)) {
      this.isReadOnlyVisible = true;
    }
  }

  checkTemplateName(templateName: string) {
    if (!templateName) {
      this.templateForm.get('templateName').setErrors(null);
      return;
    }

    // Check if the templateName exists in initialData.templateName
    const existingTemplate = this.initialData?.templateName === templateName;

    if (existingTemplate) {
      // If the template name exists in initialData, it's valid
      this.templateForm.get('templateName').setErrors(null);
    } else {
      // Call the API if the template name isn't found in initialData
      this.etlService.checkTemplateName(templateName).subscribe((result) => {
        if (result.success) {
          if (result.data) {
            this.templateForm
              .get('templateName')
              .setErrors({ nameTaken: true });
          } else {
            this.templateForm.get('templateName').setErrors(null);
          }
        } else {
          this.handleError(result.errorMessage);
        }
      });
    }
  }

  getParentLookupValues() {
    if (this.templateDetails.templateTypeId === TemplateTypes.DocumentMapping) {
      const parentObjectTypeId =
        this.templateForm.get('parentObjectTypeId').value;

      this.etlService
        .getDocumentImportParentLookupValuesQuery(parentObjectTypeId)
        .subscribe((result) => {
          if (result.success) {
            if (result.data) {
              let parentDataColumnn: string = result.data;

              this.parentLookups = [
                { dataColumn: 'SourceImportID' },
                { dataColumn: parentDataColumnn },
              ];
              return;
            }
          }
        });
    } else {
      this.etlService
        .getParentLookupValues(this.templateDetails.parentObjectTypeId)
        .subscribe((result) => {
          if (result.success) {
            if (result.data) {
              this.parentLookups = result.data;
              if (this.templateDetails.parentLookupValue === '') {
                const firstObject = this.parentLookups[0];
                if (firstObject) {
                  this.templateForm
                    .get('parentLookupValue')
                    .setValue(firstObject.dataColumn);
                  this.templateForm.get('parentLookupValue').enable();
                  this.templateDetails.parentLookupValue =
                    firstObject.dataColumn;

                  if (
                    this.templateDetails.templateTypeId ===
                      TemplateTypes.Notes &&
                    !this.isFirstLoad
                  ) {
                    this.loadGrid();
                  }
                }
              }
            }
          } else {
            this.handleError(result.errorMessage);
          }
        });
    }
  }

  getTemplatesLeftNavData(): SharedLeftNavLink[] {
    const customLeftNav: SharedLeftNavLink = {
      name: 'Imports',
      id: 1,
      category: null,
      categoryHasFlyOutMenu: false,
      categoryIsCurrentlyActiveLink: false,
      categoryLinkUrl: null,
      categorySpaUrl: null,
      categorySpaQueryParameters: '',
      sortOrder: 1,
      linkUrl: '',
      moduleID: 6,
      isAuthorized: true,
      objectTypeID: null,
      objectTypeName: '',
      dynamicName: 'Imports',
      usesNgRouting: true,
      spaUrl: '/crem/admin/etl/imports',
      spaQueryParameters: '',
      isCommon: false,
      isCurrentlyActiveLink: false,
      subChildLevel: 0,
      subChildLevelNavLinks: null,
    };

    const customLeftNav1: SharedLeftNavLink = {
      name: 'Details',
      id: 2,
      category: 'Templates',
      categoryHasFlyOutMenu: false,
      categoryIsCurrentlyActiveLink: false,
      categoryLinkUrl: null,
      categorySpaUrl: null,
      categorySpaQueryParameters: '',
      sortOrder: 2,
      linkUrl: '',
      moduleID: 6,
      isAuthorized: true,
      objectTypeID: null,
      objectTypeName: '',
      dynamicName: 'Details',
      usesNgRouting: true,
      spaUrl: '/crem/admin/etl/templates/details/' + this.templateId,
      spaQueryParameters: '',
      isCommon: false,
      isCurrentlyActiveLink: false,
      subChildLevel: 0,
      subChildLevelNavLinks: null,
    };
    const customLeftNav2: SharedLeftNavLink = {
      name: 'View History',
      id: 3,
      category: 'Templates',
      categoryHasFlyOutMenu: false,
      categoryIsCurrentlyActiveLink: false,
      categoryLinkUrl: null,
      categorySpaUrl: null,
      categorySpaQueryParameters: '',
      sortOrder: 3,
      linkUrl: '',
      moduleID: 6,
      isAuthorized: false,
      objectTypeID: null,
      objectTypeName: '',
      dynamicName: 'View History',
      usesNgRouting: true,
      spaUrl: '/crem/admin/etl/templates/history/' + this.templateId,
      spaQueryParameters: '',
      isCommon: false,
      isCurrentlyActiveLink: false,
      subChildLevel: 0,
      subChildLevelNavLinks: null,
    };

    return [customLeftNav, customLeftNav1, customLeftNav2];
  }

  setFormIdValidators(templateTypeId: number): void {
    const formIdControl = this.templateForm.get('formId');

    if (templateTypeId === 0) {
      formIdControl.setValidators([Validators.required, notZeroValidator()]);
      this.isFormIdRequired = true;
    } else {
      formIdControl.clearValidators();
      this.isFormIdRequired = false;
    }
    formIdControl.updateValueAndValidity();
  }

  handleError(message: any) {
    //this.errorNotify(message);
    this.errorDialog(message);

    this.resetSpecificTemplateDetails();
    this.templateDetails.objectType = '';
    this.gridData = null;
    this.isResettingForm = false;
    this.isKeyFieldLoading = false;
    this.dataRetrieved = true;

    return of(null);
  }

  errorDialog(errorMsg) {
    const dialogRef = this.dialog.open(GenericErrorComponent, {
      width: '600px',
      data: errorMsg,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.router.navigate(['/crem/admin/etl/templates'], {
          relativeTo: this.route,
          queryParamsHandling: 'merge',
        });
      }
    });
  }

  errorNotify(message: string) {
    this.notifyPopup(message, 'error');
  }

  successNotify(message: string) {
    this.notifyPopup(message, 'success');
  }

  private notifyPopup(message: string, messageType: string) {
    notify({
      message: message,
      type: messageType,
      displayTime: 5000,
      position: { at: 'right bottom', my: 'right bottom', offset: '-16 -16' },
      maxWidth: '400px',
      closeOnClick: true,
    });
  }

  formatDate() {
    const now = new Date();

    // Pad single digits with leading zeros
    const pad = (n: number): string => n.toString().padStart(2, '0');

    // Format the date and time
    const formattedDate =
      now.getFullYear().toString() + // yyyy
      pad(now.getMonth() + 1) + // MM (Months are 0-based, so add 1)
      pad(now.getDate()) + // dd
      pad(now.getHours()) + // HH
      pad(now.getMinutes()) + // mm
      pad(now.getSeconds()); // ss

    return formattedDate;
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
