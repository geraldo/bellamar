import{f as I,G as b,T as n,O as W,a as v,b as k,V as T,c as E,d as V,M as R,e as j,S as x,g as F,L as P,o as r,$ as s,h as L,i as d,j as f,k as Y,l as q,m as D,n as z,t as J}from"./vendor.e301ca3a.js";const K=function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))C(e);new MutationObserver(e=>{for(const a of e)if(a.type==="childList")for(const c of a.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&C(c)}).observe(document,{childList:!0,subtree:!0});function G(e){const a={};return e.integrity&&(a.integrity=e.integrity),e.referrerpolicy&&(a.referrerPolicy=e.referrerpolicy),e.crossorigin==="use-credentials"?a.credentials="include":e.crossorigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function C(e){if(e.ep)return;e.ep=!0;const a=G(e);fetch(e.href,a)}};K();const _=16,S=I([1.957,41.271]);let Z=new b({title:"Mapes base",layers:[new n({title:"OpenStreetMap",type:"base",source:new W}),new n({title:"Ning\xFA",type:"base",source:null,visible:!1}),new n({title:"Ortofoto (IGCG)",type:"base",visible:!1,source:new v({url:"http://geoserveis.icc.cat/icc_mapesmultibase/utm/wms/service?",params:{LAYERS:"orto",VERSION:"1.1.1"},attributions:['Ortofoto 1:1.000 de l\u2019<a target="_blank" href="http://www.icgc.cat/">Institut Cartogr\xE0fic i Geol\xF2gic de Catalunya (ICGC)</a>, sota una llic\xE8ncia <a target="_blank" href="https://creativecommons.org/licenses/by/4.0/deed.ca">CC BY 4.0</a>']})}),new n({name:"baseLayerTopoAMB",title:"Topogr\xE0fic (AMB)",qgistitle:"@ Capes topografiques AMB",type:"base",visible:!1,source:new k({url:"http://geoportal.amb.cat/geoserveis/rest/services/topografia_1000_3857/MapServer",projection:"EPSG:3857",params:{LAYERS:"Nivell 1M"},attributions:['\xA9 <a target="_blank" href="https://www.amb.cat/">AMB</a>']})}),new n({title:"Topogr\xE1fic (IGCG)",type:"base",visible:!1,source:new v({url:"http://geoserveis.icc.cat/icc_mapesmultibase/utm/wms/service?",params:{LAYERS:"topogris",VERSION:"1.1.1"},attributions:['Cartografia topogr\xE0fica 1:1.000 de l\u2019<a target="_blank" href="http://www.icgc.cat/">Institut Cartogr\xE0fic i Geol\xF2gic de Catalunya (ICGC)</a>, sota una llic\xE8ncia <a target="_blank" href="https://creativecommons.org/licenses/by/4.0/deed.ca">CC BY 4.0</a>']})})]}),$=new T({title:"Bellamar",visible:!0,source:new E({format:new V,url:"bellamar.geojson"})});const t=new R({target:"map",controls:j().extend([new x]),layers:new b({title:"Mapes base",fold:"close",layers:[Z,$]}),view:new F({center:S,zoom:_})});let H=new P({startActive:!0,activationMode:"click"});t.addControl(H);let u=new r({closeBox:!0,className:"slide-left menu",content:s("#infoWindowDocs").get(0)});t.addControl(u);let g=new r({closeBox:!0,className:"slide-left menu",content:s("#infoWindowLayers").get(0)});t.addControl(g);let m=new r({closeBox:!0,className:"slide-left menu",content:s("#infoWindowSearch").get(0)});t.addControl(m);let B=new r({closeBox:!0,className:"slide-right info",content:s("#infoWindowFeature").get(0)});t.addControl(B);let p=new L;t.addControl(p);p.setPosition("top-left");let l=new L({toggleOne:!0,group:!0});p.addControl(l);let Q=new d({html:'<img src="LogoAjuntament49_2016.C4.png" />',className:"logo",title:"Castelldefels",handleClick:function(){t.getView().setCenter(S),t.getView().setZoom(_)}});l.addControl(Q);let N=new f({html:'<i class="fa fa-file-text-o"></i>',className:"docs",title:"Documents",onToggle:function(){w("docs"),u.toggle()}});l.addControl(N);let O=new f({html:'<i class="fa fa-align-justify"></i>',className:"layers",title:"Capas",onToggle:function(){w("layers"),g.toggle()}});l.addControl(O);let M=new f({html:'<i class="fa fa-search"></i>',className:"search",title:"Buscar",onToggle:function(){w("search"),m.toggle()}});l.addControl(M);function w(o){u.hide(),g.hide(),m.hide(),o!=="docs"?N.setActive(!1):o!=="layers"?O.setActive(!1):o!=="search"&&M.setActive(!1)}let U=new d({html:'<i class="fa fa-whatsapp" aria-hidden="true"></i>',className:"whatsapp",title:"Whatsapp",handleClick:function(){}});l.addControl(U);let X=new d({html:'<i class="fa fa-telegram" aria-hidden="true"></i>',className:"telegram",title:"Whatsapp",handleClick:function(){}});l.addControl(X);let ee=new Y({urlReplace:!0});t.addControl(ee);let A=new q({title:"On estic?",delay:5e3});t.addControl(A);let h=new D({positioning:"bottom-center"});t.addOverlay(h);A.on("position",function(o){o.coordinate?h.show(o.coordinate,"Ets aqu\xED!"):h.hide()});let y=new z({});t.addInteraction(y);y.getFeatures().on("add",function(o){B.toggle()});y.getFeatures().on("remove",function(o){s("#infoWindowFeature .content").html("")});t.on("click",function(o){console.log(J(o.coordinate))});
//# sourceMappingURL=index.49b48ce3.js.map