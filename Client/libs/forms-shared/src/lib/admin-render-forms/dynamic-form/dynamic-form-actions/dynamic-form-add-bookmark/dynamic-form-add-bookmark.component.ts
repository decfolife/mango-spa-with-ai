import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MangoDialogService } from '@mango/core-shared';
import { Subscription, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  ButtonModule,
  CremFormsModule,
  CremToastService,
  DatePickerModule,
  DropdownModule,
  InputComponent,
  LibUiElementsModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { DynamicFormsService } from '@forms/services/dynamic-forms.service';
import { ToastState } from '@mango/data-models/lib-data-models';
import { CheckBoxComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/checkbox';

@Component({
  selector: 'mango-dynamic-form-add-bookmark',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ModalModule,
    DropdownModule,
    LibUiElementsModule,
    InputComponent,
    ReactiveFormsModule,
    CremFormsModule,
    DatePickerModule,
    CheckBoxComponent,
  ],
  templateUrl: './dynamic-form-add-bookmark.component.html',
  styleUrls: ['./dynamic-form-add-bookmark.component.scss'],
})
export class DynamicFormAddBookmarkComponent implements OnInit, OnDestroy {
  constructor(
    public dialogRef: MatDialogRef<DynamicFormAddBookmarkComponent>,
    private dynamicFormsService: DynamicFormsService,
    private toastService: CremToastService,
    private dialogService: MangoDialogService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      formId: number;
      objectId: number;
      objectTypeId: number;
      objectTypeTypeId: number;
      objectName: string;
    }
  ) {}

  private subs = new Subscription();
  saveClicked: boolean = false;

  modalTitle: string;
  disableSaveButton: boolean = true;
  isAddBookmarkLoading: boolean = true;
  changesMade: boolean = false;
  objectName: string;
  bookmarkText: string;
  componentName: string = 'AddBookmark';

  onBookmarkNameChange(e: any) {
    this.changesMade = true;
    this.disableSaveButton = e == null || e == undefined || e == '';
    this.bookmarkText = e;
  }

  addBookmark(bookmarkInfo: any) {
    this.subs.add(
      this.dynamicFormsService.addBookmark(bookmarkInfo).subscribe(
        (res) => {
          if (res && res.success) {
            this.notifySuccessMessage();
            this.dialogRef.close();
          } else {
            this.notifyErrorMessage(
              'There was an issue saving details. Please review and try again.'
            );
          }
        },
        (error: any) => {
          this.notifyErrorMessage(
            'There was an error saving details. Please review and try again.'
          );
          console.error(
            'Error occurred while saving Lease Association: ',
            error
          );
        }
      )
    );
  }

  notifySuccessMessage() {
    this.toastService.show(
      'Bookmarked successfully!',
      'Success',
      ToastState.SUCCESS,
      {
        duration: 3000,
        position: 'bottom right',
        maxWidth: '500px',
      }
    );
  }

  notifyErrorMessage(errorMessage: string) {
    this.toastService.show(errorMessage, 'Error', ToastState.ERROR, {
      position: 'bottom right',
      maxWidth: '350px',
    });
  }

  save() {
    let bookmarkInfo = {
      formID: this.data.formId,
      objectID: this.data.objectId,
      objectTypeID: this.data.objectTypeId,
      objectTypeTypeID: this.data.objectTypeTypeId,
      bookmarkText: this.bookmarkText,
    };
    this.addBookmark(bookmarkInfo);
  }

  close() {
    if (this.changesMade) {
      this.dialogService
        .confirm(
          'Changes Made!',
          'Changes you made have not been saved. Would you like to continue editing or leave ?',
          'Continue',
          'Leave'
        )
        .pipe(
          switchMap((res) => {
            if (!res) {
              this.dialogRef.close('');
            }
            return of();
          })
        )
        .subscribe();
    } else {
      this.dialogRef.close('');
    }
  }

  getId(
    componentName: string,
    uniqueName: string,
    elementType: string,
    componentType?: string
  ) {
    return componentType
      ? `${componentName}-${componentType}-${uniqueName}-${elementType}`
      : `${componentName}-${uniqueName}-${elementType}`;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  ngOnInit(): void {
    this.modalTitle = 'Add a Bookmark';
    this.changesMade = false;
    this.objectName = this.data.objectName;
    this.bookmarkText = this.data.objectName;
    this.isAddBookmarkLoading = false;
    this.disableSaveButton =
      this.objectName == null ||
      this.objectName == undefined ||
      this.objectName == '';
  }
}
