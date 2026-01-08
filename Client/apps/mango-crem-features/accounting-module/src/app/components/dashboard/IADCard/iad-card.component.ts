import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  HostBinding,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import { Dropdown } from '@mango/data-models/lib-data-models';
import { DxPivotGridComponent } from 'devextreme-angular/ui/pivot-grid';
import { DxChartComponent, DxDataGridComponent } from 'devextreme-angular';

import { CardConfig } from '@mango/data-models/lib-data-models';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';
import Tooltip from 'devextreme/ui/tooltip';
import { UtilityService } from '@accounting-dashboard/services/utility.service';

@Component({
  selector: 'mango-iad-card',
  templateUrl: './iad-card.component.html',
  styleUrls: ['./iad-card.component.scss'],
})
export class IADCardComponent implements OnInit, AfterViewInit {
  @Input() config: CardConfig;
  @Input() pivotDataSources: PivotGridDataSource;
  @Input() gridDataSources: Array<any>;
  @Output() selectedFilter = new EventEmitter<Dropdown>();
  @Output() saveCard = new EventEmitter(); // todo: add type
  @Output() resetCard = new EventEmitter(); // todo: add type

  @HostBinding('class')
  get hostClasses(): string {
    return this.config.fullWidth ? 'col-md-12' : 'col-md-6';
  }

  @ViewChild('PivotChart', { static: false }) pivotChart: DxChartComponent;
  @ViewChild('PivotGrid') pivotGrid: DxPivotGridComponent;
  @ViewChild('DataGrid') dataGrid: DxDataGridComponent;

  constructor(private utilityService: UtilityService) {}

  ngOnInit() {
    this.customizeChartTooltip = this.customizeChartTooltip.bind(this);
    this.config.showMenuToggleFullWidth =
      this.config.showMenuToggleFullWidth !== undefined
        ? this.config.showMenuToggleFullWidth
        : true;
    this.config.fullWidth =
      this.config.fullWidth !== undefined ? this.config.fullWidth : true;
  }

  /**
   * Customize cells
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDataGrid/Configuration/#onCellPrepared
   *
   * @param {*} e
   * @memberof IADCardComponent
   */
  public onCellPrepared(e: any) {
    if (e.area === 'row' && e.cell.text?.length > 100) {
      const fullText: string = e.cell.text;
      const container = document.createElement('div');

      const partialText: string = e.cell.text.substring(0, 100) + '...';
      e.cellElement.innerHTML = `<span>${partialText}</span>`;
      e.cellElement.appendChild(container);

      new Tooltip(container, {
        target: e.cellElement,
        visible: false,
        position: 'right',
        showEvent: 'mouseenter',
        hideEvent: 'mouseleave click',
        contentTemplate: function (content) {
          const label = document.createElement('div');
          label.className = 'largeText-tooltip';
          label.innerHTML = `<span>${fullText}</span>`;
          content.appendChild(label);
        },
      });
    }
    if (e.area === 'data' && e.cell.text === '') {
      e.cellElement.textContent = '0.00';
    }
    if (
      e.cell.text === 'ROU Asset Balance' ||
      e.cell.text === 'Total Liability Balance'
    ) {
      e.cellElement.style.fontWeight = 'bold';
    }
    if (e.area === 'column') {
      // Apply background color when cell's header is total
      if (e.cell.text === 'Total') {
        e.cellElement.classList.add('total');
      }
    }
    if (e.rowType === 'data' || e.area === 'data') {
      // Apply background color when cell is a total
      if (e.cell.columnPath[e.cell.columnPath.length - 1] === 'Total') {
        e.cellElement.classList.add('total');
      }
      if (e.cell.rowPath[e.cell.rowPath.length - 1] === 'Thereafter') {
        e.cellElement.classList.add('total');
      }
      if (
        e.cell.rowPath[e.cell.rowPath.length - 1] ===
          'Total Undiscounted Lease Liability' ||
        e.cell.rowPath[e.cell.rowPath.length - 1] ===
          'Total Discounted Lease Liability' ||
        e.cell.rowPath[e.cell.rowPath.length - 1] === 'Total Lease Cost'
      ) {
        e.cellElement.classList.add('total');
      }
    }
    if (e.cell.text === 'Thereafter') {
      e.cellElement.classList.add('total');
    }
    if (
      e.cell.text === 'Total Undiscounted Lease Liability' ||
      e.cell.text === 'Total Discounted Lease Liability' ||
      e.cell.text === 'Total Lease Cost'
    ) {
      // todo: specific selector of cell text should be dynamically defined in the localCardConfig
      e.cellElement.classList.add('total');
    }
  }

  public toggleCardWidth() {
    this.config.fullWidth = !this.config.fullWidth; // save stage to config object
    this.updateDimension();
  }

  public showColumnChooser() {
    switch (this.config.defaultCardView) {
      case 'dataGrid': {
        this.dataGrid?.instance.showColumnChooser();
        break;
      }
      default:
      case 'pivotGrid': {
        this.pivotGrid?.instance.getFieldChooserPopup().show();
        break;
      }
    }
  }

