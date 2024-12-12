function createPieChart(width, data, selectedCountry) {
    const height = Math.min(1000, width / 0.5);
    const outerRadius = height / 2 - 10;
    const innerRadius = outerRadius * 0.75;
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const svg = d3.create("svg")
        .attr("viewBox", [-width / 2, -height / 2, width, height]);

    const margin = { top: 100, right: 50, bottom: 150, left: 200 };
    const widthf = 900 - margin.left - margin.right;


    svg.append("text")
        .attr("class", "graph-title")
        .attr("x", (widthf + margin.left + margin.right) / 2 + -450)
        .attr("y", margin.top / 2 + -700)
        .attr("text-anchor", "middle")
        .style("font-size", "60px")
        .style("font-weight", "bold")
        .style("font-family", "sans-serif")
        .text(`Payment Method of TotalSales/Returns`);

    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    const pie = d3.pie()
        .sort(null)
        .value(d => d.total);

    let currentMetric = 'total';

    const path = svg.selectAll("path")
        .data(pie(data))
        .join("path")
        .attr("fill", (d, i) => color(i))
        .attr("d", arc)
        .each(function (d) { this._current = d; })
        .on("mouseover", function(event, d) {
            d3.select(this).attr("opacity", 0.7);



            //Tooltip hover over based on the current metric
            const tooltipContent = `
                <strong>Payment Method:</strong> ${d.data.paymentMethod}<br>
                <strong>${currentMetric === 'total' ? 'Total Sales' : 'Returns'}:</strong> ${d.data[currentMetric]}
            `;

            //Displaying tooltip
            const tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("opacity", 0);

            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(tooltipContent)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 1);

            d3.selectAll(".tooltip").remove();
        });

    //Update when user switches between
    function change(metric) {
        currentMetric = metric;
        pie.value(d => d[metric]);
        path.data(pie(data))
            .transition().duration(750)
            .attrTween("d", function(a) {
                const i = d3.interpolate(this._current, a);
                this._current = i(1);
                return t => arc(i(t));
            });

    }

    return Object.assign(svg.node(), { change });
}
