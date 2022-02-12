import './style.css';

import {Map, View} from 'ol';
import {Tile as TileLayer, Vector as VectorLayer, Group as GroupLayer} from 'ol/layer';
import {OSM, TileWMS, TileArcGISRest, Vector as VectorSource} from 'ol/source';
import {transform,fromLonLat,toLonLat} from 'ol/proj';
import {ScaleLine, defaults as defaultControls} from 'ol/control';
import GeoJSON from 'ol/format/GeoJSON';
import Select from 'ol/interaction/Select';

import $ from 'jquery';
import LayerSwitcher from 'ol-layerswitcher';
import Permalink from 'ol-ext/control/Permalink';
import Bar from 'ol-ext/control/Bar';
import Button from 'ol-ext/control/Button';
import Toggle from 'ol-ext/control/Toggle';
import Overlay from 'ol-ext/control/Overlay';
import GeolocationButton from 'ol-ext/control/GeolocationButton';
import Popup from 'ol-ext/overlay/Popup';

const zoomInit = 16,
      coordsInit = fromLonLat([ 1.957, 41.271 ]);

/*
 * Layers
 *****************************************/
let baseLayers = new GroupLayer({
  title: 'Mapes base',
  //fold: 'close',
  layers: [

    new TileLayer({
      title: 'OpenStreetMap',
      type: 'base',
      source: new OSM()
    }),

    new TileLayer({
      title: 'Ningú',
      type: 'base',
      source: null,
      visible: false,
    }),

    new TileLayer({
      title: 'Ortofoto (IGCG)',
      type: 'base',
      visible: false,
      source: new TileWMS({
        url: 'http://geoserveis.icc.cat/icc_mapesmultibase/utm/wms/service?',
        params: {
          'LAYERS': 'orto', 
          'VERSION': '1.1.1'
        },
        attributions: ['Ortofoto 1:1.000 de l’<a target="_blank" href="http://www.icgc.cat/">Institut Cartogràfic i Geològic de Catalunya (ICGC)</a>, sota una llicència <a target="_blank" href="https://creativecommons.org/licenses/by/4.0/deed.ca">CC BY 4.0</a>'],
      })
    }),

    new TileLayer({
      name: 'baseLayerTopoAMB',
      title: 'Topogràfic (AMB)',
      qgistitle: '@ Capes topografiques AMB',
      type: 'base',
      visible: false,
      source: new TileArcGISRest({
        url: 'http://geoportal.amb.cat/geoserveis/rest/services/topografia_1000_3857/MapServer',
        projection: 'EPSG:3857',
        params: {
          'LAYERS': 'Nivell 1M'
        },
        attributions: ['© <a target="_blank" href="https://www.amb.cat/">AMB</a>'],
      })
    }),

    new TileLayer({
      title: 'Topográfic (IGCG)',
      type: 'base',
      visible: false,
      source: new TileWMS({
        url: 'http://geoserveis.icc.cat/icc_mapesmultibase/utm/wms/service?',
        params: {
          'LAYERS': 'topogris', 
          'VERSION': '1.1.1'
        },
        attributions: ['Cartografia topogràfica 1:1.000 de l’<a target="_blank" href="http://www.icgc.cat/">Institut Cartogràfic i Geològic de Catalunya (ICGC)</a>, sota una llicència <a target="_blank" href="https://creativecommons.org/licenses/by/4.0/deed.ca">CC BY 4.0</a>'],
       })
    }),
  ]
});

let bellamarLayer = new VectorLayer({
  title: 'Bellamar',
  visible: true,
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'bellamar.geojson',
  })
});

/*
 * Map
 *****************************************/
const map = new Map({
  target: 'map',
  controls: defaultControls().extend([new ScaleLine()]),
  layers: new GroupLayer({
    title: 'Mapes base',
    fold: 'close',
    layers: [
      baseLayers,
      bellamarLayer
    ]
  }),
  view: new View({
    //center: fromLonLat([1.982, 41.286]),
    center: coordsInit,
    zoom: zoomInit
  })
});

/*
 * Controles
 *****************************************/
let infoWindowDocs = new Overlay({ 
  closeBox : true, 
  className: "slide-left menu", 
  content: $("#infoWindowDocs").get(0)
});
map.addControl(infoWindowDocs);

