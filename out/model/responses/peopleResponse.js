"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CompanyName;
(function (CompanyName) {
    CompanyName["Teamwork"] = "Teamwork";
    CompanyName["TeamworkCOMFormerEmployee"] = "Teamwork.com (former employee)";
})(CompanyName = exports.CompanyName || (exports.CompanyName = {}));
var UserInvitedStatus;
(function (UserInvitedStatus) {
    UserInvitedStatus["Complete"] = "COMPLETE";
})(UserInvitedStatus = exports.UserInvitedStatus || (exports.UserInvitedStatus = {}));
var UserType;
(function (UserType) {
    UserType["Account"] = "account";
    UserType["Contact"] = "contact";
})(UserType = exports.UserType || (exports.UserType = {}));
// Converts JSON strings to/from your types
class Convert {
    static toPeopleResponse(json) {
        return JSON.parse(json);
    }
    static peopleResponseToJson(value) {
        return JSON.stringify(value);
    }
}
exports.Convert = Convert;
//# sourceMappingURL=peopleResponse.js.map