async function planner_on_university_change() {
    const allCoursesList = document.getElementsByClassName('all-courses-list');
    if (allCoursesList) {
        allCoursesList.innerHTML = '';

        const courses = selected_university.courses;
        console.log(courses)
        const sortedCourses = topologicalSortCourses(courses);
        console.log(sortedCourses)
        renderCourses(sortedCourses);

        /*selected_university.courses.forEach((c) => {
            console.log(c)
            const li = document.createElement('li');
            li.innerHTML = course.getAsHTML(c);
            Array.from(allCoursesList).forEach(e => {
                console.log(e)
                e.appendChild(li);
            });
        });*/
    }
}

function topologicalSortCourses(courses) {
    let visited = new Set();
    let stack = [];

    function visit(c) {
        if (!visited.has(c.course_id)) {
            visited.add(c.course_id);

            for (let prereq_id in c.requirements) {
                let prereq = courses.find(c => c.course_id === prereq_id);

                if (!prereq) {
                    prereq = new course(c.requirements[prereq_id], prereq_id);
                    courses.push(prereq);
                }
                visit(prereq);
            }

            stack.push(c);
        }
    }

    courses.forEach(course => visit(course));
    return stack.reverse();
}

function renderCourses(courses) {
    let container = document.getElementById('courseContainer');
    container.innerHTML = '';

    courses.forEach(course => {
        let courseDiv = document.createElement('div');
        courseDiv.classList.add('course');
        courseDiv.style.borderColor = course.color;
        courseDiv.innerHTML = `
            <h3>${course.course_name} (${course.course_id})</h3>
            <p>Credits: ${course.course_credits}</p>
            <p>Groups: ${course.course_groups.join(', ')}</p>
            <p>Requirements: ${Object.values(course.requirements).join(', ') || 'None'}</p>
        `;
        container.appendChild(courseDiv);
    });
}