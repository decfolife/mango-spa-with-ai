import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyLeaseComponent } from './copy-lease.component';

describe('CopyLeaseComponent', () => {
  let component: CopyLeaseComponent;
  let fixture: ComponentFixture<CopyLeaseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CopyLeaseComponent],
    });
    fixture = TestBed.createComponent(CopyLeaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
