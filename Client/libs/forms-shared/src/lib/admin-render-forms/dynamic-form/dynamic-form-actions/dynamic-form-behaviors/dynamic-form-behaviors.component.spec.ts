import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicFormBehaviorsComponent } from './dynamic-form-behaviors.component';

describe('DynamicFormBehaviorsComponent', () => {
  let component: DynamicFormBehaviorsComponent;
  let fixture: ComponentFixture<DynamicFormBehaviorsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DynamicFormBehaviorsComponent],
    });
    fixture = TestBed.createComponent(DynamicFormBehaviorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
