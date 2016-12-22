const promisify = require('es6-promisify-all');
const funcs = require('./lib/functions.js');
const fs = promisify(require('fs'));
const { each, omit, groupBy, keyBy } = require('lodash');
const errors = require('request-promise/errors');

function sleep(ms = 0) { return new Promise(resolve => setTimeout(resolve, ms)); }

function makeOrgData(employees) {
  const topEmployee = employees.find(emp => !emp.supervisor) ||
    employees.find(emp => emp.jobTitle === 'CEO');
  topEmployee.supervisorEId = '';

  const groupedBySupervisor = groupBy(employees, 'supervisorEId');
  const employeesById = keyBy(employees, 'id');
  each(omit(groupedBySupervisor, ''), function(children, parentId) {
    if (!employeesById[parentId]) { employeesById[parentId] = { "id": parentId, "displayName": "Missing" } }
    employeesById[parentId].children = children;
  });
  return groupedBySupervisor[''];
}

async function getSingleEmployeeData(employee) {
  try {
    const newData = await funcs.getEmployeeData(employee.id);
    return Object.assign(employee, newData);
  } catch (err) {
    // handle normal errors
    if (err instanceof errors.StatusCodeError && err.statusCode === 503) {
      return sleep(1000).then(() => getSingleEmployeeData(employee));
    } else {
      throw err;
    }
  }
}
async function main() {
  const employees = await funcs.getEmployeesData()
    .then(employees => Promise.all(employees.map(getSingleEmployeeData)))
  fs.writeFileSync(`public/employees.json`, JSON.stringify(employees, null, '  '));
  fs.writeFileSync(`public/orgchart.json`, JSON.stringify(makeOrgData(employees), null, '  '));

  const data = await funcs.summarizeEmployeeData(employees);

  await Promise.all(Object.keys(funcs.fields).map(async field => {
    await fs.writeFileAsync(`public/${field}.json`, JSON.stringify(data[field], null, '  '));
  }));
}

main().catch(body => console.log('failure', body));
