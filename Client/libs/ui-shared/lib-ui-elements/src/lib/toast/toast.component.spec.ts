import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';

import { ToastComponent } from './toast.component';

(global as any).ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
import { ToastState } from '@mango/data-models/lib-data-models';
import { ElementRef } from '@angular/core';

export class MockElementRef extends ElementRef {
  nativeElement = {
    remove() {},
  };
}

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let elementRef: ElementRef;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [{ provide: ElementRef, useClass: MockElementRef }],
    });
    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    elementRef = TestBed.inject(ElementRef);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('#getWrapperCSS', () => {
    it('should return (20 20) when the position is top left', () => {
      component.position = 'top left';
      const offset = component.getWrapperCSS();
      expect(offset).toEqual({
        maxWidth: '320px',
        top: '20px',
        left: '20px',
        transition: 'all 0.3s ease',
      });
    });

    it('should return (0 20) when the position is top center', () => {
      component.position = 'top center';
      const offset = component.getWrapperCSS();
      expect(offset).toEqual({
        maxWidth: '320px',
        top: '20px',
        left: '40%',
        transition: 'all 0.3s ease',
      });
    });

    it('should return (-40 20) when the position is top right', () => {
      component.position = 'top right';
      const offset = component.getWrapperCSS();
      expect(offset).toEqual({
        maxWidth: '320px',
        top: '20px',
        right: '20px',
        transition: 'all 0.3s ease',
      });
    });

    it('should return (20 -80) when the position is bottom left', () => {
      component.position = 'bottom left';
      const offset = component.getWrapperCSS();
      expect(offset).toEqual({
        maxWidth: '320px',
        bottom: '20px',
        left: '20px',
        transition: 'all 0.3s ease',
      });
    });

    it('should return (0 -80) when the position is bottom center', () => {
      component.position = 'bottom center';
      const offset = component.getWrapperCSS();
      expect(offset).toEqual({
        maxWidth: '320px',
        bottom: '20px',
        left: '40%',
        transition: 'all 0.3s ease',
      });
    });

    it('should return (-40 -80) when the position is bottom right', () => {
      component.position = 'bottom right';
      const offset = component.getWrapperCSS();
      expect(offset).toEqual({
        maxWidth: '320px',
        bottom: '20px',
        right: '20px',
        transition: 'all 0.3s ease',
      });
    });
  });

  describe('#getToastBorderColor', () => {
    it('should return info-toast-border-color when the state is INFORMATION', () => {
      component.state = ToastState.INFORMATION;
      const borderColor = component.getToastBorderColor();
      expect(borderColor).toEqual('info-toast-border-color');
    });

    it('should return success-toast-border-color when the state is SUCCESS', () => {
      component.state = ToastState.SUCCESS;
      const borderColor = component.getToastBorderColor();
      expect(borderColor).toEqual('success-toast-border-color');
    });

    it('should return warning-toast-border-color when the state is WARNING', () => {
      component.state = ToastState.WARNING;
      const borderColor = component.getToastBorderColor();
      expect(borderColor).toEqual('warning-toast-border-color');
    });

    it('should return error-toast-border-color when the state is ERROR', () => {
      component.state = ToastState.ERROR;
      const borderColor = component.getToastBorderColor();
      expect(borderColor).toEqual('error-toast-border-color');
    });
  });

  describe('#getIconBgColorClasses', () => {
    it('should return info-icon-bgcolor when the state is INFORMATION', () => {
      component.state = ToastState.INFORMATION;
      const iconBgColor = component.getIconBgColorClasses();
      expect(iconBgColor).toEqual('info-icon-bgcolor');
    });

    it('should return success-icon-bgcolor when the state is SUCCESS', () => {
      component.state = ToastState.SUCCESS;
      const iconBgColor = component.getIconBgColorClasses();
      expect(iconBgColor).toEqual('success-icon-bgcolor');
    });

    it('should return warning-icon-bgcolor when the state is WARNING', () => {
      component.state = ToastState.WARNING;
      const iconBgColor = component.getIconBgColorClasses();
      expect(iconBgColor).toEqual('warning-icon-bgcolor');
    });

    it('should return error-icon-bgcolor when the state is ERROR', () => {
      component.state = ToastState.ERROR;
      const iconBgColor = component.getIconBgColorClasses();
      expect(iconBgColor).toEqual('error-icon-bgcolor');
    });
  });

  describe('#close', () => {
    it('should call ngOnDestroy', () => {
      const ngOnDestroySpy = jest.spyOn(component, 'ngOnDestroy');
      component.close();
      expect(ngOnDestroySpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('#setupAutoHide', () => {
    it('should not call ngOnDestroy when duration is -1', () => {
      component.duration = -1;
      const ngOnDestroySpy = jest.spyOn(component, 'ngOnDestroy');
      expect(ngOnDestroySpy).toHaveBeenCalledTimes(0);
    });

    it('should call ngOnDestroy after 2s when duration is 2000', fakeAsync(() => {
      const ngOnDestroySpy = jest.spyOn(component, 'ngOnDestroy');
      component.duration = 2000;
      tick(2000);
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(ngOnDestroySpy).toHaveBeenCalledTimes(1);
      });
    }));
  });

  describe('#ngOnDestroy', () => {
    xit('should remove the toast from the DOM', () => {
      const elementRefRemoveSpy = jest.spyOn(
        elementRef.nativeElement,
        'remove'
      );
      component.ngOnDestroy();
      expect(elementRefRemoveSpy).toHaveBeenCalledTimes(1);
    });
  });
});
