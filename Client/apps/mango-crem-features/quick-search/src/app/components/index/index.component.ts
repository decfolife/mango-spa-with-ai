import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { quickSearchResults } from '../../models/interfaces/quick-search-results.interface';
import { QuickSearchService } from '../../services/quick-search.service';
import {
  ApiResponse,
  RedirectorLinks,
  RedirectorLink,
} from '../../models/interfaces/quick-search-results.interface';
import {
  CremToastService,
  SelectedTab,
} from '@mango/ui-shared/lib-ui-elements';
import { ToastState } from '@mango/data-models/lib-data-models';
import { ContentReadyEvent, RowClickEvent } from 'devextreme/ui/data_grid';
import { CookieService } from '@mango/core-shared';

@Component({
  selector: 'mango-quick-search',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
})
export class IndexComponent implements OnInit {
  searchResults: quickSearchResults[];
  loading = true as boolean;
  selectedPanel = '' as string;
  redirectorLinks: RedirectorLink[];
  selectedTab: SelectedTab;
  private _skeletonInstances = 1;
  flikeclause: string;
  fmodule: number;
  emptyState = false;
  emptyType = 'Object not found';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private quickSearchService: QuickSearchService,
    private _toaster: CremToastService
  ) {}

  ngOnInit(): void {
    this.loading = true;

    this.activatedRoute.queryParams.subscribe(
      (res) => {
        this.flikeclause = res['flikeclause'];
        this.fmodule = res['fmodule'];

        if (this.flikeclause && this.fmodule) {
          CookieService.setQuickSearchCookieProperties(
            this.flikeclause,
            String(this.fmodule)
          );
          this.getSearchResultsData(this.flikeclause, this.fmodule);
          this.quickSearchService
            .getRedirectorLinkList()
            .subscribe((res: ApiResponse) => {
              this.redirectorLinks = (
                res.data as RedirectorLinks
              ).redirectorLinks;
            });
        } else {
          this.searchResults = [];
          this.loading = false;
          this.emptyState = true;
        }
      },
      (error: any) => {
        this.searchResults = [];
        this.loading = false;
        this.emptyState = true;
        this.emptyType = 'Error occurred';
        const message = 'Error occurred while getting Quick Search Results ';
        console.error('An error occurred: ', message, error);
        this._toaster.show(
          message ?? `An error occurred, please try again.`,
          'Error',
          ToastState.ERROR,
          {
            maxWidth: '360px',
            duration: 180000,
          }
        );
      }
    );
  }

  contentReady(event: ContentReadyEvent) {
    if (event.component.columnOption('OID', 'visible')) {
      event.component.columnOption('OID', 'visible', false);
    }

    if (event.component.columnOption('OTID', 'visible')) {
      event.component.columnOption('OTID', 'visible', false);
    }
  }

  getSearchResultsData(flikeclause: string, objectId: number) {
    this.emptyState = false;
    this.emptyType = 'Object not found';
    this.quickSearchService
      .getQuickSearchResults(flikeclause, objectId)
      .subscribe(
        (res: any) => {
          if (res.success) {
            if (res.data.listOfSearchResults.length > 0) {
              this.searchResults =
                res.data.listOfSearchResults.filter(
                  (object) => object.results.length
                ) ?? [];
              this.emptyState = this.searchResults.length === 0;
            } else {
              this.searchResults = [];
              this.emptyState = true;
              this.emptyType = 'Error occurred';
            }
            this.loading = false;
          } else {
            this.searchResults = [];
            this.emptyState = true;
            this.emptyType = 'Error occurred';
            this.loading = false;
          }
        },

        (error: any) => {
          this.searchResults = [];
          this.emptyState = true;
          this.emptyType = 'Error occurred';
          this.loading = false;
          const message = 'Error occurred while getting Quick Search Results ';
          console.error('An error occurred: ', message, error);
          this._toaster.show(
            message ?? `An error occurred, please try again.`,
            'Error',
            ToastState.ERROR,
            {
              maxWidth: '360px',
              duration: 180000,
            }
          );
        }
      );
  }

  onRowClick(event: RowClickEvent): void {
    const rowData = event.data;
    let objectResult: quickSearchResults | undefined;

    // If selected tab is not "All", use the tab to find the object type
    if (this.selectedTab && this.selectedTab.title !== 'All') {
      objectResult = this.searchResults.find(
        (searchResult) => searchResult.objectTypeType === this.selectedTab.title
      );
    } else {
      objectResult = this.searchResults.find((result) =>
        result.results.some((item) => item === rowData)
      );
    }

    if (objectResult) {
      const otid = +objectResult.objectTypeId;
      this.router.navigate(['/v06/Forms/RenderForm.aspx'], {
        queryParams: {
          oid: rowData.OID,
          otid: otid,
          ottid: rowData.OTID,
        },
      });
    }
  }

  onSelectedTabChange(e: SelectedTab) {
    this.selectedTab = e;
  }

  scrollToSection(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
