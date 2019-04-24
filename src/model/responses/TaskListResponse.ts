// To parse this data:
//
//   import { Convert, TaskListResponse } from "./file";
//
//   const taskListResponse = Convert.toTaskListResponse(json);

export interface TaskListResponse {
    "todo-lists"?: TodoList[];
    STATUS?:       string;
}

export interface TodoList {
    "project-id"?:        string;
    "todo-items"?:        TodoItem[];
    name?:                string;
    description?:         string;
    "milestone-id"?:      string;
    "uncompleted-count"?: string;
    complete?:            boolean;
    private?:             string;
    "overdue-count"?:     string;
    "project-name"?:      string;
    pinned?:              boolean;
    project_id?:          string;
    tracked?:             boolean;
    id?:                  string;
    position?:            string;
    "completed-count"?:   string;
}

export interface TodoItem {
    "project-id"?:                  string;
    "tasklist-isTemplate"?:         boolean;
    order?:                         string;
    "comments-count"?:              string;
    "created-on"?:                  Date;
    canEdit?:                       boolean;
    "has-predecessors"?:            string;
    id?:                            string;
    completed?:                     boolean;
    position?:                      string;
    "estimated-minutes"?:           string;
    description?:                   string;
    progress?:                      string;
    "harvest-enabled"?:             boolean;
    parentTaskId?:                  string;
    "responsible-party-lastname"?:  string;
    "company-id"?:                  string;
    "creator-avatar-url"?:          string;
    "creator-id"?:                  string;
    "project-name"?:                string;
    "start-date"?:                  string;
    "tasklist-private"?:            boolean;
    lockdownId?:                    string;
    canComplete?:                   boolean;
    "responsible-party-id"?:        string;
    "creator-lastname"?:            string;
    "has-reminders"?:               boolean;
    "has-unread-comments"?:         boolean;
    "todo-list-name"?:              string;
    "due-date-base"?:               string;
    private?:                       string;
    userFollowingComments?:         boolean;
    "responsible-party-summary"?:   string;
    status?:                        string;
    "todo-list-id"?:                string;
    predecessors?:                  any[];
    tags?:                          any[];
    content?:                       string;
    "responsible-party-type"?:      string;
    "company-name"?:                string;
    "creator-firstname"?:           string;
    "last-changed-on"?:             Date;
    "due-date"?:                    string;
    "has-dependencies"?:            string;
    "attachments-count"?:           string;
    userFollowingChanges?:          boolean;
    priority?:                      string;
    "responsible-party-firstname"?: string;
    viewEstimatedTime?:             boolean;
    "responsible-party-ids"?:       string;
    "responsible-party-names"?:     string;
    "tasklist-lockdownId"?:         string;
    canLogTime?:                    boolean;
    timeIsLogged?:                  string;
}

// Converts JSON strings to/from your types
export class TaskListConverter {
    public static toTaskListResponse(json: string): TaskListResponse {
        return JSON.parse(json);
    }

    public static taskListResponseToJson(value: TaskListResponse): string {
        return JSON.stringify(value);
    }
}
