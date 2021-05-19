//Global state
const margin = {top: 130, right: 10, bottom: 5, left: 40},
width = 800 - margin.left - margin.right,
height = 550 - margin.top - margin.bottom;


// Create SVG and group element
const svg = d3.select("#parallel")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
const g = svg.append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
// Tooltip
const div = d3.select("body").append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);


// Table -- header       
const table = d3.select('#valuesTable');
const header = table.append('tr');
header.append("th").attr("class", "table-header").html("Variables")
header.append("th").attr("class", "table-header").html("Values");

// Loading the data
d3.csv('./assets/ParallelCoordinates.csv', d => {
    // Make sure that numbers are interpreted as numbers and not strings
    return {
        year: d.year,
        //country: d.country,
        continent: d.continent,
        region: d.region,
        "Fatalities (% of total)": +d["Fatalities (% of total)"],
        "Fatalities (Average % of country population per 1000)": +d["Fatalities (Average % of country population per 1000)"],
        "Conflicts (% of total)": +d["Conflicts (% of total)"],
        "Conflicts (Average % of country participation in the region)": +d["Conflicts (Average % of country participation in the region)"],
        //"Mobile cellular subscriptions (Mean per 10 million)": +d["Mobile cellular subscriptions (Mean per 10 million)"], 
        //"International tourism, number of arrivals (Mean per 10 million)": +d["International tourism, number of arrivals (Mean per 10 million)"], 
        //"International tourism, number of departures (Mean per 10 million)": +d["International tourism, number of departures (Mean per 10 million)"], 
        "Control of Corruption (Mean)": +d["Control of Corruption (Mean)"],
        "Government Effectiveness (Mean)": +d["Government Effectiveness (Mean)"],
        "Political Stability and Absence of Violence/Terrorism (Mean)": +d["Political Stability and Absence of Violence/Terrorism (Mean)"],
        "Rule of Law (Mean)": +d["Rule of Law (Mean)"],
        "Regulatory Quality (Mean)": +d["Regulatory Quality (Mean)"],
        "Voice and Accountability (Mean)": +d["Voice and Accountability (Mean)"],
        "Population growth (Mean annual %)": +d["Population growth (Mean annual %)"],
        "Individuals using the Internet (Mean % of population)": +d["Individuals using the Internet (Mean % of population)"], 
        "Mortality rate, under-5 (Mean per 1,000 live births)": +d["Mortality rate, under-5 (Mean per 1,000 live births)"] 
    
    }
    }).then(data => {

        //Table -- variable names && empty values
        const tableVariables = table.selectAll("tr")
            .data(Object.keys(data[0]).slice(2,19)) // I used the original variable names, but you could change or shorten them if wanted
            .enter().append("tr").each(function(d){
                const row = d3.select(this);

                row.append("td").attr("class", "table-column-1")
                    .html(d => d);

                row.append("td").attr("class", "table-column-2")
                    .html("") // empty value for the values
            });
  
        let dataFilter = data.filter(function(d) { 
            if(selectedItems.includes(d["continent"]) && d["year"]==selectedYear)
            { 
                return d;
            } 
        })

        const keystodraw = data.columns.filter(function(d) {
            return d !== "" && d !== "year" && d !== "continent" && d !== "region";
        });
    
        //console.log(dataFilter);
        //console.log(keystodraw);

        // xScale
        const y = new Map(
            Array.from(keystodraw, 
                key => [
                    key, 
                    d3.scaleLinear()
                    .domain(d3.extent(data, d=>d[key]))
                    .range([0, height])
                    .nice()
                ]
            )
        );
        //console.log(y)
        y.get('Control of Corruption (Mean)').domain(y.get('Control of Corruption (Mean)').domain().reverse());
        y.get('Government Effectiveness (Mean)').domain(y.get('Government Effectiveness (Mean)').domain().reverse());
        y.get('Political Stability and Absence of Violence/Terrorism (Mean)').domain(y.get('Political Stability and Absence of Violence/Terrorism (Mean)').domain().reverse());
        y.get('Regulatory Quality (Mean)').domain(y.get('Regulatory Quality (Mean)').domain().reverse());
        y.get('Rule of Law (Mean)').domain(y.get('Rule of Law (Mean)').domain().reverse());
        y.get('Voice and Accountability (Mean)').domain(y.get('Voice and Accountability (Mean)').domain().reverse());
        y.get('Individuals using the Internet (Mean % of population)').domain(y.get('Individuals using the Internet (Mean % of population)').domain().reverse());
        //y.get('Mobile cellular subscriptions (Mean per 10 million)').domain(y.get('Mobile cellular subscriptions (Mean per 10 million)').domain().reverse());
        //y.get('International tourism, number of arrivals (Mean per 10 million)').domain(y.get('International tourism, number of arrivals (Mean per 10 million)').domain().reverse());
        //y.get('International tourism, number of departures (Mean per 10 million)').domain(y.get('International tourism, number of departures (Mean per 10 million)').domain().reverse());
        y.get('Mortality rate, under-5 (Mean per 1,000 live births)').domain(y.get('Mortality rate, under-5 (Mean per 1,000 live births)').domain().reverse());
        y.get('Population growth (Mean annual %)').domain(y.get('Population growth (Mean annual %)').domain().reverse());
        

        // yScale
        const x = d3.scalePoint(keystodraw, [0, width]);

        const colorScale = d3.scaleOrdinal()
            //.domain(selectedItems)
            .domain(["Caribbean", "Central America", "North America", "South America",
                    "East Asia", "South Asia","Southeast Asia",
                    "Eastern Africa", "Middle Africa", "Southern Africa", "Western Africa",
                    "Eastern Europe", "Southern Europe", "Northern Europe", "Western Europe",
                    "Northern Africa",  "Caucasus and Central Asia","Middle East"])
            .range(["#20B2AA","#5F9EA0","#008B8B","#008080", //cyan
                    "#4169E1", "#0000FF", "#0000CD", //blue
                    "#CD5C5C", "#DC143C", "#B22222", "#FF0000", //red
                    "#7FFF00","#32CD32","#00FF00","#228B22", // green
                    "#FF8C00", "#FFA500", "#FFD700" //orange
            ])
            //.range(d3.schemeTableau10)
            ;
    
        // Draw the horizontal lines with names and scales
        
        const x0 = d3.axisLeft(y.get('Fatalities (% of total)')).tickFormat(d3.format("d"));
        const x1 = d3.axisLeft(y.get('Conflicts (% of total)')).tickFormat(d3.format("d"));
        const x8 = d3.axisLeft(y.get('Fatalities (Average % of country population per 1000)')).tickFormat(d3.format("d"));
        const x9 = d3.axisLeft(y.get('Conflicts (Average % of country participation in the region)')).tickFormat(d3.format("d"));
        const x15 = d3.axisLeft(y.get('Population growth (Mean annual %)')).tickFormat(d3.format(".2n"));
        const x10 = d3.axisLeft(y.get('Individuals using the Internet (Mean % of population)')).tickFormat(d3.format("d"));
        //const x11 = d3.axisLeft(y.get('Mobile cellular subscriptions (Mean per 10 million)')).tickFormat(d3.format(".2n"));
        //const x12 = d3.axisLeft(y.get('International tourism, number of arrivals (Mean per 10 million)')).tickFormat(d3.format(".2n"));
        //const x13 = d3.axisLeft(y.get('International tourism, number of departures (Mean per 10 million)')).tickFormat(d3.format(".2n"));
        const x14 = d3.axisLeft(y.get('Mortality rate, under-5 (Mean per 1,000 live births)')).tickFormat(d3.format(".2n"));
        const x2 = d3.axisLeft(y.get('Control of Corruption (Mean)')).tickFormat(d3.format(".2n"));
        const x3 = d3.axisLeft(y.get('Government Effectiveness (Mean)')).tickFormat(d3.format(".2n"));
        const x4 = d3.axisLeft(y.get('Political Stability and Absence of Violence/Terrorism (Mean)')).tickFormat(d3.format(".2n"));
        const x5 = d3.axisLeft(y.get('Regulatory Quality (Mean)')).tickFormat(d3.format(".2n"));
        const x6 = d3.axisLeft(y.get('Rule of Law (Mean)')).tickFormat(d3.format(".2n"));
        const x7 = d3.axisLeft(y.get('Voice and Accountability (Mean)')).tickFormat(d3.format(".2n"));
   

        g.append("g").attr("transform", "translate(" + x('Fatalities (% of total)') + ")").call(x0);
        g.append("g").attr("transform", "translate(" + x('Conflicts (% of total)') + ")").call(x1);
        g.append("g").attr("transform", "translate(" + x('Fatalities (Average % of country population per 1000)') + ")").call(x8);
        g.append("g").attr("transform", "translate(" + x('Conflicts (Average % of country participation in the region)') + ")").call(x9);
        g.append("g").attr("transform", "translate(" + x('Population growth (Mean annual %)') + ")").call(x15);
        g.append("g").attr("transform", "translate(" + x('Individuals using the Internet (Mean % of population)') + ")").call(x10);
        //g.append("g").attr("transform", "translate(" + x('Mobile cellular subscriptions (Mean per 10 million)') + ")").call(x11);
        //g.append("g").attr("transform", "translate(" + x('International tourism, number of arrivals (Mean per 10 million)') + ")").call(x12);
        //g.append("g").attr("transform", "translate(" + x('International tourism, number of departures (Mean per 10 million)') + ")").call(x13);
        g.append("g").attr("transform", "translate(" + x('Mortality rate, under-5 (Mean per 1,000 live births)') + ")").call(x14);
        g.append("g").attr("transform", "translate(" + x('Control of Corruption (Mean)') + ")").call(x2);
        g.append("g").attr("transform", "translate(" + x('Government Effectiveness (Mean)') + ")").call(x3);
        g.append("g").attr("transform", "translate(" + x('Political Stability and Absence of Violence/Terrorism (Mean)') + ")").call(x4);
        g.append("g").attr("transform", "translate(" + x('Regulatory Quality (Mean)') + ")").call(x5);
        g.append("g").attr("transform", "translate(" + x('Rule of Law (Mean)') + ")").call(x6);
        g.append("g").attr("transform", "translate(" + x('Voice and Accountability (Mean)') + ")").call(x7);
     
        
     

        //Write horizontal lines with variable names and values
        g.append("g")
        .selectAll("g")
        .data(keystodraw)
        .join("g")
        .attr("transform", d => `translate(${x(d)})`)
        .each(function(d) { d3.select(this)
            
        })
        .call(g => g.append("text")
            .attr("x", 0)
            .attr("y", -120)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "central")
            .attr("fill", "currentColor")
            .text(d => d)
            .call(wrap, 30))
        .call(g => g.selectAll("text")
            .clone(true).lower()
            .attr("fill", "none")
            .attr("stroke-width", 10) 
            .attr("stroke-linejoin", "round")
            .attr("stroke", "white"))
        ;

        const line = d3.line()
            .defined(([, value]) => value != null)
            .y(([key, value]) => y.get(key)(value))
            .x(([key]) => x(key));
            
        //Giving the group of paths a class name allows you to select it later on.
        //Important is that the event listeners are specified on the path elements. not the group element.
        g.append("g").attr("class", "continent-paths1")
            .selectAll("path")
            .data(dataFilter)
            .enter().append("path")
            .attr("d", d => line(d3.cross(keystodraw, [d], (key, d) => [key, d[key]])))
            .attr("stroke", function (d){return colorScale(d.region)})
            .attr("stroke-width", 3.5)
            .attr("stroke-opacity", 0.4)
            .attr("fill", "none")
            .on("mouseover", hover_in1)  // functions are below.
            .on("mouseleave", hover_out);

        d3.select("#selectButton").on("change", function(d) {
            // recover the option that has been chosen
            selectedYear = d3.select(this).property("value")
            //console.log("Button 1", selectedYear)
            dataFilter = data.filter(d => 
                selectedItems.includes(d["continent"]) && d["year"]==selectedYear
            ).slice()
            .sort((a, b) => d3.ascending(a[colorKey], b[colorKey]));
            update(dataFilter);
        })
        d3.select("#update").on("click", function(d) {
            // recover the option that has been chosen
            selectedItems = updateRegionSelection() 
            //console.log("Checkbox Update 1",selectedItems)
            dataFilter = data.filter(d => 
                selectedItems.includes(d["continent"]) && d["year"]==selectedYear
            ).slice()
            .sort((a, b) => d3.ascending(a[colorKey], b[colorKey]));
            update(dataFilter);
        })

        function update(data) {

            d3.select(".continent-paths1").selectAll("path")
                .data(data)
                .join("path")
                .attr("d", d => line(d3.cross(keystodraw, [d], (key, d) => [key, d[key]])))
                .attr("stroke", function (d){return colorScale(d.region)})
                .attr("stroke-width", 3.5)
                .attr("stroke-opacity", 0.4)
                .attr("fill", "none")
                .on("mouseover", hover_in1)  // functions are below.
                .on("mouseleave", hover_out);
        
        }

        function hover_out() {

            // Reverse everything again like it was before hovering.
            d3.select(".continent-paths1").selectAll("path")
                .attr("stroke", function (d){return colorScale(d.region)})
                .attr("stroke-width", 3.5)
                .attr("stroke-opacity", 0.4);

            d3.select(".continent-paths2").selectAll("path")
                .attr("stroke", function (d){return colorScale(d.region)})
                .attr("stroke-width", 3.5)
                .attr("stroke-opacity", 0.4);

                div.transition()		
                .duration(500)		
                .style("opacity", 0);

            // Empty table values -- if wanted
            // const variables = Object.keys(event.target.__data__); 
            // variables.shift() // remove variable "year"
            // variables.shift() // remove variable "year"
            // variables.shift() // remove variable "year"
            // table.selectAll("td.table-column-2")
            //     .data(variables)
            //     .join("td")
            //         .html("");

        }
    });     


