var salesData;
    var chartInnerDiv = '<div class="innerCont" style="overflow: auto;top:80px; left: -180px; height:91% ; Width:100% ;position: relative;overflow: hidden;"/>';
    var truncLengh = 30;
    var filter2;
    var sum_total_region;
    var sum_total_event;
    var sum_total_subevent;

    

    function Plot(chartData) {
        TransformChartData(chartData, chartOptions, 0);
        BuildPie("chart", chartData, chartOptions, 0)
       
    }

    function BuildPie(id, chartData, options, level) {
        
        var xVarName;
        var divisionRatio = 2.5;
        var legendoffset = (level == 0) ? 0 : -40;

        d3.selectAll("#" + id + " .innerCont").remove();
        $("#" + id).append(chartInnerDiv);
        chart = d3.select("#" + id + " .innerCont");
        

        var yVarName = options[0].yaxis;
        width = $(chart[0]).outerWidth(),
        height = $(chart[0]).outerHeight(),
        radius = Math.min(width, height) / divisionRatio;

        if (level == 1) {
            xVarName = options[0].xaxisl1;
        }
        else if (level == 2){
            xVarName = options[0].xaxisl2;
            
        }
        else {
            xVarName = options[0].xaxis;
        }

        var rcolor = d3.scale.ordinal().range(runningColors);

        arc = d3.svg.arc()
                .outerRadius(radius)
                .innerRadius(radius - 200);

        var arcOver = d3.svg.arc().outerRadius(radius + 20).innerRadius(radius - 180);

        chart = chart
                .append("svg")  //append svg element inside #chart
                .attr("width", width)    //set width
                .attr("height", height)  //set height
                .append("g")
                .attr("transform", "translate(" + (width / divisionRatio) + "," + ((height / divisionRatio) + 30) + ")");




        var pie = d3.layout.pie()
                    .sort(null)
                    .value(function (d) {
                        return d.Total;
                    });
                   

        var g = chart.selectAll(".arc")
                    .data(pie(runningData))
                    .enter().append("g")
                    .attr("class", "arc");

        var count = 0;

        var path = g.append("path")
                    .attr("d", arc)
                    .attr("id", function (d) { return "arc-" + (count++); })
                    .style("opacity", function (d) {
                        return d.data["op"];
                    });

        path.on("mouseenter", function (d) {
            d3.select(this)
                .attr("stroke", "white")
                .transition()
                .duration(200)
                .attr("d", arcOver)
                .attr("stroke-width", 1);
        })
         .on("mouseleave", function (d) {
             d3.select(this).transition()
                 .duration(200)
                 .attr("d", arc)
                 .attr("stroke", "none");
         })
         .on("click", function (d) {
             if (this._listenToEvents) {
                 // Reset inmediatelly
                 d3.select(this).attr("transform", "translate(0,0)")
                 // Change level on click if no transition has started
                 path.each(function () {
                     this._listenToEvents = false;
                 });
             }
             d3.selectAll("#" + id + " svg").remove();
             if (level == 2) {
               
                 TransformChartData(chartData, options, 0, d.data[xVarName]);
                 BuildPie(id, chartData, options, 0);
             }
             else if (level == 1){
                 

               TransformChartData(chartData, options, 2, d.data[xVarName]);
              BuildPie(id, chartData, options, 2);
                  
           
             }
             else {

                 var nonSortedChart = chartData

                 TransformChartData(nonSortedChart, options, 1, d.data[xVarName]);
                 BuildPie(id, nonSortedChart, options, 1);
             }

         });

        path.append("svg:title")
        .text(function (d) {
            return d.data["title"] + " (" + d.data[yVarName] + ")";
        });

        path.style("fill", function (d) {
            return rcolor(d.data[xVarName]);
        })
         .transition().duration(1000).attrTween("d", tweenIn).each("end", function () {
             this._listenToEvents = true;
         });

           g.append("text")
         .attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; })
         .attr("dy", ".35em")
         .style("text-anchor", "middle")
         .style("opacity", 1)
         .text(function (d) {
            
        
        if((d.data[yVarName] / sum_total_region) * 100 > 2 && level == 0 ){
            return Math.round((d.data[yVarName] /sum_total_region) * 100) + '%';

        } else if ((d.data[yVarName] / sum_total_event) * 100 > 2 && level == 1){
            return  Math.round((d.data[yVarName] /sum_total_event) * 100) + '%';

        } else if ((d.data[yVarName] / sum_total_subevent) * 100 > 2 && level == 2){
            return  Math.round((d.data[yVarName] /sum_total_subevent) * 100) + '%';


        }
        

         })




