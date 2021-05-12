//Global state
const margin2 = {top: 40, right: 10, bottom: 30, left: 10},
width2 = 400 - margin2.left - margin2.right,
height2 = 500 - margin2.top - margin2.bottom;

// Create SVG and group element
const svg2 = d3.select("#parallel2")
        .append("svg")
        .attr("width", width2 + margin2.left + margin2.right)
        .attr("height", height2 + margin2.top + margin2.bottom);
const g2 = svg2.append("g")
        .attr("transform",
            "translate(" + margin2.left + "," + margin2.top + ")");

// Tooltip
const div2 = d3.select("body").append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);

// Loading the data
d3.csv('./assets/ParallelCoordinates2.csv', d => {
    // Make sure that numbers are interpreted as numbers and not strings
    return {
        year: d.year,
        //country: d.country,
        continent: d.continent,
        region: d.region,
        "Conflicts (% of world total per 10)": +d["Conflicts (% of world total per 10)"],
        "Fatalities (% of population per 1000)": +d["Fatalities (% of population per 1000)"],
        "Individuals using the Internet (% of population)": +d["Individuals using the Internet (% of population)"], 
        "Mobile cellular subscriptions (per 10 million)": +d["Mobile cellular subscriptions (per 10 million)"], 
        "International tourism, number of arrivals (per 10 million)": +d["International tourism, number of arrivals (per 10 million)"], 
        "International tourism, number of departures (per 10 million)": +d["International tourism, number of departures (per 10 million)"], 
        "Mortality rate, under-5 (per 1,000 live births)": +d["Mortality rate, under-5 (per 1,000 live births)"], 
        "Population growth (annual %)": +d["Population growth (annual %)"]
    }
    }).then(data2 => {

        let dataFilter2 = data2.filter(function(d) { 
            if(selectedItems.includes(d["continent"]) && d["year"]==selectedYear)
            { 
                return d;
            } 
        })

        const keystodraw = data2.columns.filter(function(d) {
            return d !== "" && d !== "year" && d !== "continent" && d !== "region";
        });
    
        console.log(dataFilter2);
        console.log(keystodraw);

        // xScale
        const x = new Map(
            Array.from(keystodraw, 
                key => [
                    key, 
                    d3.scaleLinear()
                    .domain(d3.extent(data2, d=>d[key]))
                    .range([0, width2])
                    .nice()
                ]
            )
        );
       // x.get('Fatalities').domain(x.get('Fatalities').domain().reverse());
       // x.get('Conflicts').domain(x.get('Conflicts').domain().reverse());
        

        // yScale
        const y = d3.scalePoint(keystodraw, [0, height2]);

        const colorScale = d3.scaleOrdinal()
            .domain(selectedItems)
            .range(d3.schemeTableau10);
    
            
        // Draw the horizontal lines with names and scales
        const x0 = d3.axisBottom(x.get('Fatalities (% of population per 1000)')).tickFormat(d3.format("d"));
        const x1 = d3.axisBottom(x.get('Conflicts (% of world total per 10)')).tickFormat(d3.format("d"));

        
        const x2 = d3.axisBottom(x.get('Individuals using the Internet (% of population)')).tickFormat(d3.format(".2n"));
        const x3 = d3.axisBottom(x.get('Mobile cellular subscriptions (per 10 million)')).tickFormat(d3.format(".2n"));
        const x4 = d3.axisBottom(x.get('International tourism, number of arrivals (per 10 million)')).tickFormat(d3.format(".2n"));
        const x5 = d3.axisBottom(x.get('International tourism, number of departures (per 10 million)')).tickFormat(d3.format(".2n"));
        const x6 = d3.axisBottom(x.get('Mortality rate, under-5 (per 1,000 live births)')).tickFormat(d3.format(".2n"));
        const x7 = d3.axisBottom(x.get('Population growth (annual %)')).tickFormat(d3.format(".2n"));

        g2.append("g").attr("transform", "translate(0," + y('Individuals using the Internet (% of population)') + ")").call(x2);
        g2.append("g").attr("transform", "translate(0," + y('Mobile cellular subscriptions (per 10 million)') + ")").call(x3);
        g2.append("g").attr("transform", "translate(0," + y('International tourism, number of arrivals (per 10 million)') + ")").call(x4);
        g2.append("g").attr("transform", "translate(0," + y('International tourism, number of departures (per 10 million)') + ")").call(x5);
        g2.append("g").attr("transform", "translate(0," + y('Mortality rate, under-5 (per 1,000 live births)') + ")").call(x6);
        g2.append("g").attr("transform", "translate(0," + y('Population growth (annual %)') + ")").call(x7);
        
        g2.append("g").attr("transform", "translate(0," + y('Conflicts (% of world total per 10)') + ")").call(x1);
        g2.append("g").attr("transform", "translate(0," + y('Fatalities (% of population per 1000)') + ")").call(x0);
        
        //Write horizontal lines with variable names and values
        g2.append("g")
        .selectAll("g")
        .data(keystodraw)
        .join("g")
        .attr("transform", d => `translate(0,${y(d)})`)
        .each(function(d) { d3.select(this)
        })
        .call(g2 => g2.append("text")
            .attr("x", width2/2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .attr("fill", "currentColor")
            .text(d => d))
        .call(g2 => g2.selectAll("text")
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
        g2.append("g").attr("class", "continent-paths")
            .selectAll("path")
            .data(dataFilter2)
            .enter().append("path")
            .attr("d", d => line(d3.cross(keystodraw, [d], (key, d) => [key, d[key]])))
            .attr("stroke", function (d){return colorScale(d.region)})
            .attr("stroke-width", 3.5)
            .attr("stroke-opacity", 0.4)
            .attr("fill", "none")
            .on("mouseover", hover_in)  // functions are below.
            .on("mouseleave", hover_out);

        d3.select("#selectButton2").on("change", function(d) {
            // recover the option that has been chosen
            selectedYear = d3.select(this).property("value")
            console.log("Button", selectedYear)
            dataFilter2 = data2.filter(d => 
                selectedItems.includes(d["continent"]) && d["year"]==selectedYear
            ).slice()
            .sort((a, b) => d3.ascending(a[colorKey], b[colorKey]));
            update(dataFilter2);
        })
        d3.select("#update2").on("click", function(d) {
            // recover the option that has been chosen
            selectedItems = updateRegionSelection() 
            console.log("Checkbox Update",selectedItems)
            dataFilter2 = data.filter(d => 
                selectedItems.includes(d["continent"]) && d["year"]==selectedYear
            ).slice()
            .sort((a, b) => d3.ascending(a[colorKey], b[colorKey]));
            update(dataFilter2);
        })

        function update(data2) {

            d3.select(".continent-paths").selectAll("path")
                .data(data2)
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

            div2.transition()		
                .duration(500)		
                .style("opacity", 0);
        }
    });     
  