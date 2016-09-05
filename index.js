const funcs = require('./functions.js');

funcs.getOrCreatePage('BambooHR Employee Stats', 0).then(page => {
  funcs.getEmployeeData().then(funcs.summarizeEmployeeData).then(data => {
    return Promise.all(Object.keys(funcs.fields).map(field => {
      funcs.makeContentForField(field, data[field]).then(content => {
        return funcs.setConfluenceContent(funcs.fields[field], page.id, content);
      });
    }));
  });
}).catch(body => console.log('failure', body));
