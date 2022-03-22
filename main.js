import './style.css';

import {Map, View, Feature} from 'ol';
import {Tile as TileLayer, Vector as VectorLayer, Group as GroupLayer} from 'ol/layer';
import {OSM, TileWMS, TileArcGISRest, Vector as VectorSource, XYZ} from 'ol/source';
import {ScaleLine, defaults as defaultControls, Attribution} from 'ol/control';
import GeoJSON from 'ol/format/GeoJSON';
import {Select, Draw} from 'ol/interaction';
import {Overlay as OverlayOL} from 'ol';
import {Style, Stroke, Fill, Circle, Icon, Text} from 'ol/style';
import {LineString, Polygon, Point} from 'ol/geom';
import {getArea, getLength} from 'ol/sphere';
import {unByKey} from 'ol/Observable';
import {get as getProjection, transform, fromLonLat, toLonLat} from 'ol/proj';
import {register} from 'ol/proj/proj4';

import LayerSwitcher from 'ol-layerswitcher';
import Permalink from 'ol-ext/control/Permalink';
import Bar from 'ol-ext/control/Bar';
import Button from 'ol-ext/control/Button';
import Toggle from 'ol-ext/control/Toggle';
import Overlay from 'ol-ext/control/Overlay';
import GeolocationButton from 'ol-ext/control/GeolocationButton';
import Popup from 'ol-ext/overlay/Popup';
import proj4 from 'proj4';

import $ from 'jquery';
import Cookies from 'js-cookie';
import i18next from 'i18next';

const zoomInit = 16,
      coordsInit = fromLonLat([ 1.957, 41.271 ]),
      qgisserverUrl = 'https://mapa.psig.es/qgisserver/cgi-bin/qgis_mapserv.fcgi',
      mapproxyUrl = 'https://mapa.psig.es/mapproxy/service',
      wfsUrl = 'https://mapa.psig.es/qgisserver/wfs3/collections/',
      wfsItems = '/items.geojson',
      wfsMapPath = '?MAP=/home/ubuntu/bellamar/Obra_Bellamar_web.qgs',
      wfsLimit = '&limit=10000';

let caToggle,
    esToggle,
    docsToggle,
    layersToggle,
    searchToggle,
    appToggle,
    urlBtn,
    geolocBtn,
    measureToggle,
    distanceToggle,
    areaToggle,
    windowDocs,
    windowFeature;

// https://epsg.io/25831
proj4.defs("EPSG:25831","+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
register(proj4);

/*
 * Base Layers
 *****************************************/
let ninguLayer = new TileLayer({
  title: 'Ningú',
  type: 'base',
  source: null,
  visible: false,
});

let osmLayer = new TileLayer({
  title: 'OpenStreetMap',
  type: 'base',
  visible: false,
  source: new OSM()
});

let ortoLayer = new TileLayer({
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
});

let topoBaseLayer = new TileLayer({
  title: 'Topográfic (ICGC)',
  type: 'base',
  visible: true,
  maxZoom: 18,
  source: new TileWMS({
    url: 'https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wms/service?',
    params: {
      'LAYERS': 'topogris', 
      'VERSION': '1.1.1'
    },
    attributions: ['Cartografia topogràfica 1:1.000 de l’<a target="_blank" href="https://www.icgc.cat/">Institut Cartogràfic i Geològic de Catalunya (ICGC)</a>, sota una llicència <a target="_blank" href="https://creativecommons.org/licenses/by/4.0/deed.ca">CC BY 4.0</a>'],
   })
});

let baseLayers = new GroupLayer({
  title: 'Mapa base',
  //fold: 'close',
  layers: [
    ninguLayer,
    osmLayer,
    ortoLayer,
    topoBaseLayer
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
    url: 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx',
    params: {
      'LAYERS': 'catastro', 
      'TILED': true,
      'SRS': 'EPSG:3857'
    }
  })
});

