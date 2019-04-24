"use strict";
// To parse this data:
//
//   import { Convert, TaskListResponse } from "./file";
//
//   const taskListResponse = Convert.toTaskListResponse(json);
Object.defineProperty(exports, "__esModule", { value: true });
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