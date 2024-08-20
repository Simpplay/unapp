import moment from 'https://unpkg.com/moment@2.30.1/dist/moment.js';

class University {
    static UniversityFactory = class UniversityFactory {
        // Obligatory fields
        id;
        name;

        // Optional fields
        configuration = Object.assign({}, {});
        courses = [];
        instructions = [];

        // Dont touch if don't know what you're doing
        combinations = [];
        actualCombination = 0;
        allEvents = [];

        createUniversity() {
            const university = new University();
            university.id = this.id;
            university.courses = this.courses;
            university.name = this.name;
            university.combinations = this.combinations;
            university.actualCombination = this.actualCombination;
            university.configuration = this.configuration;
            university.instructions = this.instructions;
            return university;
        }
    }

    static fromJSON(json) {
        const factory = new University.UniversityFactory();

        factory.id = json.id;
        factory.name = json.name;
        if (json.configuration) factory.configuration = json.configuration;
        json.instructions.forEach(i => {
            factory.instructions.push(Instruction.fromJSON(i));
        });

        json.courses.forEach(_c => {
            console.log('university:', json, _c)
            u.addCourse(Course.fromJSON(_c));
        });

        return factory.createUniversity();
    }

    getAsJSON() {
        return JSON.stringify({
            id: this.id,
            name: this.name,
            requirements: this.requirements,
            configuration: this.configuration,
            courses: this.courses
        });
    }

    // Deleted populateCourseList()

    // Deleted cleanCourseList()

    // Deleted addCourseToLi(c)

    getCourse(course_id) {
        return this.courses.find(c => c.course_id == course_id);
    }

    removeCourse(course_id) {
        this.courses = this.courses.filter(c => c.course_id != course_id);
        this.populateCourseList();
    }

    // Deleted cleanCombinations()

    // Deleted goToCombination(index)
}

class Course {
    static defaultVariables = {
        "course_name": (c, value) => {
            c.course_name = value;
        },
        "course_id": (c, value) => {
            c.course_id = value;
        },
        "course_credits": (c, value) => {
            c.course_credits = value;
        },
        "course_groups": (c, value) => {
            c.course_groups = value;
        }
    }

    static fromJSON(json) {
        const gE = []
        console.log(json)
        json.course_groups.forEach(c => {
            const dE = []
            c.schedule.forEach(d => {
                dE.push(new schedule(d.schedule_day, { 'start': d.schedule_time.start, 'end': d.schedule_time.end }, d.schedule_time_format, { 'start': d.date.start, 'end': d.date.end }, d.date_format));
            });
            gE.push(new group(c.parent_course_id, c.group_id, c.course_teacher, c.group_quota, c.classroom, dE));
        });
        return new Course(json.course_name, json.course_id, json.course_credits, gE, json.requirements);
    }

    constructor(course_name = "", course_id = "", course_credits = 0, course_groups = [], requirements = {}) {
        this.course_name = course_name;
        this.course_id = course_id;
        this.course_credits = course_credits;
        this.course_groups = course_groups;
        this.color = randomColor();
        this.requirements = requirements;
    }

    // Deleted static getAsHTML(c, color_palete = false)

    // Deleted static fromID(id)

    // Deleted static fromHTML(html)

    addGroup(group, isManual = false) {
        if (!isManual && group.schedule.length == 0) {
            console.log('Empty group detected: ', group);
            return;
        }
        group.parent_course_id = this.course_id;
        this.course_groups.push(group);
        // Deleted updateCalendarEvent(this);
    }

    getGroup(group_id) {
        return this.course_groups.find(g => g.group_id == group_id);
    }

    parseVariables(variables) {
        const remaining = variables.filter(v => !Course.defaultVariables.hasOwnProperty(v.name));
        variables.forEach(v => {
            if (Course.defaultVariables.hasOwnProperty(v.name)) {
                Course.defaultVariables[v.name](this, v.value);
            } else if (v.name.includes("group_")) {
                const g = new group();
                g.parseVariables(v.value);
                this.addGroup(g);
            }
        });
        this.requirements = variables['requirements'];
        return remaining;
    }

    // Deleted isDisabled()
}

