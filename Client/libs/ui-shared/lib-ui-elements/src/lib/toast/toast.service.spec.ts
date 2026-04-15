import {
  ChangeDetectorRef,
  ComponentRef,
  ElementRef,
  Injector,
  Type,
  ViewRef,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ToastState } from '@mango/data-models/lib-data-models';
import { ToastComponent } from './toast.component';
import { CremToastService } from './toast.service';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

class MockComponentRef extends ComponentRef<ToastComponent> {
  get changeDetectorRef(): ChangeDetectorRef {
    return null;
  }
  get componentType(): Type<any> {
    return null;
  }
  destroy(): void {}
  get hostView(): ViewRef {
    return null;
  }
  get injector(): Injector {
    return null;
  }
  get instance(): any {
    return {
      _components: [],
      heightChange: { subscribe: () => {} },
      onDestroy: { subscribe: () => {} },
      createdAt: 0,
    };
  }
  get location(): ElementRef<any> {
    return null;
  }
  onDestroy(callback: Function): void {}
  setInput(name: string, value: unknown): void {}
}

describe('CremToastService', () => {
  let service: CremToastService;
  let overlayService: Overlay;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [CremToastService],
    });
    service = TestBed.inject(CremToastService);
    overlayService = TestBed.inject(Overlay);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('#show', () => {
    let componentRef1: MockComponentRef;
    beforeEach(() => {
      componentRef1 = new MockComponentRef();
      jest
        .spyOn(service as any, '_createToastComponentRef')
        .mockReturnValue(componentRef1);
    });

    it('should create a toast component and add it to _components', () => {
      service.show('Content 1', 'Title 1');
      expect(service['_components']).toContain(componentRef1);
    });

    it('should push the created toast to the array of toasts', () => {
      const toastsCount = componentRef1.instance._components.length;
      service.show('Content 1', 'Title 1');
      expect(service['_components'].length).toStrictEqual(toastsCount + 1);
      expect(service['_components'].pop()).toBeInstanceOf(MockComponentRef);
    });
  });

  describe('#clear', () => {
    it('should call destroy method for every toast and clear out the list of _components', () => {
      const toast1Ref = new MockComponentRef();
      const toast2Ref = new MockComponentRef();
      service['_components'] = [toast1Ref, toast2Ref];
      const toast1RefSpy = jest.spyOn(toast1Ref, 'destroy');
      const toast2RefSpy = jest.spyOn(toast2Ref, 'destroy');
      service.clear();
      expect(toast1RefSpy).toHaveBeenCalledTimes(1);
      expect(toast2RefSpy).toHaveBeenCalledTimes(1);
      expect(service['_components'].length).toEqual(0);
    });
  });

  describe('#_setComponentInputs', () => {
    it('should call setInput for every parameter', () => {
      const componentRef1 = new MockComponentRef();
      const setInputSpy = jest.spyOn(componentRef1, 'setInput');

      service['_setComponentInputs'](
        componentRef1,
        'Content 1',
        'Title 1',
        ToastState.INFORMATION,
        {
          duration: 3000,
          position: 'bottom right',
          showBody: true,
          showCloseButton: true,
          maxWidth: '200px',
        }
      );

      expect(setInputSpy).toHaveBeenCalledWith('message', 'Content 1');
      expect(setInputSpy).toHaveBeenCalledWith('messageHeader', 'Title 1');
      expect(setInputSpy).toHaveBeenCalledWith('state', ToastState.INFORMATION);
      expect(setInputSpy).toHaveBeenCalledWith('duration', 3000);
      expect(setInputSpy).toHaveBeenCalledWith('showBody', true);
      expect(setInputSpy).toHaveBeenCalledWith('maxWidth', '200px');
      expect(setInputSpy).toHaveBeenCalledWith('position', 'bottom right');
      expect(setInputSpy).toHaveBeenCalledWith('showCloseButton', true);
    });
  });

  describe('#_createToastComponentRef', () => {
    it('should call overlay.create', () => {
      const createMethod = jest
        .spyOn(overlayService, 'create')
        .mockImplementation(() => {
          return {
            attach: function attach<ToastComponent>(
              portal: ComponentPortal<ToastComponent>
            ) {
              return {} as ComponentRef<ToastComponent>;
            },
          } as OverlayRef;
        });
      service['_createToastComponentRef']();
      expect(createMethod).toHaveBeenCalledTimes(1);
    });
  });
});
