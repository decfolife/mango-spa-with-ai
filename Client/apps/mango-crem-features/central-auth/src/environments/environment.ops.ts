class EnvironmentsCrem {
  production = false;
  name = 'OPS';
  cremBaseUrl = 'https://[CLIENT].ops.corp.virtualpremise.com/';
  CAUrl = 'http://login.ops.corp.virtualpremise.com:30080';
  // Only needed for localhost. Otherwise use `${window.location.origin}/api`
  baseApiUrl = 'http://api.ops.corp.virtualpremise.com:30080/';
}

export const environment = new EnvironmentsCrem();
