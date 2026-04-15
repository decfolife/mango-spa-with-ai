import { moduleMetadata, Story, Meta } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  CremBlockUIComponent,
  CremBlockUIVariant,
  CremBlockUISize,
} from './block-ui.component';

// ─── Interactive demo component ──────────────────────────────────────────────

@Component({
  selector: 'crem-block-ui-demo',
  standalone: true,
  imports: [CommonModule, CremBlockUIComponent],
  template: `
    <button
      (click)="toggleBlocking()"
      style="
        margin-bottom: 16px;
        padding: 8px 20px;
        background: #1976d2;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      "
    >
      {{ isBlocking ? 'Stop Blocking' : 'Start Blocking' }}
    </button>

    <crem-block-ui
      [isBlocking]="isBlocking"
      [message]="message"
      [variant]="variant"
      [size]="size"
    >
      <div
        style="
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 24px;
        font-family: sans-serif;
        min-width: 360px;
      "
      >
        <h3 style="margin: 0 0 16px; font-size: 18px; color: #212121;">
          UI Blocker Demo
        </h3>
        <p style="margin: 0 0 16px; color: #616161; line-height: 1.5;">
          Click the button above to toggle the blocker on and off.
        </p>
      </div>
    </crem-block-ui>
  `,
})
class CremBlockUIDemoComponent {
  isBlocking = false;
  message = 'Please wait...';
  variant: CremBlockUIVariant = 'dark';
  size: CremBlockUISize = 'md';

  toggleBlocking() {
    this.isBlocking = !this.isBlocking;
  }
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

interface CremBlockUIStory {
  variant: CremBlockUIVariant;
  size: CremBlockUISize;
  message: string;
}

export default {
  title: 'Components/Block UI',
  component: CremBlockUIDemoComponent,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CremBlockUIComponent, CremBlockUIDemoComponent],
    }),
  ],
  argTypes: {
    message: { control: 'text' },
    variant: {
      control: 'radio',
      options: ['light', 'dark', 'transparent'] as CremBlockUIVariant[],
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'] as CremBlockUISize[],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Wraps content with an overlay and spinner when blocking is active. ' +
          'Click the button to toggle blocking on and off. ' +
          'Supports three visual variants (light, dark, transparent) and three size presets (sm, md, lg).',
      },
    },
  },
} as Meta<CremBlockUIStory>;

// ─── Story ────────────────────────────────────────────────────────────────────

const Template: Story<CremBlockUIStory> = (args: CremBlockUIStory) => ({
  props: args,
  component: CremBlockUIDemoComponent,
});

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Interactive = Template.bind({});
Interactive.storyName = 'Interactive Demo';
Interactive.args = {
  message: 'Loading...',
  variant: 'dark',
  size: 'md',
};

export const LightVariant = Template.bind({});
LightVariant.storyName = 'Light Variant';
LightVariant.args = {
  message: 'Fetching data...',
  variant: 'light',
  size: 'md',
};

export const TransparentVariant = Template.bind({});
TransparentVariant.storyName = 'Transparent';
TransparentVariant.args = {
  message: 'Saving changes...',
  variant: 'transparent',
  size: 'md',
};

export const SmallSize = Template.bind({});
SmallSize.storyName = 'Small';
SmallSize.args = {
  message: 'Hang tight...',
  variant: 'dark',
  size: 'sm',
};

export const Medium = Template.bind({});
Medium.storyName = 'Medium';
Medium.args = {
  message: 'Just a moment...',
  variant: 'dark',
  size: 'md',
};

export const LargeSize = Template.bind({});
LargeSize.storyName = 'Large';
LargeSize.args = {
  message: 'Recalculating...',
  variant: 'dark',
  size: 'lg',
};
