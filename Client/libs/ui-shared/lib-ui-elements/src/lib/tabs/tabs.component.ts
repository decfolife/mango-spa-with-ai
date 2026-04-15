import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  Output,
  QueryList,
} from '@angular/core';
import { CremTabItemComponent } from './tab-item.component';

export interface SelectedTab {
  index: number;
  title?: string;
}
@Component({
  selector: 'crem-tabs',
  standalone: true,
  imports: [CommonModule, CremTabItemComponent],
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  host: {
    '[attr.id]': `id`,
  },
})
export class CremTabsComponent implements AfterContentInit {
  @Input() selectedTabIndex = 0;
  @Input() id: string;
  @Output() selectedTabChange: EventEmitter<number> = new EventEmitter<number>(
    null
  );

  /**
   * Emit all the values of the selection for later advanced filtering and logic
   *
   * @type {EventEmitter<SelectedTab>}
   * @memberof CremTabsComponent
   */
  @Output() selectedTab: EventEmitter<SelectedTab> =
    new EventEmitter<SelectedTab>(null);

  @ContentChildren(CremTabItemComponent) tabs: QueryList<CremTabItemComponent>;

  ngAfterContentInit() {
    this.selectedTabIndex = this.selectedTabIndex ?? 0;
    const activeTabs = this.tabs.filter((tab) => tab.active);
    if (activeTabs.length === 0) {
      this.selectTab(this.tabs.toArray()[this.selectedTabIndex]);
    }
  }

  onKeyDownEvent(e: KeyboardEvent, tabIndex: number) {
    const tabs = this.tabs.toArray();
    const currentTab = tabs[tabIndex];
    if (!currentTab) {
      return;
    }

    const normalizedKey = (e.key || '').toLowerCase();
    const keyCode = e.keyCode;
    const isEnter = normalizedKey === 'enter' || keyCode === 13;
    const isSpace =
      normalizedKey === ' ' || normalizedKey === 'spacebar' || keyCode === 32;
    const isArrowRight =
      normalizedKey === 'arrowright' ||
      e.code === 'ArrowRight' ||
      keyCode === 39;
    const isArrowLeft =
      normalizedKey === 'arrowleft' || e.code === 'ArrowLeft' || keyCode === 37;

    if (isEnter || isSpace) {
      e.preventDefault();
      this.selectTab(currentTab);
      return;
    }

    if (isArrowRight || isArrowLeft) {
      e.preventDefault();
      const enabledTabs = tabs.filter((tab) => !tab.disabled);
      if (!enabledTabs.length) {
        return;
      }

      const currentEnabledIndex = enabledTabs.findIndex(
        (tab) => tab === currentTab
      );
      if (currentEnabledIndex < 0) {
        return;
      }

      let nextIndex = currentEnabledIndex;
      if (isArrowRight) {
        nextIndex = (currentEnabledIndex + 1) % enabledTabs.length;
      } else if (isArrowLeft) {
        nextIndex =
          (currentEnabledIndex - 1 + enabledTabs.length) % enabledTabs.length;
      }

      const nextTab = enabledTabs[nextIndex];
      this.selectTab(nextTab);

      const tabList = (e.currentTarget as HTMLElement)?.closest(
        '[role="tablist"]'
      );
      const tabButtons = tabList?.querySelectorAll<HTMLElement>(
        '[role="tab"]:not([disabled])'
      );
      tabButtons?.[nextIndex]?.focus();
    }
  }

  selectTab(tab: CremTabItemComponent) {
    if (tab) {
      this.tabs.toArray().forEach((tab) => (tab.active = false));
      tab.active = true;

      const selectedIndex = this.tabs
        .toArray()
        .findIndex((tab) => tab.active === true);
      this.selectedTabChange.emit(selectedIndex);
      this.selectedTab.emit({
        index: selectedIndex,
        title: this.tabs.toArray()[selectedIndex].title,
      });
    }
  }
}
