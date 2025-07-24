import {
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import {
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  ButtonModule,
  DatePickerModule,
  InputComponent,
  InputLabelComponent,
  LibUiElementsModule,
  LoaderModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { SearchModule } from '@mango/ui-shared/cosmos';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { DevExpressModule } from 'libs/ui-shared/lib-external-libraries/src/lib/3rdParty/dev-express.module';
import { UseDynamicFormFieldConfigDirective } from '@forms/pipes/use-dynamic-form-field-config.pipe';
import { clauseTransform as parseClauseFormItemParametersPipeTransform } from '../../pipes/parse-form-item-parameters';
import { FieldsControlService } from '@forms/services/fields-control.service';
import { DynamicFormClauseBankComponent } from '../../dynamic-form-clause-bank/dynamic-form-clause-bank.component';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';

@Component({
  selector: 'mango-dynamic-form-field-doc-sec-page',
  standalone: true,
  providers: [FieldsControlService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LibUiElementsModule,
    UseDynamicFormFieldConfigDirective,
    SearchModule,
    ButtonModule,
    DevExpressModule,
    InputComponent,
    InputLabelComponent,
    DatePickerModule,
  ],
  templateUrl: './dynamic-form-field-doc-sec-page.component.html',
  styleUrls: ['./dynamic-form-field-doc-sec-page.component.scss'],
})
export class DynamicFormFieldDocSecPageComponent implements OnInit, OnDestroy {
  @Input() section!: any;
  @Input() formGroup!: FormGroup;
  @Input() fieldData: any;
  @Input() editMode: boolean;
  @Input() dateFormat: string;

  faCog = faCog;

  isEditMode: boolean;
  isViewMode: boolean;

  docFieldRequired: boolean;
  secFieldRequired: boolean;
  pageFieldRequired: boolean;
  dateFieldRequired: boolean;

  showDocView: boolean;
  showSecView: boolean;
  showPageView: boolean;
  showDateView: boolean;

  showDocEdit: boolean;
  showSecEdit: boolean;
  showPageEdit: boolean;
  showDateEdit: boolean;
  showClauseBank: boolean;
  public dialogRef: MatDialogRef<DynamicFormClauseBankComponent>;
  private subs: Subscription = new Subscription();
  private formItemsParsed: any[];
  private clauseFieldsName: any[];
  private changedToEditCount: number;
  @Inject(MAT_DIALOG_DATA) public data: any;

  constructor(private fcs: FieldsControlService, private dialog: MatDialog) {}

  ngOnInit() {
    this.changedToEditCount = 0;

    this.formItemsParsed = parseClauseFormItemParametersPipeTransform(
      this.fieldData.name.formItemParameters
    );
    this.setControlsShowValues();

    this.clauseFieldsName = [
      {
        name: 'document_edit',
        sourceField: 'sourceDocument',
        required: this.docFieldRequired,
        fieldName: 'Document',
      },
      {
        name: 'page_edit',
        sourceField: 'sourcePage',
        required: this.pageFieldRequired,
        fieldName: 'Page',
      },
      {
        name: 'section_edit',
        sourceField: 'sourceSection',
        required: this.secFieldRequired,
        fieldName: 'Section',
      },
      {
        name: 'date_edit',
        sourceField: 'sourceDate',
        required: this.dateFieldRequired,
        fieldName: 'Date',
      },
    ];

    this.addFormattedDateToFieldData();
    this.addAdditionalClauseFieldsToFormGroup();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.editMode) {
      this.setControlsShowValues();

      if (this.editMode && !changes.editMode.isFirstChange()) {
        this.changedToEditCount++;

        if (this.changedToEditCount > 1) {
          this.resetChangedControls();
        }
      }
    }
  }

  openClasueBankPopup(dataField: number, clauseTypeID: number) {
    let dialogRef = this.dialog.open(DynamicFormClauseBankComponent, {
      width: '700px',
      minWidth: '320px',
      maxWidth: '1100px',
      minHeight: '320px',
      maxHeight: '90vh',
      height: '500px',
      panelClass: 'df-clause-bank-component',
      data: {
        clauseTypeId: clauseTypeID,
      },
    });

    this.subs.add(
      dialogRef.afterClosed().subscribe((result) => {
        if (!!result) {
          let frmControl = this.formGroup.get(dataField.toString());
          let newValue = (frmControl.value ?? '') + result;
          frmControl?.setValue(newValue);
        }
      })
    );
  }

  addFormattedDateToFieldData() {
    if (!!this.fieldData?.name?.sourceDate) {
      let formattedDate = formatDate(
        new Date(this.fieldData?.name?.sourceDate),
        this.dateFormat,
        'en-US'
      );
      this.fieldData.name['sourceDateView'] = formattedDate;
    }
  }

  private resetChangedControls() {
    let formControl = this.formGroup.get(this.fieldData?.dataField.toString());

    if (
      !!formControl.value &&
      formControl.value.hasOwnProperty('ClauseChanged') &&
      formControl.value.ClauseChanged
    ) {
      formControl.reset(this.fieldData.name.formItemAnswer);

      this.clauseFieldsName.forEach((cfn) => {
        let showFormItem = this.getVisibleValueFromParsedFormItems(cfn.name);

        if (showFormItem) {
          let formControlName = this.fieldData.dataField + '_' + cfn.fieldName;
          formControl = this.formGroup.get(formControlName);
          formControl.reset(this.fieldData.name[cfn.sourceField]);
        }
      });
    }
  }

  private setControlsShowValues() {
    this.isEditMode = this.editMode && !this.fieldData?.name?.formItemViewOnly;
    this.isViewMode = !this.editMode || this.fieldData?.name?.formItemViewOnly;

    if (!!this.formItemsParsed) {
      this.docFieldRequired =
        this.getVisibleValueFromParsedFormItems('document_required');
      this.secFieldRequired =
        this.getVisibleValueFromParsedFormItems('section_required');
      this.pageFieldRequired =
        this.getVisibleValueFromParsedFormItems('page_required');
      this.dateFieldRequired =
        this.getVisibleValueFromParsedFormItems('date_required');

      this.showDocView =
        this.isViewMode &&
        this.getVisibleValueFromParsedFormItems('document_view');
      this.showSecView =
        this.isViewMode &&
        this.getVisibleValueFromParsedFormItems('section_view');
      this.showPageView =
        this.isViewMode && this.getVisibleValueFromParsedFormItems('page_view');
      this.showDateView =
        this.isViewMode && this.getVisibleValueFromParsedFormItems('date_view');

      this.showDocEdit =
        this.isEditMode &&
        this.getVisibleValueFromParsedFormItems('document_edit');
      this.showSecEdit =
        this.isEditMode &&
        this.getVisibleValueFromParsedFormItems('section_edit');
      this.showPageEdit =
        this.isEditMode && this.getVisibleValueFromParsedFormItems('page_edit');
      this.showDateEdit =
        this.isEditMode && this.getVisibleValueFromParsedFormItems('date_edit');
      this.showClauseBank =
        this.isEditMode && this.getVisibleValueFromParsedFormItems('cbank');
    }
  }

  private getVisibleValueFromParsedFormItems(
    parsedItemFieldName: string
  ): boolean {
    let foundFormItem = this.formItemsParsed.find(
      (fip) => fip.fieldName === parsedItemFieldName
    );
    return (
      !!foundFormItem && foundFormItem.fieldVisible.toLowerCase() === 'yes'
    );
  }

  private addAdditionalClauseFieldsToFormGroup() {
    if (this.fieldData.name.formItemTypeID === 10) {
      if (!!this.formItemsParsed) {
        this.clauseFieldsName.forEach((cfn) => {
          let showFormItem = this.getVisibleValueFromParsedFormItems(cfn.name);

          if (showFormItem) {
            let formControlValidators: ValidatorFn[] = [];

            if (cfn.required) {
              formControlValidators.push(Validators.required);
            }

            let formControl = this.fcs.createFormControl(
              this.fieldData.name[cfn.sourceField],
              formControlValidators
            );
            let formControlName =
              this.fieldData.dataField + '_' + cfn.fieldName;
            this.formGroup.addControl(formControlName, formControl);
          }
        });
      }
    }
  }
}
