class EnvironmentsCrem {
  production = false;
  name = 'DEV';
  cremBaseUrl = 'https://[CLIENT].dev.corp.virtualpremise.com/';
  CAUrl = 'https://login.dev.corp.virtualpremise.com:30443';
  // Only needed for localhost. Otherwise use `${window.location.origin}/api`
  baseApiUrl = 'http://api.dev.corp.virtualpremise.com:30080/';
}

export const environment = new EnvironmentsCrem();
