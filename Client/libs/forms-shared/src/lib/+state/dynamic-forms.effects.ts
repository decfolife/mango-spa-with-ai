import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { combineLatest, of } from 'rxjs';
import {
  catchError,
  filter,
  map,
  mergeMap,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import * as DynamicFormsActions from './dynamic-forms.actions';
import { DynamicFormsService } from '../services/dynamic-forms.service';
import { Store, select } from '@ngrx/store';
import * as fromDynamicForms from './dynamic-forms.selectors';
import { Widget } from '@forms/model/dynamic-forms.interface';

@Injectable()
export class DynamicFormsEffects {
  constructor(
    private actions$: Actions,
    private dynamicFormsService: DynamicFormsService,
    private store: Store
  ) {}

  loadForms$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.initForms),
      switchMap(() =>
        this.dynamicFormsService.getItems().pipe(
          map((result) =>
            DynamicFormsActions.formListloadSuccess({ forms: result.data })
          ),
          catchError((error) =>
            of(DynamicFormsActions.formListloadFailure({ error }))
          )
        )
      )
    )
  );

  loadForm$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.dynamicFormLoad),
      switchMap(
        (action: {
          formId: number;
          objectId: number;
          objectTypeId: number;
          objectTypeTypeId: number;
          relationshipDefinitionId: number;
          parentObjectId: number;
          relatedObjectId: number;
          relatedObjectTypeId: number;
        }) => {
          return this.dynamicFormsService
            .getForm(
              action.formId,
              action.objectId,
              action.objectTypeId,
              action.objectTypeTypeId,
              action.relationshipDefinitionId,
              action.parentObjectId,
              action.relatedObjectId,
              action.relatedObjectTypeId
            )
            .pipe(
              map((result) =>
                DynamicFormsActions.dynamicFormLoadSuccessWithStatus({
                  apiResponse: result,
                })
              ),
              catchError((error) =>
                of(
                  DynamicFormsActions.dynamicFormLoadFailure({
                    error: {
                      name: 'getForm',
                      message: error.error?.clientErrorMessage
                        ? error.error.clientErrorMessage
                        : error.statusText
                        ? error.statusText
                        : 'Form Data Could not be Loaded, Please contact the Admin',
                    },
                    formId: action.formId,
                  })
                )
              )
            );
        }
      )
    )
  );

  loadFormActions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.dynamicFormLoadActions),
      mergeMap((action) =>
        this.dynamicFormsService
          .getFormActions(
            action.formId,
            action.objectId,
            action.objectTypeId,
            action.objectTypeTypeId,
            action.isEditMode,
            action.relationshipDefinitionId,
            action.parentObjectId,
            action.parentObjectTypeId
          )
          .pipe(
            map((result) =>
              DynamicFormsActions.dynamicFormLoadActionLoadSuccess({
                formActions: result.data,
              })
            ),
            catchError((error) =>
              of(
                DynamicFormsActions.dynamicFormLoadActionLoadFailure({ error })
              )
            )
          )
      )
    )
  );

  loadFormSections$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.dynamicFormLoadSections),
      switchMap((action) => {
        return this.dynamicFormsService
          .getFormSections(action.formId, action.groupId, action.objectId)
          .pipe(
            map((result) =>
              DynamicFormsActions.dynamicFormLoadSectionsSuccess({
                formSections: result.data,
              })
            ),
            catchError((error) =>
              of(DynamicFormsActions.dynamicFormLoadSectionsFailure({ error }))
            )
          );
      })
    )
  );

  loadFormAvailableSections$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.dynamicFormLoadAvailableSections),
      switchMap((action) => {
        return this.dynamicFormsService
          .getAvailableFormSections(action.formId)
          .pipe(
            map((result) =>
              DynamicFormsActions.dynamicFormLoadAvailableSectionsSuccess({
                formAvailableSections: result.data,
              })
            ),
            catchError((error) =>
              of(
                DynamicFormsActions.dynamicFormLoadAvailableSectionsFailure({
                  error,
                })
              )
            )
          );
      })
    )
  );

  loadFormAvailableFields$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.dynamicFormLoadAvailableFields),
      mergeMap((action) =>
        this.dynamicFormsService
          .getAvailableFormFields(action.formId, action.objectTypeId)
          .pipe(
            map((result) =>
              DynamicFormsActions.dynamicFormLoadAvailableFieldsSuccess({
                formAvailableFields: result.data,
              })
            ),
            catchError((error) =>
              of(
                DynamicFormsActions.dynamicFormLoadAvailableFieldsFailure({
                  error,
                })
              )
            )
          )
      )
    )
  );

  loadFormFields$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.dynamicFormLoadFields),
      mergeMap((action) =>
        this.dynamicFormsService
          .getFormFields(
            action.formId,
            action.sectionId,
            action.objectTypeId,
            0,
            0
          )
          .pipe(
            take(1),
            filter((formData) => formData !== undefined),
            map((result) =>
              DynamicFormsActions.dynamicFormLoadFieldsSuccess({
                sectionId: action.sectionId,
                formFields: result.data,
              })
            ),
            catchError((error) =>
              of(
                DynamicFormsActions.dynamicFormLoadFieldsFailure({
                  sectionId: action.sectionId,
                  error,
                })
              )
            )
          )
      )
    )
  );

  // Takes way too long
  // loadAllFormFieldsForAllSections$ = createEffect(() =>
  //   combineLatest([
  //     this.store.pipe(select(fromDynamicForms.selectIsRenderForm)),
  //     this.store.pipe(select(fromDynamicForms.selectDynamicForm)),
  //     this.actions$.pipe(ofType(DynamicFormsActions.dynamicFormLoadSectionsSuccess)),
  //   ]).pipe(
  //     filter(([isRenderForm, dynamicForm, sections]) => !isRenderForm && dynamicForm !== null),
  //     mergeMap(([isRenderForm, dynamicForm, sections]) =>
  //       this.dynamicFormsService
  //         .getFormFieldsForAllSections(dynamicForm.formId, dynamicForm.objectTypeId, sections.formSections)
  //         .pipe(
  //           filter(formData => formData !== undefined),
  //           map((result) =>
  //             DynamicFormsActions.dynamicFormLoadAllFieldsSuccess({formSections: sections.formSections, formFields: result.data})
  //           ),
  //           catchError((error) =>
  //             of(
  //               DynamicFormsActions.dynamicFormLoadAllFieldsFailure({error})
  //             )
  //           )
  //         )
  //     )
  //   )
  // );

  loadFormAvailableFieldsToSection$ = createEffect(() =>
    combineLatest([
      this.actions$.pipe(
        ofType(DynamicFormsActions.dynamicFormLoadAvailableFieldsToSection)
      ),
      this.store.pipe(select(fromDynamicForms.selectAvailableFormFields)),
    ]).pipe(
      filter(([fields]) => !!fields),
      mergeMap(([action, fields]) =>
        of(
          DynamicFormsActions.dynamicFormLoadAvailableFieldsToSectionSuccess({
            sectionId: action.sectionId,
            formAvailableFieldsInSection: fields,
          })
        )
      ),
      catchError((error) =>
        of(
          DynamicFormsActions.dynamicFormLoadAvailableFieldsToSectionFailure(
            error
          )
        )
      )
    )
  );

  loadFormItemDataTypes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.dynamicFormLoadFormItemDataTypes),
      switchMap(() =>
        this.dynamicFormsService.getFormItemDataTypes().pipe(
          map((result) =>
            DynamicFormsActions.dynamicFormLoadFormItemDataTypesSuccess({
              formItemDataTypes: result.data,
            })
          ),
          catchError((error) =>
            of(
              DynamicFormsActions.dynamicFormLoadFormItemDataTypesFailure({
                error,
              })
            )
          )
        )
      )
    )
  );

  loadFormItemControlTypes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.dynamicFormLoadFormItemControlTypes),
      switchMap(() =>
        this.dynamicFormsService.getFormItemControlTypes().pipe(
          map((result) =>
            DynamicFormsActions.dynamicFormLoadFormItemControlTypesSuccess({
              formItemControlTypes: result.data,
            })
          ),
          catchError((error) =>
            of(DynamicFormsActions.formListloadFailure({ error }))
          )
        )
      )
    )
  );

  loadFormItemWidgetByWidgetId$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.dynamicFormLoadWidgetByWidgetId),
      withLatestFrom(this.store.pipe(select(fromDynamicForms.selectObjectId))),
      mergeMap(([action]) =>
        this.dynamicFormsService
          .getFormItemWidgetByWidgetId(action.widgetId, action.objectId)
          .pipe(
            take(1),
            map((result) => {
              // Format widget data before storing
              if (result?.data) {
                result.data = this.formatWidgetData(result.data);
              }
              return DynamicFormsActions.dynamicFormLoadWidgetByWidgetIdSuccessWithStatus(
                { widgetId: action.widgetId, apiResponse: result }
              );
            }),
            catchError((error) => {
              return of(
                DynamicFormsActions.dynamicFormLoadWidgetByWidgetIdFailure({
                  error,
                })
              );
            })
          )
      )
    )
  );

  loadFormItemDatabaseTables$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.dynamicFormLoadDatabaseTables),
      switchMap(() =>
        this.dynamicFormsService.getFormItemDatabaseTables().pipe(
          map((result) =>
            DynamicFormsActions.dynamicFormLoadDatabaseTablesSuccess({
              formItemDatabaseTables: result.data,
            })
          ),
          catchError((error) =>
            of(
              DynamicFormsActions.dynamicFormLoadDatabaseTablesFailure({
                error,
              })
            )
          )
        )
      )
    )
  );

  loadDatabaseColumnsByTableName$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.dynamicFormLoadDatabaseColumnsByTableName),
      mergeMap((action) =>
        this.dynamicFormsService
          .getDatabaseColumnsByTableName(action.tableName)
          .pipe(
            filter((formData) => formData !== undefined),
            map((result) =>
              DynamicFormsActions.dynamicFormLoadDatabaseColumnsByTableNameSuccess(
                {
                  tableName: action.tableName,
                  formItemDatabaseColumns: result.data,
                }
              )
            ),
            catchError((error) =>
              of(
                DynamicFormsActions.dynamicFormLoadDatabaseColumnsByTableNameFailure(
                  { error }
                )
              )
            )
          )
      )
    )
  );

  loadFormItemDropdowns$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.dynamicFormLoadFormItemDropdowns),
      mergeMap(() =>
        this.dynamicFormsService.getFormItemDropdowns().pipe(
          filter((formData) => formData !== undefined),
          map((result) =>
            DynamicFormsActions.dynamicFormLoadFormItemDropdownsSuccess({
              formItemDropdowns: result.data,
            })
          ),
          catchError((error) =>
            of(
              DynamicFormsActions.dynamicFormLoadFormItemDropdownsFailure({
                error,
              })
            )
          )
        )
      )
    )
  );

  loadRenderForm$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.dynamicFormLoadRenderForm),
      switchMap((action: { formId; formObjectId; formObjectTypeId }) =>
        this.dynamicFormsService
          .getRenderFormData(
            action.formId,
            action.formObjectId,
            action.formObjectTypeId
          )
          .pipe(
            map((result) =>
              !!result && result.success
                ? (result.data.push({ formObjectId: action.formObjectId }),
                  DynamicFormsActions.dynamicFormLoadRenderFormSuccess({
                    renderFormData: result.data,
                  }))
                : !!result
                ? DynamicFormsActions.dynamicFormLoadRenderFormFailure({
                    error: {
                      name: 'getRenderForm',
                      message: result.clientErrorMessage
                        ? result.clientErrorMessage
                        : 'Form Data Could not be Loaded, Please contact the Admin',
                    },
                  })
                : DynamicFormsActions.dynamicFormLoadRenderFormFailure({
                    error: {
                      name: 'getRenderForm',
                      message:
                        'Form Data Could not be Loaded, Please contact the Admin.',
                    },
                  })
            ),
            catchError((error) =>
              of(
                DynamicFormsActions.dynamicFormLoadRenderFormFailure({
                  error: {
                    name: 'getRenderForm',
                    message: error.error?.clientErrorMessage
                      ? error.error.clientErrorMessage
                      : error.statusText
                      ? error.statusText
                      : 'Form Data Could not be Retrieved, Please contact the Admin',
                  },
                })
              )
            )
          )
      )
    )
  );

  loadFormName$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.dynamicFormLoadRenderForm),
      mergeMap((action: { formId; objectId; objectTypeId }) =>
        of(action).pipe(
          tap(() => DynamicFormsActions.dynamicFormLoadFormName()),
          mergeMap(() =>
            this.dynamicFormsService
              .getFormName(action.formId, action.objectId, action.objectTypeId)
              .pipe(
                map((result) =>
                  DynamicFormsActions.dynamicFormLoadFormNameSuccess({
                    formName: result.data,
                  })
                ),
                catchError((error) =>
                  of(
                    DynamicFormsActions.dynamicFormLoadFormNameFailure({
                      error,
                    })
                  )
                )
              )
          )
        )
      )
    )
  );

  loadParentLink$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.renderFormLoadLoadParentLink),
      mergeMap((action: { objectId; objectTypeId }) =>
        this.dynamicFormsService
          .getParentLink(action.objectId, action.objectTypeId)
          .pipe(
            map((result) =>
              DynamicFormsActions.renderFormLoadLoadParentLinkSuccess({
                objectParentLinker: result.data,
              })
            ),
            catchError((error) =>
              of(
                DynamicFormsActions.renderFormLoadLoadParentLinkFailure({
                  error,
                })
              )
            )
          )
      )
    )
  );

  loadRenderFormFormItemDropdowns$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.dynamicFormLoadRenderForm),
      mergeMap(
        (action: {
          formId;
          formObjectId;
          formObjectTypeId;
          parentObjectId;
          parentObjectTypeId;
        }) =>
          of(action).pipe(
            mergeMap(() =>
              this.dynamicFormsService
                .getRenderFormFormItemDropdowns(
                  action.formId,
                  action.formObjectId,
                  action.formObjectTypeId,
                  action.parentObjectId,
                  action.parentObjectTypeId
                )
                .pipe(
                  map((result) =>
                    DynamicFormsActions.renderFormLoadFormItemDropdownsSuccess({
                      renderFormDropdowns: result.data,
                    })
                  ),
                  catchError((error) =>
                    of(
                      DynamicFormsActions.renderFormLoadFormItemDropdownsFailure(
                        {
                          error,
                        }
                      )
                    )
                  )
                )
            )
          )
      )
    )
  );

  saveRenderForm$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DynamicFormsActions.saveRenderForm),
      switchMap((action) => {
        return this.dynamicFormsService
          .saveRenderForm(action.saveRenderFormCommand)
          .pipe(
            map((result) =>
              DynamicFormsActions.saveRenderFormSuccess({ apiResponse: result })
            ),
            catchError((error) =>
              of(DynamicFormsActions.saveRenderFormFailure({ error }))
            )
          );
      })
    )
  );

  /**
   * Utility function to remove duplicates by oid
   * Fixes an issue with displaying duplicate rows. This fix
   * mimics RemoveDuplicateRowsWhenSecurityApplied in v06.
   * Items without an oid are always included in the result.
   * @param data
   * @returns
   */
  private getUniqueByOid(data: any[]): any[] {
    const itemsWithoutOid: any[] = [];
    const mapByOid = data.reduce((acc, item) => {
      if (item.oid !== undefined && item.oid !== null) {
        acc[item.oid] = item; // Keeps the last occurrence
      } else {
        itemsWithoutOid.push(item); // Collect items without oid
      }
      return acc;
    }, {} as Record<number, any>);

    const uniqueItems = [...Object.values(mapByOid), ...itemsWithoutOid];
    return uniqueItems;
  }

  /**
   * Decode HTML entities like &amp; in string values
   * to prevent showing encoded text in DataGrid/PivotGrid.
   * @param value The string value to decode
   * @returns The decoded string
   */
  private decodeHtmlEntities(value: string): string {
    if (typeof value !== 'string') {
      return value as unknown as string;
    }

    // Fast check to avoid unnecessary work
    if (!/&[a-zA-Z#0-9]+;/.test(value)) {
      return value;
    }

    // Use browser HTML parser for robust entity decoding
    const parser = new DOMParser();
    const doc = parser.parseFromString(value, 'text/html');
    const decoded = doc.documentElement.textContent ?? value;
    return decoded;
  }

  /**
   * Decode HTML entities in widget row data.
   * Decoding is done early so all downstream consumers (grids, exports)
   * receive clean strings.
   * @param widget The widget containing row data to decode
   * @returns The widget with decoded row data
   */
  private decodeWidgetHtmlEntities(widget: Widget): Widget {
    const rows = widget?.renderFormWidgetData as Array<Record<string, unknown>>;

    if (rows && rows.length) {
      for (const row of rows) {
        // Decode any string property that contains HTML entities
        for (const key of Object.keys(row)) {
          const v = row[key];
          if (typeof v === 'string') {
            row[key] = this.decodeHtmlEntities(v);
          }
        }
      }
    }

    return widget;
  }

  /**
   * Convert date string fields to Date objects based on column metadata.
   */
  private convertDateStrings(widget: any): void {
    const DATE_COL_ID = '7';
    const columnFields = widget.columnGroup?.columnFields as Array<any>;
    const columnRowData = widget?.renderFormWidgetData;

    if (!(columnFields && columnRowData)) {
      return;
    }

    const dateFields = columnFields
      .filter((x) => x.dataFieldDataType === DATE_COL_ID)
      .map((x) => x.dataFieldTableField?.toLowerCase());

    for (let i = 0; i < columnRowData.length; i++) {
      for (let j = 0; j < dateFields.length; j++) {
        if (
          columnRowData[i][dateFields[j]] &&
          !Number.isNaN(Date.parse(columnRowData[i][dateFields[j]])) &&
          columnRowData[i][dateFields[j]].length > 6
        ) {
          columnRowData[i][dateFields[j]] = new Date(
            columnRowData[i][dateFields[j]]
          );
        }
      }
    }
  }

  /**
   * Format widget data by applying all necessary transformations.
   * This is called in the effect before storing data.
   */
  private formatWidgetData(widget: any): any {
    if (!widget) return widget;

    widget.renderFormWidgetData = this.getUniqueByOid(
      widget.renderFormWidgetData
    );
    this.convertDateStrings(widget);
    this.decodeWidgetHtmlEntities(widget);
    return widget;
  }
}
