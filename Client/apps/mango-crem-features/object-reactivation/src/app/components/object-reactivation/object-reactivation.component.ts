import { Component, ViewChild } from '@angular/core';
import { ObjectReactivationService } from './../../services/object-reactivation.service';
import { Observable, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  ReactivationListRequest,
  ReactivationObjectType,
  ReactivationUpdateListRequest,
} from '../../../../../../../libs/data-models/lib-data-models/src/lib/models/object-reactivation/reactivation-object-type';
import { ReactivationClientPreferences } from '../../../../../../../libs/data-models/lib-data-models/src/lib/models/object-reactivation/reactivation-client-preferences';
import { DxDataGridComponent, DxDataGridModule } from 'devextreme-angular';
import { CommonModule } from '@angular/common';
import {
  ButtonModule,
  InputLabelComponent,
  CardModule,
  DescriptionsComponent,
  DropdownModule,
  DropdownComponent,
  PageHeaderComponent,
  SearchComponent,
  ToastComponent,
  NoObjectsFoundComponent,
  CremToastService,
} from '@mango/ui-shared/lib-ui-elements';
import { DxDataGridTypes } from 'devextreme-angular/ui/data-grid';
import {
  ContactRecord,
  ObjectType,
  ToastState,
} from '../../../../../../../libs/data-models/lib-data-models/src';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { environment } from '@mangoSpa/src/environments/environment.local';
import { Router } from '@angular/router';
import { TooltipModule } from '../../../../../../../libs/ui-shared/lib-ui-elements/src/lib/tooltip';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    InputLabelComponent,
    NoObjectsFoundComponent,
    DropdownModule,
    DxDataGridModule,
    ButtonModule,
    PageHeaderComponent,
    DescriptionsComponent,
    SearchComponent,
    ToastComponent,
    TooltipModule,
  ],
  selector: 'app-object-reactivation',
  templateUrl: './object-reactivation.component.html',
  styleUrls: ['./object-reactivation.component.scss'],
})
export class ObjectReactivationComponent {
  @ViewChild('ReactivationDataGrid', { static: false })
  reactivationDataGrid: DxDataGridComponent;
  @ViewChild(DropdownComponent) cremDropdownComponent: DropdownComponent;
  externalCremLink: string;
  public pageTitle = 'Reactivate Objects';
  objectTypeId: number = 4;
  selectedItemIds: any = [];
  subs: Subscription[] = [];
  reactivationDataList: any[];
  filteredData: ReactivationObjectType[];
  clientPreferences: ReactivationClientPreferences;
  IsPremiseHidden: number = 0;
  public selectedFilter?: ReactivationObjectType;
  toolTipData: any;
  reactivateButtonCaption: string;
  reactivateButtonTitle: string =
    'Select an item from the list below to reactivate.';
  isUserDatesEU: boolean = false;
  hasFiltersSelected: boolean = false;
  currentUserInfo$: Observable<ContactRecord>;

  constructor(
    private objectReactivationService: ObjectReactivationService,
    private toastService: CremToastService,
    private facade: MangoAppFacade
  ) {}

  ngOnInit(): void {
    this.reactivateButtonCaption = ` Reactivate `;
    this.facade.clientKey$.subscribe((clientKey) => {
      this.externalCremLink = `${environment.cremBaseUrl.replace(
        '[CLIENT]',
        clientKey
      )}/v06/Admin/AdminHome2.aspx`;
    });
    this.currentUserInfo$ = this.facade.contactRecord$;

    this.subs.push(
      this.currentUserInfo$.subscribe((contact) => {
        this.isUserDatesEU = contact.preferences?.contactDatesEU;
      })
    );
    this.subs.push(
      this.objectReactivationService
        .getFilterData()
        .pipe(
          switchMap((res: any) => {
            if (res == null) {
              return of(false);
            }
            if (res.success) {
              let setReportNameCaption = res.data;
              setReportNameCaption = setReportNameCaption.map((val) => {
                if (val.objectTypeID == 7) val.objectType = `Ad Hoc Reports`;
                return val;
              });

              const filterItems = res.data;
              filterItems.sort((a, b) => {
                const typeNameA = this.removeSpaces(a.objectType).toUpperCase();
                const typeNameB = this.removeSpaces(b.objectType).toUpperCase();
                if (typeNameA < typeNameB) {
                  return -1;
                }
                if (typeNameA > typeNameB) {
                  return 1;
                }
                return 0;
              });

              this.filteredData = filterItems;
              this.selectedFilter = this.filteredData.find(
                (item) => item.objectTypeID === this.objectTypeId
              );
            }
            return this.objectReactivationService.getClientPreferences();
          }),
          switchMap((cp: any) => {
            if (cp == null) {
              return of(false);
            }

            if (cp.success) {
              this.clientPreferences = cp.data as ReactivationClientPreferences;
              this.IsPremiseHidden = this.clientPreferences
                ? this.clientPreferences.clientSetupFieldValue
                : 0;
              this.getToopTipData();

              const filteredOutIsPremiseHidden = this.filteredData.filter(
                (obj) => {
                  if (!(this.IsPremiseHidden === 1 && obj.objectTypeID == 2)) {
                    return obj;
                  }
                }
              );
              this.filteredData = filteredOutIsPremiseHidden;
            }

            const req: ReactivationListRequest = {
              IsPremiseHidden: this.IsPremiseHidden,
              PortfolioId: 0,
              ObjectTypeId: this.objectTypeId,
            };

            return this.objectReactivationService.getReactivationList(req);
          })
        )
        .subscribe((cpRes: any) => {
          if (
            this.objectTypeId == ObjectType.BUILDING ||
            this.objectTypeId == ObjectType.LEASE ||
            this.objectTypeId == ObjectType.CONTACT ||
            this.objectTypeId == ObjectType.REPORT ||
            this.objectTypeId == ObjectType.COMPANY
          ) {
            cpRes = this.getReactivationDateFormatedData(cpRes);
          }
          this.reactivationDataList = cpRes;
        })
    );
  }

