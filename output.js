const promisify = require('es6-promisify-all');
const funcs = require('./lib/functions.js');
const fs = promisify(require('fs'));

async function main() {
  const data = await funcs.getEmployeeData().then(funcs.summarizeEmployeeData);

  await Promise.all(Object.keys(funcs.fields).map(async field => {
    await fs.writeFileAsync(`public/${field}.json`, JSON.stringify(data[field]));
  }));
}

main().catch(body => console.log('failure', body));
