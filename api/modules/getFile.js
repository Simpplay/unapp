import { Api, escapeJSONString } from './api.js';

class GetFile extends Api {
    validFiles = [];



    async response() {
        const params = this.getArgs();
        if (Object.keys(params).length === 0 || params.file === undefined || (this.validFiles[params.file] === undefined && !params.file.startsWith('assets/universities/'))) {
            return '{ "error": "Invalid file" }';
        } else {
            let outputHTML = '{ ';
            outputHTML += '"file": "'
            let fileContent = await this.loadFile(params.file);
            outputHTML += escapeJSONString(fileContent);
            outputHTML += '"';
            outputHTML += ' }';
            return outputHTML;
        }
    }

    // Synchronously read a text file from the web server
    async loadFile(filePath) {
        var result = null;
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", filePath, false);
        xmlhttp.send();
        if (xmlhttp.status == 200) {
            result = xmlhttp.responseText;
        }
        return result;
    }
}

export { GetFile };