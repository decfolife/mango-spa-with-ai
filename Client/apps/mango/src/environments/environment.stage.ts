import { Environment } from '@mango/data-models/lib-data-models';

class EnvironmentsCrem implements Environment {
  production = true;
  name = 'STAGE';
  showPayload = false;
  cremBaseUrl = 'https://[CLIENT].stage.costarremanager.com';
  CAUrl = 'https://login.stage.costarremanager.com';
  // Only needed for localhost. Otherwise use `${window.location.origin}/api`
  baseApiUrl = 'https://api.stage.costarremanager.com/';
  logRocketAppId = '6vmxfr/stage-rrlzr';
  rootHostName = '*.costarremanager.com';
}

export const environment = new EnvironmentsCrem();
