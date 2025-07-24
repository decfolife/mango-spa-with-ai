/**
 * DxPopOver Configuration parameters
 * @see https://js.devexpress.com/Angular/Documentation/ApiReference/UI_Components/dxPopover/
 * @see https://js.devexpress.com/Angular/Documentation/Guide/UI_Components/Popover/Overview/
 *
 * @export
 * @interface PopoverConf
 */
export interface PopoverConf {
  position: 'bottom' | 'left' | 'right' | 'top';
  ariaLabel: string;
  width: number | string;
  minWidth: number | string;
  maxWidth: number | string;
  height: number | string;
  minHeight: number | string;
  maxHeight: number | string;
}
