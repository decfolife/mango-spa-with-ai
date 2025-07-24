import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import {
  CremPopupComponent,
  ButtonModule,
} from '@mango/ui-shared/lib-ui-elements';

@Component({
  selector: 'mango-delete-subobject-popup',
  standalone: true,
  imports: [CommonModule, CremPopupComponent, ButtonModule],
  templateUrl: './delete-subobject-popup.component.html',
  styleUrls: ['./delete-subobject-popup.component.scss'],
})
export class DeleteSubObjectPopupComponent {
  hasCharges: boolean;
  constructor(
    private dialogRef: MatDialogRef<DeleteSubObjectPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { hasCharges: boolean }
  ) {
    this.hasCharges = data.hasCharges;
  }

  confirm() {
    this.dialogRef.close(true);
  }

  close() {
    this.dialogRef.close(false);
  }
}
