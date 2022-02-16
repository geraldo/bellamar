import './style.css';

import {Map, View} from 'ol';
import {Tile as TileLayer, Vector as VectorLayer, Group as GroupLayer} from 'ol/layer';
import {OSM, TileWMS, TileArcGISRest, Vector as VectorSource, XYZ} from 'ol/source';
import {transform,fromLonLat,toLonLat} from 'ol/proj';
import {ScaleLine, defaults as defaultControls, Attribution} from 'ol/control';
import GeoJSON from 'ol/format/GeoJSON';
import {Select, Draw} from 'ol/interaction';
import {Overlay as OverlayOL} from 'ol';
import {Style, Stroke, Fill, Circle} from 'ol/style';
import {LineString, Polygon} from 'ol/geom';
import {getArea, getLength} from 'ol/sphere';
import {unByKey} from 'ol/Observable';

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
      wfsLimit = '&limit=10000';

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
    let estat = feature.get('estat');
    if (estat === 'finalitzat') {
      return new Style({
        stroke: new Stroke({
          color: "#09de00",
          width: 2
        })
      })
    }
    else if (estat === 'en obra') {
      return new Style({
        stroke: new Stroke({
          color: "#db1e2a",
          width: 2
        })
      })
    }
    else if (estat === 'inici en breu') {
      return new Style({
        stroke: new Stroke({
          color: "#ff8c00",
          width: 2
        })
      })
    }
    else if (estat === 'pendent') {
      return new Style({
        stroke: new Stroke({
          color: "#0076b6",
          width: 2
        })
      })
    }
    else if (estat === 'exclòs') {
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
          color: "#ffff00",
          width: 1
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
 * Menu
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

let menuBar = new Bar({
  className: "ol-top ol-left menuBar"
});
map.addControl(menuBar);

let nestedBar = new Bar({ toggleOne: true, group:true });
menuBar.addControl(nestedBar);

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

$(".window").show();

/*
 * Action buttons
 *****************************************/
let urlControl = new Permalink({ 
  urlReplace: true,
  title: "Compartir enllaç"
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

/*
 * Measure
 *****************************************/
let sketch,
    helpTooltipElement,
    helpTooltip,
    measureTooltipElement,
    measureTooltip,
    continuePolygonMsg = 'Click per continuar dibuixant el polígon',
    continueLineMsg = 'Click per continuar dibuixant la línea',
    helpMsg = 'Clica per iniciar el dibuix',
    draw,
    measureActive = false;

const measureSource = new VectorSource();
const measureVector = new VectorLayer({
  source: measureSource,
  style: new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
    stroke: new Stroke({
      color: '#ffcc33',
      width: 2,
    }),
    image: new Circle({
      radius: 7,
      fill: new Fill({
        color: '#ffcc33',
      }),
    }),
  }),
});
map.addLayer(measureVector);

map.on('pointermove', function(evt) {
  if (measureActive) {
    pointerMoveHandler(evt);
  }
  else {
    // change mouse pointer over features
    map.getTargetElement().style.cursor = map.hasFeatureAtPixel(map.getEventPixel(evt.originalEvent), { 
      hitTolerance: 5, 
      layerFilter: function (layer) {
        return layer.get('name') === 'trams' || layer.get('name') === 'parcelles'
      }
    }) ? 'pointer' : '';
  }
});

$(document).keyup(function(e) {
  if (e.keyCode == 27) {
    map.removeInteraction(draw);
    map.removeOverlay(measureTooltip);
    removeHelpTooltip();
    $('.ol-tooltip').addClass('hidden');
    measureToggle.toggle();
    //measureSource.clear();
  }
});

let submeasureBar = new Bar({ 
  toggleOne: true,
  autoDeactivate: true,
  controls: [ 
    new Toggle({ 
      title: "Medir distancia",
      //html:'<i class="fa fa-arrows-h"></i>', 
      html: '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0 -8)"><path d="m1.5000001 20.5h21v7h-21z" style="overflow:visible;fill:#c7c7c7;fill-rule:evenodd;stroke:#5b5b5c;stroke-width:.99999994;stroke-linecap:square"/><path d="m4.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m7.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m10.5 20v6" fill="none" stroke="#5b5b5c"/><path d="m13.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m16.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m19.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m2.5 13v4" fill="none" stroke="#415a75"/><path d="m21.5 13v4" fill="none" stroke="#415a75"/><path d="m2 15h20" fill="none" stroke="#415a75" stroke-width="1.99999988"/></g></svg>',
      //autoActivate: true,
      onToggle: function(b) { 
        measureActive = b;
        enableInteraction(b, true);
      } 
    }),
    new Toggle({ 
      title: "Medir àrea",
      //html:'<i class="fa fa-arrows-alt"></i>', 
      html: '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0 -8)"><path d="m1.5000001 20.5h21v7h-21z" style="overflow:visible;fill:#c7c7c7;fill-rule:evenodd;stroke:#5b5b5c;stroke-width:.99999994;stroke-linecap:square"/><path d="m4.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m7.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m10.5 20v6" fill="none" stroke="#5b5b5c"/><path d="m13.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m16.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m19.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m2.5 9.5h5v2h14v7.5h-6.5v-5h-5v3.5h-7.5z" fill="#6d97c4" fill-rule="evenodd" stroke="#415a75"/></g></svg>',
      onToggle: function(b) { 
        measureActive = b;
        enableInteraction(b, false);
      }
    })
  ]
});
let measureToggle = new Toggle({ 
  html: 'M',
  bar: submeasureBar,
  title: "Medir",
  onToggle: function(b) {
    if (!b) {
      removeMeasure();
      this.toggle();
    }
  }
});
let measureBar = new Bar({ 
  autoDeactivate: true,
  controls: [measureToggle],
  className: "ol-top ol-right measureBar"
});
map.addControl(measureBar);

function enableInteraction(enable, distance) {
  enable ? addInteraction(distance) : removeMeasure();
}

function addInteraction(distance) {
  var type = (distance ? 'LineString' : 'Polygon');
  draw = new Draw({
    source: measureSource,
    type: type,
    style: new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new Stroke({
        color: 'rgba(0, 0, 0, 0.5)',
        lineDash: [10, 10],
        width: 2
      }),
      image: new Circle({
        radius: 5,
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 0.7)'
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        })
      })
    })
  });

  map.addInteraction(draw);
  createMeasureTooltip();
  createHelpTooltip();

  let listener;

  draw.on('drawstart', function(evt) {
    sketch = evt.feature;

    var tooltipCoord = evt.coordinate;

    listener = sketch.getGeometry().on('change', function(evt) {
    var geom = evt.target;
    var output;
    if (geom instanceof Polygon) {
      output = formatArea(geom);
      tooltipCoord = geom.getInteriorPoint().getCoordinates();
    } else if (geom instanceof LineString) {
      output = formatLength(geom);
      tooltipCoord = geom.getLastCoordinate();
    }
    measureTooltipElement.innerHTML = output;
    measureTooltip.setPosition(tooltipCoord);
    });
  });

  draw.on('drawend', function() {
    measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
    measureTooltip.setOffset([0, -7]);
    sketch = null;
    measureTooltipElement = null;
    createMeasureTooltip();
    unByKey(listener);
  });
}

