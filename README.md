# MangoSPA

**MangoSPA** is a modern single-page application built with Angular and managed using Nx Workspace. This project streamlines development with robust features, including Husky for Git hooks and Docker Compose for mimicking production environments.

## Table of Contents
- [MangoSPA](#mangospa)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
  - [Development](#development)
    - [Development Server](#development-server)
    - [Code Scaffolding](#code-scaffolding)
  - [Building the Application](#building-the-application)
  - [Testing with Docker Compose](#testing-with-docker-compose)
    - [Rebuilding Containers](#rebuilding-containers)
  - [Scripts Overview](#scripts-overview)

---

## Getting Started

From the `Client/` folder:
1. **Install dependencies**:  
   ```bash
   npm i -f
   ```
2. **Prepare local automations**:  
   ```bash
   npm prepare
   ```
3. **Start the application**:  
   ```bash
   npx nx run mango:serve
   ```
4. Navigate to the app in your browser:  
   [http://localhost:4200/](http://localhost:4200/)

---

## Development

### Development Server
To start a development server:
```bash
npx nx run mango:serve
```
- The app will automatically reload when source files change.
- To disable live reloading:
  ```bash
  npx nx run mango:serve --live-reload=false
  ```

### Code Scaffolding
Generate new components, directives, pipes, or other Angular artifacts using:
```bash
ng generate <artifact> <name>
```
For example, to generate a component:
```bash
ng generate component component-name
```

---

## Building the Application

Build the project with:
```bash
ng build
```
- The build artifacts will be stored in the `dist/` directory.
- For a production build:
  ```bash
  ng build --prod
  ```

---

## Testing with Docker Compose

To test the application in a production-like environment using Docker Compose:

1. **Build the application locally from the `Client/` folder**:  
   ```bash
   npx nx run mango:build
   ```
2. **Serve the application with Docker Compose from the root directory**:  
   ```bash
   docker-compose up -d
   ```
3. **Rebuild locally for  from the `Client/` folder**:  
   After making changes, rebuild using:
   ```bash
   npx nx run mango:build
   ```

### Rebuilding Containers
- To rebuild a specific container:  
  ```bash
  docker-compose up --build <service-name>
  ```
  Replace `<service-name>` with the service name from `docker-compose.yml`.
  
- To rebuild all containers:  
  ```bash
  docker-compose up --build
  ```

---

## Scripts Overview

The `package.json` includes scripts for various development and build tasks. Here are a few key commands:

- **Start the app**:  
  ```bash
  npm run start
  ```
- **Clean dependencies and artifacts**:  
  ```bash
  npm run clean
  ```
- **Run lint checks**:  
  ```bash
  npm run lint
  ```
- **Run unit tests for Mango**:  
  ```bash
  npm run test:mango
	```
	Attach the watch flag to rerun test on change detection.
  ```
	Attach the watch flag to rerun test on change detection.
  ```bash
  npm run test:mango:watch
  ```
- **Run unit tests for MangoSPA's Projects/Features**:  
  ```bash
  npm run test:features
  ```
	Attach the watch flag to rerun test on change detection.
  ```bash
  npm run test:features:watch
  ```
- **Generate dependency graph**:  
  ```bash
  npm run dep-graph
  ```
- **Build for production**:  
  ```bash
  npm run build:prod:mango
  ```

For the full list, see the `scripts` section in `package.json`.
