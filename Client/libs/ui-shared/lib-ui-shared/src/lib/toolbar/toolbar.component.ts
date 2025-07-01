import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { BreadCrumb, ToolbarModuleLink } from '@mango/data-models/lib-data-models';
import { BookmarksModule } from '@mango/ui-shared/lib-ui-elements';
import { EnvInfoChipModule } from '../env-info-chip';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { ModuleLink } from 'libs/data-models/lib-data-models/src/lib/models/toolbar.interface';
import { filter, tap } from 'rxjs/operators';

@Component({
  selector: 'mango-toolbar',
  templateUrl: './toolbar.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, EnvInfoChipModule, BookmarksModule],
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit {
  isCostarStyle = false;
  envPopoverVisible = false;

  @Input() chipContent: string;
  @Input() popoverContent: string;
  @Input() moduleLinks: ToolbarModuleLink[];

  // Added to avoid putting a method call directly in the template
  // [class.active]="isActiveTab(link)"
  modules: ModuleLink[]

  constructor(
    public router: Router, 
    public facade: MangoAppFacade) {}

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['moduleLinks'] && this.moduleLinks?.length) {
      this.modules = this.moduleLinks.map(link => ({
        ...link,
        isActive: false
      }))

      this.facade.breadcrumbs$
        .pipe(
          filter((breadcrumbs) => breadcrumbs.length > 0),
          tap((breadcrumbs) => {
            this.updateActiveTab(breadcrumbs[0]);
          })
        )
        .subscribe()
    }
  }

  updateActiveTab(breadcrumb: BreadCrumb) {
    const match = this.moduleLinks.find((link: any) =>
      this.router.url.startsWith(link.spaurl)
    );

    let activeUrl = match?.spaurl ?? breadcrumb.url

    this.modules = this.moduleLinks.map(link => ({
      ...link,
      isActive: this.isActiveTab(link, activeUrl)
    }))
  }

  isActiveTab(link: any, activeUrl: string) {
    // Instead of doing this, we could add '/crem/admin' to the tblModules SpaUrl column.
    // However, because the Admin page is still a v06 page, we cant do this,
    // otherwise spa will try to redirect to the new admin page which isnt ready.
   if (link.moduleHome === '/v06/Admin/AdminHome2.aspx' && 
       (activeUrl === '/crem/admin' || activeUrl === '/v06/Admin/AdminHome2.aspx')) 
    {
      return true;
    }
    
    if (activeUrl === link.spaurl || activeUrl.startsWith(link.spaurl)) {
      return true;
    }

    return false;
  }

  toggleEnvironmentPopover() {
    this.envPopoverVisible = !this.envPopoverVisible;
  }

  raiseToggleBookmarkDrawerEvent() {
    const evt = new CustomEvent('ToogleBookmarkDrawer', { detail: 'toggle' });
    window.dispatchEvent(evt);
  }
}
