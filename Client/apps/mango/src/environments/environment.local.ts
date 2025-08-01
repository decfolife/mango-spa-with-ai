import { Environment } from '@mango/data-models/lib-data-models';

class EnvironmentsCrem implements Environment {
  production = false;
  name = 'LOCAL';
  showPayload = true;
  cremBaseUrl = 'retaildemo.local';
  CAUrl = 'http://localhost:5000';
  // Only needed for localhost. Otherwise use `${window.location.origin}/api`
  baseApiUrl = 'http://api.dev.corp.virtualpremise.com:30080/';
  logRocketAppId = '';
}

export const environment = new EnvironmentsCrem();
