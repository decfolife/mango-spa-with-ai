import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { NavigationEnd, Router } from '@angular/router';
import { NavLinksByCategory } from '@mango/data-models/lib-data-models';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { SharedLeftNavLink } from 'libs/data-models/lib-data-models/src/lib/models/link.interface';
import { Observable } from 'rxjs';

@Component({
  standalone: false,
  selector: 'shared-left-nav',
  templateUrl: 'shared-left-nav.component.html',
  styleUrls: ['shared-left-nav.component.scss'],
})
export class SharedLeftNavComponent implements OnChanges {
  @Input() navigationLinks: SharedLeftNavLink[];
  @Input() activeLink: string = null;

  @Output() navigateSpa: EventEmitter<SharedLeftNavLink> =
    new EventEmitter<SharedLeftNavLink>(null);
  @Output() toActiveLink: EventEmitter<string> = new EventEmitter();

  isSubleftnav$: Observable<boolean> = this.facade.showSubLeftNav$;

  regularLeftNavItems: NavLinksByCategory[] = [];
  commonLeftNavItems: NavLinksByCategory[] = [];
  expandNav = true;
  flyOutMenuEntered: boolean = false;
  flyOutMenuOpened: boolean = false;
  flyOutEntered: boolean = false;
  flyOutOpenedViaKeyboard: boolean = false;
  elementToSetFocusId: string = null;
  currentFlyOutMenuTrigger: MatMenuTrigger = null;
  currentFlyOutMenuCategory: string = null;
  currentSubChildLevelMenuList: NodeListOf<Element> = null;
  currentSubChildIndex: number = 0;

  constructor(private facade: MangoAppFacade, private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (!!this.elementToSetFocusId) {
          const idToFocus = this.elementToSetFocusId;
          this.elementToSetFocusId = null;
          const element = document.getElementById(idToFocus);
          if (element) {
            element.focus();
          }
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      if (propName.toLowerCase() === 'navigationlinks') {
        this.getCategorizeLinks();
        this.setActiveLinkFromIsCurrentlyActiveLink();
        break;
      } else if (propName.toLowerCase() === 'activelink') {
        let navLink: SharedLeftNavLink | undefined = undefined;

        if (
          !!changes.activeLink.currentValue &&
          changes.activeLink.currentValue.trim() !== ''
        ) {
          navLink = this.navigationLinks?.filter(
            (x) => x.name === changes.activeLink.currentValue
          )[0];
        } else {
          navLink = this.returnIsCurrentlyActiveLinkIfSet();
          this.setActiveLinkFromIsCurrentlyActiveLink(navLink);
        }

        if (
          !!navLink &&
          navLink.moduleID >= 0 &&
          navLink.dynamicName.trim() !== ''
        ) {
          let idName: string = null;

          idName = !!navLink.category ? navLink.category : navLink.dynamicName;

          const idPrefix = !!navLink.category
            ? 'left-nav__listItem__'
            : 'left-nav__';
          const id =
            idPrefix +
            navLink.moduleID +
            '-' +
            idName.toLowerCase().replace(' ', '-').replace('.', '_');

          this.elementToSetFocusId = id;
        }
      }
    }
  }

  getCategorizeLinks() {
    this.regularLeftNavItems = this.categorizeNavLinks(
      this.navigationLinks.filter((navlink) => !navlink.isCommon)
    );
    this.commonLeftNavItems = this.categorizeNavLinks(
      this.navigationLinks.filter((navLink) => !!navLink.isCommon)
    );
  }

  private setActiveLinkFromIsCurrentlyActiveLink(
    navLink: SharedLeftNavLink = null
  ) {
    let currentlyActiveLink = navLink;

    if (!!!navLink) {
      currentlyActiveLink = this.returnIsCurrentlyActiveLinkIfSet();
    }

    if (!!currentlyActiveLink) {
      if (!!currentlyActiveLink.category) {
        this.activeLink = currentlyActiveLink.category;
      } else {
        this.activeLink = currentlyActiveLink.name;
      }
    }
  }

