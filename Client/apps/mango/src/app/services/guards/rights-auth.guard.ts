import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Subscription, of } from 'rxjs';
import { MangoNavigationService } from '../navigation.service';
import { MangoAppFacade } from '../../+state/app/app.facade';

@Injectable({
  providedIn: 'root',
})
export class RightsAuthGuard implements CanActivate {
  private subscriptions: Subscription[] = [];
  private routesObjectTypeIds: any[] = [];

  constructor(
    private navigationService: MangoNavigationService,
    private router: Router,
    private facade: MangoAppFacade
  ) {
    //Teams Template ObjectTypeId 161
    this.routesObjectTypeIds.push({
      route: '/crem/projects/teams',
      objectTypeId: 161,
      objectId: 0,
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  canActivate(
    activatedRouteSnapshot: ActivatedRouteSnapshot,
    routerStateSnapshot: RouterStateSnapshot
  ) {
    const urlParts = routerStateSnapshot.url.split('?');
    if (urlParts.length === 1) {
      let foundRoute = this.routesObjectTypeIds.find((roi) =>
        urlParts[0].toLowerCase().startsWith(roi.route)
      );
      if (foundRoute !== undefined) {
        urlParts.push(
          `otid=${foundRoute.objectTypeId}&oid=${foundRoute.objectId}`
        );
      } else {
        return of(true);
      }
    } else if (urlParts.length !== 2) {
      return of(true);
    }

    let queryParams = urlParts[1].toLowerCase().split('&');
    let objTypeId = queryParams
      .find((qp) => qp.indexOf('otid') >= 0)
      .split('=')[1];
    let objTypeIdIndex = [1, 2, 3, 4, 5, 11, 161].findIndex(
      (num) => num === Number(objTypeId)
    );

    if (objTypeIdIndex < 0) {
      return of(true);
    }

    this.subscriptions.push(
      this.navigationService
        .checkUserRights(urlParts[0], urlParts[1])
        .subscribe(
          (userHaveRights) => {
            if (!userHaveRights) {
              this.facade.showSubLeftNav(false);
              this.router.navigate([
                '/crem/error-notification',
                { errorCode: 'Forbidden' },
              ]);
            }

            return of(userHaveRights);
          },
          (err) => {
            console.log(err);
            this.router.navigate(['/crem/error-notification']);
          }
        )
    );
  }
}
