const universitiesPath = `${location.pathname.startsWith('/html/') ? '../' : ''}assets/universities`;

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

    const manualUniversities = localStorage.getItem('manualUniversities');
    if (manualUniversities) {
        JSON.parse(manualUniversities).forEach(id => {
            universityPromises.push(new university(id, [], '', true));
        });
    }

    cachedUniversities = await Promise.all(universityPromises); // Wait for all promises

    if (manualUniversities) {
        JSON.parse(manualUniversities).forEach(id => {
            university.fromJSON(JSON.parse(localStorage.getItem(id)))
        });
    }
    return cachedUniversities;
}

function manualAddUniversity() {
    Swal.fire({
        title: 'Agregar universidad',
        html: `
        <input id="universityName" class="swal2-input" placeholder="Nombre de la universidad">
        <input id="universityID" class="swal2-input" placeholder="ID de la universidad">
        `,
        showCancelButton: true,
        confirmButtonText: 'Agregar',
        preConfirm: () => {
            const name = document.getElementById('universityName').value;
            const id = document.getElementById('universityID').value;
            if (name === '' || id === '') {
                Swal.showValidationMessage('Por favor, llene todos los campos');
            }
            else if (/[^a-zA-Z0-9]/.test(id)) {
                Swal.showValidationMessage('El ID de la universidad solo puede contener letras y números');
            }
            else if (cachedUniversities.some(u => u.id == id)) {
                Swal.showValidationMessage('Ya existe una universidad con ese ID');
            }
            else new university(id, [], name, true).then(u => {
                cachedUniversities.push(u);
                populateUniversitySelector();
            });
        }
    })
}

function manualAddCourse() {
    if (!selected_university) {
        Swal.fire('Seleccione una universidad');
        return;
    }
    Swal.fire({
        title: 'Agregar curso',
        html: `
        <input id="courseName" class="swal2-input" placeholder="Nombre del curso">
        <input id="courseID" class="swal2-input" placeholder="ID del curso">
        <input id="courseCredits" class="swal2-input" placeholder="Créditos del curso">
        `,
        showCancelButton: true,
        confirmButtonText: 'Agregar',
        preConfirm: () => {
            const name = document.getElementById('courseName').value;
            const id = document.getElementById('courseID').value;
            const credits = document.getElementById('courseCredits').value;
            if (name === '' || id === '') {
                Swal.showValidationMessage('Por favor, llene todos los campos');
            }
            else if (selected_university.courses.some(c => c.course_id == id)) {
                Swal.showValidationMessage('Ya existe un curso con ese ID');
            }
            else selected_university.addCourse(new course(name, id, credits));
        }
    })
}

function manualAddGroup(course_id) {
    if (!selected_university) {
        Swal.fire('Seleccione una universidad');
        return;
    }
    if (!course_id) {
        Swal.fire('Seleccione un curso');
        return;
    }
    const c = selected_university.getCourse(course_id);
    if (!c) {
        Swal.fire('Seleccione un curso válido');
        return;
    }
    Swal.fire({
        title: 'Agregar grupo',
        html: `
        <input id="groupID" class="swal2-input" placeholder="ID del grupo*">
        <input id="groupTeacher" class="swal2-input" placeholder="Profesor del grupo">
        <input id="groupQuota" class="swal2-input" placeholder="Cupo del grupo*">
        <input id="groupClassroom" class="swal2-input" placeholder="Salón del grupo">
        `,
        showCancelButton: true,
        confirmButtonText: 'Agregar',
        preConfirm: () => {
            const id = document.getElementById('groupID').value;
            const teacher = document.getElementById('groupTeacher').value;
            const quota = document.getElementById('groupQuota').value;
            const classroom = document.getElementById('groupClassroom').value;
            if (id === '' || quota === '') {
                Swal.showValidationMessage('Por favor, llene los campos obligatorios');
            }
            else if (c.course_groups.some(g => g.group_id == id)) {
                Swal.showValidationMessage('Ya existe un grupo con ese ID');
            }
            else c.addGroup(new group(course_id, id, teacher, quota, classroom), true);
        }
    })
}

