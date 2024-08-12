function changeGroupColor(course_id, color) {
    var c = course.fromID(course_id);
    c.color = color;
    Array.from(document.getElementsByClassName('course')).filter(a => a.getAttribute('course-id') == course_id)[0].parentElement.style.backgroundColor = color;
    updateCalendarEvent(c);
    selected_university.goToCombination(selected_university.actualCombination);
}

function deleteCourse(course_id) {
    selected_university.removeCourse(course_id);
    if (typeof mainCalendar != 'undefined')
        mainCalendar.getEvents().forEach(e => {
            if (e._def.publicId == course_id)
                e.remove();
        });
    selected_university.cleanCombinations();
    Array.from(document.getElementsByClassName('course')).filter(c => c.getAttribute('course-id') == course_id).forEach(cE => cE.remove());
    saveInLocalStorage(true);
}

class course {
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

    constructor(course_name = "", course_id = "", course_credits = 0, course_groups = [], requirements = {}) {
        this.course_name = course_name;
        this.course_id = course_id;
        this.course_credits = course_credits;
        this.course_groups = course_groups;
        this.color = randomColor();
        this.requirements = requirements;
    }

    static getAsHTML(c, color_palete = false) {
        return `<div class="course" course-name="${c.course_name}" course-id="${c.course_id}" course-credits="${c.course_credits}">
            <div class="courseDescription">
                <div class="courseName">${c.course_name}</div>
                <div class="courseId">${c.course_id}</div>
                ${c.course_credits ? `<div class="courseCredits">Creditos: ${c.course_credits}</div>` : ''}
                ${color_palete ? `<div class="courseColor">
                    <input type="color" class="courseColorPalete" value="${c.color}" onchange="changeGroupColor('${c.course_id}', event.target.value)"></input>
                    <button onclick="changeGroupColor('${c.course_id}', randomColor())"><i class="fas"></i></button></div>` : ''}
                ${color_palete ? `<div>
                        <button onclick="deleteCourse('${c.course_id}')">
                            <i class="fas solid fa-user-minus"></i>
                        </button>
                        <button onclick="manualAddGroup('${c.course_id}')">
                            <i class="fas solid fa-user-plus"></i>
                        </button>
                    </div>` : ''}
                
                <ul class="courseGroups">
                    ${c.course_groups.map(g => group.getAsHTML(g)).join('')}
                </ul>
            </div>
        </div>`;
    }

    static fromID(id) {
        return selected_university.getCourse(id);
    }

    static fromHTML(html) {
        var id = html.getAttribute('course-id');
        if (!id) {
            const a = Array.from(html.getElementsByClassName('course'));
            if (a) id = a.find(c => c.getAttribute('course-id')).getAttribute('course-id');
        }
        if (!id) throw new Error('No course id found for: ' + html);
        return selected_university.getCourse(id);
    }

    addGroup(group, isManual = false) {
        if (!isManual && group.schedule.length == 0) {
            console.log('Empty group detected: ', group);
            return;
        }
        group.parent_course_id = this.course_id;
        this.course_groups.push(group);
        updateCalendarEvent(this);
    }

    getGroup(group_id) {
        return this.course_groups.find(g => g.group_id == group_id);
    }

    parseVariables(variables) {
        const remaining = variables.filter(v => !course.defaultVariables.hasOwnProperty(v.name));
        variables.forEach(v => {
            if (course.defaultVariables.hasOwnProperty(v.name)) {
                course.defaultVariables[v.name](this, v.value);
            } else if (v.name.includes("group_")) {
                const g = new group();
                g.parseVariables(v.value);
                this.addGroup(g);
            }
        });
        this.requirements = variables['requirements'];
        return remaining;
    }
}

function deleteGroup(group_id, parent_id) {
    const course = selected_university.getCourse(parent_id);
    course.course_groups = course.course_groups.filter(g => g.group_id != group_id);
    if (typeof mainCalendar != 'undefined')
        mainCalendar.getEvents().forEach(e => {
            if (e._def.publicId == parent_id && e._def.groupId == group_id)
                e.remove();
        });
    Array.from(document.getElementsByClassName('group')).filter(c => c.getAttribute('group-id') == group_id).forEach(cE => cE.remove());
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

    getColor() {
        return this.disabled ? '#808080' : getComputedStyle(document.querySelector(':root')).getPropertyValue('--settings-bg-color');
    }

    disableGroup(dontChange = false) {
        if (!dontChange) this.disabled = !this.disabled;
        const setBackgroundColor = (e) => {
            e.style.backgroundColor = this.getColor();
            Array.from(e.children).forEach(child => {
                setBackgroundColor(child);
            });
        }

        Array.from(document.getElementsByClassName('group')).filter(c => c.getAttribute('group-id') == this.group_id).forEach(gE => {
            setBackgroundColor(gE);
        });
    }

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

    static getAsHTML(g) {
        return `<li class="group" parent-course-id="${g.parent_course_id}" group-id="${g.group_id}" course-teacher="${g.course_teacher}" group-quota="${g.group_quota}" group-classroom="${g.group_classroom}">
            <div class="groupDescription">
                ${g.group_id ? `<div class="group_id">Grupo: ${g.group_id}</div>` : ''}
                ${g.group_quota >= 0 ? `<div class="groupQuota">Cupos: ${g.group_quota}</div>` : ''}
                <div>
                    <div>
                        <button onclick="deleteGroup('${g.group_id}', '${g.parent_course_id}')">
                            <i class="fas"></i>
                        </button>
                        <button onclick="manualAddSchedule('${g.group_id}', '${g.parent_course_id}')">
                            <i class="fas regular fa-calendar-plus"></i>
                        </button>
                    </div>
                </div>
                <ul class="groupSchedules">
                    ${g.schedule.map(s => schedule.getAsHTML(s)).join('')}
                </ul>
            </div>
        </li>`;
    }
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


    static getAsHTML(s) {
        return `<li class="schedule">
            <div class="scheduleDescription" schedule-day="${s.schedule_day}" schedule-time="${s.schedule_time.start}-${s.schedule_time.end}" schedule-time-format="${s.schedule_time_format}" schedule-date="${s.date.start}-${s.date.end}" schedule-date-format="${s.date_format}">
                <div class="scheduleDay">${translateDay(s.schedule_day)}</div>
                <div class="scheduleTime">${s.schedule_time.start} - ${s.schedule_time.end}</div>
                ${s.date ? `<div class="groupDate">Fecha: ${moment(s.date.start, s.date_format).format('DD/MM/YYYY')} - ${moment(s.date.end, s.date_format).format('DD/MM/YYYY')}</div>` : ''}
            </div>
        </li>`;
    }
}