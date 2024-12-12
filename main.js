
//splash screen+infobox additions
let intro = document.querySelector('.intro');
let logo = document.querySelector('.logo-header');
let logoSpan = document.querySelectorAll('.logo');
let legend = document.querySelector('.legend');
let infoBox = document.querySelector('.info');
let infoPopup;

//this is to hid the legand box and other stuff but I realized I did not have enough time to fix it
window.addEventListener("DOMContentLoaded", () => {
    legend?.classList.add('hidden');
    infoBox?.classList.add('hidden');

    //infoPopup
    infoPopup = document.createElement('div');
    infoPopup.id = 'info-popup';
    infoPopup.classList.add('hidden');
    infoPopup.innerHTML = `
        <div id="info-content">
            <span id="info-close">&times;</span>
            <p id="info-text"></p>
        </div>
    `;
    document.body.appendChild(infoPopup);

    const infoClose = document.getElementById('info-close');

    //Close popup
    infoClose.addEventListener('click', () => {
        infoPopup.classList.remove('visible');
    });



    setTimeout(() => {
        logoSpan.forEach((span, idx) => {
            setTimeout(() => {
                span.classList.add("active");
            }, (idx + 1) * 400);
        });

        setTimeout(() => {
            logoSpan.forEach((span) => {
                span.classList.remove("active");
                span.classList.add("fade");
            });
        }, 2000);

        setTimeout(() => {
            intro.style.transition = "top 0.5s ease-out";
            intro.style.top = "-100vh";
        }, 2300);
    });

});

function normalizeCountryName(name) {
    return name.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+/g, ' ');
}
//Some of the countries in the datatset had names that threw the dataset through loops, so this is a fix
const countryNameMapping = {
    "united states of america": "united states",
    "russian federation": "russia",
    "côte d'ivoire": "cote divoire",
    "democratic republic of the congo": "congo (democratic republic)",
    "republic of the congo": "congo",
    "bolivia (plurinational state of)": "bolivia",
    "tanzania, united republic of": "tanzania",
    "iran (islamic republic of)": "iran",
    "south korea": "korea, south",
    "lao people's democratic republic": "laos",
    "syrian arab republic": "syria",
    "myanmar": "burma"
};
//data reader
d3.json("countries.geojson").then((geojson) => {
    d3.csv("online_sales_dataset.csv").then((data) => {

        let countrySpending = d3.rollups(
            data,
            v => ({
                totalSpending: d3.sum(v, d => +d.UnitPrice * +d.Quantity),
                topProduct: d3.groupSort(v, g => -g.length, d => d.Description)[0]
            }),
            d => normalizeCountryName(d.Country)
        );

        for (let i = 0; i < geojson.features.length; i++) {
            let countryName = normalizeCountryName(geojson.features[i].properties["name"]);
            countryName = countryNameMapping[countryName] || countryName;
            let countryData = countrySpending.find(d => d[0] === countryName);
            if (countryData) {
                geojson.features[i].properties["totalSpending"] = countryData[1].totalSpending;
                geojson.features[i].properties["topProduct"] = countryData[1].topProduct;
            } else {
                geojson.features[i].properties["totalSpending"] = 0;
                geojson.features[i].properties["topProduct"] = 'N/A';
            }
        }
//stuff from class
        var map = L.map('map').setView([20, 0], 2);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        function getColor(d) {
            return d > 5050000 ? '#00441b' :
                d > 5000000 ? '#006d2c' :
                    d > 4950000 ? '#238b45' :
                        d > 4900000 ? '#41ab5d' :
                            d > 4850000 ? '#74c476' :
                                d > 4800000 ? '#a8e6a1' :
                                    d > 10000 ? '#c7e9c0' :
                                        '#CCCCCC';
        }

        function style(feature) {
            return {
                fillColor: getColor(feature.properties.totalSpending || 0),
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7
            };
        }

        function highlightFeature(e) {
            var layer = e.target;

            layer.setStyle({
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7
            });

            layer.bringToFront();
            info.update(layer.feature.properties);
        }

        function resetHighlight(e) {
            geojsonLayer.resetStyle(e.target);
            info.update();
        }
//window for the charts and other buttons
        function zoomToFeature(e) {
            map.fitBounds(e.target.getBounds());
            const countryName = e.target.feature.properties.name;
            const overlay = document.getElementById('country-overlay');
            overlay.style.display = 'flex';

            const chartContainer = document.getElementById('chart-container');
            chartContainer.innerHTML = `
        <div id="chart-toggle-container">
            <div id="controls"></div>
            <button id="bar-graph-button" class="chart-toggle-btn active">Bar Graph Race</button>
            <button id="pie-chart-button" class="chart-toggle-btn">Pie Chart</button>
            <button id="info-button">Info on this Data</button>
        </div>
        <div id="chart"></div>
    `;

            const barGraphButton = document.getElementById('bar-graph-button');
            const pieChartButton = document.getElementById('pie-chart-button');
            const infoButton = document.getElementById('info-button');
            //I could not figure out how to create the pop up with the window, and unfortunatley ran out of time so I sttled with this sloppy fix
            infoButton.addEventListener('click', () => {
                const infoText = document.getElementById('info-text');
                infoText.innerHTML = `
        <h2>Data Visualization Info</h2>
        <p>This visualization displays sales data for <strong>${countryName}</strong>.</p>
        <ul>
            <li><strong>Bar Graph Race:</strong> View the most purchased products over the years.</li>
            <li><strong>Pie Chart:</strong> Explore the distribution of payment methods used for total sales and returns.</li>
        </ul>
        <p>Use the toggle buttons to switch between the visualizations. Click "Back to Map" to return to the world map.</p>
    `;
                infoPopup.classList.add('visible');
            });

            barGraphButton.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleChart('bar', countryName);
            });

            pieChartButton.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleChart('pie', countryName);
            });

            initBarChart(countryName);
        }

