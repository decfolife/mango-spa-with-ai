import { Component, OnInit, ViewChild } from '@angular/core';
import 'regenerator-runtime/runtime';
import * as ExcelJS from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { saveAs } from 'file-saver-es';
import { SubObjectComparisonService } from './sub-object-comparison.service';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import { MatMenuTrigger } from '@angular/material/menu';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';

import { ProjectGanttChartService } from '../project-gantt-chart/project-gantt-chart.service';
import { SharedService } from '../../shared/services/shared.service';
import { DomSanitizer } from '@angular/platform-browser';
import { interval, Subscription } from 'rxjs';
import notify from 'devextreme/ui/notify';
import { UtilitiesService } from '@mango/core-shared';
import { CremToastService } from '@mango/ui-shared/lib-ui-elements';
import { ToastState } from '@mango/data-models/lib-data-models';
import { DataType } from 'libs/data-models/lib-data-models/src/lib/enums/index';

@Component({
  selector: 'mango-sub-object-comparison',
  templateUrl: './sub-object-comparison.component.html',
  styleUrls: [
    './sub-object-comparison.component.scss',
    '../../../assets/styles/reports.scss',
  ],
})
export class SubObjectComparisonComponent implements OnInit {
  public pageTitle = this.route.snapshot.data['pageTitle'];
  public data: any;
  public columns: any;
  public faCaretDown = faCaretDown;
  public dateFormat: string;
  public formId: number;
  public childObjectTypeId: number;
  public parentObjectTypeId: number;
  public parentObjectId: number;
  public objectType: string;
  public clientKey: string;
  public loading = true;
  public imgLoaded: any = {};
  public exportImage: any = {};
  public imageLoaded = false;
  public columnNameLoaded: any = {};
  public subscription: Subscription;
  public googleMapImageObject: { [key: string]: string } = {};
  public subscriptionObject: { [key: string]: Subscription } = {};
  public valid = true;
  public widgetId: number;
  public subObjectIds: number[] = [];
  DataType = DataType;

  @ViewChild('DataGrid') dataGrid: DxDataGridComponent;
  @ViewChild('listMenuTrigger') listMenuTrigger: MatMenuTrigger;

  constructor(
    public service: SubObjectComparisonService,
    public projectGanttChartService: ProjectGanttChartService,
    public sanitizer: DomSanitizer,
    private sharedService: SharedService,
    private datepipe: DatePipe,
    private currencyPipe: CurrencyPipe,
    private decimalPipe: DecimalPipe,
    private route: ActivatedRoute,
    private toastService: CremToastService
  ) {
    this.widgetId = +this.route.snapshot.paramMap.get('widgetId');
  }

  ngOnInit(): void {
    // /221/45/3819,3856,3868
    this.clientKey = UtilitiesService.getClientKeyFromUrl();
    this.formId = +this.route.snapshot.paramMap.get('formId');
    this.childObjectTypeId =
      +this.route.snapshot.paramMap.get('childObjectTypeId');
    this.parentObjectId = +this.route.snapshot.paramMap.get('parentObjectId');
    this.parentObjectTypeId =
      +this.route.snapshot.paramMap.get('parentObjectTypeId');
    this.subObjectIds = this.route.snapshot.queryParamMap
      .getAll('subObjectIds')
      .map(Number)
      .filter((x) => x !== 0);

    if (this.subObjectIds?.length) {
      this.sharedService.getUserPreferences().subscribe((result) => {
        const userPreferences = result.data || {};
        this.dateFormat = userPreferences?.dateFormat || 'MM/dd/yyyy';
        this.projectGanttChartService
          .getObjectNameAndType(this.parentObjectId, this.parentObjectTypeId)
          .subscribe((projectType) => {
            this.objectType = projectType.data.objectType;
            this.pageTitle = projectType.data.objectName;

            this.getSubObjectComparisonData();
          });
      });
    } else {
      this.toastService.show(
        'Add at least one deal to compare.',
        '',
        ToastState.ERROR,
        {
          position: 'bottom right',
          maxWidth: '350px',
        }
      );

      this.valid = false;
      this.loading = false;
    }
  }

  public displayColumnChooser() {
    this.dataGrid.instance.showColumnChooser();
  }

  public exportExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const subObjectComparisonSheet = workbook.addWorksheet(
      'Sub Object Comparison'
    );

