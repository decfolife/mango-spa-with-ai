import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

interface SidebarState {
  isOpen: boolean;
  searchQuery: string | null;
}

@Injectable({ providedIn: 'root' })
export class AiSidebarService {
  private readonly stateSubject = new BehaviorSubject<SidebarState>({
    isOpen: false,
    searchQuery: null,
  });

  readonly isOpen$ = this.stateSubject.pipe(map((s) => s.isOpen));
  readonly searchQuery$ = this.stateSubject.pipe(map((s) => s.searchQuery));

  toggle(): void {
    const { isOpen, searchQuery } = this.stateSubject.value;
    this.stateSubject.next({ isOpen: !isOpen, searchQuery });
  }

  open(): void {
    this.stateSubject.next({ ...this.stateSubject.value, isOpen: true });
  }

  close(): void {
    this.stateSubject.next({ isOpen: false, searchQuery: null });
  }

  searchDocument(query: string): void {
    this.stateSubject.next({ isOpen: true, searchQuery: query });
  }

  get isOpen(): boolean {
    return this.stateSubject.value.isOpen;
  }
}
