var mainCalendar = null;

document.addEventListener('DOMContentLoaded', function () {
  var calendars = document.getElementsByClassName('calendar');
  mainCalendar = new FullCalendar.Calendar(calendars[0], {
    initialView: 'timeGridWeek',
    allDaySlot: false,
    firstDay: 1,
    locale: 'es',
    headerToolbar: {
      start: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
    },
    footerToolbar: {
      left: 'fix download addManualEvent',
      right: 'prev,next today'
    },
    selectable: true,
    selectMinDistance: 1,
    unselectAuto: false,
    selectMirror: false,
    dayMaxEvents: true, // allow "more" link when too many events,
    eventClick: function (info) {
      if (info.event.display == 'background') {
        last_clicked_event = info;
        showFreeTimeOptions(info.jsEvent.clientX, info.jsEvent.clientY);
      } else {
        const c = selected_university.getCourse(info.event.id);
        const g = c.getGroup(info.event.groupId);
        Swal.fire({
          title: info.event.title,
          html: `
            ${info.event.id ? `<p>ID: ${info.event.id}</p>` : ''}
            ${g.course_teacher ? `<p>Profesor: ${g.course_teacher}</p>` : ''}
            ${g.classroom ? `<p>Salón: ${g.classroom}</p>` : ''}
            ${info.event.start ? `<p>Inicio: ${moment(info.event.start).format('DD/MM/YYYY HH:mm')}</p>` : ''}
            ${info.event.end ? `<p>Fin: ${moment(info.event.end).format('DD/MM/YYYY HH:mm')}</p>` : ''}
          `,
          showCloseButton: true
        });
      }
    },
    select: function (info) {
      if (typeof selected_university == 'undefined' || !selected_university) {
        mainCalendar.unselect()
        return;
      }

      loadBackgroundEvents();
      showFreeTimeOptions(info.jsEvent.clientX, info.jsEvent.clientY);
      last_event_selected = info;
    },
  });
  mainCalendar.render();

  // Add fix button
  const fixButton = document.getElementsByClassName('fc-fix-button')[0];
  const fixIcon = document.createElement('i');
  fixIcon.className = 'fas sharp';
  fixIcon.innerHTML = '';
  fixButton.appendChild(fixIcon);
  fixButton.onclick = () => {
    fixCalendar();
  };

  // Add add event button
  const addEventButton = document.getElementsByClassName('fc-addManualEvent-button')[0];
  addEventButton.onclick = () => {
    addAction();
  }
  const addEventIcon = document.createElement('i');
  addEventIcon.className = 'fas solid';
  addEventIcon.innerHTML = '';
  addEventButton.appendChild(addEventIcon);

  // Add download button
  const downloadButton = document.getElementsByClassName('fc-download-button')[0];
  const downloadIcon = document.createElement('i');
  downloadIcon.className = 'fas solid fa-image';
  downloadButton.appendChild(downloadIcon);
  downloadButton.onclick = () => {
    const calendarEvents = mainCalendar.getEvents();
    if (calendarEvents.length === 0) {
      Swal.fire('No hay elementos en el calendario');
      return;
    }

    const calendarContainer = document.querySelector('.calendarContainer');
    const originalStyles = {
      position: calendarContainer.style.position,
      top: calendarContainer.style.top,
      left: calendarContainer.style.left,
      width: calendarContainer.style.width,
      height: calendarContainer.style.height,
      zIndex: calendarContainer.style.zIndex
    };

    // Set the container to full screen
    calendarContainer.style.position = 'fixed';
    calendarContainer.style.top = '0';
    calendarContainer.style.left = '0';
    calendarContainer.style.width = '100vw';
    calendarContainer.style.height = '100vh';
    calendarContainer.style.zIndex = '9999';  // Ensure it's on top


    // Get the minimum time based on the events
    let minTime = '24:00:00'; // Start with the latest possible time
    calendarEvents.forEach(event => {
      const eventStart = event.start;
      const eventStartTime = moment(eventStart).add(-1, 'hour').format('HH:mm:ss'); // Format as 'HH:mm:ss'

      if (eventStartTime < minTime) {
        minTime = eventStartTime;
      }
    });
    mainCalendar.setOption('slotMinTime', minTime);

    mainCalendar.updateSize();

    // Wait a moment to ensure styles are applied
    setTimeout(() => {
      domtoimage.toPng(document.querySelector('.fc-view'))
        .then(function (dataUrl) {
          // Revert the container to its original styles
          Object.assign(calendarContainer.style, originalStyles);
          mainCalendar.setOption('slotMinTime', '00:00:00');
          mainCalendar.updateSize();

          // Uncomment the following lines if you want to download the image directly
          const link = document.createElement('a');
          link.download = 'calendario.png';
          link.href = dataUrl;
          link.click();
        })
        .catch(function (error) {
          console.error('Error capturando el calendario:', error);
          Swal.fire('Error al capturar el calendario');

          // Revert the container to its original styles even if there's an error
          Object.assign(calendarContainer.style, originalStyles);
        });
    }, 100);  // Adjust the delay as needed to ensure styles are applied
  };
});

