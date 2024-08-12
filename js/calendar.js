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
      left: 'fix download',
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
  const fixIcon = document.createElement('i');
  fixIcon.className = 'fas sharp';
  fixIcon.innerHTML = '';
  fixButton.appendChild(fixIcon);
  fixButton.onclick = () => {
    const calendarEvents = getCalendarEvents();
    if (calendarEvents && calendarEvents.length > 0) {
      const cE = moment(calendarEvents[0][0].startRecur);
      cE.add(10, 'days');
      mainCalendar.gotoDate(cE.format());
    }
    else Swal.fire('No hay elementos en el calendario');
  };

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
    console.log(minTime)
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