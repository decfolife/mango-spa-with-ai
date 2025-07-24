import { MatChipEditedEvent, MatChipsModule } from '@angular/material/chips';
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReportsService } from '@reports/services/reports.service';
import { Subscription } from 'rxjs';
import {
  ButtonModule,
  CremFormsModule,
  DynamicFormModule,
  IconModule,
  InputComponent,
  LoaderModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { VerticalStepperModule } from 'libs/ui-shared/lib-ui-elements/src/lib/vertical-stepper/vertical-stepper.module';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReportTag } from '@reports/models/report-tag';
import { VALIDATION_ERROR } from '@mango/data-models/lib-data-models';

@Component({
  selector: 'manage-tags-modal',
  templateUrl: './manage-tags.component.html',
  styleUrls: ['./manage-tags.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatChipsModule,
    ButtonModule,
    ModalModule,
    IconModule,
    LoaderModule,
    VerticalStepperModule,
    DynamicFormModule,
    InputComponent,
    CremFormsModule,
    MatIconModule,
  ],
})
export class ManageTagsComponent implements OnInit, OnDestroy {
  reportTags: ReportTag[] = [];
  public modalTitle: string;
  public isLoading = true;
  userMsg: string = '';

  subs: Subscription[] = [];

  @ViewChild('TagName') tagNameTextBox: InputComponent;
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ManageTagsComponent>,
    private reportsService: ReportsService,
    @Inject(MAT_DIALOG_DATA)
    public data: {}
  ) {}

  ngOnInit() {
    this.setupAddTagForm();
    this.getReportTags();
  }

  setupAddTagForm() {
    this.form = new FormGroup({
      tagName: new FormControl('', [Validators.required]),
    });
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  async getReportTags() {
    this.userMsg = '';
    this.reportTags = [];
    this.isLoading = true;

    this.subs.push(
      this.reportsService.getAllReportTags().subscribe(
        (res: any) => {
          if (res.success) {
            this.reportTags = res.data;
          } else {
            this.userMsg = `There was an issue getting report tags. Please contact the system administrator.`;
          }

          this.isLoading = false;
        },
        (error: any) => {
          this.isLoading = false;
          this.userMsg = `There was an issue getting report tags. Please contact the system administrator.`;
        },
        () => {}
      )
    );
  }

  addTag() {
    this.userMsg = '';

    if (!this.form.valid) {
      this.userMsg = VALIDATION_ERROR;
      return;
    }

    this.isLoading = true;
    var tagName = this.form.get('tagName').value;

    this.subs.push(
      this.reportsService.addReportTag(tagName).subscribe(
        (res: any) => {
          this.isLoading = false;

          if (!res?.success) {
            this.userMsg = `There was an issue creating new report tag. Please contact the system administrator.`;
            return;
          }

          this.getReportTags();
        },
        (error: any) => {
          this.isLoading = false;
          this.userMsg = `There was an issue creating new report tag. Please contact the system administrator.`;
        }
      )
    );
  }

  edit(tag: ReportTag, event: MatChipEditedEvent) {
    const value = event.value.trim();
    const index = this.reportTags.indexOf(tag);

    if (this.reportTags[index].reportTag.trim() === value) {
      // nothing changed
      return;
    }

    // Remove tag if it no longer has a name
    if (!value) {
      this.removeTag(tag);
      return;
    }

    this.userMsg = '';
    this.isLoading = true;

    this.subs.push(
      this.reportsService.editReportTag(tag.reportTagID, value).subscribe(
        (res: any) => {
          this.isLoading = false;

          if (!res?.success) {
            this.userMsg = `There was an issue updating the report tag. Please contact the system administrator.`;
            return;
          }

          this.reportTags[index].reportTag = value;
        },
        (error: any) => {
          this.isLoading = false;
          this.userMsg = `There was an issue updating the report tag. Please contact the system administrator.`;
        }
      )
    );
  }

  removeTag(tag: ReportTag): void {
    this.userMsg = '';
    this.isLoading = true;

    this.subs.push(
      this.reportsService.removeReportTag(tag.reportTagID).subscribe(
        (res: any) => {
          this.isLoading = false;

          if (!res?.success) {
            this.userMsg = `There was an issue deleting the report tag. Please contact the system administrator.`;
            return;
          }

          this.reportTags = this.reportTags.filter(
            (x) => x.reportTagID !== tag.reportTagID
          );
        },
        (error: any) => {
          this.isLoading = false;
          this.userMsg = `There was an issue deleting the report tag. Please contact the system administrator.`;
        }
      )
    );
  }

  public closeModal() {
    this.dialogRef.close('');
  }
}
