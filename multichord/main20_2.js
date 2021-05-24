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
var arc2 = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

var layout2 = d3.multichord()
    .padAngle(.05)
    .sortSubgroups(d3.descending) 
    .sortChords(d3.descending);

var path2 = d3.ribbon()
    .radius(innerRadius);

var svg2 = d3.select("#vis2").append("svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT)
  // .attr("x", CHORD_VIS.X)
  // .attr("y", CHORD_VIS.Y)


d3.queue()
    .defer(d3.json, "./assets/MultipleCatChordDiag20_2.json")
    .await(ready);

function ready(error, data2) {
  if (error) throw error;

  var nodes2 = data2.nodes,
  categories2 = data2.categories;

  var chords2 = layout2(data2.links)  
console.log(chords2)
  // Compute the chord layout.
  var g2 =  svg2.append("g")
    .attr("id", "circle")
    .attr("transform", "translate(" + (WIDTH / 2) + "," + (HEIGHT / 2) + ")")
    .datum(chords2);

  g2.append("circle")
    .attr("r", outerRadius)

  g2.append("g").attr("id", "groups");
  g2.append("g").attr("id", "chords2");


  var group2, groupPath2, groupText2, chord2;

  // Add a group per neighborhood.
  group2= g2.select("#groups")
    .selectAll("g")
      .data(function(chords2){ return chords2.groups})
    .enter().append("g")
    .attr("class", "group2")
    .on("mouseover", mouseover)
    .on("mouseout", mouseover_restore);
  
  // Add the group arc.
  groupPath2 = group2.append("path")
      .attr("id", function(d, i) { return "group2" + i; })
      .attr("d", arc2)
      .style("fill", function(d, i) { return nodes2[i].color; });

  // Add a text label.
  groupText2 = group2.append("text")
      .attr("x", 6)
      .attr("dy", 15)
      .append("textPath")
      .attr("xlink:href", function(d, i) { return "#group2" + i; })
      .text(function(d, i) { return nodes2[i].name; })
      .attr("opacity", function(d, i) {
        // Hide labels that don't fit
        if (groupPath2._groups[0][i].getTotalLength() / 2 < this.getComputedTextLength()) {
          return 0;
        } else { 
          return 1;
        };
      })
      .style("font-size", "12px")

  // Add a mouseover title.
  group2.append("title").text(function(d, i) {
    return nodes2[i].name
        + "\n" + "In: " + formatNumber(chords2.groups[i].value.in)
        + "\n" + "Out: " + formatNumber(chords2.groups[i].value.out);
  });
  

  // Add the chords.
  chord = g2.select("#chords2").selectAll("g")
      .data(function(chords2) { return chords2;})
      .enter().append("g")
      .attr("class", "chord");

  chord.append("path")
      .attr("class", "chord")
      .style("fill", function(d) { return nodes2[d.source.index].color; })
      .attr("d", path2)
      .on("mouseover", mouseover_types)
      .on("mouseout", mouseover_restore);

  // Add a mouseover title for each chord.
  chord.append("title").text(function(d) {
    return categories2[d.source.category].name
        + "\n" + nodes2[d.source.index].name
        + " → " + nodes2[d.target.index].name
        + ": " + formatNumber(d.source.value)
        + "\n" + nodes2[d.target.index].name
        + " → " + nodes2[d.source.index].name
        + ": " + formatNumber(d.target.value);
  });


  function mouseover(d) {
    g2.select("#chords2").selectAll("path")
      .classed("fade", function(p) {
        return p.source.index != d.index
            && p.target.index != d.index;
      });
  }


  function mouseover_types(d) {
    g2.select("#chords2").selectAll("path")
      .classed("fade", function(p) {
        return p.source.category != d.source.category
            && p.target.category != d.target.category;
      });
  }


  function mouseover_restore(d) {
    g2.select("#chords2").selectAll("path")
      .classed("fade", function(p) {
        return false;
      });
  }
}