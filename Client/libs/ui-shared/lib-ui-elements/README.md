# ui-shared-lib-ui-elements

Quick reference for adding a component to `lib-ui-elements`.

---

## 1. Create the component folder

```
libs/ui-shared/lib-ui-elements/src/lib/<your-component>/
  your-component.component.ts
  your-component.component.html
  your-component.component.scss
  your-component.component.stories.ts
  index.ts
```

Use the Angular standalone component pattern. Follow the naming convention of existing components, e.g. `CremButtonComponent`, `CremBlockUIComponent`.

---

## 2. Export from the library barrel

Add a line to `libs/ui-shared/lib-ui-elements/src/index.ts`:

```ts
export * from './lib/your-component';
```

Your `index.ts` inside the folder should re-export the component:

```ts
export * from './your-component.component';
```

---

## 3. Write a Storybook story

Create `your-component.component.stories.ts`. Minimal pattern:

```ts
import { Meta, Story, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { YourComponent } from './your-component.component';

export default {
  title: 'Components/YourComponent *',
  component: YourComponent,
  decorators: [moduleMetadata({ imports: [CommonModule] })],
} as Meta<YourComponent>;

const Template: Story<YourComponent> = (args) => ({ props: args });

export const Default = Template.bind({});
Default.args = {
  /* your @Input defaults */
};
```

Storybook automatically picks up any `*.stories.ts` file under `libs/ui-shared/lib-ui-elements/` — no registration needed.

---

## 4. Run Storybook locally

From the `Client/` directory:

```bash
# Serve with live reload — http://localhost:4400
npx nx run ui-shared-storybook-host:storybook

# Build static output
npx nx run ui-shared-storybook-host:build-storybook
```

---

## 5. Deploy to dev

Trigger the **ui-shared Storybook** pipeline in CI. It runs `build-storybook` and publishes to:

Pipeline:

`https://tfs.corp.virtualpremise.com/tfs/DefaultCollection/CoStar.Mango/_build?definitionId=686`

`http://service2.dev.corp.virtualpremise.com:8091`

## 6. Running unit tests

Run `npx nx test ui-shared-lib-ui-elements` to execute the unit tests.

## 7. Resources

- [Controls](https://storybook.js.org/docs/angular/essentials/controls)
