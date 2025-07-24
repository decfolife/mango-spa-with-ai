import {
  MatChipSelectionChange,
  MatChipsModule,
} from '@angular/material/chips';
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReportsService } from '@reports/services/reports.service';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import {
  ButtonModule,
  CremFormsModule,
  DynamicFormModule,
  IconModule,
  InputComponent,
  LoaderModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { VerticalStepperModule } from 'libs/ui-shared/lib-ui-elements/src/lib/vertical-stepper/vertical-stepper.module';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReportTag, ReportTagOption } from '@reports/models/report-tag';
import { VALIDATION_ERROR } from '@mango/data-models/lib-data-models';
import { debounceTime, switchMap } from 'rxjs/operators';

@Component({
  selector: 'assign-tags-modal',
  templateUrl: './assign-tags.component.html',
  styleUrls: ['./assign-tags.component.scss'],
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
export class AssignTagsComponent implements OnInit, OnDestroy {
  reportTags: ReportTag[] = [];
  reportTagOptions: ReportTagOption[] = [];
  selectedTags: ReportTagOption[] = [];
  removedTags: ReportTagOption[] = [];
  public modalTitle: string;
  public isLoading = true;
  userMsg: string = '';
  hasSavedChanges = false;

  subs: Subscription[] = [];

  @ViewChild('TagName') tagNameTextBox: InputComponent;
  searchField = new UntypedFormControl();

  constructor(
    public dialogRef: MatDialogRef<AssignTagsComponent>,
    private reportsService: ReportsService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      reportId: number;
      reportType: string;
      reportAssignedTags: ReportTag[];
    }
  ) {}

  ngOnInit() {
    this.initSearchField();
    this.getReportTagsForUser();
  }

  initSearchField() {
    this.subs.push(
      this.searchField.valueChanges
        .pipe(
          debounceTime(250),
          switchMap((input) => {
            if (input) {
              var data = this.reportTags.filter((x) =>
                x.reportTag.toLowerCase().includes(input.toLowerCase())
              );
              return of(data);
            }

            return of(this.reportTags);
          })
        )
        .subscribe(
          (res) => {
            this.reportTagOptions = this.buildTagOptions(res);
          },
          (error) =>
            console.error(
              'Error occurred while subscribing to typeahead data: ',
              error
            )
        )
    );
  }

  getReportTagsForUser() {
    this.userMsg = '';
    this.reportTags = [];
    this.reportTagOptions = [];
    this.isLoading = true;

    this.subs.push(
      this.reportsService.getReportTagsByUser().subscribe(
        (res: any) => {
          if (res?.success) {
            this.reportTags = res.data;
            this.reportTagOptions = this.buildTagOptions(res.data);
          } else {
            this.userMsg = `There was an issue getting report tags. Please contact the system administrator.`;
          }

          this.isLoading = false;
        },
        (error: any) => {
          this.isLoading = false;
          this.userMsg = `There was an issue getting report tags. Please contact the system administrator.`;
        }
      )
    );
  }

  buildTagOptions(tags: ReportTag[]): ReportTagOption[] {
    let options = [];

    for (var tag of tags) {
      let assignedTag = this.data.reportAssignedTags.find(
        (x) => x.reportTag === tag.reportTag
      );
      let opt: ReportTagOption = {
        reportTagID: tag.reportTagID,
        reportTag: tag.reportTag,
        assigned: assignedTag ? true : false,
      };
      options.push(opt);
    }

    return options;
  }

  onSelectionChange(event: MatChipSelectionChange, tag: ReportTagOption) {
    if (!event.isUserInput) return;

    const isSelected = event.selected;

    // For selections/unselections related to the source data
    let assignedTag = this.data.reportAssignedTags.find(
      (x) => x.reportTag === tag.reportTag
    );
    if (assignedTag) {
      if (isSelected) {
        this.removedTags = this.removedTags.filter(
          (x) => x.reportTagID !== tag.reportTagID
        );
      } else {
        this.removedTags.push(tag);
      }

      return;
    }

    if (isSelected) {
      this.selectedTags.push(tag);
    } else {
      this.selectedTags = this.selectedTags.filter(
        (x) => x.reportTagID !== tag.reportTagID
      );
    }
  }

  save() {
    this.userMsg = '';

    if (this.removedTags.length === 0 && this.selectedTags.length === 0) {
      this.userMsg = 'No updates have been made.';
      return;
    }

    this.isLoading = true;

    let assignTags$: Observable<any> = of(null);
    let unAssignTags$: Observable<any> = of(null);

    if (this.removedTags.length > 0) {
      unAssignTags$ = this.reportsService.unAssignReportTags(
        this.data.reportId,
        this.removedTags.map((x) => x.reportTagID)
      );
    }

    if (this.selectedTags.length > 0) {
      assignTags$ = this.reportsService.assignReportTags(
        this.data.reportId,
        this.data.reportType,
        this.selectedTags
      );
    }

    forkJoin({
      unAssignTags: unAssignTags$,
      assignTags: assignTags$,
    }).subscribe((result: any) => {
      this.isLoading = false;
      let error: string = '';

      let hasChanges =
        result.unAssignTags?.success || result.assignTags?.success;
      this.hasSavedChanges = hasChanges ? true : false;

      if (result.unAssignTags && !result.unAssignTags.success) {
        error = 'There was an issue unassigning the report tag.';
      }
      if (result.assignTags && !result.assignTags.success) {
        error += ' There was an issue assigning the report tag.';
      }

      if (error) {
        error += ' Please contact the system administrator.';
        this.userMsg = error;
      }

      if (!error) {
        this.close();
      }
    });
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  public close() {
    this.dialogRef.close({
      hasSavedChanges: this.hasSavedChanges,
    });
  }
}
