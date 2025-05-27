import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  CookieService,
  CurrentObjectService,
  HeaderService,
  UtilitiesService,
} from '@mango/core-shared';
import {
  BookmarkGroup,
  BreadCrumb,
  RenderFormHeaderData,
  ToolbarModuleLink,
  V06Breadcrumb,
} from '@mango/data-models/lib-data-models';
import { ProjectsDashboardLeftNavService } from '@micro-components/services/projects-dashboard-left-nav.service';
import { searchResultsComponent } from '@quick-search/components/modal/search-results.component';
import { environment } from 'apps/mango/src/environments/environment.local';
import { SearchParams } from '@mango/data-models/lib-data-models';
import { SharedLeftNavLink } from 'libs/data-models/lib-data-models/src/lib/models/link.interface';
import { BookmarksComponent } from 'libs/ui-shared/lib-ui-elements/src/lib/bookmarks/bookmarks.component';
import { Observable, Subscription, combineLatest, of } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';
import { MangoAppFacade } from '../../+state/app/app.facade';
import { BookmarksService } from '../../../../../mango-crem-features/micro-components/src/app/services/bookmarks.service';
import { GlobalSessionService } from '../../services/global-session.service';
import { Renderer2 } from '@angular/core';
import {
  selectNavigationLinks,
  selectActiveLink,
  selectNavLinksFetched,
} from '../../+state/app/app.selectors';
import { Store } from '@ngrx/store';
import { RightsAuthGuard } from '../../services/guards/rights-auth.guard';

