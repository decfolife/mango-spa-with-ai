import { Environment } from '@mango/data-models/lib-data-models';

class EnvironmentsCrem implements Environment {
  production = false;
  name = 'OPS';
  showPayload = true;
  cremBaseUrl = 'https://[CLIENT].ops.corp.virtualpremise.com';
  CAUrl = 'https://login.ops.corp.virtualpremise.com:30443';
  // Only needed for localhost. Otherwise use `${window.location.origin}/api`
  baseApiUrl = 'http://api.ops.corp.virtualpremise.com:30080/';
  logRocketAppId = '';
}

export const environment = new EnvironmentsCrem();
