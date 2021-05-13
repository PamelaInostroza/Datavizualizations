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
d3.csv('./assets/ParallelCoordinates2.csv', d2 => {
    // Make sure that numbers are interpreted as numbers and not strings
    return {
        year: d2.year,
        //country: d2.country,
        continent: d2.continent,
        region: d2.region,
        "Fatalities (Average % of country population per 1000)": +d2["Fatalities (Average % of country population per 1000)"],
        "Conflicts (Average % of country participation in the region)": +d2["Conflicts (Average % of country participation in the region)"],
        "Individuals using the Internet (Mean % of population)": +d2["Individuals using the Internet (Mean % of population)"], 
        "Mobile cellular subscriptions (Mean per 10 million)": +d2["Mobile cellular subscriptions (Mean per 10 million)"], 
        "International tourism, number of arrivals (Mean per 10 million)": +d2["International tourism, number of arrivals (Mean per 10 million)"], 
        "International tourism, number of departures (Mean per 10 million)": +d2["International tourism, number of departures (Mean per 10 million)"], 
        "Mortality rate, under-5 (Mean per 1,000 live births)": +d2["Mortality rate, under-5 (Mean per 1,000 live births)"], 
        "Population growth (Mean annual %)": +d2["Population growth (Mean annual %)"]
    }
    }).then(data2 => {

        let dataFilter2 = data2.filter(function(d2) { 
            if(selectedItems.includes(d2["continent"]) && d2["year"]==selectedYear)
            { 
                return d2;
            } 
        })

        const keystodraw = data2.columns.filter(function(d2) {
            return d2 !== "" && d2 !== "year" && d2 !== "continent" && d2 !== "region";
        });
    
        console.log(dataFilter2);
        console.log(keystodraw);

        // xScale
        const x = new Map(
            Array.from(keystodraw, 
                key2 => [
                    key2, 
                    d3.scaleLinear()
                    .domain(d3.extent(data2, d2=>d2[key2]))
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
        const x0 = d3.axisBottom(x.get('Fatalities (Average % of country population per 1000)')).tickFormat(d3.format("d"));
        const x1 = d3.axisBottom(x.get('Conflicts (Average % of country participation in the region)')).tickFormat(d3.format("d"));

        
        const x2 = d3.axisBottom(x.get('Individuals using the Internet (Mean % of population)')).tickFormat(d3.format(".2n"));
        const x3 = d3.axisBottom(x.get('Mobile cellular subscriptions (Mean per 10 million)')).tickFormat(d3.format(".2n"));
        const x4 = d3.axisBottom(x.get('International tourism, number of arrivals (Mean per 10 million)')).tickFormat(d3.format(".2n"));
        const x5 = d3.axisBottom(x.get('International tourism, number of departures (Mean per 10 million)')).tickFormat(d3.format(".2n"));
        const x6 = d3.axisBottom(x.get('Mortality rate, under-5 (Mean per 1,000 live births)')).tickFormat(d3.format(".2n"));
        const x7 = d3.axisBottom(x.get('Population growth (Mean annual %)')).tickFormat(d3.format(".2n"));

        g2.append("g").attr("transform", "translate(0," + y('Individuals using the Internet (Mean % of population)') + ")").call(x2);
        g2.append("g").attr("transform", "translate(0," + y('Mobile cellular subscriptions (Mean per 10 million)') + ")").call(x3);
        g2.append("g").attr("transform", "translate(0," + y('International tourism, number of arrivals (Mean per 10 million)') + ")").call(x4);
        g2.append("g").attr("transform", "translate(0," + y('International tourism, number of departures (Mean per 10 million)') + ")").call(x5);
        g2.append("g").attr("transform", "translate(0," + y('Mortality rate, under-5 (Mean per 1,000 live births)') + ")").call(x6);
        g2.append("g").attr("transform", "translate(0," + y('Population growth (Mean annual %)') + ")").call(x7);
        
        g2.append("g").attr("transform", "translate(0," + y('Conflicts (Average % of country participation in the region)') + ")").call(x1);
        g2.append("g").attr("transform", "translate(0," + y('Fatalities (Average % of country population per 1000)') + ")").call(x0);
        
        //Write horizontal lines with variable names and values
        g2.append("g")
        .selectAll("g")
        .data(keystodraw)
        .join("g")
        .attr("transform", d2 => `translate(0,${y(d2)})`)
        .each(function(d2) { d3.select(this)
        })
        .call(g2 => g2.append("text")
            .attr("x", width2/2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .attr("fill", "currentColor")
            .text(d2 => d2))
        .call(g2 => g2.selectAll("text")
            .clone(true).lower()
            .attr("fill", "none")
            .attr("stroke-width", 5) 
            .attr("stroke-linejoin", "round")
            .attr("stroke", "white")
            );

        const line = d3.line()
            .defined(([, value]) => value != null)
            .x(([key2, value]) => x.get(key2)(value))
            .y(([key2]) => y(key2));

        //Giving the group of paths a class name allows you to select it later on.
        //Important is that the event listeners are specified on the path elements. not the group element.
        g2.append("g").attr("class", "continent-paths2")
            .selectAll("path")
            .data(dataFilter2)
            .enter().append("path")
            .attr("d", d2 => line(d3.cross(keystodraw, [d2], (key2, d2) => [key2, d2[key2]])))
            .attr("stroke", function (d2){return colorScale(d2.region)})
            .attr("stroke-width", 3.5)
            .attr("stroke-opacity", 0.4)
            .attr("fill", "none")
            .on("mouseover", hover_in)  // functions are below.
            .on("mouseleave", hover_out);

        d3.select("#selectButton").on("change", function(d2) {
            // recover the option that has been chosen
            selectedYear = d3.select(this).property("value")
            console.log("Button 2", selectedYear)
            dataFilter2 = data2.filter(d2 => 
                selectedItems.includes(d2["continent"]) && d2["year"]==selectedYear
            ).slice()
            .sort((a, b) => d3.ascending(a[colorKey], b[colorKey]));
            update2(dataFilter2);
        })
        d3.select("#update").on("click", function(d2) {
            // recover the option that has been chosen
            selectedItems = updateRegionSelection() 
            console.log("Checkbox Update 2",selectedItems)
            dataFilter2 = data2.filter(d2 => 
                selectedItems.includes(d2["continent"]) && d2["year"]==selectedYear
            ).slice()
            .sort((a2, b2) => d3.ascending(a2[colorKey], b2[colorKey]));
            update2(dataFilter2);
        })

        function update2(data2) {

            d3.select(".continent-paths2").selectAll("path")
                .data(data2)
                .join("path")
                .attr("d", d2 => line(d3.cross(keystodraw, [d2], (key2, d2) => [key2, d2[key2]])))
                .attr("stroke", function (d2){return colorScale(d2.region)})
                .attr("stroke-width", 3.5)
                .attr("stroke-opacity", 0.4)
                .attr("fill", "none")
                .on("mouseover", hover_in)  // functions are below.
                .on("mouseleave", hover_out);
        
        }

                
        function hover_out() {

            // Reverse everything again like it was before hovering.
            d3.select(".continent-paths2").selectAll("path")
                .attr("stroke", function (d2){return colorScale(d2.region)})
                .attr("stroke-width", 3.5)
                .attr("stroke-opacity", 0.4);

            div2.transition()		
                .duration(500)		
                .style("opacity", 0);

            d3.select(".continent-paths1").selectAll("path")
                .attr("stroke", function (d2){return colorScale(d2.region)})
                .attr("stroke-width", 3.5)
                .attr("stroke-opacity", 0.4);
        }
    });     
  