import { Environment } from '@mango/data-models/lib-data-models';

class EnvironmentsCrem implements Environment {
  production = true;
  name = 'PROD';
  showPayload = false;
  cremBaseUrl = 'https://[CLIENT].costarremanager.com';
  CAUrl = 'https://login.costarremanager.com';
  // Only needed for localhost. Otherwise use `${window.location.origin}/api`
  baseApiUrl = 'https://api.costarremanager.com/';
  logRocketAppId = '6vmxfr/prod-sqsdk';
  rootHostName = '*.costarremanager.com';
}

export const environment = new EnvironmentsCrem();
