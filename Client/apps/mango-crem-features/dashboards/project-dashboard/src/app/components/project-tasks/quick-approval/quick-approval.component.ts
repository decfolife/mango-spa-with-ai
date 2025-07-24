import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { MangoDialogService } from '@mango/core-shared';
import {
  DatePickerComponent,
  DatePickerModule,
  InputComponent,
  LoaderModule,
  SimpleGridModule,
} from '@mango/ui-shared/lib-ui-elements';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import {
  DxBulletModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDateBoxModule,
  DxTemplateModule,
  DxTextBoxModule,
  DxValidatorComponent,
  DxValidatorModule,
} from 'devextreme-angular';
import { Subject, Subscription } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import {
  concatMap,
  filter,
  first,
  map,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs/operators';
import { QUICK_APPROVAL_TASK_STATUS } from './../../../models/enums/quick-approval.enums';
import {
  QuickApprovalRequest,
  QuickApprovalUI,
} from './../../../models/interfaces/quick-approval.interface';
import { QuickApprovalService } from './../../../services/quick-approval.service';
import {
  adaptResponseToUI,
  buildQuickApprovalRequest,
} from './../../adapters/quick-approval-request.adapter';
@Component({
  selector: 'crem-quick-approval',
  standalone: true,
  imports: [
    CommonModule,
    LoaderModule,
    SimpleGridModule,
    DxDataGridModule,
    DxTemplateModule,
    DxDateBoxModule,
    DxBulletModule,
    DatePickerModule,
    InputComponent,
    DxTextBoxModule,
    DxValidatorModule,
  ],
  templateUrl: './quick-approval.component.html',
  styleUrls: ['./quick-approval.component.scss'],
})
export class CremQuickApprovalComponent implements OnInit {
  @Input() projectId: string;
  @Input() isNotesFieldRequired: boolean;
  @Input() dateFormat;
  @Output() hasChanges = new EventEmitter<{
    enableApply: boolean;
    enableApprove: boolean;
    approvalCount: number;
  }>();
  @Output() isProcessing = new EventEmitter<boolean>(false);
  @Output() refreshTasksGrid = new EventEmitter();

  @ViewChild('DataGrid') dataGrid: DxDataGridComponent;
  @ViewChildren('notesInput') notesInput: QueryList<InputComponent>;
  @ViewChildren('startDatePicker')
  startDatePicker: QueryList<DatePickerComponent>;
  @ViewChildren('date')
  approvalDatePicker: QueryList<DatePickerComponent>;
  @ViewChild('emailValidator', { static: false })
  emailValidator: DxValidatorComponent;
  loader$ = new BehaviorSubject(false);
  changes$ = new BehaviorSubject<{ [k: number]: any }>({});
  subs: Subscription[] = [];
  dataSource: QuickApprovalUI[] = [];
  dataLoaded = false;
  count = 0;
  selectedTasksToApprove = [];
  requireActualStartDate: boolean;
  currentSelectedKeys: any[];
  selectablekeys: any[];
  isSelectAllActive: boolean;
  summaryText: string = `A user can modify the Actual Start Date without approving the task by entering or clearing the 
  Actual Start Date and selecting Apply. Apply will only update the Actual Start Date and will not approve tasks. Check the 
  box next to the task(s) to enable the Approve Tasks button. This button will only approve the tasks that have been selected.`;

  private triggerRefreshGrid$ = new Subject<void>();
  constructor(
    private quickApprovalService: QuickApprovalService,
    private dialogService: MangoDialogService,
    private facade: MangoAppFacade
  ) {}

  ngOnInit(): void {
    this.loader$.next(true);
    this.initializeRefreshGrid();
    this.initializeSharedChange();
    this.triggerRefreshGrid$.next();
    this.loader$.next(false);
  }

  private initializeRefreshGrid(): void {
    this.subs.push(
      this.triggerRefreshGrid$
        .pipe(
          switchMap(() =>
            this.quickApprovalService.getQuickApprovals(this.projectId)
          )
        )
        .subscribe(
          (res) => {
            this.requireActualStartDate = res.data.requireActualStartDate;
            this.loader$.next(false);
            this.dataSource = adaptResponseToUI(res.data.approvals);
            this.dataLoaded = true;
          },
          (error) => {
            console.error('Error loading data:', error);
          }
        )
    );
  }

  private initializeSharedChange(): void {
    // Subscription to emit `hasChanges` when there are changes in `changes$`
    this.subs.push(
      this.changes$
        .pipe(
          map((changeset) => {
            let approvalCount = 0;
            const [enableApply, enableApprove] = Object.keys(changeset).reduce(
              ([canApply, canApprove], key) => {
                const patch = changeset[key];
                const enableApproveTrigger =
                  'date' in changeset[key] || 'note' in patch;
                const enableApplyTrigger = 'actualStartDate' in patch;

                canApply = canApply || enableApplyTrigger;
                canApprove = canApprove || enableApproveTrigger;

                if (enableApproveTrigger) {
                  approvalCount++;
                }

                return [canApply, canApprove];
              },
              [false, false]
            );

            return { enableApply, enableApprove, approvalCount };
          }),

          tap((upd) => this.hasChanges.emit(upd))
        )
        .subscribe()
    );
  }

  onEditorPreparing(e): void {
    if (e.row && e.command == 'select') {
      const disable =
        e.row.data.approve === QUICK_APPROVAL_TASK_STATUS.APPROVED ||
        e.row.data.blockApproval;
      e.editorOptions.disabled = disable;
    }
  }

  onFocusedCellChanged(e: any) {
    setTimeout(() => {
      const focusedElement = document.activeElement as HTMLElement;
      if (focusedElement) {
        focusedElement.addEventListener('keydown', (event: KeyboardEvent) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            // Prevent the default behavior to stop the cell from changing focus
            event.stopPropagation();
          }
        });
      }
    }, 0);
  }

  async onSelectionChanged(event) {
    this.loader$.next(true);
    let changes = this.changes$.getValue();
    const gridInstance = this.dataGrid.instance;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalVisibleRows = event.component.getVisibleRows().length;
    const totalSelectedRows = event.selectedRowKeys.length;
    const allSelected = totalSelectedRows === totalVisibleRows;
    const allDeselected = totalSelectedRows === 0;
    const selectableRows = gridInstance
      .getVisibleRows()
      .filter((row) => row.data.selectable);
    const unselectableRowsKeys = gridInstance
      .getVisibleRows()
      .filter((row) => !row.data.selectable)
      .map((row) => row.data.projectMilestoneApprovalID);

    gridInstance.beginCustomLoading('Processing...');
    gridInstance.beginUpdate();

    await new Promise<{
      [k: number]: any;
    }>((resolve) => {
      setTimeout(() => {
        if (
          (allSelected && event.currentSelectedRowKeys.length !== 1) ||
          (allDeselected && event.currentDeselectedRowKeys.length !== 1)
        ) {
          if (allSelected) {
            // if all items are selected
            selectableRows.forEach((row) => {
              const { key } = row;
              let patch = changes[key] || {};

              patch.note = 'Approved';
              row.data.note = patch.note;

              patch.date = today;
              row.data.date = patch.date;

              changes = {
                ...changes,
                [key]: {
                  ...patch,
                },
              };

              row.data.isRowSelected = true;
            });

            let rowElement;
            unselectableRowsKeys.forEach((key) => {
              rowElement = this.dataGrid.instance.getRowElement(
                this.dataGrid.instance.getRowIndexByKey(key)
              );

              if (rowElement[0].classList.contains('dx-selection')) {
                rowElement[0].classList.remove('dx-selection');
              }
            });
          } else if (allDeselected) {
            selectableRows.forEach((row) => {
              const { key } = row;
              let patch = changes[key] || {};

              if ('note' in patch) {
                delete patch.note;
              }
              if ('date' in patch) {
                delete patch.date;
              }

              row.data.note = '';
              row.data.date = null;

              changes = {
                ...changes,
                [key]: {
                  ...patch,
                },
              };
              row.data.isRowSelected = false;
            });
          }
        } else {
          if (event.currentSelectedRowKeys.length > 0) {
            event.currentSelectedRowKeys.forEach((key) => {
              const row = selectableRows.find((row) => key === row.key);
              if (row) {
                row.data.isRowSelected = true;

                const { key } = row;
                let patch = changes[key] || {};

                patch.note = 'Approved';
                row.data.note = patch.note;
                patch.date = today;
                row.data.date = patch.date;

                changes = {
                  ...changes,
                  [key]: {
                    ...patch,
                  },
                };
              }
            });
          } else if (event.currentDeselectedRowKeys.length > 0) {
            event.currentDeselectedRowKeys.forEach((key) => {
              const row = selectableRows.find((row) => key === row.key);
              if (row) {
                const { key } = row;
                let patch = changes[key] || {};

                if ('note' in patch) {
                  delete patch.note;
                }
                if ('date' in patch) {
                  delete patch.date;
                }

                row.data.note = '';
                row.data.date = null;

                changes = {
                  ...changes,
                  [key]: {
                    ...patch,
                  },
                };
                row.data.isRowSelected = false;
              }
            });
          }
        }

        resolve(changes);
      }, 0);
    })
      .then((changes) => {
        this.changes$.next(changes);
        this.loader$.next(false);
      })
      .catch((error) => {
        this.loader$.next(false);
        console.error('Error processing selection:', error);
      });

    gridInstance.endCustomLoading();
    gridInstance.endUpdate();

    this.selectedTasksToApprove = this.dataSource.filter((d) =>
      event.selectedRowsData.some(
        (k: QuickApprovalUI) =>
          k.projectMilestoneApprovalID === d.projectMilestoneApprovalID &&
          d.approve !== QUICK_APPROVAL_TASK_STATUS.APPROVED &&
          !d.blockApproval
      )
    );
  }

  onValueChanged(row, event) {
    const { dataField } = row.column;
    const { key } = row;
    const today = new Date();
    const delta = this.changes$.getValue();

    switch (dataField) {
      case 'date': {
        const { value, previousValue } = event;

        const selectedDate = new Date(value);

        // Set the time of both dates to the same to only compare the day
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
          this.dialogService.alert(
            'Invalid Date',
            'Date must be less than or equal to current date.',
            'Close'
          );
          event.component.option('value', previousValue);
          return;
        }

        if (value != null) {
          row.data[dataField] = value;
          this.changes$.next({
            ...delta,
            [key]: {
              ...delta[key],
              [dataField]: value,
            },
          });
        }

        break;
      }
      case 'actualStartDate': {
        const { value, previousValue } = event;
        if (!!value) {
          const selectedDate = new Date(value);
          // Set the time of both dates to the same to only compare the day
          today.setHours(0, 0, 0, 0);
          selectedDate.setHours(0, 0, 0, 0);

          if (selectedDate > today) {
            this.dialogService.alert(
              'Invalid Actual Start Date',
              'Date must be less than or equal to current date.',
              'Close'
            );
            event.component.option('value', previousValue);
            return;
          }
        }
        // dont update changeset if we are reverting an invalid value to undefined
        if (previousValue > today && !value) {
          return;
        }
        row.data[dataField] = value;
        this.changes$.next({
          ...delta,
          [key]: {
            ...delta[key],
            [dataField]: value,
          },
        });
        break;
      }
      case 'note': {
        const value = event;
        if (value != null) {
          row.data[dataField] = value;
          this.changes$.next({
            ...delta,
            [key]: {
              ...delta[key],
              [dataField]: value,
            },
          });
        }
        if (this.isNotesFieldRequired) {
          const selectedNote = this.notesInput
            .toArray()
            .find((note) => note.dataKey === key);
          if (selectedNote && !selectedNote.validate()) {
            selectedNote.state = 'error';
          } else {
            selectedNote.state = null;
          }
        }
        break;
      }

      default: {
        /* empty */
      }
    }
  }

  approveTasks(): void {
    this.loader$.next(true);
    if (this.selectedTasksToApprove.length > 0) {
      let validationFailed = false;
      let focusSet = false;

      this.selectedTasksToApprove.forEach((element) => {
        if (this.requireActualStartDate) {
          const selectedStartDate = this.startDatePicker
            .toArray()
            .find(
              (startArray) =>
                startArray.dataKey === element.projectMilestoneApprovalID
            );
          if (selectedStartDate && !selectedStartDate.validate()) {
            validationFailed = true;
            if (!focusSet) {
              selectedStartDate.focusDatePicker();
              focusSet = true;
            }
          }
        }

        const approvalStartDate = this.approvalDatePicker
          .toArray()
          .find(
            (approvalArray) =>
              approvalArray.dataKey === element.projectMilestoneApprovalID
          );
        if (approvalStartDate && !approvalStartDate.validate()) {
          validationFailed = true;
          if (!focusSet) {
            approvalStartDate.focusDatePicker();
            focusSet = true;
          }
        }

        const selectedNote = this.notesInput
          .toArray()
          .find((note) => note.dataKey === element.projectMilestoneApprovalID);
        if (selectedNote && !selectedNote.validate()) {
          selectedNote.state = 'error';
          validationFailed = true;
          if (!focusSet) {
            selectedNote.focusInputBox();
            focusSet = true;
          }
        } else {
          selectedNote.state = null;
        }
      });

      if (validationFailed) {
        return;
      }

      const patch = this.changes$.getValue();
      const keys = Object.keys(patch);

      let updatedRows = [];
      if (keys.length > 0) {
        updatedRows = this.selectedTasksToApprove.map((task) => {
          const key = task.projectMilestoneApprovalID;
          const delta = patch[key];
          return delta
            ? {
                ...task,
                note: delta.note ?? task.note,
                date: delta.date ?? task.date,
                actualStartDate: delta.actualStartDate ?? task.actualStartDate,
              }
            : task;
        });
      }

      const payload: QuickApprovalRequest =
        buildQuickApprovalRequest(updatedRows);
      this.isProcessing.emit(true);
      this.dataGrid.instance.beginCustomLoading('Processing...');
      this.dataGrid.instance.beginUpdate();
      this.subs.push(
        this.facade.currentProjectId$
          .pipe(
            first(),
            map((projectId) => ({ ...payload, projectId })),
            concatMap((data) =>
              this.quickApprovalService.saveQuickApprovals(data)
            )
          )
          .subscribe(
            (res) => {
              if (res) {
                this.loader$.next(false);
                this.isProcessing.emit(false);
                this.dataGrid.instance.endCustomLoading();
                this.dataGrid.instance.endUpdate();

                this.changes$.next({});
                this.triggerRefreshGrid$.next();
                this.refreshTasksGrid.next();
                this.facade.refreshLeftSideNav();
              }
            },
            () => {
              this.loader$.next(false);
              this.isProcessing.emit(false);
              this.dataGrid.instance.endCustomLoading();
              this.dataGrid.instance.endUpdate();
              this.dialogService.alert(
                'Task Quick Approval',
                'Cannot complete the Approval, please try again later.',
                'Close'
              );
            }
          )
      );
    }
  }

  saveChanges() {
    const patch = this.changes$.getValue();
    const keys = Object.keys(patch);

    if (keys.length > 0) {
      this.isProcessing.emit(true);
      this.loader$.next(true);
      this.dataGrid.instance.beginCustomLoading('Processing...');
      this.dataGrid.instance.beginUpdate();

      const payload: QuickApprovalRequest = {
        isQuickApproval: false,
        approveRejectTasksRequestList: keys
          .map((key) => [key, patch[key]])
          .filter(([, patch]) => 'actualStartDate' in patch)
          .map(([taskApprovalID, task]) => ({
            taskApprovalID,
            isProxyApproval: false,
            actualStartDate: task.actualStartDate
              ? task.actualStartDate.toISOString()
              : null,
          })),
      };

      this.subs.push(
        this.facade.currentProjectId$
          .pipe(
            first(),
            map((projectId) => ({ ...payload, projectId })),
            concatMap((data) =>
              this.quickApprovalService.saveQuickApprovals(data)
            )
          )
          .subscribe(
            (res) => {
              if (res) {
                // update in memory data
                Object.keys(patch).forEach((key) => {
                  // for every modified key
                  this.dataSource
                    .filter(
                      (v2) => v2.projectMilestoneApprovalID === parseInt(key)
                    )
                    .forEach((row) => {
                      const rowPatch = patch[key];
                      const changedProperties = Object.keys(rowPatch);

                      // write applied changes to dataset
                      changedProperties.forEach((prop) => {
                        row[prop] = patch[key][prop];

                        if (prop === 'actualStartDate') {
                          // remove from changeset after commit
                          // other updates to note and date may still be commited so we do not want to wipe out the entire changeset
                          delete patch[key][prop];
                        }
                      });
                    });
                });
                ////////////////////////////////////////////////////////////////////////////////////
                // we want to preserve other changes when the apply option is used
                // the only field that we actualy persist is the actualStartDate when using apply
                // the actualStartDate is already stored in the grid-state for approval usage
                // actualStartDate presence is used to drive hiding/showing the 'apply' button
                ////////////////////////////////////////////////////////////////////////////////////
                this.changes$.next(patch);
                ////////////////////////////////////////////////////////////////////////////////////
                //                                                                                //
                ////////////////////////////////////////////////////////////////////////////////////

                this.loader$.next(false);
                this.isProcessing.emit(false);
                this.dataGrid.instance.endCustomLoading();
                this.dataGrid.instance.endUpdate();
                this.refreshTasksGrid.next();
              }
            },
            () => {
              this.loader$.next(false);
              this.isProcessing.emit(false);
              this.dataGrid.instance.endCustomLoading();
              this.dataGrid.instance.endUpdate();
              this.dialogService.alert(
                'Task Quick Approval',
                'Unable to apply changes, please try again later.',
                'Close'
              );
            }
          )
      );
    }
  }
}
