const funcs = require('./lib/functions.js');

async function main () {
  const page = await funcs.getOrCreatePage('BambooHR Employee Stats', 0);
  const data = await funcs.getEmployeeData().then(funcs.summarizeEmployeeData);

  await Promise.all(Object.keys(funcs.fields).map(field => {
    return funcs.makeContentForField(field, data[field]).then(content => {
      return funcs.setConfluenceContent(funcs.fields[field], page.id, content);
    });
  }));
}

main().catch(body => console.log('failure', body));