function hover_in1() {

    // If you want to change all path elements generated by the line function.
    // make sure you only select all path elements within the country-paths group.
    d3.select(".continent-paths1").selectAll("path").attr("stroke", "lightgray");

    d3.select(".continent-paths2").selectAll("path").attr("stroke", "lightgray");

    // The this keyword allows you to obtain the element you select as an object.
    //console.log(this);
    // You can simply change the attributes of this DOM element as follows.
    d3.select(this).attr("stroke", "black");
    
    // Table -- update values
    const variables = Object.keys(event.target.__data__); 
    variables.shift() // remove variable "year"
    variables.shift() // remove variable "continent"
    variables.shift() // remove variable "region"

    table.selectAll("td.table-column-2")
        .data(variables)
        .join("td")
            .html(d => event.target.__data__[d]);

    // Tooltip
    // Via the event keyword, you can obtain the coordinates of your mouse, 
    // and the data stored in the selected element.
    //console.log(event); 
    div.transition()		
        .duration(200)		
        .style("opacity", .9);		
    div.html("<strong>" + event.target.__data__.year + "</strong>" + "<br/>" +
            "<strong>" + event.target.__data__.continent + "</strong>" + "<br/>" + 
            "<strong>" + event.target.__data__.region + "</strong>"
        // "Fatalities (%): " + event.target.__data__["Fatalities (% of total)"]+ "<br/>" + 
        // "Fatalities (mean): " + event.target.__data__["Fatalities (Average % of country population per 1000)"]  + "<br/>" + 
        // "Conflicts (%): " + event.target.__data__["Conflicts (% of total)"] + "<br/>" + 
        // "Conflicts (mean): " + event.target.__data__["Conflicts (Average % of country participation in the region)"] + "<br/>" +         
        // "Pop.Growth: " + event.target.__data__["Population growth (Mean annual %)"] + "<br/>" + 
        // "Internet: " + event.target.__data__["Individuals using the Internet (Mean % of population)"]+ "<br/>" + 
        // "Mobile: " + event.target.__data__["Mobile cellular subscriptions (Mean per 10 million)"]+ "<br/>" + 
        // "Arrivals: " + event.target.__data__["International tourism, number of arrivals (Mean per 10 million)"]+ "<br/>" + 
        // "Departures: " + event.target.__data__["International tourism, number of departures (Mean per 10 million)"]+ "<br/>" + 
        // "Mortality: " + event.target.__data__["Mortality rate, under-5 (Mean per 1,000 live births)"]+ "<br/>" + 
        // "Corruption: " + event.target.__data__["Control of Corruption (Mean)"]+ "<br/>" + 
        // "Effectiveness: " + event.target.__data__["Government Effectiveness (Mean)"]+ "<br/>" + 
        // "Political Stability: " + event.target.__data__["Political Stability and Absence of Violence/Terrorism (Mean)"]+ "<br/>" + 
        // "Rule of Law: " + event.target.__data__["Rule of Law (Mean)"]+ "<br/>" + 
        // "Reg.Quality: " + event.target.__data__["Regulatory Quality (Mean)"]+ "<br/>" + 
        // "Voice Accountab: " + event.target.__data__["Voice and Accountability (Mean)"]
            )	
        .style("left", (event.pageX + 10) + "px")		
        .style("top", (event.pageY - 10) + "px");	
}

function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
            }
        }
    });
}