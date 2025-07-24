import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as AppActions from '../app.actions';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { SharedLeftNavLink } from 'libs/data-models/lib-data-models/src/lib/models/link.interface';
import { MangoAppFacade } from '../app.facade';
import { combineLatest, of } from 'rxjs';
import { MangoNavigationService } from '@mangoSpa/src/app/services/navigation.service';
import { ProjectsDashboardLeftNavService } from '@micro-components/services/projects-dashboard-left-nav.service';
import { MangoSubApps } from '@mango/data-models/lib-data-models';
import { RedirectorMapping } from 'libs/data-models/lib-data-models/src/lib/models/redirector-links.interface';

@Injectable()
export class NavigationEffect {
  constructor(
    private actions$: Actions,
    private facade: MangoAppFacade,
    private mangoNavigationService: MangoNavigationService,
    private leftNavService: ProjectsDashboardLeftNavService
  ) {}

  loadLeftNavLinks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActions.loadLeftNavLinks),
      switchMap((_) => {
        return combineLatest([
          this.facade.authenticatedUser$,
          this.facade.showSubLeftNav$,
          this.facade.moduleId$,
          this.facade.currentRenderFormDocumentParams$,
          this.facade.currentSubApp$,
          this.facade.redirectorMappings$,
        ]);
      }),
      filter(([user]) => !!user),
      switchMap(
        ([
          _,
          showSubLeftNav,
          moduleId,
          url,
          currentSubApp,
          redirectorMappings,
        ]) => {
          let serviceCall$;

          if (!showSubLeftNav && !!!moduleId) {
            serviceCall$ = of(null);
          } else if (showSubLeftNav) {
            serviceCall$ =
              this.leftNavService.getModuleNavigationLinksForRenderForm(
                url,
                redirectorMappings
              );
          } else if (moduleId === 6 && currentSubApp !== MangoSubApps.ADMIN) {
            serviceCall$ =
              currentSubApp === MangoSubApps.ETL
                ? this.leftNavService.getModuleNavigationLinks(moduleId)
                : this.leftNavService.getAdminModulesNavigationLinks(moduleId);
          } else {
            serviceCall$ =
              this.leftNavService.getModuleNavigationLinks(moduleId);
          }

          return serviceCall$.pipe(
            map((response) => ({
              response,
              moduleId,
              currentSubApp,
            }))
          );
        }
      ),
      map(({ response, moduleId, currentSubApp }) => {
        const navLinksFetched =
          !(moduleId === 6 && currentSubApp === MangoSubApps.ADMIN) &&
          response !== null;
        const navigationLinks = !!response ? response.data : [];
        const activeLink = navigationLinks[0]?.name || null;

        return AppActions.loadLeftNavLinksSuccess({
          navigationLinks,
          activeLink,
          navLinksFetched,
        });
      })
    )
  );

  navigateLeftNavMenu$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActions.NAVIGATE_LEFT_NAV_MENU),
        switchMap((action) =>
          combineLatest([
            of(action),
            this.facade.clientKey$,
            this.facade.redirectorMappings$,
          ])
        ),
        map(
          ([{ navLink }, clientKey, redirectorMappings]: [
            { navLink: SharedLeftNavLink },
            string,
            RedirectorMapping[]
          ]) =>
            this.mangoNavigationService.handleLeftNavNavigation(
              navLink,
              clientKey,
              redirectorMappings
            )
        )
      ),
    { dispatch: false }
  );

  navigateHome$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActions.NAVIGATE_HOME),
      map((_) => this.mangoNavigationService.navigateHome()),
      switchMap((_) => of(AppActions.setLoading({ display: false })))
    )
  );

  goToExternalURL = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActions.GO_TO_EXTERNAL_URL),
        map((action: { url: string }) => action.url),
        tap((url) => (window.location.href = url))
      ),
    { dispatch: false }
  );
}
