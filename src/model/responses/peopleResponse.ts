export interface PeopleResponse {
    people?: Person[];
    STATUS?: string;
}

export interface Person {
    "site-owner"?:                 boolean;
    twitter?:                      string;
    "last-name"?:                  string;
    useShorthandDurations?:        boolean;
    profile?:                      string;
    userUUID?:                     string;
    "user-name"?:                  string;
    id?:                           string;
    "phone-number-office"?:        string;
    "phone-number-mobile"?:        string;
    "first-name"?:                 string;
    "user-type"?:                  UserType;
    "im-handle"?:                  string;
    "login-count"?:                string;
    openId?:                       string;
    "phone-number-office-ext"?:    string;
    twoFactorAuthEnabled?:         boolean;
    "company-id"?:                 string;
    "has-access-to-new-projects"?: boolean;
    "address-zip"?:                string;
    "project-last-active"?:        string;
    "last-login"?:                 Date;
    companyId?:                    string;
    administrator?:                boolean;
    "address-city"?:               string;
    pid?:                          string;
    "profile-text"?:               string;
    "email-address"?:              string;
    lengthOfDay?:                  string;
    tags?:                         any[];
    "company-name"?:               CompanyName;
    "last-changed-on"?:            string;
    deleted?:                      boolean;
    "address-state"?:              string;
    "address-country"?:            string;
    notes?:                        string;
    "user-invited-status"?:        UserInvitedStatus;
    address?:                      Address;
    "address-line-2"?:             string;
    "address-line-1"?:             string;
    "created-at"?:                 Date;
    "user-invited-date"?:          string;
    "avatar-url"?:                 string;
    "in-owner-company"?:           boolean;
    title?:                        string;
}

export interface Address {
    zipcode?:     string;
    countrycode?: string;
    state?:       string;
    line1?:       string;
    country?:     string;
    line2?:       string;
    city?:        string;
}

export enum CompanyName {
    Teamwork = "Teamwork",
    TeamworkCOMFormerEmployee = "Teamwork.com (former employee)",
}

export enum UserInvitedStatus {
    Complete = "COMPLETE",
}

export enum UserType {
    Account = "account",
    Contact = "contact",
}

// Converts JSON strings to/from your types
export class Convert {
    public static toPeopleResponse(json: string): PeopleResponse {
        return JSON.parse(json);
    }

    public static peopleResponseToJson(value: PeopleResponse): string {
        return JSON.stringify(value);
    }
}
