import { TodoItem } from "./TaskItemResponse";

// To parse this data:
//
//   import { Convert, TaskListResponse } from "./file";
//
//   const taskListResponse = Convert.toTaskListResponse(json);

export interface TaskListResponse {
    "todo-lists"?: TodoList[];
    STATUS?:       string;
}

export class TodoList {
    "project-id"?:        string;
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
    TodoItems:            TodoItem[];
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