//In the name, toggle between charts
        function toggleChart(chartType, selectedCountry) {
            const chartContainer = document.getElementById('chart');
            chartContainer.innerHTML = '';
            document.querySelectorAll('.chart-toggle-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            if (chartType === 'bar') {
                document.getElementById('bar-graph-button').classList.add('active');
                initBarChart(selectedCountry);

                // Update pop-up text for the bar graph race
                infoText.textContent = `The Bar Graph Race shows the most purchased products in ${selectedCountry} over the years, dynamically competing based on quantities sold.`;
            } else if (chartType === 'pie') {
                document.getElementById('pie-chart-button').classList.add('active');
                initPieChart(selectedCountry);

                // Update pop-up text for the pie chart
                infoText.textContent = `The Pie Chart visualizes the distribution of payment methods used for total sales and returns in ${selectedCountry}.`;
            }
        }

//Get my pie chart working, had some difficulties there
        function initPieChart(selectedCountry) {
            console.log(`Initializing pie chart for: ${selectedCountry}`);
            const chartContainer = document.getElementById('chart');
            const controlsContainer = document.getElementById('controls');
            chartContainer.innerHTML = '';

            //Normalize selectedCountry for consistent comparison
            selectedCountry = selectedCountry.toLowerCase().trim();
            if (selectedCountry === "united states of america") {
                selectedCountry = "united states";
            }
//Help the pie chart read the data as its different method compared to the rest
            d3.csv("online_sales_dataset.csv").then((rawData) => {
                const countryData = rawData.filter(d =>
                    d.Country.toLowerCase().trim() === selectedCountry
                );

                if (countryData.length === 0) {
                    console.warn(`No data for ${selectedCountry}`);
                    chartContainer.innerHTML = `<div>No data available for ${selectedCountry}</div>`;
                    return;
                }

                const data = d3.rollups(
                    countryData,
                    (v) => ({
                        paymentMethod: v[0].PaymentMethod,
                        total: d3.sum(v, d => Math.max(0, +d.Quantity)),
                        returns: d3.sum(v, d => Math.abs(Math.min(0, +d.Quantity)))
                    }),
                    (d) => d.PaymentMethod
                ).map(([key, value]) => value);

                console.log("Data for pie chart:", data);

                const chart = createPieChart(700, data);

                if (chart) {
                    chartContainer.appendChild(chart);

                    //controls to the existing controls container
                    controlsContainer.innerHTML = '';
                    ['total', 'returns'].forEach(metric => {
                        const button = document.createElement('button');
                        button.textContent = metric === 'total' ? 'Total Sales' : 'Returns';
                        button.addEventListener('click', () => chart.change(metric));
                        controlsContainer.appendChild(button);

                    });

                    console.log("chart successfully appended.");
                } else {
                    console.error(" chart creation failed.");
                }
            }).catch(error => {
                console.error("error loading or processing data:", error);
            });
        }

//Self explanatory back button
        const backButton = document.getElementById("back-to-map");
        backButton.addEventListener("click", () => {
            const overlay = document.getElementById('country-overlay');
            overlay.style.display = 'none';
            map.setView([20, 0], 2);

            const chartContainer = document.getElementById('chart-container');
            chartContainer.innerHTML = '';
        });

        function onEachFeature(feature, layer) {
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            });
        }

        var geojsonLayer = L.geoJson(geojson, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);

        var info = L.control();
        info.onAdd = function () {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };

        info.update = function (props) {
            this._div.innerHTML = '<h4>Country Online Spending</h4>' + (props ?
                '<b>' + props.name + '</b><br />' +
                'Total Spending: $' + (props.totalSpending ? props.totalSpending.toLocaleString() : '0') + '<br />' +
                'Top Product: ' + (props.topProduct || 'N/A')
                : 'Hover over a country');
        };

        info.addTo(map);

        var legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
            var div = L.DomUtil.create('div', 'info legend'),
                labels = [];

            var thresholds = [0, 4850000, 4900000, 4950000, 5000000, 5050000];

            for (var i = 0; i < thresholds.length; i++) {
                div.innerHTML +=
                    `<i style="background:${getColor(thresholds[i] + 1)}"></i> 
                    $${thresholds[i].toLocaleString()} ${(thresholds[i + 1] ? `&ndash; $${thresholds[i + 1].toLocaleString()}<br>` : '+')}`;
            }

            div.innerHTML += '<i style="background:#CCCCCC"></i> No Data';
            return div;
        };

        legend.addTo(map);
    });
});