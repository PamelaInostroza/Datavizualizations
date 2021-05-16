//Global state
const margin = {top: 40, right: 10, bottom: 30, left: 10},
width = 400 - margin.left - margin.right,
height = 500 - margin.top - margin.bottom;


// Create SVG and group element
const svg = d3.select("#parallel1")
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


let selectedItems = updateRegionSelection();

// Loading the data
d3.csv('./assets/ParallelCoordinates1.csv', d => {
    // Make sure that numbers are interpreted as numbers and not strings
    return {
        year: d.year,
        //country: d.country,
        continent: d.continent,
        region: d.region,
        "Fatalities (% of total)": +d["Fatalities (% of total)"],
        "Conflicts (% of total)": +d["Conflicts (% of total)"],
        "Control of Corruption (Mean)": +d["Control of Corruption (Mean)"],
        "Government Effectiveness (Mean)": +d["Government Effectiveness (Mean)"],
        "Political Stability and Absence of Violence/Terrorism (Mean)": +d["Political Stability and Absence of Violence/Terrorism (Mean)"],
        "Regulatory Quality (Mean)": +d["Regulatory Quality (Mean)"],
        "Rule of Law (Mean)": +d["Rule of Law (Mean)"],
        "Voice and Accountability (Mean)": +d["Voice and Accountability (Mean)"]

    }
    }).then(data => {

        let dataFilter = data.filter(function(d) { 
            if(selectedItems.includes(d["continent"]) && d["year"]==selectedYear)
            { 
                return d;
            } 
        })

        const keystodraw = data.columns.filter(function(d) {
            return d !== "" && d !== "year" && d !== "continent" && d !== "region";
        });
    
        console.log(dataFilter);
        console.log(keystodraw);

        // xScale
        const x = new Map(
            Array.from(keystodraw, 
                key => [
                    key, 
                    d3.scaleLinear()
                    .domain(d3.extent(data, d=>d[key]))
                    .range([0, width])
                    .nice()
                ]
            )
        );
        x.get('Fatalities (% of total)').domain(x.get('Fatalities (% of total)').domain().reverse());
        x.get('Conflicts (% of total)').domain(x.get('Conflicts (% of total)').domain().reverse());
        

        // yScale
        const y = d3.scalePoint(keystodraw, [0, height]);

        const colorScale = d3.scaleOrdinal()
            .domain(selectedItems)
            .range(["#7FFF00","#32CD32","#00FF00","#228B22", // green
                    "#CD5C5C", "#DC143C", "#B22222", "#FF0000", "#8B0000", //red
                    "#20B2AA","#5F9EA0","#008B8B","#008080", //cyan
                    "#4169E1", "#0000FF", "#0000CD", "#00008B","#000080" //blue
            ])
            //.range(d3.schemeTableau10)
            ;
    
        // Draw the horizontal lines with names and scales
        
        const x0 = d3.axisBottom(x.get('Fatalities (% of total)')).tickFormat(d3.format("d"));
        const x1 = d3.axisBottom(x.get('Conflicts (% of total)')).tickFormat(d3.format("d"));
        const x2 = d3.axisBottom(x.get('Control of Corruption (Mean)')).tickFormat(d3.format(".2n"));
        const x3 = d3.axisBottom(x.get('Government Effectiveness (Mean)')).tickFormat(d3.format(".2n"));
        const x4 = d3.axisBottom(x.get('Political Stability and Absence of Violence/Terrorism (Mean)')).tickFormat(d3.format(".2n"));
        const x5 = d3.axisBottom(x.get('Regulatory Quality (Mean)')).tickFormat(d3.format(".2n"));
        const x6 = d3.axisBottom(x.get('Rule of Law (Mean)')).tickFormat(d3.format(".2n"));
        const x7 = d3.axisBottom(x.get('Voice and Accountability (Mean)')).tickFormat(d3.format(".2n"));
        
        
        g.append("g").attr("transform", "translate(0," + y('Fatalities (% of total)') + ")").call(x0);
        g.append("g").attr("transform", "translate(0," + y('Conflicts (% of total)') + ")").call(x1);
        g.append("g").attr("transform", "translate(0," + y('Control of Corruption (Mean)') + ")").call(x2);
        g.append("g").attr("transform", "translate(0," + y('Government Effectiveness (Mean)') + ")").call(x3);
        g.append("g").attr("transform", "translate(0," + y('Political Stability and Absence of Violence/Terrorism (Mean)') + ")").call(x4);
        g.append("g").attr("transform", "translate(0," + y('Regulatory Quality (Mean)') + ")").call(x5);
        g.append("g").attr("transform", "translate(0," + y('Rule of Law (Mean)') + ")").call(x6);
        g.append("g").attr("transform", "translate(0," + y('Voice and Accountability (Mean)') + ")").call(x7);
        
        //Write horizontal lines with variable names and values
        g.append("g")
        .selectAll("g")
        .data(keystodraw)
        .join("g")
        .attr("transform", d => `translate(0,${y(d)})`)
        .each(function(d) { d3.select(this)
        })
        .call(g => g.append("text")
            .attr("x", width/2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .attr("fill", "currentColor")
            .text(d => d))
        .call(g => g.selectAll("text")
            .clone(true).lower()
            .attr("fill", "none")
            .attr("stroke-width", 5) 
            .attr("stroke-linejoin", "round")
            .attr("stroke", "white")
            );

        const line = d3.line()
            .defined(([, value]) => value != null)
            .x(([key, value]) => x.get(key)(value))
            .y(([key]) => y(key));

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
            console.log("Button 1", selectedYear)
            dataFilter = data.filter(d => 
                selectedItems.includes(d["continent"]) && d["year"]==selectedYear
            ).slice()
            .sort((a, b) => d3.ascending(a[colorKey], b[colorKey]));
            update(dataFilter);
        })
        d3.select("#update").on("click", function(d) {
            // recover the option that has been chosen
            selectedItems = updateRegionSelection() 
            console.log("Checkbox Update 1",selectedItems)
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


        }
    });     