let infoWindowLayers = new Overlay({ 
  closeBox : true, 
  className: "slide-left menu", 
  content: $("#infoWindowLayers").get(0)
});
map.addControl(infoWindowLayers);

let toc = document.getElementById('layers');
LayerSwitcher.renderPanel(map, toc, { reverse: true });

let infoWindowSearch = new Overlay({ 
  closeBox : true, 
  className: "slide-left menu", 
  content: $("#infoWindowSearch").get(0)
});
map.addControl(infoWindowSearch);

let infoWindowFeature = new Overlay({ 
  closeBox : true, 
  className: "slide-right info", 
  content: $("#infoWindowFeature").get(0)
});
map.addControl(infoWindowFeature);

let mainBar = new Bar();
map.addControl(mainBar);
mainBar.setPosition("top-left");

let nestedBar = new Bar({ toggleOne: true, group:true });
mainBar.addControl(nestedBar);

let logoBtn = new Button({ 
  html: '<img src="LogoAjuntament49_2016.C4.png" />',
  className: "logo",
  title: "Castelldefels",
  handleClick: function() { 
    map.getView().setCenter(coordsInit);
    map.getView().setZoom(zoomInit);
  }
});
nestedBar.addControl(logoBtn);

let docsToggle = new Toggle({ 
  html: '<i class="fa fa-file-text-o"></i>',
  className: "docs",
  title: "Documents",
  onToggle: function() {
    hideWindows("docs");
    infoWindowDocs.toggle();
  }
});
nestedBar.addControl(docsToggle);

let layersToggle = new Toggle({ 
  html: '<i class="fa fa-align-justify"></i>',
  className: "layers",
  title: "Capas",
  onToggle: function() {
    hideWindows("layers");
    infoWindowLayers.toggle();
  }
});
nestedBar.addControl(layersToggle);

let searchToggle = new Toggle({ 
  html: '<i class="fa fa-search"></i>',
  className: "search",
  title: "Buscar",
  onToggle: function() {
    hideWindows("search");
    infoWindowSearch.toggle();
  }
});
nestedBar.addControl(searchToggle);

function hideWindows(activeToggle) {
  infoWindowDocs.hide();
  infoWindowLayers.hide();
  infoWindowSearch.hide();

  if (activeToggle !== "docs")
    docsToggle.setActive(false);
  else if (activeToggle !== "layers")
    layersToggle.setActive(false);
  else if (activeToggle !== "search")
    searchToggle.setActive(false);
}

let whatsappBtn = new Button({ 
  html: '<i class="fa fa-whatsapp" aria-hidden="true"></i>',
  className: "whatsapp",
  title: "Whatsapp",
  handleClick: function() { 
    
  }
});
nestedBar.addControl(whatsappBtn);

let telegramBtn = new Button({ 
  html: '<i class="fa fa-telegram" aria-hidden="true"></i>',
  className: "telegram",
  title: "Whatsapp",
  handleClick: function() { 
    
  }
});
nestedBar.addControl(telegramBtn);

let urlControl = new Permalink({ 
  urlReplace: true,
  //localStorage: true,
});
map.addControl(urlControl);

let geoloc = new GeolocationButton({
  title: 'On estic?',
  delay: 5000
});
map.addControl(geoloc);

let here = new Popup({ positioning: 'bottom-center' });
map.addOverlay(here);
geoloc.on('position', function(e) {
  if (e.coordinate) here.show(e.coordinate, "Ets aquí!");
  else here.hide();
});

$(".window").show();

/*
 * Interaction
 *****************************************/
let select = new Select({});
map.addInteraction(select);

// On selected => show/hide popup
select.getFeatures().on('add', function(e) { 
  // let feature = e.element;
  // let img = $("<img>").attr("src", feature.get("img"));
  // let info = $("<div>").append( $("<p>").text(feature.get("text")));
  // let content = $("<div>")
  //     .append( img )
  //     .append(info);
  // $("#infoWindowFeature .content").html(content);
  infoWindowFeature.toggle();
});
select.getFeatures().on('remove', function(e) { 
  $("#infoWindowFeature .content").html("");
});

map.on('click', function(evt) {
  console.log(toLonLat(evt.coordinate));
});