// const { instruction } = require('./js/instruction');
// const { course, group, schedule } = require('./js/course');

// const path = require('path');
//  const fs = require('fs');

// const { Calendar } = require('fullcalendar');

// const Swal = require('sweetalert2');
// const moment = require('moment');
// const { get } = require('http');

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
        const courses = selected_university.courses;
        if (courses.length === 0) {
            Swal.fire('No hay cursos seleccionados');
            return;
        }
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
            }
        })
    });
}

document.addEventListener('DOMContentLoaded', function () {
    // Populate the selector of universities
    populateUniversitySelector();

    // Add event listeners to the university UI
    addListenersToUniversityUI();

    // Add event listeners to the combination UI
    addListenersToCombinationUI();
});