// Math.round((value / sum) * 100) + '%'

      

        count = 0;
        var legend = chart.selectAll(".legend")
            .data(runningData).enter()
            .append("g").attr("class", "legend")
            .attr("legend-id", function (d) {
                return count++;
            })
            .attr("transform", function (d, i) {
                return "translate(15," + (parseInt("-" + (runningData.length * 10)) + i * 28 + legendoffset) + ")";
            })
            .style("cursor", "pointer")
            .on("click", function () {
                var oarc = d3.select("#" + id + " #arc-" + $(this).attr("legend-id"));
                oarc.style("opacity", 0.3)
                .attr("stroke", "white")
                .transition()
                .duration(200)
                .attr("d", arcOver)
                .attr("stroke-width", 1);
                setTimeout(function () {
                    oarc.style("opacity", function (d) {
                        return d.data["op"];
                    })
                   .attr("d", arc)
                   .transition()
                   .duration(200)
                   .attr("stroke", "none");
                }, 1000);
            });

        var leg = legend.append("rect");

        leg.attr("x", width / 2.7)
            .attr("width", 18).attr("height", 18)
            .style("fill", function (d) {
                return rcolor(d[yVarName]);
            })
            .style("opacity", function (d) {
                return d["op"];
            });
        legend.append("text").attr("x", (width / 2.4) - 4)
            .attr("y", 9).attr("dy", ".35em")
            .style("text-anchor", "start").text(function (d) {
                return d.caption;
            });

        leg.append("svg:title")
        .text(function (d) {
            return d["title"] + " (" + d[yVarName] + ")";
        });

        function tweenOut(data) {
            data.startAngle = data.endAngle = (2 * Math.PI);
            var interpolation = d3.interpolate(this._current, data);
            this._current = interpolation(0);
            return function (t) {
                return arc(interpolation(t));
            };
        }

        function tweenIn(data) {
            var interpolation = d3.interpolate({ startAngle: 0, endAngle: 0 }, data);
            this._current = interpolation(0);
            return function (t) {
                return arc(interpolation(t));
            };
        }

    }
    
    function TransformChartData(chartData, opts, level, filter) {
        var result = [];
        var resultColors = [];
        var counter = 0;
        var hasMatch;
        var xVarName;
        var yVarName = opts[0].yaxis;
        sum_total_region = 0;
        sum_total_subevent = 0;
        sum_total_event = 0;

        if (level == 1) {
            xVarName = opts[0].xaxisl1;

            for (var i in chartData) {
                hasMatch = false;


                for (var index = 0; index < result.length; ++index) {
                    var data = result[index];
                     filter2 = filter;

                    

                    if ((data[xVarName] == chartData[i][xVarName]) && (chartData[i][opts[0].xaxis]) == filter) {
                        result[index][yVarName] = result[index][yVarName] + chartData[i][yVarName];

                        sum_total_event+=  chartData[i][yVarName];


                        hasMatch = true;
                        break;
                    }

                }
                if ((hasMatch == false) && ((chartData[i][opts[0].xaxis]) == filter)) {
                   
                    if (result.length < 9) {
                        ditem = {}
                        ditem[xVarName] = chartData[i][xVarName];
                        ditem[yVarName] = chartData[i][yVarName];
                        ditem["caption"] = chartData[i][xVarName];
                        ditem["title"] = chartData[i][xVarName];
                        ditem["op"] = 1.0 - parseFloat("0." + (result.length));
                        // opacity
                        result.push(ditem);
                        sum_total_event+=  chartData[i][yVarName];
                        

                        resultColors[counter] = opts[0].color[0][chartData[i][opts[0].xaxis]];

                        counter += 1;
                    }
                }
            }
        }
        else if(level == 2){
            xVarName = opts[0].xaxisl2;
             x1VarName = opts[0].xaxis;
             x2VarName = opts[0].xaxisl1;
             

            for (var i in chartData) {
                hasMatch = false;

                for (var index = 0; index < result.length; ++index) {
                    var data = result[index];

                    if ((data[xVarName] == chartData[i][xVarName])  && (chartData[i][opts[0].xaxisl1]) == filter && (chartData[i][opts[0].xaxis]) == filter2  ) {
                        result[index][yVarName] = result[index][yVarName] + chartData[i][yVarName];
                        sum_total_subevent +=  chartData[i][yVarName];
                        
                        hasMatch = true;
                        break;
                    }
                

                }
                if ((hasMatch == false) && ((chartData[i][opts[0].xaxisl1]) == filter ) && (chartData[i][opts[0].xaxis]) == filter2 ) {
                    if (result.length < 9) {
                        ditem = {}
                        ditem[xVarName] = chartData[i][xVarName];
                        ditem[yVarName] = chartData[i][yVarName];
                        ditem["caption"] = chartData[i][xVarName];
                        ditem["title"] = chartData[i][xVarName];
                        ditem["op"] = 1.0 - parseFloat("0." + (result.length));
                        result.push(ditem);
                        sum_total_subevent +=  chartData[i][yVarName];

                        resultColors[counter] = opts[0].color[0][chartData[i][opts[0].xaxis]];

                        counter += 1;
                    }
                }
            }

        }
        else {
            xVarName = opts[0].xaxis;

            for (var i in chartData) {
                hasMatch = false;

                sum_total_region += chartData[i][yVarName];


                for (var index = 0; index < result.length; ++index) {
                    var data = result[index];

                    if (data[xVarName] == chartData[i][xVarName]) {
                        result[index][yVarName] = result[index][yVarName] + chartData[i][yVarName];
                        
                        hasMatch = true;
                        break;
                    }
                     
                }
                if (hasMatch == false) {
                    ditem = {};
                    ditem[xVarName] = chartData[i][xVarName];
                    ditem[yVarName] = chartData[i][yVarName];
                    ditem["caption"] = opts[0].captions != undefined ? opts[0].captions[0][chartData[i][xVarName]] : "";
                    ditem["title"] = opts[0].captions != undefined ? opts[0].captions[0][chartData[i][xVarName]] : "";
                    ditem["op"] = 1;
                    result.push(ditem);

                    resultColors[counter] = opts[0].color != undefined ? opts[0].color[0][chartData[i][xVarName]] : "";

                    counter += 1;
                }
            }
        }

        
        if (level == 0) {
             runningData = [result[5],result[7],result[8],result[2],result[0],result[10],result[11],result[3],result[12],result[1],result[9],result[6],result[4],result[13],result[14]];
             runningColors = [resultColors[5],resultColors[7],resultColors[8],resultColors[2],resultColors[0],resultColors[10],resultColors[11],resultColors[3],resultColors[12],resultColors[1],resultColors[9],resultColors[6],resultColors[4],resultColors[13],resultColors[14]];
            //  Change order of regions

            
        } else {
             runningData = result;
             runningColors = resultColors;
        }
        return;
    }

    chartOptions = [{
        "captions": [{"Caribbean": "Caribbean", 
"Caucasus and Central Asia": "Caucasus and Central Asia",
"Central America": "Central America",
"East Asia": "East Asia",
"Eastern Africa": "Eastern Africa",
"Europe": "Europe",
"Middle Africa":"Middle Africa",
"Middle East":"Middle East",
"North America":"North America",
"Northern Africa":"Northern Africa",
"South America":"South America",
"South Asia":"South Asia",
"Southeast Asia":"Southeast Asia",
"Southern Africa":"Southern Africa",
"Western Africa":"Western Africa"
}],



        "color": [{
"Europe": "#696969",
"Middle East":"#C0C0C0",
"North America":"#ADFF2F",
"Central America": "#7FFF00",
"Caribbean": "#7CFC00", 
"South America":"#00FF00",
"South Asia":"#DA70D6",
"East Asia": "#FF00FF",
"Southeast Asia":"#FF00FF",
"Caucasus and Central Asia": "#BA55D3",
"Northern Africa":"#B0E0E6",
"Middle Africa":"#ADD8E6",
"Eastern Africa": "#87CEEB",
"Southern Africa":"#87CEFA",
"Western Africa":"#00BFFF"
}],
        "xaxis": "Region",
        "xaxisl1": "Event_type",
        "xaxisl2": "Sub_event_type",
        "yaxis": "Total"
    }]

   var chartData_2018;
   var chartData_2019;
   var chartData_2019;

     d3.json("./Sheet 4.json", function(data) {
     chartData_2018 = data;
    //  Store Json array loaded from file to variable
      
      
    
});


    d3.json("./Sheet 5.json", function(data) {
     chartData_2019 = data;
    //  Store Json array loaded from file to variable
      
      
    
});

    d3.json("./Sheet 6.json", function(data) {
     chartData_2020 = data;
    //  Store Json array loaded from file to variable
      
      
    
});



function dot_01(el) {

    el.style.color = '#FFF';
    document.getElementById("dot_02").style.color = '';
    document.getElementById("dot_03").style.color = '';
  
}
function dot_02(el) {

    el.style.color = '#FFF';
    document.getElementById("dot_01").style.color = '';
    document.getElementById("dot_03").style.color = '';
  
}

function dot_03(el) {

    el.style.color = '#FFF';
    document.getElementById("dot_02").style.color = '';
    document.getElementById("dot_01").style.color = '';
  
}
