import { Component, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  DxDataGridComponent,
  DxDataGridModule,
  DxCheckBoxModule,
} from 'devextreme-angular';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Observable, Subscription, of } from 'rxjs';
import { filter, map, switchMap, delay } from 'rxjs/operators';
import 'regenerator-runtime/runtime';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver-es';
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import { AddServiceAccountComponent } from '../add-service-account/add-service-account.component';
import { ServiceAccountDetailsComponent } from '../service-account-details/service-account-details.component';
import { UpdateServiceAccountComponent } from '../update-service-account/update-service-account.component';
import { ClientDeliveryService } from '../../services/client-delivery.service';
import { UserMaintenanceService } from '../../../../../user-maintenance/src/app/components/user-maintenance/user-maintenance.service';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { ServiceAccount } from '@mango/data-models/lib-data-models';
import {
  ButtonModule,
  DropdownModule,
  ModalModule,
  SearchComponent,
} from '@mango/ui-shared/lib-ui-elements';
import { LatestSyncInfo } from 'libs/data-models/lib-data-models/src/lib/models/service-account/latest-sync-info.interface';
import { CremPopoverComponent } from '@mango/ui-shared/lib-ui-elements';

enum Status {
  active = 'active',
  inactive = 'inactive',
  all = 'all',
}
@Component({
  standalone: true,
  imports: [
    CommonModule,
    ModalModule,
    SearchComponent,
    DxDataGridModule,
    DxCheckBoxModule,
    MatMenuModule,
    DropdownModule,
    ButtonModule,
    MatIconModule,
    MatDialogModule,
    CremPopoverComponent,
  ],
  selector: 'mango-service-accounts',
  templateUrl: './service-accounts.component.html',
  styleUrls: ['./service-accounts.component.scss'],
})
export class ServiceAccountsComponent implements OnDestroy {
  public pageTitle = 'Service Accounts';
  public serviceAccountsData$: Observable<ServiceAccount[]>;
  public syncMessage$: Observable<string> = of('');
  public latestSyncInfo$: Observable<string>;

  public dropdownFieldData: any = [
    { value: 'active', display: 'Active' },
    { value: 'inactive', display: 'Inactive' },
    { value: 'all', display: 'All' },
  ];

  public gridColumns: any = [
    {
      dataField: 'contactId',
      alignment: 'left',
      visible: true,
      dataType: 'number',
      caption: 'Contact ID',
    },
    {
      dataField: 'contactEmailAddress',
      caption: 'Email',
      alignment: null,
      visible: true,
      dataType: null,
    },
    {
      dataField: 'clientId',
      alignment: 'left',
      visible: true,
      dataType: null,
      caption: 'Client ID',
    },
    {
      dataField: 'contactActive',
      caption: 'Active',
      alignment: null,
      visible: true,
      dataType: null,
      cellTemplate: 'contactActiveTemplate',
    },
  ];

  private faEllipsisH = faEllipsisH;
  private allServiceAccounts: ServiceAccount[];
  private selectedFilter: Status = Status.active;
  private searchText: string = '';
  private subs: Subscription[] = [];
  @ViewChild('DataGrid') dataGrid: DxDataGridComponent;

  constructor(
    private dialog: MatDialog,
    private datepipe: DatePipe,
    private clientDeliveryService: ClientDeliveryService,
    private userMaintenanceService: UserMaintenanceService,
    private mangoAppFacade: MangoAppFacade
  ) {
    this.getServiceAccounts();
  }

  searchDataGrid(searchText: string): void {
    this.searchText = searchText;
    this.dataGrid?.instance?.searchByText(searchText);
  }

  openAccountDetails(e): void {
    if (e.rowType != 'header' && e.column.dataField !== 'Actions') {
      this.openServiceAccountDetailsComponentPopup(e.data);
    }
  }

  onFilterChange(e: any[]): void {
    const filterBy: any = e?.[0]?.value || e?.[0];
    if (this.selectedFilter !== filterBy) {
      this.selectedFilter = filterBy;
      this.filterServiceAccountData(filterBy);
    }
  }

