const request = require('request-promise');
const parse = require('xml-parser');
const promisify = require('es6-promisify-all');
const Confluence = require('confluence-api');
const fs = promisify(require('fs'));
const { memoize } = require('lodash');

Confluence.prototype = promisify(Confluence.prototype);

const confluence = new Confluence({
  username: process.env.CONFLUENCE_USERNAME,
  password: process.env.CONFLUENCE_PASSWORD,
  baseUrl:  process.env.CONFLUENCE_URL
});

const fields = {
  'gender': 'Genders',
  'jobTitle': 'Job Titles',
  'department' : 'Departments',
  'location': 'Location'
};

const _locations = fs.existsSync('locations.json') ? require('./locations.json') : {};
const getLocation = memoize((location) => {
  if (_locations[location]) { return Promise.resolve(_locations[location]); }

  return request({url: 'https://maps.googleapis.com/maps/api/geocode/json', json: true, qs: { address: location, key: process.env.GMAPS_API_KEY }})
    .then(json => {
        _locations[location] = json.results[0].geometry.location;
        return fs.writeFileAsync('locations.json', JSON.stringify(_locations));
    }).then(() => _locations[location]);
});

const getEmployeeData = () => {
  return request({
    method: 'GET',
    url: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_SUBDOMAIN}/v1/employees/directory`,
    auth: { user: process.env.BAMBOOHR_API_KEY, pass: 'x', sendImmediately: true }
  })
  .then(body => parse(body))
  .then(result => {
    return result.root.children
    .find(elm => elm.name === 'employees')
    .children
    .filter(elm => elm.name === 'employee')
    .map(elm => {
      return elm.children.reduce((prev, child) => {
        prev[child.attributes.id] = child.content;
        return prev;
      }, { id: elm.attributes.id });
    });
  });
};

const summarizeEmployeeData = (employees) => {
  return employees.reduce((prev, employee) => {
    Object.keys(fields).forEach(field => {
      if (!prev[field][employee[field]]) {
        prev[field][employee[field]] = 0;
      }
      prev[field][employee[field]]++;
    });
    return prev;
  }, { gender: {}, jobTitle: {}, department: {}, location: {} })
};

const getOrCreatePage = (title, parent) => {
  const content = '';
  return confluence.getContentByPageTitleAsync(/*space*/process.env.CONFLUENCE_SPACE, /*title*/title)
    .then(body => {
      if (body.size === 0) {
        /* Meh, assume its page not found */
        return confluence.postContentAsync(/*space*/process.env.CONFLUENCE_SPACE, /*title*/title, /*content*/content, /*parentId*/parent)
          .then(() => confluence.getContentByPageTitleAsync(/*space*/process.env.CONFLUENCE_SPACE, /*title*/title))
      }
      return body;
    })
    .then(body => body.results[0])
};

const makeContentForField = (field, summarizedValues) => {
  const promises = Object.keys(summarizedValues).sort((a,b) => summarizedValues[b]-summarizedValues[a]).map(valueName => {
    const ret = [valueName, summarizedValues[valueName]];
    if (field === 'location') {
      return getLocation(valueName)
        .then(location => {
          return ret.concat([location.lat, location.lng]);
        });
    } else {
      return Promise.resolve(ret);
    }
  });
  const headers = '<tr>' + [fields[field], 'Count'].concat(field === 'location' ? ['Latitude', 'Longitude'] : [])
    .map(header => {
        return `<th>${header}</th>`;
    }).join('') + '</tr>';

  return Promise.all(promises)
    .then(rows => {
      return rows.map(row => {
        const [header, value, ...extras] = row;
        return `<tr><td>${header}</td><td>${value}</td>${extras.map(extra => `<td>${extra}</td>`).join('')}</tr>`;
      }).join('');
    })
    .then(content => `<table><tbody>${headers}${content}</tbody></table>`);
};

getOrCreatePage('BambooHR Employee Stats', 0).then(page => {
  getEmployeeData().then(summarizeEmployeeData).then(data => {
    return Promise.all(Object.keys(fields).map(field => {
      makeContentForField(field, data[field]).then(content => {
        return getOrCreatePage(fields[field], page.id).then(subPage => {
          return confluence.putContentAsync(/*space*/process.env.CONFLUENCE_SPACE, /*id*/subPage.id, /*version*/subPage.version.number+1, /*title*/fields[field], /*content */content);
        });
      });
    }));
  });
}).catch(body => console.log('failure', body));
