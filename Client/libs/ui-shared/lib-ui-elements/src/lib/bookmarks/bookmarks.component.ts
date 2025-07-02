/* eslint-disable @nx/enforce-module-boundaries */
/* eslint-disable @angular-eslint/component-selector */
import { Component, Input, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { Bookmark, BookmarkGroup, ObjectType } from '@mango/data-models/lib-data-models';

@Component({
  selector: 'crem-bookmarks',
  templateUrl: './bookmarks.component.html',
  styleUrls: ['./bookmarks.component.scss'],
})
export class BookmarksComponent {
  @ViewChild('recentDrawer', { static: true }) recentDrawer: MatDrawer;
  @Input() bookmarkGroups: BookmarkGroup[] | null = null;
  @Input() useRouterOutletTag: boolean;

  constructor(private router: Router) {}

  toggleBookmarkDrawer() {
    this.recentDrawer.toggle();
  }

  private goToBookmarkUrl(objectTypeId: number, bm: Bookmark) {
    this.recentDrawer.close();
    
    if (objectTypeId === ObjectType.REPORT) {
      window.open(bm.path);
      return;
    } 
    
    this.router.navigate(['v06/Forms/RenderForm.aspx'], {
      queryParams: {
        fid: 312,
        oid: bm.objectID,
        otid: bm.objectTypeID,
        ottid: bm.objectTypeTypeID,
      },
    });   
  }
}
