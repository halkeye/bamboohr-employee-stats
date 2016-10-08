/* eslint no-var: 0 */
/* eslint-env: browser */
/* global d3 */
'use strict';

var width = 10000, height = 10000;

var picsize = 60;

var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height);

d3.json("orgchart.json", function(error, data) {
  if (error) throw error;

  var root = d3.hierarchy(data[0]);

  // compute the new height
  var levelWidth = [1];
  var childCount = function(level, n) {
    if(n.children && n.children.length > 0) {
      if(levelWidth.length <= level + 1) levelWidth.push(0);

      levelWidth[level+1] += n.children.length;
      n.children.forEach(function(d) {
        childCount(level + 1, d);
      });
    }
  };
  childCount(0, root);
  var newHeight = d3.max(levelWidth) * picsize;

  var g = svg
    .append("g")
    .attr("transform", "translate(" + 120 + "," + newHeight + ")");

  var tree = d3.tree()
    .nodeSize([picsize+10, picsize*6])

  tree(root);

  /*var link = */g.selectAll(".link")
    .data(root.descendants().slice(1))
    .enter().append("path")
    .attr("class", "link")
    .attr("d", function(d) {
      return "M" + d.y + "," + d.x
        + "C" + (d.parent.y + 100) + "," + d.x
        + " " + (d.parent.y + 100) + "," + d.parent.x
        + " " + d.parent.y + "," + d.parent.x;
    });

  var node = g.selectAll(".node")
    .data(root.descendants())
    .enter()
    .append("g")
    .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
    .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

  // add picture
  node
    .append('defs')
    .append('pattern')
    .attr('id', function(d,i){ return 'pic_' + d.data.id })
    .attr('height','100%')
    .attr('width','100%')
    .attr('x',0)
    .attr('y',0)
    .append('image')
    .attr('xlink:href',function(d,i){  return d.data.photoUrl; })
    .attr('height',picsize)
    .attr('width',picsize)
    .attr('x',0)
    .attr('y',0);

  node.append("circle")
    .attr("r", picsize/2)
    .style("fill", function(d,i){ return 'url(#pic_' + d.data.id+')'; });

  node.append("text")
    .attr("dy", 3)
    .attr("x", function(d) { return d.children ? -35 : 35; })
    .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
    .text(function(d) { return d.data.displayName; });
});
