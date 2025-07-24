import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
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
  currentFlyOutMenuTrigger: MatMenuTrigger = null;
  currentFlyOutMenuCategory: string = null;

  constructor(private facade: MangoAppFacade) {}

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

        if (navLink && navLink.moduleID && navLink.dynamicName) {
          const id =
            'left-nav__' +
            navLink.moduleID +
            '-' +
            navLink.dynamicName.toLowerCase().replace(' ', '-');

          const element = document.getElementById(id);

          if (element) {
            element.focus();
          }
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
    const skipSetActiveLink: boolean =
      (navLink.hasOwnProperty('subChildLevel') &&
        !!navLink.subChildLevel &&
        navLink.subChildLevel > 0) ||
      navLink.linkUrl.startsWith('#');

    if (!skipSetActiveLink) {
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

    this.toActiveLink.emit(this.activeLink);
    this.navigateSpa.emit(navLink);
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

  openFlyOutMenu(menuTrigger: MatMenuTrigger, categoryName: string) {
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
    menuTrigger.openMenu();
  }

  closeFlyOutMenu(menuTrigger: MatMenuTrigger) {
    this.flyOutEntered = false;
    setTimeout(() => {
      if (!this.flyOutMenuEntered && !this.flyOutEntered) {
        menuTrigger.closeMenu();
        this.currentFlyOutMenuTrigger = null;
        this.currentFlyOutMenuCategory = null;
      }
    }, 200);
  }

  flyOutMenuLeave() {
    this.flyOutMenuEntered = false;
    this.closeFlyOutMenu(this.currentFlyOutMenuTrigger);
  }

  hasSubChildLevelMenuItems(leftNavLink: SharedLeftNavLink) {
    return leftNavLink.subChildLevelNavLinks !== null;
  }

  hasSubChildLevelMenuItems2(subNavLink: SharedLeftNavLink) {
    return subNavLink.subChildLevelNavLinks !== null;
  }
}
