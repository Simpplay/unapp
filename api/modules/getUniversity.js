import { Api } from "./api.js";
import { Instruction, University } from "../DefaultClasses.js";

import { GetFile } from "./getFile.js";

class GetUniversity extends Api {

    universities = {
        'unal': 'assets/universities/unal.unapp',
        'funlam': 'assets/universities/funlam.unapp',
        'udea': 'assets/universities/udea.unapp',
    }

    async response() {
        const params = this.getArgs();
        if (params['all'] !== undefined && params['all'] === 'true') {
            return JSON.stringify(Object.keys(this.universities));
        }
        if (params['id'] === undefined) {
            return '{ "error": "Please add id={university_id} as a param" }';
        }

        const file = JSON.parse(await new GetFile({ 'file': this.universities[params['id']] }).response());
        if (file.file === undefined) {
            return '{ "error": "Invalid university" }';
        }

        const config = await this.parseConfig(file.file);
        const universityFactory = new University.UniversityFactory();
        universityFactory.id = (params['universityID'] !== undefined) ? params['universityID'] : config.id;
        universityFactory.name = (params['universityName'] !== undefined) ? params['universityName'] : config.name;
        universityFactory.instructions = config.instructions;

        const university = universityFactory.createUniversity();
        return JSON.stringify(university);
    }

    parseConfig(content) {
        return new Promise((resolve, reject) => {
            const lines = content.split('\n');
            let config = {};
            let instructions = [];
            lines.forEach(line => {
                if (line.startsWith('%')) {
                    instructions.push((new Instruction.InstructionFactory()).fromText(line.trim()));
                }
                else if (line.includes('=')) {
                    const [key, value] = line.split('=');
                    config[key.trim()] = value.trim();
                }
            });

            config['instructions'] = instructions;
            resolve(config);
        });
    }
}

export { GetUniversity };