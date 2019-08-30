import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as URL from 'url';
import { isNullOrUndefined } from 'util';

export class Utilities{


    public static DateCompare(date: Date, compareDuration: number) : boolean {
        var moment = require('moment');

        var startMoment = moment(date);
        var endMoment = moment();

        var dif = endMoment.diff(startMoment,'minutes');

        if(dif < compareDuration) { return true; }

        return false;
    }

    public static IsValidUrl(url: string) : boolean {
        try {
            if(url.length < 3) { return false };
            var urlparsed = URL.parse(url);
            if( isNullOrUndefined(urlparsed.hostname)) { return false; }
            return true;
          } catch (err) {
            return false;
          }
    }

    public static GetActiveLanguageConfig() : vscode.LanguageConfiguration{
        const editor = vscode.window.activeTextEditor;
        const documentLanguageId:string = editor.document.languageId;
        var langConfigFilepath:string = null;
        for (const _ext of vscode.extensions.all) {
        // All vscode default extensions ids starts with "vscode."
        if (
            _ext.id.startsWith("vscode.") &&
            _ext.packageJSON.contributes &&
            _ext.packageJSON.contributes.languages
        ) {
            // Find language data from "packageJSON.contributes.languages" for the languageId
            const packageLangData = _ext.packageJSON.contributes.languages.find(
            _packageLangData => (_packageLangData.id === documentLanguageId)
            );
            // If found, get the absolute config file path
            if (!!packageLangData) {
            langConfigFilepath = path.join(
                _ext.extensionPath,
                packageLangData.configuration
            );
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