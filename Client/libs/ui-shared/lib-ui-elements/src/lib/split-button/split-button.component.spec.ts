import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitButtonComponent } from './split-button.component';
import { DataIdBreadcrumbProviderService } from '@mango/core-shared';
import { of } from 'rxjs';

describe('SplitButtonComponent', () => {
  let component: SplitButtonComponent;
  let fixture: ComponentFixture<SplitButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SplitButtonComponent],
      providers: [
        {
          provide: DataIdBreadcrumbProviderService,
          useValue: { getBreadcrumbs: () => of([]) },
        },
      ],
    });
    fixture = TestBed.createComponent(SplitButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle dropDownOpen', () => {
    const event = new Event('click');

    component.dropDownOpen = false;
    component.toggleDropdown(event);

    expect(component.dropDownOpen).toBe(true);
  });

  it('should trigger onClickOutside when document is clicked', () => {
    const event = new MouseEvent('click');
    jest.spyOn(component, 'onClickOutside');

    component.dropDownOpen = true;
    document.dispatchEvent(event);

    expect(component.dropDownOpen).toBe(false);
  });

  it('selectedOption should emit selected option and close dropdown', () => {
    const event = { target: { textContent: 'Option 1' } };
    jest.spyOn(component.selectedOption, 'emit');

    component.onOptionSelect(event);

    expect(component.dropDownOpen).toBe(false);
    expect(component.selectedOption.emit).toHaveBeenCalledWith('Option 1');
  });

  it('mainButtonClick should emit true when clicked', () => {
    jest.spyOn(component.mainButtonClick, 'emit');

    component.onMainButtonClick();

    expect(component.mainButtonClick.emit).toHaveBeenCalledWith(true);
  });
});
