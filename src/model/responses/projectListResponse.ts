import { Person } from "./peopleResponse";
import { TodoList } from "./TaskListResponse";
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
    people?: Person[];
    TodoLists : TodoList[];
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
