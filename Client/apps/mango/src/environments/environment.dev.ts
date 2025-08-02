import { Environment } from '@mango/data-models/lib-data-models';

class EnvironmentsCrem implements Environment {
  production = false;
  name = 'DEV';
  showPayload = true;
  cremBaseUrl = 'https://[CLIENT].dev.corp.virtualpremise.com';
  CAUrl = 'https://login.dev.corp.virtualpremise.com:30443';
  // Only needed for localhost. Otherwise use `${window.location.origin}/api`
  baseApiUrl = 'http://api.dev.corp.virtualpremise.com:30080/';
  logRocketAppId = '';
}

export const environment = new EnvironmentsCrem();