function fixCalendar() {
  const calendarEvents = getCalendarEvents();
  if (calendarEvents && calendarEvents.length > 0) {
    calendarEvents.sort((a, b) => {
      return (moment(a[0].startRecur).format('DD') * moment(a[0].startRecur).format('MM')) - (moment(b[0].startRecur).format('DD') * moment(b[0].startRecur).format('MM'));
    });
    const cE = moment(calendarEvents[calendarEvents.length - 1][0].startRecur).add(10, 'days');
    const currentDate = mainCalendar.getDate();
    const diffInDays = Math.abs(cE.diff(currentDate, 'days'));
    if (diffInDays > 10) {
      mainCalendar.gotoDate(cE.format());
    }
  } else {
    Swal.fire('No hay elementos en el calendario');
  }
}

function showFreeTimeOptions(cursorX, cursorY) {
  // Show the popup
  const popup = document.getElementById('event-popup');
  popup.style.display = 'block';

  popup.style.left = (cursorX - (popup.clientWidth / 2)) + 'px';
  popup.style.top = cursorY + 'px';
}

document.addEventListener('DOMContentLoaded', function () {
  const popup = document.getElementById('event-popup');
  document.addEventListener('click', function (event) {
    if (!popup.contains(event.target) && !event.target.className.includes('fc-event')) {
      hideActions();
    }
  });
});

function hideActions() {
  document.getElementById('event-popup').style.display = 'none';
  mainCalendar.unselect();
}

function resetActionVariables() {
  last_event_selected = null;
  last_clicked_event = null;
  hideActions();
}

var last_event_selected = null;
var last_clicked_event = null;

