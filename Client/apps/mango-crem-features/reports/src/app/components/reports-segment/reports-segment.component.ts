import { Component, OnInit, ViewChild } from '@angular/core';
import { ReportsService } from '../../services/reports.service';
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { CreateSegmentComponent } from '../modal/create-segment/create-segment.component';
import { SearchComponent } from '@mango/ui-shared/cosmos';
import notify from 'devextreme/ui/notify';
import { LargeModal } from '@mangoSpa/src/assets/enum/modal.model';
import { Workbook, ValueType } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { saveAs } from 'file-saver-es';

@Component({
  selector: 'reports-segment',
  templateUrl: './reports-segment.component.html',
  styleUrls: ['./reports-segment.component.scss'],
})
export class ReportsSegmentComponent implements OnInit {
  public showFavorites: boolean = false;
  public searchText: string = '';
  public segmentData: any = [];
  public segmentFilteredData: any = [];
  public columns: any = [];
  public dateFormat: string = 'MM/dd/yyyy HH:mm:ss';
  public loading: boolean = true;
  public hasSegmentsAddRight: boolean = false;
  public hasSegmentsViewRight: boolean = false;
  public hasSegmentDeleteRight: boolean = false;
  public showActiveSegments: boolean = true;
  public showArchivedSegments: boolean = false;
  public showAllSegments: boolean = false;
  public currentDataFilter: string = 'Active';
  public segmentsToggleTooltipVisible: boolean = false;
  public segmentToggleTooltipText: string = 'Showing only active segments';

  @ViewChild('SegmentsDataGrid') segmentDataGrid: DxDataGridComponent;
  @ViewChild('SearchBox') searchBox: SearchComponent;

  /**
   * Define the Module IDs names to be used to check permissions
   */
  private readonly MODULE_IDS: Array<number> = [
    195, // Segments
  ];

  segmentModuleRights:
    | 'Restricted View'
    | 'View'
    | 'Add'
    | 'Edit'
    | 'Delete'
    | 'Block' = 'View';

  constructor(
    private reportsService: ReportsService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.reportsService.getUserPreferences().subscribe((result) => {
      if (result?.data?.isDatesEU) {
        this.dateFormat = 'dd.MM.yyyy HH:mm:ss';
      }
      this.getSegments();
      this.setSegmentColumns();
    });

    // Get Module Rights
    this.reportsService
      .getUserMaxModuleRights(this.MODULE_IDS)
      .subscribe((result) => {
        if (result.data) {
          const indexSegment: number = result.data.findIndex(
            (e) => e.moduleDesc === 'Segments'
          );
          this.segmentModuleRights =
            indexSegment >= 0
              ? result.data[indexSegment].maxSecurityType
              : 'View';
        }
      });

    this.reportsService.getSegmentsRights(0, 2).subscribe((result) => {
      if (result.data) {
        this.hasSegmentDeleteRight = result.data.securityTypeID >= 5;
        this.hasSegmentsAddRight = result.data.securityTypeID >= 3;
        this.hasSegmentsViewRight = result.data.securityTypeID >= 2;
      }
    });
  }

  public onCellClicked(item): void {
    if (item?.data?.activeRecordsVisibleToMe === true) return;

    if (item?.column === undefined) return;

    if (item?.column?.caption !== 'Actions' && item !== undefined) {
      this.edit(item);
    }
  }

  onCellPrepared(item: any): void {
    if (item?.data?.activeRecordsVisibleToMe === true) {
      item.cellElement.title =
        'This segment is automatically generated and includes all records accessible to you.';
    }
  }

  public setSegmentColumns() {
    this.columns = [
      { dataField: 'name', dataType: 'string', caption: 'Segment Name' },
      {
        dataField: 'segmentID',
        alignment: 'left',
        dataType: 'number',
        caption: 'Segment ID',
      },
      {
        dataField: 'criteriaSetName',
        dataType: 'string',
        caption: 'Criteria Set',
      },
      {
        dataField: 'criteriaSetID',
        dataType: 'number',
        alignment: 'left',
        caption: 'Criteria Set ID',
        visible: false,
      },
      { dataField: 'shared', caption: 'Shared', dataType: 'string' },
      {
        dataField: 'created',
        caption: 'Created',
        dataType: 'date',
        format: this.dateFormat,
      },
      { dataField: 'createdBy', caption: 'Created By', dataType: 'string' },
      {
        dataField: 'lastModified',
        caption: 'Modified',
        dataType: 'date',
        format: this.dateFormat,
      },
      {
        dataField: 'lastModifiedBy',
        caption: 'Modified By',
        dataType: 'string',
      },
      { dataField: 'rights', caption: 'Rights ', dataType: 'string' },
    ];
  }

  public segmentsToggleChanged(event) {
    this.currentDataFilter = event.value;
    switch (event.value) {
      case 'Active':
        this.segmentToggleTooltipText = 'Showing only active segments';
        break;
      case 'Archived':
        this.segmentToggleTooltipText = 'Showing only archived segments';
        break;
      case 'All':
        this.segmentToggleTooltipText =
          'Showing both active and archived segments';
        break;
      default:
        break;
    }
    this.filterData();
  }

  public resetFilter(e) {
    e.stopPropagation();
    this.segmentDataGrid.instance.clearFilter();
    this.segmentDataGrid.instance.clearSorting();
    this.searchText = '';
    this.searchBox.handleClear();
  }

  public openColumnChooser() {
    this.segmentDataGrid.instance.showColumnChooser();
  }

