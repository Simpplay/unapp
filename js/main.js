const DEBUG = false;

// Synchronously read a text file from the web server
// From: https://stackoverflow.com/a/41133213
async function loadFile(filePath) {
    var result = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filePath, false);
    xmlhttp.send();
    if (xmlhttp.status == 200) {
        result = xmlhttp.responseText;
    }
    return result;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function saveFile(content, file_name) {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = file_name;
    element.click();
}

function getContrast(hexcolor) {
    var r = parseInt(hexcolor.substring(1, 3), 16);
    var g = parseInt(hexcolor.substring(3, 5), 16);
    var b = parseInt(hexcolor.substring(5, 7), 16);
    const brightness = Math.round(((parseInt(r) * 299) + (parseInt(g) * 587) + (parseInt(b) * 114)) / 1000);
    return (brightness > 125) ? 'black' : 'white';
}

async function askForFile() {
    var input = document.createElement('input');
    input.type = 'file';

    return new Promise((resolve, reject) => {
        input.onchange = e => {
            // getting a hold of the file reference
            var file = e.target.files[0];
            // setting up the reader
            var reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            // here we tell the reader what to do when it's done reading...
            reader.onload = readerEvent => {
                var content = readerEvent.target.result; // this is the content!
                resolve(content);
            }
        }
        input.click();
    });
}

loadHeader();

function addListenersToUniversityUI() {
    // Event listener for the submit button
    document.getElementById('submitBtn').addEventListener('click', () => {
        const inputBox = inputValue = document.getElementById('textInput');
        var inputValue = inputBox.value;
        const displayMessage = addCourse(inputValue);
        inputBox.value = '';
        if (displayMessage) {
            Swal.fire(displayMessage);
        }
    });

    // Event listener for the save button
    document.getElementById('saveBtn').addEventListener('click', () => {
        if (!selected_university) {
            Swal.fire('No university selected');
            return;
        }
        saveFile(selected_university.getAsJSON(), selected_university.id + '.json');
    });

    // Event listener for the load button
    document.getElementById('loadBtn').addEventListener('click', async () => {
        if (!selected_university) {
            Swal.fire('No university selected');
            return;
        }
        askForFile().then((file) => {
            Swal.fire(university.fromJSON(JSON.parse(file)));
        });
    });
}

function addListenersToCombinationUI() {
    document.getElementById('generateCombination').addEventListener('click', () => {
        if (!selected_university) {
            Swal.fire('Seleccione una universidad');
            return;
        }
        var courses = selected_university.courses;
        if (courses.length === 0) {
            Swal.fire('No hay cursos disponibles');
            return;
        }
        courses = courses.filter(c => !c.isDisabled())
        const combinations = Combination.generateCombinationsFromCourses(courses, selected_university.actual_configuration);
        if (combinations.length === 0) {
            Swal.fire('No hay combinaciones validas');
            return;
        }
        Swal.fire({
            title: `Se han generado ${combinations.length} combinaciones validas`,
            confirmButtonText: 'Close',
            icon: 'success'
        });
        selected_university.combinations = combinations;
        selected_university.goToCombination(0);
    });

    document.getElementById('deleteCombinations').addEventListener('click', () => {
        if (!selected_university) {
            Swal.fire('Seleccione una universidad');
            return;
        }
        if (selected_university.courses.length === 0) {
            Swal.fire('No hay grupos para borrar');
            return;
        }
        Swal.fire({
            title: '¿Está seguro que desea eliminar todos los grupos?',
            showCancelButton: true,
            confirmButtonText: 'Si',
            cancelButtonText: 'No',
            icon: 'warning'
        }).then((result) => {
            if (result.isConfirmed) {
                selected_university.courses.forEach(c => {
                    deleteCourse(c.course_id);
                })
                Swal.fire('Grupos eliminados', '', 'success');
            }
        });
    });


    function handleCombinationNavigation(action) {
        if (!selected_university) {
            Swal.fire('Seleccione una universidad');
            return;
        }
        if (selected_university.combinations.length === 0) {
            Swal.fire('No hay combinaciones generadas');
            return;
        }
        selected_university.goToCombination(selected_university.actualCombination + action);
    }

    document.getElementById('nextCombination').addEventListener('click', () => {
        handleCombinationNavigation(1);
    });

    document.getElementById('prevCombination').addEventListener('click', () => {
        handleCombinationNavigation(-1);
    });

    document.getElementById('combinationSettings').addEventListener('click', () => {
        if (!selected_university) {
            Swal.fire('Seleccione una universidad');
            return;
        }
        Swal.fire({
            title: 'Configuración de la combinación',
            showCloseButton: true,
            html: getCombinationSettingsHTML(selected_university.actual_configuration),
            willClose: () => {
                if (DEBUG) console.log(selected_university.actual_configuration)
                loadBackgroundEvents();
            }
        })
    });
}

function saveInLocalStorage(force) {
    if (!cachedUniversities || cachedUniversities.length == 0) return;
    const manualUniversities = [];
    cachedUniversities.forEach(u => {
        if (u.courses.length === 0 && !force) return;
        if (u.isManual) manualUniversities.push(u.id);
        localStorage.setItem(u.id, u.getAsJSON());
    });
    localStorage.setItem('manualUniversities', JSON.stringify(manualUniversities));
}

document.addEventListener('DOMContentLoaded', function () {
    // Populate the selector of universities
    if (document.getElementsByClassName('un-selector').length > 0) populateUniversitySelector();

    // Add event listeners to the university UI
    addListenersToUniversityUI();

    // Add event listeners to the combination UI
    if (document.getElementsByClassName('combinationContainer').length > 0) addListenersToCombinationUI();
});


window.addEventListener('beforeunload', function (e) {
    // Save the universities in the local storage before leaving the page
    saveInLocalStorage(false);
});


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

function dayIntFromSunday(schedule_day) {
    if (typeof schedule_day !== 'string') {
        console.error('Invalid schedule_day:', schedule_day);
        return null; // or some other appropriate default
    }
    // Return the corresponding integer for the given schedule_day
    return daysOfWeek[schedule_day.toLowerCase()];
}

function translateDay(schedule_day) {
    // Return the corresponding translation for the given schedule_day
    return daysTranslated[schedule_day.toLowerCase()];
}

function newUUID() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}