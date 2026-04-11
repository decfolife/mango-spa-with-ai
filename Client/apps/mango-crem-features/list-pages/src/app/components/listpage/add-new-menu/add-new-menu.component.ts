import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ListPageService } from '../core/services/listpage.service';
import { ActivatedRoute, Router } from '@angular/router';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { EditPage } from '../shared/models/edit-page';
import { MatDialog } from '@angular/material/dialog';
import { AddBuildingModalComponent } from 'libs/ui-shared/lib-ui-shared/src/lib/add-building-modal/add-building-modal.component';
import { AddSupplierModalComponent } from '@mango/ui-shared/lib-ui-shared';
import {
  SUPPLIER_WIZARD_OTID,
  PREMISE_WIZARD_OTID,
  BUILDING_WIZARD_OTID,
  LEASE_WIZARD_OTID,
  AI_LEASE_WIZARD_OTID,
  ToastState,
} from '@mango/data-models/lib-data-models';
import { AddEquipmentModalComponent } from '@mango/ui-shared/lib-ui-shared';
import { EQUIPMENT_WIZARD_OTID } from '@mango/data-models/lib-data-models';
import { AddLeaseModalComponent } from 'libs/ui-shared/lib-ui-shared/src/lib/add-lease-modal/add-lease-modal.component';
import { AddAiLeaseModalComponent } from 'libs/ui-shared/lib-ui-shared/src/lib/add-ai-lease-modal/add-ai-lease-modal.component';
import { AddPremiseModalComponent } from 'libs/ui-shared/lib-ui-shared/src/lib/add-premise-modal/add-premise-modal.component';
import { DashboardService } from '@project-dashboard/services/dashboard.service';
import { map } from 'rxjs/operators';
import { CremToastService } from '@mango/ui-shared/lib-ui-elements';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-add-new-menu',
  templateUrl: './add-new-menu.component.html',
  styleUrls: ['./add-new-menu.component.scss'],
})
export class AddNewMenuComponent implements OnInit {
  private _editPages: EditPage[] = [];
  navigationPages: EditPage[] = [];
  objectTypeId: string;
  addButtonObjects: any = [];
  isChargeAction = false as boolean;

  @Input() enabled: boolean;
  @Input() isGLEvent: boolean;
  @Input() OTTID: number;
  @Input() id: '';
  @Input()
  set editPages(editPages: EditPage[]) {
    this.onEditPagesChanged(editPages);
  }
  get editPages(): EditPage[] {
    return this._editPages;
  }

  @Output()
  navigateToEditPage = new EventEmitter<EditPage>();

  @Output() reLoadGrid = new EventEmitter<boolean>();

  faPlus = faPlus;

  constructor(
    private sanitizer: DomSanitizer,
    public service: ListPageService,
    private route: ActivatedRoute,
    private dashboardService: DashboardService,
    private dialog: MatDialog,
    private toastService: CremToastService,
    private router: Router
  ) {}

  onEditPagesChanged(editPages: EditPage[]) {
    if (editPages === null) {
      editPages = [];
    }

    this._editPages = editPages;
  }

  ngOnInit(): void {
    this.getModuleRights();
    this.objectTypeId = this.route.snapshot.data.objectTypeId;
  }

  addButtonClick(editPage: EditPage) {
    //const htmlLink = this.ensureJavaScript(editPage.navigationUrl);

    if (this.isGLEvent) {
      this.isChargeAction = true;
    }

    this.navigateToEditPage.next(editPage);
    //window.location.href = htmlLink;
    this.navRouterUrl(editPage.navigationUrl);
  }

  addButtonClickSingle() {
    if (this.editPages.length !== 1) {
      return;
    }

    const page = this.editPages[0];
    //const htmlLink = this.ensureJavaScript(page.navigationUrl);

    this.navigateToEditPage.next(page);
    //window.location.href = htmlLink;
    this.navRouterUrl(page.navigationUrl);
  }

  addButtonClickSingleForMatMenu() {
    if (this.navigationPages.length !== 1) {
      return;
    }

    const page = this.navigationPages[0];
    //const htmlLink = this.ensureJavaScript(page.navigationUrl);

    this.navigateToEditPage.next(page);
    //window.location.href = htmlLink;
    this.navRouterUrl(page.navigationUrl);
  }

  makeSafeHtmlLink(htmlLink: string) {
    htmlLink = this.ensureJavaScript(htmlLink);

    return this.sanitizer.bypassSecurityTrustUrl(htmlLink);
  }

  private navRouterUrl(htmlLink: string) {
    let htmlurl = htmlLink.replace("GoToPage('", '').replace("');", '');

    let splitHtmlUrl = htmlurl.split('?');
    const queryParams = {};
    if (splitHtmlUrl.length > 1) {
      const params = splitHtmlUrl[1].split('&');
      params.forEach((element) => {
        const [key, value] = element.split('=');
        queryParams[key] = value;
      });
    }
    // console.log(splitHtmlUrl[0]);
    // console.log(queryParams);
    this.router.navigate([splitHtmlUrl[0]], { queryParams: queryParams });
  }

