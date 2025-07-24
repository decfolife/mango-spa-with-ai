import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ETLService } from '@etl/services/etl.service';
import { Observable, Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { DevExpressModule } from 'libs/ui-shared/lib-external-libraries/src/lib/3rdParty/dev-express.module';
import { SearchModule } from '@mango/ui-shared/cosmos';
import {
  DropdownModule,
  ButtonModule,
  LoaderModule,
  IconModule,
} from '@mango/ui-shared/lib-ui-elements';
import { DxDataGridComponent } from 'devextreme-angular';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { faL } from '@fortawesome/free-solid-svg-icons';
import { SharedLeftNavLink } from '@mango/data-models/lib-data-models';
import { filter, map } from 'rxjs/operators';
import { ITemplate } from '@etl/model/template-edit';
import { ExportDevexDatagridService } from '@mango/core-shared';

@Component({
  selector: 'mango-etl-templates-history',
  standalone: true,
  imports: [
    CommonModule,
    LoaderModule,
    MatDialogModule,
    MatCardModule,
    MatDividerModule,
    DevExpressModule,
    SearchModule,
    ButtonModule,
    DropdownModule,
    IconModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './etl-templates-history.component.html',
  styleUrls: ['./etl-templates-history.component.scss'],
  providers: [ExportDevexDatagridService],
})
export class EtlTemplatesHistoryComponent implements OnInit, OnDestroy {
  @ViewChild('TemplateHistoryDataGrid')
  templateHistoryDataGrid: DxDataGridComponent;
  private subs: Subscription = new Subscription();
  templateDetails: ITemplate;
  templateId: number;
  templateHistoryData: any;
  isLoading = true;
  areGroupsExpanded = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public etlService: ETLService,
    public exportToExcelService: ExportDevexDatagridService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.templateId = +params.get('id');
      this.getTemplateDetails(this.templateId);
    });

    // Show the custom left nav items for Templates
    setTimeout(() => {
      this.setCustomLeftNav(this.getTemplatesLeftNavData());
    });

    this.loadForm();
  }

  loadForm() {
    this.subs.add(this.getUserPreferences().subscribe());
    this.subs.add(
      this.etlService
        .getTemplateHistory(this.templateId)
        .subscribe((result) => {
          if (result.success) {
            setTimeout(() => {
              this.templateHistoryData = result.data;
              this.isLoading = false;
            });
          }
        })
    );
  }

  getTemplateDetails(id: number) {
    if (id === 0) {
      return;
    }

    this.subs.add(
      this.etlService.getTemplateDetails(id).subscribe((result) => {
        if (result.success) {
          this.templateDetails = result.data;
        }
      })
    );
  }

  actionDesc(actions: string): string {
    switch (actions) {
      case 'A':
        return 'Insert';
      case 'M':
      case 'U':
        return 'Update';
      case 'D':
        return 'Delete';
      default:
        return 'Unknown';
    }
  }

  groupCellTemplate(cellElement, cellInfo) {
    cellElement.innerHTML = `Modified Date: ${new Date(
      cellInfo.value
    ).toLocaleString()}`;
  }

  onSendToExcel() {
    this.exportToExcelService.exportToExcel(
      this.templateHistoryDataGrid.instance,
      'ImportTemplate_History_' + this.formatDate()
    );
  }

  expandAll() {
    if (this.templateHistoryDataGrid) {
      if (this.areGroupsExpanded) {
        this.templateHistoryDataGrid.instance.collapseAll();
      } else {
        this.templateHistoryDataGrid.instance.expandAll();
      }
      this.areGroupsExpanded = !this.areGroupsExpanded;
    }
  }

  getUserPreferences(): Observable<any> {
    return this.etlService.getUserPreferences().pipe(
      filter((res) => !!res && !!res.success),
      map((res) => this.etlService.setUserDateFormat(res.data.isDatesEU))
    );
  }

  setCustomLeftNav(data: any) {
    const customLeftNavDataList: SharedLeftNavLink[] = data;
    const evt = new CustomEvent('SetCustomLeftNavItems', {
      detail: customLeftNavDataList,
    });
    window.dispatchEvent(evt);
  }

  formatDate() {
    const now = new Date();

    // Pad single digits with leading zeros
    const pad = (n: number): string => n.toString().padStart(2, '0');

    // Format the date and time
    const formattedDate =
      now.getFullYear().toString() + // yyyy
      pad(now.getMonth() + 1) + // MM (Months are 0-based, so add 1)
      pad(now.getDate()) + // dd
      pad(now.getHours()) + // HH
      pad(now.getMinutes()) + // mm
      pad(now.getSeconds()); // ss

    return formattedDate;
  }

  getTemplatesLeftNavData(): SharedLeftNavLink[] {
    const dummyData1: SharedLeftNavLink = {
      name: 'Imports',
      id: 1,
      category: null,
      categoryHasFlyOutMenu: false,
      categoryIsCurrentlyActiveLink: false,
      categoryLinkUrl: null,
      categorySpaUrl: null,
      categorySpaQueryParameters: '',
      sortOrder: 1,
      linkUrl: '',
      moduleID: 6,
      isAuthorized: true,
      objectTypeID: null,
      objectTypeName: '',
      dynamicName: 'Imports',
      usesNgRouting: true,
      spaUrl: '/crem/admin/etl/imports',
      spaQueryParameters: '',
      isCommon: false,
      isCurrentlyActiveLink: false,
      subChildLevel: 0,
      subChildLevelNavLinks: null,
    };

    const dummyData2: SharedLeftNavLink = {
      name: 'Details',
      id: 2,
      category: 'Templates',
      categoryHasFlyOutMenu: false,
      categoryIsCurrentlyActiveLink: false,
      categoryLinkUrl: null,
      categorySpaUrl: null,
      categorySpaQueryParameters: '',
      sortOrder: 2,
      linkUrl: '',
      moduleID: 6,
      isAuthorized: true,
      objectTypeID: null,
      objectTypeName: '',
      dynamicName: 'Details',
      usesNgRouting: true,
      spaUrl: '/crem/admin/etl/templates/details/' + this.templateId,
      spaQueryParameters: '',
      isCommon: false,
      isCurrentlyActiveLink: false,
      subChildLevel: 0,
      subChildLevelNavLinks: null,
    };
    const dummyData3: SharedLeftNavLink = {
      name: 'View History',
      id: 3,
      category: 'Templates',
      categoryHasFlyOutMenu: false,
      categoryIsCurrentlyActiveLink: false,
      categoryLinkUrl: null,
      categorySpaUrl: null,
      categorySpaQueryParameters: '',
      sortOrder: 3,
      linkUrl: '',
      moduleID: 6,
      isAuthorized: false,
      objectTypeID: null,
      objectTypeName: '',
      dynamicName: 'View History',
      usesNgRouting: true,
      spaUrl: '/crem/admin/etl/templates/history/' + this.templateId,
      spaQueryParameters: '',
      isCommon: false,
      isCurrentlyActiveLink: false,
      subChildLevel: 0,
      subChildLevelNavLinks: null,
    };

    return [dummyData1, dummyData2, dummyData3];
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