  public updateDimension() {
    setTimeout(() => {
      switch (this.config.defaultCardView) {
        case 'dataGrid': {
          this.dataGrid?.instance.updateDimensions();
          if (this.config.chartVisible) this.pivotChart?.instance.render();
          break;
        }
        default:
        case 'pivotGrid': {
          this.pivotGrid?.instance.updateDimensions();
          if (this.config.chartVisible) this.pivotChart?.instance.render();
          break;
        }
      }
    });
  }

  toggleCardView() {
    switch (this.config.defaultCardView) {
      case 'dataGrid': {
        this.config.defaultCardView = 'pivotGrid';
        if (this.config.chartVisible) this.refreshPivotChartData();
        break;
      }
      default:
      case 'pivotGrid': {
        this.config.defaultCardView = 'dataGrid';
        if (this.config.chartVisible) this.refreshPivotChartData();
        break;
      }
    }
  }

  /**
   * The Card's dropdown is used and the event is emitted
   *
   * @param {Dropdown} e
   * @memberof IADCardComponent
   */
  emitSelection(e: Dropdown) {
    this.selectedFilter.emit(e[0]);
  }

  ngAfterViewInit() {
    if (this.config.chartVisible) this.refreshPivotChartData();
  }

  /**
   * The Card's Chart button is pressed
   *
   * @memberof IADCardComponent
   */
  public toggleChartButton() {
    this.config.chartVisible = !this.config.chartVisible;

    switch (this.config.defaultCardView) {
      default:
      case 'pivotGrid': {
        if (this.config.chartVisible) this.refreshPivotChartData();
        break;
      }
    }
  }

  /**
   *
   *
   * @memberof IADCardComponent
   */
  public refreshPivotChartData() {
    switch (this.config.defaultCardView) {
      case 'dataGrid': {
        break;
      }
      default:
      case 'pivotGrid': {
        setTimeout(() => {
          this.pivotGrid.instance.bindChart(this.pivotChart.instance, {
            dataFieldsDisplayMode: 'splitPanes',
            alternateDataFields: false,
          });
        }); // todo: fix setTimeout
        break;
      }
    }
  }

  /**
   * Customize Chart Tooltip
   *
   * @see https://js.devexpress.com/Angular/Demos/WidgetsGallery/Demo/PivotGrid/ChartIntegration/MaterialBlueLight/
   * @param {*} args
   * @return {*}
   * @memberof IADCardComponent
   */
  customizeChartTooltip(args) {
    return {
      html: `<strong>${args.argumentText}</strong> - ${args.seriesName}: <br/> <strong>${args.originalValue}</strong>`,
    };
  }

  /**
   * Do transformation on the data grid columns
   * <p>
   * Note: This is a presentational component.
   * Avoid adding any business logic here. Instead, use the object configuration:
   * `DashboardConfig` -> `dataGridColumnDefinition`.
   * This method should only be used for data transformations.
   * </p>
   *
   * @see [CustomizeColumns](https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDataGrid/Configuration/#customizeColumns)
   * @see [ColumnTypes](https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDataGrid/Configuration/columns/)
   * @param {any[]} columns
   * @memberof IADCardComponent
   */
  dataGridCustomizeColumns(columns: any[]) {
    columns.forEach((col) => {
      // Don't format the following fields
      if (
        col.name === 'PeriodYear' ||
        col.name === 'PeriodYearQuarter' ||
        col.name === 'PeriodYearMonth' ||
        col.name === 'DueByYear'
      ) {
        return;
      }

      if (col.dataType === 'number' && this.config?.format) {
        col.format = this.config.format;
      }
    });
  }

  /**
   * Menu: When the reset button is pressed the event is emitted
   *
   * @memberof IADCardComponent
   */
  emitReset(): void {
    this.resetCard.emit(this.config);
  }

  /**
   * Menu: When the save button is pressed the save event is emitted
   *
   * @param {CardConfig} config
   * @memberof IADCardComponent
   */
  emitSave(): void {
    switch (this.config.defaultCardView) {
      case 'dataGrid': {
        break;
      }
      default:
      case 'pivotGrid': {
        // Extract current pivotGrid's field configuration using the 'pivotDataSources'
        this.config.cardJSONSchema = this.utilityService.buildConfigFields(
          this.pivotDataSources
        );
        break;
      }
    }
    this.saveCard.emit(this.config);
  }

  /**
   * Menu: When the Grand Total is pressed
   *
   * @param {string} totalType
   * @return {*}
   * @memberof IADCardComponent
   */
  toggleGrandTotal(totalType: string): void {
    switch (this.config.defaultCardView) {
      case 'dataGrid': {
        break;
      }
      default:
      case 'pivotGrid': {
        if (totalType == 'row') {
          this.pivotGrid.showRowGrandTotals = this.config.showRowGrandTotals =
            !this.pivotGrid.showRowGrandTotals;
          return;
        }
        this.pivotGrid.showColumnGrandTotals =
          this.config.showColumnGrandTotals =
            !this.pivotGrid.showColumnGrandTotals;
        break;
      }
    }
  }
}
