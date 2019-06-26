/* eslint no-var: 0, no-invalid-this: 0 */
/* eslint-env: browser */
/* global fetch, TL */
'use strict';
function makeStartDate (date) {
  var parts = date.split('-');
  return {
    year: parts[0],
    month: parts[1],
    day: parts[2]
  };
}

var colorHash = new window.ColorHash();

fetch('employees.json', { credentials: 'same-origin' })
  .then(function (response) { return response.json(); })
  .then(function (employees) {
    var data = {
      events: employees.map(function (emp) {
        return {
          start_date: makeStartDate(emp.hireDate),
          background: { color: colorHash.hex(emp.department) },
          classname: emp.department.toLowerCase().replace(/\W+/g, '_'),
          media: {
            url: emp.photoUrl,
            thumbnail: emp.photoUrl
          },
          text: {
            headline: '<p><b>' + emp.displayName + '</b></p><p>' + emp.department + '</p>'
          }
        };
      })
    };
    console.log(data);

    var additionalOptions = {
      initial_zoom: 8,
      start_at_end: true,
      timenav_height: 400
    };

    return new TL.Timeline('timeline-embed', data, additionalOptions);
  });
