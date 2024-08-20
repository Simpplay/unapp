class Api {
    constructor(args = {}) {
        this.args = args;
    }

    // Override this
    async response() {
        return '{ "error": "Response function not implemented" }';
    }

    getArgs() {
        const parseValues = (obj) => {
            return Object.fromEntries(
                Object.entries(obj).map(([key, value]) => {
                    /*try {
                        return [key, JSON.parse(value)];
                    } catch {
                        return [key, value];
                    }*/
                    return [key, value];
                })
            );
        };

        if (this.args && Object.keys(this.args).length !== 0) {
            return parseValues(this.args);
        }

        const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
        return parseValues(params);
    }


    baseHead =
        `
        <meta name="color-scheme" content="light dark">
        <meta charset="utf-8">`

    baseBody =
        `
    <body>
        <pre id="output"></pre>
    </body>
    </html>`

    async replaceHTML() {
        document.getElementsByTagName('head')[0].innerHTML = this.baseHead;
        document.getElementsByTagName('body')[0].innerHTML = this.baseBody;
        const outputElem = document.getElementById('output');
        const response = JSON.parse(await this.response());
        if (typeof outputElem !== 'undefined' && outputElem) {
            console.log('Response:', response);
            outputElem.innerHTML = JSON.stringify(response);
        }
    }
}

// Escape special characters for JSON
function escapeJSONString(str) {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}


export { Api, escapeJSONString };