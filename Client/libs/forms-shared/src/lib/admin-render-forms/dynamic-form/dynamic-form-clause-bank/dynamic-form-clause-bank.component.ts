import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DynamicFormsService } from '@forms/services/dynamic-forms.service';
import { isTruthy, MangoDialogService } from '@mango/core-shared';
import { ToastState } from '@mango/data-models/lib-data-models';
import {
  ButtonModule,
  CremToastService,
  DropdownModule,
  LoaderModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { LibUiSharedModule } from '@mango/ui-shared/lib-ui-shared';
import { DevExtremeModule } from 'devextreme-angular';
import {
  DxDataGridComponent,
  DxDataGridModule,
} from 'devextreme-angular/ui/data-grid';
import { DxLoadPanelModule } from 'devextreme-angular/ui/load-panel';
import { off, on } from 'devextreme/events';
import { Subscription } from 'rxjs';

@Component({
  selector: 'mango-dynamic-form-clause-bank',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ModalModule,
    DropdownModule,
    DevExtremeModule,
    DxLoadPanelModule,
    LoaderModule,
    DxDataGridModule,
    LibUiSharedModule,
  ],
  templateUrl: './dynamic-form-clause-bank.component.html',
  styleUrls: ['./dynamic-form-clause-bank.component.scss'],
})
export class DynamicFormClauseBankComponent implements OnInit, OnDestroy {
  @ViewChild('ClauseBankGrid') clauseBankGrid: DxDataGridComponent;
  private subs = new Subscription();
  saveClicked: boolean = false;

  modalTitle: string;
  disableSaveButton: boolean = true;
  isClauseBankLoading: boolean = true;
  changesMade: boolean = false;
  clauseTypeId: number;
  clauseTypes: any = [];
  clauseBanks: any = [];
  enablePasteSelected: boolean = false;
  selectedClauseBank: string;
  selectionChangedRaised: boolean = false;
  cellKeys: any = [];
  rowKeys: any = [];
  selectedRowKeys: any = [];