    const setBackground = (gridCell, excelCell) => {
      if (gridCell.rowType === 'header') {
        excelCell.font.color = { argb: '00558E' };
        excelCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'd2d2d2' },
          bgColor: { argb: 'd2d2d2' },
        };
      }
      if (
        gridCell.rowType === 'data' &&
        gridCell.column.dataField !== 'RowLabel' &&
        gridCell.value
      ) {
        if (gridCell?.data?.DataTypeId === DataType.DATE.toString()) {
          excelCell.value = this.datepipe.transform(
            gridCell.value,
            this.dateFormat
          );
        }

        if (gridCell?.data?.DataTypeId === DataType.CURRENCY.toString()) {
          excelCell.value = this.currencyPipe.transform(gridCell.value, 'USD');
        }

        if (
          ((gridCell?.data?.DataTypeId === DataType.DOUBLE.toString() ||
            gridCell?.data?.DataTypeId === DataType.PERCENT.toString()) &&
            gridCell?.data?.FormItemTypeId === '2') ||
          (gridCell?.data.DataTypeId === DataType.DOUBLE.toString() &&
            gridCell?.data.FormItemTypeId === '9')
        ) {
          excelCell.value = this.decimalPipe.transform(gridCell.value, '1.2-2');
        }

        if (
          gridCell?.data?.DataTypeId === DataType.INTEGER.toString() &&
          gridCell?.data?.FormItemTypeId === '2'
        ) {
          excelCell.value = this.decimalPipe.transform(gridCell.value, '1.0');
        }

        if (gridCell?.data?.FormItemTypeId === '3') {
          excelCell.style.alignment.wrapText = true;
          excelCell.value = excelCell.value.replaceAll('<br>', '\n');
        }

        if (
          gridCell?.data.DataTypeId === DataType.CHAR.toString() &&
          gridCell?.data.FormItemTypeId === '9'
        ) {
          //add image?
          excelCell.style.alignment.wrapText = true;
          excelCell.value = '';
        }

        if (
          gridCell?.data.FormItemTypeId === '17' ||
          gridCell?.data.FormItemTypeId === '6'
        ) {
          excelCell.value = '';
          let imageURL = gridCell.value;
          if (!this.exportImage[excelCell.row]) {
            this.exportImage[excelCell.row] = {
              height: 14.4,
              processed: {},
            };
          }

          this.exportImage[excelCell.row].processed[gridCell.column.dataField] =
            false;

          this.toDataUrl(imageURL, (result) => {
            const image = new Image();
            image.src = result;
            image.onload = () => {
              let imageExtension;
              if (imageURL) {
                const imageArray = imageURL.split('.');
                if (imageArray.length > 1) {
                  if (
                    imageArray[imageArray.length - 1].toLowerCase() === 'gif'
                  ) {
                    imageExtension = 'gif';
                  } else if (
                    imageArray[imageArray.length - 1].toLowerCase() === 'png'
                  ) {
                    imageExtension = 'png';
                  } else {
                    imageExtension = 'jpeg';
                  }
                }
              }
              if (this.exportImage[excelCell.row].height < image.height) {
                if (image.height > 250) {
                  image.height = 250;
                }
                this.exportImage[excelCell.row].height = image.height;
              }
              const cellImage = workbook.addImage({
                base64: result,
                extension: imageExtension,
              });

              subObjectComparisonSheet.getRow(excelCell.row).height =
                this.exportImage[excelCell.row].height;
              subObjectComparisonSheet.addImage(cellImage, {
                tl: { col: excelCell.col - 1, row: excelCell.row - 1 } as any,
                br: { col: excelCell.col, row: excelCell.row } as any,
              });
              this.exportImage[excelCell.row].processed[
                gridCell.column.dataField
              ] = true;

              if (Object.keys(this.exportImage).length !== 0) {
                this.imageLoaded = Object.keys(this.exportImage).every(
                  (item) => {
                    return Object.keys(this.exportImage[item].processed).every(
                      (processed) => {
                        return this.exportImage[item].processed[processed];
                      }
                    );
                  }
                );
              }
            };

            image.onerror = () => {
              this.exportImage[excelCell.row].processed[
                gridCell.column.dataField
              ] = true;
              if (Object.keys(this.exportImage).length !== 0) {
                this.imageLoaded = Object.keys(this.exportImage).every(
                  (item) => {
                    return Object.keys(this.exportImage[item].processed).every(
                      (processed) => {
                        return this.exportImage[item].processed[processed];
                      }
                    );
                  }
                );
              }
            };
          });
        }
      }
    };

    exportDataGrid({
      worksheet: subObjectComparisonSheet,
      component: this.dataGrid.instance,
      topLeftCell: { row: 1, column: 1 },
      customizeCell: ({ gridCell, excelCell }) => {
        setBackground(gridCell, excelCell);
      },
    }).then(() => {
      const checkImageInterval = interval(500);
      this.subscription = checkImageInterval.subscribe(() => {
        if (this.imageLoaded || Object.keys(this.exportImage).length === 0) {
          this.subscription.unsubscribe();
          workbook.xlsx.writeBuffer().then((buffer) => {
            const currentDate = this.getCurrentDate();
            const fileName = this.pageTitle + ' - ' + currentDate + '.xlsx';
            saveAs(
              new Blob([buffer], { type: 'application/octet-stream' }),
              fileName
            );
            this.dataGrid.instance.refresh();
            this.exportImage = {};
            this.imageLoaded = false;
          });
        }
      });
    });
  }

  public toDataUrl(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      var reader = new FileReader();
      reader.onloadend = function () {
        callback(reader.result);
      };
      reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  }

  public exportpdf() {
    // const doc = new jsPDF();
    // exportDataGridToPdf({
    //   jsPDFDocument: doc,
    //   component: this.dataGrid.instance,
    //   customizeCell: (options) => {
    //     if (options.gridCell.rowType === 'data' && options.gridCell.column.dataField !== 'RowLabel' && options.gridCell.value) {
    //       if (options?.gridCell?.data?.DataTypeId === '7') {
    //         options.pdfCell.content = this.datepipe.transform(options?.gridCell.value, this.dateFormat);
    //       }
    //       if (options?.gridCell?.data?.DataTypeId === '6') {
    //         options.pdfCell.content = this.currencyPipe.transform(options?.gridCell.value, 'USD');
    //       }
    //       if (((options?.gridCell?.data?.DataTypeId === '5' || options?.gridCell?.data?.DataTypeId === '206') && options?.gridCell?.data?.FormItemTypeId === '2') || (options?.gridCell?.data.DataTypeId === '5' && options?.gridCell?.data.FormItemTypeId === '9')) {
    //         options.pdfCell.content = this.decimalPipe.transform(options?.gridCell.value, '1.2-2');
    //       }
    //       if ((options?.gridCell?.data?.DataTypeId === '3') && options?.gridCell?.data?.FormItemTypeId === '2') {
    //         options.pdfCell.content = this.decimalPipe.transform(options?.gridCell.value, '1.0');
    //       }
    //       if (options?.gridCell?.data?.FormItemTypeId === '3') {
    //         options.pdfCell.content = options.gridCell.value.replaceAll('<br>', '\n')
    //       }
    //       if (options?.gridCell?.data.DataTypeId === '200' && options?.gridCell?.data.FormItemTypeId === '9') {
    //         options.pdfCell.content = "";
    //       }
    //       if (options?.gridCell?.data.FormItemTypeId === '17' || options?.gridCell?.data.FormItemTypeId === '6') {
    //         options.pdfCell.content = "";
    //       }
    //     }
    //   }, // Customizes a grid cell
    // }).then(() => {
    //   const currentDate = this.getCurrentDate();
    //   const fileName = this.pageTitle + " - " + currentDate + '.pdf'
    //   doc.save(fileName);
    // })
  }

  private getSubObjectComparisonData() {
    this.service
      .getSubObjectsComparisonData(
        this.formId,
        this.childObjectTypeId,
        this.widgetId,
        this.subObjectIds
      )
      .subscribe((result) => {
        const data = JSON.parse(result.data);
        // Example data results can be found here in older versions of this file
        // At this point the API has returned with either an array of sub objects or an error object from ErrorHandlingMiddleware
        if (data.errors) {
          notify({
            message:
              'A problem occurred while opening this window. Please close and try again.',
            type: 'error',
            displayTime: 600000,
            position: {
              at: 'bottom right',
              my: 'bottom right',
              offset: '-16 -16',
            },
            maxWidth: '545px',
            closeOnClick: true,
          });
          this.valid = false;
          this.loading = false;
          return;
        }

        const dataRenamed = data.map((item) => {
          if (item?.FormItemTypeId === '17' || item?.FormItemTypeId === '6') {
            item.RowLabel = 'Image';
          } else if (
            item?.DataTypeId === DataType.CHAR.toString() &&
            item?.FormItemTypeId === '9'
          ) {
            item.RowLabel = 'Map';
          }
          return item;
        });
        this.data = dataRenamed.filter((item) => {
          return item.FormItemTypeId !== '8';
        });
        this.columnBuilder();
      });
  }

  public searchDataGrid(data: string): void {
    this.dataGrid?.instance?.searchByText(data);
  }

  onKeyUpEvent(event) {
    const targetElement = event.target as HTMLElement;
    if (targetElement.nodeName.toLowerCase() == 'input') {
      targetElement.setAttribute(
        'aria-label',
        'Search Filter For - ' + event.target.value + ' applied'
      );
    }
  }

  public onImageLoad(subObjectTypeId, fileName, isError) {
    if (!this.imgLoaded[subObjectTypeId]) {
      this.imgLoaded[subObjectTypeId] = {};
    }

    if (!this.imgLoaded[subObjectTypeId][fileName]) {
      this.imgLoaded[subObjectTypeId][fileName] = {};
      this.imgLoaded[subObjectTypeId][fileName].isLoaded = true;
      this.imgLoaded[subObjectTypeId][fileName].isError = isError;
      this.dataGrid.instance.refresh();
    }
  }

  public onMapImageLoad(column) {
    if (!this.imgLoaded[column]) {
      this.imgLoaded[column] = true;
    }
  }

  private columnBuilder(): void {
    this.columns = [
      {
        dataField: 'RowLabel',
        caption: 'Item',
        alignment: null,
        visible: true,
        fixed: 'true',
        showInColumnChooser: false,
        dataType: 'string',
      },
      {
        dataField: 'Group',
        alignment: null,
        groupIndex: '1',
        visible: true,
        showInColumnChooser: false,
        dataType: 'number',
        calculateGroupValue: this.calculateGroupValue,
        customizeText: this.customizeGroupText,
      },
    ];

    if (this.parentObjectId.toString() in this.data?.[0]) {
      this.columns.push({
        dataField: this.parentObjectId.toString(),
        caption: this.pageTitle,
        alignment: null,
        visible: true,
        allowHeaderFiltering: false,
        dataType: 'string',
        cellTemplate: 'customTemplate',
      });
    }

    if (this.data?.[0]) {
      for (const key in this.data[0]) {
        if (
          key !== 'RowLabel' &&
          key !== 'Group' &&
          key !== 'GroupIndex' &&
          key !== 'Idx' &&
          key !== 'DataTypeId' &&
          key !== 'FormItemTypeId' &&
          key !== this.parentObjectId.toString()
        ) {
          this.columnNameLoaded[key] = false;
          this.columns.push({
            dataField: key,
            caption: key,
            alignment: null,
            visible: true,
            allowHeaderFiltering: false,
            dataType: 'string',
            cellTemplate: 'customTemplate',
          });
          this.projectGanttChartService
            .getObjectNameAndType(Number(key), this.childObjectTypeId)
            .subscribe((result) => {
              let allColumnNameLoaded;
              const index = this.columns.findIndex((item) => {
                return item.dataField === key;
              });
              if (index !== -1) {
                this.columns[index].caption = result.data.objectName;
              }

              this.columnNameLoaded[key] = true;
              if (Object.keys(this.columnNameLoaded).length !== 0) {
                allColumnNameLoaded = Object.keys(this.columnNameLoaded).every(
                  (item) => {
                    return this.columnNameLoaded[item];
                  }
                );
              } else {
                allColumnNameLoaded = true;
              }

              if (allColumnNameLoaded) {
                this.loading = false;
              }

              const checkImageInterval = interval(1000);

              const mapItem = this.data.find((item) => {
                return (
                  item.DataTypeId === DataType.CHAR.toString() &&
                  item.FormItemTypeId === '9'
                );
              });

              if (mapItem?.[key]) {
                let countdown = 30;
                this.subscriptionObject[key] = checkImageInterval.subscribe(
                  () => {
                    const iframe = document.getElementById(key) as any;
                    if (iframe) {
                      setTimeout(() => {
                        const children = iframe?.childNodes;
                        const innerDoc =
                          children?.[0]?.contentDocument ||
                          children?.[0]?.contentWindow?.document ||
                          children?.[0]?.document;
                        const value = innerDoc?.querySelector(
                          '#hdnGoogleMapPrntStr'
                        )?.value;

                        setTimeout(() => {
                          if (value) {
                            this.subscriptionObject[key].unsubscribe();
                            this.googleMapImageObject[key] = value;
                          } else {
                            countdown--;
                            if (countdown === 0) {
                              this.subscriptionObject[key].unsubscribe();
                              this.googleMapImageObject[key] =
                                'Map Not Available';
                            }
                          }
                        }, 200);
                      }, 200);
                    }
                  }
                );
              }
            });
        }
      }
    }
  }

  calculateGroupValue = (event) => {
    return Number(event?.GroupIndex);
  };

  customizeGroupText = (event) => {
    const groupItem = this.data.find((item) => {
      return Number(item.GroupIndex) === Number(event.value);
    });
    return groupItem?.Group;
  };

  private getCurrentDate(): string {
    const date = new Date();
    return this.datepipe.transform(date, this.dateFormat);
  }
}
