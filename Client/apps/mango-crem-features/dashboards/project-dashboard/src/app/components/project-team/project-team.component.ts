import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import {
  ComposeEmailCommand,
  CurrentObjectInfo,
  EmailNoteType,
  MemberInfo,
  ProjectTeamMember,
  ProjectsEmailInfo,
  RemoveTeamMembers,
} from '@mango/data-models/lib-data-models';
import { DashboardService } from '@project-dashboard/services/dashboard.service';
import { MangoDialogService } from 'libs/core-shared/src/lib/services/mango-dialog.service';
import { Subscription, combineLatest } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { of } from 'rxjs/internal/observable/of';
import {
  catchError,
  concatMap,
  filter,
  first,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { AddEditMemberComponent } from './add-edit-member/add-edit-member.component';
import { SaveTeamTemplateComponent } from './save-team-template/save-team-template.component';
import dxCheckBox from 'devextreme/ui/check_box';
import { ToastrService } from 'ngx-toastr';
import { ImportTeamComponent } from './import-team/import-team.component';
import { DxDataGridComponent } from 'devextreme-angular';
import {
  ComposeEmailComponent,
  SendEmailCommand,
} from '@mango/ui-shared/lib-ui-shared';
import { trigger } from 'devextreme/events';
import DataGrid from 'devextreme/ui/data_grid';
import { MatMenuTrigger } from '@angular/material/menu';
import { CurrentObjectService } from '@mango/core-shared';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';

@Component({
  selector: 'project-teams',
  templateUrl: './project-team.component.html',
  styleUrls: ['./project-team.component.scss'],
})
export class ProjectTeamComponent implements OnInit, OnDestroy {
  @ViewChild('ProjectTeamGrid') projectTeamGrid: DxDataGridComponent;
  @ViewChild('memberActionsMenuTrigger') actionsMenuTrigger: MatMenuTrigger;

  private selectClass = 'dx-selection';
  dataRetrieved: boolean = false;
  projectTeam: ProjectTeamMember[];
  selectedTeamMembersData: RemoveTeamMembers = <RemoveTeamMembers>{};
  projectId: number;
  managerContactId: number;
  managerSharedValue: boolean;
  memberInfo: MemberInfo = <MemberInfo>{};
  noDataText: string = 'No Data.';
  errorText: string = 'Error Occurred while getting Project Team Members.';
  userAccessLevel: number;
  subs: Subscription[] = [];
  projectsPrivateSetting: number;
  addTempUserSetting: number;
  contactIds: number[] = [];
  projectsEmailInfo: ProjectsEmailInfo = <ProjectsEmailInfo>{};
  defaultNoteType: EmailNoteType = <EmailNoteType>{};
  searchText: string = '';
  autoExpand: boolean = false;
  count: number = 0;
  editBtnTitle: string = `Click to edit details or assign tasks.`;
  projectMemberInfo: string = `This team member is either no longer active or has Allow Log On set to No. 
                                Please consider replacing this team member or updating their User record.`;
  emailNote: string = `By including the unapproved tasks, each user will receive an individual email, 
                              otherwise everyone will be Carbon Copied.`;
  includeFilesText: string = `If File Paths is checked, selected file(s) will be included as path to the 
                              application rather than an attachment(s).`;
  currentObject: Observable<CurrentObjectInfo> = null;
  isComposeEmailOpen: boolean = false;

  constructor(
    private dashboardService: DashboardService,
    private dialog: MatDialog,
    public toastr: ToastrService,
    private route: ActivatedRoute,
    private dialogService: MangoDialogService,
    private currentObjectService: CurrentObjectService
  ) {}

  ngOnInit(): void {
    this.getClientPreferences();

    this.subs.push(
      this.route.queryParams
        .pipe(
          filter((params) => !!params && !!params.oid),
          tap((params) => {
            this.projectId = parseInt(params.oid);
            this.selectedTeamMembersData.projectId = this.projectId;
          }),
          switchMap((params) => this.getProjectTeam(this.projectId)),
          tap((_) => {
            this.getMemberInfo(), this.getProjectContactLevel(this.projectId);
          })
        )
        .subscribe()
    );

    this.currentObject =
      this.currentObjectService.getCurentObjectNameAndType$();
  }

  addOrEditMember(operation, member?) {
    let emailAddressList = this.projectTeam
      .filter(
        (pt) =>
          pt.memberType.toLocaleLowerCase() === 'team member' ||
          pt.memberType.toLocaleLowerCase() === 'temporary user'
      )
      .map((t) => t.email);

    const dialogRef = this.dialog.open(AddEditMemberComponent, {
      width: '60vw',
      minWidth: '420px',
      maxWidth: '1100px',
      minHeight: '420px',
      maxHeight: '90vh',
      panelClass: 'addEditMemberModal',
      data: {
        memberInfo: this.memberInfo,
        projectId: this.projectId,
        operation: operation,
        teamMember: member,
        contactIds: this.contactIds,
        projectsPrivateSetting: this.projectsPrivateSetting,
        emailAddressList,
      },
      disableClose: true,
    });

    this.subs.push(
      dialogRef
        .afterClosed()
        .pipe(
          filter((reload) => !!reload),
          switchMap((_) => this.getProjectTeam(this.projectId))
        )
        .subscribe()
    );
  }

  saveTeamAsTemplate() {
    let dialogRef = this.dialog.open(SaveTeamTemplateComponent, {
      height: '300px',
      width: '600px',
      panelClass: 'saveTeamTemplateModal',
      data: { projectId: this.projectId },
      disableClose: true,
    });

    this.subs.push(dialogRef.afterClosed().subscribe());
  }

  composeEmail(e) {
    if (this.isComposeEmailOpen) return;
    this.isComposeEmailOpen = true;

    this.subs.push(
      this.dashboardService
        .getComposeEmailInfo(this.projectId)
        .subscribe((res: any) => {
          if (res && res.success) {
            this.projectsEmailInfo = res.data;
            let obj = this.projectsEmailInfo.noteTypes.find(
              (noteType) =>
                noteType.commonNoteType.toLocaleLowerCase().trim() == 'email'
            );
            this.defaultNoteType = obj ? obj : this.defaultNoteType;
            let dialogRef = this.dialog.open(ComposeEmailComponent, {
              width: '520px',
              height: '700px',
              panelClass: 'composeEmailModal',
              data: {
                objectId: this.projectId,
                objectTypeId: 1,
                contacts: this.projectsEmailInfo.contacts,
                noteTypes: this.projectsEmailInfo.noteTypes,
                fileItems: this.projectsEmailInfo.fileItems,
                defaultNoteType: this.defaultNoteType,
                inclUnappdTsksSel: true,
                emailNote: this.emailNote,
                includeFileInfo: this.includeFilesText,
                emailSendHandler: this.sendEmail.bind(this),
              },
              disableClose: true,
            });
            this.subs.push(
              dialogRef.afterClosed().subscribe(() => {
                this.isComposeEmailOpen = false;
              })
            );
          } else {
            let message = `Projects Email Info could not be fetched.`;
            this.subs.push(
              this.dialogService
                .alert('Error getting Project Email Info', message, 'OK')
                .subscribe()
            );
          }
        })
    );
  }

  sendEmail(data: ComposeEmailCommand): Observable<any> {
    return this.dashboardService.sendComposedEmail(data);
  }

  onSelectionChanged(e: any) {
    if (e.selectedRowKeys.includes(this.managerContactId)) {
      //remove highlight class for project manager row
      let managerContactIdKey = e.selectedRowKeys.find(
        (contactId) => contactId === this.managerContactId
      );
      let managerContactRowInedex =
        this.projectTeamGrid.instance.getRowIndexByKey(managerContactIdKey);
      let rowElements = this.projectTeamGrid.instance.getRowElement(
        managerContactRowInedex
      );
      rowElements.forEach((element) => {
        if (element.classList.contains(this.selectClass)) {
          element.classList.remove(this.selectClass);
        }
      });

      e.selectedRowKeys = e.selectedRowKeys.filter(
        (contactId) => contactId != this.managerContactId
      );
      e.selectedRowsData = e.selectedRowsData.filter(
        (rowData) => rowData.contactID != this.managerContactId
      );
    }
    this.selectedTeamMembersData.teamMembers = [];
    e.selectedRowsData.forEach((rowData) => {
      let selectedMemberData = {
        commonTeamId: rowData.teamID,
        contactId: rowData.contactID,
      };

      this.selectedTeamMembersData.teamMembers.push(selectedMemberData);
    });
  }

  onCellPrepared(e) {
    if (e.rowType !== 'header' && e.column.command == 'select') {
      let htmlCellElement = e.cellElement;
      htmlCellElement.setAttribute('id', 'ptm-memberId' + e.rowIndex);

      if (this.userAccessLevel == 1 && e.data.isManager) {
        this.managerContactId = e.data.contactID;
        var editor = dxCheckBox.getInstance(
          htmlCellElement.querySelector('.dx-select-checkbox')
        );
        if (editor) {
          editor.option('visible', false);
        }
        htmlCellElement.style.pointerEvents = 'none';
      }
    }
  }

  onRowPrepared(e) {
    //remove highlight class for project manager row
    if (
      e?.rowType !== 'header' &&
      this.userAccessLevel == 1 &&
      e.data?.isManager
    ) {
      e.rowElement.classList.remove(this.selectClass);
    }
  }

  onFocusedCellChanging(e) {
    if (e.newColumnIndex === 0) {
      const previousRow = e.cellElement[0].parentElement.previousSibling;
      if (!previousRow) return;
      if (previousRow.classList.contains('dx-master-detail-row')) {
        e.cancel = true;
        const $detailGrid =
          previousRow.querySelector('.dx-datagrid').parentElement;
        const detailGrid = DataGrid.getInstance($detailGrid) as DataGrid;

        trigger($detailGrid, 'focusout');

        const firstHeaderElement = detailGrid
          .element()
          .querySelector('.dx-header-row td[role="columnheader"]');
        (firstHeaderElement as HTMLElement).focus();
      }
    }
  }

  matMenuButtonKeyDown(e) {
    if (e.key === 'Tab' || (e.key === 'Tab' && e.shiftKey)) {
      if (e.currentTarget.nextElementSibling !== null) {
        e.stopPropagation();
      } else {
        e.preventDefault();
        this.actionsMenuTrigger.closeMenu();
      }
    }
  }

  getEmailNotifyDisplayValue(rowData) {
    return rowData.emailNotifications ? 'On' : 'Off';
  }

  getSharedDisplayValue(rowData) {
    return rowData.shared ? 'On' : 'Off';
  }

  getAccessLevelDisplayValue(rowData) {
    return rowData.accessLevel == 1
      ? 'L1'
      : rowData.accessLevel == 2
      ? 'L2'
      : rowData.accessLevel == 3
      ? 'L3'
      : 'N/A';
  }

  importMembers() {
    let dialogRef = this.dialog.open(ImportTeamComponent, {
      height: '605px',
      width: '900px',
      data: {
        memberInfo: this.memberInfo,
        projectId: this.projectId,
        projectsPrivateSetting: this.projectsPrivateSetting,
      },
      disableClose: true,
    });

    this.subs.push(
      dialogRef
        .afterClosed()
        .pipe(
          filter((res) => !!res),
          switchMap((_) => this.getProjectTeam(this.projectId))
        )
        .subscribe()
    );
  }

  removeContactOrMember(member) {
    this.selectedTeamMembersData.teamMembers = [];
    let selectedMemberData = {
      commonTeamId: member.teamID,
      contactId: member.contactID,
    };

    this.selectedTeamMembersData.teamMembers.push(selectedMemberData);
    this.removeMembers();
  }

  removeMembers() {
    this.subs.push(
      this.dialogService
        .confirm(
          'Remove Member(s)',
          `Do you want to delete the selected contact(s)/member(s) ?`,
          'Confirm',
          'Cancel'
        )
        .pipe(
          filter((confirmed) => !!confirmed),
          tap((_) =>
            this.projectTeamGrid.instance.beginCustomLoading(
              'Removing Member(s)....'
            )
          ),
          switchMap((_) =>
            this.dashboardService.removeTeamMembers(
              this.selectedTeamMembersData
            )
          ),
          tap((_) => this.projectTeamGrid?.instance.endCustomLoading()),
          switchMap((res) =>
            !!res && !!res.success
              ? (this.dashboardService.successNotify(
                  'Contact/Team Member(s) removed from this project.'
                ),
                this.getProjectTeam(this.projectId))
              : this.dialogService.alert(
                  'Team Member Removal',
                  'There was an issue removing selected Team Member(s). Please review and try again later.',
                  'OK'
                )
          )
        )
        .subscribe()
    );
  }

  makeProjectManager(contactId: number) {
    this.subs.push(
      this.dialogService
        .confirm(
          'Make Team Manager',
          `Are you sure you want to update the Team Manager?`,
          'Confirm',
          'Cancel'
        )
        .pipe(
          filter((confirmed) => !!confirmed),
          switchMap((_) =>
            this.dashboardService.saveProjectManager(this.projectId, contactId)
          ),
          switchMap((res) =>
            !!res && !!res.success
              ? this.getProjectTeam(this.projectId)
              : this.dialogService.alert(
                  'Make Team Manager',
                  'We were not able to update Team Manager, please try again later.',
                  'OK'
                )
          )
        )
        .subscribe()
    );
  }

  displayMessage() {
    this.dialogService.alert(
      'Make Team Manager',
      'We were not able to update Team Manager, please try again later.',
      'OK'
    );
  }

  applyTeamToTasks() {
    this.subs.push(
      this.dialogService
        .confirm(
          'Apply Team To Tasks',
          `Are you sure you want to assign team members to tasks based on their roles ?`,
          'Confirm',
          'Cancel'
        )
        .pipe(
          filter((confirmed) => !!confirmed),
          switchMap((_) =>
            this.dashboardService.addContactsToTasksByRole(this.projectId)
          ),
          switchMap((res) =>
            !!res && !!res.success
              ? (this.toastr.info(
                  'Team members have successfully been added to tasks based on their role.',
                  '',
                  {
                    positionClass: 'toast-bottom-right',
                    timeOut: 3000,
                    closeButton: false,
                    progressBar: false,
                  }
                ),
                this.getProjectTeam(this.projectId))
              : this.dialogService.alert(
                  'Apply Team To Tasks',
                  'There was an issue adding Team members to Tasks. Please review and try again later.',
                  'OK'
                )
          )
        )
        .subscribe()
    );
  }

  public getProjectTeam(projectId): Observable<any> {
    this.dataRetrieved = false;
    this.contactIds = [];
    this.selectedTeamMembersData.teamMembers = [];
    return this.dashboardService.getProjectTeams(projectId).pipe(
      tap((res) => {
        if (!res || !res.success) {
          this.noDataText = this.errorText;
          this.dataRetrieved = true;
        }
      }),
      filter((res) => !!res && !!res.success),
      tap((res) => {
        this.projectTeam = res.data;
        this.dataRetrieved = true;
        if (this.projectTeam.length) {
          this.projectTeam.forEach((member) => {
            this.contactIds.push(member.contactID);
            if (member.isManager) {
              this.managerSharedValue = member.shared;
            }
          });
        }
      }),
      catchError((error) => {
        this.dataRetrieved = true;
        return of(false);
      })
    );
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
          this.userAccessLevel = res.data.userLevel;
        },
        (error: any) =>
          console.log('Error occurred getting User Access Level ', error),
        () => {}
      )
    );
  }

  toggleExpand() {
    this.autoExpand = !this.autoExpand;
  }

  clearAllFilters() {
    this.projectTeamGrid.instance.clearFilter();
  }

  searchDataGrid(searchText) {
    this.searchText = searchText;
    this.projectTeamGrid.instance.searchByText(searchText);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  private getClientPreferences() {
    this.subs.push(
      combineLatest([
        this.dashboardService.getClientPreference('ClientProjectsPrivate'),
        this.dashboardService.getClientPreference('ProjectTeamAddTempUser'),
      ]).subscribe(
        ([cpp, atu]) => {
          if (!cpp || !atu) {
            this.dashboardService.displayContactSystemAdminMessage();
          } else if (cpp.success && atu.success) {
            this.projectsPrivateSetting = Number(cpp.data);
            this.addTempUserSetting = Number(atu.data);
          } else {
            this.dashboardService.errorNotify(cpp.clientErrorMessage);
            this.dashboardService.errorNotify(atu.clientErrorMessage);
          }
        },
        (error: any) => {
          console.log(
            'Error occurred getting Projects Client Preferences',
            error
          );
          this.dashboardService.displayContactSystemAdminMessage();
        },
        () => {}
      )
    );
  }
}