  private removeSpaces(text: string): string {
    return text.replace(/\s/g, '');
  }

  onFilterChange(e: any[]): void {
    const filterBy: any = e?.[0]?.value || e?.[0];
    if (this.selectedFilter !== filterBy) {
      this.selectedFilter = filterBy;
      this.reactivationDataGrid.instance.clearFilter();
      //this.reactivationDataList = [];
      const req: ReactivationListRequest = {
        IsPremiseHidden: this.IsPremiseHidden,
        PortfolioId: 0,
        ObjectTypeId: filterBy.objectTypeID,
      };
      this.filterReactivationData(req);
      this.getToopTipData();
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  private filterReactivationData(req: ReactivationListRequest) {
    this.subs.push(
      this.objectReactivationService
        .getReactivationList(req)
        .subscribe((reactivationdata: any) => {
          if (
            req.ObjectTypeId == ObjectType.BUILDING ||
            req.ObjectTypeId == ObjectType.LEASE ||
            req.ObjectTypeId == ObjectType.CONTACT ||
            req.ObjectTypeId == ObjectType.REPORT ||
            req.ObjectTypeId == ObjectType.COMPANY
          ) {
            reactivationdata =
              this.getReactivationDateFormatedData(reactivationdata);
          }
          this.reactivationDataList = reactivationdata;
        })
    );
  }

  private getReactivationDateFormatedData(reactivationdata: any): any {
    reactivationdata = reactivationdata.map((val) => {
      for (var keys in val) {
        if (keys.includes('Archived Date')) {
          if (val['Archived Date']) {
            val[keys] = this.getUserPreferedDateFormat(val['Archived Date']);
          }
        }
        if (keys.includes('Expiration Date')) {
          if (val['Expiration Date']) {
            val[keys] = this.getUserPreferedDateFormat(val['Expiration Date']);
          }
        }
      }
      return val;
    });
    return reactivationdata;
  }

  private getUserPreferedDateFormat(curDateVal: any): string {
    let curDate = new Date(curDateVal);
    let curDtString = '';
    let month = '' + (curDate.getMonth() + 1);
    let day = '' + curDate.getDate();
    let year = '' + curDate.getFullYear();

    if (this.isUserDatesEU) {
      curDtString = [day, month, year].join('.');
    } else {
      curDtString = [month, day, year].join('/');
    }
    return curDtString;
  }

  private getToopTipData() {
    //this.selectedFilter?.objectTypeID
    this.toolTipData = `Reactivating a Building will only reactivate that Building.</br>`;
    if (this.IsPremiseHidden === 0) {
      this.toolTipData += `Reactivating a Premise will also reactivate any associated Buildings.</br>`;
      this.toolTipData += `Reactivating a Lease will also reactivate any associated Premises and Buildings.</br>`;
    } else {
      this.toolTipData += `Reactivating a Lease will also reactivate any associated Buildings.</br>`;
    }
    if (this.selectedFilter) {
      switch (this.selectedFilter?.objectTypeID) {
        case ObjectType.PREMISE:
          const regexPStr = /Premise/gi;
          this.toolTipData = (this.toolTipData as string).replace(
            regexPStr,
            this.selectedFilter?.objectType
          );
          break;
        case ObjectType.BUILDING:
          const regexBStr = /Building/gi;
          this.toolTipData = (this.toolTipData as string).replace(
            regexBStr,
            this.selectedFilter?.objectType
          );
          break;
        case ObjectType.LEASE:
          const regexLStr = /Lease/gi;
          this.toolTipData = (this.toolTipData as string).replace(
            regexLStr,
            this.selectedFilter?.objectType
          );
          break;
      }
    }
  }

  overrideOnContentReady(e) {
    /*  if (
      this.selectedFilter?.objectTypeID === 3 ||
      this.selectedFilter?.objectTypeID === 4
    ) { */
    this.reactivationDataGrid.instance.columnOption(
      'BuildingMasterGroupID',
      'visible',
      false
    );
    // }
  }

  searchDataGrid(searchText: string): void {
    this.reactivationDataGrid?.instance?.searchByText(searchText);
  }

  reactivateSelectedObjects() {
    const selectedItems = this.selectedItemIds; //this.reactivationDataGrid.selectedRowKeys;
    var result: any = [];
    if (this.selectedFilter) {
      switch (this.selectedFilter?.objectTypeID) {
        case ObjectType.PREMISE:
          result = selectedItems.map((a) => a.PremiseID);
          break;
        case ObjectType.BUILDING: 
          result = selectedItems.map((a) => a.BuildingID);
          break;
        case ObjectType.LEASE: 
          result = selectedItems.map((a) => a.LeaseAbstractID);
          break;
        case ObjectType.CONTACT: 
          result = selectedItems.map((a) => a.ContactID);
          break;
        case ObjectType.REPORT:
          result = selectedItems.map((a) => a.ReportID);
          break;
        case ObjectType.COMPANY: 
          result = selectedItems.map((a) => a.CompanyID);
          break;
      }
      this.selectedItemIds = result;
      if (this.selectedItemIds.length > 0) {
        const reqlist: ReactivationUpdateListRequest = {
          objectIds: this.selectedItemIds,
          objectTypeId: this.selectedFilter?.objectTypeID,
        };
        this.subs.push(
          this.objectReactivationService
            .updateReactivationListRecords(reqlist)
            .subscribe((res: any) => {
              if (res.success) {
                /* const msgString =
                  this.selectedItemIds.length > 1
                    ? 'Objects successfully reactivated.'
                    : 'Object successfully reactivated.'; 
                    */
                //const successMessage = `${this.selectedItemIds.length} ${this.selectedFilter?.objectType} ${msgString}`;
                const successMessage = `Object(s) reactivated successfully.`;
                this.toastService.show(successMessage, '', ToastState.SUCCESS, {
                  maxWidth: '500px',
                  duration: 5000,
                  closeOnClick: true,
                });

                const req: ReactivationListRequest = {
                  IsPremiseHidden: this.IsPremiseHidden,
                  PortfolioId: 0,
                  ObjectTypeId: this.selectedFilter?.objectTypeID ?? 0,
                };
                this.filterReactivationData(req);
              } else {
                const errorMessage = `Unable to save selected reactivation ${this.selectedFilter?.objectType} Objects, Please try again.`;
                this.toastService.show(
                  errorMessage,
                  'Reactivation Objects',
                  ToastState.ERROR,
                  {
                    maxWidth: '500px',
                    duration: 5000,
                    closeOnClick: true,
                  }
                );
              }
            })
        );
      }
    }
  }

  clearFilters(evt: MouseEvent) {
    evt.stopPropagation();
    this.reactivationDataGrid.instance.clearFilter();
  }

  handleFilterValuePropertyChange(e) {
    if (e.name === 'filterValue') {
      if (e.value) {
        this.hasFiltersSelected = true;
      } else {
        this.hasFiltersSelected = false;
      }
    }
  }

  resetSelectedObjects() {
    this.reactivationDataGrid.instance.clearSelection();
  }

  onSelectionChanged({
    selectedRowKeys,
  }: DxDataGridTypes.SelectionChangedEvent) {
    this.selectedItemIds = selectedRowKeys;
    const objTxt = this.selectedItemIds?.length <= 1 ? `Object` : `Objects`;
    if (this.selectedItemIds?.length == 0) {
      this.reactivateButtonCaption = ` Reactivate `;
      this.reactivateButtonTitle = `Select an item from the list below to reactivate.`;
    } else {
      this.reactivateButtonCaption = ` Reactivate ${this.selectedItemIds?.length} ${objTxt} `;
      this.reactivateButtonTitle = `Click to reactivate the selected object(s).`;
    }
  }
}
