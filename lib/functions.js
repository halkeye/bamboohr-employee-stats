const request = require('request-promise');
const path = require('path');
const promisify = require('es6-promisify-all');
const fs = promisify(require('fs'));
const { memoize, once } = require('lodash');

const getConfluence = once(function() { 
  const Confluence = require('confluence-api');
  Confluence.prototype = promisify(Confluence.prototype);

  return new Confluence({
    username: process.env.CONFLUENCE_USERNAME,
    password: process.env.CONFLUENCE_PASSWORD,
    baseUrl:  process.env.CONFLUENCE_URL
  });
});

module.exports = {};

const fields = {
  'gender': 'Genders',
  'jobTitle': 'Job Titles',
  'department' : 'Departments',
  'location': 'Location'
};
module.exports.fields = fields;

const LOCATIONS_FILE = path.join(__dirname, 'locations.json');
const _locations = fs.existsSync(LOCATIONS_FILE) ? JSON.parse(fs.readFileSync(LOCATIONS_FILE)) : {};
module.exports.getLocation = memoize((location) => {
  if (_locations[location] || !location) {
    return Promise.resolve(_locations[location] || []);
  }

  return request({url: 'https://maps.googleapis.com/maps/api/geocode/json', json: true, qs: { address: location, key: process.env.GMAPS_API_KEY }})
    .then(json => {
        _locations[location] = json.results[0].geometry.location;
        return fs.writeFileAsync(LOCATIONS_FILE, JSON.stringify(_locations));
    }).then(() => _locations[location]);
});

module.exports.getEmployeeData = (id) => {
  return request({
    method: 'GET',
    qs: { fields: 'displayName,supervisor,city,country,department,division,gender,hireDate,jobTitle,location,nickname,state,stateCode,status,supervisorId,workEmail,photoUploaded,supervisorEId' },
    url: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_SUBDOMAIN}/v1/employees/${id}`,
    headers: { accept: 'application/json' },
    json: true,
    auth: { user: process.env.BAMBOOHR_API_KEY, pass: 'x', sendImmediately: true }
  });
};

module.exports.getEmployeesData = () => {
  return request({
    method: 'GET',
    url: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOOHR_SUBDOMAIN}/v1/employees/directory`,
    headers: { accept: 'application/json' },
    json: true,
    auth: { user: process.env.BAMBOOHR_API_KEY, pass: 'x', sendImmediately: true }
  })
  .then(body => body.employees);
};

module.exports.summarizeEmployeeData = (employees) => {
  return Promise.resolve().then(() => {
    return employees.reduce((prev, employee) => {
      Object.keys(fields).forEach(field => {
        if (!prev[field][employee[field]]) {
          prev[field][employee[field]] = 0;
        }
        prev[field][employee[field]]++;
      });
      return prev;
    }, { gender: {}, jobTitle: {}, department: {}, location: {} });
  }).then(summarizedValues => {
    const promises = Promise.all(Object.keys(summarizedValues).map(field => {
      return Promise.all(Object.keys(summarizedValues[field]).sort((a,b) => summarizedValues[field][b]-summarizedValues[field][a]).map(valueName => {
        const ret = [field, valueName, summarizedValues[field][valueName]];
        if (field === 'location') {
          return module.exports.getLocation(valueName)
            .then(location => {
              return ret.concat([location.lat, location.lng]);
            });
        } else {
          return Promise.resolve(ret);
        }
      }));
    }));
    return promises.then(all => {
      const ret = {};
      all.forEach(field => {
        field.forEach(elm => {
          const key = elm.shift();
          if (!ret[key]) { ret[key] = []; }
          ret[key].push(elm);
        });
      });
      return ret;
    });
  });
};

module.exports.getOrCreatePage = (title, parent) => {
  const content = '';
  return getConfluence().getContentByPageTitleAsync(/*space*/process.env.CONFLUENCE_SPACE, /*title*/title)
    .then(body => {
      if (body.size === 0) {
        /* Meh, assume its page not found */
        return getConfluence().postContentAsync(/*space*/process.env.CONFLUENCE_SPACE, /*title*/title, /*content*/content, /*parentId*/parent)
          .then(() => getConfluence().getContentByPageTitleAsync(/*space*/process.env.CONFLUENCE_SPACE, /*title*/title));
      }
      return body;
    })
    .then(body => body.results[0]);
};

module.exports.setConfluenceContent = (title, parent, content) => {
  return module.exports.getOrCreatePage(title, parent).then(subPage => {
    return getConfluence().putContentAsync(/*space*/process.env.CONFLUENCE_SPACE, /*id*/subPage.id, /*version*/subPage.version.number+1, /*title*/title, /*content */content);
  });
};

module.exports.makeContentForField = (field, summarizedValues) => {
  const headers = '<tr>' + [fields[field], 'Count'].concat(field === 'location' ? ['Latitude', 'Longitude'] : [])
    .map(header => {
        return `<th>${header}</th>`;
    }).join('') + '</tr>';

  return Promise.resolve(summarizedValues)
    .then(rows => {
      return rows.map(row => {
        const [header, value, ...extras] = row;
        return `<tr><td>${header}</td><td>${value}</td>${extras.map(extra => `<td>${extra}</td>`).join('')}</tr>`;
      }).join('');
    })
    .then(content => `<table><tbody>${headers}${content}</tbody></table>`);
};


