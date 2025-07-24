import {
  AfterViewInit,
  AfterContentInit,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PendoDataId } from '../../../../../core-shared/src/lib/directives/data-id';

interface LoadingIndicator {
  show: boolean;
  type?: 'form' | 'spinner';
  instances?: number;
  /**
   * While 'show' is true the skeleton indicator will be shown as well for the modal title
   *
   * @type {boolean}
   * @memberof LoadingIndicator
   */
  headerLoading?: boolean;
}

/**
 * Modal
 * @export
 * @class ModalComponent
 * @param {string} [className]: Pass additional class names to the main component wrapper
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'crem-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ModalComponent
  extends PendoDataId
  implements AfterViewInit, AfterContentInit, OnDestroy, OnInit
{
  @Input() modalTitle: string;
  @Input() modalTitleId: string;
  @Input() closeIconVisible: boolean;
  @Input() primaryFooterButtonText: string;
  @Input() primaryFooterButtonEnabledDisabled = false;
  @Input() closeOrCancelButtonText: string;
  @Input() showTooltip = false;
  @Input() tooltipText = '';
  @Input() modalId: string;
  @Input() customHeader = false;
  @Input() customFooter = false;
  @Input() closeDialogResult: any = '';
  @Input() className?: string = '';
  @Input() dragPosition: any = { x: 0, y: 0 };
  /**
   * Delegates the loading indicators to the modal for better consistency across modals
   * while using the shared library.
   *
   * @type {LoadingIndicator}
   * @memberof ModalComponent
   */
  @Input() loading?: LoadingIndicator = { show: null };
  /**
   * Personalizes scroll bars to use the common lib one
   *
   * @type {'auto'}
   * @memberof ModalComponent
   */
  @Input() scrollbar?: 'auto-hide';
  @Output() primaryButtonAction = new EventEmitter<any>();
  @Output() closeButtonAction = new EventEmitter<any>();
  @Output() dragEndAction = new EventEmitter<any>();
  @Output() resizeAction = new EventEmitter<any>();

  @ContentChild('footerLeftControls', { static: false })
  footerLeftControls!: ElementRef;
  @ContentChild('footerRightControls', { static: false })
  footerRightControls!: ElementRef;

  hasCustomControls = false as boolean;

  private resizeObserver: ResizeObserver;

  constructor(
    @Optional() public dialogRef: MatDialogRef<ModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private elementRef: ElementRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.loading.type = this.loading.type ?? 'spinner'; // Default loading indicator
  }

  ngAfterViewInit() {
    this.initModalResizeBehavior();
  }

  ngAfterContentInit() {
    this.hasCustomControls =
      !!this.footerLeftControls || !!this.footerRightControls;
  }

  private initModalResizeBehavior() {
    // Find the nearest ancestor with the class '.mat-mdc-dialog-surface'
    const ancestor = this.findAncestorWithClass(
      this.elementRef.nativeElement,
      'mat-mdc-dialog-surface' // we may need to provide configuration for this if we intend to use something other than material at some point
    );

    // Attach ResizeObserver if an ancestor is found
    if (ancestor) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          this.resizeAction.emit({ width, height });
        }
      });
      this.resizeObserver.observe(ancestor);
    }
  }

  public closeDialog() {
    this.closeButtonAction.emit();
    this.dialogRef.close(this.closeDialogResult);
  }

  public primaryEvent() {
    this.primaryButtonAction.emit();
  }

  public dragEndEvent(e) {
    this.dragEndAction.emit(e);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.resizeAction.emit({
      width: event.target.innerWidth,
      height: event.target.innerHeight,
    });
  }

  ngOnDestroy() {
    // Disconnect the observer to avoid memory leaks
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private findAncestorWithClass(
    element: HTMLElement,
    className: string
  ): HTMLElement | null {
    const allClasses = className.split(' ');
    let parent = element.parentElement;
    while (parent) {
      const matchFail = allClasses
        .map((cssClass) => parent.classList.contains(cssClass))
        .includes(false);

      if (!matchFail) {
        return parent;
      }

      parent = parent.parentElement;
    }
    return null;
  }
}
