import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { Action, createReducer, on } from '@ngrx/store';
import * as dynamicFormsActions from './dynamic-forms.actions';
import { DynamicFormEntity } from '../model/dynamic-forms-list.model';
import {
  Dropdowns,
  FormItemDataTypes,
  FormItemDatabaseTables,
  FormItemSourceColumnbySourceTable,
  FormItemTypes,
  IDynamicForm,
  IFields,
  ISection,
  ObjectParentLinker,
  RenderFormDropdowns,
  Widget,
} from '../model/dynamic-forms.interface';
import { ApiResponse } from '@mango/data-models/lib-data-models';

export const APP_FEATURE_KEY = 'dynamicForms';

export interface DynamicFormsState extends EntityState<DynamicFormEntity> {
  isLoading: boolean; // all effects use this currently - break it out into individual isLoadings.*
  loaded: boolean; // has the forms list been loaded
  isRenderForm: boolean;

  error?: string | any; // last known error (if any)]
  renderFormError?: string | any;
  dynamicFormApiResponse: ApiResponse;
  dynamicForm?: IDynamicForm;

  formActions?: any;
  formAvailableSections?: ISection[];
  formSections?: ISection[];

  formAvailableFields?: IFields[];
  formAvailableFieldsInSection?: { [sectionId: number]: IFields[] };
  formFields?: { [sectionId: number]: IFields[] };

  formItemControlTypes?: FormItemTypes[];
  formItemDataTypes?: FormItemDataTypes[];

  formItemWidgetsApiResponses?: { [widgetId: number]: ApiResponse };

  formItemDatabaseTables?: FormItemDatabaseTables[];
  formItemDatabaseColumns?: {
    [tableName: string]: FormItemSourceColumnbySourceTable[];
  };

  formItemDropdowns?: Dropdowns[];
  renderFormData: any;
  objectID: number;
  formName: string;
  renderFormDropdowns?: RenderFormDropdowns[];
  objectParentLinker?: ObjectParentLinker;

  saveRenderFormResponse: ApiResponse | string;
}

export interface DyanmicFormsPartialState {
  readonly [APP_FEATURE_KEY]: DynamicFormsState;
}

export const dynamicFormsAdapter: EntityAdapter<DynamicFormEntity> =
  createEntityAdapter<DynamicFormEntity>();

export const initialState: DynamicFormsState =
  dynamicFormsAdapter.getInitialState({
    // set initial required properties
    isLoading: false,
    loaded: false,
    isRenderForm: false,
    error: null,
    renderFormError: null,
    dynamicForm: null,
    objectID: 0,
    formActions: null,
    formAvailableSections: null,
    formSections: null,
    formAvailableFields: null,
    formAvailableFieldsInSection: {},
    formItemControlTypes: null,
    formItemDataTypes: null,
    formItemWidgets: null,
    formFields: {},
    formItemDatabaseTables: null,
    formItemDatabaseColumns: null,
    formItemDropdowns: null,
    renderFormData: null,
    formName: null,
    renderFormDropdowns: null,
    dynamicFormApiResponse: null,
    objectParentLinker: null,
    formItemWidgetsApiResponses: null,
    saveRenderFormResponse: null,
  });

