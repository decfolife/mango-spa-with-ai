class EnvironmentsCrem {
  production = false;
  name = 'TEST';
  cremBaseUrl = 'https://[CLIENT].test.corp.virtualpremise.com/';
  CAUrl = 'http://login.test.corp.virtualpremise.com:30080';
  // Only needed for localhost. Otherwise use `${window.location.origin}/api`
  baseApiUrl = 'http://api.test.corp.virtualpremise.com:30080/';
}

export const environment = new EnvironmentsCrem();
