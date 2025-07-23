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

const svg2 = d3.select("#query-canvas");
// const g2 = svg2.append("g").attr("transform", "translate(50,50)");

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

  // console.log(data)

  // Now lets filter down to the national data
  const national = data.filter(d =>
    d.group === "National Estimate" &&
    d.state === "United States" &&
    d.subgroup === "United States" &&
    d.indicator === "Symptoms of Depressive Disorder" &&
    d.highCI != 0
  ).sort((a, b) => d3.ascending(a.startDate, b.startDate));

  // console.log(national)

  // With national data setup lets do the segments
  first_segment = national.filter(d => d.startDate <= new Date("2020-12-22"));
  second_segment = national.filter(d => d.startDate >= new Date("2020-12-09"));

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
    .datum(first_segment)
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
    });

  const line2 = d3.line()
  .x(d => xs(d.startDate))
  .y(d => ys(d.value));

  line_path2 = g.append("path")
    .datum(second_segment)
    .attr("fill", "none")
    .attr("stroke", "indianred")
    .attr("stroke-width", 2)
    .attr("d", line2)
    .attr("stroke-dasharray", function() {
      const length = this.getTotalLength();
      return `${length} ${length}`;
    })
    .attr("stroke-dashoffset", function() {
      return this.getTotalLength();
    });

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


  on_first_line = true
  // Advance the line
  d3.select("#advanceBtn").on("click", () => {
    if (on_first_line){
      line_path1
        .transition()
        .duration(1000) // 10 seconds
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .on("end", () => {
          svg.append("g")
          // .attr("transform", `translate(0,${height})`)
          .attr("class", "annotations-group")
          .call(annotate_graph);
        });


      on_first_line = false
    } else {
      line_path2
        .transition()
        .duration(9000) // 10 seconds
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    }
    
  });
}


async function drawSecondChart() {
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

  filtered_data = []
  avg_data = []

  // Setup the event listener
  d3.select("#update-query").on("click", () => {
    // CLears up here
    max_cli = 0
    filtered_data = []
    d3.select("#query-canvas").selectAll("*").remove()
    const g2 = svg2.append("g").attr("transform", "translate(50,50)");

    console.log("UPDATINGS")
    age_query = d3.select("#age").property("value");
    sex_query = d3.select("#sex").property("value");

    // Check for age and get resutls as needed
    if (age_query != ""){
      query_data = data.filter(d =>
        d.group === "By Age" &&
        d.subgroup === age_query &&
        d.state === "United States" &&
        d.indicator === "Symptoms of Depressive Disorder" &&
        d.highCI != 0
      ).sort((a, b) => d3.ascending(a.startDate, b.startDate));
      filtered_data.push(...query_data)
    }

    // check for sex and get resutls as needed
    if (sex_query != ""){
      query_data = data.filter(d =>
        d.group === "By Sex" &&
        d.subgroup === sex_query &&
        d.state === "United States" &&
        d.indicator === "Symptoms of Depressive Disorder" &&
        d.highCI != 0
      ).sort((a, b) => d3.ascending(a.startDate, b.startDate));
      filtered_data.push(...query_data)
    }

    // Now lets sort and aggregate at each timestamp
    filtered_data = filtered_data.sort((a, b) => d3.ascending(a.startDate, b.startDate));
    console.log(filtered_data)

    // Now lets group the data and avg
    grouped = {}
    filtered_data.forEach(d => {
      // Get the date and value
      date = d.startDate
      if (!grouped[date]) {
        grouped[date] = {sum: 0, count: 0}
      }
      grouped[date].sum += d.value
      grouped[date].count += 1
    });
    console.log(grouped)
    // Now go throyugh ductioanry and average it
    avg_data = []
    for (date in grouped) {
      new_date = new Date(date)
      tmp = grouped[date]
      avg_data.push({startDate: new_date, value: (tmp.sum/tmp.count)})
    }
    console.log(avg_data)

    if (avg_data == []) {
      return
    }

    // Wonderful now we can actually make the graph :)
    max_cli
    avg_data.forEach(d => {
      if (d.value > max_cli) {
        max_cli = d.value
      }
    });
    console.log(max_cli)
    
    // Hard code the sacles cause im terrible
    const xs = d3.scaleTime().domain([new Date("2020-04-23"), new Date("2024-08-20")]).range([0, width]);
    const ys = d3.scaleLinear().domain([0, 50]).range([height, 0]);
  
    // Create axis
    g2.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xs));
    g2.append("g").call(d3.axisLeft(ys));
    
    // Line time lets gooo
    const line = d3.line()
    .x(d => xs(d.startDate))
    .y(d => ys(d.value));

    line_path = g2.append("path")
      .datum(avg_data)
      .attr("fill", "none")
      .attr("stroke", "indianred")
      .attr("stroke-width", 2)
      .attr("d", line)
      .attr("stroke-dasharray", function() {
        const length = this.getTotalLength();
        return `${length} ${length}`;
      })
      .attr("stroke-dashoffset", function() {
        return this.getTotalLength();
      });


    line_path
      .transition()
      .duration(5000) // 10 seconds
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);
    
  });

}

const tooltip = d3.select("#tooltip");

drawChart()
drawSecondChart()