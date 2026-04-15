import { Environment } from '@mango/data-models/lib-data-models';

class EnvironmentsCrem implements Environment {
  production = true;
  name = 'DR';
  showPayload = false;
  cremBaseUrl = 'https://[CLIENT].dr.costarremanager.com';
  CAUrl = 'https://login.dr.costarremanager.com';
  // Only needed for localhost. Otherwise use `${window.location.origin}/api`
  baseApiUrl = 'https://api.dr.costarremanager.com/';
  logRocketAppId = '6vmxfr/spa-prod-zjinp';
  rootHostName = '*.costarremanager.com';
}

export const environment = new EnvironmentsCrem();
