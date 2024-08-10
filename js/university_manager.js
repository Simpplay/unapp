const universitiesPath = 'assets/universities';

var cachedUniversities = null;

async function getUniversities() {
    if (cachedUniversities && cachedUniversities.length > 0) return cachedUniversities;
    cachedUniversities = [];

    // TODO: Patch for read all the files in universitiesPath directory and iterate over them

    const files = ['unal.unapp', 'funlam.unapp', 'udea.unapp'];
    const universityPromises = files.map(file => {
        if (file.endsWith('.unapp')) {
            return new university(file); // Return the promise from the constructor
        }
    });

    cachedUniversities = await Promise.all(universityPromises); // Wait for all promises
    return cachedUniversities;
}

async function populateUniversitySelector() {
    const universities = await getUniversities();
    const selector = document.getElementById('university_selector');
    if (universities.length === 0) return;
    universities.forEach(element => {
        const option = document.createElement("option");
        option.value = element.id;
        option.text = element.name;
        selector.appendChild(option);
    });
}

function getUniversityById(id) {
    if (!cachedUniversities) return null;
    return cachedUniversities.find(u => u.id == id);
}

var selected_university = null;

async function onUniversitySelected() {
    const universities = await getUniversities();
    const selector = document.getElementById('university_selector');
    selected_university = universities.find(u => u.id === selector.value);
    cleanCourseList();
    mainCalendar.getEvents().forEach(e => e.remove());
    if (selected_university) selected_university.populateCourseList();
}

function cleanCourseList() {
    const list = document.getElementById('courseList');
    list.innerHTML = '';
}

class university {
    constructor(id, courses = []) {
        this.id = id.split('.')[0];
        this.courses = courses;
        this.combinations = [];
        this.actualCombination = 0;
        this.actual_configuration = Object.assign({}, default_combination_configurations);

        // Return a promise that resolves when the name is set
        return this.initialize(id);
    }

    async initialize(id) {
        const conf = await handleConfig(universitiesPath, id);
        this.name = conf.name;
        this.instructions = conf.instructions;
        this.populateCourseList();
        return this; // Return the university instance after initialization
    }

    static fromJSON(json) {
        const u = getUniversityById(json.id);
        if (!u) {
            return {
                title: 'Error',
                text: 'No se ha podido cargar la universidad',
                icon: 'error',
                confirmButtonText: 'Continuar'
            }
        }

        if (u.id !== selected_university.id) {
            return {
                title: 'Error',
                text: 'La universidad no coincide con la seleccionada',
                icon: 'error',
                confirmButtonText: 'Continuar'
            }
        }

        if (json.configuration) u.actual_configuration = json.configuration;

        json.courses.forEach(_c => {
            const gE = []
            _c.course_groups.forEach(c => {
                const dE = []
                c.schedule.forEach(d => {
                    dE.push(new schedule(d.schedule_day, { 'start': d.schedule_time.start, 'end': d.schedule_time.end }, d.schedule_time_format, { 'start': d.date.start, 'end': d.date.end }, d.date_format));
                });
                gE.push(new group(c.parent_course_id, c.group_id, c.course_teacher, c.group_quota, c.classroom, dE));
            });
            u.addCourse(new course(_c.course_name, _c.course_id, _c.course_credits, gE));
            updateCalendarEvent(_c);
        });

        return {
            title: u.name,
            text: 'Se ha cargado la universidad correctamente',
            icon: 'success',
            confirmButtonText: 'Continuar'
        }
    }

    getAsJSON() {
        return JSON.stringify({
            id: this.id,
            configuration: this.actual_configuration,
            courses: this.courses
        });
    }

    populateCourseList() {
        this.courses.forEach(c => {
            this.addCourseToLi(c);
        });
    }

    addCourseToLi(c) {
        const list = document.getElementById('courseList');
        const li = document.createElement('li');

        li.innerHTML = course.getAsHTML(c);
        li.style.backgroundColor = c.color;
        li.style.color = getContrast(c.color);
        li.getElementsByClassName('courseGroups')[0].hidden = true;

        li.onclick = () => {
            const c = course.fromHTML(li);
            if (DEBUG) console.log(c);
            Swal.fire({
                title: c.course_name,
                html: course.getAsHTML(c, true),
                showCloseButton: true,
                didOpen: () => {
                    Array.from(document.getElementsByClassName('group')).forEach(e => {
                        e.onclick = () => {
                            if (DEBUG) console.log(e)
                            const calendarEvents = getCalendarEventsByGroupID(e.getAttribute('group-id'), c.course_id);
                            calendarEvents.forEach(e => {
                                const newEvent = mainCalendar.addEvent(e);
                                this.allEvents.push(newEvent);
                            });
                        };
                    });
                }
            })
        }

        list.appendChild(li);
    }

    addCourse(c) {
        if (!(c instanceof course))
            return {
                title: 'Error',
                text: 'No se ha podido añadir el curso',
                icon: 'error',
                confirmButtonText: 'Continuar'
            }
        if (c.course_name === "" && c.course_id === "") {
            return {
                title: 'Error',
                text: 'El curso no tiene nombre ni ID',
                icon: 'warning',
                confirmButtonText: 'Continuar'
            }
        }
        if (this.courses.some(d => d.course_id == c.course_id)) {
            return {
                title: 'Error',
                text: 'Ya existe un curso con ese ID',
                icon: 'warning',
                confirmButtonText: 'Continuar'
            }
        }

        this.courses.push(c);
        this.addCourseToLi(c);
        return {
            title: c.course_name,
            text: 'Se ha añadido el curso correctamente',
            icon: 'success',
            confirmButtonText: 'Continuar'
        }
    }

    getCourse(course_id) {
        return this.courses.find(c => c.course_id == course_id);
    }

    goToCombination(index) {
        index = (index < 0) ? this.combinations.length - 1 : (index > this.combinations.length - 1) ? 0 : index;
        document.getElementById('combinationCounter').innerText = `${index + 1}/${this.combinations.length}`;
        const c = this.combinations[index];
        this.actualCombination = index;

        // Clear existing events
        this.allEvents.forEach(e => e.remove());
        this.allEvents = [];
        // mainCalendar.getEvents().forEach(e => e.remove());

        // Add new events for the selected combination
        c.groups.forEach(g => {
            const calendarEvents = getCalendarEventsByGroupID(g.group_id, g.parent_course_id);
            calendarEvents.forEach(e => {
                const newEvent = mainCalendar.addEvent(e);
                this.allEvents.push(newEvent);
            });
        });

        // Set calendar date to the first event date
        const cE = moment(getCalendarEvents()[0][0].startRecur);
        cE.add(10, 'days');
        mainCalendar.gotoDate(cE.format());
    }


    allEvents = []

    cachedCalendarEvents = [];
    actual_configuration = {};

    name;
    id;
    instructions = [];
    courses = [];
}