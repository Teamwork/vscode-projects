export interface ProjectListResponse {
    STATUS?:   string;
    projects?: Project[];
}

export interface Project {
    name?:        string;
    companyName?: string;
    id?:          string;
    status?:      string;
    companyId?:   string;
}

// Converts JSON strings to/from your types
export class Converter {
    public static toProjectListResponse(json: string): ProjectListResponse {
        return JSON.parse(json);
    }

    public static projectListResponseToJson(value: ProjectListResponse): string {
        return JSON.stringify(value);
    }
}
