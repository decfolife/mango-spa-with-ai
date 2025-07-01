import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentImportHistoryComponent } from './document-import-history.component';

describe('DocumentImportHistoryComponent', () => {
  let component: DocumentImportHistoryComponent;
  let fixture: ComponentFixture<DocumentImportHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentImportHistoryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentImportHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
