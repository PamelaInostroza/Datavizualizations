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

// Loading the data
d3.csv('./assets/ParallelCoordinates1.csv', d => {
    // Make sure that numbers are interpreted as numbers and not strings
    return {
        year: d.year,
        //country: d.country,
        continent: d.continent,
        region: d.region,
        "Conflicts (% of world total per 10)": +d["Conflicts (% of world total per 10)"],
        "Fatalities (% of population per 1000)": +d["Fatalities (% of population per 1000)"],
        "Control of Corruption": +d["Control of Corruption"],
        "Government Effectiveness": +d["Government Effectiveness"],
        "Political Stability and Absence of Violence/Terrorism": +d["Political Stability and Absence of Violence/Terrorism"],
        "Regulatory Quality": +d["Regulatory Quality"],
        "Rule of Law": +d["Rule of Law"],
        "Voice and Accountability": +d["Voice and Accountability"]

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
        x.get('Fatalities (% of population per 1000)').domain(x.get('Fatalities (% of population per 1000)').domain().reverse());
        x.get('Conflicts (% of world total per 10)').domain(x.get('Conflicts (% of world total per 10)').domain().reverse());
        

        // yScale
        const y = d3.scalePoint(keystodraw, [0, height]);

        const colorScale = d3.scaleOrdinal()
            .domain(selectedItems)
            .range(d3.schemeTableau10);
    
        // Draw the horizontal lines with names and scales
        
        const x0 = d3.axisBottom(x.get('Fatalities (% of population per 1000)')).tickFormat(d3.format("d"));
        const x1 = d3.axisBottom(x.get('Conflicts (% of world total per 10)')).tickFormat(d3.format("d"));
        const x2 = d3.axisBottom(x.get('Control of Corruption')).tickFormat(d3.format(".2n"));
        const x3 = d3.axisBottom(x.get('Government Effectiveness')).tickFormat(d3.format(".2n"));
        const x4 = d3.axisBottom(x.get('Political Stability and Absence of Violence/Terrorism')).tickFormat(d3.format(".2n"));
        const x5 = d3.axisBottom(x.get('Regulatory Quality')).tickFormat(d3.format(".2n"));
        const x6 = d3.axisBottom(x.get('Rule of Law')).tickFormat(d3.format(".2n"));
        const x7 = d3.axisBottom(x.get('Voice and Accountability')).tickFormat(d3.format(".2n"));
        
        g.append("g").attr("transform", "translate(0," + y('Fatalities (% of population per 1000)') + ")").call(x0);
        g.append("g").attr("transform", "translate(0," + y('Conflicts (% of world total per 10)') + ")").call(x1);
        g.append("g").attr("transform", "translate(0," + y('Control of Corruption') + ")").call(x2);
        g.append("g").attr("transform", "translate(0," + y('Government Effectiveness') + ")").call(x3);
        g.append("g").attr("transform", "translate(0," + y('Political Stability and Absence of Violence/Terrorism') + ")").call(x4);
        g.append("g").attr("transform", "translate(0," + y('Regulatory Quality') + ")").call(x5);
        g.append("g").attr("transform", "translate(0," + y('Rule of Law') + ")").call(x6);
        g.append("g").attr("transform", "translate(0," + y('Voice and Accountability') + ")").call(x7);
        
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
        g.append("g").attr("class", "continent-paths")
            .selectAll("path")
            .data(dataFilter)
            .enter().append("path")
            .attr("d", d => line(d3.cross(keystodraw, [d], (key, d) => [key, d[key]])))
            .attr("stroke", function (d){return colorScale(d.region)})
            .attr("stroke-width", 3.5)
            .attr("stroke-opacity", 0.4)
            .attr("fill", "none")
            .on("mouseover", hover_in)  // functions are below.
            .on("mouseleave", hover_out);

        d3.select("#selectButton").on("change", function(d) {
            // recover the option that has been chosen
            selectedYear = d3.select(this).property("value")
            console.log("Button", selectedYear)
            dataFilter = data.filter(d => 
                selectedItems.includes(d["continent"]) && d["year"]==selectedYear
            ).slice()
            .sort((a, b) => d3.ascending(a[colorKey], b[colorKey]));
            update(dataFilter);
        })
        d3.select("#update").on("click", function(d) {
            // recover the option that has been chosen
            selectedItems = updateRegionSelection() 
            console.log("Checkbox Update",selectedItems)
            dataFilter = data.filter(d => 
                selectedItems.includes(d["continent"]) && d["year"]==selectedYear
            ).slice()
            .sort((a, b) => d3.ascending(a[colorKey], b[colorKey]));
            update(dataFilter);
        })

        function update(data) {

            d3.select(".continent-paths").selectAll("path")
                .data(data)
                .join("path")
                .attr("d", d => line(d3.cross(keystodraw, [d], (key, d) => [key, d[key]])))
                .attr("stroke", function (d){return colorScale(d.region)})
                .attr("stroke-width", 3.5)
                .attr("stroke-opacity", 0.4)
                .attr("fill", "none")
                .on("mouseover", hover_in)  // functions are below.
                .on("mouseleave", hover_out);
        
        }

                
        function hover_out() {

            // Reverse everything again like it was before hovering.
            d3.select(".continent-paths").selectAll("path")
                .attr("stroke", function (d){return colorScale(d.region)})
                .attr("stroke-width", 1.5)
                .attr("stroke-opacity", 0.4);

            div.transition()		
                .duration(500)		
                .style("opacity", 0);
        }
    });     
    
   