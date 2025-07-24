/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CurrentObjectService, MangoDialogService } from '@mango/core-shared';
import {
  ComposeEmailCommand,
  EmailContact,
  EmailFileItem,
  EmailNoteType,
  ToastState,
} from '@mango/data-models/lib-data-models';
import {
  CremToastService,
  DropdownComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { DxDataGridComponent } from 'devextreme-angular';
import { ToastrService } from 'ngx-toastr';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { catchError, concatMap, first } from 'rxjs/operators';

@Component({
  selector: 'compose-email',
  templateUrl: './compose-email.component.html',
  styleUrls: ['./compose-email.component.scss'],
})
export class ComposeEmailComponent implements OnInit, OnDestroy {
  @ViewChild('NoteTypeDropdown') noteTypeDropdown: DropdownComponent;
  @ViewChild('MembersDropdown') membersDropdown: DropdownComponent;
  @ViewChild('CEMFilesGrid') cemFilesGrid: DxDataGridComponent;

  modalTitle = 'Compose Email';
  emailNote;
  dialogType: string;
  secondaryBtnText = 'Cancel';
  primaryBtnText = 'Send';
  modalId = 'composeEmailModalId';
  objectId: number;
  objectTypeId: number;
  isDropDownBoxOpened = false;
  filteredMembers: string[] = [];
  contacts: EmailContact[] = [];
  fileItems: EmailFileItem[] = [];
  noteTypes: EmailNoteType[] = [];
  selectedNoteType: EmailNoteType;
  selectedToMembers: EmailContact[] = [];
  filePathsChecked = false;
  unapprovedTasksChecked = false;
  emailMessage = '';
  noteTypeValueInvalid = false;
  toMembersValueInvalid = false;
  toMembersValueChanged = false;
  noteTypeValueChanged = false;
  emailSendHandler: (data: ComposeEmailCommand) => Observable<any>;
  includeFileInfo: string;
  subs: Subscription[] = [];
  inclUnappdTsksSel: boolean = false;

  fileIconList = [
    // array of icon class list based on type
    { type: 'pdf', icon: 'faFilePdf' },
    { type: 'csv', icon: 'faFileCsv' },
    { type: 'jpg', icon: 'faFileImage' },
    { type: 'png', icon: 'faFile' },
    { type: 'ppt', icon: 'faFile' },
    { type: 'xlsx', icon: 'faFileExcel' },
    { type: 'txt', icon: 'faFile' },
  ];

  constructor(
    public dialogRef: MatDialogRef<ComposeEmailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toaster: CremToastService,
    private dialogService: MangoDialogService,
    private facade: MangoAppFacade,
    private currentObject: CurrentObjectService
  ) {}

  ngOnDestroy(): void {
    this.subs.forEach((sub) => sub.unsubscribe());
  }

  ngOnInit(): void {
    this.setInitialState();
  }

  setInitialState(): void {
    this.objectId = this.data.objectId;
    this.objectTypeId = this.data.objectTypeId;
    this.noteTypes = this.data.noteTypes;
    this.contacts = this.data.contacts;
    this.fileItems = this.data.fileItems;
    this.selectedNoteType = this.data.defaultNoteType;
    this.inclUnappdTsksSel = this.data.inclUnappdTsksSel
      ? this.data.inclUnappdTsksSel
      : false;
    this.emailSendHandler = this.data.emailSendHandler;
    this.includeFileInfo = this.data.includeFileInfo;
    this.emailNote = this.data.emailNote ? this.data.emailNote : '';
    if (this.fileItems.length) {
      this.fileItems.forEach((fileItem) => {
        fileItem.extension = fileItem.text
          ? fileItem.text.split('.').pop()
          : '';
        fileItem.icon = this.getIconName(fileItem.extension);
      });
    }
  }

  secondaryButtonClicked() {
    this.dialogRef.close(false);
  }

  primaryButtonClicked() {
    this.dialogRef.close(true);
  }

  focusOnDropDownInput(e) {
    this.isDropDownBoxOpened = false;
    setTimeout(function () {
      e.component.focus();
    });
    this.isDropDownBoxOpened = true;
  }

  onEditorPreparing(e) {
    if (e.type == 'selection' && e.parentType == 'dataRow') {
      e.editorOptions.elementAttr = {
        id: 'cem-fileSelections' + e.row.rowIndex,
        title: '',
      };
    }
  }

  noteTypeSelected(e) {
    this.selectedNoteType = e[0];
    this.noteTypeValueInvalid = false;
  }

  memberValueChangedEvent(e) {
    this.toMembersValueChanged = e;
  }

  selectedMembers(e) {
    this.selectedToMembers = e;
    if (this.toMembersValueChanged) {
      this.toMembersValueInvalid = this.selectedToMembers.length ? false : true;
    }
  }

  getIconName(ext: string): string {
    const iconObj = this.fileIconList.find(
      (obj) => obj['type'] == ext.toLowerCase().trim()
    );
    return iconObj ? iconObj['icon'] : 'faFile';
  }

  public closeModal() {
    this.dialogRef.close();
  }

  sendEmail() {
    this.noteTypeValueInvalid = !this.noteTypeDropdown.validate().isValid;
    this.toMembersValueInvalid = !this.membersDropdown.validate().isValid;

    if (this.noteTypeValueInvalid || this.toMembersValueInvalid) {
      if (this.noteTypeValueInvalid) this.noteTypeDropdown.focusDropdown();
      else this.membersDropdown.focusDropdown();
    }

    // when file paths is checked, then file selections are required
    if (
      this.filePathsChecked &&
      this.cemFilesGrid.selectedRowKeys.length == 0
    ) {
      // show error message and return
      this.dialogService.alert(
        'Submission Error',
        'Files are required if Send File Path is selected.',
        'OK'
      );
      return;
    }

    if (this.noteTypeValueInvalid || this.toMembersValueInvalid) {
      return;
    } else {
      this.subs.push(
        this.currentObject
          .getCurentObjectNameAndType$()
          .pipe(first())
          .pipe(
            concatMap(({ objectName }) => {
              return this.emailSendHandler({
                objectId: this.objectId,
                objectTypeId: this.objectTypeId,
                objectName,
                noteTypeId: this.selectedNoteType.commonNoteTypeID,
                ToContactIds: this.membersDropdown.selections,
                body: this.emailMessage,
                sendUnapprovedTasks: this.unapprovedTasksChecked,
                sendFilePath: this.filePathsChecked,
                filePath: this.cemFilesGrid.selectedRowKeys,
              }).pipe(
                first(),
                catchError((error) => {
                  // Handle error and rethrow to propagate to outer subscribe error handler
                  this.subs.push(
                    this.dialogService
                      .alert('Error sending Email', error, 'OK')
                      .subscribe()
                  );
                  return of(null); // or throwError(error) depending on your error handling strategy
                })
              );
            })
          )
          .subscribe(
            (result) => {
              if (result && result.success) {
                this.toaster.show(
                  'Email has been sent',
                  'Success',
                  ToastState.SUCCESS
                );
                this.dialogRef.close();
              } else {
                this.subs.push(
                  this.dialogService
                    .alert(
                      'Error sending Email',
                      'Email could not be sent',
                      'OK'
                    )
                    .subscribe()
                );
              }
            },
            (err) => {
              // Even though inner catchError should handle it, having another safety net
              this.subs.push(
                this.dialogService
                  .alert('Unexpected error occurred', err, 'OK')
                  .subscribe()
              );
            }
          )
      );
    }
  }

  toggleList() {
    this.isDropDownBoxOpened = !this.isDropDownBoxOpened;
  }

  adaAttrToGridTable(e: any) {
    const noDataEl = e.element.getElementsByTagName('tbody');
    noDataEl[0]?.setAttribute('role', 'table');
  }
}

export interface SendEmailCommand {
  noteType: string;
  recipients: string;
  body: string;
  includes: {
    unapprovedTasks: boolean;
    filePaths: boolean;
    selectedFiles: any[];
  };
}
