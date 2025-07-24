/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable rxjs-angular/prefer-composition */
/* eslint-disable @typescript-eslint/no-inferrable-types */

import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular';
import { ArchiveActionService } from './../../../../../../../../../apps/mango-crem-features/object-actions/src/app/shared/services/archive-action.service';
import {
  faArchive,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import {
  ButtonModule,
  CremToastService,
  DropdownModule,
  LoaderModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { CommonModule } from '@angular/common';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { DevExtremeModule, DxDataGridModule } from 'devextreme-angular';

@Component({
  selector: 'mango-archive-action',
  templateUrl: './archive-lease.component.html',
  styleUrls: ['./archive-lease.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    LoaderModule,
    DropdownModule,
    ModalModule,
    DevExtremeModule,
    DxDataGridModule,
  ],
  providers: [ArchiveActionService],
})
export class ArchiveLeaseComponent implements OnInit {
  public buildingData: any = [];
  public leaseData: any = [];
  public selectedLeaseData: any = [];
  public apiData: any = [];
  public buildingGridColumns: any[] | null = [];
  public subLeaseGridColumns: any[] | null = [];
  public leaseGridColumns: any[] | null = [];
  public leaseSelected: boolean = false;
  public modalTitle: string;
  public archiveType: string;
  public buildingDefaultSelectedRow: number[] = [];
  public leaseSelectedRow: number[] = [];
  public leaseDefaultSelectedRow: number[] = [];
  public buildingSelected: boolean = false;
  public archived: boolean = false;
  public archivedSuccess: boolean = false;
  public primaryFooterButtonText: string = 'Archive';
  public closeOrCancelButtonText: string = 'Cancel';
  public checkBoxUpdating: boolean = false;
  public masterDetailsCheckbox: any;
  public loading: boolean = true;
  public archiving: boolean = false;
  public hasScheduled: boolean = false;
  public hasScheduledCheckbox: boolean = false;
  public inProcessCount: number = 0;
  public scheduledCount: number = 0;
  public defaultLeaseInProcessCountCount: number = 0;
  public defaultLeaseScheduledCount: number = 0;
  public objectTypeTypeName: string;
  public noAssociatedLeaseBuildingText: string = '';
  public buildingTemplate: string;
  public premiseTemplate: string;
  public dateFormat: string = 'MM/dd/yyyy';
  public prefix: string = 'building-lease-archive-';

  @ViewChild('DataGrid', { static: false }) dataGrid: DxDataGridComponent;
  @ViewChild('BuildingDataGrid', { static: false })
  buildingDataGrid: DxDataGridComponent;

  faArchive = faArchive;
  faExclamationTriangle = faExclamationTriangle;

  constructor(
    public dialogRef: MatDialogRef<ArchiveLeaseComponent>,
    public service: ArchiveActionService,
    private router: Router,
    private facade: MangoAppFacade,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      archiveType: string;
      OID: number;
      OTTID: number;
      hiddenPremise: number;
    }
  ) {}

  ngOnInit(): void {
    this.archiveType = this.data.archiveType;

    this.facade.contactRecord$.subscribe((contact) => {
      let isEuroDateFormat = contact.preferences.contactDatesEU;
      this.dateFormat = isEuroDateFormat ? 'dd.MM.yyyy' : 'MM/dd/yyyy';

      this.getGridData();
    });
  }

  yesDelete() {
    this.close('Yes');
  }

  public close(data: any) {
    this.dialogRef.close(data);
    if (this.archivedSuccess) {
      let path = window.location.pathname;
      let params = window.location.search;
      params = params.replace('&pgMode=Edit', '');

      this.router.navigateByUrl(`${path}${params}`);
    }
  }

  public onGridContentReady() {
    this.dataGrid.instance.getScrollable().scrollTo(0);
  }

  public onCellPrepared(event) {
    if (event.column.dataField === 'Reason' && event.rowType === 'data') {
      event.cellElement.style.color = '#DE0000';
    }
  }

  public getGridData() {
    if (this.archiveType === 'Lease') {
      this.service
        .getBuildingsPremiseLeaseAssociations(
          this.data.OID,
          0,
          this.data.hiddenPremise
        )
        .subscribe((result) => {
          this.selectedLeaseData = JSON.parse(JSON.stringify(result.data));
          this.buildingData = result.data;
          if (this.selectedLeaseData.length) {
            this.objectTypeTypeName = this.buildingData[0].LeaseTemplate;
            this.buildingTemplate = this.buildingData[0].BuildingTemplate;
            this.buildModalTitle();
          }

          this.dataSoftValidation(this.buildingData, 'buildingData');
          this.service
            .getBuildingPremiseArchiveData(
              Number(result.data?.[0]?.BuildingID),
              0,
              2,
              this.data.hiddenPremise
            )
            .subscribe((result) => {
              this.leaseData = result.data;
              if (this.leaseData.length) {
                this.premiseTemplate = this.leaseData[0].PremiseTemplate;
              }

              this.dataSoftValidation(this.leaseData, 'leaseData');
              this.archiveValidation();
              this.sortLeaseData();
              this.setGridData();
            });
        });
    } else if (this.archiveType === 'Premise') {
      this.service
        .getBuildingPremiseArchiveData(
          0,
          this.data.OID,
          5,
          this.data.hiddenPremise
        )
        .subscribe((result) => {
          this.buildingData = result.data;
          if (this.buildingData.length) {
            this.objectTypeTypeName = this.buildingData[0].BuildingTemplate;
            this.buildingTemplate = this.buildingData[0].BuildingTemplate;
            this.buildModalTitle();
          }
          this.service
            .getBuildingPremiseArchiveData(
              0,
              this.data.OID,
              4,
              this.data.hiddenPremise
            )
            .subscribe((result) => {
              this.leaseData = result.data;
              if (this.leaseData.length) {
                this.premiseTemplate = this.leaseData[0].PremiseTemplate;
              }
              this.dataSoftValidation(result.data, 'leaseData');
              this.archiveValidation();
              this.sortLeaseData();
              this.setGridData();
            });
        });
    } else {
      this.service
        .getBuildingPremiseArchiveData(
          this.data.OID,
          0,
          1,
          this.data.hiddenPremise
        )
        .subscribe((result) => {
          this.buildingData = result.data;
          if (this.buildingData.length) {
            this.objectTypeTypeName = this.buildingData[0].BuildingTemplate;
            this.buildingTemplate = this.buildingData[0].BuildingTemplate;
            this.buildModalTitle();
          }
          this.service
            .getBuildingPremiseArchiveData(
              this.data.OID,
              0,
              2,
              this.data.hiddenPremise
            )
            .subscribe((result) => {
              this.leaseData = result.data;
              if (this.leaseData.length) {
                this.premiseTemplate = this.leaseData[0].PremiseTemplate;
              }
              this.dataSoftValidation(result.data, 'leaseData');
              this.archiveValidation();
              this.sortLeaseData();
              this.setGridData();
            });
        });
    }
  }

  public archiveValidation() {
    // if inProcess count > 0, hard stop for archiving, retrieve error Reasons for leases
    const needArchive = this.getValidationStatus();
    if (needArchive) {
      this.archive();
    }
  }

  public dataSoftValidation(data, dataType) {
    // validates if lease have scheduled or in process
    if (data?.length) {
      data.forEach((item) => {
        if (item.InProcessEvents > 0) {
          if (dataType === 'leaseData') {
            this.inProcessCount = this.inProcessCount + 1;
          } else {
            this.defaultLeaseInProcessCountCount =
              this.defaultLeaseInProcessCountCount + 1;
          }
        }

        if (item.ScheduledEvents > 0) {
          if (dataType === 'leaseData') {
            this.scheduledCount = this.scheduledCount + 1;
          } else {
            this.defaultLeaseScheduledCount =
              this.defaultLeaseScheduledCount + 1;
          }
        }
      });
      this.hasScheduledValidation();
    }
  }

  public hasScheduledValidation() {
    // set condition for scheduled checkbox
    this.hasScheduled =
      (this.archiveType === 'Lease' &&
        ((this.buildingSelected && this.scheduledCount > 0) ||
          (!this.buildingSelected && this.defaultLeaseScheduledCount > 0))) ||
      ((this.archiveType === 'Building' || this.archiveType === 'Premise') &&
        this.scheduledCount > 0);
  }

  public closeDialog() {
    this.dialogRef.close('');
    if (this.archivedSuccess) {
      let path = window.location.pathname;
      let params = window.location.search;
      params = params.replace('&pgMode=Edit', '');

      this.router.navigateByUrl(`${path}${params}`);
    }
  }

  public archive() {
    if (this.archived) {
      this.dialogRef.close();
      return;
    }

    this.archiving = true;
    this.closeOrCancelButtonText = 'OK';
    this.primaryFooterButtonText = '';
    let leaseId = 0;
    let buildingId = 0;
    let premiseId = 0;

    if (this.archiveType === 'Lease') {
      if (this.buildingSelected) {
        // just pass in building and lease id
        leaseId = 0;
        premiseId = 0;
        buildingId = this.buildingData?.[0]?.BuildingID || 0;
      } else {
        // pass pass in lease id
        leaseId = this.selectedLeaseData?.[0]?.LeaseAbstractID || 0;
        buildingId = 0;
        premiseId = 0;
      }
    } else if (this.archiveType === 'Building') {
      // pass in building id
      leaseId = 0;
      buildingId = this.buildingData?.[0]?.BuildingID || 0;
      premiseId = 0;
    } else {
      // pass in premise id for Premise
      leaseId = 0;
      buildingId = 0;
      premiseId = this.buildingData?.[0]?.BuildingID || 0;
    }

    this.service
      .archiveBuildingPremiseLease(
        buildingId,
        premiseId,
        leaseId,
        this.data.hiddenPremise
      )
      .subscribe((result) => {
        this.archived = true;
        if (result.success && result?.data?.length === 0) {
          this.archivedSuccess = true;
        } else {
          if (result?.data?.length) {
            result.data.forEach((item) => {
              const errorItem = this.leaseData.find((leaseData) => {
                return leaseData.LeaseAbstractID === item.leaseAbstractID;
              });
              const defaultErrorItem = this.selectedLeaseData.find(
                (selectedLeaseData) => {
                  return (
                    selectedLeaseData.LeaseAbstractID === item.leaseAbstractID
                  );
                }
              );
              if (errorItem) {
                if (!errorItem.Reason || errorItem.Reason === item.reason) {
                  errorItem.Reason = item.reason;
                } else {
                  this.leaseData.push(JSON.parse(JSON.stringify(errorItem)));
                  this.leaseData[this.leaseData.length - 1].Reason =
                    item.reason;
                }
              }
              if (defaultErrorItem) {
                if (!defaultErrorItem.Reason) {
                  defaultErrorItem.Reason = JSON.parse(
                    JSON.stringify(item.reason)
                  );
                } else {
                  if (!defaultErrorItem.Reason.includes(item.reason)) {
                    defaultErrorItem.Reason =
                      defaultErrorItem.Reason + ', ' + item.reason;
                  }
                }
              }
            });
          }
        }

        this.sortLeaseData();
        this.setGridcolumns();
      });
  }

  public sortLeaseData() {
    //sort by id
    this.leaseData.sort((a, b) => {
      if (a.LeaseAbstractID < b.LeaseAbstractID) {
        return -1;
      }
      if (a.LeaseAbstractID > b.LeaseAbstractID) {
        return 1;
      }
      return 0;
    });

    if (
      (this.hasScheduled && !this.archived) ||
      (this.archived && !this.archivedSuccess)
    ) {
      if (!this.archived) {
        //sort if soft reason exists
        this.leaseData.sort((a, b) => {
          if (!a.SoftReason && b.SoftReason) {
            return 1;
          }
          if (a.SoftReason && !b.SoftReason) {
            return -1;
          }
          return 0;
        });
      } else {
        //sort if reason exists
        this.leaseData.sort((a, b) => {
          if (!a.Reason && b.Reason) {
            return 1;
          }
          if (a.Reason && !b.Reason) {
            return -1;
          }
          return 0;
        });
      }
    }
  }

  public onCheckboxChange(event) {
    if (event.value === true) {
      this.leaseSelected = true;
    } else {
      this.leaseSelected = false;
    }
  }

  public onEditorPreparing(e) {
    if (this.archiveType !== 'Lease' || this.archived) {
      if (e.command === 'select') {
        if (e.parentType === 'dataRow' && e.row) {
          e.editorOptions.disabled = true;
          e.editorOptions.onValueChanged = (e) => {
            if (!e.event) {
              return;
            }
            e.event.preventDefault();
          };
        } else if (e.parentType === 'headerRow') {
          e.editorOptions.disabled = true;
          e.editorOptions.onValueChanged = (e) => {
            if (!e.event) {
              return;
            }
          };
        }
      }
    }
  }

  public onMasterDetailsEditorPreparing(e) {
    if (e.command === 'select') {
      if (e.parentType === 'dataRow' && e.row) {
        e.editorOptions.disabled = true;
        e.editorOptions.onValueChanged = (e) => {
          if (!e.event) {
            return;
          }
          e.event.preventDefault();
        };
      } else if (e.parentType === 'headerRow') {
        e.editorOptions.disabled = true;
        e.editorOptions.onValueChanged = (e) => {
          if (!e.event) {
            return;
          }
        };
      }
    }
  }

  public onleaseDefaultEditorPreparing(e) {
    if (e.command === 'select') {
      if (e.parentType === 'dataRow' && e.row) {
        e.editorOptions.disabled = true;
        e.editorOptions.onValueChanged = (e) => {
          if (!e.event) {
            return;
          }
          e.event.preventDefault();
        };
      } else if (e.parentType === 'headerRow') {
        e.editorOptions.disabled = true;
        e.editorOptions.onValueChanged = (e) => {
          if (!e.event) {
            return;
          }

          e.event.preventDefault();
        };
      }
    }
  }

  public onleaseDefaultSelectionChanged(e) {
    if (!this.checkBoxUpdating) {
      this.checkBoxUpdating = true;
      if (e.currentDeselectedRowKeys.length) {
        e.component.selectRows(
          e.selectedRowKeys.concat(e.currentDeselectedRowKeys[0])
        );
      } else if (e.currentSelectedRowKeys.length) {
        e.component.deselectRows(e.currentSelectedRowKeys[0]);
      }
    }
    setTimeout(() => {
      this.checkBoxUpdating = false;
    });
  }

  public onSelectionChanged(e) {
    if (this.archiveType !== 'Lease' || this.archived) {
      if (!this.checkBoxUpdating) {
        this.checkBoxUpdating = true;
        if (e.currentDeselectedRowKeys.length) {
          e.component.selectRows(
            e.selectedRowKeys.concat(e.currentDeselectedRowKeys[0])
          );
        } else if (e.currentSelectedRowKeys.length) {
          e.component.deselectRows(e.currentSelectedRowKeys[0]);
        }
      }
      setTimeout(() => {
        this.checkBoxUpdating = false;
      });
    } else {
      this.checkBoxUpdating = true;
      if (e.currentSelectedRowKeys.length) {
        const keyArray = this.leaseData.map((item) => {
          return item.LeaseAbstractID;
        });
        this.dataGrid.selectedRowKeys = keyArray;
        this.leaseSelectedRow = [];
        this.leaseData.forEach((item) => {
          this.leaseSelectedRow.push(item.LeaseAbstractID);
        });
      } else {
        this.dataGrid.selectedRowKeys = [this.selectedLeaseData[0]];
        this.leaseSelectedRow = [];
        this.leaseSelectedRow.push(this.selectedLeaseData[0].LeaseAbstractID);
      }
      setTimeout(() => {
        this.checkBoxUpdating = false;
      });

      if (e.selectedRowKeys?.length) {
        this.buildingSelected = true;
        this.objectTypeTypeName = this.buildingData?.[0]?.BuildingTemplate;
      } else {
        this.buildingSelected = false;
        this.objectTypeTypeName = this.selectedLeaseData?.[0]?.LeaseTemplate;
      }
      this.buildModalTitle();
      this.hasScheduledValidation();
      this.sortLeaseData();
      this.setGridcolumns();
    }
  }

  public onMasterDetailsSelectionChanged(e) {
    if (!this.checkBoxUpdating) {
      this.checkBoxUpdating = true;
      if (e.currentDeselectedRowKeys.length) {
        // e.component.selectRows(e.currentDeselectedRowKeys[0]);
        e.component.selectRows(
          e.selectedRowKeys.concat(e.currentDeselectedRowKeys[0])
        );
        this.masterDetailsCheckbox = e;
      } else if (e.currentSelectedRowKeys.length) {
        e.component.deselectRows(e.currentSelectedRowKeys[0]);
        this.masterDetailsCheckbox = e;
      }
    }
    setTimeout(() => {
      this.checkBoxUpdating = false;
    });
  }

  private buildModalTitle() {
    this.modalTitle = `Archive ${this.objectTypeTypeName}`;
  }

  private setGridData() {
    this.noAssociatedLeaseBuildingText =
      'This ' +
      this.buildingTemplate?.toLowerCase() +
      ' has no associated leases.';
    if (this.data.archiveType === 'Lease') {
      this.leaseSelectedRow = [];
      this.leaseSelectedRow.push(this.selectedLeaseData[0].LeaseAbstractID);
      this.leaseDefaultSelectedRow = [];
      this.leaseDefaultSelectedRow.push(
        this.selectedLeaseData[0].LeaseAbstractID
      );
    } else {
      this.buildingDefaultSelectedRow = [];
      this.leaseSelectedRow = [];
      this.buildingData.forEach((item) => {
        this.buildingDefaultSelectedRow.push(item.BuildingID);
      });
      this.leaseData.forEach((item) => {
        this.leaseSelectedRow.push(item.LeaseAbstractID);
      });
    }
    this.setGridcolumns();
  }

  private setGridcolumns() {
    this.subLeaseGridColumns = [
      {
        dataField: 'LeaseTemplate',
        caption: 'Template',
      },
      {
        dataField: 'LeaseAbstractID',
        caption: 'ID',
        alignment: 'left',
        dataType: 'number',
      },
      {
        dataField: 'TenantLegalName',
        caption: 'Name',
      },
      {
        dataField: 'Store',
        caption: this.premiseTemplate,
        visible: !!(this.data.hiddenPremise === 0 && this.premiseTemplate),
      },
      {
        dataField: 'ExpirationDate',
        caption: 'Expiration Date',
        dataType: 'date',
        format: this.dateFormat,
      },
      {
        dataField: 'Reason',
        caption: 'Reason',
        visible: this.archived && !this.archivedSuccess,
      },
      {
        dataField: 'SoftReason',
        caption: 'Reason',
        visible: this.hasScheduled && !this.archived,
      },
    ];
    this.leaseGridColumns = [
      {
        dataField: 'LeaseTemplate',
        caption: 'Template',
      },
      {
        dataField: 'LeaseAbstractID',
        caption: 'ID',
        alignment: 'left',
        dataType: 'number',
      },
      {
        dataField: 'TenantLegalName',
        caption: 'Name',
      },
      {
        dataField: 'ExpirationDate',
        caption: 'Expiration Date',
        dataType: 'date',
        format: this.dateFormat,
      },
      {
        dataField: 'Reason',
        caption: 'Reason',
        visible: this.archived && !this.archivedSuccess,
      },
    ];
    this.buildingGridColumns = [
      {
        dataField: 'BuildingTemplate',
        caption: 'Template',
      },
      {
        dataField: 'BuildingID',
        caption: 'ID',
        alignment: 'left',
        dataType: 'number',
      },
      {
        dataField: 'BuildingName',
        caption: 'Name',
      },
    ];

    const needArchive = this.getValidationStatus();
    if (!needArchive || this.archived) {
      this.archiving = false;
      this.loading = false;
    }
  }

  public getValidationStatus(): boolean {
    const inProcessCount =
      this.archiveType === 'Lease'
        ? this.defaultLeaseInProcessCountCount
        : this.inProcessCount;
    return inProcessCount > 0;
  }
}