  private returnIsCurrentlyActiveLinkIfSet(): SharedLeftNavLink {
    let foundLink = this.navigationLinks.find(
      (navlink) =>
        !!navlink.category &&
        !!navlink.categoryIsCurrentlyActiveLink &&
        navlink.categoryIsCurrentlyActiveLink &&
        !!navlink.isCurrentlyActiveLink &&
        navlink.isCurrentlyActiveLink
    );
    if (!!foundLink) {
      //Category link is active and single link is active
      return foundLink;
    }

    foundLink = this.navigationLinks.find(
      (navlink) =>
        !!navlink.category &&
        !!navlink.categoryIsCurrentlyActiveLink &&
        navlink.categoryIsCurrentlyActiveLink
    );
    if (!!foundLink) {
      //Category link is active
      return foundLink;
    }

    //Single link is active
    foundLink = this.navigationLinks.find(
      (navlink) =>
        !!!navlink.category &&
        !!navlink.isCurrentlyActiveLink &&
        navlink.isCurrentlyActiveLink
    );

    if (!!foundLink) {
      return foundLink;
    } else {
      return null;
    }
  }

  categorizeNavLinks(navLinks: SharedLeftNavLink[]): NavLinksByCategory[] {
    return navLinks.reduce((acc: NavLinksByCategory[], currentNavLink) => {
      if (!currentNavLink.category) {
        acc.push({
          category: currentNavLink.category,
          categoryHasFlyOutMenu: currentNavLink.categoryHasFlyOutMenu,
          categoryIsCurrentlyActiveLink:
            currentNavLink.categoryIsCurrentlyActiveLink,
          categoryLinkUrl: currentNavLink.categoryLinkUrl,
          categorySpaUrl: currentNavLink.categorySpaUrl,
          categorySpaQueryParameters: currentNavLink.categorySpaQueryParameters,
          categoryModuleID: currentNavLink.moduleID,
          children: [currentNavLink],
        });
      } else {
        const existingNavLinkItem = acc.find(
          (navLink) => navLink.category === currentNavLink.category
        );
        existingNavLinkItem
          ? existingNavLinkItem.children.push(currentNavLink)
          : acc.push({
              category: currentNavLink.category,
              categoryHasFlyOutMenu: currentNavLink.categoryHasFlyOutMenu,
              categoryIsCurrentlyActiveLink:
                currentNavLink.categoryIsCurrentlyActiveLink,
              categoryLinkUrl: currentNavLink.categoryLinkUrl,
              categorySpaUrl: currentNavLink.categorySpaUrl,
              categorySpaQueryParameters:
                currentNavLink.categorySpaQueryParameters,
              categoryModuleID: currentNavLink.moduleID,
              children: [currentNavLink],
            });
      }
      return acc;
    }, []);
  }

  sidenavtoggle() {
    if (this.expandNav) {
      document
        .getElementsByClassName('sharedLeftNav-container')[0]
        .classList.remove('expandNavBar');
      document
        .getElementsByClassName('sharedLeftNav-container')[0]
        .classList.add('collapseNavBar');
    } else {
      document
        .getElementsByClassName('sharedLeftNav-container')[0]
        .classList.remove('collapseNavBar');
      document
        .getElementsByClassName('sharedLeftNav-container')[0]
        .classList.add('expandNavBar');
    }

    this.expandNav = !this.expandNav;
  }

  onCategoryNavLinkClick(e: any, navLink: SharedLeftNavLink) {
    if (navLink.categoryLinkUrl === null) {
      e.stopPropagation();
    } else {
      this.onNavLinkClick(navLink);
    }
  }

