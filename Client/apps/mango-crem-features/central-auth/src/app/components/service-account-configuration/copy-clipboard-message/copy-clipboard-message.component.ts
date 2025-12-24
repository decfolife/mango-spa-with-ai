import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ModalModule } from '@mango/ui-shared/lib-ui-elements';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  standalone: true,
  imports: [ModalModule, MatDialogModule],
  selector: 'mango-copy-clipboard-message',
  templateUrl: 'copy-clipboard-message.component.html',
  styleUrls: ['copy-clipboard-message.component.scss'],
})
export class CopyClipboardMessageComponent {
  public apiKey: string = '';
  public value: string = '';
  public info: string = '';
  public title: string;
  public msg: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {
    this.apiKey = this.data.apikey;
    this.title = this.data.title;
    this.msg = this.data.msg;
  }

  copyClipboard() {
    if (window.location.protocol == 'https:') {
      navigator.clipboard.writeText(this.apiKey);
    } else {
      const textarea = document.createElement('textarea');
      textarea.textContent = this.apiKey;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    this.info = 'Copied to clipboard';
  }
}
