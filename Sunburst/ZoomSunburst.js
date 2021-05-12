
    var width2 = 350,
        height2 = 350,
        maxRadius = (Math.min(width2, height2)  / 2) - 5;

    var formatNumber = d3.format(',d');

    var x = d3.scaleLinear()
        .range([0, 2 * Math.PI])
        .clamp(true);

    var y = d3.scalePow()
        .exponent(1)
        .range([maxRadius*.1, maxRadius]);

    // var color = d3.scaleOrdinal()
    //     .range(["#4e79a7","#59a14f","#9c755f","#f28e2b","#edc948","#bab0ac","#e15759","#b07aa1","#76b7b2","#ff9da7"]); //d3.schemeTableau10


    var partition2 = d3.partition();

    var arc = d3.arc()
        .startAngle(d2 => x(d2.x0))
        .endAngle(d2 => x(d2.x1))
        .innerRadius(d2 => Math.max(0, y(d2.y0)))
        .outerRadius(d2 => Math.max(0, y(d2.y1)));

    var middleArcLine = d2 => {
        var halfPi = Math.PI/2;
        var angles = [x(d2.x0) - halfPi, x(d2.x1) - halfPi];
        var r = Math.max(0, (y(d2.y0) + y(d2.y1)) / 2);

        var middleAngle = (angles[1] + angles[0]) / 2;
        var invertDirection = middleAngle > 0 && middleAngle < Math.PI; // On lower quadrants write text ccw
        if (invertDirection) { angles.reverse(); }

        var path = d3.path();
        path.arc(0, 0, r, angles[0], angles[1], invertDirection);
        return path.toString();
    };

    var textFits = d2 => {
        var CHAR_SPACE = 6;

        var deltaAngle = x(d2.x1) - x(d2.x0);
        var r = Math.max(0, (y(d2.y0) + y(d2.y1)) / 2);
        var perimeter = r * deltaAngle;

        return d2.data.name.length * CHAR_SPACE < perimeter;
    };
    const g2 = d3.select("#vis2").append("svg")
    .attr('width', width2)
    .attr('height', height2)
    .attr("transform", "translate(300,300)")
    ;
    var svg2 = g2.select('body')
        .style('width', '200vw')
        .style('height', '200vh')
        .attr('viewBox', `${-width2 / 2} ${-height2 / 2} ${width2} ${height2}`)
        .on('click', () => focusOn()); // Reset zoom on canvas click
    ;


    // var svg2 = d3.select('body').append('svg')
    //     .style('width', '100vw')
    //     .style('height', '100vh')
    //     .attr('viewBox', `${-width2 / 2} ${-height2 / 2} ${width2} ${height2}`)
    //     .on('click', () => focusOn()); // Reset zoom on canvas click

    //d3.json('./assets/ZoomSunburst1.json', (error, root) => {
        d3.json("./assets/ZoomSunburst1.json").then(root2 => { 

        root2 = d3.hierarchy(root2);
        root2.sum(d2 => d2.value);
        
        var slice2 = svg2.selectAll('g.slice')
            .data(partition2(root2).descendants()) 
            
            .attr("fill",  d2 => color(d2.data.name))
            //d2 => { while (d2.depth > 2) d2 = d2.parent; return color(d2.data.name); })
            //.attr("fill-opacity", d2 => arcVisible(d2.current) ? (d2.children ? 0.6 : 0.4) : 0)
            //.attr("d", d2 => arc(d2.current))
            ;
       // slice.exit().remove();
       console.log(slice2)
        

        var slice2 = g2.selectAll('g2.slice2')
            .data(partition2(root2).descendants())
            .attr("fill",  d2 => color(d2.data.name))
            ;

        slice2.exit().remove();
        

        var newSlice = slice2.enter()
            .append('g').attr('class', 'slice')
            .on('click', d2 => {
                d3.event.stopPropagation();
                focusOn(d2);
            });

        newSlice.append('title')
            .text(d2 => d2.data.name + '\n' + formatNumber(d2.value));

        newSlice.append('path')
            .attr('class', 'main-arc')        
            .style('fill',  d2 => color(d2.data.name) )
           .attr("fill", d2 => {if (d2.depth < 3) { while (d2.depth > 1) d2 = d2.parent; return color((d2.children ? d2 : d2.parent).data.name);}
                                else { while (d2.depth > 4) d2 = d2.parent; return color((d2.children ? d2 : d2.parent).data.name);} })
            .attr('d', arc);

        newSlice.append('path')
            .attr('class', 'hidden-arc')
            .attr('id', (_, i) => `hiddenArc${i}`)
            .attr('d2', middleArcLine);

        var text = newSlice.append('text')
            .attr('display', d2 => textFits(d2) ? null : 'none');

        // Add white contour
        text.append('textPath')
            .attr('startOffset','50%')
            .attr('xlink:href', (_, i) => `#hiddenArc${i}` )
            .text(d2 => d2.data.name)
            .style('fill', 'none')
            .style('stroke', '#fff')
            .style('stroke-width', 5)
            .style('stroke-linejoin', 'round');

        text.append('textPath')
            .attr('startOffset','50%')
            .attr('xlink:href', (_, i) => `#hiddenArc${i}` )
            .text(d2 => d2.data.name);
    });

    function focusOn(d2 = { x0: 0, x1: 1, y0: 0, y1: 1 }) {
        // Reset to top-level if no data point specified

        var transition = g2.transition()
            .duration(750)
            .tween('scale', () => {
                var xd = d3.interpolate(x.domain(), [d2.x0, d2.x1]),
                    yd = d3.interpolate(y.domain(), [d2.y0, 1]);
                return t => { x.domain(xd(t)); y.domain(yd(t)); };
            });

        transition.selectAll('path.main-arc')
            .attrTween('d2', d2 => () => arc(d2));

        transition.selectAll('path.hidden-arc')
            .attrTween('d2', d2 => () => middleArcLine(d2));

        transition.selectAll('text')
            .attrTween('display', d2 => () => textFits(d2) ? null : 'none');

        moveStackToFront(d2);

        //

        function moveStackToFront(elD) {
            g2.selectAll('.slice').filter(d2 => d2 === elD)
                .each(function(d2) {
                    this.parentNode.appendChild(this);
                    if (d2.parent) { moveStackToFront(d2.parent); }
                })
        }
    }
        function arcVisible(d2) {
            return d2.y1 <= 3 && d2.y0 >= 1 && d2.x1 > d2.x0;
        }
    