@Component({
  selector: 'mango-crem-component',
  templateUrl: './crem-component.html',
  styleUrls: ['./crem-component.scss'],
  // entryComponents: [RenderFormHeaderComponent] // @deprecated in Angular@16 https://stackoverflow.com/questions/77057726/entrycomponents-substitution-in-angular-16
})
export class CremComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('cremBookmark', { static: false })
  cremBookmarkComponent: BookmarksComponent;
  @ViewChild('appModule') appModule: ElementRef<HTMLDivElement>;

  navigationLinks: any = [];
  public navLinksFetched = false;
  toolbarModuleLinks: ToolbarModuleLink[];
  chipContent$: Observable<string> = this.facade.clientKey$.pipe(
    map((clientKey) => `${clientKey} - ${environment.name}`)
  );
  userAppType$: Observable<number> = this.facade.contactRecord$.pipe(
    filter((contact) => !!contact),
    switchMap((contact) => of(contact.userAppType))
  );
  popoverContent: string;
  activeLink: string = null;
  crumbActiveLink: string = null;
  querySearchParams: SearchParams;
  private subs: Subscription = new Subscription();

  /**
   * When `_useSearchModal` is true, search results will open in a modal; otherwise, they will be displayed on a page.
   *
   * @private _useSearchModal
   * @memberof CremComponent
   */
  private _useSearchModal = false as boolean;

  public searchResultsDialogRef: MatDialogRef<any> | null = null;

  public headerDefaultHeight: number;
  public showRenderFormPropertyHeader: boolean;
  public renderFormHeaderData: RenderFormHeaderData;

  bookmarkGroups: BookmarkGroup[] = null;
  public delineator = '»';
  navigationLinks$: Observable<any[]> = this.store.select(
    selectNavigationLinks
  );
  activeLink$: Observable<string | null> = this.store.select(selectActiveLink);
  navLinksFetched$: Observable<boolean> = this.store.select(
    selectNavLinksFetched
  );

  constructor(
    private router: Router,
    private store: Store,
    private activatedRoute: ActivatedRoute,
    private leftNavService: ProjectsDashboardLeftNavService,
    private headerService: HeaderService,
    private bookmarksService: BookmarksService,
    public dialog: MatDialog,
    public facade: MangoAppFacade,
    private renderer: Renderer2,
    private currentObjectService: CurrentObjectService,
    private rightsAuthGuard: RightsAuthGuard
  ) {}

  ngOnInit(): void {
    this.getToolbarModuleLinks();
    this.getDatabaseRestoreInfo();
    this.facade.refreshLeftSideNav();
    this.buildBreadCrumbs();
    this.addRightsGuardCheck();
    // Auto fill search form if search query params present
    this.activatedRoute.queryParams.subscribe((params) => {
      this.querySearchParams = params ?? {};
    });
  }

  ngAfterViewInit(): void {
    window.addEventListener(
      'ToogleBookmarkDrawer',
      this.openCloseBookmarkDrawer.bind(this)
    );

    window.addEventListener(
      'RenderFormShowPropertyHeader',
      this.showRenderFormHeader.bind(this)
    );

    window.addEventListener(
      'SetCustomLeftNavItems',
      this.setCustomLeftNavItems.bind(this)
    );

    this.updateHeight();
  }

  private getToolbarModuleLinks() {
    this.subs.add(
      this.headerService.getUserModules().subscribe({
        next: (res: any) => (this.toolbarModuleLinks = res.data),
      })
    );
  }

  private addRightsGuardCheck() {
    //Some routes we build dynamically in the left nav and we can not add the rights guard to them
    //We will check those routes here

    this.subs.add(
      this.router.events.subscribe(e => {
        let eventAsAny: any = e;
        let event = eventAsAny.hasOwnProperty("routerEvent") ? eventAsAny.routerEvent : eventAsAny;
        if (!!event && !!event.url && event.url.toString().toLowerCase().startsWith('/crem/forms/render-form')) {
          this.rightsAuthGuard.canActivate(null, event);
        }
      })
    );
  }

  private setCustomLeftNavItems(event: CustomEvent) {
    setTimeout(() => {
      this.navigationLinks = event.detail;
    });
  }

  private getDatabaseRestoreInfo() {
    this.subs.add(
      this.headerService.getDBLastRestore().subscribe({
        next: (res: any) => (this.popoverContent = res.data),
      })
    );
  }

  private openCloseBookmarkDrawer() {
    if (
      !this.cremBookmarkComponent.recentDrawer.opened &&
      this.bookmarkGroups === null
    ) {
      this.subs.add(
        this.bookmarksService.createBookmarkList().subscribe((res) => {
          this.bookmarkGroups = res;
        })
      );
    }

    this.cremBookmarkComponent.toggleBookmarkDrawer();
  }

  /**
   * Performs the search query using the `mango-header` search field
   *
   * @param {*} e
   * @memberof CremComponent
   */
  quickSearch(e: any) {
    // Perform the Search using the Modal
    if (this._useSearchModal) {
      if (this.searchResultsDialogRef) {
        this.searchResultsDialogRef.close();
        this.searchResultsDialogRef.afterClosed().subscribe(() => {
          this.openSearchModal(e);
        });
      } else {
        this.openSearchModal(e);
      }
    } else {
      // Use a page search
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/crem/search'], {
          queryParams: {
            fmodule: e.searchObjId,
            flikeclause: e.searchStr,
          },
        });
      });
    }
  }

  /**
   * Open the corresponding search modal when `_useSearchModal` is true
   *
   * @param {*} event
   * @memberof CremComponent
   */
  openSearchModal(event: any) {
    this.searchResultsDialogRef = this.dialog.open(searchResultsComponent, {
      hasBackdrop: false,
      width: '90vw',
      minWidth: '320px',
      maxWidth: '1100px',
      minHeight: '420px',
      maxHeight: '90vh',
      panelClass: 'mqs-search-results',
      data: {
        searchString: event.searchStr,
        searchObjectId: event.searchObjId,
      },
      disableClose: true,
    });

    this.searchResultsDialogRef.afterClosed().subscribe(() => {
      this.searchResultsDialogRef = null;
    });
  }

  navigateLeftNavMenu(navLink: SharedLeftNavLink) {
    this.facade.navigateLeftNavMenu(navLink);
  }

  navigateToBreadcrumb(breadcrumb: BreadCrumb) {
    this.activeLink = breadcrumb.activeLink;
    this.router.navigate([breadcrumb.url], { queryParams: breadcrumb.params });
  }

  getActiveLink(toActiveLink: string) {
    this.activeLink = toActiveLink;
  }

  buildBreadCrumbs() {
    // If the breadcrumbs get updated
    // then update the activeLink accordingly
    this.subs.add(
      this.facade.breadcrumbs$
        .pipe(
          map((breadcrumbs) => {
            if (!breadcrumbs || breadcrumbs.length === 0) {
              return;
            }
            const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
            this.activeLink = lastBreadcrumb.activeLink;
          })
        )
        .subscribe()
    );

    const sharedBreadcrumbs = this.loadSharedBreadCrumbs();
    if (sharedBreadcrumbs.length > 0) {
      this.facade.setBreadcrumbs(sharedBreadcrumbs);
    }

    // Populate breadcrumbs for the app
    this.crumbActiveLink = null;

    this.subs.add(
      this.router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          startWith(this.router),
          withLatestFrom(this.facade.breadcrumbs$.pipe(distinctUntilChanged())),
          switchMap(([e, sourceBreadcrumbs]) =>
            combineLatest([
              of(e),
              of(sourceBreadcrumbs),
              this.currentObjectService.getCurentObjectNameAndType$(),
            ])
          ),
          map(([e, sourceBreadcrumbs, currentObject]) => {
            let breadcrumbs: BreadCrumb[] = [];
            breadcrumbs = [...(sourceBreadcrumbs ?? [])];

            let currentRoute = this.activatedRoute.snapshot;
            let url = '';
            let currentRouteContainsOID = true;

            const lastCrumb: BreadCrumb = breadcrumbs[breadcrumbs.length - 1];

            // Check if breadcrumb contains OID
            const lastBreadCrumbObjectId =
              this.getObjectIdFromBreadCrumb(lastCrumb);

            while (currentRoute) {
              if (currentRoute.url.length > 0) {
                url +=
                  '/' +
                  currentRoute.url.map((segment) => segment.path).join('/');
              }

              const routeBreadcrumbData = currentRoute.data.breadCrumb;
              if (!routeBreadcrumbData || !routeBreadcrumbData.label) {
                currentRoute = currentRoute.firstChild;
                continue;
              }

              // Check if current route contain OID query param
              const currentRouteObjectId: number = parseInt(
                currentRoute.queryParams.oid
              );
              if (isNaN(currentRouteObjectId) && currentRouteContainsOID) {
                // If the page we are going to is NOT object specific,
                // need to continue modifying the breadcrumbs (e.g. clicking 'Projects' top module)
                currentRouteContainsOID = false;
                breadcrumbs = [];
              }

              // If current route contains OID query param AND the last breadcrumb contains OID param, do nothing.
              // Aka if we are on an object specific page, stop adding breadcrumbs past the object name breadcrumb
              let isSameObject =
                currentRouteObjectId === lastBreadCrumbObjectId;
              if (lastBreadCrumbObjectId > 0 && currentRouteObjectId > 0) {
                if (!isSameObject) {
                  // Update last breadcrumb to the new object
                  let updatedCrumb = {
                    ...lastCrumb,
                    label: currentObject.objectName,
                    params: currentRoute.queryParams,
                  };
                  breadcrumbs = [...breadcrumbs.slice(0, -1), updatedCrumb];
                  this.facade.setBreadcrumbs(breadcrumbs);
                  GlobalSessionService.setBreadcrumbsCookieProperty(
                    breadcrumbs
                  );
                }

                return breadcrumbs;
              }

              this.crumbActiveLink =
                routeBreadcrumbData.activeLink || this.crumbActiveLink;

              const breadCrumb: BreadCrumb = {
                label: routeBreadcrumbData.label,
                url: url,
                params: currentRoute.queryParams,
                activeLink: routeBreadcrumbData.activeLink
                  ? routeBreadcrumbData.activeLink
                  : this.activeLink,
              };

              let duplicate = breadcrumbs.find(
                (x) => x.label === breadCrumb.label && x.url === breadCrumb.url
              );

              // Projects page special handling
              let isProject = breadCrumb.url.includes('project');
              if (
                isProject &&
                currentRouteObjectId > 0 &&
                breadcrumbs.length >= 1
              ) {
                breadCrumb.label = currentObject.objectName;
              }

              // For pages like dynamic forms special handling
              if (!isProject && currentRouteObjectId > 0) {
                breadCrumb.label = currentObject.objectName;
              }

              if (routeBreadcrumbData.append && !duplicate) {
                breadcrumbs.push(breadCrumb);
              }

              currentRoute = currentRoute.firstChild;
            }

            if (breadcrumbs.length === 1 && breadcrumbs[0].params.oid) {
              const initialBreadCrumbs = this.populateInitialBreadCrumbs(
                breadcrumbs[0].params.otid
              );
              breadcrumbs.unshift(...initialBreadCrumbs);
            }

            this.facade.setBreadcrumbs(breadcrumbs);
            GlobalSessionService.setBreadcrumbsCookieProperty(breadcrumbs);

            return breadcrumbs;
          })
        )
        .subscribe()
    );

    // Original
    // this.subs.add(
    //   this.router.events
    //     .pipe(
    //       filter(
    //         (event) =>
    //           event instanceof NavigationEnd
    //       ),
    //       startWith(this.router),
    //       // gets called multiple times?
    //       // what if we use take(1)?
    //       // switchMap(() =>
    //       //   combineLatest([
    //       //     this.facade.breadcrumbs$,
    //       //   ])
    //       // ),
    //       map((e) => {
    //         // get the breadCrumbs from the cookie here instead of building it from scratch.
    //         let breadcrumbs = [];
    //         if (isFirstLoad) {
    //           breadcrumbs = sharedBreadcrumbs;
    //           this.facade.setBreadcrumbs(breadcrumbs); // temp
    //           // GlobalSessionService.setBreadcrumbsCookieProperty(breadcrumbs);
    //           return breadcrumbs;
    //         }

    //         let currentRoute = this.activatedRoute.snapshot;
    //         let url = '';

    //         while (currentRoute) {
    //           const routeBreadcrumbData = currentRoute.data.breadCrumb;
    //           if (currentRoute.url.length > 0) {
    //             url +=
    //               '/' +
    //               currentRoute.url.map((segment) => segment.path).join('/');
    //           }

    //           if (routeBreadcrumbData && routeBreadcrumbData.label?.trim()) {
    //             this.crumbActiveLink =
    //               routeBreadcrumbData.activeLink || this.crumbActiveLink;

    //             const breadCrumb: BreadCrumb = {
    //               label: routeBreadcrumbData.label,
    //               url: url,
    //               params: currentRoute.queryParams,
    //               activeLink: routeBreadcrumbData.activeLink
    //                 ? routeBreadcrumbData.activeLink
    //                 : this.activeLink,
    //             };

    //             if (routeBreadcrumbData.append) {
    //               breadcrumbs.push(breadCrumb);
    //             }
    //           }
    //           currentRoute = currentRoute.firstChild;
    //         }

    //         this.facade.setBreadcrumbs(breadcrumbs);
    //         GlobalSessionService.setBreadcrumbsCookieProperty(breadcrumbs);
    //         return breadcrumbs;
    //       })
    //     )
    //     .subscribe()
    // );
  }

  // If the user manually navigates to an object specific page (e.g. render form page),
  // they will only have the one object name breadcrumb (e.g. render form lease name).
  // This function builds the breadcrumb hierarchy
  populateInitialBreadCrumbs(objectTypeId: any): BreadCrumb[] {
    const breadcrumbMap: { [key: number]: BreadCrumb[] } = {
      1: [
        this.createDefaultBreadCrumb(
          'Projects',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'projects'])
          ),
          'Projects'
        ),
        this.createDefaultBreadCrumb(
          'Tasks',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'projects', 'tasks'])
          ),
          'Tasks'
        ),
      ],
      3: [
        this.createDefaultBreadCrumb(
          'Portfolio',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'portfolio'])
          ),
          'Portfolio'
        ),
        this.createDefaultBreadCrumb(
          'Buildings',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'portfolio', 'buildings'])
          ),
          'Building'
        ),
      ],
      4: [
        this.createDefaultBreadCrumb(
          'Portfolio',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'portfolio'])
          ),
          'Portfolio'
        ),
        this.createDefaultBreadCrumb(
          'Leases',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'portfolio', 'leases'])
          ),
          'Abstract'
        ),
      ],
      5: [
        this.createDefaultBreadCrumb(
          'Contacts',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'contacts'])
          ),
          'Contacts'
        ),
        this.createDefaultBreadCrumb(
          'Contacts',
          this.router.serializeUrl(
            this.router.createUrlTree(['crem', 'contacts', 'contacts-list'])
          ),
          'Contacts'
        ),
      ],
    };

    return (
      breadcrumbMap[objectTypeId] || [this.createDefaultBreadCrumb('', '', '')]
    );
  }

  private createDefaultBreadCrumb(
    label: string,
    url: string,
    activeLink: string
  ): BreadCrumb {
    return { label, url, activeLink };
  }

  private getObjectIdFromBreadCrumb(breadCrumb: BreadCrumb): number {
    if (!breadCrumb) return 0;

    if (breadCrumb.params?.oid) {
      return parseInt(breadCrumb.params.oid);
    }

    const queryParams = new URLSearchParams(breadCrumb.url);

    const lowerCaseParams = {};
    queryParams.forEach(
      (value, key) => (lowerCaseParams[key.toLowerCase()] = value)
    );

    const breadCrumbObjectId = lowerCaseParams['oid']
      ? parseInt(lowerCaseParams['oid'])
      : 0;

    return breadCrumbObjectId;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.updateHeight();
  }

  private showRenderFormHeader(event: CustomEvent) {
    if (event.detail instanceof RenderFormHeaderData) {
      this.renderFormHeaderData = event.detail;
      this.showRenderFormPropertyHeader = false; //this.renderFormHeaderData.isVisible;
      this.headerDefaultHeight = true //!this.renderFormHeaderData.isVisible
        ? 115
        : 240;
      this.updateHeight();
    }
  }

  private updateHeight() {
    if (this.appModule) {
      const windowHeight = window.innerHeight;
      const calculatedHeight = windowHeight - this.headerDefaultHeight;
      this.renderer.setStyle(
        this.appModule.nativeElement,
        'height',
        calculatedHeight + 'px'
      );
    }
  }

  // Load shared breadcrumbs from sharedInfo cookie
  private loadSharedBreadCrumbs(): BreadCrumb[] {
    let breadcrumbs: BreadCrumb[] = [];

    try {
      const sharedInfo = CookieService.getSharedInfoCookie();

      if (sharedInfo) {
        let v06Crumbs: V06Breadcrumb[] = JSON.parse(sharedInfo.BreadCrumbs);

        if (v06Crumbs?.length > 0) {
          breadcrumbs =
            GlobalSessionService.generateMangoBreadcrumbs(v06Crumbs);
        }
      }
    } catch (error) {
      console.error('Error loading shared breadcrumbs.');
    }

    return breadcrumbs;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
