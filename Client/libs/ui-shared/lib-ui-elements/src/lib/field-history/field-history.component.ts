import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldHistoryDataSource } from '@mango/data-models/lib-data-models';
import {
  DxDataGridModule,
  DxTemplateModule,
  DxBulletModule,
  DxPopoverModule,
  DxDataGridComponent,
} from 'devextreme-angular';
import { IconModule } from '../icon';
import { CremTabItemComponent, CremTabsComponent } from '../tabs';
import { DataGridConf, PopoverConf } from '@mango/data-models/lib-data-models';
import type { Column } from 'devextreme/ui/data_grid';
import { PendoDataId } from '../../../../../core-shared/src/lib/directives/data-id';
import { CremDataIdDirective } from 'libs/core-shared/src/lib/directives/data-id.directive';
@Component({
  selector: 'crem-field-history',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    DxTemplateModule,
    DxBulletModule,
    DxPopoverModule,
    CremTabsComponent,
    CremTabItemComponent,
    IconModule,
    CremDataIdDirective,
  ],
  templateUrl: './field-history.component.html',
  styleUrls: ['./field-history.component.scss'],
})
export class FieldHistoryComponent extends PendoDataId implements OnInit {
  @Input() helpTextID: string;
  @Input() dataSource: FieldHistoryDataSource;
  @Input() dateFormat = 'MM/dd/yyyy h:mm a';
  @Input() visible = false;
  @Input() displayIcon = '' as string;
  @Input() showFieldName = false as boolean;
  /**
   * Define the columns configuration using DevExtreme's Column Type
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxDataGrid/Configuration/columns/
   *
   * @type {Partial<Column>}
   * @memberof FieldHistoryComponent
   */
  @Input() columns: Partial<Column>;

  /**
   * Allows to configure the data grid present within the history tab
   *
   * @type {GridConf}
   * @memberof FieldHistoryComponent
   */
  @Input() historyGridConfiguration?: Partial<DataGridConf>;

  /**
   * Determines whether the Info tab is shown by default.
   * Pass `false` to hide it, even if data is provided.
   */
  @Input() showInfoTab = true as boolean;

  /**
   * Allows to configure the popover
   * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxPopover/
   *
   * @type {Partial<PopoverConf>}
   * @memberof FieldHistoryComponent
   */
  @Input() popoverConf: Partial<PopoverConf> = {};

  @Output() getInitialData?: EventEmitter<void> = new EventEmitter();
  @Output() getHistData?: EventEmitter<void> = new EventEmitter();

  @Output() display = new EventEmitter<boolean>();

  @ViewChild('popoverTitle') popoverTitle: ElementRef<HTMLDivElement>;
  @ViewChild('TriggerIcon') TriggerIcon: ElementRef<HTMLElement>;
  @ViewChild('HistoryDataGrid') historyDataGrid: DxDataGridComponent;

  activeTabIndex = 0;
  getDataFlag = false as boolean;

  _tabHeight: string;
  _gridHeight: string;

  /**
   * Adjusts the history tab index based on `showInfoTab`,
   * dynamically determining and emitting when the history tab is open,
   * regardless of whether `showInfoTab` exists.
   */
  private _historyTabIndex = 1 as number;

  static uniqueNum = 0 as number;

  ngOnInit(): void {
    this._historyTabIndex = this.showInfoTab ? 1 : 0; // If showInfoTab false then the index of the history tab is 0
    this.helpTextID = `${
      this.helpTextID ?? 'help-text'
    }-${FieldHistoryComponent.uniqueNum++}`;

    // Configure Popover
    const defaultPopoverConf: Partial<PopoverConf> = {
      width: '600px',
      height: '360px',
      position: 'bottom',
      ariaLabel:
        this._historyTabIndex === 0
          ? 'Pop-up History'
          : 'Pop-up with Help Text and History',
    };
    this.popoverConf = { ...defaultPopoverConf, ...this.popoverConf };

    // Configure History Grid
    const defaultHistoryGridConf: Partial<DataGridConf> = {
      showBorders: false,
      sortingMode: 'none',
      showRowLines: false,
      columnAutoWidth: true,
      wordWrapEnabled: true,
      showColumnLines: false,
      allowColumnResizing: true,
      rowAlternationEnabled: true,
      allowColumnReordering: false,
      headerFilter: {
        visible: false,
      },
      paging: {
        visible: false,
        showInfo: true,
        infoText: `Page {0} of {1}`,
        showPageSizeSelector: true,
        showNavigationButtons: true,
        allowedPageSizes: [25, 50, 100, 500],
      },
      scrolling: {
        mode: 'virtual',
      },
    };
    this.historyGridConfiguration = {
      ...defaultHistoryGridConf,
      ...this.historyGridConfiguration,
    };

    // Calculate Tab height automatically
    const parsedHeight = this.parseHeight(this.popoverConf.height);
    const hasTitle =
      this.dataSource?.helpTextSubject ||
      this.dataSource?.helpTextSubject === '';
    const tabInternalOffset =
      (hasTitle ? -42 : 0) - // Popover's Title
      38; // tabs-nav
    // Calculate Grid height automatically
    const gridInternalOffset = -38; // tabs-nav
    this._tabHeight = `${parsedHeight + tabInternalOffset}px`;
    this._gridHeight = `${
      parsedHeight + tabInternalOffset + gridInternalOffset
    }px`;
  }

  toggleVisible() {
    this.visible = !this.visible;
    if (this.visible) {
      this.getInitialData.emit();
      if (this.activeTabIndex == this._historyTabIndex) {
        this.getHistData.emit();
      }
      this.display.emit(true);
      setTimeout(() => {
        if (this.popoverTitle) this.popoverTitle.nativeElement.focus();
      }, 1000);
    }
  }

  toggleFieldHistory(event){
    if(event.code === 'Enter' || event.code === ' ') {
      event.preventDefault();
      this.toggleVisible();
    }
  }

  onTabChanged(e) {
    this.activeTabIndex = e;
    if (this.activeTabIndex == this._historyTabIndex && !this.getDataFlag) {
      this.getDataFlag = true;
      this.getHistData.emit();
    }
  }

  onPopoverHidden() {
    this.getDataFlag = false;
    this.TriggerIcon.nativeElement.focus();
  }

  /**
   * This allows to handle input as a number or string to calculate
   * the internal tabs' height.
   *
   * @private
   * @param {(number | string)} value
   * @return {*}  {number}
   * @memberof FieldHistoryComponent
   */
  private parseHeight(value: number | string): number {
    if (typeof value === 'number') return value;
    const match = value.match(/^(\d+(?:\.\d+)?)/); // Extract numeric part
    return match ? parseFloat(match[1]) : 0;
  }
}
