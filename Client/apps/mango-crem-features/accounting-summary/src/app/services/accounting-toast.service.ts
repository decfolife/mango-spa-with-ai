import { Injectable } from '@angular/core';
import { Message, MessageService } from 'primeng/api';

@Injectable()
export class AccountingToastService {
  private messages: Message[] = [];
  constructor(private messageService: MessageService) {}
  /**
   * Displays a toast message with the specified severity.
   *
   * @param summary - The summary text for the toast.
   * @param detail - The detailed message text.
   * @param severity - The severity level of the message. Possible values are:
   *  - "success": Indicates a successful operation.
   *  - "info": Provides informational messages.
   *  - "warning": Warns about potential issues.
   *  - "primary": Represents primary information.
   *  - "help": Suggests help or guidance.
   *  - "danger": Indicates a dangerous or critical situation.
   *  - "secondary": Additional or less important information.
   *  - "contrast": Highlights contrasting information.
   * Default is "error" if not provided.
   * @param sticky - Whether the toast should be sticky (remain visible until manually dismissed).
   */
  showToast(
    summary: string,
    detail: string,
    severity = 'error',
    sticky = true,
    life = 6000
  ) {
    const message: Message = { severity, summary, detail, sticky, life };
    this.messages.push(message); // Add to the local messages array
    this.messageService.add(message);

    // If sticky is false, set a timeout to clear the message after the specified life duration
    if (!sticky) {
      setTimeout(() => {
        this.clearToastBySummary(summary);
      }, life);
    }
  }

  displayContactSystemAdminMessage() {
    this.showToast(
      'Error',
      'An error occurred please contact the system administrator.',
      'error',
      true,
      6000
    );
  }

  errorNotify(detail: string) {
    this.showToast('Error', detail, 'error');
  }

  successNotify(detail: string) {
    this.showToast('Success', detail, 'success');
  }

  clearToastBySummary(summary: string) {
    const remainingMessages = this.messages.filter(
      (msg) => !msg.summary?.includes(summary)
    );
    this.messages = remainingMessages;
    this.messageService.clear();
    remainingMessages.forEach((msg) => this.messageService.add(msg));
  }

  clearAllToastMessages() {
    this.messageService.clear();
    this.messages = [];
  }
}
