import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

function LineChart() {
    const months = {
        "Jan": "2020-01",
        "Feb": "2020-02",
        "Mar": "2020-03",
        "Apr": "2020-04",
        "May": "2020-05",
        "Jun": "2020-06",
        "Jul": "2020-07",
        "Aug": "2020-08",
        "Sep": "2020-09",
        "Oct": "2020-10",
        "Nov": "2020-11",
        "Dec": "2020-12"
    };
    const chartRef = useRef(null);
    const [data, setData] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("2020-03");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(
                    "https://data.covid19india.org/v4/min/timeseries.min.json"
                );
                const jsonData = await response.json();
                const monthData = extractDataForMonth(jsonData, selectedMonth);
                setData(monthData);
            } catch (error) {
                console.error("Error fetching COVID data:", error);
            }
        };

        fetchData();
    }, [selectedMonth]);

    const extractDataForMonth = (jsonData, selectedMonth) => {
        const monthData = jsonData["AN"]?.dates || {};
        const allDates = Array.from({ length: 31 }, (_, i) => i + 1);

        return allDates.map((date) => ({
            xpoint: `${date.toString().padStart(2, '0')}-${selectedMonth.slice(-2)}`,
            deltaConfirmed: monthData[`${selectedMonth}-${date.toString().padStart(2, '0')}`]?.delta?.confirmed || 0,
            deltaDeceased: monthData[`${selectedMonth}-${date.toString().padStart(2, '0')}`]?.delta?.deceased || 0,
            deltaRecovered: monthData[`${selectedMonth}-${date.toString().padStart(2, '0')}`]?.delta?.recovered || 0,
            deltaTested: monthData[`${selectedMonth}-${date.toString().padStart(2, '0')}`]?.delta?.tested || 0,
            delta7Confirmed: monthData[`${selectedMonth}-${date.toString().padStart(2, '0')}`]?.delta7?.confirmed || 0,
            delta7Deceased: monthData[`${selectedMonth}-${date.toString().padStart(2, '0')}`]?.delta7?.deceased || 0,
            delta7Recovered: monthData[`${selectedMonth}-${date.toString().padStart(2, '0')}`]?.delta7?.recovered || 0,
            delta7Tested: monthData[`${selectedMonth}-${date.toString().padStart(2, '0')}`]?.delta7?.tested || 0,
        }));
    };

    const updateChart = () => {
        const width = 900;
        const height = 400;
        const marginTop = 20;
        const marginRight = 20;
        const marginBottom = 50;
        const marginLeft = 60;

        const x = d3
            .scaleBand()
            .domain(data.map((d) => d.xpoint))
            .range([marginLeft, width - marginRight])
            .padding(0.1);

        const yDelta = d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => Math.max(d.deltaConfirmed, d.delta7Confirmed))])
            .range([height - marginBottom, marginTop]);

        const lineDelta = d3
            .line()
            .x((d) => x(d.xpoint))
            .y((d) => yDelta(d.deltaConfirmed))
        // .curve(d3.curveBasis);

        const lineDelta7 = d3
            .line()
            .x((d) => x(d.xpoint))
            .y((d) => yDelta(d.delta7Confirmed))
        // .curve(d3.curveBasis);

        const existingSvg = d3.select(chartRef.current).select("svg");
        if (!existingSvg.empty()) {
            existingSvg.remove();
        }

        const svg = d3
            .select(chartRef.current)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr(
                "style",
                "max-width: 100%; height: auto; height: intrinsic;"
            )
            .style("overflow", "visible");

        const tooltipDelta = svg.append("g").style("display", "none");

        const tooltipDelta7 = svg.append("g").style("display", "none");

        svg
            .append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(x).tickSize(0))
            .selectAll("text")
            .attr("dy", "0.5em")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg
            .append("g")
            .attr("transform", `translate(${marginLeft}, 0)`)
            .call(d3.axisLeft(yDelta));

        // Y-axis label
        svg.append("text")
            .attr("class", "y-axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${marginLeft / 2}, ${height / 2}) rotate(-90)`)
            .text("No. of Confirmed Patients");

        // X-axis label
        svg.append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${width / 2}, ${height - marginBottom + 40})`)
            .text("Date");

        svg
            .append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#58b865")
            .attr("stroke-width", 3)
            .attr("d", lineDelta);

        svg
            .append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "blue")
            .attr("stroke-width", 3)
            .attr("d", lineDelta7);

        svg
            .selectAll("circle.delta")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "delta")
            .attr("cx", (d) => x(d.xpoint))
            .attr("cy", (d) => yDelta(d.deltaConfirmed))
            .attr("r", 4)
            .attr("fill", "#58b865")
            .on("mouseover", (event, d) => mouseoverDelta(event, d, tooltipDelta))
            .on("mouseout", () => mouseout(tooltipDelta))
            .on("touchstart", (event) => event.preventDefault());

        svg
            .selectAll("circle.delta7")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "delta7")
            .attr("cx", (d) => x(d.xpoint))
            .attr("cy", (d) => yDelta(d.delta7Confirmed))
            .attr("r", 4)
            .attr("fill", "blue")
            .on("mouseover", (event, d) => mouseoverDelta7(event, d, tooltipDelta7))
            .on("mouseout", () => mouseout(tooltipDelta7))
            .on("touchstart", (event) => event.preventDefault());

        function mouseoverDelta(_, d, tooltip) {
            tooltip.style("display", "block");
            tooltip.attr("transform", `translate(${x(d.xpoint) + x.bandwidth() / 2},${yDelta(d.deltaConfirmed)})`);
            tooltip.select("text")
                .text(`Date:${d.xpoint}\n` + `Confirmed: ${d.deltaConfirmed}\n` + `Deceased: ${d.deltaDeceased}\n` + `Recovered: ${d.deltaRecovered}\nTested: ${d.deltaTested}`);
        }

        function mouseoverDelta7(_, d, tooltip) {
            tooltip.style("display", "block");
            tooltip.attr("transform", `translate(${x(d.xpoint)},${yDelta(d.delta7Confirmed)})`);
            tooltip.select("text")
                .text(`Date:${d.xpoint}\n` + `Confirmed: ${d.delta7Confirmed}\n` + `Deceased: ${d.delta7Deceased}\n` + `Recovered: ${d.delta7Recovered}\nTested: ${d.delta7Tested}`);
        }

        function mouseout(tooltip) {
            tooltip.style("display", "none");
        }

        // Tooltip setup
        tooltipDelta
            .append("text")
            .attr("text-anchor", "middle")
            .attr("dy", -10)
            .style("font-size", "14px")
            .style("font-weight", "bold");

        tooltipDelta7
            .append("text")
            .attr("text-anchor", "middle")
            .attr("dy", -10)
            .style("font-size", "14px")
            .style("font-weight", "bold");
    };

    useEffect(() => {
        updateChart();
    }, [data, selectedMonth]);

    const handleMonthChange = (event) => {
        setSelectedMonth(event.target.value);
    };

    return (
        <div className="card">
            <div className="card-header">
                <span>COVID Data for {selectedMonth}</span>
                <div className="month-selector">
                    <label>Select Month: </label>
                    <select onChange={handleMonthChange} value={selectedMonth}>
                        {Object.keys(months).map((month) => (
                            <option key={month} value={months[month]}>
                                {month}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="border"></div>
            <div className="card-body">
                <div ref={chartRef}></div>
            </div>
        </div>
    );
}

export default LineChart;