function hover_in1() {

    // If you want to change all path elements generated by the line function.
    // make sure you only select all path elements within the country-paths group.
    d3.select(".continent-paths1").selectAll("path").attr("stroke", "lightgray");

    d3.select(".continent-paths2").selectAll("path").attr("stroke", "lightgray");

    // The this keyword allows you to obtain the element you select as an object.
    console.log(this);
    // You can simply change the attributes of this DOM element as follows.
    d3.select(this).attr("stroke", "red").attr("stroke-width", 2.5)
    ;
   

    // Tooltip
    // Via the event keyword, you can obtain the coordinates of your mouse, 
    // and the data stored in the selected element.
    console.log(event); 
    div.transition()		
        .duration(200)		
        .style("opacity", .9);		
    div.html("<strong>" + event.target.__data__.region + "</strong>" + "<br/>" + 
        "Fatalities (%): " + event.target.__data__["Fatalities (% of total)"]+ "<br/>" + 
        "Conflicts (%): " + event.target.__data__["Conflicts (% of total)"] + "<br/>" + 
        "Corruption: " + event.target.__data__["Control of Corruption (Mean)"]+ "<br/>" + 
        "Effectiveness: " + event.target.__data__["Government Effectiveness (Mean)"]+ "<br/>" + 
        "Political Stability: " + event.target.__data__["Political Stability and Absence of Violence/Terrorism (Mean)"]+ "<br/>" + 
        "Rule of Law: " + event.target.__data__["Rule of Law (Mean)"]+ "<br/>" + 
        "Reg.Quality: " + event.target.__data__["Regulatory Quality (Mean)"]+ "<br/>" + 
        "Voice Accountab: " + event.target.__data__["Voice and Accountability (Mean)"]
            )	
        .style("left", (event.pageX + 10) + "px")		
        .style("top", (event.pageY - 10) + "px");	
}

