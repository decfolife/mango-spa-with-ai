import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ButtonModule,
  DropdownComponent,
  DropdownModule,
  InputHintComponent,
  InputLabelComponent,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { NotesService } from '@reminders-list/shared/services/notes.service';
import { MangoDialogService } from 'libs/core-shared/src/lib/services/mango-dialog.service';
import { Observable, Subscription, of } from 'rxjs';
import {
  DxButtonModule,
  DxPopupModule,
  DxTextAreaModule,
  DxValidatorComponent,
  DxValidatorModule,
} from 'devextreme-angular';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { DashboardService } from '@project-dashboard/services/dashboard.service';
import { CremToastService } from '@mango/ui-shared/lib-ui-elements';
import { ToastState } from '@mango/data-models/lib-data-models';

@Component({
  selector: 'mango-add-note',
  templateUrl: './add-note.component.html',
  styleUrls: ['./add-note.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DxPopupModule,
    ButtonModule,
    InputLabelComponent,
    DxButtonModule,
    DxValidatorModule,
    DxTextAreaModule,
    DropdownModule,
    ModalModule,
    InputHintComponent,
  ],
  providers: [NotesService],
})
export class AddNoteComponent implements OnInit, OnDestroy {
  @ViewChild('NoteTypeDropdown') cremDropdown: DropdownComponent;
  @ViewChild('NoteBodyValidator', { static: false })
  noteBodyValidator: DxValidatorComponent;

  modalTitle: string; //Change this guy
  modalId: 'addNoteModal';
  subs: Subscription[] = [];
  noteTypesList: any[] = [];
  selectedNoteTypeId: number;
  commonNoteText: string;
  characterCountText: string;
  maxCommonNoteTextLength = 7000;
  newNoteSaved = false;
  noteDeleted = false;
  noteTypeDropdownInValid = false;
  noteBodyTextAreaInValid = false;
  dragPosition: any;
  addNoteResult: any;
  disableSaveBtn = false;
  isInEditMode = false;
  private noteId: number;
  private objectId: number;
  private objectTypeId: number;
  private editNoteNoteTypeid: number;

  constructor(
    private notesService: NotesService,
    private dashboardService: DashboardService,
    private dialogService: MangoDialogService,
    public dialogRef: MatDialogRef<AddNoteComponent>,
    private toastService: CremToastService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.noteId = data.noteId;
    this.dragPosition = data.dragPosition;
    this.objectId = data.objectId;
    this.objectTypeId = data.objectTypeId;
    this.commonNoteText = data?.commonNoteText;
    this.editNoteNoteTypeid = data?.selectedNoteTypeId;
  }

  ngOnInit() {
    this.setTitle();
    this.updateAddNoteResult();
    this.getCommonNoteTypes();
    this.setCharacterCountText();
    if (this.noteId > 0) {
      this.isInEditMode = true;
    }
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  closeModal() {
    this.dialogRef.close(this.addNoteResult);
  }

  onInputEvent(e) {
    this.commonNoteText = e.event.currentTarget.value;
    this.setCharacterCountText();
  }

  setTitle() {
    this.subs.push(
      this.dashboardService
        .getObjectTypeNames([this.objectTypeId])
        .subscribe((result) => {
          this.data.objectTypeName = result?.data?.[0]?.objectTypeName;
          if (this.noteId > 0) {
            this.modalTitle = `Edit ${result?.data?.[0]?.objectTypeName} Note (${this.noteId})`;
          } else {
            this.modalTitle = `Add ${result?.data?.[0]?.objectTypeName} Note`;
          }
        })
    );
  }

  setCharacterCountText() {
    let textLength =
      this.commonNoteText === undefined ? 0 : this.commonNoteText.length;
    this.characterCountText = `${
      this.maxCommonNoteTextLength - textLength
    } characters remaining`;
  }

  saveNote() {
    this.disableSaveBtn = true;
    this.noteTypeDropdownInValid = !this.cremDropdown.validate().isValid;

    let noteBodyValidationResult = this.noteBodyValidator.instance.validate();
    this.noteBodyTextAreaInValid = !noteBodyValidationResult.isValid;

    if (this.noteTypeDropdownInValid || this.noteBodyTextAreaInValid) {
      this.disableSaveBtn = false;
      return;
    }

    this.subs.push(
      this.notesService
        .saveNote(
          this.objectId,
          this.objectTypeId,
          this.noteId ?? 0,
          this.selectedNoteTypeId,
          this.commonNoteText
        )
        .pipe(
          switchMap((saveRes) => {
            let alertClosedOnSuccess: Observable<boolean> = of(false);

            if (!!saveRes && saveRes.success && saveRes.data > 0) {
              this.newNoteSaved = true;
              this.updateAddNoteResult();

              alertClosedOnSuccess = of(true);
              this.toastService.show(
                'Note saved successfully.',
                undefined,
                ToastState.SUCCESS,
                {
                  maxWidth: '360px',
                  duration: 3000,
                }
              );
            } else {
              alertClosedOnSuccess = of(false);
              this.toastService.show(
                'Oops, something went wrong saving your note. Please try again.',
                'Error',
                ToastState.ERROR,
                {
                  maxWidth: '360px',
                  duration: 8000,
                }
              );
            }
            this.disableSaveBtn = false;
            return alertClosedOnSuccess;
          })
        )
        .subscribe((res) => {
          if (!!res && res) {
            this.closeModal();
          }
          this.disableSaveBtn = false;
        })
    );
  }

  onSelectedNoteTypeChanged(e) {
    this.selectedNoteTypeId = e[0].commonNoteTypeID;
  }

  getDragPosition(e) {
    this.dragPosition = e.source.getFreeDragPosition();
    this.updateAddNoteResult();
  }

  private updateAddNoteResult() {
    this.addNoteResult = {
      saveSuccessful: this.newNoteSaved,
      deleteSuccessful: this.noteDeleted,
      newDragPosition: this.dragPosition,
    };
  }

  private getCommonNoteTypes() {
    this.subs.push(
      this.notesService.getCommonNoteTypes().subscribe((res) => {
        if (!!res && res.success) {
          this.noteTypesList = res.data;
          if (this.noteTypesList.length > 0) {
            if (this.noteId > 0) {
              this.selectedNoteTypeId = this.editNoteNoteTypeid;
            } else {
              this.selectedNoteTypeId = this.noteTypesList[0].commonNoteTypeID;
            }
          }
        } else {
          this.dialogService.alert(
            'Get Common Note Types Error',
            'There was an issue with getting the common note types. Please contact the system administrator.',
            'OK'
          );
        }
      })
    );
  }

  public deleteNote(e) {
    this.subs.push(
      this.notesService
        .deleteNotebyId(this.noteId, this.objectId, this.objectTypeId)
        .subscribe((res) => {
          if (!!res && res.success) {
            this.noteDeleted = true;
            this.updateAddNoteResult();
            this.toastService.show(
              'To view the archived note, go to View History.',
              'Note successfully deleted',
              ToastState.SUCCESS,
              {
                maxWidth: '360px',
                duration: 3000,
              }
            );
            this.closeModal();
          }
        })
    );
  }
}
