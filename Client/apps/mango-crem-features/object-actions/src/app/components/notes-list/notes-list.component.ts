import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  SecurityContext,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonNote, ObjectNotes } from '@mango/data-models/lib-data-models';
import { NotesService } from '@reminders-list/shared/services/notes.service';
import {
  DxDataGridComponent,
  DxDataGridModule,
  DxFilterBuilderModule,
} from 'devextreme-angular';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, Subscription } from 'rxjs';
import { switchMap, tap, filter, delay } from 'rxjs/operators';
import {
  PageHeaderComponent,
  SearchComponent,
  ButtonModule,
  CremPopupComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { AddNoteComponent } from 'libs/ui-shared/lib-ui-shared/src/lib/add-note/add-note.component';
import {
  Condition,
  NotesGridColumnsService,
} from '../../shared/services/notes-grid-column-service';
import { Workbook, ValueType } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { saveAs } from 'file-saver-es';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'mango-notes-list',
  standalone: true,
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss'],
  imports: [
    CommonModule,
    DxDataGridModule,
    DxFilterBuilderModule,
    PageHeaderComponent,
    SearchComponent,
    ButtonModule,
    CremPopupComponent,
    MatMenuModule,
    MatIconModule,
  ],
  providers: [DatePipe, NotesService, NotesGridColumnsService],
})
export class NotesListComponent implements OnInit, OnDestroy {
  @ViewChild('NotesGrid') notesGrid: DxDataGridComponent;
  @ViewChild('SearchBox') searchBox: SearchComponent;
  objectId: number;
  objectTypeId: number;
  objectTypeTypeId: number;
  parentObjectId: number;
  parentObjectTypeId: number;
  userHasViewRight: boolean = true;
  userHasAddRight: boolean = false;
  notes: CommonNote[] = [];
  objectName: string;
  objectType: string;
  searchText: string;
  filter: Condition = [];
  gridFilterValue: Condition;
  showFilterBuilderPopUp: boolean = false;
  isVisibleDeleteCommonNotePopUp: boolean;
  commonNoteId: number;
  noteColumns: any[] = [];
  filterFields: any[] = [];
  dragPosition: any = { x: 0, y: 0 };
  subs: Subscription[] = [];
  firstTimeLoad: boolean = false;
  counter: number = 0;