class group {
    static defaultVariables = {
        "group_id": (c, value) => {
            c.group_id = value;
        },
        "course_teacher": (c, value) => {
            c.course_teacher = value;
        },
        "group_quota": (c, value) => {
            c.group_quota = value;
        },
        "classroom": (c, value) => {
            c.classroom = value;
        },
        "constant_date": (c, value) => {
            c.constant_date = value;
        },
    }

    constructor(parent_course_id = "", group_id = "", course_teacher = "", group_quota = 0, classroom = "", schedule = []) {
        this.parent_course_id = parent_course_id;
        this.group_id = group_id;
        this.course_teacher = course_teacher;
        this.group_quota = group_quota;
        this.classroom = classroom;
        this.schedule = schedule;
        this.disabled = false;
    }

    // Deleted getColor()

    // Deleted disableGroup(dontChange = false)

    parseVariables(variables) {
        const remaining = variables.filter(v => !group.defaultVariables.hasOwnProperty(v.name));
        variables.forEach(v => {
            if (group.defaultVariables.hasOwnProperty(v.name)) {
                group.defaultVariables[v.name](this, v.value);
            } else if (v.name.includes("schedule_")) {
                const s = new schedule();
                s.parseVariables(v.value);
                if (this.constant_date) s.date = this.constant_date;
                this.addSchedule(s);
            }
        });

        // Check for schedules with comma-separated days
        this.schedule = this.schedule.flatMap(sch => {
            if (sch.schedule_day && sch.schedule_day.includes(',')) {
                return sch.schedule_day.split(',').map(day => {
                    const newSchedule = Object.assign({}, sch);
                    newSchedule.schedule_day = day.trim();
                    return newSchedule;
                });
            }
            return sch;
        });

        return remaining;
    }

    addSchedule(schedule) {
        this.schedule.push(schedule);
    }

    getSchedule(schedule_id) {
        return this.schedule.find(s => s.group_id == schedule_id);
    }

    // Deleted static getAsHTML(g)
}

class schedule {
    static defaultVariables = {
        "schedule_day": (c, value) => {
            c.schedule_day = value;
        },
        "schedule_time": (c, value) => {
            c.schedule_time = value;
        },
        "schedule_time_format": (c, value) => {
            c.schedule_time_format = value;
        },
        "group_date": (c, value) => {
            c.date = value;
        },
        "group_date_format": (c, value) => {
            c.date_format = value;
        }
    }

    constructor(schedule_day = "", schedule_time = {}, schedule_time_format = "", date = {}, date_format = "") {
        this.schedule_day = schedule_day;
        this.schedule_time = schedule_time;
        this.schedule_time_format = schedule_time_format;
        this.date = date;
        this.date_format = date_format;
    }

    parseVariables(variables) {
        const remaining = variables.filter(v => !schedule.defaultVariables.hasOwnProperty(v.name));
        variables.forEach(v => {
            if (schedule.defaultVariables.hasOwnProperty(v.name)) {
                schedule.defaultVariables[v.name](this, v.value);
            }
        });
        if (!this.date || Object.keys(this.date).length < 2) {
            this.date.start = moment().format('DD/MM/YYYY');
            this.date.end = moment().add(6, 'months').format('DD/MM/YYYY');
            this.date_format = 'DD/MM/YYYY';
        }
        return remaining;
    }


    // Deleted static getAsHTML(s)
}

