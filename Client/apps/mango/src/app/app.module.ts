import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatPasswordStrengthModule } from '@angular-material-extensions/password-strength';
import { HttpClientJsonpModule, HttpClientModule } from '@angular/common/http';
import {
  NavigationStart,
  Router,
  RouterEvent,
  TitleStrategy,
} from '@angular/router';
import {
  AuthService,
  HeaderService,
  LibCoreSharedModule,
  NotificationService,
  StorageService,
  UserService,
  UtilitiesService,
} from '@mango/core-shared';
import {
  CREM_FORCE_RELOGIN_URLS,
  Environment,
  IS_CA_STANDALONE_APP,
  OAUTH_REDIRECT_QUERY_PARAM,
  RUNNING_IN_MANGO_SPA,
} from '@mango/data-models/lib-data-models';
import { LibExternalLibrariesModule } from '@mango/ui-shared/lib-external-libraries';
import { LibUiSharedModule } from '@mango/ui-shared/lib-ui-shared';
import { ProjectsDashboardLeftNavService } from '@micro-components/services/projects-dashboard-left-nav.service';
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { CentralAuthErrorHandler } from 'apps/mango-crem-features/central-auth/src/app/services/error-handler.service';
import { ToastrModule } from 'ngx-toastr';
import { combineLatest, of } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { BookmarksService } from '../../../mango-crem-features/micro-components/src/app/services/bookmarks.service';
import { environment } from '../environments/environment.local';
import { MangoAppFacade } from './+state/app/app.facade';
import * as fromApp from './+state/app/app.reducer';
import { AuthenticationEffects } from './+state/app/effects/authentication.effects';
import { InitSetupEffects } from './+state/app/effects/init-setup.effects';
import { NavigationEffect } from './+state/app/effects/navigation.effects';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppService } from './app.service';
import { CremModule } from './components/crem-component/crem.module';
import { LoadingScreenComponent } from './components/loading-screen/loading-screen.component';
import { MangoNavigationService } from './services/navigation.service';
import { CustomSerializer } from './utils/custom-route-serializer';
//import { GlobalSessionEffects } from './+state/app/effects/global-session.effects';
import { ValidateComponent } from './components/auth/validate/validate.component';
import { SessionExpiredComponent } from './components/auth/session-expired/session-expired.component';
import { contactRecord } from './+state/app/app.selectors';
import { EmulateUserEffects } from './+state/app/effects/emulate-user.effects';
import { IdleEffects } from './+state/app/effects/idle.effects';
import { IdleTimeoutPopupComponent } from './components/idle-timeout-popup/idle-timeout-popup.component';
import { RedirectorMapping, RedirectorObjectData } from 'libs/data-models/lib-data-models/src/lib/models/redirector-links.interface';
import { CremPopupComponent } from '@mango/ui-shared/lib-ui-elements';
import { NgIdleKeepaliveModule } from '@ng-idle/keepalive';
import { CurrentProjectIdMonitorService } from './services/current-project-monitor.service';
import { ErrorNotificationComponent } from './components/error-notification/error-notification.component';
import { TemplatePageTitleStrategy } from './services/title-strategy.service';

const DEV_MODULES = [];

// Wtih StoreDevToolsModule the flag `logOnly` could be used to disable it in stage and higher environments, but for some reason it's not working so this is a work around
if (!environment.production) {
  DEV_MODULES.push(
    StoreDevtoolsModule.instrument({
      name: 'MangoSPA',
      maxAge: 25,
      autoPause: true,
    })
  );
}

