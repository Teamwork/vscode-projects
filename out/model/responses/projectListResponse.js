"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Converts JSON strings to/from your types
class Converter {
    static toProjectListResponse(json) {
        return JSON.parse(json);
    }
    static projectListResponseToJson(value) {
        return JSON.stringify(value);
    }
}
exports.Converter = Converter;
//# sourceMappingURL=projectListResponse.js.map