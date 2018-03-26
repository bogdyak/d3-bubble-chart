(function() {

  let width  = 1000,
      height = 500;

  // random color generator (copied)
  let randomColor = (function(){
      let golden_ratio_conjugate = 0.618033988749895;
      let h = Math.random();

      let hslToRgb = function (h, s, l){
          let r, g, b;

          if(s == 0){
              r = g = b = l; // achromatic
          } else {
              function hue2rgb(p, q, t){
                  if(t < 0) t += 1;
                  if(t > 1) t -= 1;
                  if(t < 1/6) return p + (q - p) * 6 * t;
                  if(t < 1/2) return q;
                  if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                  return p;
              }

              let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
              let p = 2 * l - q;
              r = hue2rgb(p, q, h + 1/3);
              g = hue2rgb(p, q, h);
              b = hue2rgb(p, q, h - 1/3);
          }

          return '#'+Math.round(r * 255).toString(16)+Math.round(g * 255).toString(16)+Math.round(b * 255).toString(16);
      };

      return function(){
        h += golden_ratio_conjugate;
        h %= 1;
        return hslToRgb(h, 0.5, 0.60);
      };
    })();

  // creating svg element
  let svg = d3.select('#chart')
    .append ("svg")
    .attr   ("height", height)
    .attr   ("width", width)
    .append ("g")
    .attr   ("transform", "translate(0,0)")

  // difine defs
  let defs = svg.append("defs");

  defs.append("pattern")
    .attr   ("id", "Beyonce")
    .attr   ("height", "100%")
    .attr   ("width", "100%")
    .attr   ("patternContentUnits", "objectBoundingBox")
    .append ("image")
    .attr   ("height", 1)
    .attr   ("width", 1)
    .attr   ("preserveAspectRatio", "none")
    .attr   ("xmlns:xlink", "http://wwww.w3.org/1999/xlink")
    .attr   ("xlink:href", "Beyonce.jpg");

  // scalling settings
  // domain - min value and max value
  // range - min and max px size of elm
  let radiusScale = d3.scaleSqrt()
      .domain ([1,300])
      .range  ([10,75]);

  // logic for splitting diagram
  let forceXsplit = d3.forceX((d) => {
    if(d.decade === "pre-2000")
      return 250
    else return 750
  }).strength(0.05)

  // logic for grouping diagram
  let forceXgroup = d3.forceX(width / 2).strength(0.05)

  // force to avoid overlapping
  let forceCollide = d3.forceCollide((d) => {
    return radiusScale(d.sales) + 1
  })

  // group button handler
  d3.select('#group').on('click', (d) => {
    simulation
      .force       ("x", forceXgroup)
      .alphaTarget (0.5)
      .restart     ();
  });

  // split button handler
  d3.select('#split').on('click', (d) => {
    simulation
      .force       ("x", forceXsplit)
      .alphaTarget (0.5)
      .restart     ();
  });

  // the simulation is a collection of forces
  // about where we want our circles to go
  let simulation = d3.forceSimulation()
    .force ("x", d3.forceX(width / 2).strength(0.05))
    .force ("y", d3.forceY(height/2).strength(0.05))
    .force ("collide", forceCollide)

  // async definition of the data
  // without await no data displayed
  d3.queue()
    .defer (d3.csv, "sales.csv")
    .await (ready)


  function ready(e, data) {
    // creating pattern html elm,
    // which have image pathes and other settings
    defs.selectAll(".artist-pattern")
      .data(data)
      .enter ().append("pattern")
      .attr  ("class", "artist-pattern")
      .attr  ("id", (d) => {
        // for better name definition
        return d.name.toLowerCase().replace(/ /g, "-")
      })
      .attr   ("height", "100%")
      .attr   ("width", "100%")
      .attr   ("patternContentUnits", "objectBoundingBox")
      .append ("image")
      .attr   ("height", 1)
      .attr   ("width", 1)
      .attr   ("preserveAspectRatio", "none")
      .attr   ("xmlns:xlink", "http://wwww.w3.org/1999/xlink")
      .attr   ("xlink:href", (d) => {
        if(typeof(d.image_path) !== 'undefined')
          return d.image_path
      })

    // creation of circle elm with params
    let circles = svg.selectAll('.artist')
      .data  (data)
      .enter ().append("circle")
      .attr  ("class", "artist")
      .attr  ('r', (d) => {
        // the radius depends on the value from data
        return radiusScale(d.sales)
      })
      .attr  ("fill", (d) => {
        // if could find proper image path then return it and set
        // otherwise fill the circle with random color
        if(typeof(d.image_path) === 'undefined')
          return randomColor()
        else
          return `url(#${d.name.toLowerCase().replace(/ /g, "-")})`
      })
      .on    ("click", (d) => {
        console.log(d)
        alert(`Cool! You clicked ${d.name} bubble`)
      })
      .on    ('mouseover', () => {
        tooltip.style('display', null)
      })
      .on    ('mouseout', () => {
        tooltip.style('display', 'none')
      })
      .on    ('mousemove', (d) => {

        let xPos = Number.parseInt(d3.mouse(circles.node())[0]) - 50
        let yPos = Number.parseInt(d3.mouse(circles.node())[1]) - 50

        tooltip
          .attr   ("transform", `translate(${xPos}, ${yPos})`)
          .select ('text').text(`${d.name} earned $${d.sales}M`);
      })

      // creating tooltip elm
      let tooltip = svg.append('g')
        .attr  ('class', "tooltip")
        .style ('display', 'none');

      // writing text for tooltip
      tooltip.append('text')
        .attr  ('x', 15)
        .attr  ('dy', "1.2em")
        .style ('font-size', '1.2em');


    simulation.nodes(data)
      .on('tick', ticked)

    function ticked() {
      circles
        .attr("cx", (d) => {
          return d.x
        })
        .attr("cy", (d) => {
          return d.y
        })
    }
  }


})();
