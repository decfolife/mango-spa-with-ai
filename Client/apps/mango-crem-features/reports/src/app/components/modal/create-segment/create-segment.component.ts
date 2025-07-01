import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { ReportsService } from '@reports/services/reports.service';
import { DynamicFormComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/dynamic-form/dynamic-form.component';
import { CriteriaFormSegmentComponent } from '@reports/components/criteria-form-segment/criteria-form-segment.component';
import { LargeModal } from '@mangoSpa/src/assets/enum/modal.model';
import { ToastState } from '@mango/data-models/lib-data-models';
import { CremToastService } from '@mango/ui-shared/lib-ui-elements';

@Component({
  selector: 'mango-create-segment',
  templateUrl: './create-segment.component.html',
  styleUrls: ['./create-segment.component.scss'],
})
export class CreateSegmentComponent implements OnInit {
  public segmentConfig: any;
  public criteriaSetConfig: any;
  public criteriaItemConfig: any;
  public emptyItemConfig: any;
  public segmentList: any;
  public loading: boolean = true;
  public idPrefix: string = 'CreateSegment';
  public hasSegmentNameInput: boolean = false;
  public segmentNameValid: boolean = false;
  public segmentLengthValid: boolean = true;
  public selectedCriteriaId: number;
  public selectedReportCriteriaSet: boolean = true;
  public customValidationValid: boolean = false;
  public reportsData: any;
  public segmentName: string = '';
  public duplicateSegmentName: boolean = false;
  public isItemSelected: boolean = false;
  public modalTitle: string = '';
  public criteriaSetModified: boolean = false;
  public textboxHasBeenModified: boolean = false;
  public defaultValues: any = {};
  public segmentFieldIDKey: any = {};
  public hintMessageText: string =
    'The segment name is the label given for the selected criteria below.';
  public emptySaveObject: any = [];
  public warningHint: boolean = false;
  public showloading: boolean = true;
  public hasEditRight: boolean;
  public hasViewRight: boolean;
  public saveAndNewClicked: boolean = false;
  public hasObjectEditRight: boolean;
  public hasObjectViewRight: boolean;
  public hasObjectDeleteRight: boolean;
  isSaveAndNew: boolean;
  currentCriteriaName: string;

  @ViewChild('CriteriaForm') criteriaForm: CriteriaFormSegmentComponent;
  @ViewChild('CriteriaSetForm') CriteriaSetForm: DynamicFormComponent;

  constructor(
    private reportsService: ReportsService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<CreateSegmentComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      segmentModuleRights: string;
      criteriaSetID: number;
      config: any;
      redirectData: any;
      openReportAction: string;
      segmentID: number;
      portfolioID: number;
      name: string;
      active: boolean;
      archived: boolean;
      hideToastsOn: string;
    },
    private toastService: CremToastService
  ) {}

  ngOnInit(): void {
    this.dialogRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') {
        this.cancelDialog(event);
      }
    });
    this.reportsService.getSegmentsRights(0, 2).subscribe((result) => {
      if (result.data) {
        this.hasEditRight = result.data.securityTypeID >= 3;
        this.hasViewRight = result.data.securityTypeID >= 2;
      }
    });
    if (this.data.segmentID) {
      this.reportsService
        .getSegmentsRights(this.data.segmentID, 2)
        .subscribe((result) => {
          if (result.data) {
            this.hasObjectDeleteRight = result.data.securityTypeID >= 5;
            this.hasObjectEditRight = result.data.securityTypeID >= 3;
            this.hasObjectViewRight = result.data.securityTypeID >= 2;
          }
          if (this.data.openReportAction === 'edit' && !this.data.archived) {
            if (this.hasObjectEditRight) {
              this.modalTitle = 'Edit Segment';
            } else {
              this.modalTitle = 'View Segment';
            }
          }
        });
    } else {
      this.hasObjectEditRight = true;
      this.hasObjectViewRight = true;
      this.hasObjectDeleteRight = true;
    }
    switch (this.data.openReportAction) {
      case 'edit':
        this.idPrefix = 'EditSegment';
        break;
      case 'copy':
      case 'saveAs':
        this.idPrefix = 'CopySegment';
        break;
      default:
        this.idPrefix = 'CreateSegment';
        break;
    }

    if (
      this.data.openReportAction === 'edit' ||
      this.data.redirectData?.source === 'editsegment'
    ) {
      if (this.data.archived) {
        this.modalTitle = 'Archived Segment';
        this.idPrefix = 'ArchivedSegment';
      } else if (
        this.data.openReportAction === 'copy' ||
        this.data.openReportAction === 'saveAs'
      ) {
        this.modalTitle = 'Create Segment';
        this.hintMessageText =
          'Copying saved segment "' + this.data.redirectData.segmentName + '".';
      }
      this.defaultValues['PortfolioID'] = this.data.portfolioID;
      if (this.data.openReportAction !== 'saveAs') {
        this.reportsService
          .getSegmentsFields(this.data.segmentID)
          .subscribe((result) => {
            result.data.forEach((item) => {
              const emptyItem: any = {};
              emptyItem.CriteriaID = item.criteriaID;
              emptyItem.segmentFieldID = item.segmentFieldID;
              this.segmentFieldIDKey[item.criteriaID] = item.segmentFieldID;
              if (item.dateData) {
                this.defaultValues[item.criteriaID] = item.dateData;
                emptyItem.DateData = null;
              } else if (item.floatData) {
                this.defaultValues[item.criteriaID] = item.floatData;
                emptyItem.FloatData = null;
              } else if (item.intData) {
                this.defaultValues[item.criteriaID] = item.intData;
                emptyItem.IntData = null;
              } else if (item.moneyData) {
                this.defaultValues[item.criteriaID] = item.moneyData;
                emptyItem.MoneyData = null;
              } else if (item.varcharData) {
                this.defaultValues[item.criteriaID] = item.varcharData;
                emptyItem.VarCharData = null;
              }
              this.emptySaveObject.push(emptyItem);
            });

            if (this.data.criteriaSetID) {
              this.selectedCriteriaId = this.data.criteriaSetID;
            }
          });
      }
    } else {
      this.modalTitle = 'Create Segment';
    }
    this.reportsService.getSegments().subscribe((result) => {
      this.segmentList = result.data;
    });

    this.reportsService.GetCriteriaSetList(2).subscribe((res) => {
      this.reportsData = res.data;
      this.setformConfig(this.data);
      this.loading = false;
      this.showloading = false;
      if (this.data.criteriaSetID) {
        this.selectedReportCriteriaSet = res.data.find(
          (x) => x.criteriaSetID == this.data.criteriaSetID
        ).isReportCriteriaSet;
      }
    });
    if (this.data.criteriaSetID && this.data.openReportAction === 'saveAs') {
      this.selectedCriteriaId = this.data.criteriaSetID;
    }
  }

  public setformConfig(data: any) {
    this.segmentName = this.data.name ? this.data.name : this.segmentName;

    if (this.segmentName) {
      this.segmentLengthValid = true;
      this.hasSegmentNameInput = true;
    }
    this.segmentConfig = {
      section: [
        {
          sectionId: 'create_segment',
          showBottomBorder: true,
          hideBorder: true,
          colCount: 2,
          formObjects: [
            {
              sectionItems: [
                {
                  dataField: 'segmentName',
                  fieldType: 'custom',
                  caption: 'Segment Name',
                  required: true,
                  customRequireValidation: true,
                  disabled: false,
                  value: this.data.name ? this.data.name : '',
                  initialFocus: true,
                },
              ],
            },
          ],
        },
      ],
    };
    let selectedCriteria;
    if (this.data.criteriaSetID) {
      selectedCriteria = this.reportsData.find((object) => {
        return object?.['criteriaSetID'] == this.data.criteriaSetID;
      });

      this.onCriteriaDropdownChange([
        { criteriaSetID: this.data.criteriaSetID },
      ]);
    }

    this.criteriaSetConfig = {
      section: [
        {
          sectionId: 'CriteriaItems',
          showBottomBorder: true,
          hideBorder: true,
          colCount: 2,
          formObjects: [
            {
              sectionItems: [
                {
                  dataField: 'criteriaSet',
                  fieldType: 'custom',
                  caption: 'Criteria Set',
                  required: true,
                  disabled:
                    this.data.openReportAction === 'edit' ||
                    this.data.redirectData?.source === 'editsegment',
                  customRequireValidation: true,
                  displayExpr: 'name',
                  valueExpr: 'criteriaSetID',
                  dataSource: this.reportsData,
                  selectMode: 'single',
                  hoverText: 'Select the criteria set of the project',
                  value:
                    this.data.criteriaSetID && selectedCriteria
                      ? [selectedCriteria]
                      : [],
                },
              ],
            },
          ],
        },
      ],
    };

    this.emptyItemConfig = {
      section: [
        {
          sectionId: 'EmptyItems',
          hideBorder: true,
          colCount: 2,
          formObjects: [
            {
              sectionItems: [
                {
                  fieldType: 'empty',
                  caption: 'Select Criteria',
                  customClass: 'disabled',
                },
              ],
            },
          ],
        },
      ],
    };
  }

  public onSegmentTextChange(segmentName) {
    if (
      segmentName &&
      segmentName.length <= 100 &&
      (this.data.openReportAction === 'copy' ||
        this.data.openReportAction === 'saveAs')
    ) {
      this.segmentLengthValid = true;
      this.hasSegmentNameInput = true;
      this.duplicateSegmentName = false;
      this.segmentNameValid = true;
      this.warningHint = false;
      this.hintMessageText =
        'Copying saved segment "' + this.data.redirectData.segmentName + '".';
    } else if (segmentName && segmentName.length <= 100) {
      this.segmentLengthValid = true;
      this.hasSegmentNameInput = true;
      this.duplicateSegmentName = false;
      this.segmentNameValid = true;
      this.warningHint = false;
      this.hintMessageText =
        'The segment name is the label given for the selected criteria below.';
    } else if (segmentName.length > 100) {
      this.segmentLengthValid = false;
      this.hasSegmentNameInput = true;
      this.duplicateSegmentName = false;
      this.segmentNameValid = false;
      this.warningHint = true;
      this.hintMessageText = 'Character limit of 100 reached.';
    } else {
      this.segmentLengthValid = true;
      this.hasSegmentNameInput = false;
      this.duplicateSegmentName = false;
      this.segmentNameValid = false;
      this.warningHint = true;
      this.hintMessageText = 'A segment name is required.';
    }
    this.textboxHasBeenModified = true;
    this.segmentName = segmentName;
  }

  public onFormItemChange(data) {
    setTimeout(() => {
      this.isItemSelected = data;
    });
  }

  public onCriteriaLoadedChange(data) {}

  public setLoading(loading) {
    this.showloading = loading;
  }

  public onChange(data) {}

  public onCriteriaDropdownChange(event) {
    if (
      this.data.openReportAction !== 'edit' &&
      this.data.redirectData?.source !== 'editsegment'
    ) {
      setTimeout(() => {
        this.selectedCriteriaId = undefined;
        this.CriteriaSetForm?.onChange(event, 'dropdown', 'criteriaSet');
      });

      setTimeout(() => {
        if (event?.length) {
          this.showloading = true;
          this.criteriaSetModified = true;
          this.selectedCriteriaId = event[0].criteriaSetID;
          this.selectedReportCriteriaSet = this.reportsData.find(
            (x) => x.criteriaSetID == this.selectedCriteriaId
          ).isReportCriteriaSet;
        }
        this.currentCriteriaName = this.reportsData.find(
          (x) => x.criteriaSetID == this.selectedCriteriaId
        ).name;
      });
    }
  }

  public saveAsClicked(event) {
    this.criteriaSetModified = true;
    this.textboxHasBeenModified = true;
    this.segmentName = this.segmentName.trim();
    this.onSegmentTextChange(this.segmentName);
    if (!this.loading) {
      if (
        !(
          !this.selectedCriteriaId ||
          !this.isItemSelected ||
          !this.segmentLengthValid ||
          !this.hasSegmentNameInput
        )
      ) {
        const config = this.criteriaForm?.criteriaDynamicForm?.getConfig();
        const depConfig =
          this.criteriaForm?.dependentCriteriaDynamicForm?.getConfig();
        let saveObject = [];
        let depSaveObject = [];
        let newSegmentConfig = {};
        if (this.isItemSelected) {
          newSegmentConfig['PortfolioID'] = this.criteriaForm.selectedPortfolio;
        }

        if (config) {
          saveObject = this.criteriaForm.getSaveObject(
            config,
            saveObject,
            false
          );
        }
        if (depConfig) {
          depSaveObject = this.criteriaForm?.getSaveObject(
            depConfig,
            depSaveObject,
            true
          );
        }

        saveObject.forEach((x, index) => {
          if (config[x.FieldName]) {
            if (config[x.FieldName].fieldType !== 'toFromDate') {
              newSegmentConfig[config[x.FieldName]?.data.criteriaID] =
                Object.values(x)[1];
            } else {
              newSegmentConfig[config[x.FieldName]?.data.criteriaID1] =
                saveObject[index].DateData;
              newSegmentConfig[config[x.FieldName]?.data.criteriaID2] =
                saveObject[index + 1].DateData;
            }
          }
        });
        depSaveObject.forEach((x, index) => {
          if (depConfig[x.CriteriaID]) {
            newSegmentConfig[x.CriteriaID] = Object.values(x)[1];

            if (depConfig[x.CriteriaID].fieldType !== 'toFromDate') {
              newSegmentConfig[depConfig[x.CriteriaID]?.data.criteriaID] =
                Object.values(x)[1];
            } else {
              newSegmentConfig[depConfig[x.CriteriaID]?.data.criteriaID1] =
                depSaveObject[index].DateData;
              newSegmentConfig[depConfig[x.CriteriaID]?.data.criteriaID2] =
                depSaveObject[index + 1].DateData;
            }
          }
        });
        const saveAsConfig = {
          height: LargeModal.Height,
          width: LargeModal.Width,
          maxWidth: LargeModal.MaxWidth,
          maxHeight: LargeModal.MaxHeight,
          disableClose: true,
          data: {
            redirectData: {
              source: 'editsegment',
              segmentName: this.segmentName,
            },
            config: newSegmentConfig,
            criteriaSetID: this.selectedCriteriaId,
            openReportAction: 'saveAs',
            archived: this.data.archived,
            hideToastsOn: this.data.hideToastsOn,
          },
        };
        this.dialogRef.close(saveAsConfig);
      } else if (!this.selectedCriteriaId || !this.isItemSelected) {
        this.showNotifyMessage('noSelectedCriteria');
      }
    }
  }

  public saveSegment(event, isSaveAndNew) {
    this.criteriaSetModified = true;
    this.textboxHasBeenModified = true;
    this.segmentName = this.segmentName?.trim();
    this.onSegmentTextChange(this.segmentName);

    if (this.loading || this.isSaveDisabled()) {
      return;
    }

    if (
      !(
        !this.selectedCriteriaId ||
        !this.isItemSelected ||
        !this.segmentLengthValid ||
        !this.hasSegmentNameInput
      )
    ) {
      if (this.segmentName) {
        setTimeout(() => {
          const dependentConfig =
            this.criteriaForm.dependentCriteriaDynamicForm?.getConfig();
          let requiredFieldMissing = false;
          let saveObject = [];
          let dependentItemSelected = false;
          let nonDependentItemSelected = false;
          if (dependentConfig) {
            Object.values(dependentConfig).forEach((item: any) => {
              if (item.required && item.value.length === 0) {
                requiredFieldMissing = true;
              } else if (item.value.length !== 0) {
                dependentItemSelected = true;
              }
            });
            saveObject = this.criteriaForm.getSaveSegmentObject(
              dependentConfig,
              saveObject
            );
          }

          const config = this.criteriaForm.criteriaDynamicForm?.getConfig();
          if (config) {
            Object.values(config).forEach((item: any) => {
              if (
                item.required &&
                ((item.value == null && (!item.value1 || !item.value2)) ||
                  item.value?.length === 0 ||
                  item.value1?.length === 0 ||
                  item.value2?.length === 0)
              ) {
                requiredFieldMissing = true;
              } else if (item.value?.length !== 0) {
                nonDependentItemSelected = true;
              }
            });
            saveObject = this.criteriaForm.getSaveSegmentObject(
              config,
              saveObject
            );
          }
          if (!(dependentItemSelected || nonDependentItemSelected)) {
            this.showNotifyMessage('noSelectedCriteria');
          } else {
            if (this.data.openReportAction === 'edit') {
              saveObject.forEach((saveItem) => {
                const segmentFieldID =
                  this.segmentFieldIDKey[saveItem.CriteriaID];
                if (segmentFieldID) {
                  saveItem['segmentFieldID'] = segmentFieldID;
                }
              });

              saveObject = this.buildEmptySaveObject(saveObject);
            }
            if (!(this.data.openReportAction === 'edit')) {
              this.data.segmentID = 0;
            }
            const request = {
              SegmentID: this.data.segmentID ? this.data.segmentID : 0,
              CriteriaSetID: this.selectedCriteriaId,
              Name: this.segmentName,
              SegmentFields: saveObject,
              Active: true,
              PortfolioID: this.criteriaForm.selectedPortfolio,
            };

            if (!requiredFieldMissing) {
              this.showloading = true;
              this.reportsService.saveSegments(request).subscribe((result) => {
                this.showloading = false;
                if (result?.data === -2) {
                  this.setInvalidName();
                } else {
                  this.toastService.show(
                    'Segment saved successfully.',
                    undefined,
                    ToastState.SUCCESS,
                    {
                      maxWidth: '500px',
                      duration: 3000,
                      closeOnClick: true,
                    }
                  );
                  if (isSaveAndNew) {
                    this.saveAndNewClicked = true;
                    this.loading = true;
                    this.selectedCriteriaId = undefined; // Resets Criteria ID
                    this.selectedReportCriteriaSet = undefined;
                    this.criteriaSetModified = false; // Resets criteria set input validation
                    // this.isItemSelected = false;
                    // this.segmentLengthValid = true;
                    // this.hasSegmentNameInput = false;
                    this.segmentName = undefined;
                    // this.defaultValues = undefined;
                    this.data.config = undefined;
                    this.data.criteriaSetID = undefined;
                    this.data.redirectData = null; // Makes criteria set selectable
                    this.data.openReportAction = 'create';
                    this.idPrefix = 'CreateSegment';
                    this.hintMessageText =
                      'The segment name is the label given for the selected criteria below.';
                    this.criteriaForm?.criteriaDynamicForm.clearForm();
                    this.setformConfig(null);
                    setTimeout(() => {
                      this.loading = false;
                    });
                  } else {
                    if (this.data.redirectData?.source === 'runreport') {
                      const config =
                        this.criteriaForm?.criteriaDynamicForm?.getConfig();
                      const depConfig =
                        this.criteriaForm?.dependentCriteriaDynamicForm?.getConfig();
                      let saveObject = [];
                      let depSaveObject = [];
                      let newSegmentConfig = {};
                      if (this.isItemSelected) {
                        newSegmentConfig['PortfolioID'] =
                          this.criteriaForm.selectedPortfolio;
                      }

                      if (config) {
                        saveObject = this.criteriaForm.getSaveObject(
                          config,
                          saveObject,
                          false
                        );
                      }
                      if (depConfig) {
                        depSaveObject = this.criteriaForm?.getSaveObject(
                          depConfig,
                          depSaveObject,
                          true
                        );
                      }

                      saveObject.forEach((x) => {
                        if (config[x.FieldName]) {
                          newSegmentConfig[
                            config[x.FieldName]?.data.criteriaID
                          ] = Object.values(x)[1];
                        }
                      });
                      depSaveObject.forEach((x) => {
                        if (depConfig[x.CriteriaID]) {
                          newSegmentConfig[x.CriteriaID] = Object.values(x)[1];
                        }
                      });
                      const reportConfig = {
                        height: LargeModal.Height,
                        width: LargeModal.Width,
                        maxWidth: LargeModal.MaxWidth,
                        maxHeight: LargeModal.MaxHeight,
                        disableClose: true,
                        data: {
                          reportId: this.data.redirectData.reportID,
                          reportName: this.data.redirectData.reportName,
                          redirectData: {
                            segmentValues: newSegmentConfig,
                            newSegmentID: result.data,
                          },
                        },
                      };
                      this.dialogRef.close(reportConfig);
                    } else {
                      this.dialogRef.close('refresh');
                    }
                  }
                }
              });
            } else {
              if (this.data.hideToastsOn === this.currentCriteriaName) {
                // Do nothing
              } else {
                this.toastService.show(
                  'Required Field Missing.',
                  undefined,
                  ToastState.ERROR,
                  {
                    maxWidth: '500px',
                    duration: 5000,
                    closeOnClick: true,
                  }
                );
              }
            }
          }
        });
      }
    } else if (!this.selectedCriteriaId || !this.isItemSelected) {
      this.showNotifyMessage('noSelectedCriteria');
    }
  }

  public unarchiveSegment(event) {
    let request = { SegmentID: this.data.segmentID };
    this.showloading = true;
    this.reportsService.unarchiveSegment(request).subscribe((result) => {
      this.showloading = false;
      if (result) {
        this.data.archived = false;
        this.modalTitle = 'Edit Segment';
        this.idPrefix = 'EditSegment';
        this.toastService.show(
          'Segment unarchived successfully.',
          undefined,
          ToastState.SUCCESS,
          {
            maxWidth: '500px',
            duration: 5000,
            closeOnClick: true,
          }
        );
        this.dialogRef.close('refresh');
      }
    });
  }

  public showNotifyMessage(messageType) {
    if (messageType === 'noSelectedCriteria') {
      if (this.data.hideToastsOn === this.currentCriteriaName) {
        return;
      }
      this.toastService.show(
        'At least one criteria selection is required.',
        undefined,
        ToastState.ERROR,
        {
          maxWidth: '500px',
          duration: 5000,
          closeOnClick: true,
        }
      );
    }
  }

  public setInvalidName() {
    this.duplicateSegmentName = true;
    this.warningHint = true;
    this.hintMessageText = 'A segment with this name already exists.';
  }

  public closeDialog(event) {
    this.dialogRef.close('refresh');
  }

  public buildEmptySaveObject(saveObject) {
    // set default value to null if default value not in save object
    this.emptySaveObject.forEach((emptyItem) => {
      const item = saveObject.some((saveItem) => {
        return saveItem.CriteriaID == emptyItem.CriteriaID;
      });
      if (!item) {
        saveObject.push(emptyItem);
      }
    });
    return saveObject;
  }

  public cancelDialog(event) {
    if (this.saveAndNewClicked) {
      this.dialogRef.close('refresh');
    } else {
      this.dialogRef.close();
    }
  }

  /**
   * Determines if the Save button is enabled/disabled
   *
   * @return {*}  {boolean}
   * @memberof CreateSegmentComponent
   */
  isSaveDisabled(): boolean {
    if (
      this.data.openReportAction === 'copy' &&
      this.data.segmentModuleRights === 'Add'
    ) {
      return false;
    }
    return this.data?.archived || !this.hasObjectEditRight;
  }

  getSaveAttrTitle(): string {
    let title = '' as string;

    if (this.data.segmentModuleRights !== 'Add' && !this.hasObjectEditRight) {
      title =
        'You have View rights to this segment. Ask your administrator to grant you additional rights to edit this segment.';
    }
    return title;
  }
}
