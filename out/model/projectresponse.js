"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Converts JSON strings to/from your types
class Convert {
    static toProjectResponse(json) {
        return JSON.parse(json);
    }
    static projectResponseToJson(value) {
        return JSON.stringify(value);
    }
}
exports.Convert = Convert;
//# sourceMappingURL=projectresponse.js.map