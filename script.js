// const svg = d3.select("svg");

// svg.append("circle")
//   .attr("cx", 100)
//   .attr("cy", 100)
//   .attr("r", 50)
//   .attr("fill", "steelblue");

const svg = d3.select("svg");
const width = +svg.attr("width") - 100;
const height = +svg.attr("height") - 100;

const g = svg.append("g").attr("transform", "translate(50,50)");

async function drawChart() {
  const data = await d3.csv("covid_mental_health_data.csv", d => ({
    indicator: d.Indicator,
    group: d.Group,
    subgroup: d.Subgroup,
    state: d.State,
    startDate: d3.timeParse("%m/%d/%Y")(d["Time Period Start Date"]),
    value: +d.Value,
    lowCI: +d["Low CI"],
    highCI: +d["High CI"]
  }));

  console.log(data)

  // Now lets filter down to the national data
  const national = data.filter(d =>
    d.group === "National Estimate" &&
    d.state === "United States" &&
    d.subgroup === "United States" &&
    d.indicator === "Symptoms of Depressive Disorder" &&
    d.highCI != 0
  ).sort((a, b) => d3.ascending(a.startDate, b.startDate));

  console.log(national)

  // With national data setup lets do the segments
  first_segment = national.filter(d => d.startDate <= new Date("2020-12-09"));
  second_segment = national.filter(d => d.startDate > new Date("2020-12-09"));

  max_cli = 0
  national.forEach(d => {
    if (d.highCI > max_cli) {
      max_cli = d.highCI
    }
  });
  console.log(max_cli)
  
  // Hard code the sacles cause im terrible
  const xs = d3.scaleTime().domain([new Date("2020-04-23"), new Date("2024-08-20")]).range([0, width]);
  const ys = d3.scaleLinear().domain([0, max_cli]).range([height, 0]);

  // Create axis
  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xs));
  g.append("g").call(d3.axisLeft(ys));

  // Add the line 1
  const line1 = d3.line()
    .x(d => xs(d.startDate))
    .y(d => ys(d.value));

  line_path1 = g.append("path")
    .datum(national)
    .attr("fill", "none")
    .attr("stroke", "indianred")
    .attr("stroke-width", 2)
    .attr("d", line1)
    .attr("stroke-dasharray", function() {
      const length = this.getTotalLength();
      return `${length} ${length}`;
    })
    .attr("stroke-dashoffset", function() {
      return this.getTotalLength();
    });;

  svg.append("text")
    .attr("x", 50)
    .attr("y", 30)
    .attr("font-size", "18px")
    .text("National Depression Rates Over Time");


  // Next lets add some tooltips
  svg.selectAll("circle")
  .data(national)
  .enter()
  .append("circle")
  .attr("transform", "translate(50,50)")
  .attr("cx", d => xs(d.startDate))
  .attr("cy", d => ys(d.value))
  .attr("r", 4)
  .attr("fill", "black")
  .attr("stroke", "white")
  .attr("stroke-width", 1)
  .style("opacity", 0)
  .on("mouseover", function(event, d) {
    d3.select(this).style("opacity", 1);
    tooltip
      .style("opacity", 1)
      .html(`
        <strong>${(String(d.startDate).slice(0, 15))}</strong><br>
        Depression Rate: ${d.value}%<br>
      `)
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 28}px`);
  })
  .on("mouseout", function() {
    d3.select(this).style("opacity", 0);
    tooltip.style("opacity", 0);
  });
  
  // Lets add the annotations
  annotations = [
    {
      note: {
        label: "Pfizer and Moderna vaccine approved by FDA",
        title: "Dec 11, 2020",
        wrap: 200,
      },
      data: { date: new Date("2021-04-01"), value: 27 },
      dy: 0,
      dx: 75
    }
  ]

  annotate_graph = d3.annotation()
    .annotations(annotations)
    .accessors({
      x: d => xs(d.date),
      y: d => ys(d.value) 
    });

  svg.append("g")
    // .attr("transform", `translate(0,${height})`)
    .attr("class", "annotations-group")
    .call(annotate_graph);



  const on_line = 1
  // Advance the line
  d3.select("#advanceBtn").on("click", () => {
    if (on_line == 1){
      line_path1
      .transition()
      .duration(1000) // 10 seconds
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);
    }
    
  });
}

const tooltip = d3.select("#tooltip");
// const first_segment = national.filter


// const data = await d3.csv("covid_mental_health_data.csv", d => ({
//   indicator: d.Indicator,
//   group: d.Group,
//   subgroup: d.Subgroup,
//   state: d.State,
//   startDate: d3.timeParse("%m/%d/%Y")(d["Time Period Start Date"]),
//   value: +d.Value,
//   lowCI: +d["Low CI"],
//   highCI: +d["High CI"]
// }));

// console.log(data)

// // Now lets filter down to the national data
// const national = data.filter(d =>
//   d.group === "National Estimate" &&
//   d.state === "United States" &&
//   d.subgroup === "United States" &&
//   d.indicator === "Symptoms of Depressive Disorder" &&
//   d.highCI != 0
// ).sort((a, b) => d3.ascending(a.startDate, b.startDate));

// console.log(national)

drawChart()