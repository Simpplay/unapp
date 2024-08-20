
import { Api } from "./api.js";
import { University, Course } from "../DefaultClasses.js";

import { GetUniversity } from "./getUniversity.js";

class ReadCourse extends Api {
    async response() {
        const params = this.getArgs();
        console.log('calling ReadCourse.response() with params:', params);
        if (params['text'] === undefined) {
            return '{ "error": "Please add text={text} as a param" }';
        }
        var fromID = false;
        var universityJSON = params['university'];
        if (universityJSON === undefined) {
            if (params['id'] === undefined) {
                return '{ "error": "Please add id={university_id} as a param" }';
            }
            fromID = true;
            universityJSON = await new GetUniversity({ 'id': params['id'] }).response();
        }
        console.log('universityJSON:', universityJSON);
        const university = University.fromJSON(JSON.parse(universityJSON));

        const text = params['text'].replaceAll('\\n', '\n');
        const course = this.getCourse(text, university);
        university.courses.push(course);

        return (fromID) ? JSON.stringify(course) : university.getAsJSON();
    }

    getCourse(text, university) {
        const lines = text.split('\n');

        const variables = [];
        variables['requirements'] = {};

        lines.forEach(line => {
            university.instructions.forEach(i => {
                i.processLine(line, variables);
            });
        });

        university.instructions.forEach(i => { i.resetVariables() })

        const course = new Course();
        course.parseVariables(variables);

        return course;
    }
}

export { ReadCourse };