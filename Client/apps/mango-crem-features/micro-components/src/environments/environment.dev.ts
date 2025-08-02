class EnvironmentsCrem {
  production = false;
  name = 'DEV';
  appUrls = {
    alertsRules: '/v06/WebServices/Mango/Alerts/Alerts.asmx',
    alerts: '/v06/WebServices/Mango/Alerts/Alerts.asmx',
    bookmarks: '/v06/WebServices/Mango/Bookmarks/Bookmarks.asmx/',
    dashboards: '/v06/WebServices/Mango/Dashboards/Project.asmx/',
    listpages: '/v06/WebServices/Mango/ListPages/Project.asmx/',
    portfolio: '/v06/WebServices/Mango/Dashboards/Portfolio.asmx/',
    leftNav: '/v06/WebServices/Mango/LeftNav/LeftNav.asmx/',
    userMaintenance:
      '/v06/WebServices/Mango/UserMaintenance/UserMaintenance.asmx/',
    formWizard: '/v06/WebServices/Mango/FormsEngine/FormsEngine.asmx/',
    taskApproval: '',
    authenticate: '',
    quickSearch: '',
    userService: '',
    objectActions: '/v06/WebServices/Mango/ObjectActions/ObjectActions.asmx/',
    header: 'http://service2.dev.corp.virtualpremise.com:8090/Header/api/',
  };
  CAUrl = 'https://login.dev.corp.virtualpremise.com:30443';
  mangoSpaUrl = 'http://api.dev.corp.virtualpremise.com:30080';
}

export const environment = new EnvironmentsCrem();
