import { Injectable } from '@angular/core';
import { AuthService, UserService } from '@mango/core-shared/lib-core-shared';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { combineLatest, of } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import * as AppActions from '../app.actions';
import { MangoAppFacade } from '../app.facade';
import { MangoNavigationService } from '@mangoSpa/src/app/services/navigation.service';
import { CremToastService } from '@mango/ui-shared/lib-ui-elements';
import { ContactRecord, ToastState } from '@mango/data-models/lib-data-models';

@Injectable()
export class EmulateUserEffects {
  constructor(
    private actions$: Actions,
    private facade: MangoAppFacade,
    private userService: UserService,
    private authService: AuthService,
    private navigationService: MangoNavigationService,
    private toaster: CremToastService
  ) {}

  isEmulatingUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActions.IS_EMULATING_USER),
      switchMap((_) => combineLatest([this.facade.authenticatedUser$])),
      filter(([user]) => {
        const queryParams = new URLSearchParams(window.location.search);
        const emulateUser = queryParams.get('emu');
        return !!user && emulateUser !== 'false';
      }),
      switchMap((_) =>
        this.authService.getEmulatedUser().pipe(
          map((response) => {
            if (response.isEmulatedUser) {
              return AppActions.setEmulatedUser({
                contactId: response.contactId,
                initiatedFromV06: null,
              });
            }

            return AppActions.noOpAction();
          }),
          catchError((_) => {
            return of(AppActions.noOpAction());
          })
        )
      )
    )
  );

  setEmulatedUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActions.SET_EMULATED_USER),
      tap((_) => this.facade.setLoading(true)),
      switchMap((action: { contactId: number; initiatedFromV06?: boolean }) =>
        combineLatest([
          of(action.contactId),
          of(action.initiatedFromV06),
          this.facade.authenticatedUser$,
        ])
      ),
      filter(([_, __, user]) => !!user),
      switchMap(([contactId, initiatedFromV06, user]) =>
        combineLatest([
          this.userService.getContactRecord(contactId),
          of(initiatedFromV06),
          of(user),
        ])
      ),
      filter(([contactRecord]) => !!contactRecord),
      switchMap(([contactRecord, initiatedFromV06, user]) =>
        this.authService
          .emulateUser(
            contactRecord.email,
            contactRecord.contactID,
            contactRecord.userRole,
            user.clientKey
          )
          .pipe(
            tap((_) => this.facade.setLoading(false)),
            map((_) => {
              return AppActions.setEmulatedUserSuccess({
                contactRecord,
                initiatedFromV06,
              });
            }),
            catchError((_) => {
              this.facade.setLoading(false);
              this.toaster.show(
                'Could not emulate user.',
                'Error',
                ToastState.ERROR,
                { position: 'top right' }
              );
              return of(AppActions.noOpAction());
            })
          )
      )
    )
  );

  // To complete emulation, need to go to V06.
  setEmulatedUserSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActions.SET_EMULATED_USER_SUCCESS),
        switchMap(
          (action: {
            contactRecord: ContactRecord;
            initiatedFromV06?: boolean;
          }) =>
            combineLatest([
              of(action.contactRecord),
              of(action.initiatedFromV06),
            ])
        ),
        filter(([contact, _]) => !!contact),
        tap(([contact, initiatedFromV06]) => {
          if (initiatedFromV06 === null || initiatedFromV06) return;

          const searchParams = new URLSearchParams({
            cid: contact.contactID.toString(),
            emu: 'true',
          });
          return this.navigationService.redirectToV06(
            'login.aspx',
            searchParams
          );
        })
      ),
    { dispatch: false }
  );

  stopEmulatingUser$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActions.STOP_EMULATING_USER),
        switchMap((_) => {
          this.facade.setContactRecord(null);
          this.facade.setupContactRecord();
          return combineLatest([
            this.facade.isEmulateUserInitiatedFromV06$,
            this.authService.stopEmulatingUser(),
          ]);
        }),
        tap(([initiatedFromV06]) => {
          if (initiatedFromV06) return;

          const searchParams = new URLSearchParams({ emu: 'false' });
          return this.navigationService.redirectToV06(
            'login.aspx',
            searchParams
          );
        })
      ),
    { dispatch: false }
  );
}
