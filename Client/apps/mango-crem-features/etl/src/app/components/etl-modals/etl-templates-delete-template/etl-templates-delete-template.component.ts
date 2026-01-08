import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ETLService } from '@etl/services/etl.service';
import {
  ButtonModule,
  InputComponent,
  LoaderModule,
  ModalModule,
} from '@mango/ui-shared/lib-ui-elements';
import { DevExpressModule } from 'libs/ui-shared/lib-external-libraries/src/lib/3rdParty/dev-express.module';
import { LibUiElementsModule } from 'libs/ui-shared/lib-ui-elements/src/lib/lib-ui-elements.module';

@Component({
  selector: 'mango-etl-templates-delete-template',
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
  templateUrl: './etl-templates-delete-template.component.html',
  styleUrls: ['./etl-templates-delete-template.component.scss'],
})
export class EtlTemplatesDeleteTemplateComponent {
  componentName = 'etl-templates-delete-template-modal';
  submit = 'Submit';

  constructor(
    public dialogRef: MatDialogRef<EtlTemplatesDeleteTemplateComponent>,
    public etlService: ETLService,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  onClose() {
    this.dialogRef.close(null);
  }

  onSubmit() {
    this.dialogRef.close(true);
  }
}