  onNavLinkClick(navLink: SharedLeftNavLink) {
    let navigateSpaLink = navLink;

    const skipSetActiveLink: boolean =
      navLink.category === this.activeLink || navLink?.linkUrl?.startsWith('#');

    if (!skipSetActiveLink) {
      if (navLink.subChildLevel > 0) {
        navLink = this.getTopParentNavLink(navLink) ?? navLink;
      }

      if (
        !navLink.hasOwnProperty('dynamicName') &&
        navLink.hasOwnProperty('categoryHasFlyOutMenu') &&
        navLink.categoryHasFlyOutMenu
      ) {
        this.activeLink = navLink.category;
      } else if (navLink.name) {
        this.activeLink = navLink.name;
      } else {
        this.activeLink = navLink.dynamicName;
      }
    }

    if (this.flyOutMenuEntered && this.flyOutEntered) {
      this.flyOutMenuLeave();
    }

    this.toActiveLink.emit(this.activeLink);
    this.navigateSpa.emit(navigateSpaLink);
  }

  leftNavOpened(e) {
    if (
      !e ||
      !e._element ||
      !e._element.nativeElement ||
      !e._element.nativeElement.children
    )
      return;

    e._element.nativeElement.children[1].removeAttribute('tabindex');
    e._element.nativeElement.children[3].removeAttribute('tabindex');
  }

  openFlyOutMenu(
    menuTrigger: MatMenuTrigger,
    categoryName: string,
    viaKeyboard: boolean = false
  ) {
    if (
      this.currentFlyOutMenuCategory !== null &&
      this.currentFlyOutMenuCategory !== categoryName
    ) {
      this.flyOutEntered = false;
      this.flyOutMenuOpened = false;
      this.currentFlyOutMenuTrigger.closeMenu();
    }

    this.currentFlyOutMenuCategory = categoryName;
    this.currentFlyOutMenuTrigger = menuTrigger;
    this.flyOutEntered = true;
    this.flyOutMenuOpened = true;
    this.flyOutMenuEntered = false;
    this.flyOutOpenedViaKeyboard = viaKeyboard;

    menuTrigger.openMenu();
  }

  onFlyOutMenuOpened(menuTrigger: MatMenuTrigger, categoryName: string) {
    if (
      this.flyOutOpenedViaKeyboard &&
      this.currentFlyOutMenuCategory === categoryName
    ) {
      menuTrigger.menu?.focusFirstItem('keyboard');
    }
  }

  onFlyOutMenuClosed(categoryName: string) {
    this.flyOutOpenedViaKeyboard = false;

    if (this.currentFlyOutMenuCategory === categoryName) {
      this.flyOutMenuOpened = false;
      this.currentFlyOutMenuTrigger = null;
      this.currentFlyOutMenuCategory = null;
    }
  }

  closeFlyOutMenu(menuTrigger: MatMenuTrigger) {
    this.flyOutEntered = false;
    this.flyOutOpenedViaKeyboard = false;
    setTimeout(() => {
      if (!this.flyOutMenuEntered && !this.flyOutEntered) {
        menuTrigger.closeMenu();
      }
    }, 200);
  }

  flyOutMenuLeave() {
    this.flyOutMenuEntered = false;
    this.closeFlyOutMenu(this.currentFlyOutMenuTrigger);
  }