function manualAddSchedule(group_id, course_id) {
    if (!selected_university) {
        Swal.fire('Seleccione una universidad');
        return;
    }
    if (!course_id) {
        Swal.fire('Seleccione un curso');
        return;
    }
    const c = selected_university.getCourse(course_id);
    if (!c) {
        Swal.fire('Seleccione un curso válido');
        return;
    }
    if (!group_id) {
        Swal.fire('Seleccione un grupo');
        return;
    }
    const g = c.getGroup(group_id);
    if (!g) {
        Swal.fire('Seleccione un grupo válido');
        return;
    }
    Swal.fire({
        title: 'Agregar horario',
        html: `
        <div>
            <select id="scheduleDay" class="swal2-input">
                <option value="" disabled selected>Día del horario*</option>
                <option value="1">Lunes</option>
                <option value="2">Martes</option>
                <option value="3">Miércoles</option>
                <option value="4">Jueves</option>
                <option value="5">Viernes</option>
                <option value="6">Sábado</option>
                <option value="0">Domingo</option>
            </select>
        </div>
        
        <div>
            <input type="time" id="scheduleStart" class="swal2-input" placeholder="Hora de inicio*">
            <input type="time" id="scheduleEnd" class="swal2-input" placeholder="Hora de fin*">
        </div>

        <div>
            <input type="date" id="scheduleStartDate" class="swal2-input" placeholder="Fecha de inicio*">
            <input type="date" id="scheduleEndDate" class="swal2-input" placeholder="Fecha de fin*">
        </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Agregar',
        preConfirm: () => {
            const day = document.getElementById('scheduleDay').value;
            const start = document.getElementById('scheduleStart').value;
            const end = document.getElementById('scheduleEnd').value;
            const dateFormat = 'AAAA-MM-DD';
            const startDate = document.getElementById('scheduleStartDate').value;
            const endDate = document.getElementById('scheduleEndDate').value;
            if (day === '' || start === '' || end === '' || dateFormat === '' || startDate === '' || endDate === '') {
                Swal.showValidationMessage('Por favor, llene los campos obligatorios');
            }
            else g.addSchedule(new schedule(days[day], { 'start': start, 'end': end }, 'HH:mm', { 'start': startDate, 'end': endDate }, dateFormat));
        }
    })
}

async function populateUniversitySelector() {
    const universities = await getUniversities();
    const selector = document.getElementById('university_selector');
    if (universities.length === 0) return;
    universities.map(u => Array.from(selector.children).some(o => o.value == u.id) ? null : u).forEach(element => {
        if (!element) return;
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
    if (selected_university && selected_university.courses.length == 0) {
        const json = localStorage.getItem(selected_university.id);
        if (json) university.fromJSON(JSON.parse(json));
    }
    cleanCourseList();
    if (typeof mainCalendar != 'undefined') mainCalendar.getEvents().forEach(e => e.remove());
    if (selected_university) {
        selected_university.populateCourseList();
        loadBackgroundEvents();
    }
    if (selected_university && typeof mainCalendar != 'undefined') selected_university.courses.forEach(c => updateCalendarEvent(c));
    if (typeof planner_on_university_change === 'function') planner_on_university_change();
}

function cleanCourseList() {
    const list = document.getElementById('courseList');
    if (list) list.innerHTML = '';
}

class university {
    constructor(id, courses = [], name = '', isManual = false) {
        this.id = id.split('.')[0];
        this.courses = courses;
        this.combinations = [];
        this.actualCombination = 0;
        this.actual_configuration = Object.assign({}, default_combination_configurations);

        if (isManual) this.name = name;
        this.isManual = isManual;

        // Return a promise that resolves when the name is set
        return this.initialize(id, isManual);
    }

    async initialize(id, isManual = false) {
        if (!isManual) {
            const conf = await handleConfig(universitiesPath, id);
            this.name = conf.name;
            this.instructions = conf.instructions;
        }
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

        if (json.configuration) u.actual_configuration = json.configuration;
        if (json.name) u.name = json.name;

        json.courses.forEach(_c => {
            const gE = []
            _c.course_groups.forEach(c => {
                const dE = []
                c.schedule.forEach(d => {
                    dE.push(new schedule(d.schedule_day, { 'start': d.schedule_time.start, 'end': d.schedule_time.end }, d.schedule_time_format, { 'start': d.date.start, 'end': d.date.end }, d.date_format));
                });
                gE.push(new group(c.parent_course_id, c.group_id, c.course_teacher, c.group_quota, c.classroom, dE));
            });
            u.addCourse(new course(_c.course_name, _c.course_id, _c.course_credits, gE, _c.requirements));
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
            name: this.name,
            requirements: this.requirements,
            configuration: this.actual_configuration,
            courses: this.courses
        });
    }

    populateCourseList() {
        cleanCourseList();
        this.courses.forEach(c => {
            this.addCourseToLi(c);
        });
    }

    cleanCourseList() {
        const list = document.getElementById('courseList');
        list.innerHTML = '';
    }

    addCourseToLi(c) {
        if (!selected_university) return;
        const list = document.getElementById('courseList');
        if (!list) return;
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
                        c.course_groups.forEach(g => g.disableGroup(true));
                        e.onclick = () => {
                            if (DEBUG) console.log(e)
                            const g = c.getGroup(e.getAttribute('group-id'));
                            if (g) g.disableGroup();
                        };
                    });
                }
            }).then((result) => {
                li.style.backgroundColor = (c.isDisabled()) ? '#808080' : c.color;
            });
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

    removeCourse(course_id) {
        this.courses = this.courses.filter(c => c.course_id != course_id);
        this.populateCourseList();
    }

    cleanCombinations() {
        this.combinations = [];
    }

    goToCombination(index) {
        if (!mainCalendar) return;
        index = (index < 0) ? this.combinations.length - 1 : (index > this.combinations.length - 1) ? 0 : index;
        document.getElementById('combinationCounter').innerText = `${index + 1}/${this.combinations.length}`;
        const c = this.combinations[index];
        this.actualCombination = index;

        // Clear existing events
        this.allEvents.forEach(e => (e.display !== 'background') ? e.remove() : null);
        this.allEvents = [];

        // Add new events for the selected combination
        if (c === undefined) return;
        c.groups.forEach(g => {
            const calendarEvents = getCalendarEventsByGroupID(g.group_id, g.parent_course_id);

            calendarEvents.forEach(e => {
                const newEvent = mainCalendar.addEvent(e);
                console.log('newEvent:', newEvent)
                this.allEvents.push(newEvent);
            });
        });
        fixCalendar();
    }


    allEvents = []

    cachedCalendarEvents = [];
    actual_configuration = {};

    name;
    id;
    instructions = [];
    courses = [];
}