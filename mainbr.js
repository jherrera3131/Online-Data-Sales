function initBarChart(selectedCountry) {
    //Same as before
    function normalizeCountryName(name) {
        return name.trim().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .replace(/\s+/g, ' ');
    }

    const countryNameMapping = {
        "united states of america": "united states",
    };

    //map the selected country
    const normalizedCountry = normalizeCountryName(selectedCountry);
    const mappedCountry = countryNameMapping[normalizedCountry] || normalizedCountry;

    const overlayContent = document.getElementById("overlay-content");
    let chartTitle = document.getElementById("chart-title");
    if (!chartTitle) {
        chartTitle = document.createElement("h2");
        chartTitle.id = "chart-title";
        overlayContent.prepend(chartTitle);
    }
    chartTitle.textContent = `${selectedCountry} Data`;
    d3.csv("online_sales_dataset.csv").then((data) => {
        //Normalize dataset country names/filter
        const countryData = data.filter(d => {
            const normalizedDataCountry = normalizeCountryName(d.Country);
            return normalizedDataCountry === mappedCountry;
        });

        console.log("Filtered Ddta:", selectedCountry, countryData);

        //Nodata cases
        if (countryData.length === 0) {
            alert(`No data available for ${selectedCountry}`);
            return;
        }
        //Preprocess data
        countryData.forEach(d => {
            d.InvoiceDate = new Date(d.InvoiceDate);
            d.Year = d.InvoiceDate.getFullYear();
            d.TotalQuantity = +d.Quantity;
        });

        //Aggregate data (product and year)
        const aggregatedData = d3.rollups(
            countryData,
            v => d3.sum(v, d => d.TotalQuantity),
            d => d.Year,
            d => d.Description
        );

        //aggregated data
        const chartData = [];
        aggregatedData.forEach(([year, products]) => {
            products.forEach(([product, totalQuantity]) => {
                chartData.push({ year, product, totalQuantity });
            });
        });

        //SVG
        const svg = d3.create("svg")
            .attr("width", 1500)
            .attr("height", 800)
        document.getElementById("chart").appendChild(svg.node());

        const margin = { top: 100, right: 50, bottom: 150, left: 200 };
        const width = 900 - margin.left - margin.right;
        const height = 800 - margin.top - margin.bottom;

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear().range([0, width]);
        const y = d3.scaleBand().rangeRound([0, height]).padding(0.2);

        //Generate random colors for product
        const uniqueProducts = Array.from(new Set(chartData.map(d => d.product)));

        //Function to generate a random color
        function getRandomColor() {
            const letters = '0123456789ABCDEF';
            let color = '#';
            for (let i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }

        //color mapping for each product
        const color = d3.scaleOrdinal()
            .domain(uniqueProducts)
            .range(uniqueProducts.map(() => getRandomColor()));

        const xAxis = g.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`);
        const yAxis = g.append("g").attr("class", "y-axis");

        svg.append("text")
            .attr("class", "graph-title")
            .attr("x", (width + margin.left + margin.right) / 2 + 200)
            .attr("y", margin.top / 2 + 30)
            .attr("text-anchor", "middle")
            .style("font-size", "17px")
            .style("font-weight", "bold")
            .style("font-family", "sans-serif")
            .text(`${selectedCountry} - Most Purchased Products Over the Year`);


        svg.append("text")
            .attr("class", "x-axis-title")
            .attr("x", margin.left + width / 2)
            .attr("y", height + margin.top + 60)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("font-family", "sans-serif")
            .text("Quantity");

        svg.append("text")
            .attr("class", "y-axis-title")
            .attr("transform", "rotate(-90)")
            .attr("x", -(margin.top + height / 2))
            .attr("y", margin.left - 120)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("font-family", "sans-serif")
            .text("Products");


        //Year display
        const yearLabel = svg.append("text")
            .attr("class", "year-label")
            .attr("x", 1200)
            .attr("y", 650)
            .attr("text-anchor", "end")
            .style("font-size", "48px")
            .style("font-weight", "bold")
            .style("fill", "darkgreen")
            .text("");

        function updateBars(data, year) {
            //Sort data (yearly)
            data.sort((a, b) => d3.descending(a.totalQuantity, b.totalQuantity));
            x.domain([0, d3.max(data, d => d.totalQuantity)]);
            y.domain(data.map(d => d.product));

            //Databing to bars
            const bars = g.selectAll(".bar")
                .data(data, d => d.product);

            bars.enter().append("rect")
                .attr("class", "bar")
                .attr("x", 0)
                .attr("y", d => y(d.product))
                .attr("height", y.bandwidth())
                .attr("width", 0)
                .attr("fill", (d) => color(d.product))
                .merge(bars)
                .transition().duration(900)
                .attr("y", d => y(d.product))
                .attr("width", d => x(d.totalQuantity))
                .attr("height", y.bandwidth());

            bars.exit()
                .transition().duration(900)
                .attr("width", 0)
                .remove();

            //Labels

            const labels = g.selectAll(".label")
                .data(data, d => d.product);
            labels.exit()
                .transition().duration(900)
                .attr("x", d => x(0))
                .remove();

            labels.enter()
                .append("text")
                .attr("class", "label")
                .style("font-family", "Sans-Serif")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .style("fill", "black")
                .merge(labels)
                .transition().duration(900)
                .attr("x", d => x(d.totalQuantity) + 5)
                .attr("y", d => y(d.product) + y.bandwidth() / 2)
                .text(d => `${d.product}: ${d3.format(",")(d.totalQuantity)} bought`);

            //Update axes
            xAxis.transition().duration(900).call(d3.axisBottom(x));
            yAxis.transition().duration(900).call(d3.axisLeft(y));
            yearLabel.text(year);
        }

        function keyframes() {
            const years = Array.from(new Set(chartData.map(d => d.year)));
            return years.map(year => ({
                year,
                data: chartData
                    .filter(d => d.year === year),
            }));
        }

        async function animate() {
            const frames = keyframes();
            for (const frame of frames) {
                updateBars(frame.data, frame.year);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        animate();

    });
}
