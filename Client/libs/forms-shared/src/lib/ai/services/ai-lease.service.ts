import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Api, ApiResponse } from '@mango/data-models/lib-data-models';
import { UtilitiesService } from '@mango/core-shared';
import { IAIOutput } from '../models/ai-output.model';
import { AiLeaseListItem } from '../models/ai-form.model';

export interface AiAbstractionDetail {
  abstractionId: number;
  buildingId: number;
  portfolioId?: number;
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
  abstractionId: number;
}

@Injectable({ providedIn: 'root' })
export class AiLeaseService {
  private readonly apiUrl = UtilitiesService.getBaseApiUrl(Api.formWizard);

  constructor(private readonly http: HttpClient) {}

  createAbstraction(formData: FormData): Observable<CreateAiAbstractionResponse> {
    return this.http
      .post<ApiResponse>(`${this.apiUrl}AiAbstractions/CreateAiAbstraction`, formData, {
        headers: { enctype: 'multipart/form-data' },
      })
      .pipe(map((res) => res.data as CreateAiAbstractionResponse));
  }

  getAbstractionById(id: number): Observable<AiAbstractionDetail | null> {
    return this.http
      .get<ApiResponse>(`${this.apiUrl}AiAbstractions/GetAiAbstractionById`, {
        params: { abstractionId: id },
      })
      .pipe(map((res) => (res.data as AiAbstractionDetail) ?? null));
  }

  getAbstractionList(buildingId: number): Observable<AiAbstractionDetail[]> {
    return this.http
      .get<ApiResponse>(`${this.apiUrl}AiAbstractions/GetAiAbstractionsByBuilding`, {
        params: { buildingId },
      })
      .pipe(map((res) => res.data as AiAbstractionDetail[]));
  }

  /**
   * Returns the parsed IAIOutput for a completed abstraction.
   * Calls the backend GetAiAbstractionById endpoint and deserialises aiOutputJson.
   * Returns null if the abstraction is not yet complete or has no output.
   */
  getLeaseById(id: number): Observable<IAIOutput | null> {
    return this.getAbstractionById(id).pipe(
      map((detail) => {
        if (!detail || detail.status !== 'Complete' || !detail.aiOutputJson) {
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

  saveReviewedFormData(abstractionId: number, reviewedFormData: string): Observable<void> {
    return this.http
      .post<ApiResponse>(
        `${this.apiUrl}AiAbstractions/SaveReviewedFormData`,
        { abstractionId, reviewedFormData }
      )
      .pipe(map(() => void 0));
  }

  /**
   * Returns the list of abstractions for a building, mapped to the grid model.
   */
  getLeaseList(buildingId: number): Observable<AiLeaseListItem[]> {
    return this.getAbstractionList(buildingId).pipe(
      map((items) =>
        items.map((item) => ({
          id: item.abstractionId,
          buildingId: item.buildingId,
          portfolioId: item.portfolioId ?? undefined,
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