const reducer = createReducer(
  initialState,
  //Clear all the state
  on(dynamicFormsActions.clearDynamicFormsState, (state) => ({
    ...state,
    isLoading: false,
    loaded: false,
    isRenderForm: false,
    error: null,
    dynamicForm: null,
    objectID: 0,
    formActions: null,
    formAvailableSections: null,
    formSections: null,
    formAvailableFields: null,
    formAvailableFieldsInSection: {},
    formItemControlTypes: null,
    formItemDataTypes: null,
    formItemWidgets: null,
    formFields: {},
    formItemDatabaseTables: null,
    formItemDatabaseColumns: null,
    formItemDropdowns: null,
    renderFormData: null,
    formName: null,
    renderFormDropdowns: null,
    dynamicFormApiResponse: null,
    objectParentLinker: null,
    formItemWidgetsApiResponses: null,
    saveRenderFormResponse: null,
  })),
  on(dynamicFormsActions.clearSaveFormState, (state) => ({
    ...state,
    saveRenderFormResponse: null,
  })),
  // MISC
  on(dynamicFormsActions.setObjectId, (state, { objectId }) => {
    return {
      ...state,
      objectID: objectId,
    };
  }),
  on(dynamicFormsActions.setisRenderForm, (state, { isRenderForm }) => {
    return {
      ...state,
      isRenderForm: isRenderForm,
    };
  }),
  // Form List
  on(dynamicFormsActions.initForms, (state) => ({
    ...state,
    isLoading: true,
    loaded: false,
  })),
  on(
    dynamicFormsActions.formListloadSuccess,
    (state, { forms }): DynamicFormsState =>
      dynamicFormsAdapter.setAll(forms, {
        ...state,
        isLoading: false,
        loaded: true,
      })
  ),
  on(
    dynamicFormsActions.formListloadFailure,
    (state, { error }): DynamicFormsState => ({
      ...state,
      error,
      isLoading: false,
      loaded: false,
    })
  ),
  // Form Load
  on(dynamicFormsActions.dynamicFormLoad, (state) => ({
    ...state,
    isLoading: true,
  })),
  // on(dynamicFormsActions.dynamicFormLoadSuccess, (state, { dynamicForm }) => ({
  //   ...state,
  //   error: null,
  //   dynamicForm: dynamicForm,
  //   isLoading: false,
  //   loaded: true,
  // })),
  on(
    dynamicFormsActions.dynamicFormLoadSuccessWithStatus,
    (state, { apiResponse }) => ({
      ...state,
      error: null,
      dynamicForm: apiResponse?.data,
      dynamicFormApiResponse: apiResponse,
      isLoading: false,
      loaded: true,
    })
  ),
  on(
    dynamicFormsActions.dynamicFormLoadFailure,
    (state, { error }): DynamicFormsState => ({
      ...state,
      error,
      renderFormError: error,
      isLoading: false,
      loaded: false,
    })
  ),

  // Form Actions
  on(dynamicFormsActions.dynamicFormLoadActions, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(
    dynamicFormsActions.dynamicFormLoadActionLoadSuccess,
    (state, { formActions }) => ({
      ...state,
      error: null,
      formActions: formActions,
      isLoading: false,
      loaded: true,
    })
  ),
  on(
    dynamicFormsActions.dynamicFormLoadActionLoadFailure,
    (state, { error }): DynamicFormsState => ({
      ...state,
      error,
      isLoading: false,
      loaded: false,
    })
  ),
  // Form Available Sections
  on(dynamicFormsActions.dynamicFormLoadAvailableSections, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(
    dynamicFormsActions.dynamicFormLoadAvailableSectionsSuccess,
    (state, { formAvailableSections }) => ({
      ...state,
      error: null,
      formAvailableSections,
      isLoading: false,
      loaded: true,
    })
  ),
  on(
    dynamicFormsActions.dynamicFormLoadAvailableSectionsFailure,
    (state, { error }) => ({
      ...state,
      error,
      isLoading: false,
      loaded: false,
    })
  ),
  // Form Sections
  on(dynamicFormsActions.dynamicFormLoadSections, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(
    dynamicFormsActions.dynamicFormLoadSectionsSuccess,
    (state, { formSections }) => ({
      ...state,
      error: null,
      formSections: formSections,
      isLoading: false,
      loaded: true,
    })
  ),
  on(
    dynamicFormsActions.dynamicFormLoadSectionsFailure,
    (state, { error }) => ({
      ...state,
      error,
      isLoading: false,
      loaded: false,
    })
  ),

  on(dynamicFormsActions.addAvailableSectionToForm, (state, { section }) => {
    // Create a new sections object with the new section added
    const updatedSections = {
      ...state.formSections,
      [section.formSectionID]: section,
    };
    return { ...state, formSections: updatedSections };
  }),
  on(
    dynamicFormsActions.removeSectionFromAvailableSections,
    (state, { sectionId, section }) => {
      const formSections = [...state.formAvailableSections];
      const updatedSections = formSections.filter(
        (item) => item.formSectionID !== sectionId
      );
      return { ...state, formAvailableSections: updatedSections };
    }
  ),
  //Form Available Fields
  on(dynamicFormsActions.dynamicFormLoadAvailableFields, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(
    dynamicFormsActions.dynamicFormLoadAvailableFieldsSuccess,
    (state, { formAvailableFields }) => ({
      ...state,
      error: null,
      formAvailableFields,
      isLoading: false,
      loaded: true,
    })
  ),
  on(
    dynamicFormsActions.dynamicFormLoadAvailableFieldsFailure,
    (state, { error }) => ({
      ...state,
      error,
      isLoading: false,
      loaded: false,
    })
  ),
  on(
    dynamicFormsActions.dynamicFormLoadAvailableFieldsToSectionSuccess,
    (state, { sectionId, formAvailableFieldsInSection }) => ({
      ...state,
      formAvailableFieldsInSection: {
        ...state.formAvailableFieldsInSection,
        [sectionId]: formAvailableFieldsInSection,
      },
      error: null,
    })
  ),
  on(
    dynamicFormsActions.addAvailableFieldToSection,
    (state, { sectionId, field }) => {
      const updatedFormFields = { ...state.formFields };
      console.log('sectionId', sectionId);
      updatedFormFields[sectionId] = [...updatedFormFields[sectionId], field];
      return { ...state, formFields: updatedFormFields };
    }
  ),
  on(
    dynamicFormsActions.removeAvailableFieldFromSection,
    (state, { sectionId, field }) => {
      const updatedFormFields = { ...state.formAvailableFieldsInSection };
      if (updatedFormFields[sectionId]) {
        updatedFormFields[sectionId] = updatedFormFields[sectionId].filter(
          (item) => item.formItemID !== field.formItemID
        );
      }
      return { ...state, formAvailableFieldsInSection: updatedFormFields };
    }
  ),
  //Form Fields
  on(dynamicFormsActions.dynamicFormLoadFields, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(
    dynamicFormsActions.dynamicFormLoadFieldsSuccess,
    (state, { sectionId, formFields }) => ({
      ...state,
      formFields: {
        ...state.formFields,
        [sectionId]: formFields,
      },
      error: null,
      isLoading: false,
      loaded: true,
    })
  ),
  on(dynamicFormsActions.dynamicFormLoadFieldsFailure, (state, { error }) => ({
    ...state,
    error,
    isLoading: false,
    loaded: false,
  })),
  // on(
  //   dynamicFormsActions.dynamicFormLoadAllFieldsSuccess,
  //   (state, { formSections, formFields }) => {
  //     const updatedFormFields = { ...state.formFields };

  //     formSections.forEach(formSection => {
  //       const fieldsInSection = formFields.filter(
  //         item => item.formItemSectionDetail.formSectionID === formSection.formSectionID
  //       );
  //       updatedFormFields[formSection.formSectionID] = fieldsInSection;
  //     });

  //     return {
  //       ...state,
  //       formFields: updatedFormFields,
  //       error: null,
  //       isLoading: false,
  //       loaded: true,
  //     };
  //   }
  // ),
  // on(dynamicFormsActions.dynamicFormLoadAllFieldsFailure, (state, { error }) => ({
  //   ...state,
  //   error,
  //   isLoading: false,
  //   loaded: false,
  // })),

  // on(
  //   dynamicFormsActions.updateFormFieldBySectionId,
  //   (state, { sectionId, field }) => {
  //     const updatedFormFields = { ...state.formFields };
  //     if (updatedFormFields[sectionId]) {
  //       const existingFieldIndex = updatedFormFields[sectionId].findIndex(
  //         (item) => item.formItemID === field.formItemID
  //       );
  //       if (existingFieldIndex !== -1) {
  //         updatedFormFields[sectionId][existingFieldIndex] = field;
  //       }
  //       // else {
  //       //   // If the field doesn't exist, add it to the array
  //       //   updatedFormFields[sectionId].push(field);
  //       // }
  //     }
  //     return { ...state, formFields: updatedFormFields };
  //   }
  // ),
  //Form Item Control Types
  on(dynamicFormsActions.dynamicFormLoadFormItemControlTypes, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(
    dynamicFormsActions.dynamicFormLoadFormItemControlTypesSuccess,
    (state, { formItemControlTypes }) => ({
      ...state,
      error: null,
      formItemControlTypes,
      isLoading: false,
    })
  ),
  on(
    dynamicFormsActions.dynamicFormLoadFormItemControlTypesFailure,
    (state, { error }): DynamicFormsState => ({
      ...state,
      error,
      isLoading: false,
    })
  ),
  //Form Item Data Types
  on(dynamicFormsActions.dynamicFormLoadFormItemDataTypes, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(
    dynamicFormsActions.dynamicFormLoadFormItemDataTypesSuccess,
    (state, { formItemDataTypes }) => ({
      ...state,
      error: null,
      formItemDataTypes,
      isLoading: false,
    })
  ),
  on(
    dynamicFormsActions.dynamicFormLoadFormItemDataTypesFailure,
    (state, { error }): DynamicFormsState => ({
      ...state,
      error,
      isLoading: false,
    })
  ),
  //Form Item Widgets
  on(dynamicFormsActions.dynamicFormLoadWidgetByWidgetId, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(
    dynamicFormsActions.dynamicFormLoadWidgetByWidgetIdSuccessWithStatus,
    (state, { widgetId, apiResponse }) => {
      const updatedResponses = {
        ...state.formItemWidgetsApiResponses,
        [widgetId]: apiResponse,
      };
      return {
        ...state,
        formItemWidgetsApiResponses: updatedResponses,
        error: null,
      };
    }
  ),
  on(
    dynamicFormsActions.dynamicFormLoadWidgetByWidgetIdFailure,
    (state, { error }): DynamicFormsState => ({
      ...state,
      error,
      isLoading: false,
    })
  ),
  //Form Item Database Tables
  on(dynamicFormsActions.dynamicFormLoadDatabaseTables, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(
    dynamicFormsActions.dynamicFormLoadDatabaseTablesSuccess,
    (state, { formItemDatabaseTables }) => ({
      ...state,
      error: null,
      formItemDatabaseTables,
      isLoading: false,
    })
  ),
  on(
    dynamicFormsActions.dynamicFormLoadFormItemDataTypesFailure,
    (state, { error }): DynamicFormsState => ({
      ...state,
      error,
      isLoading: false,
    })
  ),
  //Form Item Database Columns for Tables
  on(
    dynamicFormsActions.dynamicFormLoadDatabaseColumnsByTableName,
    (state) => ({
      ...state,
      isLoading: true,
    })
  ),
  on(
    dynamicFormsActions.dynamicFormLoadDatabaseColumnsByTableNameSuccess,
    (state, { tableName, formItemDatabaseColumns }) => ({
      ...state,
      formItemDatabaseColumns: {
        ...state.formItemDatabaseColumns,
        [tableName]: formItemDatabaseColumns,
      },
      error: null,
      isLoading: false,
      loaded: true,
    })
  ),
  on(
    dynamicFormsActions.dynamicFormLoadDatabaseColumnsByTableNameFailure,
    (state, { error }) => ({
      ...state,
      error,
      isLoading: false,
      loaded: false,
    })
  ),
  //Form Item Dropdowns
  on(dynamicFormsActions.dynamicFormLoadFormItemDropdowns, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(
    dynamicFormsActions.dynamicFormLoadFormItemDropdownsSuccess,
    (state, { formItemDropdowns }) => ({
      ...state,
      error: null,
      formItemDropdowns,
      isLoading: false,
    })
  ),
  on(
    dynamicFormsActions.dynamicFormLoadFormItemDropdownsFailure,
    (state, { error }) => ({
      ...state,
      error,
      isLoading: false,
    })
  ),
  // Render Form
  on(dynamicFormsActions.dynamicFormLoadRenderForm, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(
    dynamicFormsActions.dynamicFormLoadRenderFormSuccess,
    (state, { renderFormData }) => ({
      ...state,
      error: null,
      renderFormData,
      isLoading: false,
    })
  ),
  on(
    dynamicFormsActions.dynamicFormLoadRenderFormFailure,
    (state, { error }) => ({
      ...state,
      error: error,
      renderFormError: error,
      isLoading: false,
    })
  ),
  // Form Name
  on(dynamicFormsActions.dynamicFormLoadFormName, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(
    dynamicFormsActions.dynamicFormLoadFormNameSuccess,
    (state, { formName }) => ({
      ...state,
      error: null,
      formName,
      isLoading: false,
    })
  ),
  on(
    dynamicFormsActions.dynamicFormLoadFormNameFailure,
    (state, { error }) => ({
      ...state,
      error,
      isLoading: false,
    })
  ),
  // Parent Link
  on(dynamicFormsActions.renderFormLoadLoadParentLink, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(
    dynamicFormsActions.renderFormLoadLoadParentLinkSuccess,
    (state, { objectParentLinker }) => ({
      ...state,
      error: null,
      objectParentLinker,
      isLoading: false,
    })
  ),
  on(
    dynamicFormsActions.renderFormLoadLoadParentLinkFailure,
    (state, { error }) => ({
      ...state,
      error,
      isLoading: false,
    })
  ),
  // Render Form Dropdowns
  on(dynamicFormsActions.renderFormLoadFormItemDropdowns, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(
    dynamicFormsActions.renderFormLoadFormItemDropdownsSuccess,
    (state, { renderFormDropdowns }) => ({
      ...state,
      error: null,
      renderFormDropdowns,
      isLoading: false,
    })
  ),
  on(
    dynamicFormsActions.renderFormLoadFormItemDropdownsFailure,
    (state, { error }) => ({
      ...state,
      error,
      isLoading: false,
    })
  ),

  // Save Render Form
  on(dynamicFormsActions.saveRenderForm, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(dynamicFormsActions.saveRenderFormSuccess, (state, { apiResponse }) => ({
    ...state,
    error: null,
    saveRenderFormResponse: apiResponse ? apiResponse : 'unsuccessful',
    isLoading: false,
    loaded: true,
  })),
  on(
    dynamicFormsActions.saveRenderFormFailure,
    (state, { error }): DynamicFormsState => ({
      ...state,
      error,
      isLoading: false,
      loaded: false,
    })
  )
);

export function dynamicFormsReducer(
  state: DynamicFormsState | undefined,
  action: Action
) {
  return reducer(state, action);
}