let xarxaResidualLayer = new TileLayer({
  title: 'Xarxa residual',
  visible: true,
  source: new TileWMS({
    //url: qgisserverUrl + wfsMapPath,
    url: mapproxyUrl + wfsMapPath,
    params: {
      'LAYERS': 'bellamar_xarxa_residual',
      'TRANSPARENT': true,
      'VERSION': '1.3.0',
    },
    serverType: 'qgis'
  })
});

let xarxaPluvialLayer = new TileLayer({
  title: 'Xarxa pluvial',
  visible: true,
  source: new TileWMS({
    //url: qgisserverUrl + wfsMapPath,
    url: mapproxyUrl + wfsMapPath,
    params: {
      'LAYERS': 'bellamar_xarxa_pluvial',
      'TRANSPARENT': true,
      'VERSION': '1.3.0',
    },
    serverType: 'qgis'
  })
});

const pluvialStyle = new Style({
  stroke: new Stroke({
    lineDash: [10, 5],
    color: '#1f78b4',
    width: 3
  })
});
let pluvialLayer = new VectorLayer({
  visible: true,
  source: new VectorSource({
    format: new GeoJSON(),
    url: wfsUrl + 'bellamar_pluvial' + wfsItems + wfsMapPath + wfsLimit
    //url: 'bellamar_pluvial.geojson'
  }),
  style: pluvialStyle
});

const tramsStyles = {
  'finalitzat': new Style({
    stroke: new Stroke({
      color: "rgba(9,222,0,0.8)",
      width: 12,
      lineCap: 'square'
    })
  }),
  'en obra': new Style({
    stroke: new Stroke({
      color: "rgba(219,30,42,0.8)",
      width: 16,
      lineCap: 'square'
    }),
    text: new Text({
      font: 'bold 16px "dinbold", "sans-serif"',
      placement: 'point',
      fill: new Fill({
        color: 'red'
      }),
      backgroundFill: new Fill({
        color: 'rgba(255,255,255,0.5)'
      }),
      offsetX: 30,
      offsetY: -30,
      overflow: true
    }),
  }),
  'inici en breu': new Style({
    stroke: new Stroke({
      color: "rgba(255,140,0,0.8)",
      width: 12,
      lineCap: 'square'
    })
  }),
  'pendent': null,
  'exclòs': new Style({
    stroke: new Stroke({
      color: "rgba(146,147,151,0.5)",
      width: 3
    })
  }),
  default: new Style({
    stroke: new Stroke({
      color: "rgba(255,255,0,0.5)",
      width: 2
    })
  })
}
let tramsLayer = new VectorLayer({
  title: 'Trams de les obres',
  name: 'trams',
  visible: true,
  declutter: true,
  source: new VectorSource({
    format: new GeoJSON(),
    url: wfsUrl + 'Trams de les obres' + wfsItems + wfsMapPath + wfsLimit
    //url: 'Trams de les obres.geojson'
  }),
  style: function(feature, resolution) {
    let estat = feature.get('estat');

    if (estat === 'en obra') {
      let style = tramsStyles[estat],
          label = feature.get('eix_ncar')+"\nInici: "+feature.get('data_inici_obres')+"\nFin: "+feature.get('data_fi_obres');
      
      style.getText().setText(label);
      return style;
    }
    else if (estat === 'finalitzat' ||
      estat === 'en obra' ||
      estat === 'inici en breu' ||
      estat === 'pendent' ||
      estat === 'exclòs') {
      return tramsStyles[estat];
    }
    else {
      return tramsStyles['default'];
    }
  }
});

let circulacioLayer = new TileLayer({
  title: 'Sentit de circulació',
  visible: true,
  source: new TileWMS({
    //url: qgisserverUrl + wfsMapPath,
    url: mapproxyUrl + wfsMapPath,
    params: {
      'LAYERS': 'bellamar_sentido_circulacion',
      //'LAYERS': 'sentido_circulacion',
      'TRANSPARENT': true,
      'VERSION': '1.3.0',
    },
    serverType: 'qgis'
  })
});

