import { Injectable } from '@angular/core';
import {
  parseBool,
  SettingsService,
  UserService,
} from '@mango/core-shared/lib-core-shared';
import { SUB_LEFT_NEV_PAGES_URLS } from '@mango/data-models/lib-data-models';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ROUTER_NAVIGATED, RouterNavigatedAction } from '@ngrx/router-store';
import { combineLatest, of } from 'rxjs';
import { filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import * as AppActions from '../app.actions';
import { MangoAppFacade } from '../app.facade';
import { ActivatedRoute } from '@angular/router';
import { MangoNavigationService } from '@mangoSpa/src/app/services/navigation.service';

@Injectable()
export class InitSetupEffects {
  constructor(
    private actions$: Actions,
    private userService: UserService,
    private navigationService: MangoNavigationService,
    private facade: MangoAppFacade,
    private activatedRoute: ActivatedRoute,
    private settingsService: SettingsService
  ) {}

  initSetup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActions.APP_INIT),
      mergeMap((_) => [
        AppActions.loadCurrentUser(),
        AppActions.setupClientKey(),
        AppActions.setupContactRecord(),
        AppActions.setupUserContactRecordConfig(),
        AppActions.redirectToV06ToFinalizeLogin(),
        AppActions.handleCustomQueryParams(),
        AppActions.setAdminFlags(),
        AppActions.setUserHasSecurityProfiles(),
        AppActions.isEmulatingUser(),
        AppActions.setupClientSettings(),
      ])
    )
  );

  setupClientKey$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActions.SETUP_CLIENT_KEY),
      switchMap((_) => this.facade.authenticatedUser$),
      filter((user) => !!user),
      map((user) => AppActions.setClientKey({ clientKey: user.clientKey }))
    )
  );

  setAdminFlags$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActions.SET_ADMIN_FLAGS),
      switchMap((_) => this.facade.clientKey$),
      filter((clientKey) => !!clientKey),
      switchMap((_) => this.settingsService.getAdminFlags()),
      filter((flags) => !!flags),
      map((flags) => AppActions.setAdminFlagsSuccess({ flags }))
    )
  );

  loadRedirectorLinks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActions.LOAD_REDIRECTOR_LINKS),
      switchMap((_) => this.facade.clientKey$),
      filter((clientKey) => !!clientKey),
      switchMap((_) =>
        this.settingsService.getRedirectorLinks()
      ),
      filter((links) => !!links),
      map((links) =>
        AppActions.loadRedirectorLinksSuccess({ redirectorLinks: links })
      )
    )
  );

  loadRedirectorMappings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActions.LOAD_REDIRECTOR_MAPPINGS),
      switchMap((_) => this.facade.clientKey$),
      filter((clientKey) => !!clientKey),
      switchMap((_) =>
        this.settingsService.getRedirectorMappings()
      ),
      filter((mappings) => !!mappings),
      map((mappings) =>
        AppActions.loadRedirectorMappingsSuccess({ redirectorMappings: mappings })
      )
    )
  );

  setupUserContactRecordConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActions.SETUP_USER_CONTACT_RECORD_CONFIG),
      switchMap((_) => this.facade.authenticatedUser$),
      filter((user) => !!user),
      switchMap((user) =>
        this.userService.hasMultipleContactRecords(
          user.email,
          user.contactId,
          user.clientKey
        )
      ),
      map((hasMultipleContactRecords) =>
        AppActions.setUserHasMultipleContactRecords({
          hasMultipleContactRecords,
        })
      )
    )
  );

  setupUserContactProfiles$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActions.SET_HAS_SECURITY_PROFILES),
      switchMap((_) => this.facade.authenticatedUser$),
      filter((user) => !!user),
      switchMap((_) => this.userService.hasSecurityProfiles()),
      map((hasSecurityProfiles) =>
        AppActions.setUserHasSecurityProfilesSuccess({ hasSecurityProfiles })
      )
    )
  );

  setupContactRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActions.SETUP_CONTACT_RECORD),
      switchMap((_) =>
        combineLatest([
          this.facade.authenticatedUser$,
          this.facade.contactRecord$,
        ])
      ),
      filter(([user, contact]) => !!user && !contact),
      switchMap(([user]) =>
        this.userService.getContactRecord(user.contactId, user.clientKey)
      ),
      filter((contactRecord) => !!contactRecord),
      map((contactRecord) => AppActions.setContactRecord({ contactRecord }))
    )
  );

  // To complete login, need to login to V06 as well.
  redirectToV06ToFinalizeLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActions.REDIRECT_TO_V06_TO_FINALIZE_LOGIN),
        switchMap((_) => this.facade.v06Auth$),
        filter((v06Auth) => !!v06Auth),
        tap((v06Auth) => {
          this.navigationService.redirectToV06Login(v06Auth.authCode);
        })
      ),
    { dispatch: false }
  );

  setupClientSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActions.SETUP_CLIENT_SETTINGS),
      switchMap((_) =>
        combineLatest([this.facade.authenticatedUser$, this.facade.clientKey$])
      ),
      filter(([user, clientKey]) => !!user && !!clientKey),
      switchMap(([_]) =>
        this.settingsService.getClientSettingsForUser()
      ),
      filter((clientSettings) => !!clientSettings),
      map((clientSettings) =>
        AppActions.setupClientSettingsSuccess({ clientInfo: clientSettings })
      )
    )
  );

  getModuleIdValue$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROUTER_NAVIGATED),
      switchMap((r: RouterNavigatedAction) =>
        SUB_LEFT_NEV_PAGES_URLS.some((pageUrl) =>
          r.payload.routerState.url.includes(pageUrl)
        )
          ? of(
              AppActions.setCurrentRenderFormDocumentParams({
                params: r.payload.routerState.url,
              }),
              AppActions.setShowSubLetNav({ show: true })
            )
          : of(
              AppActions.setShowSubLetNav({ show: false }),
              AppActions.setModuleId({
                moduleId: r.payload.routerState.root.data.moduleId,
              })
            )
      )
    )
  );

  handleCustomQueryParams$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActions.HANDLE_CUSTOM_QUERY_PARAMS),
        switchMap((_) => this.activatedRoute.queryParamMap),
        map((queryParamsMap) => {
          const queryParams = new URLSearchParams(window.location.search);

          return [
            queryParams.get('logout'),
            queryParams.get('cid'),
            queryParams.get('emu'),
          ]

          // Old
          // return [
          //   queryParamsMap.get('logout'),
          //   queryParamsMap.get('cid'),
          //   queryParamsMap.get('emu'),
          // ]
        }),
        tap(([logout, contactId, emulateUser]) => {
          // When logging out of V06, V06 will redirect to SPA with a query param to logout
          if (logout === 'true') {
            this.facade.logout();
            return;
          }

          // When emulate user is initiated/terminated in V06, V06 will redirect to SPA with query params
          if (parseBool(emulateUser) && contactId) {
            this.facade.setEmulatedUser(parseInt(contactId), true);
          } else if (emulateUser === 'false') {
            this.facade.stopEmulatingUser(true);
          }
        })
      ),
    { dispatch: false }
  );
}
