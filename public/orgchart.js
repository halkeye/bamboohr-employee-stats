/* eslint no-var: 0 */
/* eslint-env: browser */
/* global d3 */
'use strict';

var width = 10000, height = 10000;

var picsize = 60;

(function() {
  var div = document.createElement("div");
  document.body.appendChild(div);
  var button = document.createElement("button");
  button.appendChild(document.createTextNode('Reset'));
  div.appendChild(button);
})();

d3.json("orgchart.json", function(error, data) {
  if (error) throw error;

  d3.select('button').on('click', function() {
    update(d3.hierarchy(data[0]));
  });
  update(d3.hierarchy(data[0]));
  function update(root) {
    d3.select("svg").remove();

    var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);
    var g = svg.append("g");

    var tree = d3.tree()
      /* height, width */
      .nodeSize([picsize+10, picsize*6]);

    tree(root);

    /*var link = */g.selectAll(".link")
      .data(root.descendants().slice(1))
      .enter()
      .append("path")
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
      .on("dblclick", function(d) {
        update(d3.hierarchy(d.data));
      })
      .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    // add picture
    node
      .append('defs')
      .append('pattern')
      .attr('id', function(d,i){ return 'pic_' + d.data.id; })
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

    ['displayName', 'jobTitle','department'].forEach(function(elm, idx) {
      node.append("text")
        .attr("dy", idx*8)
        .attr("x", function(d) { return d.children ? -35 : 35; })
        .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
        .text(function(d) { return d.data[elm]; });
    });
    (function() {
      var box = g.node().getBBox();
      g.attr("transform", "translate(" + 120 + "," + ((box.height/2)+picsize+10) + ")");
      svg.attr("width", box.width);
      svg.attr("height", box.height+picsize+10);
    })();
  }
});
