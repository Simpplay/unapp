async function readConfigFile(configPath, fileName) {
    return await loadFile(configPath + '/' + fileName);
}

function parseConfig(content) {
    return new Promise((resolve, reject) => {
        const lines = content.split('\n');
        let config = {};
        let instructions = [];
        lines.forEach(line => {
            if (line.startsWith('%')) {
                instructions.push(new instruction(line.trim()));
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

async function handleConfig(configPath, fileName) {
    const content = await readConfigFile(configPath, fileName);
    return parseConfig(content);
}


function addCourse(inputText) {
    if (!selected_university) {
        return {
            title: 'Error!',
            text: 'Por favor seleccione una universidad',
            icon: 'error',
            confirmButtonText: 'Continuar'
        };
    }

    // Texto a analizar, línea por línea
    const lines = inputText.split('\n');

    var variables = [];
    variables['requirements'] = {};

    // Procesar cada línea del texto de entrada con cada instrucción
    lines.forEach(line => {
        selected_university.instructions.forEach(i => {
            i.processLine(line, variables);
        });
    });

    selected_university.instructions.forEach(i => { i.resetVariables() })

    var lab_groups = [];
    var extra_info = [];
    variables.forEach(v => {
        try {
            if (v.name === 'course_name') {
                extra_info.push(v);
                lab_groups.push(new variable(v.name, v.value + ' - Laboratorio'));
            }
            else if (v.name === 'course_credits') {
                extra_info.push(v);
                lab_groups.push(v)
            }
            else if (v.name === 'course_id') {
                extra_info.push(v);
                lab_groups.push(new variable(v.name, v.value + '-lab'));
            }
            else if (v.value.some(v => v.name === 'isLab' && v.value === true)) {
                lab_groups.push(v);
            }
        } catch (e) { }
    });
    variables = variables.filter(v => !lab_groups.includes(v));
    variables.push(...extra_info);

    const c = new course();
    c.parseVariables(variables);

    if (lab_groups.length > 3) {
        const lab = new course();
        lab.parseVariables(lab_groups);
        selected_university.addCourse(lab);
    }

    return selected_university.addCourse(c);
}
