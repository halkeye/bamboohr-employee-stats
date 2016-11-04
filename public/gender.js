/* eslint no-var: 0, no-invalid-this: 0 */
/* eslint-env: browser */
/* global d3 */
'use strict';

onD3();


var duration = 1000;
var ease = d3.easeElastic;

var paths = {
  'Female': 'M124.50539,388.15534V549.98933C124.26193,579.39154,80.494976,579.39154,80.108304,549.98933V388.15534H22.821751L84.404788,171.89962H74.379644L38.57554,295.0651C29.524278,322.30474,-7.3109962,311.27714,1.3392857,282.17574L41.43986,148.98509C46.051436,133.68965,65.32836,106.68061,98.726432,106.02037H128.80188H163.17384C195.6095,106.68061,214.96663,133.91881,220.46041,148.98509L260.56101,282.17574C268.69571,311.1339,232.15259,323.02082,223.32473,295.0651L187.52063,171.89962H176.06331L239.07855,388.15534H180.3598V549.98933C180.8181,579.39154,137.22302,579.2483,137.39487,549.98933V388.15534H124.50539z',
  'Male': 'm79.945605,106.02037c-35.78976,0 -58.71876,30.98756 -58.71876,61.58276l0,143.21573c-0.3294,27.98432 39.966,27.98432 40.10064,0l0,-131.75848l10.02512,0l0,363.76815c-0.62156,37.98085 53.04736,36.89241 52.99008,0l0,-211.95947l8.593,0l0,211.95947c0.70176,36.89241 54.65136,37.98085 54.4222,0l0,-363.76815l10.02516,0l0,131.75848c-0.4726,28.19916 39.61368,28.19916 40.10056,0l0,-143.21573c-0.5728,-30.5952 -24.36108,-61.03424 -60.15084,-61.58276l-97.38716,0z'
};

function onD3() {
  d3.json("gender.json", function(error, genders) {
    if (error) throw error;
    genders = genders.map(function(gender) {
      return {
        label: gender[0],
        value: gender[1]
      };
    }).sort(function(a, b) {
      return a.label.localeCompare(b.label);
    });
    var total = d3.sum(genders, function(d) { return d.value });
    genders.forEach(function(gender) {
      gender.percentage = Math.round((gender.value/total)*100);
    });

    var bodyWidth = 276.01;

    var node = d3.select("svg")
      .selectAll(".node")
      .data(genders)
      .enter()
        .append('g')
        .attr("transform", function(d, idx) { return "translate(" + (idx*bodyWidth) + "," + 0 + ")"; })

    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("stroke-width", 1)
      .attr("x", bodyWidth / 2)
      .attr("y", 600)
      .transition()
      .duration(duration)
      .ease(ease)
      .tween('text', function(d) {
        var i = d3.interpolate(0, d.percentage);
        return function(t) {
          d3.select(this).text(d.label + ' -- ' + Math.round(i(t)) + '%');
        }.bind(this)
      });

    var body = node
      .append("g")
      .attr("stroke-width", 2)
      .attr("stroke", "black")
      .style("fill", function(d) { return 'url(#' + d.label + '_Gradient)'; })

    var gradient = body
      .append('defs')
        .append('linearGradient')
        .attr('y2', '0%')
        .attr('x2', '0%')
        .attr('y1', '100%')
        .attr('x1', '0%')
        .attr('id', function(d) { return d.label + '_Gradient'; })
        .attr('gradientUnits', 'userSpaceOnUse')

    gradient.append('stop')
      .attr('stop-color', '#00FF00')
      .transition()
      .duration(duration)
      .ease(ease)
      .attrTween('offset', function(d) {
        return d3.interpolate('0%', d.percentage + '%');
      });

    gradient.append('stop')
      .attr('stop-color', '#000000')
      .attr('offset', '0%')

    body
      .append("circle")
      .attr("class", "head")
      .attr("cx", 130.95011)
      .attr("cy", 47.58577)
      .attr("r", 46.54521)

    body
      .append("path")
      .attr("d", function(d) { return paths[d.label] || paths.unknown; })
  });
}
