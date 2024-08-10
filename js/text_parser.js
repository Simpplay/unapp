async function readConfigFile(configPath, fileName) {
    // return fs.readFileSync(path.join(configPath, fileName), 'utf-8');
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

    const variables = [];

    // Procesar cada línea del texto de entrada con cada instrucción
    lines.forEach(line => {
        selected_university.instructions.forEach(i => {
            i.processLine(line, variables);
        });
    });

    selected_university.instructions.forEach(i => { i.resetVariables() })

    const c = new course();
    c.parseVariables(variables);
    console.log(variables)
    console.log(c)

    return selected_university.addCourse(c);;
}
