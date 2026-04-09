import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

interface SidebarState {
  isOpen: boolean;
  leaseId: number | null;
}

@Injectable({ providedIn: 'root' })
export class AiSidebarService {
  private readonly stateSubject = new BehaviorSubject<SidebarState>({ isOpen: false, leaseId: null });
  readonly state$ = this.stateSubject.asObservable();
  readonly isOpen$ = this.state$.pipe(map((s) => s.isOpen));

  toggle(leaseId?: number): void {
    const { isOpen, leaseId: currentId } = this.stateSubject.value;
    this.stateSubject.next({ isOpen: !isOpen, leaseId: leaseId !== undefined ? leaseId : currentId });
  }

  open(leaseId?: number): void {
    const currentId = this.stateSubject.value.leaseId;
    this.stateSubject.next({ isOpen: true, leaseId: leaseId !== undefined ? leaseId : currentId });
  }

  close(): void {
    this.stateSubject.next({ isOpen: false, leaseId: null });
  }

  get isOpen(): boolean {
    return this.stateSubject.value.isOpen;
  }
}
