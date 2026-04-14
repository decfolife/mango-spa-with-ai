import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import type { DocumentSource } from 'document-viewer-sdk';
import {
  AiAbstractionDocument,
  AiLeaseService,
} from '../services/ai-lease.service';

interface DocumentOption {
  documentId: number;
  fileName: string;
  mimeType?: string;
}

@Component({
  selector: 'mango-ai-document-page',
  templateUrl: './ai-document-page.component.html',
  styleUrls: ['./ai-document-page.component.scss'],
})
export class AiDocumentPageComponent implements OnInit, OnDestroy {
  documentOptions: DocumentOption[] = [];
  selectedDocumentId: number | null = null;
  documentSource: DocumentSource | null = null;
  documentFileName: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  private aiAbstractionId: number | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly aiLeaseService: AiLeaseService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.aiAbstractionId = Number(params.get('id') ?? 0) || null;
      if (!this.aiAbstractionId) {
        this.errorMessage = 'Missing AI abstraction id.';
        return;
      }

      this.loadDocuments(this.aiAbstractionId);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDocumentSelectionChange(documentId: string): void {
    const resolvedDocumentId = Number(documentId);
    if (!resolvedDocumentId || resolvedDocumentId === this.selectedDocumentId) {
      return;
    }

    const document = this.documentOptions.find(
      (item) => item.documentId === resolvedDocumentId
    );
    if (!document) {
      return;
    }

    this.loadDocumentFile(document);
  }

  private loadDocuments(aiAbstractionId: number): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.documentSource = null;
    this.documentFileName = null;
    this.documentOptions = [];
    this.selectedDocumentId = null;

    this.aiLeaseService
      .getAbstractionDocuments(aiAbstractionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documents) => {
          const options = this.mapDocuments(documents);
          this.documentOptions = options;

          if (!options.length) {
            this.errorMessage = 'No documents were found for this AI abstraction.';
            this.isLoading = false;
            return;
          }

          const requestedDocumentId =
            Number(this.route.snapshot.queryParamMap.get('documentId') ?? 0) ||
            null;
          const initialDocument =
            options.find((item) => item.documentId === requestedDocumentId) ??
            options[0];

          this.loadDocumentFile(initialDocument);
        },
        error: () => {
          this.errorMessage = 'Failed to load document metadata.';
          this.isLoading = false;
        },
      });
  }

  private loadDocumentFile(document: DocumentOption): void {
    this.selectedDocumentId = document.documentId;
    this.documentFileName = document.fileName;
    this.documentSource = null;
    this.errorMessage = null;
    this.isLoading = true;

    this.aiLeaseService
      .getAbstractionDocumentFile({
        documentId: document.documentId,
        fileName: document.fileName,
        mimeType: document.mimeType,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (file) => {
          this.documentSource = file;
          this.errorMessage = null;
          this.isLoading = false;
        },
        error: () => {
          this.documentSource = null;
          this.errorMessage = 'Failed to load the selected document.';
          this.isLoading = false;
        },
      });
  }

  private mapDocuments(documents: AiAbstractionDocument[]): DocumentOption[] {
    return documents
      .map((document) => ({
        documentId: document.documentId ?? 0,
        fileName:
          document.fileName ??
          document.documentFileName ??
          `Document ${document.documentId ?? ''}`.trim(),
        mimeType: document.mimeType,
      }))
      .filter((document) => document.documentId > 0);
  }
}
