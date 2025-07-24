import { moduleMetadata, Story, Meta } from '@storybook/angular';
import { ButtonComponent } from './button.component';
import {
  solidIcons,
  regularIcons,
  cremIcons,
} from '../icon/definitions/fontAwesome';
import { CommonModule } from '@angular/common';
import { IconModule } from '../icon';
import { CremDataIdDirective } from '../../../../../core-shared/src/lib/directives/data-id.directive';

interface ButtonComponentStory extends ButtonComponent {
  text: string;
}

export default {
  title: 'Components/Button *',
  component: ButtonComponent,
  decorators: [
    moduleMetadata({
      providers: [CremDataIdDirective],
      imports: [CommonModule, IconModule],
    }),
  ],
  argTypes: {
    dataId: {
      dataId: 'export_excel',
      suffix: 'suffix',
      prefix: 'prefix',
    },
    btnStyle: { control: 'radio', options: ['flat', 'basic', 'stroked'] },
    color: {
      control: 'radio',
      options: ['primary', 'secondary', 'warning', 'danger'],
    },
    size: { control: 'radio', options: ['small', 'medium', 'big'] },
    iconPosition: { control: 'radio', options: ['left', 'right'] },
    icon: {
      control: 'select',
      options: [...cremIcons, ...regularIcons, ...solidIcons],
    },
    iconPack: { control: 'text' },
    iconColor: { control: 'text' },
    iconRotate: { control: 'text' },
    iconFlip: { control: 'text' },
    iconAnimation: { control: 'text' },
    iconSize: { control: 'text' },
    iconPull: { control: 'text' },
    iconFill: { control: 'text' },
    iconTransform: { control: 'text' },
    noWrap: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component: '',
      },
    },
  },
} as Meta<ButtonComponent>;

const Template: Story<ButtonComponentStory> = (args: ButtonComponentStory) => ({
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  id: 'button1',
  text: 'Button',
  btnStyle: 'flat',
  color: 'primary',
  size: 'medium',
  ariaLabel: '',
  disabled: false,
  className: '',
  styles: '',
  // Icon Configuration
  icon: undefined,
  iconPack: undefined,
  iconPosition: undefined,
  noWrap: false,
};

export const LoadingStatus = Template.bind({});
LoadingStatus.args = {
  id: 'button2',
  text: 'Button',
  btnStyle: 'flat',
  color: 'primary',
  size: 'medium',
  ariaLabel: '',
  disabled: true,
  className: '',
  styles: '',
  // Icon Configuration
  icon: 'faSpinner',
  iconPosition: undefined,
  iconPack: 'solid',
  iconAnimation: 'spin',
};

// TODO: Fix ADA issue, discernible text not present
// Use the .sr-only class or a similar approach to make the content accessible to screen readers
// while keeping it visually hidden in the UI.
export const CloseButton = Template.bind({});
CloseButton.args = {
  id: 'button3',
  btnStyle: 'basic',
  color: 'secondary',
  icon: 'cremXMark',
  iconPack: 'crem',
};
