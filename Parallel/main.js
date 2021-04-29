//Global state
const margin = {top: 40, right: 10, bottom: 30, left: 10},
width = 800 - margin.left - margin.right,
height = 600 - margin.top - margin.bottom;

let selectedYear = 2020
const colorKey = "region";

let selectedItems = updateRegionSelection();

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

// Loading the data
d3.csv('./assets/ParallelCoordinatesVisCat.csv', d => {
    // Make sure that numbers are interpreted as numbers and not strings
    return {
        year: d.year,
        country: d.country,
        region: d.region,
        ConflictsName: d.ConflictsName,
        FatalitiesName: d.FatalitiesName,
        "Conflicts": +d["Conflicts"],
        "Fatalities": +d["Fatalities"],
        "Control of Corruption": +d["Control of Corruption"],
        "Government Effectiveness": +d["Government Effectiveness"],
        "Political Stability and Absence of Violence/Terrorism": +d["Political Stability and Absence of Violence/Terrorism"],
        "Regulatory Quality": +d["Regulatory Quality"],
        "Rule of Law": +d["Rule of Law"]
    }
    }).then(data => {

        let dataFilter = data.filter(function(d) { 
            if(selectedItems.includes(d["region"]) && d["year"]==selectedYear)
            { 
                return d;
            } 
        })

        const keystodraw = data.columns.filter(function(d) {
            return d !== "" && d !== "year" && d !== "country" && d !== "region" && d != "ConflictsName" && d != "FatalitiesName";
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
        
        // yScale
        const y = d3.scalePoint(keystodraw, [0, height]);

        const colorScale = d3.scaleOrdinal()
            .domain(selectedItems)
            .range(d3.schemeTableau10);
    
        // Draw the horizontal lines with names and scales
        
        const x6 = d3.axisBottom(x.get('Fatalities')).tickFormat(d3.format("d"));
        const x5 = d3.axisBottom(x.get('Conflicts')).tickFormat(d3.format("d"));
        const x0 = d3.axisBottom(x.get('Control of Corruption')).tickFormat(d3.format(".2n"));
        const x1 = d3.axisBottom(x.get('Government Effectiveness')).tickFormat(d3.format(".2n"));
        const x2 = d3.axisBottom(x.get('Political Stability and Absence of Violence/Terrorism')).tickFormat(d3.format(".2n"));
        const x3 = d3.axisBottom(x.get('Regulatory Quality')).tickFormat(d3.format(".2n"));
        const x4 = d3.axisBottom(x.get('Rule of Law')).tickFormat(d3.format(".2n"));

        g.append("g").attr("transform", "translate(0," + y('Control of Corruption') + ")").call(x0);
        g.append("g").attr("transform", "translate(0," + y('Government Effectiveness') + ")").call(x1);
        g.append("g").attr("transform", "translate(0," + y('Political Stability and Absence of Violence/Terrorism') + ")").call(x2);
        g.append("g").attr("transform", "translate(0," + y('Regulatory Quality') + ")").call(x3);
        g.append("g").attr("transform", "translate(0," + y('Rule of Law') + ")").call(x4);
        g.append("g").attr("transform", "translate(0," + y('Conflicts') + ")").call(x5);
        g.append("g").attr("transform", "translate(0," + y('Fatalities') + ")").call(x6);
        
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
        g.append("g").attr("class", "country-paths")
            .selectAll("path")
            .data(dataFilter)
            .enter().append("path")
            .attr("d", d => line(d3.cross(keystodraw, [d], (key, d) => [key, d[key]])))
            .attr("stroke", function (d){return colorScale(d.region)})
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.4)
            .attr("fill", "none")
            .on("mouseover", hover_in)  // functions are below.
            .on("mouseleave", hover_out);

        d3.select("#selectButton").on("change", function(d) {
            // recover the option that has been chosen
            selectedYear = d3.select(this).property("value")
            console.log("Button", selectedYear)
            dataFilter = data.filter(d => 
                selectedItems.includes(d["region"]) && d["year"]==selectedYear
            ).slice()
            .sort((a, b) => d3.ascending(a[colorKey], b[colorKey]));
            update(dataFilter);
        })
        d3.select("#update").on("click", function(d) {
            // recover the option that has been chosen
            selectedItems = updateRegionSelection() 
            console.log("Checkbox Update",selectedItems)
            dataFilter = data.filter(d => 
                selectedItems.includes(d["region"]) && d["year"]==selectedYear
            ).slice()
            .sort((a, b) => d3.ascending(a[colorKey], b[colorKey]));
            update(dataFilter);
        })

        function update(data) {

            d3.select(".country-paths").selectAll("path")
                .data(data)
                .join("path")
                .attr("d", d => line(d3.cross(keystodraw, [d], (key, d) => [key, d[key]])))
                .attr("stroke", function (d){return colorScale(d.region)})
                .attr("stroke-width", 1.5)
                .attr("stroke-opacity", 0.4)
                .attr("fill", "none")
                .on("mouseover", hover_in)  // functions are below.
                .on("mouseleave", hover_out);
        
        }
    });     
    
    

// Functions
function updateRegionSelection() {  
        let checkboxes = document.getElementsByName("region");  
        let numberOfCheckedItems = 0;  
        let selectedItems=[];
        for(var i = 0; i < checkboxes.length; i++)  
        {  
            if(checkboxes[i].checked == true)  {
                numberOfCheckedItems++;       
                selectedItems = selectedItems.concat(checkboxes[i].value);
            }  
        }
        return selectedItems;
    }

function hover_in() {

    // If you want to change all path elements generated by the line function.
    // make sure you only select all path elements within the country-paths group.
    d3.select(".country-paths").selectAll("path").attr("stroke", "lightgray");

    // The this keyword allows you to obtain the element you select as an object.
    console.log(this);
    // You can simply change the attributes of this DOM element as follows.
    d3.select(this).attr("stroke", "red").attr("stroke-width", 2.5);

    // Tooltip
    // Via the event keyword, you can obtain the coordinates of your mouse, 
    // and the data stored in the selected element.
    console.log(event); 
    div.transition()		
        .duration(200)		
        .style("opacity", .9);		
    div.html(event.target.__data__.country + "<br/>" + 
            "Conflicts: " + event.target.__data__.ConflictsName + "<br/>" + 
            "Fatalities: " + event.target.__data__.FatalitiesName)	
        .style("left", (event.pageX + 10) + "px")		
        .style("top", (event.pageY - 10) + "px");	

}

function hover_out() {

    // Reverse everything again like it was before hovering.
    d3.select(".country-paths").selectAll("path")
        //.attr("stroke", function (d){return colorScale(d.region)})
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.4);

    div.transition()		
        .duration(500)		
        .style("opacity", 0);
}