const parcellesStyle = new Style({
  fill: new Fill({
    //color: "#c49a97"
    color: "rgba(196,154,151,0.4)"
  })
});
const parcellesResidualStyle = new Style({
  fill: new Fill({
    //color: "#876964"
    color: "rgba(135,105,100,0.4)"
  })
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
      return parcellesStyle
    }
    else if (feature.get('residual') === 'Sí') {
      return parcellesResidualStyle
    }
    else {
      return null;
    }
  }
});

const barrisStyle = new Style({
  stroke: new Stroke({
    color: "#000",
    width: 2
  })
});
let barrisLayer = new VectorLayer({
  title: 'Barris',
  visible: true,
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'barris.geojson',
  }),
  style: barrisStyle
});

/*
 * Map
 *****************************************/
const map = new Map({
  target: 'map',
  controls: defaultControls().extend([new ScaleLine()]),
  layers: new GroupLayer({
    fold: 'close',
    layers: [
      baseLayers,
      catastroLayer,
      topoLayer,
      barrisLayer,
      pluvialLayer,
      tramsLayer,
      parcellesLayer,
      xarxaPluvialLayer,
      xarxaResidualLayer,
      circulacioLayer,
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
function renderMenu() {
  windowDocs = new Overlay({ 
    closeBox : true, 
    className: "slide-left menu", 
    content: $("#windowDocs").get(0)
  });
  map.addControl(windowDocs);

  let windowLayers = new Overlay({ 
    closeBox : true, 
    className: "slide-left menu", 
    content: $("#windowLayers").get(0)
  });
  map.addControl(windowLayers);

  LayerSwitcher.renderPanel(map, document.getElementById("layerSwitcher"), { reverse: true });

  let windowSearch = new Overlay({ 
    closeBox : true, 
    className: "slide-left menu", 
    content: $("#windowSearch").get(0)
  });
  map.addControl(windowSearch);

  let windowApp = new Overlay({ 
    closeBox : true, 
    className: "slide-left menu", 
    content: $("#windowApp").get(0)
  });
  map.addControl(windowApp);

  windowFeature = new Overlay({ 
    closeBox : true, 
    className: "slide-right info", 
    content: $("#windowFeature").get(0)
  });
  map.addControl(windowFeature);
  windowFeature.on("change:visible", function(e) {
    if (!e.visible) {

    }
  });

  let menuBar = new Bar({
    className: "ol-top ol-left menuBar"
  });
  map.addControl(menuBar);

  let actionBar = new Bar({ toggleOne: true, group: true });
  menuBar.addControl(actionBar);

  let logoBtn = new Button({ 
    html: '<img src="logo.png" />',
    className: "logo",
    title: "Castelldefels",
    handleClick: function() { 
      map.getView().setCenter(coordsInit);
      map.getView().setZoom(zoomInit);
    }
  });
  actionBar.addControl(logoBtn);

  docsToggle = new Toggle({ 
    html: '<i class="fa fa-file-text-o"></i>',
    className: "docsToggle",
    onToggle: function() {
      hideWindows("docs");
      windowDocs.toggle();
    }
  });
  actionBar.addControl(docsToggle);

  layersToggle = new Toggle({ 
    html: '<i class="fa fa-align-justify"></i>',
    className: "layersToggle",
    onToggle: function() {
      hideWindows("layers");
      windowLayers.toggle();
    }
  });
  actionBar.addControl(layersToggle);

  searchToggle = new Toggle({ 
    html: '<i class="fa fa-search"></i>',
    className: "searchToggle",
    onToggle: function() {
      hideWindows("search");
      windowSearch.toggle();
    }
  });
  actionBar.addControl(searchToggle);

  function hideWindows(activeToggle) {
    windowDocs.hide();
    windowLayers.hide();
    windowSearch.hide();
    windowApp.hide();

    if (activeToggle !== "docs")
      docsToggle.setActive(false);
    else if (activeToggle !== "layers")
      layersToggle.setActive(false);
    else if (activeToggle !== "search")
      searchToggle.setActive(false);
    else if (activeToggle !== "app")
      appToggle.setActive(false);
  }

  let twitterBtn = new Button({ 
    //html: '<i class="fa fa-twitter" aria-hidden="true"></i>',
    html: '<img src="https://www.castelldefels.org/A_Comuns/_Pells/_Comu/Img/Xarxes/twitter.png" alt="twitter" width="20" height="20">',
    className: "twitter",
    title: "Twitter",
    handleClick: function() { 
      //window.open("https://twitter.com/AjCastelldefels", "_blank").focus();
      window.open("https://twitter.com/hashtag/ObresBellamarCastelldefels", "_blank").focus();
    }
  });
  actionBar.addControl(twitterBtn);

  appToggle = new Toggle({ 
    html: '<img src="https://w2.m7citizensecurity.com/wp-content/uploads/2021/07/cropped-LogoM7_peq-32x32.jpg" alt="M7 app" width="20" height="20">',
    className: "appToggle",
    onToggle: function() {
      hideWindows("app");
      windowApp.toggle();
    }
  });
  actionBar.addControl(appToggle);


  /*let whatsappBtn = new Button({ 
    //html: '<i class="fa fa-whatsapp" aria-hidden="true"></i>',
    html: '<img src="https://www.castelldefels.org/A_Comuns/_Pells/_Comu/Img/Xarxes/whatsapp.png" alt="whatsapp" width="20" height="20">',
    className: "whatsapp",
    title: "Whatsapp",
    handleClick: function() { 
      
    }
  });
  actionBar.addControl(whatsappBtn);

  let telegramBtn = new Button({ 
    //html: '<i class="fa fa-telegram" aria-hidden="true"></i>',
    html: '<img src="https://www.castelldefels.org/A_Comuns/_Pells/_Comu/Img/Xarxes/telegram.png" alt="telegram" width="20" height="20">',
    className: "telegram",
    title: "Telegram",
    handleClick: function() { 
      
    }
  });
  actionBar.addControl(telegramBtn);*/

  let languageBar = new Bar({ toggleOne: true, group: true });
  menuBar.addControl(languageBar);

  caToggle = new Toggle({ 
    html: 'CA',
    className: "lang ca",
    title: "Català",
    onToggle: function() {
      i18next.changeLanguage('ca');
    }
  });
  languageBar.addControl(caToggle);

  esToggle = new Toggle({ 
    html: 'ES',
    className: "lang es",
    title: "Castellano",
    onToggle: function() {
      i18next.changeLanguage('es');
    }
  });
  languageBar.addControl(esToggle);

  $(".window").show();
}

/*
 * Action buttons
 *****************************************/
function renderButtons() {
  urlBtn = new Permalink({ 
    urlReplace: true
  });
  map.addControl(urlBtn);

  geolocBtn = new GeolocationButton({
    delay: 5000
  });
  map.addControl(geolocBtn);

  let here = new Popup({ positioning: 'bottom-center' });
  map.addOverlay(here);
  geolocBtn.on('position', function(e) {
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

  distanceToggle = new Toggle({ 
    //html:'<i class="fa fa-arrows-h"></i>', 
    html: '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="https://www.w3.org/2000/svg"><g transform="translate(0 -8)"><path d="m1.5000001 20.5h21v7h-21z" style="overflow:visible;fill:#c7c7c7;fill-rule:evenodd;stroke:#5b5b5c;stroke-width:.99999994;stroke-linecap:square"/><path d="m4.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m7.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m10.5 20v6" fill="none" stroke="#5b5b5c"/><path d="m13.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m16.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m19.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m2.5 13v4" fill="none" stroke="#415a75"/><path d="m21.5 13v4" fill="none" stroke="#415a75"/><path d="m2 15h20" fill="none" stroke="#415a75" stroke-width="1.99999988"/></g></svg>',
    //autoActivate: true,
    onToggle: function(b) { 
      measureActive = b;
      enableInteraction(b, true);
    } 
  }),
  areaToggle = new Toggle({ 
    //html:'<i class="fa fa-arrows-alt"></i>', 
    html: '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="https://www.w3.org/2000/svg"><g transform="translate(0 -8)"><path d="m1.5000001 20.5h21v7h-21z" style="overflow:visible;fill:#c7c7c7;fill-rule:evenodd;stroke:#5b5b5c;stroke-width:.99999994;stroke-linecap:square"/><path d="m4.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m7.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m10.5 20v6" fill="none" stroke="#5b5b5c"/><path d="m13.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m16.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m19.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m2.5 9.5h5v2h14v7.5h-6.5v-5h-5v3.5h-7.5z" fill="#6d97c4" fill-rule="evenodd" stroke="#415a75"/></g></svg>',
    onToggle: function(b) { 
      measureActive = b;
      enableInteraction(b, false);
    }
  })

  let submeasureBar = new Bar({ 
    toggleOne: true,
    autoDeactivate: true,
    controls: [ 
      distanceToggle,
      areaToggle
    ]
  });
  measureToggle = new Toggle({ 
    html: 'M',
    bar: submeasureBar,
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
}

/*
 * Interaction
 *****************************************/
let highlightStyle = new Style({
  stroke: new Stroke({
    color: "#ffff00",
    width: 12
  }),
  fill: new Fill({
    color: 'rgba(255,255,0,0.3)'
  })
});

let select = new Select({ 
  layers: [tramsLayer, parcellesLayer],
  hitTolerance: 5,
  style: highlightStyle
});
map.addInteraction(select);

// On selected => show/hide popup
select.getFeatures().on('add', function(e) {
  let feature = e.element,
      layer = select.getLayer(feature).get('name'),
      content = $("<div>");

  if (layer === "trams") {
    content
      .append( getField(feature, "eix_ncar") )
      .append( getField(feature, "observacions") )
      .append( getField(feature, "estat") )
      .append( getField(feature, "data_inici_obres") )
      .append( getField(feature, "data_fi_obres") );
  }
  else if (layer === "parcelles") {
    content
      .append( getField(feature, "refcat") )
      .append( getField(feature, "residual") )
      .append( getField(feature, "conveni") );
  }

  $("#windowFeature .content").html(content);
  windowFeature.show();
});
select.getFeatures().on('remove', function(e) { 
  $("#windowFeature .content").html("");
  windowFeature.hide();
});

function getField(feature, key) {
  let val = feature.get(key);
  if (key === "estat") {
    val = i18next.t("feature."+val);
  }

  if (val === null) {
    return "";
  }

  return $("<p>").html(
    "<span class='label " + key + "'>" + 
    i18next.t("feature."+key) + 
    "</span>: " + 
    val
  );
}

/*
 * Cercadors
 *****************************************/
$.get("./carrers.txt", function(data) {
  let carrers = data.split(',\n');
  let n = carrers.length;  

  $("#searchCarrer").keyup(function(e) {

    document.getElementById('carrerList').innerHTML = '';
    $("#searchNumero").empty();

    for (let i = 0; i<n; i++) {
      let carrer = carrers[i].split(',');
      if(((carrer[1].toLowerCase()).indexOf($("#searchCarrer").val().toLowerCase()))>-1) {

        let node = document.createElement("option"),
            val = document.createTextNode(carrer[1]),
            attr = document.createAttribute("value");
        //attr.value = carrer[0];
        //node.setAttributeNode(attr);
        node.appendChild(val);
        node.setAttribute("data-id", carrer[0]);

        document.getElementById("carrerList").appendChild(node);
      }
    }
  });

  $("#searchCarrer").on('input', function (e) {
    $("#searchMsg").text("");
    
    let val = this.value;
    let id = -1;
    if($('#carrerList option').filter(function(){
      if (this.value === val) id = this.dataset.id;
      return (this.value === val);
    }).length) {
      loadCarrerNums(id);
    }
  });

  function loadCarrerNums(carrer) {

    if (carrer && carrer !== "" && carrer !== -1) {

      $.ajax({
        url: './ajaxfile.php',
        type: 'post',
        data: {
          request: 'carrersNum',
          carrer: carrer
        },
        dataType: 'json',
        success: function(response){
          if (response.length > 0) {
            $("#searchNumero").empty();
            $("#searchNumero").append('<option value="-1">'+i18next.t('search.searchOption')+'</option>');
            for (let i in response) {
              let geom = JSON.parse(response[i].geom);
              $("#searchNumero").append('<option data-x="'+geom.coordinates[0][0]+'" data-y="'+geom.coordinates[0][1]+'">'+response[i].npol_num1+'</option>');
            }
          }
          else {
            $("#searchMsg").text("No ha hi cap número de aquest carrer.")
          }
        }
      });
    }
  }
});

// search number selection
$("#searchNumero").on("change", function() {
  var x = Number(this.options[this.selectedIndex].getAttribute('data-x'));
  var y = Number(this.options[this.selectedIndex].getAttribute('data-y'));
    
  if (isNumeric(x) && isNumeric(y)) {
    zoomToCoord(x,y,false);
    showIcon([x,y]);
  }

  return false;
});

$("#searchReferenciaBtn").click(function() {
  $("#searchMsg").text("");
  if (parcelaSource !== null) parcelaSource.clear();
  let refcat = $("#searchReferencia").val().trim();

  if (refcat && refcat !== "") {

    $.ajax({
      url: './ajaxfile.php',
      type: 'post',
      data: {
        request: 'catasterGeom',
        refcat: refcat
      },
      dataType: 'json',
      success: function(response){
        if (response.length > 0) {
          zoomToCoord(response[0].coorx, response[0].coory,true);
          highlightPoligon(response[0].geom);
        }
        else {
          $("#searchMsg").text("No ha hi cap parcela amb aquesta referència cadastral.")
        }
      }
    });
  }
});

function zoomToCoord(x,y,reproject=false) {
  // check if in bounds of layers with: 
  // SELECT ST_Extent(geom) from limit_admin.tm_limit_lin;
      // result: "BOX(409978.249378971 4587601.47112343,416985.690776374 4597348.5951092)"
  //if (x > 409978.249378971 && x < 416985.690776374 && y > 4587601.47112343 && y < 4597348.5951092) {

    console.log("zoomToCoord:"+x+":"+y);

    let coord = [x, y];
    if (reproject) {
      coord = transform([x, y], getProjection('EPSG:25831'), 'EPSG:3857');
    }

    map.getView().animate({
      zoom: map.getView().getZoom()+1, 
      center: coord,
      duration: 2000
    });

    // show icon
    //showIcon(coord);

    // show feature info if radio selected
    /*if ($('input[name=searchinfo]:checked').val() === "info") {
      selectFeatureInfo(coord);
      $("#infoPanel").show();
    }*/
  /*}
  else {
    console.log("zoomToCoord problem, x or y out of bounds: "+x+":"+y);
  }*/
}

// highlight geom of parcela
let parcelaLayer = null,
    parcelaSource = null;
function highlightPoligon(geom) {
  if (geom) {
    //console.log("highlightPoligon: "+geom);

    if (parcelaLayer === null) {

      parcelaSource = new VectorSource({
        features: (new GeoJSON()).readFeatures(geom)
      });

      parcelaLayer = new VectorLayer({
        source: parcelaSource,
        style: highlightStyle
      });

      map.addLayer(parcelaLayer);
    }

    else {
      parcelaSource.clear();
      parcelaSource.addFeatures((new GeoJSON()).readFeatures(geom));
    }
  }
}

// draw icon on coord
let iconLayer = null,
    iconPoint = null;
function showIcon(coord) {

  console.log("showIcon:"+coord[0]+":"+coord[1]);

  if (iconLayer === null) {
    iconPoint = new Point(coord);
    iconLayer = new VectorLayer({
      source: new VectorSource({
        features: [
          new Feature({
            geometry: iconPoint,
          })
        ]
      }),
      style: new Style({
        image: new Icon(({
          anchor: [0.5, 0],
          anchorOrigin: 'bottom-left',
          color: [255, 0, 0, 1],
          src: './marker.png'
        }))
      })
    });
    map.addLayer(iconLayer);

    // hide Icon when info panel is closed
    /*$("#infoPanel").on("click", "a.pull-right", function(){
      map.removeLayer(iconLayer);
      iconLayer = null;
      if (parcelaLayer !== null) parcelaSource.clear();
        return false;
    });*/
  }
  else {
    iconPoint.setCoordinates(coord);
  }
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

map.on('click', function(evt) {
  if (parcelaSource !== null) parcelaSource.clear();
  map.removeLayer(iconLayer);
  iconLayer = null;
  console.log(toLonLat(evt.coordinate));
});

/*
 * Cookies
 *****************************************/
const cookieOptions = { sameSite: 'strict', secure: true };

function initCookies() {
  if (Cookies.get('showinfo') === undefined || Cookies.get('showinfo') === "true") {
    docsToggle.setActive(true);
    windowDocs.show();
  }
  else {
    $('#showinfo').prop('checked', true);
  }

  $('#showinfo').change(function() {
    Cookies.set('showinfo', !this.checked, cookieOptions);
  });

  $.ajax({
    url: './translations.json',
    dataType: 'json',
    success: function(response){
      let lang = getCookies();

      i18next.init({
        lng: lang,
        debug: true,
        resources: response
      }).then(function(t) {

        translateContent();

        i18next.on('languageChanged', () => {
          Cookies.set('lang', i18next.language, cookieOptions);
          //console.log(i18next.language, Cookies.get('lang'));

          translateContent();
        });
      });
    }
  });
}

function getCookies() {
  let lang = 'ca';

  if (Cookies.get('lang') === undefined) {
    /*let userLang = navigator.language || navigator.userLanguage;
    if (userLang === 'ca' || userLang == 'es') {
      lang = userLang;
    }*/
    Cookies.set('lang', lang, cookieOptions);
  }
  else {
    lang = Cookies.get('lang');
  }

  //let userLang = navigator.language || navigator.userLanguage;
  //console.log("The language is: " + lang + " (Browser language:" + userLang + ")");

  if (lang === "es")
    esToggle.setActive(true);
  else
    caToggle.setActive(true);

  return lang;
}

function translateContent() {
  // menu
  docsToggle.setTitle(i18next.t('gui.windowDocsTitle'));
  layersToggle.setTitle(i18next.t('gui.windowLayersTitle'));
  searchToggle.setTitle(i18next.t('gui.windowSearchTitle'));
  appToggle.setTitle(i18next.t('gui.windowAppTitle'));

  // info window
  $("#windowDocs .text").text(i18next.t('gui.windowDocsText'));
  $("#windowDocs .text_whatsapp").text(i18next.t('gui.windowDocsTextWhatsapp'));
  $("#windowDocs .text_app").text(i18next.t('gui.windowDocsTextApp'));
  $("#windowApp .text_app").text(i18next.t('gui.windowDocsTextApp'));
  $("#windowDocs .text_app_label").text(i18next.t('gui.windowDocsTextAppLabel'));
  $("#windowApp .text_app_label").text(i18next.t('gui.windowDocsTextAppLabel'));
  $("#windowDocs .info label").text(i18next.t('gui.windowDocsShowInfo'));

  // search window
  $("#windowSearch .titleCarrer").text(i18next.t('search.titleCarrer'));
  $("#windowSearch .labelCarrer").text(i18next.t('search.labelCarrer'));
  $("#windowSearch .labelNumero").text(i18next.t('search.labelNumero'));
  $("#windowSearch #searchOption").text(i18next.t('search.searchOption'));
  $("#windowSearch .titleCatastro").text(i18next.t('search.titleCatastro'));
  $("#windowSearch .introCatastro").text(i18next.t('search.introCatastro'));
  $("#windowSearch .labelReferencia").text(i18next.t('search.labelReferencia'));
  $("#windowSearch .btnReferencia").text(i18next.t('search.btnReferencia'));

  // buttons
  $(".ol-permalink button").attr("title", i18next.t('gui.urlmsg'));
  geolocBtn.setTitle(i18next.t('gui.geopos'));
  measureToggle.setTitle(i18next.t('gui.measure'));
  distanceToggle.setTitle(i18next.t('gui.measureDistance'));
  areaToggle.setTitle(i18next.t('gui.measureArea'));
  $(".ol-attribution button").attr("title", i18next.t('gui.attribution'));

  // windows
  $("#windowDocs .title").text(i18next.t('gui.windowDocsTitle'));
  $("#windowLayers .title").text(i18next.t('gui.windowLayersTitle'));
  $("#windowSearch .title").text(i18next.t('gui.windowSearchTitle'));
  $("#windowApp .title").text(i18next.t('gui.windowAppTitle'));
  $("#windowFeature .title").text(i18next.t('gui.windowFeatureTitle'));

  // labels
  $("#windowFeature .label.eix_ncar").text(i18next.t('feature.eix_ncar'));
  $("#windowFeature .label.observacions").text(i18next.t('feature.observacions'));
  $("#windowFeature .label.estat").text(i18next.t('feature.estat'));
  $("#windowFeature .label.data_inici_obres").text(i18next.t('feature.data_inici_obres'));
  $("#windowFeature .label.data_fi_obres").text(i18next.t('feature.data_fi_obres'));
  $("#windowFeature .label.refcat").text(i18next.t('feature.refcat'));
  $("#windowFeature .label.residual").text(i18next.t('feature.residual'));
  $("#windowFeature .label.conveni").text(i18next.t('feature.conveni'));

  // layerswitcher
  circulacioLayer.set("title", i18next.t('switcher.circulacioLayer'));
  xarxaResidualLayer.set("title", i18next.t('switcher.xarxaResidualLayer'));
  xarxaPluvialLayer.set("title", i18next.t('switcher.xarxaPluvialLayer'));
  parcellesLayer.set("title", i18next.t('switcher.parcellesLayer'));
  tramsLayer.set("title", i18next.t('switcher.tramsLayer'));
  barrisLayer.set("title", i18next.t('switcher.barrisLayer'));
  topoLayer.set("title", i18next.t('switcher.topoLayer'));
  catastroLayer.set("title", i18next.t('switcher.catastroLayer'));
  baseLayers.set("title", i18next.t('switcher.baseLayers'));
  topoBaseLayer.set("title", i18next.t('switcher.topoBaseLayer'));
  ortoLayer.set("title", i18next.t('switcher.ortoLayer'));
  osmLayer.set("title", i18next.t('switcher.osmLayer'));
  ninguLayer.set("title", i18next.t('switcher.ninguLayer'));
  LayerSwitcher.renderPanel(map, document.getElementById("layerSwitcher"), { reverse: true });
}

/*
 * Cookies
 *****************************************/

$(function() {
  renderMenu();
  renderButtons();
  initCookies();
})