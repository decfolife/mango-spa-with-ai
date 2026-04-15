import { forwardRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CremRadioComponent } from './radio.component';
import { CremRadioService } from './radio.service';
import { CremRadioGroupComponent } from './radio-group.component';

describe('CremRadioComponent', () => {
  let component: CremRadioComponent;
  let fixture: ComponentFixture<CremRadioComponent>;
  let service: CremRadioService;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CremRadioComponent],
      providers: [
        CremRadioService,
        {
          provide: CremRadioGroupComponent,
          useFactory: (radioService: CremRadioService) => ({
            value: null as any,
            writeValue: (v: any) => {
              radioService.select(v);
            },
          }),
          deps: [CremRadioService],
        },
        {
          provide: NG_VALUE_ACCESSOR,
          useExisting: forwardRef(() => CremRadioComponent),
          multi: true,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CremRadioComponent);
    service = TestBed.inject(CremRadioService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('#ngOnInit should set name as recieved by name$', () => {
    const setupClickListenerSpy = jest.spyOn(
      component as any,
      'setupClickListener'
    );
    component.ngOnInit();
    service.setName('name');

    service.name$.subscribe(() => {
      expect(component.name).toEqual('name');
    });
    expect(setupClickListenerSpy).toHaveBeenCalledTimes(1);
  });

  it('#ngOnInit should set disabled to true if disabled$ emits true', () => {
    const setupClickListenerSpy = jest.spyOn(
      component as any,
      'setupClickListener'
    );
    component.ngOnInit();
    service.setDisabled(true);

    service.disabled$.subscribe(() => {
      expect(component.disabled).toEqual(true);
    });
    expect(setupClickListenerSpy).toHaveBeenCalledTimes(1);
  });

  it('#ngOnInit should set disabled to false if disabled$ emits false', () => {
    const setupClickListenerSpy = jest.spyOn(
      component as any,
      'setupClickListener'
    );
    component.ngOnInit();
    service.setDisabled(false);

    service.disabled$.subscribe(() => {
      expect(component.disabled).toEqual(false);
    });
    expect(setupClickListenerSpy).toHaveBeenCalledTimes(1);
  });

  it('#ngOnInit should set checked to true if value recieved by selected$ is equal to @Input() value', () => {
    const setupClickListenerSpy = jest.spyOn(
      component as any,
      'setupClickListener'
    );
    component.value = 'selected';
    component.ngOnInit();
    service.select('selected');

    service.selected$.subscribe(() => {
      expect(component.checked).toBe(true);
    });
    expect(setupClickListenerSpy).toHaveBeenCalledTimes(1);
  });

  it('#ngOnInit should set checked to false if value recieved by selected$ is NOT EQUAL to @Input() value', () => {
    const setupClickListenerSpy = jest.spyOn(
      component as any,
      'setupClickListener'
    );
    component.value = 'selected';
    component.ngOnInit();
    service.select('not selected');

    service.selected$.subscribe(() => {
      expect(component.checked).toBe(false);
    });
    expect(setupClickListenerSpy).toHaveBeenCalledTimes(1);
  });

  it('#registerOnChange should assign function passed as parameter to onChange', () => {
    const registerOnChangeMockFunction = jest.fn(() => 'New York');
    component.registerOnChange(registerOnChangeMockFunction);

    expect(component.onChange).toEqual(registerOnChangeMockFunction);
  });

  it('#registerOnTouched should assign function passed as parameter to onTouched', () => {
    const registerOnTouchedMockFunction = jest.fn(() => true);
    component.registerOnTouched(registerOnTouchedMockFunction);

    expect(component.onTouched).toEqual(registerOnTouchedMockFunction);
  });

  it('#setDisabledState should set disabled to true', () => {
    component.setDisabledState(true);

    expect(component.disabled).toBe(true);
  });
  it('#setDisabledState should set disabled to false', () => {
    component.setDisabledState(false);

    expect(component.disabled).toBe(false);
  });

  it('#writeValue should set checked to true', () => {
    component.value = 'selected';
    component.writeValue('selected' as any);

    expect(component.checked).toBe(true);
  });
  it('#writeValue should set checked to false', () => {
    component.value = 'selected';
    component.writeValue('other' as any);

    expect(component.checked).toBe(false);
  });

  // describe('#setupClickListener', () => {
  //   it('should call event.stopPropagration() and event.preventDefault() and radioService.select()', ((done) => {
  //     const eventMock = new MouseEvent('click', { bubbles: true })
  //     const stopPropagationSpy = jest.spyOn(eventMock, 'stopPropagation')
  //     const preventDefaultSpy = jest.spyOn(eventMock, 'preventDefault')
  //     const selectSpy = jest.spyOn(service, 'select')
  //     component['setupClickListener']().subscribe(() => {
  //       expect(stopPropagationSpy).toHaveBeenCalled()
  //       expect(preventDefaultSpy).toHaveBeenCalled()
  //       expect(selectSpy).toHaveBeenCalled()
  //       done()
  //     })
  //     fixture.nativeElement.dispatchEvent(eventMock)
  //   }))

  //   it('should not call radioService.select() when disabled is true', ((done) => {
  //     const eventMock = new MouseEvent('click', { bubbles: true })
  //     const selectSpy = jest.spyOn(service, 'select')
  //     component.disabled = true
  //     component['setupClickListener']().subscribe(() => {
  //       expect(selectSpy).toHaveBeenCalledTimes(0)
  //       done()
  //     })
  //     fixture.nativeElement.dispatchEvent(eventMock)
  //   }))
  // })
});