  ngOnInit(): void {
    this.latestSyncInfo();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  addServiceAccount() {
    let dialogRef = this.dialog.open(AddServiceAccountComponent, {
      width: '460px',
      panelClass: 'client-delivery-modal',
      disableClose: true,
    });

    this.subs.push(
      dialogRef
        .afterClosed()
        .pipe(
          filter((result) => result != null),
          switchMap((result) =>
            this.clientDeliveryService.addServiceAccount(result)
          )
        )
        .subscribe((_) => this.getServiceAccounts())
    );
  }

  updateServiceAccountStatus(data, contactActiveFlg) {
    let dialogRef = this.dialog.open(UpdateServiceAccountComponent, {
      width: '600px',
      panelClass: 'client-delivery-modal',
      data: data.data,
      disableClose: true,
    });

    this.subs.push(
      dialogRef
        .afterClosed()
        .pipe(
          filter((result) => !!result),
          switchMap((result) =>
            this.clientDeliveryService.updateServiceAccount(
              result.contactEmailAddress,
              result.contactId,
              contactActiveFlg
            )
          ),
          delay(1200)
        )
        .subscribe((_) => this.getServiceAccounts())
    );
  }

  latestSyncInfo() {
    this.subs.push(
      this.userMaintenanceService
        .getLatestSyncInfo()
        .pipe(
          switchMap(
            (result) =>
              (this.latestSyncInfo$ = result
                ? of(
                    `Last Synced on ${result.lastSyncDate} by ${result.contactFirstName} ${result.contactLastName}`
                  )
                : of(`Sync Data has never been run`))
          )
        )
        .subscribe()
    );
  }

  exportGrids(): void {
    const workbook = new ExcelJS.Workbook();
    const serviceAccountMaintenanceSheet =
      workbook.addWorksheet('ServiceAccounts');

    serviceAccountMaintenanceSheet.getRow(2).getCell(2).value =
      'ServiceAccounts';
    serviceAccountMaintenanceSheet.getRow(2).getCell(2).font = {
      bold: true,
      size: 16,
      underline: 'double',
    };
    serviceAccountMaintenanceSheet.getRow(2).getCell(4).value = 'Filter:';
    serviceAccountMaintenanceSheet.getRow(2).getCell(4).font = { bold: true };
    serviceAccountMaintenanceSheet.getRow(2).getCell(5).value =
      this.selectedFilter;

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
    };

    exportDataGrid({
      worksheet: serviceAccountMaintenanceSheet,
      component: this.dataGrid.instance,
      topLeftCell: { row: 5, column: 2 },
      customizeCell: ({ gridCell, excelCell }) => {
        setBackground(gridCell, excelCell);
      },
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        const date = this.datepipe.transform(new Date());
        const fileName = 'ServiceAccounts' + '_' + date + '.xlsx';
        saveAs(
          new Blob([buffer], { type: 'application/octet-stream' }),
          fileName
        );
      });
    });
  }

  //ADA specific
  onKeyDownOpenAccountDetails(e) {
    if (e.event.key === 'Enter') {
      const focusedRowIndex = e.component.option('focusedRowIndex');
      if (focusedRowIndex >= 0) {
        const visibleRows = e.component.getVisibleRows();
        const selRow = visibleRows[focusedRowIndex];
        const focusedColumnIndex = e.component.option('focusedColumnIndex');
        if (
          selRow &&
          selRow.rowType != 'header' &&
          selRow.cells[focusedColumnIndex].column.dataField !== 'Actions'
        ) {
          this.openServiceAccountDetailsComponentPopup(selRow.data);
        }
      }
    }
  }

  private getServiceAccounts() {
    this.subs.push(
      this.userMaintenanceService
        .getServiceAccounts()
        .subscribe((serviceAccounts) => {
          this.allServiceAccounts = serviceAccounts;
          this.filterServiceAccountData(this.selectedFilter);
          this.searchDataGrid(this.searchText);
        })
    );
  }

  private filterServiceAccountData(filterBy: Status) {
    filterBy === Status.all
      ? (this.serviceAccountsData$ = of(this.allServiceAccounts))
      : (this.serviceAccountsData$ = of(
          this.allServiceAccounts.filter(
            (account) =>
              account.contactActive ===
              (filterBy === Status.active ? true : false)
          )
        ));
  }

  private openServiceAccountDetailsComponentPopup(selectedRowData) {
    this.dialog.open(ServiceAccountDetailsComponent, {
      width: '1200px',
      panelClass: 'client-delivery-modal',
      data: selectedRowData,
      disableClose: true,
    });
  }
}
