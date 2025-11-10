import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { DxFileUploaderModule } from 'devextreme-angular';
import { ButtonModule, ModalModule } from '@mango/ui-shared/lib-ui-elements';
import { UploadOfflineTemplateComponent } from './upload-offline-template.component';

describe('UploadOfflineTemplateComponent', () => {
  let component: UploadOfflineTemplateComponent;
  let fixture: ComponentFixture<UploadOfflineTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadOfflineTemplateComponent],
      imports: [CommonModule, DxFileUploaderModule, ModalModule, ButtonModule],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: jest.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadOfflineTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
