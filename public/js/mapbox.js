const locations = JSON.parse(document.getElementById('map').dataset.locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoibWFya2hvZmZtYW4iLCJhIjoiY2wycmh0MHFxMDA1cjNubGFueHN3a2ZzNCJ9.vuESCSvUKpiYyMvLidUimw';

var map = new mapboxgl.Map({
  /* https://docs.mapbox.com/mapbox-gl-js/api/map/ */
  container: 'map',
  style: 'mapbox://styles/markhoffman/cl2u6howt003w14qlvp5nsfht',
  scrollZoom: false,
  // center: [-118, 34], // long,lat
  // zoom: 5,
  // interactive: false, // turn off actions w/ the map
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach((loc) => {
  // 1. Create a marker
  const el = document.createElement('div');
  el.className = 'marker'; // includes img+styles in css

  // 2. Add a marker
  new mapboxgl.Marker({
    element: el,
    anchor: 'bottom',
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  // 3. Add popup (marker's info)
  new mapboxgl.Popup({ offset: 30 })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);

  // 4. Extends map bounds to include the current location
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  // Padding inside the map
  padding: {
    top: 200,
    bottom: 200,
    left: 100,
    right: 100,
  },
});