  constructor(
    private notesService: NotesService,
    private notesGridColumnsService: NotesGridColumnsService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.firstTimeLoad = true;
    let params = this.route.snapshot.queryParamMap;
    params.keys.forEach((key) => {
      switch (key.toLowerCase()) {
        case 'otid':
          this.objectTypeId = Number(params.get(key));
          break;
        case 'oid':
          this.objectId = Number(params.get(key));
          break;
        case 'ottid':
          this.objectTypeTypeId = Number(params.get(key));
          break;
        case 'potid':
          this.parentObjectTypeId = Number(params.get(key));
          break;
        case 'poid':
          this.parentObjectId = Number(params.get(key));
          break;
        default:
          break;
      }
    });

    this.subs.push(
      this.getObjectNotes().subscribe((notes) => {
        const objectNotes: ObjectNotes = notes.data;
        this.userHasViewRight = objectNotes.canView;
        this.userHasAddRight = objectNotes.canAdd;
        this.objectName = objectNotes.objectName;
        this.objectType = objectNotes.objectType;
        this.notes = objectNotes.notes;
        this.noteColumns = this.notesGridColumnsService.getNoteGridColumns();
        this.gridFilterValue = this.filter;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe);
  }

  public searchNotes(searchCriteria: string) {
    this.showNotesForSearch();
    this.searchText = searchCriteria;
    this.notesGrid.instance.searchByText(this.searchText);
  }

  public addNote() {
    const dataToAddNote = {
      noteId: 0,
      dragPosition: this.dragPosition,
      objectId: this.objectId,
      objectTypeId: this.objectTypeId,
      includeNoteHistory: false,
    };
    this.addupdateOpenDialog(dataToAddNote);
  }

  public showFilterPopUp() {
    this.showFilterBuilderPopUp = true;
  }

  public reset() {
    this.searchBox.handleClear();
    this.filter = [];
    this.notesGrid.instance.hideColumnChooser();
    this.notesGrid.instance.state(null);
    this.notesGrid.instance.option('paging.pageIndex', '0');
  }

  public openColumnChooser() {
    this.notesGrid.instance.showColumnChooser();
  }

  public showNotesForSearch() {
    let a = document.getElementsByClassName('btn btn-link moreHidespan');
    for (let i = 0; i < a.length; i++) {
      let button = <HTMLButtonElement>a[i];

      if (button.innerHTML === 'More...') {
        button.click();
      }
    }
  }

  public onContentReadyExpandAllNotesDivOnSearch(e) {
    const validSearchText = this.searchText ?? '';
    if (validSearchText != '') {
      let a = document.getElementsByClassName('btn btn-link moreHidespan');
      for (let i = 0; i < a.length; i++) {
        let button = <HTMLButtonElement>a[i];
        button.click();
      }
    }
  }

  public exportExcel(event) {
    const workbook = new Workbook();
    exportDataGrid({
      component: this.notesGrid.instance,
      worksheet: workbook.addWorksheet('Notes List Page'),
    }).then(function () {
      workbook.worksheets[0].columns.forEach((column) => {
        let maxLength = 0;
        column['eachCell']({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value
            ? cell.value.toString().length + 3
            : 10;
          if (cell.type === ValueType.Date) {
            maxLength = 20;
          } else if (columnLength > maxLength) {
            maxLength = columnLength + 3;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength;
      });
      workbook.xlsx.writeBuffer().then(function (buffer: BlobPart) {
        saveAs(
          new Blob([buffer], { type: 'application/octet-stream' }),
          'CoStar_NotesList.xlsx'
        );
      });
    });
  }

  public editNote(e) {
    const note = this.notes.find((x) => x.commonNoteID === e);
    const dataToEditDialog = {
      noteId: note.commonNoteID,
      dragPosition: this.dragPosition,
      objectId: this.objectId,
      objectTypeId: this.objectTypeId,
      commonNoteText: note.note,
      selectedNoteTypeId: note.commonNoteTypeID,
    };
    this.addupdateOpenDialog(dataToEditDialog);
  }

  public adaAttributes(e) {
    setTimeout(() => {
      const spanElements = e.element.querySelectorAll(
        '.dx-header-filter.dx-header-filter-empty'
      );
      if (spanElements) {
        spanElements.forEach((spanElement, index) => {
          const caption = e.component.columnOption(index, 'caption');
          spanElement.setAttribute(
            'aria-label',
            'Show filter options for column ' + caption
          );
          spanElement.setAttribute('role', 'button');
          spanElement.setAttribute('aria-haspopup', 'dialog');
        });
      }
    });
  }

  public adaPaginationAttr(e) {
    if (!e || !e.element) return;
    let buttons;
    if (e.element[0]) buttons = e.element[0].querySelectorAll('.dx-selection');
    else buttons = e.element.querySelectorAll('.dx-selection');

    buttons.forEach((button) => {
      if (!button || !button.hasAttribute('aria-label') || !button.classList)
        return;
      button.setAttribute('aria-current', 'page');

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (!button.classList.contains('dx-selection')) {
            button.removeAttribute('aria-current');
          }
        });
      });
      observer.observe(button, { attributeFilter: ['class'] });
    });
  }

  public adaAttrNoDataGrid(e: any) {
    let noDataEl = e.element.querySelector('.dx-empty');
    let spanChild = null;

    if (noDataEl) {
      spanChild = noDataEl.querySelector('.dx-datagrid-nodata');
    }

    if (!noDataEl || !spanChild) {
      return;
    }

    noDataEl.setAttribute('role', 'row');
    spanChild.setAttribute('role', 'gridcell');
  }

  upperCaseCellText = function (x: string): string {
    return x.toUpperCase();
  };

  highlightSearchText(strToHighlight: string): string {
    const validSearchText = this.searchText ?? '';
    if (validSearchText === '') {
      return strToHighlight;
    }

    let highlightedText: string = '';
    let cellText = this.upperCaseCellText(strToHighlight);
    if (cellText.indexOf(this.searchText.toUpperCase()) > -1) {
      highlightedText = strToHighlight.replace(
        new RegExp(this.searchText, 'gi'),
        function (match) {
          return `<span class="highLightSearchedText">${match}</span>`;
        }
      );
    } else {
      highlightedText = strToHighlight;
    }
    return highlightedText;
  }

  onCellPreparedHighlightText(e) {
    const validSearchText = this.searchText ?? '';
    if (validSearchText === '') {
      return;
    }

    if (e.rowType === 'data' && e.column.dataField === 'note' && e.value) {
      let tempCellText = e.value.toString();
      let highlightedText: string = '';
      highlightedText = this.highlightSearchText(tempCellText);
      const searchDivText = e.cellElement.querySelector(
        '.querySearchDivEle'
      ) as HTMLDivElement;
      searchDivText.innerHTML = highlightedText;
    }
  }

  private showHideMoreLink(str: string): string {
    let newLineIndex: number = -1;
    let returnString: string = '';
    newLineIndex = str.indexOf('\n');
    if ((str.length > 100 || newLineIndex < 100) && newLineIndex > -1) {
      returnString = str.substring(0, newLineIndex);
    } else if (str.length > 100) {
      returnString = str.substring(0, 100);
    } else {
      returnString = str;
    }
    return this.sanitizer.sanitize(SecurityContext.HTML, returnString);
  }

  public toggleNoteButton(
    e: any,
    btn: HTMLButtonElement,
    cellData: any,
    divObj: HTMLDivElement
  ) {
    const btnText: string = btn.textContent;
    let newLineIndex: number = -1;
    newLineIndex = cellData.note.indexOf('\n');
    if (
      (cellData.note.length > 100 || newLineIndex < 100) &&
      newLineIndex > -1
    ) {
      btn.style.display = 'block';
      if (btn.textContent.trim() == 'More...') {
        btn.textContent = 'Hide...';
        divObj.innerHTML = this.highlightSearchText(cellData.note);
      } else {
        btn.textContent = 'More...';
        divObj.innerHTML = this.highlightSearchText(cellData.shortNoteText);
      }
      this.notesGrid?.instance.updateDimensions();
    } else if (btn.textContent.trim() == 'More...') {
      divObj.innerHTML = this.highlightSearchText(cellData.note);
      btn.textContent = 'Hide...';
      btn.style.display = 'block';
    } else {
      btn.textContent = 'More...';
      btn.style.display = 'block';
      divObj.innerHTML = this.highlightSearchText(cellData.shortNoteText);
    }
    this.notesGrid?.instance.updateDimensions();
  }

  private getObjectNotes(): Observable<any> {
    return this.notesService.getObjectNotes(
      this.objectId,
      this.objectTypeId,
      this.objectTypeTypeId,
      this.parentObjectId,
      this.parentObjectTypeId
    );
  }

  private addupdateOpenDialog(dataToAddUpdateDialog: any) {
    let dialogHeight = '700px';
    let dialogWidth = '600px';
    let openDialogRef: MatDialogRef<any, any>;

    openDialogRef = this.dialog.open(AddNoteComponent, {
      height: dialogHeight,
      width: dialogWidth,
      panelClass: 'AddNoteDialog',
      data: dataToAddUpdateDialog,
      disableClose: true,
    });

    this.subs.push(
      openDialogRef
        .afterClosed()
        .pipe(
          filter(
            (changesSaved) =>
              changesSaved.saveSuccessful || changesSaved.deleteSuccessful
          ),
          switchMap((_) => this.getObjectNotes()),
          tap((notes) => {
            this.notes = notes.data.notes;
          })
        )
        .subscribe()
    );
  }
}
