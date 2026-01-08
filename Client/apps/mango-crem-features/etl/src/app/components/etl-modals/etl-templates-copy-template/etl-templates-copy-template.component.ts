import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ETLService } from '@etl/services/etl.service';
import { ToastState } from '@mango/data-models/lib-data-models';
import {
  ButtonModule,
  CremToastService,
  InputComponent,
  LibUiElementsModule,
  LoaderModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { DevExpressModule } from 'libs/ui-shared/lib-external-libraries/src/lib/3rdParty/dev-express.module';

@Component({
  selector: 'mango-etl-templates-copy-template',
  standalone: true,
  imports: [
    CommonModule,
    ModalModule,
    InputComponent,
    LoaderModule,
    DevExpressModule,
    ButtonModule,
    LibUiElementsModule,
  ],
  templateUrl: './etl-templates-copy-template.component.html',
  styleUrls: ['./etl-templates-copy-template.component.scss'],
})
export class EtlTemplatesCopyTemplateComponent {
  componentName = 'etl-templates-copy-template-modal';
  submit = 'Submit';
  selectedItem;

  constructor(
    public dialogRef: MatDialogRef<EtlTemplatesCopyTemplateComponent>,
    private toastService: CremToastService,
    public etlService: ETLService,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  onClose() {
    this.dialogRef.close(null);
  }

  onSubmit() {
    for (const template of this.data) {
      if (template.templateName === this.selectedItem) {
        this.toastService.show(
          'The template name already exists, please choose a unique name',
          '',
          ToastState.ERROR,
          {
            position: 'bottom right',
            maxWidth: '350px',
          }
        );
        return;
      }
    }
    this.dialogRef.close(this.selectedItem);
  }
}
