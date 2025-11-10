import { DataIdService } from './../../../../mango/src/app/services/data-id.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { CurrentObjectService, DataIdBreadcrumbProviderService, StorageService } from '@mango/core-shared';
import {
  Environment,
  IDLE_TIMOUT_DELAY_SECONDS,
  IS_CA_STANDALONE_APP,
} from '@mango/data-models/lib-data-models';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import {
  JwtService,
  provideUserIdleConfig,
} from 'libs/core-shared/src/lib/services';
import { ToastrModule } from 'ngx-toastr';
import { environment } from '../environments/environment.dev';
import { AuthenticationEffects } from './+state/effects/authentication.effects';
import { CentralAuthFacade } from './+state/facades';
import * as fromApp from './+state/reducers';
import { AppComponent } from './app.component';
import { OAuthEffects } from './+state/effects/oauth.effects';
import { LoginComponent } from './components/login/login.component';
import { AuthService } from './services/auth.service';
import { CentralAuthErrorHandler } from './services/error-handler.service';
import { CentralAuthHttpInterceptor } from './services/http.interceptor';
import { CustomerSelectionPageComponent } from './components/customer-selection-page/customer-selection-page.component';
import { ServiceAccountConfigurationComponent } from './components/service-account-configuration/service-account-configuration.component';
import { AuthGuard } from './guards/auth.guard';
import { DxLoadPanelModule } from 'devextreme-angular';
import { AppEffects } from './+state/effects/app.effects';
import { HttpEffects } from './+state/effects/http.effects';
import { RoleGuard } from './guards/role.guard';
import { ServiceAccountService } from './services/service-account.service';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';

const DEV_MODULES = [];

// Wtih StoreDevToolsModule the flag `logOnly` could be used to disable it in stage and higher environments, but for some reason it's not working so this is a work around

if (!environment.production) {
  DEV_MODULES.push(
    StoreDevtoolsModule.instrument({
      name: 'CentralAuth',
      maxAge: 25,
      autoPause: true,
    })
  );
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot([
      {
        path: '',
        component: LoginComponent,
        title: 'CoStar Real Estate Manager Secure Login',
      },
      {
        path: 'customer-selection',
        component: CustomerSelectionPageComponent,
        canActivate: [AuthGuard],
        title: 'Customer Selection - CoStar Real Estate Manager Secure Login',
      },
      {
        path: 'service-account-configuration',
        component: ServiceAccountConfigurationComponent,
        canActivate: [AuthGuard],
        title:
          'Service Account Configuration - CoStar Real Estate Manager Secure Login',
      },
      {
        path: 'reset-password',
        loadChildren: () =>
          import('./components/reset-password/reset-password.module').then(
            (mod) => mod.ResetPasswordModule
          ),
        title: 'Reset Password - CoStar Real Estate Manager Secure Login',
      },
      {
        path: 'password-reset-request',
        loadChildren: () =>
          import(
            './components/password-reset-request/password-reset-request.module'
          ).then((mod) => mod.PasswordResetRequestModule),
        title: 'Reset Password - CoStar Real Estate Manager Secure Login',
      },
      {
        path: ':clientKey',
        component: LoginComponent,
        title: 'CoStar Real Estate Manager Secure Login',
      },
      { path: '', redirectTo: '', pathMatch: 'full' },
      { path: '**', redirectTo: '', pathMatch: 'full' },
    ]),
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
    StoreModule.forFeature(fromApp.CENTRAL_AUTH_FEATURE_KEY, fromApp.reducer),
    EffectsModule.forFeature([
      AppEffects,
      HttpEffects,
      AuthenticationEffects,
      OAuthEffects,
    ]),
    ...DEV_MODULES,
    ToastrModule.forRoot({
      timeOut: 8000,
      positionClass: 'toast-bottom-center',
      progressBar: true,
      closeButton: true,
      tapToDismiss: false,
      disableTimeOut: true,
    }),
    CentralAuthErrorHandler.forRoot(),
    CentralAuthHttpInterceptor.forRoot(),
    DxLoadPanelModule,
  ],
  providers: [
    { provide: Environment, useValue: environment },
    { provide: IS_CA_STANDALONE_APP, useValue: true },
    { provide: DataIdBreadcrumbProviderService, useClass: DataIdService },
    provideUserIdleConfig({
      idle: 1,
      timeout: IDLE_TIMOUT_DELAY_SECONDS,
      ping: 2,
    }),
    AuthGuard,
    RoleGuard,
    AuthService,
    ServiceAccountService,
    StorageService,
    JwtService,
    CurrentObjectService,
    CentralAuthFacade,
    MangoAppFacade
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