function removeMeasure() {
  measureActive = false;
  map.removeInteraction(draw);
  map.removeOverlay(measureTooltip);
  removeHelpTooltip();
  $('.ol-tooltip').addClass('hidden');
  measureToggle.toggle();
  measureSource.clear();
}

function createHelpTooltip() {
  removeHelpTooltip();
  helpTooltipElement = document.createElement('div');
  helpTooltipElement.className = 'ol-tooltip hidden';
  helpTooltip = new OverlayOL({
    element: helpTooltipElement,
    offset: [15, 0],
    positioning: 'center-left'
  });
  map.addOverlay(helpTooltip);

  map.getViewport().addEventListener('mouseout', helpTooltipEventListener);
}

var helpTooltipEventListener = function() {
  helpTooltipElement.classList.add('hidden');
}

function removeHelpTooltip() {
  map.removeOverlay(helpTooltip);
  map.getViewport().removeEventListener('mouseout', helpTooltipEventListener);
}

function createMeasureTooltip() {
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
  }
  measureTooltipElement = document.createElement('div');
  measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
  measureTooltip = new OverlayOL({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center',
    stopEvent: false,
    insertFirst: false,
  });
  map.addOverlay(measureTooltip);
}

var pointerMoveHandler = function(evt) {
if (evt.dragging) {
  return;
}

if (sketch) {
  var geom = (sketch.getGeometry());
  if (geom instanceof Polygon) {
    helpMsg = continuePolygonMsg;
  } else if (geom instanceof LineString) {
    helpMsg = continueLineMsg;
  }
}

  if (helpTooltipElement && helpTooltipElement !== undefined) {
    helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);
    helpTooltipElement.classList.remove('hidden');
  }
};

var formatLength = function(line) {
  var length = getLength(line);
  var output;
  if (length > 100) {
    output = (Math.round(length / 1000 * 100) / 100) + ' ' + 'km';
  } 
  else {
    output = (Math.round(length * 100) / 100) + ' ' + 'm';
  }
  return output;
};  

var formatArea = function(polygon) {
  var area = getArea(polygon);
  var output;
  if (area > 10000) {
    output = (Math.round(area / 1000000 * 100) / 100) + ' ' + 'km<sup>2</sup>';
  } 
  else {
    output = (Math.round(area * 100) / 100) + ' ' + 'm<sup>2</sup>';
  }
  return output;
};

/*
 * Interaction
 *****************************************/
let select = new Select({ 
  layers: [tramsLayer, parcellesLayer],
  hitTolerance: 5,
  style: new Style({
    stroke: new Stroke({
      color: "#ffff00",
      width: 5
    })
  })
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

map.on('click', function(evt) {
  console.log(toLonLat(evt.coordinate));
});