  keydownFlyout(event: KeyboardEvent, navLink: SharedLeftNavLink) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      //Move focus to sub child level menu items if they exist
      if (navLink.subChildLevel > 0) {
        if (this.currentSubChildLevelMenuList !== null) {
          let previousLinkElement = this.currentSubChildLevelMenuList[
            this.currentSubChildIndex
          ] as HTMLElement;
          let increment = event.key === 'ArrowDown' ? 1 : -1;
          this.currentSubChildIndex += increment;
          let linkElement = this.currentSubChildLevelMenuList[
            this.currentSubChildIndex
          ] as HTMLElement;
          if (linkElement) {
            event.stopPropagation();
            previousLinkElement.blur();
            linkElement.focus();
          }
        }
      } else {
        this.currentSubChildLevelMenuList = null;
        this.currentSubChildIndex = 0;

        //Execution should only enter this block of code when pressing the down arrow key on a nav link that has sub child level menu items or when pressing the up arrow key to move focus back
        //to a sub child link.
        if (
          (this.currentSubChildLevelMenuList === null &&
            this.hasSubChildLevelMenuItems(navLink)) ||
          event.key === 'ArrowUp'
        ) {
          //The default settings here is for the down arrow key.  The up arrow key settings are in the if statement below
          let anchorElement = event.target as HTMLElement;
          let hasSclMenuItems = this.hasSubChildLevelMenuItems(navLink);
          let navLinkToGetSubChildLevelMenuItemsFrom = navLink;
          if (event.key === 'ArrowUp') {
            let previousSiblingNavLink =
              this.getPreviousSiblingNavLink(navLink);
            if (previousSiblingNavLink) {
              hasSclMenuItems = this.hasSubChildLevelMenuItems(
                previousSiblingNavLink
              );
              navLinkToGetSubChildLevelMenuItemsFrom = previousSiblingNavLink;
              //If the format of the nav link id is changed, this logic will need to be updated
              anchorElement = document.getElementById(
                'left-nav__' +
                  previousSiblingNavLink.moduleID +
                  '-' +
                  previousSiblingNavLink.dynamicName
                    .toLowerCase()
                    .replace(' ', '-')
                    .replace('.', '_')
              ) as HTMLElement;
            } else {
              return;
            }
          }

          if (!hasSclMenuItems) {
            return;
          }

          let parentSpanElement = anchorElement.parentElement.parentElement;
          if (parentSpanElement.tagName.toLowerCase() === 'span') {
            let childAnchorClassName =
              navLinkToGetSubChildLevelMenuItemsFrom?.dynamicName
                ?.toLowerCase()
                ?.replace(' ', '-')
                .replace('.', '_') +
              '_' +
              'subChildLevel_link';
            const anchorTags = parentSpanElement.querySelectorAll(
              'a.' + childAnchorClassName
            );
            if (anchorTags.length > 0) {
              this.currentSubChildLevelMenuList = anchorTags;
              // Focus on the child anchor tag based on the index which is determined by whether the user pressed the up or down arrow key
              this.currentSubChildIndex =
                event.key === 'ArrowDown' ? 0 : anchorTags.length - 1;

              event.stopPropagation();
              let linkElement = this.currentSubChildLevelMenuList[
                this.currentSubChildIndex
              ] as HTMLElement;
              linkElement.focus();
            }
          }
        }
      }
    }
  }

  hasSubChildLevelMenuItems(leftNavLink: SharedLeftNavLink) {
    return leftNavLink.subChildLevelNavLinks !== null;
  }

  getPreviousSiblingNavLink(
    navLink: SharedLeftNavLink
  ): SharedLeftNavLink | null {
    const index = this.navigationLinks.indexOf(navLink);
    if (index <= 0) {
      return null;
    }
    return this.navigationLinks[index - 1];
  }

  getParentLinkDynamicName(navLink: SharedLeftNavLink): string {
    const topParentNavLink = this.getTopParentNavLink(navLink);
    return topParentNavLink ? topParentNavLink.dynamicName : '';
  }

  private getTopParentNavLink(
    navLink: SharedLeftNavLink
  ): SharedLeftNavLink | null {
    if (!navLink || navLink.subChildLevel === 0) {
      return null;
    }

    const findParent = (
      links: SharedLeftNavLink[],
      target: SharedLeftNavLink
    ): SharedLeftNavLink | null => {
      for (const link of links) {
        if (link.subChildLevelNavLinks?.includes(target)) {
          return link;
        }
        const found = findParent(link.subChildLevelNavLinks ?? [], target);
        if (found) {
          return found;
        }
      }
      return null;
    };

    let current = navLink;
    let parent = findParent(this.navigationLinks, current);

    while (parent && parent.subChildLevel > 0) {
      current = parent;
      parent = findParent(this.navigationLinks, current);
    }

    return parent;
  }
}
