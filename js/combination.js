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
    }
}

function setCombinationConfig(value, ...path) {
    console.log('setCombinationConfig', value, path);
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
        Start: <input type="time" id="lunch_start" value="${config.lunch_time.start}" onchange="setCombinationConfig(this.value, 'lunch_time', 'start')"><br>
        End: <input type="time" id="lunch_end" value="${config.lunch_time.end}" onchange="setCombinationConfig(this.value, 'lunch_time', 'end')">
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
    constructor(groups = [], score = 0) {
        this.groups = groups;
        this.score = score;
        this.scoreDetails = {};
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
        var mapped = [];
        var combinations = Combination.generateCombinations(groups);
        combinations.forEach(c => {
            mapped.push(new Combination(c, this.isValidCombination(c, 0, config)));
        });
        mapped.sort((a, b) => b.score - a.score);
        return mapped;
    }

    static isValidCombination(c, score, config = default_combination_configurations) {
        // Initialize scoreDetails
        c.scoreDetails = c.scoreDetails || {
            lunch_time: [],
            free_days: [],
            range: [],
            overlap: [],
            max_courses_per_day: [],
            max_holes_per_day: []
        };
    
        const allTimes = [];
    
        for (const group of c) {
            for (const { schedule_day, schedule_time } of group.schedule) {
                const day = schedule_day.toLowerCase();
                allTimes.push({
                    day: day,
                    start: moment(schedule_time.start, 'HH:mm'),
                    end: moment(schedule_time.end, 'HH:mm')
                });
            }
        }
    
        // Sort allTimes by start time for easier processing
        allTimes.sort((a, b) => a.start - b.start);
    
        // Filtering criteria
        for (const entry of allTimes) {
            const { day, start, end } = entry;
    
            // Check overlaps with lunch time
            if (config.lunch_time.start !== '00:00' && config.lunch_time.end !== '00:00') {
                const lunchStart = moment(config.lunch_time.start, 'HH:mm');
                const lunchEnd = moment(config.lunch_time.end, 'HH:mm');
                if (start.isBefore(lunchEnd) && end.isAfter(lunchStart)) {
                    c.scoreDetails.lunch_time.push(day);
                    score -= 1;
                }
            }
    
            // Check overlaps with free days
            if (config.free_days.includes(day)) {
                c.scoreDetails.free_days.push(day);
                score -= 2;
            }
    
            // Check overlaps with range
            const rangeStart = moment(config.range.start, 'HH:mm');
            const rangeEnd = moment(config.range.end, 'HH:mm');
            if (start.isBefore(rangeStart) || end.isAfter(rangeEnd)) {
                c.scoreDetails.range.push(day);
                score -= 3;
            }
        }
    
        // Additional filtering by day
        const days = {};
    
        // Group times by day to check day-specific constraints
        for (const entry of allTimes) {
            const { day, start, end } = entry;
            if (!days[day]) days[day] = [];
            days[day].push({ start, end });
        }
    
        Object.keys(days).forEach(day => {
            const times = days[day];
    
            // Sort times by start time to check for overlaps
            times.sort((a, b) => a.start - b.start);
    
            // Check for overlapping times within the same day
            for (let i = 1; i < times.length; i++) {
                const previousEnd = times[i - 1].end;
                const currentStart = times[i].start;
                if (currentStart.isBefore(previousEnd)) {
                    c.scoreDetails.overlap.push(day);
                    score -= 20;
                    break; // Only penalize once per overlap occurrence
                }
            }
    
            // Check max courses per day
            if (config.max_courses_per_day !== -1 && times.length > config.max_courses_per_day) {
                c.scoreDetails.max_courses_per_day.push(day);
                score -= 20;
            }
    
            // Calculate holes and check max holes per day
            const holes = [];
            for (let i = 1; i < times.length; i++) {
                const previousEnd = times[i - 1].end;
                const currentStart = times[i].start;
                if (currentStart.isAfter(previousEnd)) {
                    holes.push(currentStart.diff(previousEnd, 'minutes'));
                }
            }
            if (config.max_holes_per_day !== -1 && holes.length > config.max_holes_per_day) {
                c.scoreDetails.max_holes_per_day.push(day);
                score -= 10;
            }
        });
    
        return score;
    }
    



}

// module.exports = { Combination };