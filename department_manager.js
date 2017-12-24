const employees = require('./public/employees.json');
const fs = require('fs');

fs.writeFileSync('department_manager.csv', `Display Name, Department, Supervisor
${employees.map(emp => {
  return [emp.displayName, emp.department, emp.supervisor].map(a => `"${a}"`).join(",");
}).join("\n")}
`);

