"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TodoList {
}
exports.TodoList = TodoList;
// Converts JSON strings to/from your types
class TaskListConverter {
    static toTaskListResponse(json) {
        return JSON.parse(json);
    }
    static taskListResponseToJson(value) {
        return JSON.stringify(value);
    }
}
exports.TaskListConverter = TaskListConverter;
//# sourceMappingURL=TaskListResponse.js.map