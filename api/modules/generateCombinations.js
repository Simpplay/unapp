import { Api } from "./api.js";
import { University, Course, Combination, default_combination_configurations } from "../DefaultClasses.js";

import { GetUniversity } from "./getUniversity.js";

class GenerateCombinations extends Api {
    async response() {
        const params = this.getArgs();
        // Receive params['courses'] and params['id'] or params['university']. If none of them are defined, return an error.
        // If params['config'] is not defined, use the default configuration.

        var courses = params['courses'];
        if (courses === undefined) {
            var universityJSON = params['university'];
            if (universityJSON === undefined) {
                if (params['id'] === undefined) {
                    return '{ "error": "Please add id={university_id} or university={university_json} as a param" }';
                }
                universityJSON = await new GetUniversity({ 'id': params['id'] }).response();
            }
            console.log('universityJSON:', universityJSON);
            courses = University.fromJSON(JSON.parse(universityJSON)).courses;
        } else {
            courses = JSON.parse(courses).map(course => Course.fromJSON(course));
        }
        console.log('courses:', courses);

        const combinations = Combination.generateCombinationsFromCourses(courses, params['config'] || default_combination_configurations);
        console.log('combinations:', combinations);

        return JSON.stringify(combinations);
    }
}

export { GenerateCombinations };