  constructor(
    public dialogRef: MatDialogRef<DynamicFormClauseBankComponent>,
    private dynamicFormsService: DynamicFormsService,
    private toastService: CremToastService,
    private dialogService: MangoDialogService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      clauseTypeId: number;
    }
  ) {}

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  ngOnInit(): void {
    this.modalTitle = 'Clause Bank';
    this.changesMade = false;
    this.getClauseTypes();
    this.clauseTypeId = this.data.clauseTypeId;
    this.getClauseBanks(this.clauseTypeId);
  }

  onPopupResize() {
    this.clauseBankGrid.instance.updateDimensions();
  }

  onClauseTypeChanged(e: any) {
    if (e.length != 0 && e[0].clauseTypeID) {
      this.clauseTypeId = e[0].clauseTypeID;
      this.getClauseBanks(this.clauseTypeId);
    } else {
      this.clauseTypeId = 0;
      this.clauseBanks = [];
    }
  }

  close() {
    this.dialogRef.close('');
  }

  onPasteSelected() {
    this.dialogRef.close(this.selectedClauseBank);
  }

  notifySuccessMessage(message: string) {
    this.toastService.show(message, 'Success', ToastState.SUCCESS, {
      position: 'bottom right',
      maxWidth: '500px',
    });
  }

  notifyErrorMessage(errorMessage: string) {
    this.toastService.show(errorMessage, 'Error', ToastState.ERROR, {
      position: 'bottom right',
      maxWidth: '350px',
    });
  }

  getClauseTypes() {
    this.subs.add(
      this.dynamicFormsService.getClauseTypes().subscribe(
        (res) => {
          if (res && res.success) {
            this.clauseTypes = res.data;
          } else {
            this.clauseTypes = [];
            this.notifyErrorMessage(
              'There was an issue loading details. Please review and try again.'
            );
          }
        },
        (error: any) => {
          this.notifyErrorMessage(
            'There was an error loading details. Please review and try again.'
          );
          console.log('Error occurred while loading ClauseTypes: ', error);
        }
      )
    );
  }

  getClauseBanks(clauseTypeId: number) {
    this.subs.add(
      this.dynamicFormsService.getClauseBanks(clauseTypeId).subscribe(
        (res) => {
          if (res && res.success) {
            this.clauseBanks = res.data;
            this.isClauseBankLoading = false;
          } else {
            this.clauseBanks = [];
            this.notifyErrorMessage(
              'There was an issue loading details. Please review and try again.'
            );
          }
        },
        (error: any) => {
          this.notifyErrorMessage(
            'There was an error loading details. Please review and try again.'
          );
          console.log('Error occurred while loading ClauseBanks: ', error);
        }
      )
    );
  }

  addButtonClick(e: any) {
    this.clauseBankGrid.instance.addRow();
  }

  onSelectionChanged(e: any) {
    this.selectedRowKeys = e.selectedRowKeys;

    if (e.selectedRowKeys.length > 0) {
      this.enablePasteSelected = true;
      this.selectedClauseBank = e.selectedRowsData[0].clause;
    } else {
      this.enablePasteSelected = false;
      this.selectedClauseBank = '';
    }

    this.selectionChangedRaised = true;
  }

  onRowClick(e) {
    const dataGrid = this.clauseBankGrid.instance;
    this.rowKeys = dataGrid.getSelectedRowKeys();

    if (
      (this.selectionChangedRaised && this.cellKeys.toString() === this.selectedRowKeys.toString()) &&
      this.rowKeys.toString() === this.selectedRowKeys.toString()
    ) {
      dataGrid.deselectRows(this.rowKeys);
    }
  }

  onCellClick(e) {
    const dataGrid = this.clauseBankGrid.instance;
    this.cellKeys = dataGrid.getSelectedRowKeys();

    if (
      !this.selectionChangedRaised &&
      this.cellKeys.toString() === this.selectedRowKeys.toString()
    ) {
      dataGrid.deselectRows(this.cellKeys);
    }
    this.selectionChangedRaised = false;
  }

  onEditorPreparing(e) {
    if (
      (e.dataField === 'clause' || e.dataField === 'clauseName') &&
      e.parentType === 'dataRow'
    ) {
      e.editorName = 'dxTextArea';
      e.editorOptions.autoResizeEnabled = true;
      e.editorOptions.onKeyDown = (e) => {
        if (
          e.event.keyCode === 13 ||
          e.event.keyCode === 8 ||
          e.event.keyCode === 46 ||
          e.event.keyCode === 32
        ) {
          e.event.stopPropagation();
          setTimeout((_) => {
            this.clauseBankGrid.instance.updateDimensions();
          });
        }
      };
    }
  }

  onRowInserting(e) {
    let isCanceled = new Promise(async (resolve) => {
      setTimeout(() => {
        const clauseBankInfo = {
          clauseBankID: 0,
          clauseName: e.data.clauseName,
          clauseTypeId: this.clauseTypeId,
          clause: e.data.clause,
        };
        this.subs.add(
          this.dynamicFormsService.saveClauseBank(clauseBankInfo).subscribe(
            (res) => {
              if (res && res.success) {
                this.notifySuccessMessage('Clause Bank saved successfully');
                e.data.clauseBankID = res.data;
                resolve(false);
              } else {
                this.notifyErrorMessage(
                  'There was an issue saving details. Please review and try again.'
                );
                resolve(true);
              }
            },
            (error: any) => {
              this.notifyErrorMessage(
                'There was an error saving details. Please review and try again.'
              );
              console.log('Error occurred while saving Clause Bank: ', error);
              resolve(true);
            }
          )
        );
      }, 100);
    });
    e.cancel = isCanceled;
  }

  onRowUpdating(e) {
    let isCanceled = new Promise(async (resolve) => {
      setTimeout(() => {
        const clauseBankInfo = {
          clauseBankID: e.key,
          clauseName: isTruthy(e.newData.clauseName)
            ? e.newData.clauseName
            : e.oldData.clauseName,
          clauseTypeId: this.clauseTypeId,
          clause: isTruthy(e.newData.clause)
            ? e.newData.clause
            : e.oldData.clause,
        };
        this.subs.add(
          this.dynamicFormsService.saveClauseBank(clauseBankInfo).subscribe(
            (res) => {
              if (res && res.success) {
                this.notifySuccessMessage('Clause Bank saved successfully');
                resolve(false);
              } else {
                this.notifyErrorMessage(
                  'There was an issue saving details. Please review and try again.'
                );
                resolve(true);
              }
            },
            (error: any) => {
              this.notifyErrorMessage(
                'There was an error saving details. Please review and try again.'
              );
              console.log('Error occurred while saving Clause Bank: ', error);
              resolve(true);
            }
          )
        );
      }, 100);
    });
    e.cancel = isCanceled;
  }

  onRowRemoving(e) {
    e.cancel = true;
  }

  onCellPrepared(e: any) {
    if (e.rowType === 'data' && e.column.command === 'edit') {
      let deleteLink = e.cellElement.querySelector('.dx-link-delete');
      off(deleteLink, 'dxclick');
      on(deleteLink, 'dxclick', (args) => {
        let isCanceled = new Promise(async (resolve) => {
          setTimeout(() => {
            this.subs.add(
              this.dialogService
                .confirm(
                  'Delete',
                  `Do you want to delete the selected clause bank?`,
                  'Yes',
                  'No'
                )
                .subscribe((confirmed) => {
                  if (confirmed) {
                    this.clauseBankGrid.instance.cancelEditData();
                    this.dynamicFormsService
                      .deleteClauseBank(e.data.clauseBankID)
                      .subscribe(
                        (res) => {
                          if (res && res.success) {
                            this.notifySuccessMessage(
                              'Clause Bank successfully removed'
                            );
                            this.getClauseBanks(this.clauseTypeId);
                            resolve(false);
                          } else {
                            this.notifyErrorMessage(
                              'There was an issue deleting details. Please review and try again.'
                            );
                            resolve(true);
                          }
                        },
                        (error: any) => {
                          this.notifyErrorMessage(
                            'There was an error deleting details. Please review and try again.'
                          );
                          console.log(
                            'Error occurred while deleting Clause Bank: ',
                            error
                          );
                          resolve(true);
                        }
                      );
                  } else {
                    this.getClauseBanks(this.clauseTypeId);
                    resolve(true);
                  }
                })
            );
          }, 100);
        });
      });
    }
  }
}
