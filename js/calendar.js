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
      left: 'fix',
      right: 'prev,next today'
    },
    dayMaxEvents: true, // allow "more" link when too many events,
    eventClick: function (info) {
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
    },
  });
  mainCalendar.render();

  // Add fix button
  const fixButton = document.getElementsByClassName('fc-fix-button')[0];
  fixButton.textContent = 'Fijar';
  fixButton.onclick = () => {
    const calendarEvents = getCalendarEvents()[0][0];
    const cE = moment(calendarEvents.startRecur);
    cE.add(10, 'days');
    if (calendarEvents) mainCalendar.gotoDate(cE.format());
    else Swal.fire('No hay eventos en el calendario');
  };
});

function updateCalendarEvent(c) {
  removeCalendarEventsFromCourse(c);
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