import { AccountingSummaryService } from '@accounting-summary/services/accounting-summary.service';
import { AccountingToastService } from '@accounting-summary/services/accounting-toast.service';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { Subscription, of } from 'rxjs';
import { concatMap, filter } from 'rxjs/operators';

@Component({
  selector: 'mango-workflow-dropdown',
  templateUrl: './workflow-dropdown.component.html',
  styleUrls: ['./workflow-dropdown.component.scss'],
})
export class WorkflowDropdownComponent {
  @Input() leaseIsLocked: boolean;
  @Input() leaseIsArchived: boolean;
  @Input() rightsInfo: any;
  @Input() workflowStatusInfo: any;
  @Input() modifiedById: number;
  @Output() workflowStatusSavedEvent: EventEmitter<boolean> =
    new EventEmitter();

  componentName = 'workflow-component';
  isWorkflowDropdownVisible = false;
  dropdownDataSource: any[];
  dropdownStatusValue: number;
  inputStatusText = '';
  isCommentsEnabled: boolean;
  isCommentsRequired: boolean;
  commentsVisible = false;
  private subscription = new Subscription();
  private workflowSettings: any;
  private originalOptionsList: any[];
  private stopOnValueChangedExecution = false;
  private savedEventData: any;
  private userId: any;
  commentText = '';
  @ViewChild('commentTextArea') commentTextArea: ElementRef;
  @ViewChild('containerDiv') containerDiv: ElementRef;
  divOpened = false;
  divElement: any;
  private initialMouseDownTarget: HTMLElement;

  constructor(
    protected facade: MangoAppFacade,
    public accountingSummaryService: AccountingSummaryService,
    private accountingToastService: AccountingToastService
  ) {
    if (this.facade) {
      this.subscription.add(
        this.facade.contactRecord$
          .pipe(filter((contactRecord) => !!contactRecord))
          .subscribe((contactRecord) => {
            this.userId = contactRecord.contactID;
          })
      );
      document.addEventListener('click', this.onDocumentClick.bind(this));
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes.rightsInfo && changes.rightsInfo.currentValue !== undefined) {
      this.isWorkflowDropdownVisible = this.rightsInfo.userHasEditLeaseRights;
    }

    if (
      !!changes.modifiedById &&
      changes.modifiedById.currentValue !== undefined &&
      this.originalOptionsList !== undefined &&
      changes.modifiedById.previousValue !== changes.modifiedById.currentValue
    ) {
      this.dropdownDataSource = this.generateDataSourceArray();
    }

    if (
      !!changes.workflowStatusInfo &&
      changes.workflowStatusInfo.currentValue !== undefined
    ) {
      //make sure these are set before calling generateDataSourceArray
      this.inputStatusText = this.workflowStatusInfo.workflowStatus;
      this.dropdownStatusValue = this.workflowStatusInfo.workflowStatusID;
      this.workflowSettings = this.workflowStatusInfo.settings;
      this.isCommentsEnabled =
        this.workflowStatusInfo.settings.isCommentsEnabled;
      this.isCommentsRequired =
        this.workflowStatusInfo.settings.isCommentsRequired;
      this.workflowStatusInfo.name = this.workflowStatusInfo.workflowStatus;

      this.dropdownDataSource = [];
      if (this.workflowStatusInfo.options.length > 0) {
        this.originalOptionsList = this.workflowStatusInfo.options;
        this.dropdownDataSource = this.generateDataSourceArray();
      }
    }
  }

  onValueChanged(event: any) {
    //This is to stop the loop that is created when we switch the value of the dropdown back
    //to the original value.
    if (this.stopOnValueChangedExecution) {
      this.stopOnValueChangedExecution = false;
      return;
    }

    if (
      event.previousValue !== undefined &&
      event.previousValue !== event.value
    ) {
      this.savedEventData = event;
      if (!this.isCommentsEnabled) {
        this.saveWorkflowStatus(event.value, this.commentText);
      } else {
        this.commentsVisible = true;
      }
    }
  }

  saveWorkFlowComment() {
    if (this.isCommentsRequired && this.commentText === '') {
      this.accountingToastService.errorNotify(
        'A comment is required to save the workflow status'
      );
      this.commentTextArea.nativeElement.focus();
      return;
    }

    if (this.savedEventData) {
      const { value } = this.savedEventData;
      this.saveWorkflowStatus(value, this.commentText);
      this.commentText = '';
    }
    this.commentsVisible = false;
  }

