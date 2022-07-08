//
// Конфигурация
//

// Создание задержики в ms после сдвига перед автоматическим вращением
var rotationDelay = 3000
// Масштаб земного шара
var scaleFactor = 0.9
// Скорость автоматическго вращениея
var degPerSec = 6
// Стартовые углы
var angles = { x: -20, y: 40, z: 0}
// Цвета
var colorWater = '#fff'
var colorLand = '#111'
var colorGraticule = '#ccc'
var colorCountry = '#a00'
var colorBorders = '#c4c4c4'



const cache = {};
      function getCardinal(angle) {

  const degreePerDirection = 360 / 8;
  const offsetAngle = angle + degreePerDirection / 2;

  return (offsetAngle >= 0 * degreePerDirection && offsetAngle < 1 * degreePerDirection) ? "N"
    : (offsetAngle >= 1 * degreePerDirection && offsetAngle < 2 * degreePerDirection) ? "NE"
      : (offsetAngle >= 2 * degreePerDirection && offsetAngle < 3 * degreePerDirection) ? "E"
        : (offsetAngle >= 3 * degreePerDirection && offsetAngle < 4 * degreePerDirection) ? "SE"
          : (offsetAngle >= 4 * degreePerDirection && offsetAngle < 5 * degreePerDirection) ? "S"
            : (offsetAngle >= 5 * degreePerDirection && offsetAngle < 6 * degreePerDirection) ? "SW"
              : (offsetAngle >= 6 * degreePerDirection && offsetAngle < 7 * degreePerDirection) ? "W"
                : "NW";
}
      const temperatureTransformer = (temp) => (temp - 273.15).toFixed(0);
      const processData = ({ main, weather, wind, ...data }, date) => ({
       temperature: temperatureTransformer(main.temp),
       feelsLike: temperatureTransformer(main.feels_like),
       clouds: weather[0].description,
       wind: {
         speed: wind.speed,
         position: getCardinal(wind.position),
       },
       pressure: main.pressure,
       humidity: main.humidity,
       visibility: data.visibility,
       name: data.name,
       timestamp: Date.now(),
     });
      const Loader = () => `
        <div>Loading...</div>
      `;
      const Loaded = ({ timestamp, name, temperature, feelsLike, clouds, wind, pressure, humidity, visibility }) => `
    <div data-v-3e6e9f12="" class="current-container mobile-padding">
      <div data-v-3e6e9f12="">
        <span data-v-3e6e9f12="" class="orange-text">${new Date(timestamp).toUTCString()}</span>
        <h2 data-v-3e6e9f12="" style="margin-top: 0px">
          ${name}
        </h2>
      </div>
      <div data-v-3e6e9f12="">
        <div data-v-3e6e9f12="" class="current-temp"><span data-v-3e6e9f12="" class="heading">${temperature}°C</span>
        </div>
        <div data-v-3e6e9f12="" class="bold">
          Feels like ${feelsLike}°C. ${clouds}.
        </div>
        <ul
          data-v-3208ab85=""
          data-v-3e6e9f12=""
          class="weather-items text-container orange-side standard-padding"
        >
          <li data-v-3208ab85="">
            <div data-v-3208ab85="" class="wind-line">
              ${wind.speed}m/s ${wind.position}
            </div>
          </li>
          <li data-v-3208ab85="">
            ${pressure}hPa
          </li>
          <li data-v-3208ab85="">
            <span data-v-3208ab85="" class="symbol">Humidity:</span>${humidity}%
          </li>
          <li data-v-3208ab85="">
            <span data-v-3208ab85="" class="symbol">Visibility:</span>${(visibility / 1000).toFixed(1)}km
          </li>
        </ul>
      </div>
    </div>`;
      const API_WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'
      const API_KEY = 'e76c75584d5e565cf45637eb7b7f2e62';
      async function getMeteoData(country, countryGeoJson) {
        const weatherRoot = document.querySelector('.weather-root');
        weatherRoot.innerHTML = Loader();
        let response;
        let data;
        if(!cache[country]) {
          response = await fetch(`${API_WEATHER_URL}?appid=${API_KEY}&q=${country}`);
  
          data = await response.json();
          cache[country] = { ...data, countryGeoJson };
        } else {
          data = cache[country]
        } 
        if(data.message) {
            weatherRoot.innerHTML = 'City not found.';
          return;
        }
        weatherRoot.innerHTML = Loaded(processData(data));
      }


function enter(country) {
  var cnt = countryList.find(function(c) {
    return parseInt(c.id, 10) === parseInt(country.id, 10)
  })
  getMeteoData(cnt && cnt.name || '', country);
}

function leave(country) {
  current.text('')
}

//
// Объвление переменных
//

var current = d3.select('#current')
var canvas = d3.select('#globe')
var context = canvas.node().getContext('2d')
var water = {type: 'Sphere'}
var projection = d3.geoOrthographic().precision(0.1)
var graticule = d3.geoGraticule10()
var path = d3.geoPath(projection).context(context)
var v0
var r0
var q0
var lastTime = d3.now()
var degPerMs = degPerSec / 1000
var width, height
var land, countries
var countryList
var autorotate, now, diff, rotation
var currentCountry

