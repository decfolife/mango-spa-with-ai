import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { Meta, Story, moduleMetadata } from '@storybook/angular';
import {
  DxButtonModule,
  DxDataGridModule,
  DxDropDownBoxModule,
  DxFormModule,
  DxSelectBoxModule,
  DxTemplateModule,
  DxTextBoxModule,
  DxTooltipModule,
  DxValidationSummaryModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { ButtonModule } from '../button';
import { IconModule } from '../icon';
import { DropdownComponent } from './dropdown.component';

interface DropdownComponentStory extends DropdownComponent {
  text: string;
}

export default {
  title: 'Components/Dropdown *',
  component: DropdownComponent,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        DxDropDownBoxModule,
        DxTextBoxModule,
        DxButtonModule,
        DxDataGridModule,
        DxTemplateModule,
        DxValidatorModule,
        DxFormModule,
        DxSelectBoxModule,
        DxValidationSummaryModule,
        MatMenuModule,
        ButtonModule,
        IconModule,
        DxTooltipModule,
      ],
    }),
  ],
} as Meta<DropdownComponent>;

const Template: Story<DropdownComponent> = (args: DropdownComponentStory) => ({
  props: args,
});

/** Minimal configuration */
export const Default = Template.bind({});
Default.args = {
  id: 'dropdown',
  initialSelectedValue: null,
  placeholder: 'Select an item...',
  label: 'Label',
  isSearchable: true,
  selectMode: 'single',
  required: true,
  readOnly: false,
  allowSearch: true,
  containerized: true,
  dataSource: [
    {
      displayKey: 'Apples',
      valueKey: 'Apples',
    },
    {
      displayKey: 'Oranges',
      valueKey: 'Oranges',
    },
    {
      displayKey: 'Lemons',
      valueKey: 'Lemons',
    },
    {
      displayKey: 'Pears',
      valueKey: 'Pears',
    },
    {
      displayKey: 'Pineapples',
      valueKey: 'Pineapples',
    },
  ],
};

/** This should primarily be used as part of the page header component. */
export const WithLabel = Template.bind({});
WithLabel.args = {
  initialSelectedValue: 'Watermelon',
  selectBoxValue: 'Watermelon',
  label: 'Segment is',
  fieldTemplate: 'withLabel',
  placeholder: 'Select Segment',
  allowSearch: true,
  containerized: true,
  useSelectBox: true,
  dataSource: [
    {
      displayKey: 'Watermelon',
      valueKey: 'Watermelon',
    },
    {
      displayKey: 'Apples',
      valueKey: 'Apples',
    },
    {
      displayKey: 'Oranges',
      valueKey: 'Oranges',
    },
    {
      displayKey: 'Lemons',
      valueKey: 'Lemons',
    },
    {
      displayKey: 'Pears',
      valueKey: 'Pears',
    },
    {
      displayKey: 'Pineapples',
      valueKey: 'Pineapples',
    },
  ],
};
