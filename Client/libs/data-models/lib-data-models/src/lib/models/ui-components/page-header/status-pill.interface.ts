import { Pill } from '../../../enums/ui-shared-elements.enums';

export interface StatusPill {
  text: string;
  type: Pill;
  titleOnHover?: string;
  displayLockIcon?: boolean;
  lockedMessage?: string;
}
