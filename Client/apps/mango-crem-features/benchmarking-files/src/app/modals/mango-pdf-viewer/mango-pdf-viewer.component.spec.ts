import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MangoPdfViewerComponent } from './mango-pdf-viewer.component';

describe('MangoPdfViewerComponent', () => {
  let component: MangoPdfViewerComponent;
  let fixture: ComponentFixture<MangoPdfViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MangoPdfViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MangoPdfViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
