// The svg
var svg = d3.select("#my_dataviz1")
  .append("svg")
  .attr("width", width)
  .attr("height", height)

// Map and projection
var projection = d3.geoMercator()
    .center([37,30.5])                // GPS of location to zoom on3
    .scale(6200)              // This is like the zoom
    .translate([ width/2, height/2 ])


  // Create data for circles:
  var request = new XMLHttpRequest();
  request.open("GET", "./assets/PAL1.json", false);
  request.send(null)
  var markers = JSON.parse(request.responseText);

// Load external data and boot
d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson", function(data){
  
  // Filter data
  data.features = data.features.filter( function(d){return d.properties.name=="Israel"} )

    var size = d3.scaleLinear()
        .domain([1,17])  // What's in the data max conflicts
        .range([ 4, 5])  // Size in pixel


    // Draw the map
    svg.append("g")
        .selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
          .attr("fill", "#b8b8b8")
          .attr("d", d3.geoPath()
              .projection(projection)
          )
        .style("stroke", "black")
        .style("opacity", .3)

    // create a tooltip
    var Tooltip = d3.select("#my_dataviz1")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 1)
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "5px")

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
      Tooltip.style("opacity", 1)
    }
    var mousemove = function(d) {
      Tooltip
        .html("Event: " + d.color + "<br>" + 
        "City: " + d.admin1 + "<br>" + 
        "Number of conflicts: " + d.size + "<br>" + 
        "Number of fatalities: " + d.fatalities)
        .style("left", (d3.mouse(this)[0]+10) + "px")
        .style("top", (d3.mouse(this)[1]) + "px")
    }
    var mouseleave = function(d) {
      Tooltip.style("opacity", 0)
    }

    // Add circles:
    svg
      .selectAll("myCircles")
      .data(markers)
      .enter()
      .append("circle")
        .attr("cx", function(d){ return projection([d.long, d.lat])[0] })
        .attr("cy", function(d){ return projection([d.long, d.lat])[1] })
        .attr("r", function(d){ return size(d.fatalities) })
        .attr("class" , function(d){ return d.group })
        .style("fill", function(d){ return color(d.color) })
        .attr("stroke", function(d){ return color(d.color) })
        .attr("stroke-width", 3)
        .attr("fill-opacity", 1)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
  


    function update(){
  
      // For each check box:
      d3.selectAll(".checkbox").each(function(d){
        cb = d3.select(this);
        grp = cb.property("value")

        // If the box is check, I show the group
        if(cb.property("checked")){
          svg.selectAll("."+grp).transition().duration(1000).style("opacity", 1).attr("r", function(d){ return size(d.fatalities) })

        // Otherwise I hide it
        }else{
          svg.selectAll("."+grp).transition().duration(1000).style("opacity", 0).attr("r", 0)
        }
      })
    }

    // When a button change, I run the update function
    d3.selectAll(".checkbox").on("change",update);

      // And I initialize it at the beginning
      update()

})