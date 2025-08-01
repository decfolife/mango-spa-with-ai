import { Environment } from '@mango/data-models/lib-data-models';

class EnvironmentsCrem implements Environment {
  production = false;
  name = 'OPS';
  showPayload = true;
  cremBaseUrl = 'http://[CLIENT].ops.corp.virtualpremise.com';
  CAUrl = 'http://login.ops.corp.virtualpremise.com:30080';
  // Only needed for localhost. Otherwise use `${window.location.origin}/api`
  baseApiUrl = 'http://api.ops.corp.virtualpremise.com:30080/';
  logRocketAppId = '';
}

export const environment = new EnvironmentsCrem();
