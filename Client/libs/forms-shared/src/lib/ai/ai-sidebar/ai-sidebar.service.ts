import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { IAIOutput } from '../models/ai-output.model';

interface SidebarState {
  isOpen: boolean;
  leaseId: number | null;
  aiOutput: IAIOutput | null;
  searchQuery: string | null;
}

@Injectable({ providedIn: 'root' })
export class AiSidebarService {
  private readonly stateSubject = new BehaviorSubject<SidebarState>({
    isOpen: false,
    leaseId: null,
    aiOutput: null,
    searchQuery: null,
  });
  readonly state$ = this.stateSubject.asObservable();
  readonly isOpen$ = this.state$.pipe(map((s) => s.isOpen));
  readonly searchQuery$ = this.state$.pipe(map((s) => s.searchQuery));

  toggle(leaseId?: number): void {
    const { isOpen, leaseId: currentId, aiOutput, searchQuery } = this.stateSubject.value;
    this.stateSubject.next({
      isOpen: !isOpen,
      leaseId: leaseId !== undefined ? leaseId : currentId,
      aiOutput,
      searchQuery,
    });
  }

  open(leaseId?: number): void {
    const { leaseId: currentId, aiOutput, searchQuery } = this.stateSubject.value;
    this.stateSubject.next({
      isOpen: true,
      leaseId: leaseId !== undefined ? leaseId : currentId,
      aiOutput,
      searchQuery,
    });
  }

  setAiOutput(leaseId: number, aiOutput: IAIOutput): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      leaseId,
      aiOutput,
    });
  }

  searchDocument(query: string): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      isOpen: true,
      searchQuery: query,
    });
  }

  close(): void {
    this.stateSubject.next({ isOpen: false, leaseId: null, aiOutput: null, searchQuery: null });
  }

  get isOpen(): boolean {
    return this.stateSubject.value.isOpen;
  }
}
