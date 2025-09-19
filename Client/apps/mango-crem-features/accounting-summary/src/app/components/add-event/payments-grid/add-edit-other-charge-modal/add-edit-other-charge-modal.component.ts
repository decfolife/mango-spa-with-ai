import { AddEditScheduleService } from '@accounting-summary/services/add-edit-schedule.service';
import { FormattingService } from '@accounting-summary/services/formatting.service';
import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { RemeasureType } from '@accounting-summary/shared/enums/remeasure-type.enum';
import {
  ButtonModule,
  CremFormsModule,
  CremToastService,
  DatePickerComponent,
  DatePickerModule,
  DropdownModule,
  InputComponent,
  LibUiElementsModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { Subscription } from 'rxjs';
import { ProrationData } from '@accounting-summary/models/proration-data.model';
import { CheckBoxComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/checkbox';
import { OtherCharge } from '@accounting-summary/models/other-charge.model';
import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import { ToastState } from '@mango/data-models/lib-data-models';
import { DxNumberBoxComponent, DxNumberBoxModule } from 'devextreme-angular';
import {
  AddEditOtherChargeResult,
  CustomPeriodFrequencyType,
  DeleteOtherCharges,
  FrequencyType,
  ProrationType,
  SaveOtherCharges,
} from '@accounting-summary/models/interfaces/payments-grid.interfaces';
import {
  CommonDropdowns,
  Currency,
} from '@accounting-summary/models/common-dropdowns.model';
import { AddEventFormService } from '@accounting-summary/services/add-event-form.service';

@Component({
  selector: 'mango-add-edit-other-charge-modal',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ModalModule,
    DropdownModule,
    LibUiElementsModule,
    InputComponent,
    CheckBoxComponent,
    DatePickerModule,
    ReactiveFormsModule,
    MatDialogModule,
    FormsModule,
    CremFormsModule,
    DxNumberBoxModule,
  ],
  templateUrl: './add-edit-other-charge-modal.component.html',
  styleUrls: ['./add-edit-other-charge-modal.component.scss'],
})
export class AddEditOtherChargeModalComponent implements OnInit {
  @ViewChild('AmountInput', { static: false })
  amountInputComponent: DxNumberBoxComponent;
  @ViewChild('NameInput') nameInputComponent: InputComponent;
  @ViewChild('StartDatePicker') startDatePickerComponent: DatePickerComponent;
  @ViewChild('EndDatePicker') endDateDatePickerComponent: DatePickerComponent;

  componentName = 'add-edit-other-charge-modal';
  modalTitle = 'Add Other Charge';
  modalId: string = this.componentName + '-id';
  addEditOtherChargeResult: AddEditOtherChargeResult;
  amount: number;
  frequencyTypeId: number;
  firstAmount: number;
  lastAmount: number;
  dateFormat: string;
  chargeName: string;
  prorationTypeId: number;
  decimalPrecision = 2;
  currencyId: number;
  defaultProrationTypeId: number;
  frequencyTypeIsCustomPeriod = false;
  isDirectCost = false;
  isEdit = false;
  isProrated = false;
  isPartialPeriod = false;
  isRecurringCharge = false;
  showSaveMsg = false;
  showDeleteMsg = false;
  otherChargeSaved = false;
  otherChargeDeleted = false;
  startDate: Date = null;
  endDate: Date = null;
  firstRecurringDate: Date = null;
  remeasureType: RemeasureType;
  directCostCheckboxVisible = true;
  eventId: number;
  eventBeginDate: Date;
  eventEndDate: Date;
  leaseRecognitionScheduleID: number;
  scheduleCurrencyID: number;
  periodStartHasError = false;
  periodEndHasError = false;
  otherChargeErrors = '';
  prorationTypesList: ProrationType[];
  originalProrationTypesList: ProrationType[] = null;
  currencyTypeList: Currency[];
  originalCurrencyTypeList: Currency[];
  frequencyTypesList: FrequencyType[] = [];
  originalFrequencyTypesList: FrequencyType[] = [];
  otherCharge: OtherCharge;
  glEventIDs: number[] = [];
  currencyFormat: string;
  private commonDropdownsData: CommonDropdowns;
  private subs: Subscription[] = [];
  private customPeriodFrequencyTypeList: CustomPeriodFrequencyType[] = [
    {
      frequencyTypeId: 7,
      frequencyType: 'Traditional English Quarters',
      isCustomPeriod: true,
    },
    {
      frequencyTypeId: 8,
      frequencyType: 'Traditional Scottish Quarters',
      isCustomPeriod: true,
    },
    {
      frequencyTypeId: 9,
      frequencyType: 'Modified Scottish Quarters',
      isCustomPeriod: true,
    },
    {
      frequencyTypeId: 10,
      frequencyType: 'Modern Quarters',
      isCustomPeriod: true,
    },
  ];

  constructor(
    private formatService: FormattingService,
    private toastService: CremToastService,
    public dialogRef: MatDialogRef<AddEditOtherChargeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public addEditScheduleService: AddEditScheduleService,
    public accountingSummaryService: AccountingSummaryService,
    public addEditFormServices: AddEventFormService
  ) {
    this.isEdit = data.isEdit;
    this.dateFormat = data.dateFormat;
    this.remeasureType = data.remeasureType;
    this.eventBeginDate = data.eventBeginDate;
    this.eventEndDate = data.eventEndDate;
    this.leaseRecognitionScheduleID = data.leaseRecognitionScheduleID;
    this.scheduleCurrencyID = data.scheduleCurrencyID;
    this.commonDropdownsData = data.commonDropdownsData;
  }

  ngOnInit(): void {
    this.directCostCheckboxVisible = this.remeasureType === 0;
    this.currencyFormat = this.formatService.buildCurrencyMask(
      this.decimalPrecision
    );
    this.getFrequencyTypes();
    this.getCurrencies();
    this.getProrationTypes();
    this.formatCurrencyInput();
    this.startDate = new Date();

    if (this.data.isEdit) {
      this.leaseRecognitionScheduleID =
        this.data.otherCharge.leaseRecognitionScheduleID;
      this.isDirectCost = this.data.otherCharge.isDirectCost;
      this.currencyId = this.data.otherCharge.currencyID;
      this.isPartialPeriod = this.data.otherCharge.isPartialPeriod;
      this.eventId = this.data.otherCharge.glEventID;
      this.modalTitle = 'Edit Other Charge';
      this.amount = this.data.otherCharge.amount;
      this.chargeName = this.data.otherCharge.otherChargeName;
      this.startDate = this.data.otherCharge.startDate;
      this.endDate = this.data.otherCharge.endDate;
      this.isRecurringCharge = this.data.otherCharge.endDate ? true : false;
      this.firstRecurringDate = this.data.otherCharge.firstRecurringDate;
      this.frequencyTypeId = this.data.otherCharge.frequency;
      this.isProrated = this.data.otherCharge.isProrated;
      this.prorationTypeId = this.data.otherCharge.prorationType;
      this.firstAmount = this.data.otherCharge.firstPaymentAmount;
      this.lastAmount = this.data.otherCharge.lastPaymentAmount;
    } else {
      this.frequencyTypeId = this.frequencyTypesList[0].id;
    }
    this.frequencyTypeIsCustomPeriod =
      this.determineFrequencyTypeIsCustomPeriod(this.frequencyTypeId);
  }

  close() {
    this.showSaveMsg = false;
    this.closeModal();
  }

  save() {
    this.showSaveMsg = true;
    this.saveOtherCharge(false);
  }

  saveAndNew() {
    this.showSaveMsg = false;
    this.saveOtherCharge(true);
    this.addEditFormServices.isOtherChargesSaved.next({
      isOtherChargesSaved: true,
      glEventIDs: this.glEventIDs,
    });
  }

  delete() {
    this.showDeleteMsg = true;
    this.deleteOtherCharge();
  }

  onFrequencyValueChanged(e) {
    this.frequencyTypeId = e[0].id;
    this.frequencyTypeIsCustomPeriod =
      this.determineFrequencyTypeIsCustomPeriod(this.frequencyTypeId);
    this.startDate =
      this.frequencyTypeId === 6 ? new Date() : this.eventBeginDate;
    this.endDate = this.frequencyTypeId === 6 ? new Date() : this.eventEndDate;

    this.filterProrationTypesForFrequency();

    if (this.frequencyTypeId !== 6) {
      this.isRecurringCharge = true;

      this.updateProrationAmounts();

      return;
    }

    this.isRecurringCharge = false;
    this.isProrated = false;

    this.updateProrationAmounts();
  }

  onCurrencyValueChanged(e) {
    this.currencyId = e[0].id;
    this.decimalPrecision = e[0].decimalPrecision;
    this.formatCurrencyInput();
  }

  onProrationTypeValueChanged(e) {
    this.prorationTypeId = e[0].id;
    this.updateProrationAmounts();
  }

  isDirectCostChanged(e) {
    this.isDirectCost = e.value;
  }

  isProratedChanged(e) {
    this.isProrated = e.value;
    this.updateProrationAmounts();
  }

  onDatePickerChange(e, componentName) {
    switch (componentName) {
      case 'startDatePicker':
        this.startDate = e.value;
        this.updateProrationAmounts();
        break;
      case 'endDatePicker':
        this.endDate = e.value;
        this.updateProrationAmounts();
        break;
      case 'firstRecurringDatePicker':
        if (this.firstRecurringDate !== e.value) {
          this.firstRecurringDate = e.value;
          this.updateProrationAmounts(true);
        }
        break;
    }
  }

  onInputBlurChange(e, componentName) {
    const value = e.value;
    switch (componentName) {
      case 'amountInput':
        this.amount = value;
        this.updateProrationAmounts();
        break;
      case 'nameInput':
        this.chargeName = e;
        break;
      case 'firstAmountInput':
        this.firstAmount = value;
        break;
      case 'lastAmountInput':
        this.lastAmount = value;
        break;
    }
  }

  closeModal() {
    this.addEditOtherChargeResult = {
      chargeSaved: this.otherChargeSaved,
      showSaveMsg: this.showSaveMsg,
      chargeDeleted: this.otherChargeDeleted,
      showDeleteMsg: this.showDeleteMsg,
      glEventIDs: this.glEventIDs,
    };
    this.dialogRef.close(this.addEditOtherChargeResult);
  }

  updateProrationAmounts(useFirstRecurringDate = false) {
    if (this.prorationTypeId === 5) {
      /*
      If prorationTypeId is 5, this means the user has picked
      manual from the proration type dropdown and will be keying
      a first and last amount manually. In this case we shouldn't
      call the proration engine as it will return 0 and overwrite
      the user input.
      */
      return;
    }

    const prorationData: ProrationData = {
      amount: this.amount,
      frequency: this.frequencyTypeId,
      startDate: this.startDate,
      endDate: this.endDate,
      prorationType: this.prorationTypeId,
      firstRecurringDate: useFirstRecurringDate
        ? this.firstRecurringDate
        : null,
    };

    if (
      !this.isProrated ||
      !prorationData.amount ||
      !this.frequencyTypeId ||
      !this.prorationTypeId ||
      prorationData.startDate <= new Date(0) ||
      prorationData.endDate <= new Date(0)
    ) {
      return;
    }

    this.addEditScheduleService
      .getProratedAmounts(prorationData)
      .subscribe((res) => {
        if (res && res.success) {
          this.firstAmount = res.data.firstPaymentAmount;
          this.lastAmount = res.data.lastPaymentAmount;
          this.firstRecurringDate = res.data.firstRecurringDate;
        } else {
          this.toastService.show(
            res.clientErrorMessage,
            'Error',
            ToastState.ERROR
          );
        }
      });
  }

  private determineFrequencyTypeIsCustomPeriod(frequencyTypeId: number) {
    const foundIndex = this.customPeriodFrequencyTypeList.findIndex(
      (cp) => cp.frequencyTypeId === frequencyTypeId
    );

    return foundIndex >= 0;
  }

  private formatValueToDecimalPrecision(value: number) {
    let result: number;

    if (isNaN(value) || value === Infinity) {
      return value;
    }

    result = Number(
      this.formatService
        .localFormat(value, this.decimalPrecision)
        .replace(/,/g, '')
    );

    return result;
  }

  private getFrequencyTypes() {
    if (
      this.commonDropdownsData &&
      this.commonDropdownsData.prorationFrequencies
    ) {
      this.originalFrequencyTypesList =
        this.commonDropdownsData.prorationFrequencies;
      this.frequencyTypesList = JSON.parse(
        JSON.stringify(this.originalFrequencyTypesList)
      );
    }
  }

  private getProrationTypes() {
    if (this.commonDropdownsData && this.commonDropdownsData.prorationTypes) {
      this.originalProrationTypesList = this.commonDropdownsData.prorationTypes;
      this.frequencyTypeIsCustomPeriod =
        this.determineFrequencyTypeIsCustomPeriod(
          this.data?.otherCharge?.frequency
        );
      this.filterProrationTypesForFrequency();
      this.defaultProrationTypeId = this.prorationTypesList[0].id;
      this.prorationTypeId = this.defaultProrationTypeId;
    }
  }

  private filterProrationTypesForFrequency() {
    if (this.frequencyTypeIsCustomPeriod) {
      this.prorationTypesList = this.originalProrationTypesList.filter(
        (x: ProrationType) =>
          x.id === 1 || // Actual Days In Period
          x.id === 3 || // 365 Day Year
          x.id === 5 // Manual
      );

      const foundIndex = this.prorationTypesList.findIndex(
        (pt) => pt.id === this.prorationTypeId
      );

      if (foundIndex < 0) {
        this.prorationTypeId = this.defaultProrationTypeId;
      }
    } else {
      this.prorationTypesList = this.originalProrationTypesList;
    }
  }

  private getCurrencies() {
    if (this.commonDropdownsData && this.commonDropdownsData.currencies) {
      this.originalCurrencyTypeList = this.commonDropdownsData.currencies;
      this.currencyTypeList = JSON.parse(
        JSON.stringify(this.originalCurrencyTypeList)
      );

      if (this.scheduleCurrencyID > 0) {
        this.currencyId = this.scheduleCurrencyID;
      }
    }
  }

  private resetModalValues() {
    this.getFrequencyTypes();

    this.currencyTypeList = JSON.parse(
      JSON.stringify(this.originalCurrencyTypeList)
    );

    if (this.scheduleCurrencyID > 0) {
      this.currencyId = this.scheduleCurrencyID;
    }

    this.amount = null;
    this.frequencyTypeId = this.frequencyTypesList[0].id;
    this.frequencyTypeIsCustomPeriod =
      this.determineFrequencyTypeIsCustomPeriod(this.frequencyTypeId);
    this.firstAmount = null;
    this.lastAmount = null;
    this.chargeName = null;
    this.prorationTypeId = this.defaultProrationTypeId;
    this.decimalPrecision = 2;
    this.isDirectCost = false;
    this.isProrated = false;
    this.isPartialPeriod = false;
    this.isRecurringCharge = false;
    this.startDate = new Date();
    this.endDate = null;
    this.firstRecurringDate = null;
    this.periodStartHasError = false;
    this.periodEndHasError = false;

    this.filterProrationTypesForFrequency();
  }

  private validateOtherChargeDateRange(
    startDate: Date,
    endDate: Date
  ): boolean {
    let isValid = true;
    this.periodStartHasError = false;
    this.periodEndHasError = false;

    this.otherChargeErrors = '';

    if (this.frequencyTypeId !== 6) {
      // One-Time charge
      {
        if (startDate > endDate) {
          isValid = false;
          this.periodStartHasError = true;
          this.periodEndHasError = true;
          this.otherChargeErrors += 'End date can not come before start date.';
        }
      }
    }

    return isValid;
  }

  private convertAndFormatDate(dateStr) {
    if (!dateStr) {
      return dateStr;
    }

    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  formatCurrencyInput() {
    this.currencyFormat = this.formatService.buildCurrencyMask(
      this.decimalPrecision
    );
  }

  private saveOtherCharge(keepModalOpen: boolean) {
    this.otherChargeSaved = false;
    this.otherChargeErrors = '';

    this.otherCharge = {
      glEventID: this.eventId ?? null,
      leaseRecognitionScheduleID: this.leaseRecognitionScheduleID,
      amount: this.amount,
      frequency: this.frequencyTypeId,
      startDate:
        this.startDate !== null
          ? this.convertAndFormatDate(this.startDate)
          : null,
      endDate:
        this.endDate !== null ? this.convertAndFormatDate(this.endDate) : null,
      isProrated: this.isProrated,
      prorationType:
        !this.isProrated || this.prorationTypeId === null
          ? 0
          : this.prorationTypeId,
      isPartialPeriod: this.isPartialPeriod,
      //firstRecurringDate already comes back as a date instead of a string so there is no need to format
      firstRecurringDate:
        this.isProrated && this.firstRecurringDate !== null
          ? this.convertAndFormatDate(this.firstRecurringDate)
          : null,
      firstPaymentAmount: this.isProrated ? this.firstAmount : null,
      lastPaymentAmount: this.isProrated ? this.lastAmount : null,
      currencyID: this.currencyId,
      isDirectCost: this.isDirectCost,
      otherChargeName: this.chargeName,
    };

    //if end date is visible and valid
    let endDateValid =
      (this.isRecurringCharge && this.endDateDatePickerComponent.validate) ||
      !this.isRecurringCharge
        ? true
        : false;

    let requiredFieldsIsValid =
      this.amountInputComponent.instance.option('isValid') &&
      this.nameInputComponent.validate() &&
      this.startDatePickerComponent.validate() &&
      endDateValid;

    if (!requiredFieldsIsValid) {
      this.otherChargeErrors += 'Required field(s) are missing.';
      return;
    }

    let isValid =
      requiredFieldsIsValid &&
      this.validateOtherChargeDateRange(
        this.otherCharge.startDate,
        this.otherCharge.endDate
      );

    if (isValid) {
      this.subs.push(
        this.addEditScheduleService
          .saveOtherCharge(this.otherCharge)
          .subscribe((res: SaveOtherCharges) => {
            if (res && res.success) {
              this.glEventIDs.push(res.data);
              this.otherChargeSaved = true;
              this.otherChargeDeleted = false;
              if (keepModalOpen) {
                this.resetModalValues();
                this.toastService.show(
                  'The other charge was saved successfully.',
                  'Charge Saved',
                  ToastState.SUCCESS
                );
              } else {
                this.closeModal();
              }
            } else {
              this.addEditScheduleService.showToast(
                'Save Other Charges',
                'There was an issue saving the other charge.',
                'error',
                false
              );
            }
          })
      );
    }
  }

  private deleteOtherCharge() {
    this.otherChargeErrors = '';
    this.otherChargeSaved = false;
    this.subs.push(
      this.addEditScheduleService
        .deleteOtherCharge(this.eventId)
        .subscribe((res: DeleteOtherCharges) => {
          if (res && res.success) {
            this.otherChargeSaved = false;
            this.otherChargeDeleted = true;
            this.closeModal();
          } else {
            this.addEditScheduleService.showToast(
              'Delete Other Charges',
              'There was an issue deleting the other charge.',
              'error',
              false
            );
          }
        })
    );
  }
}