@NgModule({
  declarations: [
    AppComponent,
    LoadingScreenComponent,
    ValidateComponent,
    SessionExpiredComponent,
    IdleTimeoutPopupComponent,
    ErrorNotificationComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    StoreModule.forRoot(
      {},
      {
        metaReducers: !environment.production ? [] : [],
        runtimeChecks: {
          strictActionImmutability: true,
          strictStateImmutability: true,
        },
      }
    ),
    EffectsModule.forRoot([]),
    StoreModule.forFeature(fromApp.APP_FEATURE_KEY, fromApp.reducer),
    EffectsModule.forFeature([
      AuthenticationEffects,
      InitSetupEffects,
      NavigationEffect,
      //GlobalSessionEffects,
      EmulateUserEffects,
      IdleEffects,
    ]),
    ...DEV_MODULES,
    HttpClientModule,
    HttpClientJsonpModule,
    AppRoutingModule,
    CremModule,
    CremPopupComponent,
    LibUiSharedModule,
    LibCoreSharedModule,
    LibExternalLibrariesModule,
    StoreRouterConnectingModule.forRoot({
      serializer: CustomSerializer,
    }),
    ToastrModule.forRoot({
      timeOut: 8000,
      positionClass: 'toast-top-right',
      progressBar: true,
      closeButton: true,
    }),
    MatPasswordStrengthModule.forRoot(),
    NgIdleKeepaliveModule.forRoot(),
  ],
  providers: [
    { provide: Environment, useValue: environment },
    { provide: IS_CA_STANDALONE_APP, useValue: false },
    { provide: RUNNING_IN_MANGO_SPA, useValue: true },
    AppService,
    BookmarksService,
    AuthService,
    UserService,
    NotificationService,
    StorageService,
    ProjectsDashboardLeftNavService,
    CentralAuthErrorHandler,
    MangoAppFacade,
    HeaderService,
    MangoNavigationService,
    CurrentProjectIdMonitorService,
    Title,
    { provide: TitleStrategy, useClass: TemplatePageTitleStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(
    private router: Router,
    private facade: MangoAppFacade,
    private navigationService: MangoNavigationService
  ) {
    this.router.events
      .pipe(
        filter(
          (e: RouterEvent | any) =>
            e instanceof NavigationStart && e.url.includes('.asp')
        ),
        switchMap((e) =>
          combineLatest([
            of(e.url),
            this.facade.clientKey$,
            this.facade.contactRecord$,
            this.facade.redirectorLinks$,
            this.facade.redirectorMappings$,
          ])
        ),
        filter(([url, clientKey, contactRecord, _, redirectorMappings]) => !!url && !!clientKey && !!contactRecord && !!redirectorMappings),
        map(([url, clientKey, _, redirectorLinks, redirectorMappings]) => {
          const forceRelogin = CREM_FORCE_RELOGIN_URLS.some((subUrl) =>
            url.includes(subUrl)
          );

          url = decodeURIComponent(url);

          let client = UtilitiesService.getClientKeyFromUrl();
          let v06Url = environment.cremBaseUrl.replace('[CLIENT]', client);

          if (
            redirectorLinks &&
            (url.includes('RenderForm') || url.includes('View.asp'))
          ) {
            const objectData: RedirectorObjectData = this.getObjectDataFromUrl(url);
            let objectParamsQueryString = `oid=${objectData.objectId}&otid=${objectData.objectTypeId}&ottid=${objectData.objectTypeTypeId}`;

            let found = redirectorLinks.find((x) =>
                x.objectTypeId === objectData.objectTypeId &&
                x.objectTypeTypeId === objectData.objectTypeTypeId
            );

            let redirectorLink = '';
            if (found && url.includes('pgMode=Edit')) {
              redirectorLink = url;
            } else {
              redirectorLink = found ? found.basePageUrl : url;
            }

            let v06RedirectorUrl = '';

            if (redirectorLink.includes('pgMode=Edit')) {
              v06RedirectorUrl = redirectorLink;
            } else {
              v06RedirectorUrl = redirectorLink.includes('?')
                ? `${redirectorLink}&${objectParamsQueryString}`
                : `${redirectorLink}?${objectParamsQueryString}`;
            }

            v06RedirectorUrl = this.validateGantChartUrl(v06RedirectorUrl, objectData);

            if (forceRelogin) {
              const caUrl = `${environment.CAUrl}?${OAUTH_REDIRECT_QUERY_PARAM}=${v06Url}/v06/login.aspx?ReturnUrl=${
                encodeURIComponent(v06RedirectorUrl)}`;
              this.navigationService.navigateToExternalUrl(caUrl);
              return;
            }

            let redirectorMap: RedirectorMapping = null;
            
            // Compare just page name (ignore params)
            let redirectorMaps = redirectorMappings.filter((x) =>
              x.cremUrl.split('?')[0].toLowerCase() === v06RedirectorUrl.split('?')[0].toLowerCase()
            );

            if (redirectorMaps.length === 1) {
              redirectorMap = redirectorMaps[0];
            } else if (redirectorMaps.length > 1) {
              // If there are duplicate pages, 
              // Need to compare with the query param since it can be a page like /ListPage.aspx/?ObjectTypeId=4
              // Only the first query param matters
              redirectorMap = redirectorMaps.find((x) =>
                x.cremUrl.split('&')[0].toLowerCase() === v06RedirectorUrl.split('&')[0].toLowerCase()
              );
            }

            if (redirectorMap && redirectorMap.spaUrl && redirectorMap.isActive) {
              let queryString = `?${v06RedirectorUrl?.split('?')[1] ?? ''}`;
              let params = UtilitiesService.queryStringToParams(queryString);
              this.navigationService.navigateTo(redirectorMap.spaUrl, params);
              return;
            }

            this.navigationService.navigateToV06(`${v06Url}${v06RedirectorUrl}`);
            return;
          } 

          if (forceRelogin) {           
            const caUrl = `${environment.CAUrl}?${OAUTH_REDIRECT_QUERY_PARAM}=${v06Url}/v06/login.aspx?ReturnUrl=${
              encodeURIComponent(url)}`
            this.navigationService.navigateToExternalUrl(caUrl);
            return;
          }

          let redirectorMap: RedirectorMapping = null;

          // Compare just page name (ignore params)
          let redirectorMaps = redirectorMappings.filter((x) =>
            x.cremUrl.split('?')[0].toLowerCase() === url.split('?')[0].toLowerCase()
          );

          if (redirectorMaps.length === 1) {
            redirectorMap = redirectorMaps[0];
          } else if (redirectorMaps.length > 1) {
            // If there are duplicate pages, 
            // Need to compare with the query param since it can be a page like /ListPage.aspx/?ObjectTypeId=4
            // Only the first query param matters
            redirectorMap = redirectorMaps.find((x) =>
              x.cremUrl.split('&')[0].toLowerCase() === url.split('&')[0].toLowerCase()
            );
          }

          if (redirectorMap && redirectorMap.spaUrl && redirectorMap.isActive) {
            let queryString = `?${url?.split('?')[1] ?? ''}`;
            let params = UtilitiesService.queryStringToParams(queryString);
            this.navigationService.navigateTo(redirectorMap.spaUrl, params);
            return;
          }

          this.navigationService.navigateToV06(`${v06Url}${url}`);
        })
      )
      .subscribe();
  }

  // Validates and correct the gant chart url
  validateGantChartUrl(v06RedirectorUrl: string, objectData: RedirectorObjectData): string {
    //If both are true the url is not correct for the gantt chart
    if (
      v06RedirectorUrl.includes(
        'WebReportWithNav.aspx/project-gantt-chart'
      ) &&
      !v06RedirectorUrl.includes(
        'WebReportWithNav.aspx/project-gantt-chart/'
      )
    ) {
      v06RedirectorUrl = v06RedirectorUrl.replace(
        'WebReportWithNav.aspx/project-gantt-chart',
        `WebReportWithNav.aspx/project-gantt-chart/${objectData.objectId}`
      );
    }

    return v06RedirectorUrl;
  }

  getObjectDataFromUrl(url: string): RedirectorObjectData {
    let objectData: RedirectorObjectData = {
      objectId: 0,
      objectTypeId: 0,
      objectTypeTypeId: 0,
    };

    let splitUrl = url.split('?');
    if (splitUrl.length > 0) {
      const params = splitUrl[1].split('&');
      params.forEach((param) => {
        const [key, value] = param.split('=');
        if (key.toUpperCase() == 'OID') {
          objectData.objectId = +value;
        }
        if (key.toUpperCase() == 'OTID') {
          objectData.objectTypeId = +value;
        }
        if (key.toUpperCase() == 'OTTID') {
          objectData.objectTypeTypeId = +value;
        }
      });
    }
    
    return objectData;
  }
}
