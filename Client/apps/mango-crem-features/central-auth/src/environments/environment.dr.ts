class EnvironmentsCrem {
  production = true;
  name = 'DR';
  cremBaseUrl = 'https://[CLIENT].dr.costarremanager.com/';
  CAUrl = 'https://login.dr.costarremanager.com';
  // Only needed for localhost. Otherwise use `${window.location.origin}/api`
  baseApiUrl = 'https://api.dr.costarremanager.com/';
}

export const environment = new EnvironmentsCrem();
