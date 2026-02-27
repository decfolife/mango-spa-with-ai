import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IconModule } from '../icon';
export interface CustomEmptyStateTexts {
  title: string;
  subTitle: string;
  imgAlt: string;
}

@Component({
  selector: 'crem-empty-state',
  standalone: true,
  template: `
    <div>
      <h2 class="h2 color-gray02">
        {{ customTexts?.title }}
      </h2>
      <crem-icon
        *ngIf="type === 'Error occurred'"
        class="fa-lg"
        size="10x"
        [color]="color"
        icon="faExclamationTriangle"
      ></crem-icon>
      <img
        *ngIf="type !== 'Error occurred'"
        [src]="imageSrc || './assets/empty-state/not-found.jpg'"
        [attr.alt]="customTexts?.imgAlt || 'No results found'"
        class="main-image"
      />
      <p class="lead color-gray03">
        {{ customTexts?.subTitle }}
      </p>
    </div>
  `,
  imports: [CommonModule, IconModule],
  styleUrls: ['./empty-state.component.scss'],
})
export class CremEmptyStateComponent implements OnInit {
  @Input() type:
    | 'Object not found'
    | 'No Results'
    | 'Unauthorized'
    | 'Forbidden'
    | 'Error occurred';
  @Input() customTexts?: CustomEmptyStateTexts;
  @Input() imageSrc?: string;
  @Input() color?: string; // only used for error icon color

  ngOnInit() {
    if (!this.type) {
      this.type = 'Object not found'; // Default type
    }

    if (!this.color) {
      this.color = 'dark'; // Default color
    }

    switch (this.type) {
      case 'Object not found': {
        this.customTexts = this.customTexts || {
          title: 'Object Not Found',
          subTitle: 'We couldn’t find the object you were looking for.',
          imgAlt: 'No object found',
        };
        break;
      }
      case 'Error occurred': {
        this.customTexts = this.customTexts || {
          title: 'An Error Occurred',
          subTitle:
            'Something went wrong. Please try again later or contact support.',
          imgAlt: 'Unauthorized',
        };
        break;
      }
      case 'No Results': {
        this.customTexts = this.customTexts || {
          title: 'No Results',
          subTitle: 'No matching results were found. Try refining your search.',
          imgAlt: 'No results found',
        };
        break;
      }
      case 'Unauthorized': {
        this.customTexts = this.customTexts || {
          title: 'Unauthorized Access',
          subTitle: 'You do not have permission to access this content.',
          imgAlt: 'Unauthorized',
        };
        break;
      }
      case 'Forbidden': {
        this.customTexts = this.customTexts || {
          title: 'Forbidden',
          subTitle:
            'Access is denied. You don’t have the required permissions.',
          imgAlt: 'Forbidden',
        };
        break;
      }
    }
  }
}
