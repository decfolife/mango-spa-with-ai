// Converted from \VirtualPremise.Domain.Web.UI\1 - Main\v06\VirtualPremise.Domain.VPObjects\BLL\Contact
// Do we need this?
// declare interface Contact {
//     clientPreferences: any[];
//     companyID: number;
//     companyTypeID: number;
//     contactActive: boolean;
//     contactConsolidatedEmails: boolean;
//     contactCurrency: number;
//     contactDatesEU: boolean;
//     contactEmailAddress: string;
//     contactFirstName: string;
//     contactFound: boolean;
//     contactGroup: string;
//     contactGroups: ContactGroup[];
//     contactID: number;
//     contactLastName: string;
//     contactMiddleName: string;
//     contactPublic: boolean;
//     contactSuffix: string;
//     createdBy: number;
//     dateCreated: string;
//     isTemporaryContact: boolean;
//     lastModified: string;
//     lastModifiedBy: number;
//     objectSubTypeTypeID: number;
//     securityLevelID: number;
// }

export interface ContactRecord {
  contactID: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  requireSSO?: boolean;
  userRole?: number;
  userRoleName?: string;
  isDefaultLoginContact?: boolean;
  active?: boolean;
  allowLogOn?: boolean;
  IsUser?: boolean;
  userAppType?: number;
  preferences?: ContactPreferences;
  dateCreated?: Date;
}

export interface ContactPreferences {
  contactDatesEU: boolean;
  contactConsolidatedEmails: boolean;
  contactCurrency: number;
  contactMeasurements: number;
  contactStartPage: string;
  contactRequireSSO?: boolean;
  defaultQuickSearchObjectTypeTypeID?: number;
}
