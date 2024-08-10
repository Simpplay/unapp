class instruction {
    static SearchTypes = {
        next_line: 0,
        next: 1
    }

    static SearchActions = {
        exact: 0,
        contains: 1,
        any_number: 2
    }

    static ReturnType = {
        constant: 0,
        variable: 1,
        function: 2
    }

    type;
    search_action;
    searchValue;
    actions = [];
    search_next = false;

    constructor(text) {
        this.#parse(text);
    }

    resetVariables() {
        this.search_next = false;
        this.actions.forEach(a => { a.resetVariables() });
        default_functions.resetVariables();
    }

    #getSelf(line) {
        let self = '';
        if (!line || typeof line !== 'string') return self;
        if (this.search_action === instruction.SearchActions.exact) {
            if (line.startsWith(this.searchValue)) {
                self = line.slice(this.searchValue.length);
                if (self.length === 0) {
                    self = '-';
                }
            }
        } else if (this.search_action === instruction.SearchActions.contains) {
            if (line.includes(this.searchValue)) {
                self = line.split(this.searchValue).slice(-1); // or use replace for first occurrence
            }
        } else if (this.search_action === instruction.SearchActions.any_number) {
            const regex = new RegExp(String.raw`^\d+${this.searchValue}(.*)$`);
            const match = regex.exec(line);
            if (match) {
                const [, a] = match;
                self = a;
            }
        }
        return self;
    }


    processLine(line, ret) {
        var self = '';
        if (!this.search_next) {
            if (this.type === instruction.SearchTypes.next_line) {
                if (this.#getSelf(line) !== '') {
                    this.search_next = true;
                }
            } else if (this.type === instruction.SearchTypes.next) {
                self = this.#getSelf(line);
            }
        } else {
            self = line;
            this.search_next = false;
        }
        if (self !== '') {
            this.actions.forEach(a => {
                if (!stop) a.getValue(self, ret);
            }, this);
        };
    }


    #parse(text) {
        const regexMatch = /%{*(.+):#(exact|contains|any_number):([^}]+)}%\s*=\s*(.+)/.exec(text);
        if (!regexMatch) return;
        const [_, lineType, searchType, searchValue, actions] = regexMatch;
        this.type = instruction.SearchTypes[lineType];
        this.search_action = instruction.SearchActions[searchType];
        this.searchValue = searchValue;
        actions.split('&').forEach(a => {
            this.actions.push(new action(a));
        }, this);
    }
}

class action {
    constructor(text) {
        this.#parse(text);
    }

    constant;
    varName;
    varValue;
    funcArgs;
    funcName;