// Add or edit
function addAction() {
  if (!selected_university) return;
  if (!selected_university.actual_configuration['free_time']) {
    selected_university.actual_configuration['free_time'] = [];
  }

  const originalStart = last_event_selected ? moment(last_event_selected.startStr).format('HH:mm') : '00:00';
  const originalEnd = last_event_selected ? moment(last_event_selected.endStr).format('HH:mm') : '00:00';
  const day = last_event_selected ? moment(last_event_selected.startStr).format('d') : '1';
  const free_time = selected_university.actual_configuration['free_time'];
  const index = free_time.findIndex(f => f.start == originalStart && f.end == originalEnd && f.day == day);

  if (index !== -1) {
    Swal.fire('Ya existe este rango de tiempo');
    return;
  }

  Swal.fire({
    title: 'Ingrese los detalles',
    html: `
      <div>
        <label>Nombre:</label>
        <input id="event-name" class="swal2-input" placeholder="Nombre" value="Tiempo Libre">
      </div>
      <div>
        <label>Color:</label>
        <input id="event-color" type="color" class="swal2-input" placeholder="Color">
      </div>
      <div>
        <label>Día:</label>
        <select id="event-day" class="swal2-input">
          <option value="1" ${day == '1' ? 'selected' : ''}>Lunes</option>
          <option value="2" ${day == '2' ? 'selected' : ''}>Martes</option>
          <option value="3" ${day == '3' ? 'selected' : ''}>Miércoles</option>
          <option value="4" ${day == '4' ? 'selected' : ''}>Jueves</option>
          <option value="5" ${day == '5' ? 'selected' : ''}>Viernes</option>
          <option value="6" ${day == '6' ? 'selected' : ''}>Sábado</option>
          <option value="0" ${day == '0' ? 'selected' : ''}>Domingo</option>
        </select>
      </div>
      <div>
        <div>
          <label>Inicio:</label>
          <input id="event-start" type="time" class="swal2-input" value="${originalStart}">
        </div>
        <div>
          <label>Fin:</label>
          <input id="event-end" type="time" class="swal2-input" value="${originalEnd}">
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      const name = document.getElementById('event-name').value || 'Tiempo Libre';
      const color = document.getElementById('event-color').value || '#000000';
      const start = document.getElementById('event-start').value || originalStart;
      const end = document.getElementById('event-end').value || originalEnd;
      const day = document.getElementById('event-day').value || '1';

      return { name, color, start, end, day };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const { name, color, start, end, day } = result.value;

      free_time.push({
        start: start,
        end: end,
        day: day,
        name: name,
        color: color,
        id: newUUID()
      });

      loadBackgroundEvents();
      resetActionVariables();
    }
  });
}


function deleteAction() {
  if (last_clicked_event === null || !selected_university) return;
  last_clicked_event.event.remove();
  selected_university.actual_configuration['free_time'] = selected_university.actual_configuration['free_time'].filter(f => f.id != last_clicked_event.event.id);
  resetActionVariables();
}

function modifyAction() {
  if (!selected_university || !last_clicked_event) return;

  const free_time = selected_university.actual_configuration['free_time'];
  const eventIndex = free_time.findIndex(f => f.id == last_clicked_event.event.id);

  if (eventIndex === -1) {
    Swal.fire('No se encontró el evento seleccionado');
    return;
  }

  const event = free_time[eventIndex];

  Swal.fire({
    title: 'Modificar Evento',
    html: `
      <input id="event-name" class="swal2-input" placeholder="Nombre" value="${event.name}">
      <input id="event-color" type="color" class="swal2-input" value="${event.color}">
      <label>Inicio:</label>
      <input id="event-start" type="time" class="swal2-input" value="${event.start}">
      <label>Fin:</label>
      <input id="event-end" type="time" class="swal2-input" value="${event.end}">
    `,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      const name = document.getElementById('event-name').value || event.name;
      const color = document.getElementById('event-color').value || event.color;
      const start = document.getElementById('event-start').value || event.start;
      const end = document.getElementById('event-end').value || event.end;

      return { name, color, start, end };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const { name, color, start, end } = result.value;

      // Update the event with the new values
      free_time[eventIndex] = {
        ...event,
        name: name,
        color: color,
        start: start,
        end: end
      };

      loadBackgroundEvents();
      resetActionVariables();
    }
  });
}

function loadBackgroundEvents() {
  if (typeof mainCalendar == "undefined" || !selected_university) return;
  mainCalendar.getEvents().forEach(e => {
    if (e.display === 'background') e.remove();
  });

  const businessHours = []

  const range = selected_university.actual_configuration['range'];
  if (range) {
    businessHours.push({
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: range.start,
      endTime: range.end
    })
  }

  const lunch_time = selected_university.actual_configuration['lunch_time'];
  if (lunch_time && (lunch_time.start != '00:00' || lunch_time.end != '00:00')) {
    businessHours.push({
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: lunch_time.start,
      endTime: lunch_time.end
    });
  }

  const splitBusinessHours = (businessHours) => {
    let splitHours = [];

    businessHours.forEach((hours, index) => {
      const startTime = moment(hours.startTime, 'HH:mm');
      const endTime = moment(hours.endTime, 'HH:mm');

      // Handle the first set of business hours
      if (index === 0) {
        splitHours.push(hours);
      } else {
        let lastHours = splitHours[splitHours.length - 1];
        let lastEndTime = moment(lastHours.endTime, 'HH:mm');

        // Check if the current start time is within the last business hour's range
        if (startTime.isBefore(lastEndTime)) {
          // Adjust the last business hour to end where the overlap starts
          lastHours.endTime = startTime.format('HH:mm');

          // Add a new business hour for the remaining time after the overlap
          splitHours.push({
            daysOfWeek: hours.daysOfWeek,
            startTime: endTime.isBefore(lastEndTime) ? endTime.format('HH:mm') : lastEndTime.format('HH:mm'),
            endTime: endTime.isBefore(lastEndTime) ? lastEndTime.format('HH:mm') : endTime.format('HH:mm')
          });
        } else {
          // If there's no overlap, just add the current hours
          splitHours.push(hours);
        }
      }
    });

    return splitHours;
  };

  mainCalendar.setOption('businessHours', splitBusinessHours(businessHours));

  const free_time = selected_university.actual_configuration['free_time'];
  if (free_time && free_time.length > 0) free_time.forEach(f => {
    mainCalendar.addEvent({
      title: f.name,
      daysOfWeek: [f.day],
      startTime: f.start,
      endTime: f.end,
      startRecur: moment().subtract(1, 'y').format(),
      endRecur: moment().add(1, 'y').format(),
      id: f.id,
      groupId: 'manual_event',
      display: 'background',
      backgroundColor: f.color
    });
  });
}

function updateCalendarEvent(c) {
  removeCalendarEventsFromCourse(c);
  loadBackgroundEvents();
  c.course_groups.forEach(g => {
    var groupSchedule = [];
    g.schedule.forEach(s => {
      if (DEBUG) console.log('Adding event:', c.course_id, g.group_id, c.course_name, s.date.start, s.date_format, s.date.end, s.schedule_time.start, s.schedule_time.end, dayIntFromSunday(s.schedule_day));
      groupSchedule.push({
        id: c.course_id,
        groupId: `${g.group_id}`,
        title: c.course_name + ' - ' + g.group_id,
        startRecur: moment(s.date.start, s.date_format).format(),
        endRecur: moment(s.date.end, s.date_format).format(),
        daysOfWeek: [dayIntFromSunday(s.schedule_day)],
        startTime: s.schedule_time.start,
        endTime: s.schedule_time.end,
        editable: false,
        display: 'block',
        color: c.color,
        overlap: true
      });
    });
    selected_university.cachedCalendarEvents.push(groupSchedule);
  });
}

function removeCalendarEventsFromCourse(c) {
  selected_university.cachedCalendarEvents = selected_university.cachedCalendarEvents.filter(d => {
    return d.some(e => {
      return !(e.id == c.course_id)
    });
  });
}

function getCalendarEvents() {
  if (!selected_university) return [];
  if (selected_university.cachedCalendarEvents && selected_university.cachedCalendarEvents.length === 0) return selected_university.cachedCalendarEvents;
  selected_university.courses.forEach(c => {
    updateCalendarEvent(c);
  });
  return selected_university.cachedCalendarEvents;
}

function getCalendarEventsByGroupID(group_id, course_id = null) {
  if (!selected_university.cachedCalendarEvents || selected_university.cachedCalendarEvents.length === 0) {
    console.error('No cached calendar events found');
    return [];
  }

  const groupEvents = [];
  selected_university.cachedCalendarEvents.forEach(groupSchedule => {
    groupSchedule.forEach(event => {
      if (event.groupId == group_id && (course_id === null || event.id == course_id)) {
        groupEvents.push(event);
      }
    });
  });

  return groupEvents;
}