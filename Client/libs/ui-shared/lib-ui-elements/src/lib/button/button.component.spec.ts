import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { ButtonModule } from './button.module';
import { SimpleChange } from '@angular/core';
import { DataIdBreadcrumbProviderService } from '@mango/core-shared';
import { of } from 'rxjs';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  const defaultSimpleChangeMock = {
    btnStyle: new SimpleChange(undefined, undefined, true),
    size: new SimpleChange(undefined, undefined, true),
    iconPosition: new SimpleChange(undefined, undefined, true),
  };

  let getCssClassesResponseMock = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonModule],
      declarations: [ButtonComponent],
      providers: [
        {
          provide: DataIdBreadcrumbProviderService,
          useValue: { getBreadcrumbs: () => of([]) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    getCssClassesResponseMock = {
      'btn-flat': false,
      'btn-basic': false,
      'btn-stroked': false,
      'btn-primary': false,
      'btn-secondary': false,
      'btn-warning': false,
      'btn-danger': false,
      'btn-small': false,
      'btn-big': false,
      'btn-icon-left': false,
      'btn-icon-right': false,
      'no-text': true,
      'text-nowrap': false,
    };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#ngOnChanges should set btnStyle, size, iconPosition to default values when undefined', () => {
    component.ngOnChanges(defaultSimpleChangeMock);
    expect(component.btnStyle).toEqual('flat');
    expect(component.size).toEqual('medium');
    expect(component.iconPosition).toEqual('left');
  });

  it('#getCssClasses btn-flat should be true, btn-basic and btn-stroked should be false when btnStyle is flat', () => {
    getCssClassesResponseMock['btn-flat'] = true;
    component.btnStyle = 'flat';
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#getCssClasses btn-basic should be true, btn-flat and btn-stroked should be false when btnStyle is basic', () => {
    getCssClassesResponseMock['btn-basic'] = true;
    component.btnStyle = 'basic';
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#getCssClasses btn-basic should be true, btn-flat and btn-stroked should be false when type is text', () => {
    getCssClassesResponseMock['btn-basic'] = true;
    component.type = 'text';
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#getCssClasses btn-primary should be true, btn-secondary, btn-warning and btn-danger should be false when color is primary', () => {
    getCssClassesResponseMock['btn-primary'] = true;
    component.color = 'primary';
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#getCssClasses btn-primary should be true, btn-secondary, btn-warning and btn-danger should be false when type is primary', () => {
    getCssClassesResponseMock['btn-primary'] = true;
    component.type = 'primary';
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#getCssClasses btn-secondary should be true, btn-primary, btn-warning and btn-danger should be false when color is secondary', () => {
    getCssClassesResponseMock['btn-secondary'] = true;
    component.color = 'secondary';
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#getCssClasses btn-secondary should be true, btn-primary, btn-warning and btn-danger should be false when type is secondary', () => {
    getCssClassesResponseMock['btn-secondary'] = true;
    component.type = 'secondary';
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#getCssClasses btn-warning should be true, btn-primary, btn-secondary and btn-danger should be false when color is warning', () => {
    getCssClassesResponseMock['btn-warning'] = true;
    component.color = 'warning';
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#getCssClasses btn-danger should be true, btn-primary, btn-secondary and btn-warning should be false when color is danger', () => {
    getCssClassesResponseMock['btn-danger'] = true;
    component.color = 'danger';
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#getCssClasses btn-small should be true and btn-big should be false when size is small', () => {
    getCssClassesResponseMock['btn-small'] = true;
    component.size = 'small';
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#getCssClasses btn-big should be true and btn-small should be false when size is big', () => {
    getCssClassesResponseMock['btn-big'] = true;
    component.size = 'big';
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#getCssClasses btn-icon-left should be true and btn-icon-right should be false when iconPosition is left', () => {
    getCssClassesResponseMock['btn-icon-left'] = true;
    component.iconPosition = 'left';
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#getCssClasses btn-icon-right should be true and btn-icon-left should be false when iconPosition is right', () => {
    getCssClassesResponseMock['btn-icon-right'] = true;
    component.iconPosition = 'right';
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#getCssClasses no-text should be true when text is undefined', () => {
    component.text = undefined;
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#getCssClasses no-text should be true when text is empty string', () => {
    component.text = '';
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#getCssClasses no-text should be false when text is NOT an empty string', () => {
    getCssClassesResponseMock['no-text'] = false;
    component.text = 'xyz';
    const response = component.getCssClasses();
    expect(response).toEqual(getCssClassesResponseMock);
  });

  it('#handleClick should emit buttonClick event', () => {
    const buttonClickSpy = jest.spyOn(component.buttonClick, 'emit');
    component.handleClick();
    expect(buttonClickSpy).toHaveBeenCalled();
  });
});