  public edit(data) {
    if (this.hasSegmentsAddRight || this.hasSegmentsViewRight) {
      const dialogRef = this.dialog.open(CreateSegmentComponent, {
        height: LargeModal.Height,
        width: LargeModal.Width,
        maxWidth: LargeModal.MaxWidth,
        maxHeight: LargeModal.MaxHeight,
        disableClose: true,
        data: {
          segmentModuleRights: this.segmentModuleRights,
          openReportAction: 'edit',
          segmentID: data.data.segmentID,
          criteriaSetID: data.data.criteriaSetID,
          portfolioID: data.data.portfolioID,
          name: data.data.name,
          archived: !data.data.active,
          hideToastsOn: 'Accounting Workflow and Alerts',
        },
      });

      dialogRef.afterClosed().subscribe((data) => {
        if (data === 'refresh') {
          this.getSegments();
        } else if (data) {
          this.redirectDialog(data);
        }
      });
    }
  }

  public copy(data) {
    const dialogRef = this.dialog.open(CreateSegmentComponent, {
      height: LargeModal.Height,
      width: LargeModal.Width,
      maxWidth: LargeModal.MaxWidth,
      maxHeight: LargeModal.MaxHeight,
      disableClose: true,
      data: {
        segmentModuleRights: this.segmentModuleRights,
        segmentID: data.data.segmentID,
        criteriaSetID: data.data.criteriaSetID,
        portfolioID: data.data.portfolioID,
        redirectData: {
          source: 'editsegment',
          segmentName: data.data.name,
        },
        openReportAction: 'copy',
        archived: !data.data.active,
      },
    });
    dialogRef.afterClosed().subscribe((data) => {
      if (data === 'refresh') {
        this.getSegments();
      } else if (data) {
        this.redirectDialog(data);
      }
    });
  }

  public archiveAction(data) {
    this.loading = true;
    let request = { SegmentID: data.data.segmentID };
    if (data.data.active) {
      this.reportsService.archiveSegment(request).subscribe((result) => {
        if (result) {
          this.getSegments();
          notify({
            message: 'Segment archived successfully.',
            type: 'success',
            displayTime: 5000,
            position: {
              my: 'bottom right',
              at: 'bottom right',
              offset: '-16 -16',
            },
            maxWidth: '500px',
            closeOnClick: true,
          });
        } else {
          //error
          this.loading = false;
        }
      });
    } else {
      this.reportsService.unarchiveSegment(request).subscribe((result) => {
        if (result) {
          this.getSegments();
          notify({
            message: 'Segment unarchived successfully.',
            type: 'success',
            displayTime: 5000,
            position: {
              my: 'bottom right',
              at: 'bottom right',
              offset: '-16 -16',
            },
            maxWidth: '500px',
            closeOnClick: true,
          });
        } else {
          //error
          this.loading = false;
        }
      });
    }
  }

  public redirectDialog(config: any) {
    const redirectRef = this.dialog.open(CreateSegmentComponent, config);
    redirectRef.afterClosed().subscribe((data) => {
      if (data === 'refresh') {
        this.getSegments();
      } else if (data) {
        this.redirectDialog(config);
      }
    });
  }

  public getSegments() {
    this.loading = true;
    this.reportsService.getSegments(undefined, true).subscribe((result) => {
      this.segmentData = result.data;
      this.filterData();
      this.loading = false;
    });
  }

  public exportExcel(event) {
    const workbook = new Workbook();
    exportDataGrid({
      component: this.segmentDataGrid.instance,
      worksheet: workbook.addWorksheet('Segments List Page'),
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
          'CoStar_SegmentsListPage.xlsx'
        );
      });
    });
  }

  public filterData() {
    if (this.currentDataFilter === 'Active') {
      this.segmentFilteredData = this.segmentData.filter((item) => {
        return item.active === true;
      });
    } else if (this.currentDataFilter === 'Archived') {
      this.segmentFilteredData = this.segmentData.filter((item) => {
        return item.active === false;
      });
    } else {
      this.segmentFilteredData = this.segmentData;
    }
  }

  public searchDataGrid(data) {
    this.searchText = data;
    this.segmentDataGrid.instance.searchByText(data);
  }

  public createSegment() {
    if (this.hasSegmentsAddRight) {
      const dialogRef = this.dialog.open(CreateSegmentComponent, {
        height: LargeModal.Height,
        width: LargeModal.Width,
        maxWidth: LargeModal.MaxWidth,
        maxHeight: LargeModal.MaxHeight,
        disableClose: true,
        data: {
          archived: false,
        },
      });

      dialogRef.afterClosed().subscribe((data) => {
        if (data === 'refresh') {
          this.getSegments();
        } else if (data) {
          this.redirectDialog(data);
        }
      });
    }
  }
  getTitleTooltip(data: any, menuOption: string): string {
    const { rights, activeRecordsVisibleToMe } = data.data;
    switch (menuOption) {
      case 'archive':
        switch (rights) {
          case 'Delete':
            return '';
          case 'View':
            return 'You have View rights to this segment. Ask your administrator to grant you Delete rights to archive this segment.';
          default:
            return 'You have Edit rights to this segment. Ask your administrator to grant you Delete rights to archive this segment.';
        }

      case 'copy':
        if (activeRecordsVisibleToMe) {
          return 'This segment is automatically generated and cannot be copied.';
        } else if (!this.hasSegmentsAddRight) {
          return 'You have View rights for segments. Ask your administrator to grant you Add rights to create segments.';
        } else {
          return 'This segment can be copied.';
        }

      default:
        return '';
    }
  }
}
