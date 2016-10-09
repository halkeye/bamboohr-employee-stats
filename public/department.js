/* eslint no-var: 0, no-invalid-this: 0 */
/* eslint-env: browser */
/* global d3 */
'use strict';

var diameter = 960,
  format = d3.format(",d"),
  color = d3.scale.category20c();

var bubble = d3.layout.pack()
  .sort(null)
  .size([diameter, diameter])
  .padding(1.5);

var svg = d3.select("body").append("svg")
  .attr("width", diameter)
  .attr("height", diameter)
  .attr("class", "bubble");

d3.json("employees.json", function(error, employees) {
  if (error) throw error;
  var departments = employees.reduce(function(prev, emp) {
    prev[emp.department] = (prev[emp.department] || 0) + 1;
    return prev;
  }, {});

  var root = {
    "children": Object.keys(departments).map(function(dept) {
      return {
        department: dept,
        value: departments[dept]
      };
    })
  };

  var node = svg.selectAll(".node")
    .data(bubble.nodes(root).filter(function(d) { return !d.children; }))
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  node.append("title")
    .text(function(d) { return d.department + ": " + format(d.value); });

  node.append("circle")
    .attr("r", function(d) { return d.r; })
    .style("fill", function(d) { return color(d.department); });

  node.append("text")
    .attr("dy", ".3em")
    .style("text-anchor", "middle")
    .text(function(d) { return d.department.substring(0, d.r / 3); })
});

// d3.select(self.frameElement).style("height", diameter + "px");

