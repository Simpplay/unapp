/*
    This class is responsible for generating all possible combinations of courses
    * free_days: days that the student is free (a list from the const daysOfWeek)
    * lunch_time: time that the student has lunch {start, end}
    * max_courses_per_day: maximum number of courses per day
    * max_holes_per_day: maximum number of holes per day
    * hole_ammount: maximum number of holes
    * range: range of hours that the student is available {start, end}
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

function setCombinationConfig(value, ...path) {
    let config = selected_university.actual_configuration;
    let lastKey = path.pop();

    // Navigate to the correct path in the object
    let nestedConfig = config;
    for (let key of path) {
        if (!(key in nestedConfig)) {
            nestedConfig[key] = {}; // Create nested object if it doesn't exist
        }
        nestedConfig = nestedConfig[key];
    }

    // Set the value at the specified path
    nestedConfig[lastKey] = value;
}

function modifyDayConfiguration(day, add, config = selected_university.actual_configuration) {
    if (add) {
        if (!config.free_days.includes(day)) config.free_days.push(day);
    }
    else config.free_days = config.free_days.filter(d => d !== day);
}


function getCombinationSettingsHTML(config = default_combination_configurations) {
    let html = '<div class="combination-settings">';

    // Free Days Selector
    html += '<div class="setting-group"><label>Free Days:</label><br><div class="days-group">';
    Object.keys(daysOfWeek).forEach(day => {
        const checked = config.free_days.includes(day) ? 'checked' : '';
        html += `
        <input type="checkbox" id="free_day_${day}" name="free_days" onchange="modifyDayConfiguration('${day}', this.checked)" value="${day}" ${checked}>
        <label for="free_day_${day}">${translateDay(day)}</label>`;
    });
    html += '</div></div>';

    // Lunch Time
    html += `
    <div class="setting-group">
        <label>
            <input type="checkbox" onchange="const a = document.getElementById('lunch_start');const b = getElementById('lunch_end');const c = event.target.checked;a.disabled = !c;b.disabled = !c;if (!c) {a.value='00:00';setCombinationConfig('00:00', 'lunch_time', 'start');b.value='00:00';setCombinationConfig('00:00', 'lunch_time', 'end')}" name="lunch_time_enable" ${config.lunch_time.start == '00:00' && config.lunch_time.end == '00:00' ? '' : 'checked'}>
            Lunch Time:
        </label><br>
        Start: <input type="time" id="lunch_start" value="${config.lunch_time.start}" onchange="setCombinationConfig(this.value, 'lunch_time', 'start')" ${config.lunch_time.start === '00:00' && config.lunch_time.end === '00:00' ? 'disabled' : ''}><br>
        End: <input type="time" id="lunch_end" value="${config.lunch_time.end}" onchange="setCombinationConfig(this.value, 'lunch_time', 'end')" ${config.lunch_time.start === '00:00' && config.lunch_time.end === '00:00' ? 'disabled' : ''}>
    </div>`;

    // Max Courses Per Day
    html += `
    <div class="setting-group">
        <label>
            <input type="checkbox" onchange="const a = document.getElementById('max_courses_per_day');const c = event.target.checked;a.disabled = !c;a.value = c ? 0 : -1" name="max_courses_per_day_enable" ${config.max_courses_per_day === -1 ? '' : 'checked'}>
            Max Courses Per Day:
        </label>
        <input type="number" onchange="setCombinationConfig(this.value, 'max_courses_per_day')" id="max_courses_per_day" value="${config.max_courses_per_day}" ${config.max_courses_per_day === -1 ? 'disabled' : ''} min="0">
    </div>`;

    // Max Holes Per Day
    html += `
    <div class="setting-group">
        <label>
            <input type="checkbox" onchange="const a = document.getElementById('max_holes_per_day');const c = event.target.checked;a.disabled = !c;a.value = c ? 0 : -1" name="max_holes_per_day_enable" ${config.max_holes_per_day === -1 ? '' : 'checked'}>
            Max Holes Per Day:
        </label>
        <input type="number" onchange="setCombinationConfig(this.value, 'max_holes_per_day')" id="max_holes_per_day" value="${config.max_holes_per_day}" ${config.max_holes_per_day === -1 ? 'disabled' : ''} min="0">
    </div>`;

    // Range of Hours
    html += `
    <div class="setting-group">
        <label>Available Time Range:</label><br>
        Start: <input type="time" name="range_start" value="${config.range.start}" onchange="setCombinationConfig(this.value, 'range', 'start')"><br>
        End: <input type="time" name="range_end" value="${config.range.end}" onchange="setCombinationConfig(this.value, 'range', 'end')">
    </div>`;

    html += '</div>';
    return html;
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