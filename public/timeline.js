/* eslint no-var: 0, no-invalid-this: 0 */
/* eslint-env: browser */
/* global fetch, TL */
'use strict';
function makeStartDate(date) {
  var parts = date.split('-');
  return {
    year: parts[0],
    month: parts[1],
    day: parts[2]
  };
}

fetch('employees.json', { credentials: 'same-origin' })
  .then(function(response) { return response.json(); })
  .then(function(employees) {
    var data = {
      events: employees.map(function(emp) {
        return {
          start_date: makeStartDate(emp.hireDate),
          text: {
            headline: emp.displayName
          }
        };
      })
    };
    console.log(data);

    var additionalOptions = {
      start_at_end: true,
      timenav_height: 400
    };

    new TL.Timeline('timeline-embed', data, additionalOptions);
  });
