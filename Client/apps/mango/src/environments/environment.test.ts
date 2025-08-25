import { Environment } from '@mango/data-models/lib-data-models';

class EnvironmentsCrem implements Environment {
  production = false;
  name = 'TEST';
  showPayload = true;
  cremBaseUrl = 'https://[CLIENT].test.corp.virtualpremise.com';
  CAUrl = 'https://login.test.corp.virtualpremise.com:30443';
  // Only needed for localhost. Otherwise use `${window.location.origin}/api`
  baseApiUrl = 'https://api.test.corp.virtualpremise.com:30443/';
  logRocketAppId = '';
}

export const environment = new EnvironmentsCrem();
