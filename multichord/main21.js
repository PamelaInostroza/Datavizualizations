// Adapted from Mike Bostock's UberData Chord diagram example
//   https://bost.ocks.org/mike/uberdata/

// Formatting functions
var formatPercent = d3.format(".1%");

var formatNumber = function (x){
  if (Math.abs(x) >= 1e9) {
    return d3.format(",.2f")(x / 1e9) + " Billion"
  }
  else if (Math.abs(x) >= 1e6) {
    return d3.format(",.2f")(x / 1e6) + " Million"
  }
  else {
    return d3.format(",.0f")(x)
  }
}

// Chord chart elements
var arc4 = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

var layout4 = d3.multichord()
    .padAngle(.05)
    .sortSubgroups(d3.descending) 
    .sortChords(d3.descending);

var path4 = d3.ribbon()
    .radius(innerRadius);

var svg4 = d3.select("#vis4").append("svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT)
  // .attr("x", CHORD_VIS.X)
  // .attr("y", CHORD_VIS.Y)


d3.queue()
    .defer(d3.json, "./assets/MultipleCatChordDiag21.json")
    .await(ready);

function ready(error, data) {
  if (error) throw error;

  var nodes = data.nodes,
  categories = data.categories;

  var chords = layout(data.links)  

  // Compute the chord layout.
  var g4 =  svg4.append("g")
    .attr("id", "circle")
    .attr("transform", "translate(" + (WIDTH / 2) + "," + (HEIGHT / 2) + ")")
    .datum(chords);

  g4.append("circle")
    .attr("r", outerRadius)

  g4.append("g").attr("id", "groups");
  g4.append("g").attr("id", "chords");


  var group4, groupPath4, groupText4, chord4;

  // Add a group per neighborhood.
  group4 = g4.select("#groups")
    .selectAll("g")
      .data(function(chords){ return chords.groups})
    .enter().append("g")
    .attr("class", "group")
    .on("mouseover", mouseover)
    .on("mouseout", mouseover_restore);
  
  // Add the group arc.
  groupPath4 = group4.append("path")
      .attr("id", function(d, i) { return "group" + i; })
      .attr("d", arc)
      .style("fill", function(d, i) { return nodes[i].color; });

  // Add a text label.
  groupText4 = group4.append("text")
      .attr("x", 6)
      .attr("dy", 15)
      .append("textPath")
      .attr("xlink:href", function(d, i) { return "#group" + i; })
      .text(function(d, i) { return nodes[i].name; })
      .attr("opacity", function(d, i) {
        // Hide labels that don't fit
        if (groupPath4._groups[0][i].getTotalLength() - 40 < this.getComputedTextLength()) {
          return 0;
        } else { 
          return 1;
        };
      })
      .style("font-size", "12px")

  // Add a mouseover title.
  group4.append("title").text(function(d, i) {
    return nodes[i].name
        + "\n" + "In: " + formatNumber(chords.groups[i].value.in)
        + "\n" + "Out: " + formatNumber(chords.groups[i].value.out);
  });
  

  // Add the chords.
  chord4 = g4.select("#chords").selectAll("g")
      .data(function(chords) { return chords;})
      .enter().append("g")
      .attr("class", "chord");

  chord4.append("path")
      .attr("class", "chord")
      .style("fill", function(d) { return nodes[d.source.index].color; })
      .attr("d", path)
      .on("mouseover", mouseover_types)
      .on("mouseout", mouseover_restore);

  // Add a mouseover title for each chord.
  chord4.append("title").text(function(d) {
    return categories[d.source.category].name
        + "\n" + nodes[d.source.index].name
        + " → " + nodes[d.target.index].name
        + ": " + formatNumber(d.source.value)
        + "\n" + nodes[d.target.index].name
        + " → " + nodes[d.source.index].name
        + ": " + formatNumber(d.target.value);
  });


  function mouseover(d) {
    g4.select("#chords").selectAll("path")
      .classed("fade", function(p) {
        return p.source.index != d.index
            && p.target.index != d.index;
      });
  }


  function mouseover_types(d) {
    g4.select("#chords").selectAll("path")
      .classed("fade", function(p) {
        return p.source.category != d.source.category
            && p.target.category != d.target.category;
      });
  }


  function mouseover_restore(d) {
    g4.select("#chords").selectAll("path")
      .classed("fade", function(p) {
        return false;
      });
  }
}