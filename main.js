import './style.css';

import {Map, View} from 'ol';
import {Tile as TileLayer, Vector as VectorLayer, Group as GroupLayer} from 'ol/layer';
import {OSM, TileWMS, TileArcGISRest, Vector as VectorSource, XYZ} from 'ol/source';
import {transform,fromLonLat,toLonLat} from 'ol/proj';
import {ScaleLine, defaults as defaultControls, Attribution} from 'ol/control';
import GeoJSON from 'ol/format/GeoJSON';
import Select from 'ol/interaction/Select';
import {Style, Stroke, Fill} from 'ol/style';

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
      coordsInit = fromLonLat([ 1.957, 41.271 ]),
      qgisserverUrl = 'https://mapa.psig.es/qgisserver/cgi-bin/qgis_mapserv.fcgi',
      mapproxyUrl = 'https://mapa.psig.es/mapproxy/service',
      wfsUrl = 'https://mapa.psig.es/qgisserver/wfs3/collections/',
      wfsItems = '/items.geojson',
      wfsMapPath = '?MAP=/home/ubuntu/bellamar/Obra_Bellamar_web.qgs',
      wfsLimit = '&limit=1000';

/*
 * Base Layers
 *****************************************/
let baseLayers = new GroupLayer({
  title: 'Mapes base',
  //fold: 'close',
  layers: [

    new TileLayer({
      title: 'Ningú',
      type: 'base',
      source: null,
      visible: false,
    }),

    new TileLayer({
      title: 'OpenStreetMap',
      type: 'base',
      visible: false,
      source: new OSM()
    }),

    new TileLayer({
      title: 'Ortofoto històrica de 2020 (AMB)',
      type: 'base',
      visible: false,
      source: new TileArcGISRest({
        url: 'https://geoportal.amb.cat/geoserveis/rest/services/ortofoto_territorial_10cm_2020_25831/MapServer',
        projection: 'EPSG:25831',
        params: {
          'LAYERS': 'Orto2020_10cm'
        },
        attributions: ['© <a target="_blank" href="https://www.amb.cat/">AMB</a>'],
      })
    }),

    // new TileLayer({
    //   title: 'Topográfic (AMB)',
    //   type: 'base',
    //   visible: true,
    //   maxZoom: 18,
    //   source: new TileWMS({
    //     url: 'https://geoserveis.icgc.cat/icc_ct1m/wms/service?',
    //     projection: 'EPSG:25831',
    //     params: {
    //       'LAYERS': 'V21_PL,V22_PL,V21_LN,V22_LN,V21_PN,V22_PN,V21_TX_ANNO,V22_TX_ANNO', 
    //       'VERSION': '1.1.1'
    //     },
    //     attributions: ['Cartografia topogràfica 1:1.000 de l’<a target="_blank" href="http://www.icgc.cat/">Institut Cartogràfic i Geològic de Catalunya (ICGC)</a>, sota una llicència <a target="_blank" href="https://creativecommons.org/licenses/by/4.0/deed.ca">CC BY 4.0</a>'],
    //   })
    // }),

    new TileLayer({
      title: 'Topográfic (AMB)',
      type: 'base',
      visible: true,
      maxZoom: 18,
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

/*
 * Overlay Layers
 *****************************************/

let topoLayer = new TileLayer({
  title: 'Topografia completa',
  visible: true,
  minZoom: 18,
  source: new TileWMS({
    //url: qgisserverUrl + wfsMapPath,
    url: mapproxyUrl + wfsMapPath,
    params: {
      'LAYERS': 'bellamar_topografia',
      //'LAYERS': 'Anotacions,Vegetació (punts),Comunicacions (lineas),Vegetació (líneas),Construccions (líneas),Hidrografia (líneas)',
      'TRANSPARENT': true,
      'VERSION': '1.3.0',
    },
    serverType: 'qgis'
  })
});

let catastroLayer = new TileLayer({
  title: 'Catastro',
  visible: false,
  source: new TileWMS({
    url: 'http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx',
    params: {
      'LAYERS': 'catastro', 
      'TILED': true,
      'SRS': 'EPSG:3857'
    }
  })
});

let pluvialLayer = new VectorLayer({
  title: 'Pluvial',
  visible: true,
  source: new VectorSource({
    format: new GeoJSON(),
    url: wfsUrl + 'bellamar_pluvial' + wfsItems + wfsMapPath + wfsLimit
    //url: 'bellamar_pluvial.geojson'
  }),
  style: new Style({
    stroke: new Stroke({
      lineDash: [10, 5],
      color: '#1f78b4',
      width: 3
    })
  })
});

let tramsLayer = new VectorLayer({
  title: 'Trams de les obres',
  name: 'trams',
  visible: true,
  source: new VectorSource({
    format: new GeoJSON(),
    url: wfsUrl + 'Trams de les obres' + wfsItems + wfsMapPath + wfsLimit
    //url: 'Trams de les obres.geojson'
  }),
  style: function(feature, resolution) {
    if (feature.get('estat') === 'exclòs') {
      return new Style({
        stroke: new Stroke({
          color: "#929397",
          width: 1
        })
      })
    }
    else {
      return new Style({
        stroke: new Stroke({
          color: "#db1e2a",
          width: 2
        })
      })
    }
  }
});

let parcellesLayer = new VectorLayer({
  title: 'Parcel·les projecte Bellamar',
  name: 'parcelles',
  visible: true,
  source: new VectorSource({
    format: new GeoJSON(),
    url: wfsUrl + 'Parcel·les projecte Bellamar' + wfsItems + wfsMapPath + wfsLimit
    //url: 'Parcel·les projecte Bellamar.geojson'
  }),
  style: function(feature, resolution) {
    if (feature.get('residual') === 'No') {
      return new Style({
        fill: new Fill({
          //color: "#c49a97"
          color: "rgba(196,154,151,0.4)"
        })
      })
    }
    else if (feature.get('residual') === 'Sí') {
      return new Style({
        fill: new Fill({
          //color: "#876964"
          color: "rgba(135,105,100,0.4)"
        })
      })
    }
    else {
      return null;
    }
  }
});

let barrisLayer = new VectorLayer({
  title: 'Barris',
  visible: true,
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'barris.geojson',
  }),
  style: new Style({
    stroke: new Stroke({
      color: "#000",
      width: 2
    })
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
      catastroLayer,
      topoLayer,
      barrisLayer,
      pluvialLayer,
      tramsLayer,
      parcellesLayer,
    ]
  }),
  view: new View({
    //center: fromLonLat([1.982, 41.286]),
    center: coordsInit,
    zoom: zoomInit,
    minZoom: 14,
    maxZoom: 20
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
  html: '<img src="logo.png" />',
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
let select = new Select({ 
  layers: [tramsLayer, parcellesLayer],
  hitTolerance: 5
});
map.addInteraction(select);

// On selected => show/hide popup
select.getFeatures().on('add', function(e) {
  let feature = e.element,
      layer = select.getLayer(feature).get('name'),
      content = $("<div>");

  if (layer === "trams") {
    content
      .append( $("<p>").text("eix_ncar: " + feature.get("eix_ncar")) )
      .append( $("<p>").text("observacions: " + feature.get("observacions")) )
      .append( $("<p>").text("estat: " + feature.get("estat")) )
      .append( $("<p>").text("data_inici_obres: " + feature.get("data_inici_obres")) )
      .append( $("<p>").text("data_fi_obres: " + feature.get("data_fi_obres")) );
  }
  else if (layer === "parcelles") {
    content
      .append( $("<p>").text("refcat: " + feature.get("refcat")) )
      .append( $("<p>").text("residual: " + feature.get("residual")) )
      .append( $("<p>").text("conveni: " + feature.get("conveni")) );
  }

  $("#infoWindowFeature .content").html(content);
  infoWindowFeature.show();
});
select.getFeatures().on('remove', function(e) { 
  $("#infoWindowFeature .content").html("");
  infoWindowFeature.hide();
});

map.on('pointermove', function(evt) {
  map.getTargetElement().style.cursor = map.hasFeatureAtPixel(map.getEventPixel(evt.originalEvent), { 
    hitTolerance: 5, 
    layerFilter: function (layer) {
      return layer.get('name') === 'trams' || layer.get('name') === 'parcelles'
    }
  }) ? 'pointer' : '';
});

map.on('click', function(evt) {
  console.log(toLonLat(evt.coordinate));
});