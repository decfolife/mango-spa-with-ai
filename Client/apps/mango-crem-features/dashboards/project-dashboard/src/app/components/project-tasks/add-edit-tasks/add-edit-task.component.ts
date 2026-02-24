/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  AvailableRole,
  ContactRecord,
  MemberInfo,
  ProjectTaskDropdownInfo,
  ProjectTaskInfo,
  CreateProjectTask,
  Predecessor,
  ProjectTaskSettings,
} from '@mango/data-models/lib-data-models';
import {
  DatePickerComponent,
  InputComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { CardsService } from '@project-dashboard/services/cards.service';
import { DashboardService } from '@project-dashboard/services/dashboard.service';
import { MangoDialogService } from 'libs/core-shared/src/lib/services/mango-dialog.service';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { AddEditTaskAssigneesComponent } from '../task-info/task-assignees/add-edit-task-assignees/add-edit-task-assignees.component';
import { filter, switchMap } from 'rxjs/operators';
import {
  EmailApprovalPreference,
  CalculateDatesPreference,
  AutoCalculatePreference,
  AddSubTask,
} from '@project-dashboard/models/enums/add-edit-task.enums';

@Component({
  selector: 'add-edit-task-popup',
  templateUrl: './add-edit-task.component.html',
  styleUrls: ['./add-edit-task.component.scss'],
})
export class AddEditTaskComponent implements OnInit {
  @ViewChild('TaskNameTextBox') taskNameTextBox: InputComponent;
  @ViewChild('TargetStartDatePicker')
  targetStartDatePicker: DatePickerComponent;
  @ViewChild('TargetEndDatePicker') targetEndDatePicker: DatePickerComponent;
  private currentUserInfo$: Observable<ContactRecord>;

  modalTitle = 'Add Task';
  // userDateFormat: string;

  dragPosition: any = { x: 0, y: 0 };
  dateFormat: string = '';
  userAccessLevel: number;
  taskInfoData: ProjectTaskInfo = <ProjectTaskInfo>{};
  modalId: string = 'addEditTasksModal';
  closeButton: boolean = true;
  editTask: boolean = false;
  addSubTask: boolean = false;
  taskNameInvalid: boolean = false;
  taskName: string = '';
  taskRequired: boolean = false;
  taskConcurrent: boolean = false;
  taskShrinkable: boolean = false;
  taskEmailApproval: number = 0;
  taskMilestone: boolean = false;
  taskDaysToStart: number = 0;
  taskDuration: number = 1;
  taskPercentCompletion: number;
  taskAssignedRoles: string[] = [];
  targetStartDate: Date;
  targetEndDate: Date;
  taskWorkFlows: any[] = [];
  selectedWorkFlow: string;
  selectedTaskName: string;
  isUserDatesEU: boolean = true;
  taskDescription: string = '';
  predecessors: string[] = [];
  projectId: number;
  taskId: number;
  taskParentId: number;
  taskStep: number;
  taskSubTasksCount: number;
  taskWorkflowStatusID: number;
  workFlowOttid: number;
  taskWorkflowName: string;
  projectCurrentTasks: ProjectTaskDropdownInfo[];
  availablePredecessors: Predecessor[];
  taskSelectedPredecessors: number[];
  availableRoles: AvailableRole[] = [];
  clientEmailPreference: number = 0;
  reloadProjectsGrid: boolean = false;
  disableBtn: boolean = false;
  assignApproverBtnTitle: string = `Make sure changes are applied/saved before leaving to assign approvers.`;

  memberInfo: MemberInfo = <MemberInfo>{};
  selectedRoles: MemberInfo['roles'] = [];
  subs: Subscription[] = [];

  projectTaskDetails: ProjectTaskInfo = <ProjectTaskInfo>{};
  createOrUpdateProjectTask: CreateProjectTask = <CreateProjectTask>{};
  projectTaskSettings: ProjectTaskSettings = <ProjectTaskSettings>{};
  taskApprovalExempt: boolean = false;
  requiredApprovers: number;
  requiredApproversList: any[] = [];
  taskRequiredApprovals: number = 0;
  taskIndexOrder: number;
  taskNameFieldInvalid = false;
  taskTargetStartDateFieldInvalid = false;
  taskTargetEndDateFieldInvalid = false;
  dialogPassedInRef: MatDialogRef<AddEditTaskAssigneesComponent>;

  readonly MAX_DESC_LEN = 2000;

  onApplyClick = new EventEmitter<number>();

  constructor(
    private dashboardService: DashboardService,
    private cardsService: CardsService,
    private dialogService: MangoDialogService,
    private dialog: MatDialog,
    private facade: MangoAppFacade,
    private cdRef: ChangeDetectorRef,
    public dialogRef: MatDialogRef<AddEditTaskComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    //Custom validators run in their own context.  This line is needed to access variables in this component.
  }

  ngOnInit(): void {
    this.dialogPassedInRef = this.data.addEditDialogRef();
    this.editTask = this.data.editTask;
    if (!this.editTask) this.getClientEmailPreference();
    this.projectId = this.data.projectId;
    this.addSubTask = this.data.addSubTask;
    this.projectTaskSettings = this.data.projectTaskSettings;
    this.taskIndexOrder = this.data.taskIndexOrder;
    this.taskSubTasksCount = this.data.taskSubTasksCount;
    this.projectCurrentTasks = this.data.projectCurrentTasks;
    this.taskStep = this.data.taskStep;
    this.taskParentId = this.data.taskParentId;
    this.workFlowOttid = this.data.workFlowOttid;
    this.userAccessLevel = this.data.userAccessLevel;

    if (!this.editTask) {
      this.availableRoles = Object.assign([], this.data.memberInfo.roles);
      this.getPredessors();
      this.cdRef.detectChanges();
    }

    this.currentUserInfo$ = this.facade.contactRecord$;
    this.subs.push(
      this.currentUserInfo$.subscribe((contact) => {
        this.isUserDatesEU = contact.preferences.contactDatesEU;
        this.dateFormat = this.isUserDatesEU ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
      })
    );

    if (this.addSubTask) {
      this.modalTitle = 'Add Sub Task';
    }

    if (this.editTask) {
      this.taskId = this.data.taskId;
      this.getTaskDetails();
    } else {
      this.requiredApproversList.push({ id: 0, displayValue: 0 });
      this.getWorkflowStatuses();
    }
  }

  populateTaskInfo() {
    this.taskAssignedRoles = [];

    for (let i = 0; i <= this.projectTaskDetails.approvers.length; i++) {
      const exists = this.requiredApproversList.some((item) => item.id === i);
      if (!exists) {
        this.requiredApproversList.push({ id: i, displayValue: i });
      }
    }
    this.taskRequiredApprovals =
      this.projectTaskDetails.taskInfo.requiredApprovers;
    this.taskName = this.projectTaskDetails.taskInfo.projectMilestoneName;
    this.taskStep = this.projectTaskDetails.taskInfo.projectMilestoneStep;
    this.taskIndexOrder = this.projectTaskDetails.taskInfo.indexOrder;
    this.taskSubTasksCount = this.projectTaskDetails.subTasks.length;
    this.selectedTaskName =
      this.projectTaskDetails.taskInfo.projectMilestoneName;
    this.targetStartDate =
      this.projectTaskDetails.taskInfo.projectMilestoneStartDate;
    this.targetEndDate =
      this.projectTaskDetails.taskInfo.projectMilestoneEndDate;
    this.taskDaysToStart =
      this.projectTaskDetails.taskInfo.projectMilestoneDaysToStart;
    this.taskDuration =
      this.projectTaskDetails.taskInfo.projectMilestoneDaysToComplete;
    this.taskMilestone = this.projectTaskDetails.taskInfo.isMileMark;
    this.taskWorkFlows = this.projectTaskDetails.taskInfo.workflows;
    this.taskWorkflowStatusID =
      this.projectTaskDetails.taskInfo.workflowStatusID;
    this.taskWorkflowName = this.projectTaskDetails.taskInfo.workflowName;
    this.taskPercentCompletion =
      this.projectTaskDetails.taskInfo.percentComplete;
    this.taskRequired =
      this.projectTaskDetails.taskInfo.projectMilestoneRequired;
    this.availableRoles = this.projectTaskDetails.taskInfo.availableRoles;
    this.projectTaskDetails.taskInfo.assignedRoles.forEach((role) => {
      this.taskAssignedRoles.push(role.projectMilestoneRole);
    });
    this.taskConcurrent = this.projectTaskDetails.taskInfo.isConcurrent;
    this.taskShrinkable = this.projectTaskDetails.taskInfo.isShrinkable;
    this.taskApprovalExempt =
      this.projectTaskDetails.taskInfo.approvalExempt ?? false;
    this.requiredApprovers =
      this.projectTaskDetails.taskInfo.requiredApprovers ?? 0;
    this.taskDescription = this.projectTaskDetails.taskInfo
      .projectMilestoneDescription
      ? this.projectTaskDetails.taskInfo.projectMilestoneDescription.replace(
          /<br>/g,
          '\n'
        )
      : this.projectTaskDetails.taskInfo.projectMilestoneDescription;
    this.availablePredecessors =
      this.projectTaskDetails.taskInfo.potentialPredecessors;
    this.taskSelectedPredecessors =
      this.projectTaskDetails.taskInfo.existingPredecessors.map(
        (ea) => ea.projectMilestoneID
      );
    this.clientEmailPreference = Number(
      this.projectTaskDetails.taskInfo.useEmailApprovals
    );
  }

  openEditAssinees(task, taskApprovers) {
    const dialogHeight = '800px';
    const dialogWidth = '500px';

    const dialogRef = this.dialog.open(AddEditTaskAssigneesComponent, {
      height: dialogHeight,
      width: dialogWidth,
      panelClass: 'aea-addOrEditAssginees',
      data: {
        taskParentId: this.data.taskParentId,
        taskStep: this.data.taskStep,
        taskIndexOrder: this.data.taskIndexOrder,
        taskSubTasksCount: this.data.taskSubTasksCount,
        selectedTabIndex: 1,
        projectId: this.data.projectId,
        projectCurrentTasks: this.projectCurrentTasks,
        taskId: task.projectMilestoneID,
        taskAssignees: taskApprovers,
        userDateFormat: this.dateFormat,
        dragPosition: this.dragPosition,
        reloadTasksGrid: this.reloadProjectsGrid,
        addEditRef: this.dialogPassedInRef,
      },
      disableClose: true,
    });

    this.subs.push(
      dialogRef
        .afterClosed()
        .pipe(filter((reload) => !!reload))
        .subscribe((reload) => {
          if (reload.saveSuccessful) {
            this.reloadProjectsGrid = true;
            this.getTaskDetails();
          }
        })
    );
  }

  addOrEditAssignees(task) {
    if (this.userAccessLevel && this.userAccessLevel !== 1) {
      return;
    }
    if (task) {
      this.openEditAssinees(task.taskInfo, task.approvers);
    } else {
      this.dialogService.alert(
        'Get Task Approvers',
        'There was an issue  getting task info. Please contact the system administrator.',
        'OK'
      );
      return;
    }
  }

  getPredessors() {
    this.availablePredecessors = [];
    this.projectCurrentTasks.forEach((task) => {
      if (this.taskIndexOrder >= task.indexOrder) {
        const tempPredecessor: Predecessor = {
          projectMilestoneID: task.taskId,
          projectMilestoneName: task.taskName,
          projectMilestoneStepFull: task.taskFullStep,
          projectMilestoneStepFullAndName: `${task.taskFullStep} - ${task.taskName}`,
        };

        const exists = this.availablePredecessors.some(
          (predecessor) =>
            predecessor.projectMilestoneID ===
              tempPredecessor.projectMilestoneID &&
            predecessor.projectMilestoneStepFull ===
              tempPredecessor.projectMilestoneStepFull
        );

        if (!exists) {
          this.availablePredecessors.push(tempPredecessor);
        }
      }
    });
  }

  roleSelection(e) {
    this.taskAssignedRoles = [];
    e.forEach((role) => {
      this.taskAssignedRoles.push(role.role);
    });
  }

  predecessorSelection(e) {
    this.taskSelectedPredecessors = [];
    e.forEach((predecessor) => {
      this.taskSelectedPredecessors.push(predecessor.projectMilestoneID);
    });
  }

  onToggleChanged(e, optionChanged) {
    this[optionChanged] = e.checked;
  }

  onSelectedTaskChanged(e) {
    this.taskId = e[0].taskId;
    this.taskParentId = e[0].taskParentId;
    this.taskStep = e[0].taskStepNumber;
    this.taskIndexOrder = e[0].indexOrder;
    this.taskSubTasksCount = e[0].taskSubTasksCount;
    this.getTaskDetails();
  }

  onTaskNameChanged(e) {
    this.taskName = e;
  }

  onDateChanged(e, optionChanged) {
    this[optionChanged] = e.value;
  }

  onRequiredApprovalNumberChanged(e) {
    this.taskRequiredApprovals = e[0].id;
  }

  onNumberValueChanged(e, option: string) {
    this[option] = e.value;
  }

  onWorkFlowStatusChanged(e) {
    this.taskWorkflowStatusID = e.length ? e[0].workflowStatusID : null;
  }

  validateAndSaveTask(saveOrApply: string): void {
    this.disableBtn = true;

    // Validate required fields
    this.taskNameFieldInvalid = !this.taskNameTextBox.validate();
    this.taskTargetStartDateFieldInvalid =
      !this.targetStartDatePicker.validate();
    this.taskTargetEndDateFieldInvalid = !this.targetEndDatePicker.validate();

    const hasInvalidRequiredFields =
      this.taskNameFieldInvalid ||
      this.taskTargetStartDateFieldInvalid ||
      this.taskTargetEndDateFieldInvalid;

    const isDescriptionTooLong =
      (this.taskDescription?.length ?? 0) > this.MAX_DESC_LEN;

    if (hasInvalidRequiredFields || isDescriptionTooLong) {
      const errorMessages: string[] = [];

      if (hasInvalidRequiredFields) {
        errorMessages.push('You have left at least one required field empty.');
      }

      if (isDescriptionTooLong) {
        errorMessages.push(
          `The task description has exceeded the maximum character limit of ${this.MAX_DESC_LEN}.`
        );
      }

      const bulletedErrors = errorMessages.map((msg) => `• ${msg}`).join('\n');

      this.dialogService.alert(
        'Validation Error(s)',
        `${bulletedErrors}\n\nPlease update and try again.`,
        'OK'
      );

      this.disableBtn = false;
      return;
    }

    this.saveTask(saveOrApply);
  }

  saveTask(saveOrApply) {
    let parentIdToSave = 0;

    if (this.editTask) parentIdToSave = this.taskParentId;
    else if (this.addSubTask) parentIdToSave = this.data.taskId;
    else if (this.taskParentId > 0)
      //if it makes it hear we are adding a task on a sub task
      parentIdToSave = this.taskParentId;

    this.createOrUpdateProjectTask.taskID = this.editTask ? this.taskId : 0;
    this.createOrUpdateProjectTask.projectID = this.projectId;
    this.createOrUpdateProjectTask.parentID = parentIdToSave;
    this.createOrUpdateProjectTask.step = this.addSubTask
      ? 1
      : this.editTask
      ? this.taskStep
      : this.taskStep + 1;
    this.createOrUpdateProjectTask.daysToStart = this.taskDaysToStart;
    this.createOrUpdateProjectTask.calc = this.projectTaskSettings
      .calculateDates
      ? CalculateDatesPreference.Enabled
      : CalculateDatesPreference.Disabled;
    this.createOrUpdateProjectTask.autoCalc = this.projectTaskSettings
      .autoCalculate
      ? AutoCalculatePreference.Enabled
      : AutoCalculatePreference.Disabled;
    this.createOrUpdateProjectTask.isChild = this.addSubTask
      ? AddSubTask.TRUE
      : AddSubTask.FALSE;
    this.createOrUpdateProjectTask.useEmailApprovals = this
      .clientEmailPreference
      ? true
      : false;
    this.createOrUpdateProjectTask.name = this.taskName;
    this.createOrUpdateProjectTask.description =
      this.taskDescription?.trim().length > 0
        ? this.taskDescription.trim()
        : null;
    this.createOrUpdateProjectTask.required = this.taskRequired;
    this.createOrUpdateProjectTask.daysToComplete = this.taskDuration;
    this.createOrUpdateProjectTask.isMileMark = this.taskMilestone;
    this.createOrUpdateProjectTask.isConcurrent = this.taskConcurrent;
    this.createOrUpdateProjectTask.isShrinkable = this.taskShrinkable;
    this.createOrUpdateProjectTask.workflowStatusID = this.taskWorkflowStatusID;
    this.createOrUpdateProjectTask.percentComplete = this.taskPercentCompletion;
    this.createOrUpdateProjectTask.startDate = this.targetStartDate;
    this.createOrUpdateProjectTask.endDate = this.targetEndDate;
    this.createOrUpdateProjectTask.predecessors = Array.from(
      new Set(this.taskSelectedPredecessors)
    );
    this.createOrUpdateProjectTask.roles = this.taskAssignedRoles;
    this.createOrUpdateProjectTask.approvalExempt = this.taskApprovalExempt;
    this.createOrUpdateProjectTask.requiredApprovers =
      this.taskRequiredApprovals;

    this.subs.push(
      this.dashboardService
        .createOrUpdateTask(this.createOrUpdateProjectTask)
        .subscribe(
          (res: any) => {
            this.disableBtn = false;
            if (res && res.success) {
              if (saveOrApply == 'save') {
                this.reloadProjectsGrid = true;
                this.closeModal();
              } else {
                if (this.editTask) {
                  this.reloadProjectsGrid = true;
                  this.getTaskDetails();
                } else {
                  this.taskId = res.data;
                  this.getTaskDetails();
                  this.onApplyClick.emit(res.data);
                }
              }
            } else {
              this.subs.push(
                this.dialogService
                  .alert(
                    'Create or Update Project Task',
                    'Error Creating or Updating Project Task. Please review and try again later',
                    'OK'
                  )
                  .subscribe()
              );
            }
          },
          (error: any) =>
            console.log(
              'Error occurred Creating or Updating Project Task ',
              error
            ),
          () => {}
        )
    );
  }

  closeModal() {
    this.dialogRef.close(this.reloadProjectsGrid);
  }

  getTaskDetails() {
    this.subs.push(
      this.dashboardService
        .getTaskDetails(this.projectId, this.taskId)
        .subscribe((res: any) => {
          if (res && res.success) {
            this.projectTaskDetails = res.data;
            if (this.editTask) {
              this.populateTaskInfo();
              this.cdRef.detectChanges();
            }
          } else {
            console.log('Error occurred getting Task Details Data');
          }
        })
    );
  }

  changeToEditPopup(
    taskId: number,
    projectCurrentTasks: ProjectTaskDropdownInfo[]
  ) {
    //Change to edit task popup
    this.projectCurrentTasks = projectCurrentTasks;
    this.taskId = taskId;
    this.editTask = true;
    this.addSubTask = false;
    this.taskParentId = this.data.taskParentId;
  }

  private getClientEmailPreference() {
    this.subs.push(
      this.dashboardService
        .getClientPreference('ClientProjectEmailOn')
        .subscribe(
          (res: any) => {
            if (res.success) {
              this.clientEmailPreference = Number(res.data);
            }
          },
          (error: any) =>
            console.log(
              'Error occurred getting Projects Private Setting',
              error
            ),
          () => {}
        )
    );
  }

  private getWorkflowStatuses() {
    this.subs.push(
      this.dashboardService.getWorkflowStatuses(this.workFlowOttid).subscribe(
        (res: any) => {
          if (res.success) {
            this.taskWorkFlows = res.data;
          }
        },
        (error: any) =>
          console.log('Error occurred getting the Workflow Statuses', error),
        () => {}
      )
    );
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
