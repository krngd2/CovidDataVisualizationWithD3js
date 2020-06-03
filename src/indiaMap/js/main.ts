import { select, scaleLinear, max } from "d3";
import { geoMercator, geoPath } from "d3-geo";
import { getStatesDailyData, formatStatesDailyData, getIndianStatesMap } from "./service";

let w = 600;
let h = 650;
let proj = geoMercator();
let path = geoPath().projection(proj);
var t = proj.translate(); // the projection's default translation
var s = proj.scale() // the projection's default scale
let covidCasesData;
let covidStateAllDates;
let updateChart: Function;

function initialize() {
  proj.scale(1000);
  proj.translate([-1140, 750]);
}

getStatesDailyData().then(async (data) => {
  let formattedData = formatStatesDailyData(data);
  covidCasesData = formattedData.covidCasesData;
  covidStateAllDates = formattedData.covidStateAllDates;
  adjustData(covidCasesData);
})

async function adjustData(data) {
  // plotMap(data);
  updateChart = plotMap(data)
  playPlot();
}

async function playPlot() {
  for (let covidDate of covidStateAllDates) {
    updateChart(covidDate)
    await new Promise(done => setTimeout(() => done(), 100));
  }
}

function plotMap(covidData) {
  let indiaMapStructure: any = getIndianStatesMap();
  const maxValue = max(Object.values(covidData).flat(Infinity), (d: any) => Number(d.confirmed))
  const colorScale = scaleLinear()
                        .domain([0, 1, 100, 1000, maxValue])
                        .range([ 'green', 'yellow', 'orange', 'rgb(255, 100, 100)', 'red']);
  let firstDates = [...covidStateAllDates]
  
      
  let svg = select("#chart")
        .append("svg:svg")
        .attr("width", w)
        .attr("height", h)
        .call(initialize);

  let indiaMap = svg.append("svg:g")
        .attr("id", "india");

  let stateLabels = svg.append("svg:g")
        .attr("id", "labels");
  const dateText = svg.append('text')
                    .attr('x', 300)
                    .attr('y', 100)
                    .text(firstDates[0])
  indiaMap.selectAll("path")
    .data(indiaMapStructure.features)
    .enter()
    .append('path')
    .attr("d", path)
    .style("stroke", "white")
    .style("opacity", "1")
    .style("stroke-width", "0.4px")
    .style('fill', (d: any) => {
       let todayStateData = covidData[d.properties.st_nm]?.filter((stateData) => stateData.date === firstDates[0]);
       return colorScale(!todayStateData ? 0 : todayStateData[0].confirmed)
    });
  stateLabels.selectAll("labels")
    .data(indiaMapStructure.features)
    .enter()
    .append("text")
    .attr('x', function (d: any) { 
      return path.centroid(d)[0]
    })
    .attr('y', function (d: any) {
      return path.centroid(d)[1]
    })
    .style('fill', "black")
    .text((d: any) => {
      let todayStateData = covidData[d.properties.st_nm]?.filter((stateData) => stateData.date === firstDates[0]);
      return !todayStateData?"":todayStateData[0].stateCode;
    })
    .attr("text-anchor", "middle")
    .style('font-size', (d) => path.area(d) < 50 ? 8 : 10);
  return (date) => {
    dateText.text(date)
    indiaMap.selectAll("path").transition()
      .duration(800 / 1.2)
      .style('fill', (d: any) => {
        let todayStateData = covidData[d.properties.st_nm]?.filter((stateData) => stateData.date === date);
        return colorScale(!todayStateData ? 0 : todayStateData[0]?.confirmed)
      })
  }
}