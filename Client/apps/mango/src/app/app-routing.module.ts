import { NgModule } from '@angular/core';
import {
  ActivatedRoute,
  ExtraOptions,
  GuardsCheckEnd,
  GuardsCheckStart,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterEvent,
  RouterModule,
  Routes,
} from '@angular/router';
import {
  MangoSubApps,
  RenderFormHeaderData,
} from '@mango/data-models/lib-data-models';
import { Observable, Subscription, of } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { MangoAppFacade } from './+state/app/app.facade';
import { AppService } from './app.service';
import { ValidateComponent } from './components/auth/validate/validate.component';
import { CremComponent } from './components/crem-component';
import { AuthGuard } from './services/guards/auth.guard';
import { NotFoundPageComponent } from './components/not-found-page/not-found-page.component';
import { ErrorNotificationComponent } from './components/error-notification/error-notification.component';
import { RightsAuthGuard } from './services/guards/rights-auth.guard';
import { SessionExpiredComponent } from './components/auth/session-expired/session-expired.component';

export const routes: Routes = [
  // LOGIN
  {
    path: 'auth/validate',
    component: ValidateComponent,
  },

  // START PAGE
  {
    path: 'start-page',
    loadChildren: () =>
      import('@start-page/components/index/index.module').then(
        (mod) => mod.IndexModule
      ),
    data: {
      currentSubApp: MangoSubApps.START_PAGE,
      moduleId: null,
      breadCrumb: { label: 'Start Page', append: false },
    },
  },

  // MAIN APP
  {
    path: 'crem',
    component: CremComponent,

    canActivate: [AuthGuard],
    data: { breadCrumb: { label: null, append: false } },
    children: [
      // Redirect to initial App after logging in
      { path: '', redirectTo: 'projects', pathMatch: 'full' },

      // SEARCH PAGE
      {
        path: 'search',
        loadChildren: () =>
          import('@quick-search/components/index/index.module').then(
            (mod) => mod.IndexModule
          ),
      },

      {
        path: 'projects',
        data: {
          moduleId: 2,
          breadCrumb: {
            label: 'Projects',
            append: true,
            activeLink: 'Projects',
          },
        },
        children: [
          {
            path: '',
            canActivate: [RightsAuthGuard],
            loadChildren: () =>
              import('@project-dashboard/components/index/index.module').then(
                (mod) => mod.IndexModule
              ),
            data: {
              currentSubApp: MangoSubApps.PROJECTS_DASHBOARD,
              moduleId: 2,
              breadCrumb: {
                label: 'Projects Dashboard',
                append: false,
                activeLink: 'Dashboard',
              },
            },
          },
          {
            path: 'tasks',
            title: 'Tasks List',
            loadChildren: () =>
              import('@list-pages/components/index.module.hosted').then(
                (mod) => mod.IndexModule
              ),
            data: {
              moduleId: 2,
              objectTypeId: 9,
              currentSubApp: MangoSubApps.LIST_PAGES,
              breadCrumb: {
                label: 'Tasks',
                append: true,
                activeLink: 'Tasks',
              },
            },
          },
          {
            path: 'projects',
            title: 'Project List',
            loadChildren: () =>
              import('@list-pages/components/index.module.hosted').then(
                (mod) => mod.IndexModule
              ),
            data: {
              moduleId: 2,
              objectTypeId: 1,
              currentSubApp: MangoSubApps.LIST_PAGES,
              breadCrumb: {
                label: 'Projects',
                append: true,
                activeLink: 'Projects',
              },
            },
          },

          {
            path: 'teams',
            canActivate: [RightsAuthGuard],
            loadChildren: () =>
              import('@project-dashboard/components/teams/teams.module').then(
                (mod) => mod.TeamsModule
              ),
            data: {
              moduleId: 2,
              objectTypeId: null,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'project-tasks',
            loadChildren: () =>
              import(
                '@project-dashboard/components/project-tasks/project-tasks.module'
              ).then((mod) => mod.ProjectTasksModule),
            data: {
              currentSubApp: MangoSubApps.PROJECTS_DASHBOARD,
              breadCrumb: { append: false },
            },
          },

          {
            path: 'project-team',
            loadChildren: () =>
              import(
                '@project-dashboard/components/project-team/project-team.module'
              ).then((mod) => mod.ProjectTeamModule),
            data: {
              currentSubApp: MangoSubApps.PROJECTS_DASHBOARD,
              breadCrumb: { append: false },
            },
          },

          //Error Notification
          {
            path: 'error-notification',
            component: ErrorNotificationComponent,
          },
        ],
      },

      // STRATEGY
      {
        path: 'strategy',
        data: { breadCrumb: { label: null, append: false } },
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          {
            path: 'dashboard', // Todo: Temporary component pointing to 404
            children: [
              {
                path: '',
                component: NotFoundPageComponent,
              },
            ],
            data: {
              moduleId: null,
              currentSubApp: null,
              breadCrumb: {
                label: 'Strategy Dashboard',
                append: false,
                activeLink: 'Dashboard',
              },
            },
          },
        ],
      },

      // PORTFOLIO
      {
        path: 'portfolio',
        data: {
          moduleId: 1,
          breadCrumb: {
            label: 'Portfolio',
            append: true,
            activeLink: 'Portfolio',
          },
        },
        children: [
          {
            path: '',
            loadChildren: () =>
              import('@portfolio-dashboard/components/index/index.module').then(
                (mod) => mod.IndexModule
              ),
            data: {
              moduleId: 1,
              currentSubApp: MangoSubApps.PORTFOLIO_DASHBOARD,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'buildings',
            title: 'Buildings',
            loadChildren: () =>
              import('@list-pages/components/index.module.hosted').then(
                (mod) => mod.IndexModule
              ),
            data: {
              moduleId: 1,
              objectTypeId: 3,
              currentSubApp: MangoSubApps.LIST_PAGES,
              breadCrumb: {
                label: 'Buildings',
                append: true,
                activeLink: 'Buildings',
              },
            },
          },
          {
            path: 'leases',
            title: 'Leases',
            loadChildren: () =>
              import('@list-pages/components/index.module.hosted').then(
                (mod) => mod.IndexModule
              ),
            data: {
              moduleId: 1,
              objectTypeId: 4,
              currentSubApp: MangoSubApps.LIST_PAGES,
              breadCrumb: {
                label: 'Leases',
                append: true,
                activeLink: 'Leases',
              },
            },
          },
          {
            path: 'revenues',
            title: 'Revenues',
            loadChildren: () =>
              import('@list-pages/components/index.module.hosted').then(
                (mod) => mod.IndexModule
              ),
            data: {
              moduleId: 1,
              objectTypeId: 194,
              currentSubApp: MangoSubApps.REVENUES,
              breadCrumb: {
                label: 'Revenues',
                append: true,
                activeLink: 'Revenues',
              },
            },
          },
          {
            path: 'expenses',
            title: 'Expenses',
            loadChildren: () =>
              import('@list-pages/components/index.module.hosted').then(
                (mod) => mod.IndexModule
              ),
            data: {
              moduleId: 1,
              objectTypeId: 193,
              currentSubApp: MangoSubApps.EXPENSES,
              breadCrumb: {
                label: 'Expenses',
                append: true,
                activeLink: 'Expenses',
              },
            },
          },
          {
            path: 'ledgers',
            loadChildren: () =>
              import('@ledgers/app.module').then((mod) => mod.AppModule),
            data: {
              moduleId: 1,
              currentSubApp: MangoSubApps.LEDGERS_EXPORT_HISTORY,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'benchmarkingfiles',
            loadChildren: () =>
              import('@benchmarking-files/app.module').then(
                (mod) => mod.AppModule
              ),
            data: {
              moduleId: 1,
              currentSubApp: MangoSubApps.BENCHMARKING_FILES,
              breadCrumb: { append: true },
            },
          },
          {
            path: 'ai-abstractions',
            title: 'AI Lease Abstractions',
            loadChildren: () =>
              import('@mango/forms-shared').then((mod) => mod.AiModule),
            data: {
              moduleId: 1,
              currentSubApp: MangoSubApps.LIST_PAGES,
              breadCrumb: {
                label: 'AI Abstractions',
                append: true,
                activeLink: 'AI Abstractions',
              },
            },
          },
        ],
      },

      // ACCOUNTING PATH
      {
        path: 'accounting',
        data: {
          moduleId: 9,
          breadCrumb: {
            append: true,
            label: 'Accounting',
          },
        },
        children: [
          {
            path: 'ledgers',
            title: 'Accounting Ledgers',
            loadChildren: () =>
              import('@ledgers/app.module').then((mod) => mod.AppModule),
            data: {
              moduleId: 9,
              currentSubApp: MangoSubApps.LEDGERS_EXPORT_HISTORY,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'events',
            title: 'Accounting Events',
            loadChildren: () =>
              import(
                '@accounting-dashboard/components/listpage/accounting-listpage/accounting-listpage.module'
              ).then((mod) => mod.AccountingListpageModule),
            data: {
              moduleId: 9,
              objectTypeId: null,
              breadCrumb: { append: false },
            },
          },
          // Alerts
          {
            path: 'lease-alerts',
            title: 'Lease Alerts',
            loadChildren: () =>
              import('@lease-alerts/index/index.module').then(
                (mod) => mod.IndexModule
              ),
            data: {
              moduleId: 9,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'alerts-rules',
            title: 'Accounting Alerts',
            loadChildren: () =>
              import('@alerts-rules/index/index.module').then(
                (mod) => mod.IndexModule
              ),
            data: {
              moduleId: 9,
              currentSubApp: MangoSubApps.ALERT_RULES,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'batch-accounting',
            title: 'Batch Accounting',
            loadChildren: () =>
              import('@batch-accounting/index/index.module').then(
                (mod) => mod.IndexModule
              ),
            data: {
              moduleId: 9,
              currentSubApp: MangoSubApps.BATCH_ACCOUNTING,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'summary',
            title: 'Accounting Summary',
            canActivate: [RightsAuthGuard],
            loadChildren: () =>
              import('@accounting-summary/components/index/index.module').then(
                (mod) => mod.IndexModule
              ),
            data: {
              moduleId: 9,
              currentSubApp: MangoSubApps.BATCH_ACCOUNTING,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'accounting-history',
            title: 'Accounting History',
            loadChildren: () =>
              import('@accounting-history/app.module').then(
                (mod) => mod.AppModule
              ),
            data: {
              moduleId: 9,
              currentSubApp: MangoSubApps.ACCOUNTING_DASHBOARD,
              breadCrumb: {
                label: 'Accounting History',
                append: false,
                activeLink: 'Accounting',
              },
            },
          },
          // Accounting Settings
          {
            path: 'settings',
            title: 'Accounting Settings',
            loadChildren: () =>
              import(
                '@accounting-accountmanagement/components/index/index.module'
              ).then((mod) => mod.IndexModule),
            data: {
              moduleId: 9,
              currentSubApp: MangoSubApps.LEASE_ALERTS,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'discountrateprofiles',
            title: 'Discount Rate Profiles',
            loadChildren: () =>
              import('@accounting-profile/components/index/index.module').then(
                (mod) => mod.IndexModule
              ),
            data: {
              moduleId: 9,
              currentSubApp: MangoSubApps.ACCOUNTING_PROFILE,
              breadCrumb: { append: false },
            },
          },
          {
            path: '',
            loadChildren: () =>
              import(
                '@accounting-dashboard/components/index/index.module'
              ).then((mod) => mod.IndexMainModule),
            data: {
              moduleId: 9,
              currentSubApp: MangoSubApps.ACCOUNT_MANAGEMENT,
              breadCrumb: { append: false },
            },
          },
        ],
      },

      // CONTACTS
      {
        path: 'contacts',
        data: { moduleId: 3, breadCrumb: { label: null, append: false } },
        children: [
          { path: '', redirectTo: 'companies-list', pathMatch: 'full' },
          {
            path: 'companies-list',
            title: 'Companies',
            loadChildren: () =>
              import('@list-pages/components/index.module.hosted').then(
                (mod) => mod.IndexModule
              ),
            data: {
              moduleId: 3,
              objectTypeId: 11,
              currentSubApp: MangoSubApps.LIST_PAGES,
              breadCrumb: {
                label: 'Companies',
                append: true,
                activeLink: 'Companies',
              },
            },
          },
          {
            path: 'contacts-list',
            title: 'Contacts',
            loadChildren: () =>
              import('@list-pages/components/index.module.hosted').then(
                (mod) => mod.IndexModule
              ),
            data: {
              moduleId: 3,
              objectTypeId: 5,
              currentSubApp: MangoSubApps.LIST_PAGES,
              breadCrumb: {
                label: 'Contacts',
                append: true,
                activeLink: 'Contacts',
              },
            },
          },
        ],
      },

      // REPORTS
      {
        path: 'reports',
        data: {
          moduleId: 4,
          breadCrumb: {
            label: 'Reports',
            append: true,
            activeLink: 'Reports',
          },
        },
        children: [
          {
            path: '',
            loadChildren: () =>
              import('@reports/components/index/index.module').then(
                (mod) => mod.IndexModule
              ),
            data: {
              currentSubApp: MangoSubApps.REPORTS,
              moduleId: 4,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'distribution-lists',
            title: 'Distribution List',
            loadChildren: () =>
              import(
                '@reports/components/distribution-lists/distribution-lists.module'
              ).then((mod) => mod.DistributionListsModule),
            data: {
              currentSubApp: MangoSubApps.REPORTS,
              moduleId: 4,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'data-set-dictionary',
            title: 'Data Set Dictionary',
            loadChildren: () =>
              import('@data-set-dictionary/components/index/index.module').then(
                (mod) => mod.IndexModule
              ),
            data: {
              currentSubApp: MangoSubApps.REPORTS,
              moduleId: 4,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'financial-reporting-settings',
            title: 'Financial Reporting',
            loadChildren: () =>
              import(
                '@financial-reporting-settings/components/index/index.module'
              ).then((mod) => mod.IndexModule),
            data: {
              currentSubApp: MangoSubApps.REPORTS,
              moduleId: 4,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'reminders',
            title: 'Reminders',
            canActivate: [RightsAuthGuard],
            loadComponent: () =>
              import(
                '@reminders-list/components/reminders-list/reminders-list.component'
              ).then((mod) => mod.RemindersListComponent),
            data: {
              currentSubApp: MangoSubApps.REPORTS,
              moduleId: 4,
              breadCrumb: { label: 'Reminders', append: true },
            },
          },
        ],
      },

      // Object History
      {
        path: 'view-history',
        canActivate: [RightsAuthGuard],
        data: {
          moduleId: 1,
          breadCrumb: {
            label: 'View History',
            append: true,
            activeLink: 'View History',
          },
        },
        children: [
          {
            path: '',
            title: 'Object History',
            loadComponent: () =>
              import(
                '@reminders-list/components/object-history/object-history.component'
              ).then((mod) => mod.ObjectHistoryComponent),
            data: {
              moduleId: null,
              breadCrumb: { append: true },
            },
          },
        ],
      },
      // Security Rights
      {
        path: 'admin/object-maintenance/objectrights',
        title: 'Security Rights',
        canActivate: [RightsAuthGuard],
        data: {
          moduleId: 1,
          breadCrumb: {
            label: 'Security Rights',
            append: true,
            activeLink: 'Security Rights',
          },
        },
        children: [
          {
            path: '',
            title: 'Object Security Rights',
            loadComponent: () =>
              import(
                '@object-maintenance/components/object-security-rights/object-security-rights.component'
              ).then((mod) => mod.ObjectSecurityRightsComponent),
            data: {
              moduleId: null,
              breadCrumb: { append: true },
            },
          },
        ],
      },

      // NOTES
      {
        path: 'notes',
        title: 'Object Notes',
        data: { moduleId: 1, breadCrumb: { label: 'Notes', append: true } },
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                '@notes-list/components/notes-list/notes-list.component'
              ).then((mod) => mod.NotesListComponent),
            data: {
              moduleId: null,
              breadCrumb: { append: true },
            },
          },
        ],
      },
      // Files
      {
        path: 'files',
        title: 'Files',
        data: { moduleId: 1, breadCrumb: { label: 'Files', append: true } },
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                '@files-list/components/files-list/files-list.component'
              ).then((mod) => mod.FilesListComponent),
            data: {
              moduleId: null,
              breadCrumb: { append: true },
            },
          },
        ],
      },

      // ADMIN
      {
        path: 'admin',
        data: {
          moduleId: 6,
          breadCrumb: { label: 'Admin', append: true, activeLink: 'Admin' },
        },
        children: [
          {
            path: '',
            loadChildren: () =>
              import(
                '@user-maintenance/components/admin-landing-page/admin.module'
              ).then((mod) => mod.AdminModule),
            data: {
              moduleId: 6,
              currentSubApp: MangoSubApps.ADMIN,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'user-maintenance',
            title: 'User Maintenance',
            loadChildren: () =>
              import('@user-maintenance/components/index/index.module').then(
                (mod) => mod.IndexModule
              ),
            data: {
              currentSubApp: MangoSubApps.USER_MAINTENANCE,
              moduleId: 6,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'service-accounts',
            title: 'Service Accounts',
            loadChildren: () =>
              import('@service-accounts/components/index/index.module').then(
                (mod) => mod.IndexModule
              ),
            data: {
              currentSubApp: MangoSubApps.SERVICE_ACCOUNTS,
              moduleId: 6,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'object-reactivation',
            title: 'Object Reactivation',
            loadChildren: () =>
              import('@object-reactivation/app.module').then(
                (mod) => mod.AppModule
              ),
            data: {
              currentSubApp: MangoSubApps.OBJECT_REACTIVATION,
              moduleId: 6,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'group-maintenance',
            title: 'Group Maintenance',
            loadChildren: () =>
              import('@group-maintenance/components/index/index.module').then(
                (mod) => mod.IndexModule
              ),
            data: {
              currentSubApp: MangoSubApps.GROUP_MAINTENANCE,
              moduleId: 6,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'object-maintenance',
            title: 'Object Maintenance',
            loadChildren: () =>
              import('@object-maintenance/components/index/index.module').then(
                (mod) => mod.IndexModule
              ),
            data: {
              currentSubApp: MangoSubApps.OBJECT_MAINTENANCE,
              moduleId: 6,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'portfolio-maintenance',
            title: 'Portfolio Maintenance',
            loadChildren: () =>
              import(
                '@portfolio-maintenance/components/index/index.module'
              ).then((mod) => mod.IndexModule),
            data: {
              currentSubApp: MangoSubApps.PORTFOLIO_MAINTENANCE,
              moduleId: 6,
              breadCrumb: { append: false },
            },
          },
          {
            path: 'forms-maintenance',
            title: 'Forms Maintenance',
            loadChildren: () =>
              import('@forms/index/index.module').then(
                (mod) => mod.IndexModule
              ),
            data: {
              currentSubApp: MangoSubApps.FORMS_MAINTENANCE,
              moduleId: 6,
              breadCrumb: { label: null, append: true },
            },
          },
          {
            path: 'etl',
            title: 'ETL',
            loadChildren: () =>
              import('@etl/app.module').then((mod) => mod.AppModule),
            data: {
              currentSubApp: MangoSubApps.ETL,
              moduleId: 6,
              breadCrumb: { label: 'ETL', append: true, activeLink: 'ETL' },
            },
          },
        ],
      },

      //FORMS
      {
        path: 'forms',
        loadChildren: () =>
          import('@forms/index/index.module').then((mod) => mod.IndexModule),
      },

      //Costar Matching
      {
        path: 'costar-matching',
        title: 'Costar Matching',
        loadChildren: () =>
          import('@costar-matching/app.module').then((mod) => mod.AppModule),
      },
      //Error Notification
      {
        path: 'error-notification',
        title: 'Error Notification',
        component: ErrorNotificationComponent,
        data: {
          moduleId: null,
        },
      },

      // Auto-generated components below
      // @!micro-component-generator: don't delete this line
    ],
  },

  // Redirect to Login
  { path: '', redirectTo: 'crem', pathMatch: 'full' },

  // 401 - SESSION EXPIRED
  {
    path: 'auth/session-expired',
    title: 'Session Expired',
    component: SessionExpiredComponent,
  },

  // 404
  {
    path: '**',
    title: 'Page Not Found',
    component: CremComponent,
    children: [
      {
        path: '',
        component: NotFoundPageComponent,
      },
    ],
  },
];

const routerOptions: ExtraOptions = {
  scrollPositionRestoration: 'enabled',
  anchorScrolling: 'enabled',
  onSameUrlNavigation: 'reload',
  scrollOffset: [0, 50],
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule],
})
export class AppRoutingModule {
  subs: Subscription = new Subscription();
  constructor(
    private facade: MangoAppFacade,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private appService: AppService
  ) {
    this.subs.add(
      this.router.events.subscribe(this.navigationInterceptor.bind(this))
    );
    this.subs.add(
      this.getCurrentSubApp().subscribe((currentSubApp) =>
        this.facade.loadSubApp(currentSubApp)
      )
    );
  }

  getCurrentSubApp(): Observable<MangoSubApps> {
    return this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.activatedRoute.snapshot),
      switchMap((route) => {
        while (route.firstChild) {
          route = route.firstChild;
        }
        return of(route.data['currentSubApp']);
      })
    );
  }

  raiseRenderFormShowPropertyHeader() {
    const renderFormHeaderData = new RenderFormHeaderData(false, null);
    const evt = new CustomEvent('RenderFormShowPropertyHeader', {
      detail: renderFormHeaderData,
    });
    window.dispatchEvent(evt);
  }

  // Loading Indicator using the router
  private navigationInterceptor(e: RouterEvent) {
    if (e instanceof NavigationStart) {
      this.raiseRenderFormShowPropertyHeader();
      this.facade.setLoading(true);
    }
    if (
      e instanceof NavigationEnd ||
      e instanceof NavigationCancel ||
      e instanceof NavigationError
    ) {
      if (e instanceof NavigationEnd) {
        this.appService.scrollTop(0, 0);
      }

      this.facade.setLoading(false);
      this.facade.setChangeLossPreventIsActive(false);
    }
  }
}
