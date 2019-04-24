export interface ProjectResponse {
    project?: Project;
    STATUS?:  string;
}

export interface Project {
    replyByEmailEnabled?:      boolean;
    starred?:                  boolean;
    "show-announcement"?:      boolean;
    "harvest-timers-enabled"?: boolean;
    subStatus?:                string;
    status?:                   string;
    integrations?:             Integrations;
    defaultPrivacy?:           string;
    "created-on"?:             Date;
    filesAutoNewVersion?:      boolean;
    category?:                 Category;
    tags?:                     any[];
    "overview-start-page"?:    string;
    logo?:                     string;
    startDate?:                string;
    id?:                       string;
    "last-changed-on"?:        Date;
    type?:                     string;
    endDate?:                  string;
    company?:                  Company;
    "tasks-start-page"?:       string;
    "active-pages"?:           ActivePages;
    name?:                     string;
    privacyEnabled?:           boolean;
    description?:              string;
    announcement?:             string;
    directFileUploadsEnabled?: boolean;
    "start-page"?:             string;
    skipWeekends?:             boolean;
    notifyeveryone?:           boolean;
    boardData?:                BoardData;
    announcementHTML?:         string;
}

export interface ActivePages {
    links?:        string;
    tasks?:        string;
    time?:         string;
    billing?:      string;
    notebooks?:    string;
    files?:        string;
    comments?:     string;
    riskRegister?: string;
    milestones?:   string;
    messages?:     string;
}

export interface BoardData {
}

export interface Category {
    name?:  string;
    id?:    string;
    color?: string;
}

export interface Company {
    name?: string;
    id?:   string;
}

export interface Integrations {
    xero?:                Xero;
    sharepoint?:          Sharepoint;
    microsoftConnectors?: MicrosoftConnectors;
    onedrivebusiness?:    MicrosoftConnectors;
}

export interface MicrosoftConnectors {
    enabled?: boolean;
}

export interface Sharepoint {
    enabled?:    boolean;
    folder?:     string;
    account?:    string;
    foldername?: string;
}

export interface Xero {
    countrycode?:  string;
    enabled?:      boolean;
    connected?:    string;
    organisation?: string;
    basecurrency?: string;
}

// Converts JSON strings to/from your types
export class Convert {
    public static toProjectResponse(json: string): ProjectResponse {
        return JSON.parse(json);
    }

    public static projectResponseToJson(value: ProjectResponse): string {
        return JSON.stringify(value);
    }
}