//
// Functions
//

function setAngles() {
  var rotation = projection.rotate()
  rotation[0] = angles.y
  rotation[1] = angles.x
  rotation[2] = angles.z
  projection.rotate(rotation)
}

function scale() {
  width = document.documentElement.clientWidth - 100
  height = document.documentElement.clientHeight - 100
  canvas.attr('width', width).attr('height', height)
  projection
    .scale((scaleFactor * Math.min(width, height)) / 2)
    .translate([width / 2, height / 2])
  render()
}

function startRotation(delay) {
  autorotate.restart(rotate, delay || 0)
}

function stopRotation() {
  autorotate.stop()
}

function dragstarted() {
  v0 = versor.cartesian(projection.invert(d3.mouse(this)))
  r0 = projection.rotate()
  q0 = versor(r0)
  stopRotation()
}

function dragged() {
  var v1 = versor.cartesian(projection.rotate(r0).invert(d3.mouse(this)))
  var q1 = versor.multiply(q0, versor.delta(v0, v1))
  var r1 = versor.rotation(q1)
  projection.rotate(r1)
  render()
}

function dragended() {
  startRotation(rotationDelay)
}

function render() {
  context.clearRect(0, 0, width, height)
  fill(water, colorWater)
  stroke(graticule, colorGraticule)
  fill(land, colorLand)
  stroke(countries, colorBorders)
    for(let [_, { countryGeoJson, main }] of Object.entries(cache)) {
        if(main) {
            let t = main?.temp < 213.15 ? 213.15
            : main?.temp > 333.15 ? 333.15 : main?.temp;
            fill(countryGeoJson, `hsl(${(t - 273.15 - 60) * (-2)}, 100%, 50%)`)
        } else {
            fill(countryGeoJson, `hsl(305, 100%, 50%)`)
        }
    }
  if (currentCountry) {
    fill(currentCountry, colorCountry)
  }
}

function fill(obj, color) {
  context.beginPath()
  path(obj)
  context.fillStyle = color
  context.fill()
}

function stroke(obj, color) {
  context.beginPath()
  path(obj)
  context.strokeStyle = color
  context.stroke()
}

function rotate(elapsed) {
  now = d3.now()
  diff = now - lastTime
  if (diff < elapsed) {
    rotation = projection.rotate()
    rotation[0] += diff * degPerMs
    projection.rotate(rotation)
    render()
  }
  lastTime = now
}

function loadData(cb) {
  d3.json('https://unpkg.com/world-atlas@1/world/110m.json', function(error, world) {
    if (error) throw error
    d3.tsv('https://gist.githubusercontent.com/mbostock/4090846/raw/07e73f3c2d21558489604a0bc434b3a5cf41a867/world-country-names.tsv', function(error, countries) {
      if (error) throw error
      cb(world, countries)
    })
  })
}

function polygonContains(polygon, point) {
  var n = polygon.length
  var p = polygon[n - 1]
  var x = point[0], y = point[1]
  var x0 = p[0], y0 = p[1]
  var x1, y1
  var inside = false
  for (var i = 0; i < n; ++i) {
    p = polygon[i], x1 = p[0], y1 = p[1]
    if (((y1 > y) !== (y0 > y)) && (x < (x0 - x1) * (y - y1) / (y0 - y1) + x1)) inside = !inside
    x0 = x1, y0 = y1
  }
  return inside
}

function mousemove() {
  var c = getCountry(this)
  if (!c) {
    if (currentCountry) {
      leave(currentCountry)
      currentCountry = undefined
      render()
    }
    return
  }
  if (c === currentCountry) {
    return
  }
  currentCountry = c
  render()
  enter(c)
}

function getCountry(event) {
  var pos = projection.invert(d3.mouse(event))
  return countries.features.find(function(f) {
    return f.geometry.coordinates.find(function(c1) {
      return polygonContains(c1, pos) || c1.find(function(c2) {
        return polygonContains(c2, pos)
      })
    })
  })
}

//
// Создание зума
//

var zoom = d3.zoom()
	.scaleExtent([0.75, 50])
	.on("zoom", zoomed);


let zooming = d3.select("#canvas")
zooming.call(zoom);

var scl = Math.min(document.documentElement.clientWidth, document.documentElement.clientHeight)/2.5;

function zoomed() {
	projection.scale(d3.event.transform.translate(projection).k * scl)
}


//
// Инициализация
//

setAngles()

canvas
  .call(d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended)
   )
  .on('mousemove', mousemove)

loadData(function(world, cList) {
  land = topojson.feature(world, world.objects.land)
  countries = topojson.feature(world, world.objects.countries)
  countryList = cList
  
  window.addEventListener('resize', scale)
  scale()
  autorotate = d3.timer(rotate)
})