    #parse(text) {
        const regexMatch = /var:([^(]+)\((.+)*\)|\]|func:([^(]+)\((.+)*\)|\]|const:([^(]+)\)|\]/.exec(text);
        if (!regexMatch || (!regexMatch[1] && !regexMatch[2] && !regexMatch[3] && !regexMatch[4] && !regexMatch[5])) {
            this.constant = text;
            return;
        }
        const [_, varName, varValue, funcName, funcArgs, constant] = regexMatch;
        if (varName && varValue) {
            this.varName = varName;
            this.varValue = varValue;
        } else if (funcName) {
            this.funcName = funcName;
            this.funcArgs = funcArgs ? funcArgs : [];
        } else if (constant) {
            this.constant = constant;
        }
    }

    resetVariables() {

    }

    getValue(self, ret) {
        if (!self) return undefined;

        if (this.constant) {
            return this.constant;
        } else if (this.funcArgs) {
            var a = this.#getSpecificArgs(this.funcArgs).map(arg => new action(arg).getValue(self, ret).replaceAll('self', self).trimStart());
            if (typeof a === 'string') a = a.replaceAll(/'/g, "");
            else if (typeof a === 'object') a = a.map(arg => (typeof arg === 'string') ? arg.replaceAll(/'/g, "") : arg);
            if (!Object.values(Object.keys(default_functions.functions)).includes(this.funcName)) throw new Error('Function not found: ' + this.funcName);
            return default_functions.functions[this.funcName](ret, ...a);
        } else if (this.varName && this.varValue && !variablesDisabled) {
            const value = new action(this.varValue).getValue(self, ret);
            var r = new variable(this.varName, typeof value === 'string' ? value.replaceAll('self', self).trimStart().replaceAll(/'/g, "") : value);
            if (DEBUG) console.log('var: [', this.varName, '], [', r, ']');

            // Helper function to get or create a variable in ret
            const getOrCreate = (_key) => {
                let _val = ret.find(v => v.name === _key);
                if (!_val) {
                    _val = new variable(_key, []);
                    ret.push(_val);
                }
                return _val;
            };

            // Handle group variables
            if (group.defaultVariables.hasOwnProperty(this.varName)) {
                const groupKey = `group_${actual_group}`;
                let groupVar = getOrCreate(groupKey);
                groupVar.value.push(r);
            }
            // Handle schedule variables
            else if (schedule.defaultVariables.hasOwnProperty(this.varName)) {
                const groupKey = `group_${actual_group}`;
                const scheduleKey = `schedule_${actual_schedule}`;

                // Get or create the group
                let groupVar = getOrCreate(groupKey);

                // Find or create the schedule array within the group
                let scheduleVar = groupVar.value.find(v => v.name == scheduleKey);
                if (!scheduleVar) {
                    scheduleVar = new variable(scheduleKey, []);
                    groupVar.value.push(scheduleVar);
                }

                // Add the new variable to the schedule array
                scheduleVar.value.push(r);
            } else {
                if (r !== undefined && r.value !== '') ret.push(r);  // For other cases, just push to the ret array
            }
        }
        return undefined;
    }



    #getSpecificArgs(generalArgs) {
        const args = [];
        let currentArg = '';
        let depth = 0;
        let inQuotes = false;


        for (let i = 0; i < generalArgs.length; i++) {
            const char = generalArgs[i];

            if (char === '\'') {
                inQuotes = !inQuotes;
                currentArg += char;
            } else if (inQuotes) {
                currentArg += char;
            } else {
                if (char === '(') {
                    depth++;
                    currentArg += char;
                } else if (char === ')') {
                    depth--;
                    currentArg += char;
                } else if (char === ',' && depth === 0) {
                    args.push(currentArg.trim());
                    currentArg = '';
                } else {
                    currentArg += char;
                }
            }
        }

        if (currentArg) {
            args.push(currentArg.trim());
        }

        return args;
    }


}

class variable {
    name;
    value;

    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
}



var actual_group = 0;
var actual_schedule = 0;
var stop = false;
var variablesDisabled = false;

class default_functions {
    static organizeString(string) {
        const match = string.match(/var:|func:/g)
        return (!match) ? string.replaceAll(/'/g, '').replaceAll('const:', '') : string;
    }

    static resetVariables() {
        actual_group = 0;
        actual_schedule = 0;
        stop = false;
        variablesDisabled = false;
    }

    static functions = {
        "eval": (variables, code) => {
            return eval(code);
        },
        "function": (variables, code) => {
            return new Function(code)();
        },

        "join": (variables, ...args) => {
            return args.join('');
        },
        "split": (variables, text, delimiter, index, ignore_errors = false) => {
            delimiter = this.organizeString(delimiter);
            const a = text.split(delimiter);
            if (DEBUG) console.log('split: ' + '[' + text + '], [' + delimiter + '], [' + index + ']' + ' = [' + a + ']');
            if (index !== undefined && (index < 0 || a.length <= index)) {
                if (ignore_errors) return '';
                throw new Error('split error at ', a, `check for delimiter or index. Args: ${text}, ${delimiter}, ${index}`);
            }
            return a[index];
        },
        "replace": (variables, text, search, replacement, ignore_errors = false) => {
            if ((!text || !search || !replacement) && ignore_errors) return '';
            replacement = this.organizeString(replacement);
            search = this.organizeString(search);
            if (DEBUG) console.log('replace: ' + '[' + text + '], [' + search + '], [' + replacement + '] = [' + text.replaceAll(search, replacement) + ']');
            return text.replaceAll(search, replacement);
        },
        "parseDate": (variables, text) => {
            const [start, end] = text.split('-');
            if (DEBUG) console.log('parseDate: ' + '[' + text + ']' + ' = [' + start + ']' + '[' + end + ']');
            return { start, end };
        },
        "changeGroup": (variables, self) => {
            if (DEBUG) console.log('changeGroup: ' + '[' + self + ']');
            actual_group = self ? self : actual_group + 1;
            actual_schedule = 0;
        },
        "nextSchedule": (variables) => {
            actual_schedule++;
        },
        "disableVariables": (variables) => {
            variablesDisabled = true;
        },
        "enableVariables": (variables) => {
            variablesDisabled = false;
        },
        "getRandomNumber": (variables, min, max) => {
            return Math.floor(Math.random() * (max - min + 1) + min);
        },
        "stop": (variables) => {
            stop = true;
        }
    }
}

// module.exports = { instruction };