class Instruction {
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
        Variable: 1,
        function: 2
    }

    static InstructionFactory = class InstructionFactory {
        // Obligatory fields
        type;
        search_action;
        searchValue;

        // Optional fields
        actions = [];

        // Dont touch if don't know what you're doing
        search_next = false;

        createInstruction() {
            const instruction = new Instruction();
            instruction.type = this.type;
            instruction.search_action = this.search_action;
            instruction.searchValue = this.searchValue;
            instruction.actions = this.actions;
            return instruction;
        }

        fromText(text) {
            const regexMatch = /%{*(.+):#(exact|contains|any_number):([^}]+)}%\s*=\s*(.+)/.exec(text);
            if (!regexMatch) return;
            const [_, lineType, searchType, searchValue, actions] = regexMatch;
            this.type = Instruction.SearchTypes[lineType];
            this.search_action = Instruction.SearchActions[searchType];
            this.searchValue = searchValue;
            actions.split('&').forEach(a => {
                const factory = new Action.ActionFactory();
                this.actions.push(factory.fromText(a));
            }, this);
            return this.createInstruction();
        }
    }

    static fromJSON(json) {
        const factory = new Instruction.InstructionFactory();
        factory.type = json.type;
        factory.search_action = json.search_action;
        factory.searchValue = json.searchValue;
        json.actions.forEach(a => {
            factory.actions.push(Action.fromJSON(a));
        });
        return factory.createInstruction();
    }

    resetVariables() {
        this.search_next = false;
        // this.actions.forEach(a => { a.resetVariables() });
        DefaultFunctions.resetVariables();
    }

    #getSelf(line) {
        let self = '';
        if (!line || typeof line !== 'string') return self;
        if (this.search_action === Instruction.SearchActions.exact) {
            if (line.startsWith(this.searchValue)) {
                self = line.slice(this.searchValue.length);
                if (self.length === 0) {
                    self = '-';
                }
            }
        } else if (this.search_action === Instruction.SearchActions.contains) {
            if (line.includes(this.searchValue)) {
                self = line.split(this.searchValue).slice(-1); // or use replace for first occurrence
            }
        } else if (this.search_action === Instruction.SearchActions.any_number) {
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
            if (this.type === Instruction.SearchTypes.next_line) {
                if (this.#getSelf(line) !== '') {
                    this.search_next = true;
                }
            } else if (this.type === Instruction.SearchTypes.next) {
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

        // TODO: Generalize this
        if (requirementsRegex && !stop && !line.includes('¿Todas?')) {
            let req = requirementsRegex.exec(line);
            if (req) {
                if (req.length == 3) {
                    ret['requirements'][req[1]] = req[2];
                }
            }
        }
    }
}

class Action {
    static ActionFactory = class ActionFactory {
        // Constant Fields
        constant;

        // Variable Fields
        varName;
        varValue;

        // Function Fields
        funcArgs;
        funcName;

        createAction() {
            const action = new Action();
            action.constant = this.constant;
            action.varName = this.varName;
            action.varValue = this.varValue;
            action.funcArgs = this.funcArgs;
            action.funcName = this.funcName;
            return action;
        }

        fromText(text) {
            const regexMatch = /var:([^(]+)\((.+)*\)|\]|func:([^(]+)\((.+)*\)|\]|const:([^(]+)\)|\]/.exec(text);
            if (!regexMatch || (!regexMatch[1] && !regexMatch[2] && !regexMatch[3] && !regexMatch[4] && !regexMatch[5])) {
                this.constant = text;
                return this.createAction();
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
            return this.createAction();
        }
    }

    static fromJSON(json) {
        const factory = new Action.ActionFactory();
        factory.constant = json.constant;
        factory.varName = json.varName;
        factory.varValue = json.varValue;
        factory.funcArgs = json.funcArgs;
        factory.funcName = json.funcName;
        return factory.createAction();
    }

    getValue(self, ret) {
        if (!self) return undefined;

        if (this.constant) {
            return this.constant;
        } else if (this.funcArgs) {
            var a = this.#getSpecificArgs(this.funcArgs).map(arg => (new Action.ActionFactory()).fromText(arg).getValue(self, ret).replaceAll('self', self).trimStart());
            if (typeof a === 'string') a = a.replaceAll(/'/g, "");
            else if (typeof a === 'object') a = a.map(arg => (typeof arg === 'string') ? arg.replaceAll(/'/g, "") : arg);
            if (!Object.values(Object.keys(DefaultFunctions.functions)).includes(this.funcName)) throw new Error('Function not found: ' + this.funcName);
            return DefaultFunctions.functions[this.funcName](ret, ...a);
        } else if (this.varName && this.varValue && !variablesDisabled) {
            const value = (new Action.ActionFactory()).fromText(this.varValue).getValue(self, ret);
            var r = new Variable(this.varName, typeof value === 'string' ? value.replaceAll('self', self).trimStart().replaceAll(/'/g, "") : value);

            // Helper function to get or create a Variable in ret
            const getOrCreate = (_key) => {
                let _val = ret.find(v => v.name === _key);
                if (!_val) {
                    _val = new Variable(_key, []);
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
                    scheduleVar = new Variable(scheduleKey, []);
                    groupVar.value.push(scheduleVar);
                }

                // Add the new Variable to the schedule array
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

class Variable {
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
var requirementsRegex = undefined;

class DefaultFunctions {
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
        "function": (variables, code) => {
            return new Function(code)();
        },

        "join": (variables, ...args) => {
            return args.join('');
        },
        "split": (variables, text, delimiter, index, ignore_errors = false) => {
            delimiter = this.organizeString(delimiter);
            const a = text.split(delimiter);
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
            return text.replaceAll(search, replacement);
        },
        "parseDate": (variables, text) => {
            const [start, end] = text.split('-');
            return { start, end };
        },
        "changeGroup": (variables, self) => {
            actual_group = self ? self : actual_group + 1;
            actual_schedule = 0;
        },
        "nextSchedule": (variables) => {
            actual_schedule++;
        },
        "startRequirements": (variables, regex) => {
            requirementsRegex = new RegExp(regex, 'g');
        },
        "endRequirements": (variables) => {
            requirementsRegex = undefined;
            return;
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

/*
    This class is responsible for generating all possible combinations of courses
    * free_days: days that the student is free (a list from the const daysOfWeek)
    * lunch_time: time that the student has lunch {start, end}
    * max_courses_per_day: maximum number of courses per day
    * max_holes_per_day: maximum number of holes per day
    * range: range of hours that the student is available {start, end}
    * free_time: list of free time that the student has {day, start, end}
*/

const default_combination_configurations = {
    'free_days': [],
    'lunch_time': {
        'start': '12:00',
        'end': '13:00'
    },
    'max_courses_per_day': -1,
    'max_holes_per_day': -1,
    'range': {
        'start': '07:00',
        'end': '20:00'
    },
    'free_time': []
}

class Combination {
    constructor(groups = []) {
        this.groups = groups;
        this.score = 0;
        this.scoreDetails = {
            lunch_time: [],
            free_days: [],
            range: [],
            overlap: [],
            max_courses_per_day: [],
            max_holes_per_day: [],
            free_time: []
        };
    }

    /**
     * This function generates all possible combinations
     * returns: list of groups of the lists elements
     */
    static generateCombinations(lists) {
        // if its empty return an empty array
        if (lists.length === 0) {
            return [[]];
        }

        // get the first element of the list
        const first = lists[0];
        // get the rest of the elements
        const rest = lists.slice(1);

        // get the rest of the combinations
        const restCombinations = Combination.generateCombinations(rest);

        // generate the combinations
        const result = [];
        for (const f of first) {
            for (const r of restCombinations) {
                result.push([f, ...r]);
            }
        }

        return result;
    }

    static generateCombinationsFromCourses(courses, config = default_combination_configurations) {
        const groups = courses.map(c => c.course_groups);
        const combinations = Combination.generateCombinations(groups).map(c => new Combination(c));
        const separated = {};

        // Evaluate score and organize combinations by score
        combinations.forEach(c => {
            const score = Combination.isValidCombination(c, 0, config);
            c.score = score;
            if (!separated[score]) separated[score] = [];
            separated[score].push(c);
        });

        // Flatten, shuffle, and sort combinations
        let result = [];
        Object.values(separated).forEach(value => {
            shuffleArray(value);
            result.push(...value);
        });

        result = result.filter(c => c.score >= -500);

        // Sort by score in descending order
        result.sort((a, b) => b.score - a.score);
        return result;
    }

    static isValidCombination(c, score = 0, config = default_combination_configurations) {
        config = { ...default_combination_configurations, ...config };

        const groups = c.groups;

        const pointsPerError = {
            lunch_time: 1,
            free_days: 2,
            range: 3,
            max_courses_per_day: 20,
            max_holes_per_day: 10,
            overlap: 500,
        };

        const checkOverlap = (start1, end1, start2, end2, gran = "hour", inc = "[]") => {
            if (!(start1 instanceof moment)) start1 = moment(start1, 'HH:mm');
            if (!(end1 instanceof moment)) end1 = moment(end1, 'HH:mm').add(-1, 'minute');
            if (!(start2 instanceof moment)) start2 = moment(start2, 'HH:mm');
            if (!(end2 instanceof moment)) end2 = moment(end2, 'HH:mm').add(-1, 'minute');

            // check range1 is between range2
            const startFirst = start1.isBetween(start2, end2, gran, inc)
            const endFirst = end1.isBetween(start2, end2, gran, inc)

            // check range2 is between range1
            const startLast = start2.isBetween(start1, end1, gran, inc)
            const endLast = end2.isBetween(start1, end1, gran, inc)

            return startFirst || endFirst || startLast || endLast
        }

        const allSchedules = {};
        Object.keys(daysOfWeek).forEach(day => allSchedules[day] = []);

        groups.forEach(g => {
            if (g.disabled) score = -1000;
            g.schedule.forEach(s => {
                if (g.schedule_day in config.free_days) {
                    score -= pointsPerError.free_days;
                    c.scoreDetails.free_days.push(g.schedule_day);
                }

                if (!checkOverlap(s.schedule_time.start, s.schedule_time.end, config.range.start, config.range.end)) {
                    score -= pointsPerError.range;
                    c.scoreDetails.range.push(g.schedule_day);
                }

                // Check overlaps with lunch time
                if (config.lunch_time.start !== '00:00' && config.lunch_time.end !== '00:00') {
                    if (checkOverlap(s.schedule_time.start, s.schedule_time.end, config.lunch_time.start, config.lunch_time.end)) {
                        score -= pointsPerError.lunch_time;
                        c.scoreDetails.lunch_time.push(g.schedule_day);
                    }
                }

                // Check overlaps with free time
                config.free_time.forEach(freeTime => {
                    if (freeTime.day == dayIntFromSunday(s.schedule_day) && checkOverlap(s.schedule_time.start, s.schedule_time.end, freeTime.start, freeTime.end)) {
                        score -= pointsPerError.free_time;
                        c.scoreDetails.free_time.push(g.schedule_day);
                    }
                });

                // Check overlaps with other schedules
                allSchedules[s.schedule_day].forEach(other => {
                    if (checkOverlap(s.schedule_time.start, s.schedule_time.end, other.schedule_time.start, other.schedule_time.end)) {
                        score -= pointsPerError.overlap;
                        c.scoreDetails.overlap.push(g.schedule_day);
                    }
                });

                allSchedules[s.schedule_day].push(s);
                if (config.max_courses_per_day != -1 && allSchedules[s.schedule_day].length > config.max_courses_per_day) {
                    score -= pointsPerError.max_courses_per_day;
                    c.scoreDetails.max_courses_per_day.push(g.schedule_day);
                }
            });
        });

        // Now, calculate holes and check max holes per day
        Object.keys(allSchedules).forEach(day => {
            // Sort schedules by start time for the current day
            allSchedules[day].sort((a, b) => moment(a.schedule_time.start, 'HH:mm').diff(moment(b.schedule_time.start, 'HH:mm')));

            const holes = [];
            allSchedules[day].forEach((s, i) => {
                if (i === 0) return;
                const previous = moment(allSchedules[day][i - 1].schedule_time.end, 'HH:mm');
                const actual = moment(allSchedules[day][i].schedule_time.start, 'HH:mm');
                if (allSchedules[day][i - 1].schedule_time.end != allSchedules[day][i].schedule_time.start) {
                    holes.push(actual.diff(previous, 'minutes'));
                } else {

                }
            });

            if (holes.length != 0 && holes.length > config.max_holes_per_day) {
                score -= pointsPerError.max_holes_per_day;
                c.scoreDetails.max_holes_per_day.push(holes);
            }
        });

        return score;
    }
}

const randomColor = (() => {
    "use strict";

    const randomInt = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    return () => {
        var h = randomInt(0, 360);
        var s = randomInt(42, 98);
        var l = randomInt(40, 90);
        return `hsl(${h},${s}%,${l}%)`;
    };
})();

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Define a mapping of days to their respective integer values, starting from Sunday
const daysOfWeek = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6
};

const days = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
}

const daysTranslated = {
    'sunday': 'Domingo',
    'monday': 'Lunes',
    'tuesday': 'Martes',
    'wednesday': 'Miércoles',
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado'
};

export { University, Course, Instruction, Action, Variable, DefaultFunctions, Combination, randomColor, default_combination_configurations, daysOfWeek, days, daysTranslated };