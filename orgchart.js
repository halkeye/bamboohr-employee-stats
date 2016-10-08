const promisify = require('es6-promisify-all');
const funcs = require('./lib/functions.js');
const fs = promisify(require('fs'));

async function main() {
  const data = await funcs.getEmployeeData();
  const orgTree = {};
  console.log(data);

  await fs.writeFileAsync(`public/orgtree.json`, JSON.stringify(orgTree));
}

main().catch(body => console.log('failure', body));
