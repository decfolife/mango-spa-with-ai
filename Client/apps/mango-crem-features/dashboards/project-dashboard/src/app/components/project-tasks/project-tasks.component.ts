import {
  AfterContentInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  faCircleCheck,
  faCircleXmark,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import {
  GetViewDropdownDataRequest,
  HideListViewRequest,
  ListView,
  SetDefaultListViewRequest,
  ViewDropDownData,
} from '@list-pages/components/listpage/shared/models';
import { CurrentObjectService } from '@mango/core-shared';
import {
  ContactRecord,
  CurrentObjectInfo,
  MemberInfo,
  PostProjectEmailPreferences,
  PostProjectTaskSettings,
  ProjectEmailPreferences,
  ProjectTaskDetails,
  ProjectTaskDropdownInfo,
  ProjectTaskInfo,
  ProjectTaskSettings,
} from '@mango/data-models/lib-data-models';
import {
  DatePickerComponent,
  InputComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { environment } from '@mangoSpa/src/environments/environment.local';
import { TaskUserApprovalStatus } from '@project-dashboard/models/enums/task-user-approval-enums';
import { DashboardService } from '@project-dashboard/services/dashboard.service';
import { RequiredNotesFlagService } from '@project-dashboard/services/required-notes-flag.service';
import { SaveTasksTemplateService } from '@project-dashboard/services/save-tasks-template.service';
import { ProjectTaskTreeExportUtility } from '@project-dashboard/utilities/project-task-tree-export.utility';
import { DxTreeListComponent } from 'devextreme-angular';
import dxCheckBox from 'devextreme/ui/check_box';
import { Column } from 'devextreme/ui/data_grid';
import { MangoDialogService } from 'libs/core-shared/src/lib/services/mango-dialog.service';
import { CremPopupComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/popup';
import { CremShareViewPopupComponent } from 'libs/ui-shared/lib-ui-shared/src/lib/crem-list-views/crem-share-view-popup/crem-share-view-popup.component';
import {
  BehaviorSubject,
  combineLatest,
  EMPTY,
  of,
  Subject,
  Subscription,
} from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import {
  debounceTime,
  filter,
  first,
  map,
  startWith,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import {
  APPROVE_BUTTON_TEXT,
  QUICK_APPROVAL_FOOTER_TEXT,
} from '../../models/constants/project-tasks-constants';
import { TaskApproveOrRejectComponent } from '../modal/task-approve-or-reject/task-approve-or-reject.component';
import { AddEditTaskComponent } from './add-edit-tasks/add-edit-task.component';
import { AppendTemplateComponent } from './append-template/append-template.component';
import { CopyTransactionComponent } from './copy-transaction/copy-transaction.component';
import { ModifyCompleteDateComponent } from './modify-complate-date/modify-complete-date.component';
import { CremQuickApprovalComponent } from './quick-approval/quick-approval.component';
import { ReorderTaskModal } from './reorder-tasks-modal/reorder-tasks-modal.component';
import { AddEditTaskAssigneesComponent } from './task-info/task-assignees/add-edit-task-assignees/add-edit-task-assignees.component';
import { TaskInfoComponent } from './task-info/task-info.component';
import { AddTaskNoteComponent } from './task-info/task-notes/add-task-note/add-task-note.component';

enum AvailableActions {
  COPY_TRANSACTION = 'COPY_TRANSACTION',
  QUICK_APPROVAL = 'QUICK_APPROVAL',
  TASK_DETAILS_SETTINGS = 'TASK_DETAILS_SETTINGS',
  DELETE_TASKS = 'DELETE_TASKS',
  SAVE_TASKS_AS_TEMPLATE = 'SAVE_TASKS_AS_TEMPLATE',
  APPEND_TEMPLATE = 'APPEND_TEMPLATE',
  REORDER_TASKS = 'REORDER_TASKS',
  ASSIGN_APPROVERS = 'ASSIGN_APPROVERS',
  ADD_SUB_TASK = 'ADD_SUB_TASK',
  EDIT_TASK = 'EDIT_TASK',
  ADD_TASK = 'ADD_TASK',
  APPROVE_TASK = 'APPROVE_TASK',
  REJECT_TASK_APPROVAL = 'REJECT_TASK_APPROVAL',
  MODIFY_COMPLETE_DATE = 'MODIFY_COMPLETE_DATE',
  ADD_NOTES = 'ADD_NOTES',
  UPLOAD_FILES = 'UPLOAD_FILES',
  TASK_DETAILS_PAGE = 'TASK_DETAILS_PAGE',
  ASSIGNEES_PAGE = 'ASSIGNEES_PAGE',
  ADD_NOTES_PAGE = 'ADD_NOTES_PAGE',
  UPLOAD_FILES_PAGE = 'UPLOAD_FILES_PAGE',
}
type ActionPermissions = {
  [key in AvailableActions]: any[] | undefined;
};
const actionPermissions_ProjectEditable: ActionPermissions = {
  [AvailableActions.COPY_TRANSACTION]: [1],
  [AvailableActions.QUICK_APPROVAL]: [1, 2, 3],
  [AvailableActions.TASK_DETAILS_SETTINGS]: undefined,
  [AvailableActions.DELETE_TASKS]: [1],
  [AvailableActions.SAVE_TASKS_AS_TEMPLATE]: [1],
  [AvailableActions.APPEND_TEMPLATE]: [1],
  [AvailableActions.REORDER_TASKS]: [1],
  [AvailableActions.ASSIGN_APPROVERS]: [1],
  [AvailableActions.ADD_SUB_TASK]: [1],
  [AvailableActions.EDIT_TASK]: [1],
  [AvailableActions.ADD_TASK]: [1],
  [AvailableActions.APPROVE_TASK]: [1, 2, 3],
  [AvailableActions.REJECT_TASK_APPROVAL]: [1, 2, 3],
  [AvailableActions.MODIFY_COMPLETE_DATE]: [1],
  [AvailableActions.ADD_NOTES]: ['SU', 1, 2, 3, 999],
  [AvailableActions.UPLOAD_FILES]: [1, 2, 3, 999],
  [AvailableActions.TASK_DETAILS_PAGE]: ['SU', 1, 2, 3],
  [AvailableActions.ASSIGNEES_PAGE]: ['SU', 1, 2, 3],
  [AvailableActions.ADD_NOTES_PAGE]: ['SU', 1, 2, 3],
  [AvailableActions.UPLOAD_FILES_PAGE]: ['SU', 1, 2, 3],
};
const actionPermission_ProjectReadOnly: ActionPermissions = {
  [AvailableActions.COPY_TRANSACTION]: ['SU', 1],
  [AvailableActions.QUICK_APPROVAL]: [],
  [AvailableActions.TASK_DETAILS_SETTINGS]: undefined,
  [AvailableActions.DELETE_TASKS]: [],
  [AvailableActions.SAVE_TASKS_AS_TEMPLATE]: ['SU', 1],
  [AvailableActions.APPEND_TEMPLATE]: [],
  [AvailableActions.REORDER_TASKS]: [],
  [AvailableActions.ASSIGN_APPROVERS]: [],
  [AvailableActions.ADD_SUB_TASK]: [],
  [AvailableActions.EDIT_TASK]: [],
  [AvailableActions.ADD_TASK]: [],
  [AvailableActions.APPROVE_TASK]: [],
  [AvailableActions.REJECT_TASK_APPROVAL]: [],
  [AvailableActions.MODIFY_COMPLETE_DATE]: [],
  [AvailableActions.ADD_NOTES]: ['SU', 1, 2, 3],
  [AvailableActions.UPLOAD_FILES]: [],
  [AvailableActions.TASK_DETAILS_PAGE]: ['SU', 1, 2, 3],
  [AvailableActions.ASSIGNEES_PAGE]: ['SU', 1, 2, 3],
  [AvailableActions.ADD_NOTES_PAGE]: ['SU', 1, 2, 3],
  [AvailableActions.UPLOAD_FILES_PAGE]: ['SU', 1, 2, 3],
};

const columnFunctionsDataFields = {
  PROJECTMILESTONEUSERCOMPLETEDDATE: 'ProjectMilestoneUserCompletedDate',
  PROJECTMILESTONENAME: 'ProjectMilestoneName',
  APPROVERS: 'Approvers',
  FILESCOUNT: 'FilesCount',
  NOTESCOUNT: 'NotesCount',
  USERAPPROVALSTATUS: 'UserApprovalStatus',
};

// link data-column click to action permissions
const dataColActionPermissionMap = {
  ProjectMilestoneName: AvailableActions.TASK_DETAILS_PAGE,
  Approvers: AvailableActions.ASSIGNEES_PAGE,
  FilesCount: AvailableActions.UPLOAD_FILES_PAGE,
  NotesCount: AvailableActions.ADD_NOTES_PAGE,
};
@Component({
  selector: 'project-tasks',
  templateUrl: './project-tasks.component.html',
  styleUrls: ['./project-tasks.component.scss'],
})
export class ProjectTasksComponent
  implements OnInit, OnDestroy, AfterContentInit
{
  @ViewChild('ProjectTasksGrid') projectTasksGrid: DxTreeListComponent;
  @ViewChild('StartDatePicker') startDatePicker: DatePickerComponent;
  @ViewChild('DueDatePicker') dueDatePicker: DatePickerComponent;
  @ViewChild('CopyTransactionPopup') copyTransactionPopup: CremPopupComponent;

  subs: Subscription[] = [];
  projectId: number;
  taskInfoData: ProjectTaskInfo = <ProjectTaskInfo>{};
  projectCurrentTasks: ProjectTaskDropdownInfo[];
  memberInfo: MemberInfo = <MemberInfo>{};
  projectTaskList: ProjectTaskDetails[] = [];
  selectedTaskId: number;
  dataRetrieved: boolean = true;
  noDataText: string = '';
  dateFormat: string = '';
  searchText: string = '';
  rowId: number = 0;
  isUserDatesEU: boolean = true;
  isOneTaskShrinkable: boolean = false;
  taskStatusColor: string = '';
  inputViewName: string = '';
  currentListView: ListView = null;
  gridData: any = [];
  objectTypeId: number = 196;
  faUserPlus = faUserPlus;
  faCircleCheck = faCircleCheck;
  faCircleXmark = faCircleXmark;
  availableApprovers: any = [];
  approversValues: any = [];
  availablePredecessors: any = [];
  predValues: any = [];
  isExpandAll: boolean = false;
  userAccessLevel: number = 3;
  numOfDays: number = null;
  allSelectedRowKeys: number[] = [];
  disableOrEnableRowKeys: number[] = [];
  selectionEvent: boolean = false;
  deSelectionEvent: boolean = false;
  allDisabledRowKeys: number[] = [];
  deleteTaskIds: number[] = [];
  deleteBtnTitle: string =
    'Use the Delete Selected Tasks option via the Actions menu to delete tasks that have been selected';
  modifyApprovalDateBtnTitle: string =
    'Approval Date can be modified once approval has been done.';
  approvalBtnTitle: string =
    'require approval. Once completed this task will be available for approval.';
  quickApprovalApplyBtnTitle: string =
    'click to save the Actual Start Date for unselected tasks only';
  quickApprovalApproveBtnTitle: string =
    'click to approve the selected tasks only';
  dragPosition: any = { x: 0, y: 0 };
  showQuickApprovalPopup = false;
  isEditAsgineesModalOpen = false;
  approveButtonText = '';
  saveButtonText = 'Save';
  quickApprovalFooterText = '';
  quickApprovalSaveDisabled = true;
  showSaveTasksAsTemplatePopup = false;
  disableTasksTemplateSaveButton = true;
  taskUserApprovalStatus;
  workFlowOttid: number;
  selectedTaskCount$ = new BehaviorSubject<number>(0);
  isApproveButtonDisabled$ = new BehaviorSubject<boolean>(true);
  isQuickApprovalProcessing$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();

  taskResendEmail: boolean = false;
  public selectAutoEmailTitle: string =
    'Must select Auto Email setting in order to enable additional email options';
  public maxReachedSubTasksTitle: string =
    'You have reached the max level of sub tasks.';

  private originalStartDate: string = '';
  private originalDueDate: string = '';
  private currentUserInfo$: Observable<ContactRecord>;
  private refreshForApplyClick = false;
  private lastDatePickerNewValue: any = null;
  private lastDatePickerChangedName: string = null;
  focusedRowKey: any;
  focusedRowData: any;
  canOpenPopup: boolean = true;
  private enterOrSpaceKeyPress$ = new Subject<void>();

  //***for views
  currentListViewName: string;
  listViews: ViewDropDownData;
  activeViewId: number;
  isActiveListView: boolean = false;
  isNewListViewCreated: boolean = false;
  activeViewState: any;
  userListViewType: number = 2;
  newListViewId: string;
  availableListViewCount: number;
  sharingListView: ListView;
  isSuperUser: boolean = false;
  sessionView: ListView;
  expandedRowKeys: number[];
  isNotesFieldRequired: boolean = true;

  // ****/
  public readonly availableActions = AvailableActions;

  //** Task Settings related data **/
  projectTaskSettings: ProjectTaskSettings = <ProjectTaskSettings>{};
  projectEmailPreferences: ProjectEmailPreferences = <
    ProjectEmailPreferences
  >{};
  postProjectTaskSettings: PostProjectTaskSettings = <
    PostProjectTaskSettings
  >{};
  postProjectEmailPreferences: PostProjectEmailPreferences = <
    PostProjectEmailPreferences
  >{};
  settingsVisible: boolean = false;
  taskSettingsTitle: string = 'Task Settings';
  selectAllEmailPref: boolean = false;
  taskSettingsChangesMade: boolean = false;
  newProjectId?: number = null;
  disableTaskSettingsBtns: boolean = false;

  //**** **/
  //** Copy Transaction related data **/
  copyTransactionVisible: boolean = false;
  ctSaveButtonText: string = null;
  ctApplyButtonText: string = 'Copy';
  disabledCopyTransBtn: boolean = false;
  copyTransBtnVisisble: boolean = true;

  //**** **/

  @ViewChild('moreMenuTrigger') moreMenuTrigger: MatMenuTrigger;
  @ViewChild('InputViewTextBox') inputViewTextBox: InputComponent;
  @ViewChild('cremShareListViewPopup')
  cremShareListViewPopup: CremShareViewPopupComponent;
  @ViewChild('taskDetailsSettingsPopup')
  taskDetailsSettingsPopup: CremPopupComponent;
  @ViewChild('copyTransactionComponent')
  copyTransactionComponent: CopyTransactionComponent;
  @ViewChild('quickApprovalGrid')
  quickApprovalComponent!: CremQuickApprovalComponent;
  currentObject: Observable<CurrentObjectInfo> = null;
  currentUserContactId: number;
  isProjectEditable: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private dashboardService: DashboardService,
    private requiredNotesFlagService: RequiredNotesFlagService,
    private dialogService: MangoDialogService,
    private facade: MangoAppFacade,
    private saveTasksTemplateService: SaveTasksTemplateService,
    private currentObjectService: CurrentObjectService,
    private reorderTasksModal: ReorderTaskModal
  ) {
    this.saveState = this.saveState.bind(this);

    this.currentUserInfo$ = this.facade.contactRecord$;
    this.subs.push(
      this.currentUserInfo$.subscribe((contact) => {
        this.currentUserContactId = contact.contactID;
        this.isUserDatesEU = contact.preferences.contactDatesEU;
        this.isSuperUser =
          contact.userRoleName.toLowerCase().trim() == 'superuser'
            ? true
            : false;
        this.dateFormat = this.isUserDatesEU ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
      })
    );

    this.enterOrSpaceKeyPress$.pipe(debounceTime(500)).subscribe(() => {
      this.canOpenPopup = true;
    });
  }

  ngAfterContentInit(): void {
    this.initializeBehaviorDisableQuickApprovalButton();
    this.currentObject =
      this.currentObjectService.getCurentObjectNameAndType$();
  }

  async ngOnInit() {
    this.taskUserApprovalStatus = TaskUserApprovalStatus;

    this.getMemberInfo();

    await this.route.queryParams
      .pipe(
        takeUntil(this.destroy$),
        filter((params) => !!params && !!params.oid),
        tap(async (params) => {
          this.projectId = parseInt(params.oid);
          this.workFlowOttid = parseInt(params.ottid)
            ? parseInt(params.ottid)
            : 0;
          this.getNotesRequiredFlag();
          this.getProjectContactLevel(this.projectId);
        }),
        first()
      )
      .toPromise();
  }

  private initializeBehaviorDisableQuickApprovalButton() {
    combineLatest([
      this.isQuickApprovalProcessing$.pipe(startWith(false)),
      this.selectedTaskCount$.pipe(startWith(0)),
    ])
      .pipe(
        map(
          ([isProcessing, selectedTaskCount]) =>
            isProcessing || selectedTaskCount === 0
        ),
        tap((v) => {
          this.isApproveButtonDisabled$.next(v);
        })
      )
      .subscribe();
  }

  onTasksSelectionChanged(e) {
    let currentSelectedOrDeselectedKeys = [];
    if (e.currentSelectedRowKeys.length) {
      this.selectionEvent = true;
      currentSelectedOrDeselectedKeys = e.currentSelectedRowKeys;
    } else if (e.currentDeselectedRowKeys.length) {
      this.selectionEvent = false;
      currentSelectedOrDeselectedKeys = e.currentDeselectedRowKeys;
    }

    let allChildKeys = [];
    currentSelectedOrDeselectedKeys.forEach((key) => {
      allChildKeys = allChildKeys.concat(this.getChildKeys(key));
    });
    this.disableOrEnableRowKeys = allChildKeys;
    if (this.selectionEvent) {
      this.allDisabledRowKeys = this.allDisabledRowKeys.concat(allChildKeys);
      this.allSelectedRowKeys = allChildKeys.length
        ? this.allSelectedRowKeys.concat(allChildKeys)
        : this.allSelectedRowKeys;
    } else {
      this.removeDeselectedKeys(allChildKeys);
    }

    this.allSelectedRowKeys = [...new Set(this.allSelectedRowKeys)];
    this.allDisabledRowKeys = [...new Set(this.allDisabledRowKeys)];
    this.disableCheckboxes(this.disableOrEnableRowKeys);
    if (!this.selectionEvent && allChildKeys.length) {
      let rowIndexes = [];
      allChildKeys.forEach((childKey) => {
        rowIndexes.push(
          this.projectTasksGrid.instance.getRowIndexByKey(childKey)
        );
      });
      this.projectTasksGrid.instance.repaintRows(rowIndexes);
    }
  }

  removeDeselectedKeys(removeKeys) {
    let removeIndex: number;
    let disableIndex: number;
    removeKeys.forEach((key) => {
      removeIndex = this.allSelectedRowKeys.findIndex(
        (selectedKey) => key == selectedKey
      );
      if (removeIndex >= 0) this.allSelectedRowKeys.splice(removeIndex, 1);

      disableIndex = this.allDisabledRowKeys.findIndex(
        (disabledKey) => key == disabledKey
      );
      if (disableIndex >= 0) this.allDisabledRowKeys.splice(disableIndex, 1);
    });
  }

  getChildKeys(parentKey) {
    let childKeys: number[] = [];

    const getChildren = (key: number) => {
      const children = this.gridData.filter(
        (task) => task.ProjectMilestoneParentID == key
      );
      children.forEach((subTask) => {
        childKeys.push(subTask.ProjectMilestoneID);
        getChildren(subTask.ProjectMilestoneID);
      });
    };

    getChildren(parentKey);
    return childKeys;
  }

  disableCheckboxes(disableKeys) {
    disableKeys.forEach((key) => {
      let rowIndex = this.projectTasksGrid.instance.getRowIndexByKey(key);
      if (rowIndex !== -1) {
        let rowElements =
          this.projectTasksGrid.instance.getRowElement(rowIndex);
        rowElements?.forEach((element) => {
          let editor = dxCheckBox.getInstance(
            element.querySelector('.dx-select-checkbox')
          );
          if (editor) {
            if (this.selectionEvent) {
              editor.option('disabled', true);
            } else {
              editor.option('disabled', false);
            }
          }
        });
      }
    });
  }

  hasSubTasks(taskId): boolean {
    return this.gridData.some(
      (task) => task.ProjectMilestoneParentID == taskId
    );
  }

  tasksContentReady(e) {
    this.selectionEvent = true;
    this.disableCheckboxes(this.allDisabledRowKeys);
  }

  deleteSelectedTasks(data?) {
    const taskId = data?.ProjectMilestoneID;
    this.deleteTaskIds = [];
    if (taskId) {
      if (!this.isTaskDeletable(data)) {
        return;
      }
      if (this.allSelectedRowKeys.length || this.hasSubTasks(taskId)) {
        return;
      }

      this.deleteTaskIds.push(taskId);
    } else {
      this.deleteTaskIds = this.allSelectedRowKeys;
    }

    let selectedTasks = [];
    this.deleteTaskIds.forEach((delTaskId) => {
      this.gridData.forEach((task) => {
        if (delTaskId == task.ProjectMilestoneID) {
          selectedTasks.push({
            fullStep: task.ProjectMilestoneStepFull,
            taskName: task.ProjectMilestoneName,
          });
        }
      });
    });
    let confirmText =
      'Are you sure you want to delete the selected task(s)? \n\n';
    selectedTasks.forEach((task) => {
      confirmText += task.fullStep + ' - ' + task.taskName + '\n';
    });

    let tasksToDelete = {
      projectID: this.projectId,
      iDs: this.deleteTaskIds,
    };

    this.subs.push(
      this.dialogService
        .confirm('Tasks Deletion', confirmText, 'Confirm', 'Cancel')
        .pipe(
          filter((confirmed) => !!confirmed),
          tap((_) =>
            this.projectTasksGrid.instance.beginCustomLoading(
              'Deleting Task(s)....'
            )
          ),
          switchMap((_) => this.dashboardService.deleteTasks(tasksToDelete)),
          tap((res) => {
            res && res.success
              ? (this.dashboardService.successNotify(
                  'Selected Tasks(s) successfully removed.'
                ),
                this.getGridData())
              : this.dashboardService.errorNotify(
                  'The task(s) could not be deleted. Please review and try again.'
                );

            this.projectTasksGrid.instance.endCustomLoading();
          })
        )
        .subscribe()
    );
  }

  addOrEditAssignees(task) {
    const preventAction = this.checkUserLevelRequirement(
      this.availableActions.ASSIGN_APPROVERS
    );
    if (preventAction) {
      return;
    }

    this.subs.push(
      this.dashboardService
        .getTaskDetails(this.projectId, task.ProjectMilestoneID)
        .pipe(
          switchMap((res) => {
            if (!!res && res.success) {
              this.taskInfoData = res.data;
              this.openEditAssinees(task, this.taskInfoData.approvers);
            } else {
              this.dialogService.alert(
                'Get Task Approvers',
                'There was an issue with getting task info. Please contact the system administrator.',
                'OK'
              );
            }
            return EMPTY;
          })
        )
        .subscribe()
    );
  }

  openEditAssinees(task, taskApprovers) {
    if (this.isEditAsgineesModalOpen) return;
    this.isEditAsgineesModalOpen = true;

    let dialogHeight = '800px';
    let dialogWidth = '500px';

    let dialogRef = this.dialog.open(AddEditTaskAssigneesComponent, {
      height: dialogHeight,
      width: dialogWidth,
      panelClass: 'aea-addOrEditAssginees',
      data: {
        projectId: this.projectId,
        taskId: task.ProjectMilestoneID,
        taskAssignees: taskApprovers,
        userDateFormat: this.dateFormat,
        dragPosition: this.dragPosition,
      },
      disableClose: true,
    });

    this.subs.push(
      dialogRef
        .afterClosed()
        .pipe(
          tap((_) => {
            this.isEditAsgineesModalOpen = false;
          }),
          filter((reload) => !!reload)
        )
        .subscribe((reload) => {
          if (reload.saveSuccessful) {
            this.getGridData();
          }
        })
    );
  }

  openReorderTasks() {
    const orderableTasks = this.gridData.map(
      ({
        ProjectMilestoneParentID: parentId,
        ProjectMilestoneID: taskId,
        ProjectMilestoneStep: ordinal,
        ProjectMilestoneName: name,
      }) => ({
        taskId,
        parentId,
        ordinal,
        name,
      })
    );
    this.reorderTasksModal
      .open({
        data: {
          projectID: this.projectId,
          orderableTasks,
        },
      })
      .afterClosed()
      .subscribe((_) => {
        this.getGridData();
      });
  }

  getNotesRequiredFlag() {
    this.subs.push(
      this.requiredNotesFlagService
        .getRequiredNotesFlag(this.projectId)
        .subscribe(
          (notesRequiredFlag) => {
            this.isNotesFieldRequired = notesRequiredFlag;
          },
          (error) => {
            this.isNotesFieldRequired = true;
          },
          () => {}
        )
    );
  }
  isTaskAssignee(data): boolean {
    const { ApproverContactID, ApproverProxyContactID } = data;
    return (
      [ApproverContactID, ApproverProxyContactID].indexOf(
        this.currentUserContactId
      ) > -1
    );
  }
  isTaskAssigned(data) {
    return (
      data?.userApprovalStatus?.trim() !==
      this.taskUserApprovalStatus.NOT_ASSIGNED
    );
  }
  modifyCompleteDate(data) {
    const allowAction = this.isTaskCompleteDateModifiable(data);
    if (!allowAction) {
      return;
    }

    let dialogRef = this.dialog.open(ModifyCompleteDateComponent, {
      minHeight: '350px',
      width: '550px',
      maxWidth: '800px',
      maxHeight: '600px',
      panelClass: 'modifyCompleteDateModal',
      data: {
        projectId: this.projectId,
        taskId: data.ProjectMilestoneID,
        isCompleteDate: 1,
        isProxyUser: data.IsProxyUser,
        dateFormat: this.dateFormat,
        notesRequired: this.isNotesFieldRequired,
      },
      disableClose: true,
    });

    this.subs.push(
      dialogRef
        .afterClosed()
        .pipe(filter((reload) => !!reload))
        .subscribe((reload) => {
          if (reload) {
            this.getGridData();
          }
        })
    );
  }

  addOrEditTask(
    taskIndexOrder,
    editTask: boolean,
    taskId?: number,
    taskParentId?: number,
    taskStep?: number,
    taskSubTasksCount?: number
  ) {
    const preventAction = this.checkUserLevelRequirement(
      this.availableActions.EDIT_TASK
    );
    if (preventAction) {
      return;
    }

    this.openAddEditTaskDialog(
      taskIndexOrder,
      editTask,
      false,
      taskId,
      taskParentId,
      taskStep,
      taskSubTasksCount
    );
  }

  addSubTask(
    taskIndexOrder,
    taskSubTaskLimitReached: boolean,
    taskId?: number,
    taskParentId?: number,
    taskStep?: number,
    taskSubTasksCount?: number
  ) {
    const preventAction = this.checkUserLevelRequirement(
      this.availableActions.ADD_SUB_TASK
    );
    if (preventAction || taskSubTaskLimitReached) {
      return;
    }

    this.openAddEditTaskDialog(
      taskIndexOrder,
      false,
      true,
      taskId,
      taskParentId,
      taskStep,
      taskSubTasksCount
    );
  }

  private openAddEditTaskDialog(
    taskIndexOrder: number,
    editTask: boolean,
    addSubTask: boolean,
    taskId?: number,
    taskParentId?: number,
    taskStep?: number,
    taskSubTasksCount?: number
  ) {
    this.selectedTaskId = taskId;
    this.getCurrentProjectTasks();

    this.subs.push(
      this.getProjectTaskSettingsObservable().subscribe(
        (successful: boolean) => {
          if (!successful) {
            return;
          }
          let dialogRef = this.dialog.open(AddEditTaskComponent, {
            height: '800px',
            width: '500px',
            panelClass: 'addEditTaskModal',
            data: {
              memberInfo: this.memberInfo,
              projectId: this.projectId,
              taskId: this.selectedTaskId,
              taskParentId: taskParentId,
              projectCurrentTasks: this.projectCurrentTasks,
              editTask: editTask,
              addSubTask: addSubTask,
              projectTaskSettings: this.projectTaskSettings,
              taskStep: taskStep,
              taskSubTasksCount: taskSubTasksCount,
              taskIndexOrder: taskIndexOrder,
              workFlowOttid: this.workFlowOttid,
              userAccessLevel: this.userAccessLevel,
              addEditDialogRef: () => dialogRef,
            },
            disableClose: true,
          });

          this.subs.push(
            dialogRef.componentInstance.onApplyClick.subscribe(
              (newTaskId: number) => {
                const gridDataObservable = this.returnGridDataObservable();

                this.subs.push(
                  gridDataObservable
                    .pipe(
                      map((res: boolean) => {
                        if (res) {
                          this.getCurrentProjectTasks();
                          dialogRef.componentInstance.changeToEditPopup(
                            newTaskId,
                            this.projectCurrentTasks
                          );
                        }
                      })
                    )
                    .subscribe()
                );
              }
            )
          );

          this.subs.push(
            dialogRef
              .afterClosed()
              .pipe(filter((reload) => !!reload))
              .subscribe((reload) => {
                if (reload) {
                  this.getGridData();
                }
              })
          );
        }
      )
    );
  }

  openAddNotesPopup(taskData) {
    this.selectedTaskId = taskData.ProjectMilestoneID;
    let dialogRef = this.dialog.open(AddTaskNoteComponent, {
      height: '800px',
      width: '500px',
      panelClass: 'addTaskNoteModal',
      data: { taskId: this.selectedTaskId, dragPosition: this.dragPosition },
      disableClose: true,
    });

    this.subs.push(
      dialogRef
        .afterClosed()
        .pipe(filter((addTaskNoteResult) => !!addTaskNoteResult))
        .subscribe((addTaskNoteResult) => {
          if (addTaskNoteResult.saveSuccessful) {
            this.getGridData();
          }
        })
    );
  }

  openUploadFilesPopup(e): void {
    const selectedTabIndex = 3; // upload files tab
    this.showTaskInfoModal(
      e.data.ProjectMilestoneID,
      e.data.ProjectMilestoneParentID,
      e.data.ProjectMilestoneStep,
      e.data.IndexOrder,
      e.data.TaskSubTasksCount,
      selectedTabIndex
    );
  }

  onKeyDown(e) {
    if (e.event.key === ' ' || e.event.key == 'Enter') {
      const gridInstance = this.projectTasksGrid.instance;
      const focusedColumnIndex = gridInstance.option('focusedColumnIndex');
      const focusedRowIndex = gridInstance.option('focusedRowIndex');
      if (focusedColumnIndex == undefined || focusedRowIndex == -1) {
        return;
      } else {
        this.focusedRowKey = gridInstance.option('focusedRowKey');
        this.focusedRowData = gridInstance.getNodeByKey(
          this.focusedRowKey
        )?.data;
        const datafield =
          gridInstance.getVisibleColumns()[focusedColumnIndex]?.dataField;
        if (Object.values(columnFunctionsDataFields).includes(datafield)) {
          e.event.preventDefault();
          this.enterOrSpaceKeyPress$.next();
          if (this.canOpenPopup) {
            this.canOpenPopup = false;
            this.processColumnFunction(
              datafield,
              this.focusedRowData,
              e.event.target
            );
          }
        } else {
          const focusedRowElement = gridInstance.getRowElement(
            gridInstance.getRowIndexByKey(this.focusedRowKey)
          );
          const checkboxElement = focusedRowElement[0].querySelector(
            '.dx-select-checkbox'
          );
          if (checkboxElement?.classList.contains('dx-state-disabled')) {
            e.event.preventDefault();
          }
        }
      }
    }
  }

  onCellClick(e) {
    if (e.rowIndex == -1 || e.rowType !== 'data') {
      return;
    }

    const datafield = e.column.dataField;
    const data = e.data;
    if (
      Object.values(columnFunctionsDataFields).includes(datafield) &&
      datafield !== columnFunctionsDataFields.USERAPPROVALSTATUS
    ) {
      e.event.preventDefault();
      this.processColumnFunction(datafield, data);
    }
  }

  processColumnFunction(datafield, data, eventTarget?: any) {
    if (
      datafield == columnFunctionsDataFields.PROJECTMILESTONEUSERCOMPLETEDDATE
    ) {
      this.modifyCompleteDate(data);
      return;
    }

    if (datafield == columnFunctionsDataFields.USERAPPROVALSTATUS) {
      if (data.UserApprovalStatus == this.taskUserApprovalStatus.NOT_ASSIGNED) {
        this.addOrEditAssignees(data);
      } else if (
        data.UserApprovalStatus == this.taskUserApprovalStatus.COMPLETED
      ) {
        this.modifyCompleteDate(data);
      } else if (
        data.UserApprovalStatus == this.taskUserApprovalStatus.APPROVE ||
        data.UserApprovalStatus == this.taskUserApprovalStatus.REJECT
      ) {
        this.approveOrRejectTask(data, data.UserApprovalStatus);
      } else if (
        data.UserApprovalStatus == this.taskUserApprovalStatus.APPROVE_REJECT
      ) {
        let action = eventTarget.classList.contains('pt-approveBtn')
          ? this.taskUserApprovalStatus.APPROVE
          : this.taskUserApprovalStatus.REJECT;
        this.approveOrRejectTask(data, action);
      }
      return;
    }

    const permissionDenied = this.checkUserLevelRequirement(
      dataColActionPermissionMap[datafield]
    );
    if (permissionDenied) return;

    const selectedTabIndex =
      datafield == 'ProjectMilestoneName'
        ? 0
        : datafield == 'Approvers'
        ? 1
        : datafield == 'FilesCount'
        ? 3
        : 2;
    this.showTaskInfoModal(
      data.ProjectMilestoneID,
      data.ProjectMilestoneParentID,
      data.ProjectMilestoneStep,
      data.IndexOrder,
      data.TaskSubTasksCount,
      selectedTabIndex
    );
  }

  searchDataGrid(searchText) {
    this.searchText = searchText;
    this.projectTasksGrid.instance.searchByText(searchText);
  }
  clearAllFilters() {
    this.projectTasksGrid.instance.clearFilter();
    this.searchText = '';
  }

  onViewNameChange(e, process) {
    !this.inputViewTextBox.validate()
      ? this.inputViewTextBox.focusTextBox()
      : this.createNewListView(e.value);
  }

  onEnterKeyHit(e, process) {
    !this.inputViewTextBox.validate()
      ? this.inputViewTextBox.focusTextBox()
      : this.createNewListView(this.inputViewTextBox.value);
  }

  onCellPrepared(e) {
    if (e.rowType !== 'header' && e.column.name == 'selection') {
      let htmlCellElement = e.cellElement;
      htmlCellElement.setAttribute('id', 'ptm-taskId' + e.rowIndex);
    }

    if (
      (this.userAccessLevel !== 1 || !this.isProjectEditable) &&
      e.column.name == 'selection'
    ) {
      if (e.rowType == 'header') {
        this.disableHeaderCheckbox(e);
      } else {
        this.disableCheckboxes([e.data.ProjectMilestoneID]);
      }
    }
  }

  disableHeaderCheckbox(e) {
    let htmlCellElement =
      e.cellElement.length === undefined ? e.cellElement : e.cellElement[0];
    var editor = dxCheckBox.getInstance(
      htmlCellElement.querySelector('.dx-select-checkbox')
    );
    if (editor) {
      editor.option('disabled', true);
    }
    htmlCellElement.style.pointerEvents = 'none';
  }

  getRestOfApprovers(Approvers) {
    let assigneeNames = '';
    Approvers.forEach((assignee, index) => {
      if (index > 2) {
        assigneeNames += assignee.FullName + ' \n';
      }
    });
    return assigneeNames;
  }

  showTaskInfoModal(
    taskId: number,
    taskParentId: number,
    taskStep: number,
    taskIndexOrder: number,
    taskSubTasksCount: number,
    selectedTabIndex = 0
  ) {
    this.selectedTaskId = taskId;
    this.getCurrentProjectTasks();
    const dialogRef = this.dialog.open(TaskInfoComponent, {
      height: '800px',
      width: '500px',
      panelClass: 'taskInfoModal',
      data: {
        projectId: this.projectId,
        taskId: this.selectedTaskId,
        taskParentId,
        taskStep,
        taskIndexOrder,
        taskSubTasksCount,
        projectCurrentTasks: this.projectCurrentTasks,
        selectedTabIndex,
      },
      disableClose: true,
    });

    this.subs.push(
      dialogRef
        .afterClosed()
        .pipe(filter((reload) => !!reload))
        .subscribe((toDo) => {
          if (toDo.reload) {
            this.getGridData();
          }
          if (toDo.showEditTask && toDo.taskDetails) {
            this.addOrEditTask(
              toDo.taskDetails.taskIndexOrder,
              true,
              toDo.taskDetails.taskId,
              toDo.taskDetails.taskParentId,
              toDo.taskDetails.taskStep,
              toDo.taskDetails.taskSubTasksCount
            );
          }
        })
    );
  }

  saveState(state) {
    sessionStorage.setItem('projectTasksGridState', JSON.stringify(state));
    sessionStorage.setItem(
      'projectTasksGridExpand',
      JSON.stringify(this.isExpandAll)
    );
  }

  expandCollapseAll() {
    this.isExpandAll = !this.isExpandAll;
    this.expandOrCollapseGrid();
  }

  expandOrCollapseGrid() {
    if (this.isExpandAll) {
      this.gridData.forEach((row) => {
        this.projectTasksGrid.instance.expandRow(row.ProjectMilestoneID);
      });
    } else {
      this.gridData.forEach((row) => {
        this.projectTasksGrid.instance.collapseRow(row.ProjectMilestoneID);
      });
      this.expandedRowKeys?.forEach((key) => {
        this.projectTasksGrid.instance.expandRow(key);
      });
    }
  }

  showColumnChooser() {
    this.projectTasksGrid.instance.showColumnChooser();

    const clear = document.querySelectorAll('span.dx-icon.dx-icon-clear');
    clear.forEach((element) => {
      if (element.innerHTML == '') element.className = 'none';
      element.innerHTML =
        "<button class='dx-icon dx-icon-clear' style='border: none; background-color: transparent;'></button>";
    });
  }

  moreMenuClosed() {
    !this.inputViewTextBox.validate() && this.inputViewTextBox.reset();
  }

  getTaskStatusColor(color: string): string {
    switch (color) {
      case 'Red':
        return 'tin-status-icon-red';
        break;
      case 'Green':
        return 'tin-status-icon-green';
        break;
      case 'Yellow':
        return 'tin-status-icon-yellow';
        break;
      case 'Gray':
        return 'tin-status-icon-gray';
        break;
      case 'White':
        return 'tin-status-icon-white';
        break;
      default:
        return 'tin-status-icon-lightGray';
        break;
    }
  }

  getCurrentProjectTasks() {
    this.projectCurrentTasks = [];
    this.gridData.forEach((projectTask) => {
      const tempDtls: ProjectTaskDropdownInfo = <ProjectTaskDropdownInfo>{};
      tempDtls.taskId = projectTask.ProjectMilestoneID;
      tempDtls.taskParentId = projectTask.ProjectMilestoneParentID;
      tempDtls.taskStepNumber = projectTask.ProjectMilestoneStep;
      tempDtls.taskFullStep = projectTask.ProjectMilestoneStepFull;
      tempDtls.taskName = projectTask.ProjectMilestoneName;
      tempDtls.displayVal =
        projectTask.ProjectMilestoneStepFull +
        ' - ' +
        projectTask.ProjectMilestoneName;
      tempDtls.indexOrder = projectTask.IndexOrder;
      tempDtls.taskSubTasksCount = projectTask.TaskSubTasksCount;
      this.projectCurrentTasks.push(tempDtls);
    });
  }

  public getMemberInfo() {
    this.subs.push(
      this.dashboardService.getmemberinfo().subscribe(
        (res: any) => {
          this.memberInfo = res.data;
        },
        (error: any) =>
          console.log('Error occurred getting Member Info Data ', error),
        () => {}
      )
    );
  }

  public getProjectContactLevel(projectId) {
    this.subs.push(
      this.dashboardService.getProjectContactLevel(projectId).subscribe(
        (res: any) => {
          if (res && res.success) {
            this.userAccessLevel = res.data.userLevel;
            this.isProjectEditable = res.data.isEditable;
          }
          this.sessionView = sessionStorage.getItem('projectTasksSessionView')
            ? JSON.parse(sessionStorage.getItem('projectTasksSessionView'))
            : null;
          this.getListViews();
        },
        (error: any) =>
          console.log('Error occurred getting User Access Level ', error),
        () => {}
      )
    );
  }

  excelExportClick() {
    this.subs.push(
      this.currentObject
        .pipe(first())
        .subscribe(({ objectName, objectType }) =>
          new ProjectTaskTreeExportUtility(this.projectTasksGrid).download(
            `${objectType}_${objectName}`
          )
        )
    );
  }

  private isParentExistsInTasks(parentId: number): boolean {
    return (
      this.gridData.findIndex((item) => item.ProjectMilestoneID === parentId) >=
      0
    );
  }

  private getGridData() {
    let gridDataObservable = this.returnGridDataObservable();
    this.subs.push(gridDataObservable.subscribe());
  }

  private returnGridDataObservable(): Observable<boolean> {
    let gridDataRequest = {
      listPageId: this.currentListView.listPageId,
      userViewId: null,
      masterGroupId: null,
      gridStateOverride: '',
      tempArchiveToggleValue: 3,
      OID: this.projectId,
      Oids: [this.userAccessLevel],
      InClauses: ['(0)'],
    };

    return this.dashboardService.getGridData(gridDataRequest).pipe(
      map((res: any) => {
        this.isOneTaskShrinkable = false;

        if (res) {
          this.availablePredecessors = [];
          this.predValues = [];
          this.availableApprovers = [];
          this.approversValues = [];

          this.gridData = res.data;
          this.noDataText = this.gridData.length ? '' : 'No Data';
          this.dataRetrieved = true;
          this.gridData.forEach((task) => {
            task.DisplayParentID = this.isParentExistsInTasks(
              task.ProjectMilestoneParentID
            )
              ? task.ProjectMilestoneParentID
              : 0;
            task.Approvers = JSON.parse(task.Approvers);
            task.TaskStatus = JSON.parse(task.TaskStatus);
            task.ProjectMilestoneDescription = task.ProjectMilestoneDescription
              ? task.ProjectMilestoneDescription.replace(/<br>/g, '\n')
              : task.ProjectMilestoneDescription;
            task.Predecessors = JSON.parse(task.Predecessors);
            task.SubTaskLimitReached = this.subTaskLimitReached(
              task.ProjectMilestoneStepFull
            );
            if (task.Predecessors?.length) {
              task.Predecessors.forEach((taskPred) => {
                if (this.predValues.indexOf(taskPred) == -1) {
                  this.predValues.push(taskPred);
                }
              });
            }
            if (task.Approvers?.length) {
              task.Approvers.forEach((approver) => {
                let approverVal = `${approver.FullName} - ${approver.ApprovalStatus}`;
                if (this.approversValues.indexOf(approverVal) == -1) {
                  this.approversValues.push(approverVal);
                }
              });
            }
            if (task.IsShrinkable === 'Yes') {
              this.isOneTaskShrinkable = true;
            }
          });
          if (this.approversValues.length) {
            this.buildApproversFilterSource();
          }
          if (this.predValues.length) {
            this.buildPredecessorFilterSource();
          }
          let savedState = sessionStorage.getItem('projectTasksGridState');
          this.activeViewState = sessionStorage.getItem(
            'projectTasksGridStateSet'
          )
            ? savedState
            : this.currentListView.view;
          this.activeViewId = this.currentListView.id;
          this.isExpandAll = sessionStorage.getItem('projectTasksGridExpand')
            ? JSON.parse(sessionStorage.getItem('projectTasksGridExpand'))
            : this.currentListView.isExpandAllSelected;
          if (!sessionStorage.getItem('projectTasksGridStateSet')) {
            sessionStorage.setItem(
              'projectTasksGridStateSet',
              JSON.stringify(true)
            );
          }
          this.setCurrentState();

          return true;
        } else {
          return false;
        }
      })
    );
  }

  private subTaskLimitReached(taskStepFull: string) {
    if (taskStepFull === null || taskStepFull === undefined) {
      return false;
    }

    var splittedTaskStepFull = taskStepFull.split('.');
    return splittedTaskStepFull.length >= 5;
  }

  buildApproversFilterSource() {
    let approverHeaderFilterObj = {
      text: null,
      value: null,
    };
    this.availableApprovers.push(approverHeaderFilterObj);
    this.approversValues?.forEach((val) => {
      let approverHeaderFilterObj = {
        text: val,
        value: val,
      };
      this.availableApprovers.push(approverHeaderFilterObj);
    });
  }

  calcApproversCellValue(data) {
    return data.Approvers?.length
      ? data.Approvers.map((a) => `${a.FullName} - ${a.ApprovalStatus}`)
      : '';
  }

  buildPredecessorFilterSource() {
    let predHeaderFilterObj = {
      text: null,
      value: null,
    };
    this.availablePredecessors.push(predHeaderFilterObj);
    this.predValues.forEach((val) => {
      let predHeaderFilterObj = {
        text: val,
        value: val,
      };
      this.availablePredecessors.push(predHeaderFilterObj);
    });
  }

  calcPredecessorsCellValue(data) {
    return data.Predecessors?.length ? data.Predecessors.map((p) => p) : '';
  }

  calcFilterExpression(
    this: Column,
    filterValue,
    selectedFilterOperation,
    target
  ) {
    if (target === 'search') {
      return ['Predecessors', 'contains', filterValue];
    }

    if (filterValue) {
      let selector = (data) => {
        let applyOperation = (arg1, arg2, op) => {
          if (op === '=') return arg1 === arg2;
          if (op === 'contains') return arg1.includes(arg2);
          if (op === 'startswith') return arg1.startsWith(arg2);
          if (op === 'endswith') return arg1.endsWith(arg2);
        };
        let values = this.calculateCellValue(data);
        return (
          values &&
          !!values.find((v) =>
            applyOperation(v, filterValue, selectedFilterOperation)
          )
        );
      };
      return [selector, '=', true];
    }
    return this.defaultCalculateFilterExpression.apply(this, arguments);
  }

  getListViews() {
    const request: GetViewDropdownDataRequest = {
      objectTypeId: this.objectTypeId,
      isSuperUser: this.isSuperUser,
    };

    this.dashboardService
      .getListViewSelectorItems(request)
      .subscribe((res: any) => {
        if (res) {
          this.listViews = res.data;

          this.availableListViewCount =
            this.listViews.coStarListViews.length +
            this.listViews.myListViews.length +
            this.listViews.sharedListViews.length;

          if (this.isNewListViewCreated) {
            const newListView = this.listViews.myListViews.find(
              (x) => x.id == new Number(this.newListViewId)
            );
            this.isNewListViewCreated = false;
            this.getCurrentView(newListView);
          } else if (this.isActiveListView) {
            this.isActiveListView = false;
            this.getDefaultView();
          } else if (!this.activeViewId) {
            if (this.sessionView) {
              const foundView =
                this.listViews.coStarListViews.find(
                  (x) => x.id == this.sessionView.id
                ) ||
                this.listViews.myListViews.find(
                  (x) => x.id == this.sessionView.id
                ) ||
                this.listViews.sharedListViews.find(
                  (x) => x.id == this.sessionView.id
                ) ||
                this.listViews.hiddenListViews.find(
                  (x) => x.id == this.sessionView.id
                );
              if (foundView) {
                this.getCurrentView(foundView);
              } else {
                this.getDefaultView();
              }
            } else {
              this.getDefaultView();
            }
          } else {
            this.setCurrentState();
          }
        } else {
          //this.dialogService.alert('Get Project Tasks Grid Data Error', 'There was an issue with getting Project Tasks. Please contact the system administrator.', 'OK');
        }
      });
  }

  getDefaultView() {
    let defaultListView = this.listViews?.coStarListViews?.find(
      (x) => x.isDefault
    )
      ? this.listViews?.coStarListViews?.find((x) => x.isDefault)
      : this.listViews?.myListViews?.find((x) => x.isDefault)
      ? this.listViews?.myListViews?.find((x) => x.isDefault)
      : this.listViews?.sharedListViews?.find((x) => x.isDefault)
      ? this.listViews?.sharedListViews?.find((x) => x.isDefault)
      : this.listViews?.coStarListViews[0]
      ? this.listViews?.coStarListViews[0]
      : this.listViews?.myListViews[0]
      ? this.listViews?.myListViews[0]
      : this.listViews?.sharedListViews[0]
      ? this.listViews?.sharedListViews[0]
      : this.listViews?.hiddenListViews[0];

    this.getCurrentView(defaultListView);
  }

  createNewListView(viewName: string) {
    this.inputViewName = viewName.trim();

    const userListView: ListView = {
      id: 0,
      listViewType: this.userListViewType,
      objectTypeId: this.objectTypeId,
      listPageId: this.currentListView.listPageId,
      name: this.inputViewName,
      view: JSON.stringify(this.projectTasksGrid.instance.state()),
      isExpandAllSelected: this.isExpandAll,
      archiveToggleValue: 3,
      masterGroupId: null,
    };

    this.dashboardService
      .createUserListView(userListView)
      .subscribe((res: any) => {
        if (res) {
          this.isNewListViewCreated = true;
          this.newListViewId = res.data;
          this.inputViewTextBox.reset();
          this.getListViews();
        } else {
        }
      });

    this.moreMenuTrigger.closeMenu();
  }

  saveSessionState(view) {
    sessionStorage.setItem('projectTasksSessionView', JSON.stringify(view));
  }

  getCurrentView(view: any) {
    this.currentListView = view;
    this.currentListViewName = this.currentListView.name;
    this.saveSessionState(this.currentListView);
    if (!this.activeViewId) {
      this.getGridData();
    } else {
      this.activeViewId = this.currentListView.id;
      this.isExpandAll = this.currentListView.isExpandAllSelected;
      this.activeViewState = this.currentListView.view;
      this.setCurrentState();
    }
  }

  setCurrentState() {
    this.allSelectedRowKeys = [];
    this.allDisabledRowKeys = [];
    this.searchText = JSON.parse(this.activeViewState)?.searchText
      ? JSON.parse(this.activeViewState).searchText
      : '';
    let parsedState = JSON.parse(this.activeViewState);
    if (parsedState) {
      parsedState.selectedRowKeys = [];
      this.expandedRowKeys = parsedState.expandedRowKeys?.length
        ? parsedState.expandedRowKeys
        : [];
      this.projectTasksGrid?.instance.state(parsedState);
    } else {
      this.projectTasksGrid?.instance.state({});
    }
    this.projectTasksGrid?.instance.clearSelection();
    this.expandOrCollapseGrid();
  }

  setCurrentListView(selectedListView: ListView) {
    if (selectedListView.id === this.currentListView.id) {
      return;
    }
    this.getCurrentView(selectedListView);
  }

  setDefaultListView(view: ListView) {
    view.isDefault = true;

    const request: SetDefaultListViewRequest = {
      listViewId: view.id,
      listViewType: view.listViewType,
      objectTypeId: this.objectTypeId,
      clearDefault: false,
    };

    this.dashboardService.setDefaultListView(request).subscribe(() => {
      this.getListViews();
    });
  }

  clearDefault(view: ListView) {
    view.isDefault = false;

    const request: SetDefaultListViewRequest = {
      listViewId: view.id,
      listViewType: view.listViewType,
      objectTypeId: this.objectTypeId,
      clearDefault: true,
    };

    this.dashboardService.setDefaultListView(request).subscribe(() => {
      this.getListViews();
    });
  }

  shareListView(listview: ListView) {
    this.sharingListView = listview;

    this.cremShareListViewPopup.showPopup();
  }

  reloadListViewMenu() {
    if (this.cremShareListViewPopup.isDeleteConfirm) {
      return;
    }

    this.getListViews();
  }

  hideListView(listView: ListView, isHidden: boolean) {
    if (isHidden && this.availableListViewCount === 1) {
      this.dialogService.alert(
        'Information',
        'Cannot delete or hide all views in the list.',
        'Close'
      );
      return;
    }

    const request: HideListViewRequest = {
      listViewId: listView.id,
      listViewType: listView.listViewType,
      isHidden: isHidden,
    };

    this.dashboardService.hideListView(request).subscribe(() => {
      this.getListViews();
    });
  }

  updateListView() {
    this.currentListView.view = JSON.stringify(
      this.projectTasksGrid.instance.state()
    );

    const viewObj = {
      id: this.currentListView.id,
      listViewType: this.currentListView.listViewType,
      view: this.currentListView.view,
      archiveToggleValue: 3,
      isExpandAllSelected: this.isExpandAll,
      masterGroupId: this.currentListView.masterGroupId,
    };

    this.dashboardService.updateListView(viewObj).subscribe(() => {});
  }

  resetListView() {
    this.setCurrentState();
  }

  deleteListView(delView: ListView, isConfirmed = false) {
    if (this.availableListViewCount === 1) {
      this.dialogService.alert(
        'Information',
        'Cannot delete or hide all views in the list.',
        'Close'
      );
      return;
    }

    if (
      !isConfirmed &&
      (delView.isSharedWithOthers || delView.isSharedWithMe)
    ) {
      this.sharingListView = delView;
      this.cremShareListViewPopup.showPopup(true);

      return;
    }

    this.isActiveListView =
      delView.listViewType === this.currentListView.listViewType &&
      delView.id === this.currentListView.id;

    this.dashboardService.deleteUserView(delView.id).subscribe(() => {
      this.getListViews();
    });
  }

  getFiltersCount() {
    if (typeof this.projectTasksGrid?.instance?.state !== 'function') {
      return '';
    }
    const filters = this.projectTasksGrid?.instance?.state().filterValue;
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

  //**** Task Setting Popup Related Code */
  showTaskDetailSettings() {
    this.subs.push(
      combineLatest([
        this.dashboardService.getProjectTaskSettings(this.projectId),
        this.dashboardService.getProjectEmailPreferences(this.projectId),
      ]).subscribe(
        ([projSettings, projEmailPreferences]) => {
          if (!projSettings || !projEmailPreferences) {
            this.dashboardService.displayContactSystemAdminMessage();
          } else if (projSettings.success && projEmailPreferences.success) {
            this.projectTaskSettings = projSettings.data;
            this.projectEmailPreferences = projEmailPreferences.data;

            this.originalStartDate = new Date(
              this.projectTaskSettings.startDate
            ).toDateString();
            this.originalStartDate =
              this.originalStartDate === 'Invalid Date'
                ? ''
                : this.originalStartDate;

            this.originalDueDate = new Date(
              this.projectTaskSettings.dueDate
            ).toDateString();
            this.originalDueDate =
              this.originalDueDate === 'Invalid Date'
                ? ''
                : this.originalDueDate;

            this.checkAllemailOptionsSelected();

            this.settingsVisible = true;
          } else {
            this.dashboardService.displayContactSystemAdminMessage();
          }
        },
        (error: any) => {
          console.log(
            'Error occurred getting Projects Client Settings and or Email Preferences',
            error
          );
        },
        () => {}
      )
    );
  }

  private refreshProjectTaskSettings() {
    this.subs.push(
      this.getProjectTaskSettingsObservable().subscribe(
        (res) => {
          if (res) {
            this.originalStartDate = new Date(
              this.projectTaskSettings.startDate
            ).toDateString();
            this.originalStartDate =
              this.originalStartDate === 'Invalid Date'
                ? ''
                : this.originalStartDate;

            this.originalDueDate = new Date(
              this.projectTaskSettings.dueDate
            ).toDateString();
            this.originalDueDate =
              this.originalDueDate === 'Invalid Date'
                ? ''
                : this.originalDueDate;
          }
        },
        (error: any) => {
          console.log(
            'Error occurred getting Projects Client Settings and or Email Preferences',
            error
          );
        },
        () => {}
      )
    );
  }

  showAppendTemplateDialog() {
    let dialogRef = this.dialog.open(AppendTemplateComponent, {
      height: '400px',
      width: '800px',
      maxHeight: '90vh',
      maxWidth: '90vw',
      panelClass: 'appendTemplateModal',
      data: { projectId: this.projectId },
      disableClose: true,
    });

    this.subs.push(
      dialogRef
        .afterClosed()
        .pipe(filter((reload) => !!reload))
        .subscribe((changesSaved) => {
          if (changesSaved) {
            this.dashboardService.successNotify(
              'Tasks were successfully appended to the transaction.'
            );
            this.getGridData();
          }
        })
    );
  }

  checkAllemailOptionsSelected() {
    this.selectAllEmailPref = true;
    let setting;
    for (setting in this.projectEmailPreferences) {
      if (
        setting.trim() !== 'transactionName' &&
        setting.trim() !== 'emailOnInitiation'
      ) {
        if (this.projectEmailPreferences[setting] == true) {
          continue;
        } else {
          this.selectAllEmailPref = false;
          break;
        }
      }
    }
  }

  taskSettingsOnClose(e) {
    if (e == 'close') {
      this.settingsVisible = false;
      this.taskSettingsChangesMade = false;
    } else {
      if (this.taskSettingsChangesMade) {
        this.subs.push(
          this.dialogService
            .confirm(
              'Changes Made!',
              `Changes you made have not been saved.  Would you like to continue editing or leave ?`,
              'Continue',
              'Leave'
            )
            .pipe(
              filter((confirmed) => !confirmed),
              tap((_) => {
                this.settingsVisible = false;
                this.taskSettingsChangesMade = false;
              })
            )
            .subscribe()
        );
      } else {
        this.settingsVisible = false;
        this.taskSettingsChangesMade = false;
      }
    }

    if (this.refreshForApplyClick) {
      this.getGridData();
    }
  }

  onStartOrDueDateChange(e, setting) {
    if (!e.event) {
      return;
    }
    this.taskSettingsChangesMade = true;
    this.projectTaskSettings[setting] = e.value;

    this.checkDateChangeForUserAlert(e.value, setting);
  }

  private checkDateChangeForUserAlert(
    datePickerNewValue,
    datePickerChangedName: string
  ) {
    this.lastDatePickerNewValue = datePickerNewValue;
    this.lastDatePickerChangedName = datePickerChangedName;
    let showCanNotChangeBothDatesAlert = false;
    let determineDates = false;
    this.numOfDays = null;
    datePickerNewValue = new Date(datePickerNewValue).toDateString();

    if (datePickerChangedName === 'startDate') {
      if (
        new Date(this.dueDatePicker.value).toDateString() !==
        this.originalDueDate
      ) {
        showCanNotChangeBothDatesAlert = true;
      } else {
        if (
          datePickerNewValue !== '' &&
          datePickerNewValue !== this.originalStartDate &&
          new Date(datePickerNewValue) > new Date(this.originalStartDate)
        ) {
          determineDates = true;
        }
      }
    } else {
      if (
        new Date(this.startDatePicker.value).toDateString() !==
        this.originalStartDate
      ) {
        showCanNotChangeBothDatesAlert = true;
      } else {
        if (
          datePickerNewValue !== '' &&
          datePickerNewValue !== this.originalDueDate &&
          new Date(datePickerNewValue) < new Date(this.originalDueDate)
        ) {
          determineDates = true;
        }
      }
    }

    if (showCanNotChangeBothDatesAlert) {
      this.dialogService.alert(
        'Information',
        'You cannot change both the Start and Due dates.',
        'Close'
      );

      this.resetDates(datePickerChangedName);

      return;
    }

    if (determineDates) {
      this.determineAutoCalcDates(datePickerNewValue, datePickerChangedName);
    }
  }

  private determineAutoCalcDates(
    datePickerNewValue: string,
    datePickerChangedName: string
  ) {
    let newDate: Date = null;
    let originalDate: Date = null;
    let dateTypeText = null;
    this.numOfDays = null;

    newDate = new Date(datePickerNewValue);

    if (
      datePickerChangedName === 'startDate' &&
      this.originalStartDate !== ''
    ) {
      originalDate = new Date(this.originalStartDate);
      dateTypeText = 'end';
    } else if (
      datePickerChangedName === 'dueDate' &&
      this.originalDueDate !== ''
    ) {
      originalDate = new Date(this.originalDueDate);
      dateTypeText = 'start';
    }

    if (this.isOneTaskShrinkable && this.projectTaskSettings.autoCalculate) {
      const dialogCloseEvent = this.dialogService.confirm(
        'Information',
        `Click OK to allow the ${dateTypeText} date to shift.\r\nClick Cancel to lock the ${dateTypeText} date and shrink the project to the max ${this.projectTaskSettings.shrinkableCount} days.`,
        'OK',
        'Cancel'
      );

      dialogCloseEvent.subscribe((res) => {
        if (res) {
          this.numOfDays = null;
        } else {
          this.numOfDays = this.dateDiffByDays(
            originalDate,
            newDate,
            this.projectTaskSettings.calculatedBy
          );
          this.numOfDays =
            this.numOfDays < 0 ? Math.abs(this.numOfDays) : this.numOfDays;
          if (this.numOfDays > this.projectTaskSettings.shrinkableCount) {
            this.dialogService.alert(
              'Information',
              `You entered ${this.numOfDays} days but only have ${this.projectTaskSettings.shrinkableCount} days available.`,
              'Close'
            );

            this.resetDates(datePickerChangedName);
          }
        }
      });
    }
  }

  private resetDates(datePickerChangedName: string) {
    if (datePickerChangedName === 'startDate') {
      this.projectTaskSettings[datePickerChangedName] = new Date(
        this.originalStartDate
      );
    } else {
      this.projectTaskSettings[datePickerChangedName] = new Date(
        this.originalDueDate
      );
    }
  }

  private dateDiffByDays(
    startDate: Date,
    endDate: Date,
    excludeWeekEnds: boolean
  ): number {
    var count = 0;
    var target = new Date(
      Math.min(new Date(startDate).getTime(), new Date(endDate).getTime())
    );
    var end = new Date(
      Math.max(new Date(startDate).getTime(), new Date(endDate).getTime())
    );
    while (target < end) {
      if (!excludeWeekEnds) {
        count++;
      } else {
        let targetDay = target.getDay();

        if (0 < targetDay && targetDay < 6) count++;
      }

      target.setDate(target.getDate() + 1);
    }

    return count;
  }

  projSettingToggleChanged(e, setting) {
    this.taskSettingsChangesMade = true;
    this.projectTaskSettings[setting] = e.checked;
    if (
      setting === 'autoCalculate' &&
      e.checked &&
      this.lastDatePickerNewValue !== null &&
      this.lastDatePickerChangedName !== null
    ) {
      this.checkDateChangeForUserAlert(
        this.lastDatePickerNewValue,
        this.lastDatePickerChangedName
      );
      this.lastDatePickerNewValue = null;
      this.lastDatePickerChangedName = null;
    }
  }

  selectAllEmailPreferences(e) {
    if (!e.event) {
      return;
    }
    this.taskSettingsChangesMade = true;
    this.selectAllEmailPref = e.value;
    this.processAllEmailPreferences();
  }

  onEnterSelectAll(e) {
    this.selectAllEmailPref = e;
    this.processAllEmailPreferences();
  }

  processAllEmailPreferences() {
    for (let setting in this.projectEmailPreferences) {
      if (setting !== 'transactionName' && setting !== 'emailOnInitiation') {
        this.projectEmailPreferences[setting] = this.selectAllEmailPref;
      }
    }
  }

  emailOptionChanged(e, option) {
    if (!e.event) {
      return;
    }
    this.taskSettingsChangesMade = true;
    this.projectEmailPreferences[option] = e.value;
    this.selectAllEmailPref = e.value ? this.selectAllEmailPref : e.value;

    if (e.value) {
      this.checkAllemailOptionsSelected();
    }
  }

  applyOrSaveTaskSettings(oper) {
    this.disableTaskSettingsBtns = true;
    if (!this.projectTaskSettings.startDate) {
      this.startDatePicker.focusDatePicker();
      this.disableTaskSettingsBtns = false;
      return;
    }

    this.postProjectTaskSettings.projectID = this.projectId;
    this.postProjectTaskSettings.startDate = this.projectTaskSettings.startDate;
    this.postProjectTaskSettings.dueDate = this.projectTaskSettings.dueDate;
    this.postProjectTaskSettings.calculateDates =
      this.projectTaskSettings.calculateDates;
    this.postProjectTaskSettings.calculatedBy =
      this.projectTaskSettings.calculatedBy;
    this.postProjectTaskSettings.autoCalculate =
      this.projectTaskSettings.autoCalculate;
    this.postProjectTaskSettings.shiftTimeline =
      this.projectTaskSettings.shiftTimeline;
    this.postProjectTaskSettings.projectRequiredTaskNotes =
      this.projectTaskSettings.projectRequiredTaskNotes;
    this.postProjectTaskSettings.numOfDaysDifference = this.numOfDays;

    this.postProjectEmailPreferences.projectID = this.projectId;
    this.postProjectEmailPreferences.autoEmail =
      this.projectEmailPreferences.transactionAutoEmail;
    this.postProjectEmailPreferences.overdueEmails =
      this.projectEmailPreferences.emailOverdue;
    this.postProjectEmailPreferences.onStartEmails =
      this.projectEmailPreferences.emailOnStart;
    this.postProjectEmailPreferences.onApproval =
      this.projectEmailPreferences.emailOnApproval;
    this.postProjectEmailPreferences.copyApprover =
      this.projectEmailPreferences.emailCopyApprover;
    this.postProjectEmailPreferences.includeMinors =
      this.projectEmailPreferences.emailIncludeMinors;
    this.postProjectEmailPreferences.onCompletion =
      this.projectEmailPreferences.emailOnCompletion;
    this.postProjectEmailPreferences.onInitiation =
      this.projectEmailPreferences.emailOnInitiation;
    this.postProjectEmailPreferences.followDependencies =
      this.projectEmailPreferences.emailFollowDependencies;
    this.postProjectEmailPreferences.followSteps =
      this.projectEmailPreferences.emailFollowSteps;
    this.postProjectEmailPreferences.fileUpload =
      this.projectEmailPreferences.emailOnFileUpload;
    this.postProjectEmailPreferences.milestoneApproval =
      this.projectEmailPreferences.emailOnMilestoneApproval;
    this.postProjectEmailPreferences.copyTeam =
      this.projectEmailPreferences.emailCopyTeam;
    this.postProjectEmailPreferences.milestoneCompletion =
      this.projectEmailPreferences.emailMilestoneCompletionCCTeam;

    this.subs.push(
      combineLatest([
        this.dashboardService.postProjectTaskSettings(
          this.postProjectTaskSettings
        ),
        this.dashboardService.postProjectEmailPreferences(
          this.postProjectEmailPreferences
        ),
      ]).subscribe(
        ([pps, ppep]) => {
          this.disableTaskSettingsBtns = false;
          let ppsApiFailed = false;
          if (!pps || !ppep) {
            let errMsg = '';
            if (!pps) {
              ppsApiFailed = true;
              errMsg = 'Project Task Settings API call has failed.';
            }

            if (!ppep) {
              if (ppsApiFailed) {
                errMsg =
                  'Project Task Settings and Project Email Preferences API calls has failed.';
              } else {
                errMsg = 'Project Email Preferences API call has failed.';
              }
            }

            this.dialogService.alert('Information', errMsg, 'Close');
          } else if (pps.success && ppep.success) {
            this.getNotesRequiredFlag();
            this.taskSettingsChangesMade = false;
            if (pps.success) {
              if (pps.data.alertMessage !== null) {
                this.dialogService
                  .alert('Information', pps.data.alertMessage, 'Close')
                  .subscribe(() => this.applyOrSaveRefresh(oper));
              } else {
                this.applyOrSaveRefresh(oper);
              }
            }
          } else {
            this.dialogService.alert(
              'Information',
              'Saving either Project Task Settings or Project Email Preferences is not successful.',
              'Close'
            );
          }
        },
        (error: any) => {
          this.disableTaskSettingsBtns = false;
          console.log(
            'Error occurred Saving Project Task Settings or Project Email Preferences ',
            error
          );
        },
        () => {}
      )
    );
  }

  private applyOrSaveRefresh(operation: string) {
    if (operation === 'apply') {
      this.refreshForApplyClick = true;
      this.refreshProjectTaskSettings();
    } else if (operation === 'save') {
      this.settingsVisible = false;
      this.getGridData();
    }
  }

  copyTransactionTemplate() {
    this.copyTransactionVisible = true;
  }

  applyOrSaveCopyTransaction(applyOrSave) {
    if (applyOrSave == 'Copy') {
      this.disabledCopyTransBtn = true;
      this.copyTransactionComponent.validateAndApplyChanges();
    } else {
      this.ctSaveButtonText = null;
      this.copyTransactionVisible = false;
      this.copyTransactionComponent.resetPopup();
    }
  }

  handleCopyTransactionFormChanged(hasChanges: boolean) {
    this.copyTransBtnVisisble = hasChanges ? true : false;
  }

  handleCopyCompleted({ newProjectId }) {
    this.newProjectId = newProjectId;
    this.copyTransBtnVisisble = !!newProjectId ? false : true;
  }

  handleCopyBtnStatus(status: boolean) {
    this.disabledCopyTransBtn = status;
  }

  navigateToNewProject(oid: number) {
    this.route.queryParams.pipe(first()).subscribe((params) => {
      const updatedParams = { ...params, oid };
      this.copyTransactionPopup.close.emit(true);
      const urlTree = this.router.createUrlTree([], {
        relativeTo: this.route,
        queryParams: updatedParams,
        queryParamsHandling: 'merge',
      });

      const newUrl = this.router.serializeUrl(urlTree);
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigateByUrl(newUrl);
      });
    });
  }

  private getProjectTaskSettingsObservable() {
    return this.dashboardService.getProjectTaskSettings(this.projectId).pipe(
      switchMap((res) => {
        if (!res) {
          this.dashboardService.displayContactSystemAdminMessage();
          return of(false);
        } else if (res.success) {
          this.projectTaskSettings = res.data;
          return of(true);
        } else {
          this.dashboardService.displayContactSystemAdminMessage();
          return of(false);
        }
      })
    );
  }

  openQuickApprovalPopup() {
    if (this.isNotesFieldRequired) {
      this.quickApprovalFooterText = QUICK_APPROVAL_FOOTER_TEXT;
    }
    this.approveButtonText = APPROVE_BUTTON_TEXT;
    this.showQuickApprovalPopup = !this.showQuickApprovalPopup;
  }

  onApproveTasksClick(): void {
    this.quickApprovalComponent.approveTasks();
  }

  refreshTasksGrid(): void {
    this.getGridData();
  }

  onSaveTasksClick(): void {
    this.quickApprovalComponent.saveChanges();
  }

  handleQuickApprovalHasChanges({
    enableApply,
    enableApprove,
    approvalCount,
  }: {
    enableApply: boolean;
    enableApprove: boolean;
    approvalCount: number;
  }) {
    this.saveButtonText = enableApply ? 'Apply' : null;
    this.selectedTaskCount$.next(approvalCount);

    if (approvalCount !== 0) {
      this.approveButtonText = `${APPROVE_BUTTON_TEXT} (${approvalCount})`;
      this.selectedTaskCount$.next(approvalCount);
    } else {
      this.approveButtonText = APPROVE_BUTTON_TEXT;
      this.selectedTaskCount$.next(approvalCount);
    }
  }

  onQuickApprovalClose(): void {
    this.showQuickApprovalPopup = !this.showQuickApprovalPopup;
  }

  showSaveAsTasksTemplateDialog(): void {
    this.showSaveTasksAsTemplatePopup = !this.showSaveTasksAsTemplatePopup;
  }

  tasksTemplateInputChange(input: string) {
    input === ''
      ? (this.disableTasksTemplateSaveButton = true)
      : (this.disableTasksTemplateSaveButton = false);
  }

  saveTasksTemplatePopup(): void {
    this.saveTasksTemplateService.saveTasksTemplateSaveClick$.next(true);
  }

  closeTasksTemplatePopup(): void {
    this.showSaveTasksAsTemplatePopup = !this.showSaveTasksAsTemplatePopup;
  }

  tasksTemplateSaved(saveCompleted: boolean): void {
    if (saveCompleted) {
      this.showSaveTasksAsTemplatePopup = !this.showSaveTasksAsTemplatePopup;
    }
  }

  approveOrRejectTask(taskData, action) {
    const isValidAction =
      [TaskUserApprovalStatus.APPROVE, TaskUserApprovalStatus.REJECT].indexOf(
        action
      ) > -1;
    const isActionable =
      (this.isTaskApprovable(taskData) &&
        action == TaskUserApprovalStatus.APPROVE) ||
      (this.isTaskRejectable(taskData) &&
        action == TaskUserApprovalStatus.REJECT);
    if (!isValidAction || !isActionable) {
      return;
    }

    this.taskResendEmail =
      taskData.ApprovalStatus.trim() !==
        this.taskUserApprovalStatus.COMPLETED &&
      taskData.UseEmailApprovals == 'Yes'
        ? true
        : false;
    let popupHeight = action == 'Approve' ? '380px' : '260px';
    let dialogRef = this.dialog.open(TaskApproveOrRejectComponent, {
      height: popupHeight,
      width: '600px',
      maxHeight: '600px',
      panelClass: 'taskApprovalOrRejectModal',
      data: {
        taskData: taskData,
        action: action,
        dateFormat: this.dateFormat,
        notesRequired: this.isNotesFieldRequired,
        taskResendEmail: this.taskResendEmail,
      },
      disableClose: true,
    });
    this.subs.push(
      dialogRef
        .afterClosed()
        .pipe(filter((reload) => !!reload))
        .subscribe((reload) => {
          if (reload) {
            this.getGridData();
          }
        })
    );
  }

  getApprovalBtnTitleText(approvalPredecessors, approvalSubTasks) {
    if (approvalPredecessors && approvalSubTasks) {
      return `Tasks ${approvalPredecessors}, ${approvalSubTasks} ${this.approvalBtnTitle}`;
    } else if (approvalPredecessors) {
      return `Predecessor(s) ${approvalPredecessors} ${this.approvalBtnTitle}`;
    } else if (approvalSubTasks) {
      return `Subtask(s) ${approvalSubTasks} ${this.approvalBtnTitle}`;
    } else {
      return '';
    }
  }

  gridIsEmpty() {
    return this.gridData?.length === 0;
  }
  isProxyUserAndTaskIsUnassigned({
    IsProxyUser,
    UserApprovalStatus,
  }: {
    IsProxyUser;
    UserApprovalStatus;
  }) {
    if (this.isSuperUser) return false; // super user is unlimited
    IsProxyUser === 1 &&
      UserApprovalStatus.trim() == this.taskUserApprovalStatus.NOT_ASSIGNED;
  }

  /**
   * Checks if the user's access level meets the specified requirements.
   *
   * @param requiredLevels - An array of required user access levels.
   * @returns A boolean indicating if access should be disabled.
   *          Returns true if the user's access level does not match any of
   *          the required levels or if certain conditions such as
   *          being a superuser are not met.
   *          When true, it means the access is disabled.
   */
  checkUserLevelRequirement(action: AvailableActions): boolean {
    // when project is editable superuser can implicity perform all action
    // when project is NOT editable superuser has to be explicity defined to allow an action

    // if the project is editable AND the current user is a super user, all options are available
    if (this.isProjectEditable && this.isSuperUser) return false;

    // get action permissions mapping based on project editability
    const requiredLevels = this.isProjectEditable
      ? actionPermissions_ProjectEditable[action]
      : actionPermission_ProjectReadOnly[action];

    // there are no requirements for the action
    if (!requiredLevels) return this.isProjectEditable ? false : true;

    // enable actions for super-user when it is defined
    if (this.isSuperUser && requiredLevels.indexOf('SU') > -1) return false;

    // check config for required User Access Level
    const preventAction = requiredLevels.indexOf(this.userAccessLevel) === -1;

    return preventAction;
  }

  /**
   * Adjusts accessibility attributes for grid-related elements.
   *
   * Specifically, if there is a header checkbox element found in the grid,
   * this function removes the 'aria-sort' attribute from it.
   */
  adaAttr() {
    const headerCheckbox = this.projectTasksGrid.instance
      .element()
      .querySelector('.selectTask.dx-cell-focus-disabled');
    if (headerCheckbox) {
      headerCheckbox.removeAttribute('aria-sort');
    }
  }

  adaAttrTreeList(e: any) {
    const dxTreeListithTables = e.component
      .$element()
      .find('.dx-treelist-headers.dx-bordered-top-view');
    if (dxTreeListithTables && dxTreeListithTables.length > 0) {
      for (let i = 0; i < dxTreeListithTables.length; i++) {
        const element = dxTreeListithTables[i];
        if (element) {
          element.setAttribute('role', 'grid');
        }
      }
    }
  }

  isTaskCompleteDateModifiable(data: any) {
    // if not L1 and the task has no assignee\
    const notAdminAndTaskIsNotAssigned =
      this.userAccessLevel !== 1 && !this.isTaskAssigned(data);

    const preventAction =
      notAdminAndTaskIsNotAssigned ||
      this.isProxyUserAndTaskIsUnassigned(data) ||
      this.checkUserLevelRequirement(
        this.availableActions.MODIFY_COMPLETE_DATE
      );

    // if the project is editable and the current user is the assignee the complete date is modifiable
    const isTaskAsignee = this.isProjectEditable && this.isTaskAssignee(data);

    return isTaskAsignee || !preventAction;
  }

  isTaskDeletable(data: any) {
    const preventDelete =
      this.allSelectedRowKeys.length ||
      this.hasSubTasks(data.ProjectMilestoneID) ||
      this.checkUserLevelRequirement(this.availableActions.DELETE_TASKS);

    return !preventDelete;
  }

  isTaskRejectable(data: any) {
    const statusNotRejectable =
      [
        TaskUserApprovalStatus.APPROVE,
        TaskUserApprovalStatus.NOT_ASSIGNED,
        TaskUserApprovalStatus.REJECT,
      ].indexOf(data.UserApprovalStatus.trim()) > -1;

    const preventAction =
      statusNotRejectable ||
      this.checkUserLevelRequirement(
        this.availableActions.REJECT_TASK_APPROVAL
      );

    return !preventAction;
  }

  isTaskApprovable(data: any) {
    const approvableStatus =
      [
        TaskUserApprovalStatus.NOT_ASSIGNED,
        TaskUserApprovalStatus.COMPLETED,
        TaskUserApprovalStatus.APPROVED,
      ].indexOf(data.UserApprovalStatus.trim()) === -1;

    const preventAction =
      !approvableStatus ||
      data.ApprovalPredecessors ||
      data.ApprovalSubTasks ||
      this.checkUserLevelRequirement(this.availableActions.APPROVE_TASK);

    return !preventAction;
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  focusSavedViewSubMenu() {
    this.inputViewTextBox.focusInputBox();
  }
}
