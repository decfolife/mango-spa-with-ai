import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Api, ApiResponse } from '@mango/data-models/lib-data-models';
import { UtilitiesService } from '@mango/core-shared';
import { IAIOutput } from '../models/ai-output.model';
import { AiLeaseListItem } from '../models/ai-form.model';

export interface AiAbstractionDetail {
  aiAbstractionId: number;
  buildingId: number;
  buildingName?: string;
  formId?: number;
  formName?: string;
  portfolioId?: number;
  portfolioName?: string;
  premiseId?: number;
  status: 'Pending' | 'Processing' | 'Complete' | 'Error' | 'Cancelled';
  completedDate?: string;
  errorMessage?: string;
  contextJson?: string;
  aiOutputJson?: string;
  aiTenant?: string;
  aiLeaseEndDate?: string;
  reviewedFormData?: string;
  createdDate: string;
  lastModifiedDate: string;
}

export interface CreateAiAbstractionResponse {
  aiAbstractionId: number;
}

export interface AiAbstractionDocument {
  documentId?: number;
  aiAbstractionId?: number;
  fileName?: string;
  documentFileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  sortOrder?: number;
  url?: string;
  documentUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AiLeaseService {
  private readonly apiUrl = UtilitiesService.getBaseApiUrl(
    Api.formWizard,
    'http://localhost:5000'
  );

  constructor(private readonly http: HttpClient) {}

  createAbstraction(
    formData: FormData
  ): Observable<CreateAiAbstractionResponse> {
    return this.http
      .post<ApiResponse>(
        `${this.apiUrl}AiAbstractions/CreateAiAbstraction`,
        formData,
        {
          headers: { enctype: 'multipart/form-data' },
        }
      )
      .pipe(map((res) => res.data as CreateAiAbstractionResponse));
  }

  getAbstractionById(id: number): Observable<AiAbstractionDetail | null> {
    return this.http
      .get<ApiResponse>(`${this.apiUrl}AiAbstractions/GetAiAbstractionById`, {
        params: { aiAbstractionId: id },
      })
      .pipe(map((res) => (res.data as AiAbstractionDetail) ?? null));
  }

  getAbstractionListByBuilding(buildingId: number): Observable<AiAbstractionDetail[]> {
    return this.http
      .get<ApiResponse>(
        `${this.apiUrl}AiAbstractions/GetAiAbstractionsByBuilding`,
        {
          params: { buildingId },
        }
      )
      .pipe(map((res) => res.data as AiAbstractionDetail[]));
  }

  getAbstractionList(): Observable<AiAbstractionDetail[]> {
    return this.http
      .get<ApiResponse>(`${this.apiUrl}AiAbstractions/GetAiAbstractionsList`)
      .pipe(map((res) => res.data as AiAbstractionDetail[]));
  }

  getAbstractionDocuments(
    aiAbstractionId: number
  ): Observable<AiAbstractionDocument[]> {
    return this.http
      .get<ApiResponse>(
        `${this.apiUrl}AiAbstractions/GetAiAbstractionDocuments`,
        {
          params: { aiAbstractionId },
        }
      )
      .pipe(map((res) => (res.data as AiAbstractionDocument[]) ?? []));
  }

  getAbstractionDocumentUrl(document: AiAbstractionDocument): string | null {
    const explicitUrl = document.url ?? document.documentUrl ?? null;
    if (explicitUrl) {
      return explicitUrl;
    }

    const documentId = document.documentId;
    if (!documentId) {
      return null;
    }

    return `${this.apiUrl}AiAbstractions/GetAiAbstractionDocumentFile?documentId=${documentId}`;
  }

  getAbstractionDocumentBlob(document: AiAbstractionDocument): Observable<Blob> {
    const documentUrl = this.getAbstractionDocumentUrl(document);
    return this.http.get(documentUrl!, {
      responseType: 'blob',
      headers: {
        'source-app': 'crem-mango',
      },
    });
  }

  getAbstractionDocumentFile(document: AiAbstractionDocument): Observable<File> {
    const fileName =
      document.fileName ??
      document.documentFileName ??
      `document-${document.documentId ?? 'unknown'}`;

    return this.getAbstractionDocumentBlob(document).pipe(
      map(
        (blob) =>
          new File([blob], fileName, {
            type: blob.type || document.mimeType || 'application/octet-stream',
          })
      )
    );
  }

  /**
   * Returns the parsed IAIOutput for an abstraction whenever aiOutputJson exists.
   * Calls the backend GetAiAbstractionById endpoint and deserialises aiOutputJson.
   * Returns null if the abstraction has no output yet.
   */
  getLeaseById(id: number): Observable<IAIOutput | null> {
    return this.getAbstractionById(id).pipe(
      map((detail) => {
        if (!detail || !detail.aiOutputJson) {
          return null;
        }
        try {
          return JSON.parse(detail.aiOutputJson) as IAIOutput;
        } catch {
          return null;
        }
      })
    );
  }

  saveReviewedFormData(
    aiAbstractionId: number,
    reviewedFormData: string
  ): Observable<void> {
    return this.http
      .post<ApiResponse>(`${this.apiUrl}AiAbstractions/SaveReviewedFormData`, {
        aiAbstractionId,
        reviewedFormData,
      })
      .pipe(map(() => void 0));
  }

  /**
   * Calls the backend to load form fields + sections, apply AI output mapping,
   * and return field objects with formItemAnswer already populated.
   * The backend handles both fetching form fields and mapping AI values.
   */
  getMappedFormFields(
    aiAbstractionId: number,
    formId: number,
    objectTypeId = 4
  ): Observable<{ fields: any[]; sections: any[] }> {
    return this.http
      .get<ApiResponse>(`${this.apiUrl}AiAbstractions/GetMappedFormFields`, {
        params: { aiAbstractionId, formId, objectTypeId },
      })
      .pipe(map((res) => res.data as { fields: any[]; sections: any[] }));
  }

  /**
   * Returns the list of abstractions for a building, mapped to the grid model.
   */
  getLeaseList(): Observable<AiLeaseListItem[]> {
    return this.getAbstractionList().pipe(
      map((items) =>
        items.map((item) => ({
          id: item.aiAbstractionId,
          buildingId: item.buildingId,
          buildingName: item.buildingName ?? undefined,
          formId: item.formId ?? undefined,
          formName: item.formName ?? undefined,
          portfolioId: item.portfolioId ?? undefined,
          portfolioName: item.portfolioName ?? undefined,
          premiseId: item.premiseId ?? undefined,
          status: item.status,
          aiTenant: item.aiTenant ?? undefined,
          aiLeaseEndDate: item.aiLeaseEndDate ?? undefined,
          createdDate: item.createdDate,
          lastModifiedDate: item.lastModifiedDate,
        }))
      )
    );
  }
}
