function topologicalSortCoursesBySemester(courses) {
    let visited = new Set();
    let semesterMap = new Map();

    function visit(c) {
        if (visited.has(c.course_id)) {
            return semesterMap.get(c.course_id);
        }

        visited.add(c.course_id);

        // Initialize the semester for this course
        let maxPrereqSemester = 0;

        for (let prereq_id in c.requirements) {
            let prereq = courses.find(c => {
                return c.course_id === prereq_id || (c.requirements[prereq_id] && c.course_name.toUpperCase() == c.requirements[prereq_id].toUpperCase())
            });

            if (!prereq) {
                console.warn(`Prerequisite course ${prereq_id} not found for course ${c.course_id}.`);
                // If the prerequisite course is not found, create a placeholder course.
                prereq = new course(c.requirements[prereq_id], prereq_id);
                courses.push(prereq);
            }

            // Recursively visit prerequisites to find the semester level
            maxPrereqSemester = Math.max(maxPrereqSemester, visit(prereq) + 1);
        }

        // Assign the course to the correct semester
        semesterMap.set(c.course_id, maxPrereqSemester);

        return maxPrereqSemester;
    }

    // Visit all courses to populate the semesterMap
    courses.forEach(c => visit(c));

    // Group courses by their semester in a sorted manner
    let semesters = [];
    semesterMap.forEach((semester, course_id) => {
        if (!semesters[semester]) {
            semesters[semester] = [];
        }
        semesters[semester].push(courses.find(c => c.course_id === course_id));
    });

    return semesters.filter(Boolean); // Filter out undefined entries
}

function renderCoursesBySemester(semesters) {
    let container = document.getElementById('courseContainer');
    container.innerHTML = '';

    semesters.forEach((semester, index) => {
        let semesterDiv = document.createElement('div');
        semesterDiv.classList.add('semester');
        semesterDiv.innerHTML = `<h2>Semester ${index + 1}</h2>`;

        semester.forEach(course => {
            let courseDiv = document.createElement('div');
            courseDiv.classList.add('course');
            courseDiv.style.borderColor = course.color;
            courseDiv.innerHTML = `
                <h3>${course.course_name} (${course.course_id})</h3>
                <p>Credits: ${course.course_credits}</p>
                <p>Groups: ${course.course_groups.length}</p>
                <p>Requirements: ${Object.values(course.requirements).join(', ') || 'None'}</p>
            `;
            semesterDiv.appendChild(courseDiv);
        });

        container.appendChild(semesterDiv);
    });
}

async function planner_on_university_change() {
    const courses = selected_university.courses;
    const semesters = topologicalSortCoursesBySemester(courses);
    renderCoursesBySemester(semesters);
}
