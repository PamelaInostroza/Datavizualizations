// Variables
// const width = 350;
// const height = 350;
// const radius = Math.min(width, height) / 2;
// const color = d3.scaleOrdinal(d3.schemeTableau10);

// Create primary <g> element
const g = d3.select("#vis1").append("svg")
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr("id", "container")
    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

g.append("defs")
    .attr("id", "defs");
    
// Data strucure
const partition = d3.partition()
    .size([2 * Math.PI, radius]);


//JSON data
//d3.json('./assets/Sunburst.json', (error, nodeData) => {
d3.json("./assets/Sunburst2.json").then(nodeData => { 

    var textGroup = g.append("g");
        textGroup.append("text")
            .attr("id", "year")
            .attr("y", -25)
            .attr("class", "year")
            .attr("text-anchor", "middle");
    
        textGroup.append("text")
        .attr("id", "event_type")
        .attr("y", -15)
        .attr("class", "event_type")
        .attr("text-anchor", "middle");


        textGroup.append("text")
            .attr("id", "subevent_type")
            .attr("y", 10)
            .attr("class", "subevent_type")
            .attr("text-anchor", "middle");

        textGroup.append("text")
            .attr("id", "country")
            .attr("y", 20)
            .attr("class", "country")
            .attr("text-anchor", "middle");

        textGroup.append("text")
            .attr("id", "fatalities")
            .attr("y", 0)
            .attr("class", "fatalities")
            .attr("text-anchor", "middle");

    console.log(textGroup)

    // Find data root
    const root = d3.hierarchy(nodeData)
        .sum(function (d) { return d.fatalities})
        .sort(function(a, b) { return b.value - a.value; });

    // Size arcs
    partition(root);
    arc = d3.arc()
        .startAngle(function (d) { d.x0s = d.x0; return d.x0 })
        .endAngle(function (d) { d.x1s = d.x1; return d.x1 })
        .innerRadius(function (d) { return d.y0; })
        .outerRadius(function (d) { return d.y1; });
    

    // Put it all together
    const slice = g.selectAll('g')
        .data(root.descendants())
        .enter().append('g').attr("class", "node");
        
    slice.append('path')
        .attr("display", function (d) { return d.depth ? null : "none"; })
        .attr("d", arc)
        .style('stroke', '#fff')
        .style("fill", function (d) { return color((d.children ? d : d.parent).data.name);})
        .on("mouseover", mouseover1);

    slice.filter(function(node) {
            return ((node.x1 - node.x0) > Math.PI/4);
        }).append("text")
        .attr("transform", function(d) {
            return "translate(" + arc.centroid(d) + ")rotate(" + computeTextRotation(d) + ")"; })
        .attr("dx", "-20")
        .attr("dy", ".5em")
        .text(function(d) { return d.parent ? d.data.name : "" });

    

    d3.select("#chart-container").on("mouseleave", mouseleave1);   
});


function computeTextRotation(d) {
    const angle = (d.x0 + d.x1) / Math.PI * 90;

    // Avoid upside-down labels
    return (angle < 120 || angle > 270) ? angle : angle + 180;  // labels as rims
    //return (angle < 180) ? angle - 90 : angle + 90;  // labels as spokes
}

function mouseover1(e, d) {
    d3.select("#fatalities")
        .text(d.value.toLocaleString('en-IN', { maximumSignificantDigits: 3, style:"percent" }));
        console.log(d.value)
    var sequenceArray = d.ancestors().reverse();
    
    sequenceArray.shift(); 

    d3.select("#year").text("");
    d3.select("#event_type").text("");
    d3.select("#subevent_type2").text("");
    d3.select("#country").text("");
    d3.select("#name").text("");

    sequenceArray.forEach(d => {
      
        if (d.depth === 1) {
            d3.select("#year")
                .text(d.data.name)                
                ;
        } else if (d.depth === 2) {

            d3.select("#event_type")
                .text(d.data.name)
                ;
        } else if (d.depth === 3) {
            d3.select("#subevent_type")
                .text(d.data.name)
                ;
        } else if (d.depth === 4) {                
            d3.select("#country")
                .text(d.data.country);
        }
    });


    d3.selectAll("path") 
        .style("opacity", 0.3)
        .filter(function(node) {
            return (sequenceArray.indexOf(node) >= 0);
        })
    .style("opacity", 1);
}

function mouseleave1(d) {
    d3.selectAll("path").on("mouseover", null);

   d3.selectAll("path")
        .transition()
        .duration(1000)
        .style("opacity", 1)
        .on("end", function() {
            d3.select(this).on("mouseover", mouseover1);
        });
}
