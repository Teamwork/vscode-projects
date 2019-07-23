"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
class Utilities {
    static DateCompare(date, compareDuration) {
        var moment = require('moment');
        var startMoment = moment(date);
        var endMoment = moment();
        var dif = endMoment.diff(startMoment, 'minutes');
        if (dif < compareDuration) {
            return true;
        }
        return false;
    }
    static GetActiveLanguageConfig() {
        const editor = vscode.window.activeTextEditor;
        const documentLanguageId = editor.document.languageId;
        var langConfigFilepath = null;
        for (const _ext of vscode.extensions.all) {
            // All vscode default extensions ids starts with "vscode."
            if (_ext.id.startsWith("vscode.") &&
                _ext.packageJSON.contributes &&
                _ext.packageJSON.contributes.languages) {
                // Find language data from "packageJSON.contributes.languages" for the languageId
                const packageLangData = _ext.packageJSON.contributes.languages.find(_packageLangData => (_packageLangData.id === documentLanguageId));
                // If found, get the absolute config file path
                if (!!packageLangData) {
                    langConfigFilepath = path.join(_ext.extensionPath, packageLangData.configuration);
                    break;
                }
            }
        }
        // Validate config file existance
        if (!!langConfigFilepath && fs.existsSync(langConfigFilepath)) {
            return require(langConfigFilepath);
        }
    }
}
exports.Utilities = Utilities;
//# sourceMappingURL=utilities.js.map