  saveWorkflowStatus(workflowStatusId: number, comment: string) {
    this.subscription.add(
      this.accountingSummaryService
        .updateWorkflowStatus(workflowStatusId, comment)
        .pipe(
          concatMap((response: any) => {
            if (response === null) {
              this.accountingToastService.displayContactSystemAdminMessage();
              return of(false);
            } else if (response.success) {
              this.accountingToastService.successNotify(
                'Workflow status saved successfully.'
              );
              return of(true);
            } else {
              this.accountingToastService.errorNotify(
                response.clientErrorMessage
              );
              return of(false);
            }
          })
        )
        .subscribe((saveSuccessful: boolean) => {
          if (saveSuccessful) {
            this.dropdownDataSource = this.generateDataSourceArray();
          } else {
            this.setDropdownToPreviousValue();
          }

          this.workflowStatusSavedEvent.emit(saveSuccessful);
        })
    );
  }

  private setDropdownToPreviousValue() {
    this.stopOnValueChangedExecution = true;
    this.savedEventData.component.option(
      'value',
      this.savedEventData.previousValue
    );
  }

  private generateDataSourceArray(): any[] {
    let nextStatusOrderNumberAfterSelectedStatus: number = null;
    const options = this.originalOptionsList;
    const selectedStatusOrderNumber = options.find(
      (op) => op.workflowStatusId === this.dropdownStatusValue
    ).statusOrder;

    const dataSourceArray = options.map((opt) => {
      let itemDisabled = false;
      let itemDisabledReason: string = null;

      if (
        nextStatusOrderNumberAfterSelectedStatus === null &&
        opt.statusOrder > selectedStatusOrderNumber
      ) {
        nextStatusOrderNumberAfterSelectedStatus = opt.statusOrder;
      }

      if (this.leaseIsLocked) {
        itemDisabled = true;
        itemDisabledReason =
          'The workflow status cannot be modified when the lease is locked.';
      } else if (this.leaseIsArchived) {
        itemDisabled = true;
        itemDisabledReason =
          'The workflow status cannot be modified when the lease is archived.';
      } else if (!opt.allUsersHaveRights && !opt.userHasEditRights) {
        itemDisabled = true;
        itemDisabledReason = 'You do not have rights to this status.';
      } else if (
        this.workflowSettings.isIncrementOneLevelEnforced &&
        nextStatusOrderNumberAfterSelectedStatus !== null &&
        opt.statusOrder > nextStatusOrderNumberAfterSelectedStatus
      ) {
        itemDisabled = true;
        itemDisabledReason = 'You can only increment one status at a time.';
      } else if (
        !this.workflowSettings.isApproveOwnChangesEnabled &&
        opt.isApprovedStatus &&
        this.modifiedById === this.userId
      ) {
        itemDisabled = true;
        itemDisabledReason = 'You cannot approve your own changes.';
      }

      const dataElement = {
        workflowStatusId: opt.workflowStatusId,
        workflowStatus: opt.workflowStatus,
        statusOrder: opt.statusOrder,
        disabled: itemDisabled,
        disabledReason: itemDisabledReason,
        name: opt.workflowStatus,
      };

      return dataElement;
    });

    return dataSourceArray;
  }

  cancelChanges() {
    this.commentsVisible = false;
    this.divOpened = false;
    this.commentText = '';
    this.setDropdownToPreviousValue();
  }

  onDocumentClick(event: MouseEvent) {
    if (
      this.initialMouseDownTarget &&
      this.initialMouseDownTarget.id === 'workflow-component-comment-popup'
    ) {
      this.initialMouseDownTarget = null; // Reset the initialMouseDownTarget
      return;
    }
    if (
      !this.containerDiv?.nativeElement.contains(event.target) &&
      this.divOpened &&
      this.commentsVisible
    ) {
      // // Clicked outside the div, hide it
      this.divElement.remove();
      this.divOpened = false;
      this.cancelChanges();
    }
    this.divElement = document.getElementById(
      'workflow-component-comment-popup'
    );
    if (this.divElement) {
      this.divOpened = true;
      this.commentTextArea?.nativeElement.focus();
    }
  }

  @HostListener('document:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    // Store the initial target element of the mousedown event
    this.initialMouseDownTarget = event.target as HTMLElement;
  }
}