  private ensureJavaScript(htmlLink: string) {
    return htmlLink.startsWith('javascript:')
      ? htmlLink
      : `javascript:${htmlLink}`;
  }
  //** we are getting module rights only for below object types*/
  //** Building (OTID = 3)
  //** Lease (OTID = 4)
  //** Supplier (OTID = 175)
  //** Equipment Lease (OTID = 174)
  //** Premise/Store (OTID = 2)
  //** Financials (OTID = 182)
  getModuleRights() {
    let objectIds = '3,4,174,175'; //calls module rights api for these ObjectTypeId's
    this.dashboardService
      .getClientPreference('HidePremise')
      .pipe(
        map((resp) => {
          if (resp.success) {
            if (resp.data == 0) {
              objectIds = '3,4,2,174,175';
            }
          }
        })
      )
      .subscribe(
        () => {
          this.service.getUserModuleRights(objectIds).subscribe(
            (res: any) => {
              this.addButtonObjects = res.data.filter((v) => v.hasAddRights);
            },
            (error: any) =>
              this.toastService.show(
                'Error occurred getting addMenu items: ' + error,
                '',
                ToastState.ERROR,
                {
                  position: 'bottom right',
                  maxWidth: '350px',
                }
              )
          );
        },
        (error: any) =>
          this.toastService.show(
            'Error occurred getting client preferences of premise visibility: ' +
              error,
            '',
            ToastState.ERROR,
            {
              position: 'bottom right',
              maxWidth: '350px',
            }
          ),
        () => {}
      );
  }

  getNavigationLink(objectTypeId: number) {
    if (objectTypeId == PREMISE_WIZARD_OTID) {
      this.showAddPremisePopup();
    }
    if (objectTypeId == BUILDING_WIZARD_OTID) {
      this.showAddBuildingPopup();
    }

    if (objectTypeId == LEASE_WIZARD_OTID) {
      this.showAddLeasePopup();
    }

    if (objectTypeId === SUPPLIER_WIZARD_OTID) {
      this.showAddSupplierPopup();
    }

    if (objectTypeId == EQUIPMENT_WIZARD_OTID) {
      this.showAddEquipmentPopup();
    }

    if (objectTypeId == AI_LEASE_WIZARD_OTID) {
      this.showAddAiLeasePopup();
    }
  }

  showAddSupplierPopup(): void {
    const dialogRef = this.dialog.open(AddSupplierModalComponent, {
      disableClose: true,
      width: '60vw',
      minWidth: '320px',
      maxWidth: '1100px',
      minHeight: '420px',
      maxHeight: '90vh',
      data: {
        objectTypeId: this.objectTypeId,
      },
    });
    dialogRef.afterClosed();
  }

  showAddEquipmentPopup() {
    const dialogRef = this.dialog.open(AddEquipmentModalComponent, {
      disableClose: true,
      width: '60vw',
      minWidth: '320px',
      maxWidth: '1100px',
      minHeight: '420px',
      data: {
        objectTypeId: this.objectTypeId,
        userId: 2,
      },
    });

    dialogRef.afterClosed();
  }

  // Add Store
  showAddPremisePopup() {
    // todo: this code seems to be a duplication of the Portfolio Dashboard options for retaildemo
    const dialogRef = this.dialog.open(AddPremiseModalComponent, {
      disableClose: true,
      width: '45vw',
      minWidth: '320px',
      maxWidth: '1100px',
      minHeight: '420px',
      maxHeight: '90vh',
      data: {
        objectTypeId: this.objectTypeId,
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.reLoadGrid.emit(true);
    });
  }

  showAddBuildingPopup() {
    const dialogRef = this.dialog.open(AddBuildingModalComponent, {
      disableClose: true,
      width: '75vw',
      minWidth: '320px',
      maxWidth: '1100px',
      minHeight: '420px',
      maxHeight: '90vh',
      data: {
        objectTypeId: this.objectTypeId,
        userId: 2,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.reLoadGrid.emit(true);
    });
  }

  showAddAiLeasePopup() {
    const dialogRef = this.dialog.open(AddAiLeaseModalComponent, {
      disableClose: true,
      width: '70vw',
      minWidth: '320px',
      maxWidth: '1100px',
      minHeight: '420px',
      maxHeight: '90vh',
      data: {
        objectTypeId: this.objectTypeId,
        userId: 2,
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.reLoadGrid.emit(true);
    });
  }

  showAddLeasePopup() {
    const dialogRef = this.dialog.open(AddLeaseModalComponent, {
      disableClose: true,
      width: '70vw',
      minWidth: '320px',
      maxWidth: '1100px',
      minHeight: '420px',
      maxHeight: '90vh',
      data: {
        objectTypeId: this.objectTypeId,
        userId: 2,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.reLoadGrid.emit(true);
    });
  }
}
