var map;
var layerControl;
var stations = {};
var polys = [];
function isMarkerInsidePolygon(marker) {
    var inside = false;
    polys.forEach(poly=>{
        var polyPoints = poly.getLatLngs();       
        var x = marker.getLatLng().lat, y = marker.getLatLng().lng;
        for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
            var xi = polyPoints[i].lat, yi = polyPoints[i].lng;
            var xj = polyPoints[j].lat, yj = polyPoints[j].lng;
            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }    
    })
    return inside;
};

async function getBetaCSOInfo() {
    let url = "https://script.google.com/macros/s/AKfycbxctfjlOvRaXiqO126Ckl4wH8btTuk-jtAz_9Dw6HNWz3Fcc1iKJyNAKPIR6REB_nrHVg/exec"
    const response = await fetch(url);
    if(response.status == 200){
        var betaCSOs = new L.LayerGroup();
        var dischargingCSOs = new L.LayerGroup();
        var offlineCSOs = new L.LayerGroup();
        var inMaintenanceCSOs = new L.LayerGroup();
        var CSOsCount = 0, dischargingCSOsCount = 0, offlineCSOsCount = 0, inMaintenanceCSOsCount = 0;
        const responseJson = await response.json();
        let result = responseJson["result"];
        CSOsCount = result.length;
        result.forEach(element => {
            let csoColor = "rgb(50, 100, 0)";
            if(element.is_discharging){csoColor =  "rgb(100, 50, 0)";}
            let marker = L.circleMarker([element.cooridinate.lat, element.cooridinate.lng],{radius:4,color:csoColor});
            marker.bindTooltip(decodeURI(element.site_name));
            marker.properties = element;
            //marker.addEventListener('click', _starterMarkerOnClick);
            //layer.eachLayer(function(memberLayer) {
            //    if (memberLayer.contains(point.getLatLng())) {
            //      console.log(memberLayer.feature.properties);
            //    }
            //  });
            marker.addTo(betaCSOs);
            let badge = "";
            if(!element.is_online){
                offlineCSOsCount ++;
                marker.addTo(offlineCSOs);
                badge += ` <span class="badge text-bg-warning">offline</span>`;
            }
            if(element.is_in_maintenance){
                inMaintenanceCSOsCount ++;
                marker.addTo(inMaintenanceCSOs);
                badge += ` <span class="badge text-bg-warning">in maintenance</span>`;
            }
            if(element.is_discharging){
                dischargingCSOsCount ++;
                marker.addTo(dischargingCSOs);
                marker.bindPopup(`<div class="card">
                    <h6>${element.site_name}${badge}</h6>
                <ul class="list-group list-group-flush">
                <li class="list-group-item">Started: ${element.recent_discharge.started}</li>
                <li class="list-group-item">Duration: ${element.recent_discharge.duration_mins} mins</li>
                <li class="list-group-item">Discharge to: ${element.receiving_water_or_environment}</li>
			    <li class="list-group-item">Is overflow expected?: ${element.is_overflow_expected}</li>
                </ul>
                </div>`);
            } 
            else{
                marker.bindPopup(`
                <div class="card">
                    <h6>${element.site_name}${badge}</h6>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item">Last discharge: ${element.recent_discharge.started}</li>
                        <li class="list-group-item">Duration: ${element.recent_discharge.duration_mins} mins</li>
                    <li class="list-group-item">Discharges to: ${element.receiving_water_or_environment}</li>
                    </ul>
                </div>`);                
            }
        });
        layerControl.addOverlay(betaCSOs, `Beta Anglian CSOs (${CSOsCount})`);
        layerControl.addOverlay(dischargingCSOs, `CSOs discharging (${dischargingCSOsCount})`);
        layerControl.addOverlay(offlineCSOs, `CSOs offline (${offlineCSOsCount})`);
        layerControl.addOverlay(inMaintenanceCSOs, `CSOs in maintenance (${inMaintenanceCSOsCount})`);
    }
}

async function getLatestCSOInfo() {
    let url = "https://services3.arcgis.com/VCOY1atHWVcDlvlJ/arcgis/rest/services/stream_service_outfall_locations_view/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson"
    const response = await fetch(url);
    if(response.status == 200){
        var CSOs = new L.LayerGroup();
        var dischargingCSOs = new L.LayerGroup();
        var offlineCSOs = new L.LayerGroup();
        var inMaintenanceCSOs = new L.LayerGroup();
        var CSOsCount = 0, dischargingCSOsCount = 0, offlineCSOsCount = 0, inMaintenanceCSOsCount = 0;
        const responseJson = await response.json();
        let result = responseJson["features"];
        CSOsCount = result.length;
        result.forEach(element => {
            let csoColor = "rgb(50, 100, 0)";
            if(element.properties.status == 1){csoColor =  "rgb(100, 50, 0)";}
            let marker = L.circleMarker([element.properties.Latitude, element.properties.Longitude],{radius:4,color:csoColor});
            marker.bindTooltip(decodeURI(element.properties.Id));
            marker.properties = element;
            marker.addEventListener('click', _CsoMarkerOnClick);
            marker.addTo(CSOs);
            /*
            let badge = "";
            if(!element.properties){
                offlineCSOsCount ++;
                marker.addTo(offlineCSOs);
                badge += ` <span class="badge text-bg-warning">offline</span>`;
            }
            if(element.is_in_maintenance){
                inMaintenanceCSOsCount ++;
                marker.addTo(inMaintenanceCSOs);
                badge += ` <span class="badge text-bg-warning">in maintenance</span>`;
            }
            if(element.is_discharging){
                dischargingCSOsCount ++;
                marker.addTo(dischargingCSOs);
                marker.bindPopup(`<div class="card">
                    <h6>${element.site_name}${badge}</h6>
                <ul class="list-group list-group-flush">
                <li class="list-group-item">Started: ${element.recent_discharge.started}</li>
                <li class="list-group-item">Duration: ${element.recent_discharge.duration_mins} mins</li>
                <li class="list-group-item">Discharge to: ${element.receiving_water_or_environment}</li>
			    <li class="list-group-item">Is overflow expected?: ${element.is_overflow_expected}</li>
                </ul>
                </div>`);
            } 
            else{
                marker.bindPopup(`
                <div class="card">
                    <h6>${element.site_name}${badge}</h6>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item">Last discharge: ${element.recent_discharge.started}</li>
                        <li class="list-group-item">Duration: ${element.recent_discharge.duration_mins} mins</li>
                    <li class="list-group-item">Discharges to: ${element.receiving_water_or_environment}</li>
                    </ul>
                </div>`);                
            }
            */
        });
        layerControl.addOverlay(CSOs, `Anglian CSOs (${CSOsCount})`);
        //layerControl.addOverlay(dischargingCSOs, `CSOs discharging (${dischargingCSOsCount})`);
        //layerControl.addOverlay(offlineCSOs, `CSOs offline (${offlineCSOsCount})`);
        //layerControl.addOverlay(inMaintenanceCSOs, `CSOs in maintenance (${inMaintenanceCSOsCount})`);
    }
}

async function getRainfallData(){
    let url = "https://check-for-flooding.service.gov.uk/api/rainfall.geojson"
    const response = await fetch(url);
    if(response.status == 200){
        var rainfall = new L.LayerGroup();
        var rainfallCount = 0;
        const responseJson = await response.json();
        let result = responseJson["features"];
        rainfallCount = result.length;
        result.forEach(element => {
            try{
            let rainfallColor = "rgb(20, 20, 20)";
            let marker = L.circleMarker([element.geometry.coordinates[1],element.geometry.coordinates[0]],{radius:4,color:rainfallColor});
            marker.bindTooltip(decodeURI(element.properties.station_name));
            marker.properties = element.properties;
            marker.addEventListener('click', _rainfallMarkerOnClick);
            marker.addTo(rainfall);
            let badge = "";
            }
            catch(err){
                console.log(err.message);
            }
            });
        layerControl.addOverlay(rainfall, `Rainfall (${rainfallCount})`);
    }
    
}

function _rainfallMarkerOnClick(e){
    let output = `
    <h6>${e.sourceTarget.properties.station_name}</h6>
                    <ul class="list-group list-group-flush">
				        <li class="list-group-item">"value": ${e.sourceTarget.properties.value}</li>
				        <li class="list-group-item">"value_timestamp": ${e.sourceTarget.properties.value_timestamp}</li>
				        <li class="list-group-item">"day_total": ${e.sourceTarget.properties.day_total}</li>
				        <li class="list-group-item">"six_hr_total": ${e.sourceTarget.properties.six_hr_total}</li>
				        <li class="list-group-item">"one_hr_total": ${e.sourceTarget.properties.one_hr_total}</li>
                    </ul>`;

    document.getElementById("offcanvas-body").innerHTML	= output;
    var myOffcanvas = document.getElementById('offcanvas');
    var bsOffcanvas = new bootstrap.Offcanvas(myOffcanvas);
    bsOffcanvas.show();	    
}

function _CsoMarkerOnClick(e){
    
    let output = `
        <h6>${e.sourceTarget.properties.properties.Id}</h6>
                    <ul class="list-group list-group-flush">
				        <li class="list-group-item">"Status": ${e.sourceTarget.properties.properties.Status}</li>
                        <li class="list-group-item">"LastUpdated": ${new Date(e.sourceTarget.properties.properties.LastUpdated).toLocaleString('en-GB')}</li>
				        <li class="list-group-item">"StatusStart": ${new Date(e.sourceTarget.properties.properties.StatusStart).toLocaleString('en-GB')}</li>
				        <li class="list-group-item">"LatestEventStart": ${new Date(e.sourceTarget.properties.properties.LatestEventStart).toLocaleString('en-GB')}</li>
				        <li class="list-group-item">"LatestEventEnd": ${new Date(e.sourceTarget.properties.properties.LatestEventEnd).toLocaleString('en-GB')}</li>
                        <li class="list-group-item">"ReceivingWaterCourse": ${e.sourceTarget.properties.properties.ReceivingWaterCourse}</li>
                    </ul>
        `;
    document.getElementById("offcanvas-body").innerHTML	= output;
    var myOffcanvas = document.getElementById('offcanvas');
    var bsOffcanvas = new bootstrap.Offcanvas(myOffcanvas);
    bsOffcanvas.show();	    
}

async function getStationData(){
    //http://environment.data.gov.uk/flood-monitoring/id/stations?parameter=rainfall&lat=51.48&long=-2.77&dist=10
    let url = "./data/stations.json"
    const response = await fetch(url);
    if(response.status == 200){
        var stations = new L.LayerGroup();
        var stationCount = 0;
        const responseJson = await response.json();
        let result = responseJson["items"];
        result.forEach(element => {
            if(["Cam and Ely Ouse (Including South Level)","Upper and Bedford Ouse","Old Bedford including the Middle Level"].includes(element.catchmentName) ){
                let stationColor = "rgb(0, 0, 200)";
                let marker = L.circleMarker([element.lat,element.long],{radius:4,color:stationColor});
                marker.bindTooltip(decodeURI(element.label));
                marker.properties = element;
                marker.addEventListener('click', _stationMarkerOnClick);
                marker.addTo(stations);
                stationCount ++ ;
                stations[element.label] = element;
            }
        });
        layerControl.addOverlay(stations, `Water level monitoring: (${stationCount})`);
    }
    
}

function _catchmentMarkerOnClick(e){
    let uri = e.layer.feature.properties.uri; 
    document.getElementById("toast-body").innerHTML	= `<a href="${uri.replace("/so/","/")}" target="_blank" class="card-link">${e.layer.feature.properties.name}</a>`;
    const toastElement = document.getElementById('liveToast');
    const toast = bootstrap.Toast.getOrCreateInstance(toastElement);
    toast.show();  
}

function _stationMarkerOnClick(e){
    let output = `<h6>${e.sourceTarget.properties.label}</h6>`;
    
    e.sourceTarget.properties.measures.forEach(measure =>{
        output += `<ul class="list-group list-group-flush">
        <li class="list-group-item">measure: ${measure.parameterName}</li>
        <li class="list-group-item">period: ${measure.period}</li>
        <li class="list-group-item">qualifier: ${measure.qualifier} </li>
        <li class="list-group-item">unit: ${measure.unitName}</li>
        </ul>`;
    })
    output += `<span id="${e.sourceTarget.properties.stationReference}"></span>`;
    showStageScale(e.sourceTarget.properties.stationReference,e.sourceTarget.properties.stageScale)
    document.getElementById("offcanvas-body").innerHTML	= output;
    var myOffcanvas = document.getElementById('offcanvas');
    var bsOffcanvas = new bootstrap.Offcanvas(myOffcanvas);
    bsOffcanvas.show();	    
}
async function showStageScale(id,url){
    const response = await fetch(url);
    if(response.status == 200){
        const responseJson = await response.json();
        let items = responseJson["items"];
        document.getElementById(id).innerHTML = `<ul class="list-group list-group-flush">
            <li class="list-group-item">scaleMax: ${items.scaleMax}</li>
            <li class="list-group-item">typicalRangeHigh: ${items.typicalRangeHigh}</li>
            <li class="list-group-item">typicalRangeLow: ${items.typicalRangeLow}</li>
            <li class="list-group-item">recorded min: ${items.minOnRecord.value} (${items.minOnRecord.dateTime})</li>
            <li class="list-group-item">max: ${items.maxOnRecord.value} (${items.maxOnRecord.dateTime})</li>
            <li class="list-group-item">recent max: ${items.highestRecent.value} (${items.highestRecent.dateTime})</li>
            </ul>`;
    }    
}

async function showChallenges(waterbody){
    let url = `${server}?waterbody=${waterbody}&list=rnags`;
    const response = await fetch(url);
    if(response.status == 200){
        const responseJson = await response.json();
        document.getElementById("offcanvas-body").innerText	= responseJson.data;
        var myOffcanvas = document.getElementById('offcanvas');
        var bsOffcanvas = new bootstrap.Offcanvas(myOffcanvas);
        bsOffcanvas.show();	
    }
}

async function showProtectedAreas(waterbody){
    let url = `${server}?waterbody=${waterbody}&list=protected-areas`;
    const response = await fetch(url);
    if(response.status == 200){
        const responseJson = await response.json();
        document.getElementById("offcanvas-body").innerText	= responseJson.data;
        var myOffcanvas = document.getElementById('offcanvas');
        var bsOffcanvas = new bootstrap.Offcanvas(myOffcanvas);
        bsOffcanvas.show();	
    }
}

async function showObjectives(waterbody){
    let url = `${server}?waterbody=${waterbody}&list=objectives`;
    const response = await fetch(url);
    if(response.status == 200){
        const responseJson = await response.json();
        document.getElementById("offcanvas-body").innerText	= responseJson.data;
        var myOffcanvas = document.getElementById('offcanvas');
        var bsOffcanvas = new bootstrap.Offcanvas(myOffcanvas);
        bsOffcanvas.show();	
    }
}
async function showClassifications(waterbody){
    let url = `${server}?waterbody=${waterbody}&list=classifications`;
    const response = await fetch(url);
    if(response.status == 200){
        const responseJson = await response.json();
        document.getElementById("offcanvas-body").innerText	= responseJson.data;
        var myOffcanvas = document.getElementById('offcanvas');
        var bsOffcanvas = new bootstrap.Offcanvas(myOffcanvas);
        bsOffcanvas.show();	
    }
}
  
async function addWaterbody(sourceData,name){
    const response = await fetch(sourceData);
    const data = await response.json();

    let catchmentLayer = L.geoJSON(data, {
        style: function (feature) {
            if(feature.geometry.type=="MultiLineString"){return {color: "rgb(100, 150, 250)"};}
            else{return {color: lookup[name].color, opacity: 0.1, weight:1};}
        }
    })
    catchmentLayer.bindTooltip(function (layer) {
        let uri = layer.feature.properties.uri;
        let pop = `${layer.feature.properties.name}
        <!--
        <a href="${uri.replace("/so/","/")}" target="_blank" class="card-link">EA details</a>
        <ul class="list-group list-group-flush">
        <li class="list-group-item"><a class="button" href="${uri.replace("/so/","/")}" target="_blank">Environment Agency info</a></li>
        <li class="list-group-item"><a href="${lookup[name].url}" target="_blank">Catchment partnership</a></li>
        <li class="list-group-item"><a class="button" onclick="showClassifications('${layer.feature.properties.id}')">Classifications</a></li>
        <li class="list-group-item"><a class="button" onclick="showObjectives('${layer.feature.properties.id}')">Objectives</a></li>
        <li class="list-group-item"><a class="button" onclick="showProtectedAreas('${layer.feature.properties.id}')">Protected</a></li>
        <li class="list-group-item"><a class="button" onclick="showChallenges('${layer.feature.properties.id}')">Challenges</a></li>
        </ul>-->`;
        return pop;
    })
    //catchmentLayer.bindTooltip(lookup[name].name)
    catchmentLayer.addEventListener('click', _catchmentMarkerOnClick);
    catchmentLayer.eachLayer(lay=> {polys.push(lay)});
    layerControl.addOverlay(catchmentLayer, lookup[name].name);
    catchmentLayer.addTo(map);
}

async function addConstituencies(sourceData,name){
  const response = await fetch(sourceData);
  const data = await response.json();

  let routeLayer = L.geoJSON(data, {
      style: function (feature) {
          return {fillColor: 'green',
        weight: 2,
        opacity: 0.5,
        color: 'black',  //Outline color
        fillOpacity: 0.1};
      },
      filter: function(feature){
        if (feature.geometry.type == "Polygon") return true;
      }
  })
  routeLayer.bindTooltip(function (layer) {
      let pop = `${layer.feature.properties.PCON24NM}`;
      return pop;
  })
  routeLayer.addEventListener('click', _constituencyOnClick);
  routeLayer.eachLayer(lay=> {polys.push(lay)});
  layerControl.addOverlay(routeLayer, name);
  routeLayer.addTo(map);
}

async function addLine(sourceData,name){
  const response = await fetch(sourceData);
  const data = await response.json();

  let routeLayer = L.geoJSON(data, {
      style: function (feature) {
          return {color: feature.properties.stroke, weight:feature.properties.strokewidth};
      },
      filter: function(feature){
        if (feature.geometry.type != "Polygon" && feature.geometry.type != "MultiPolygon") return true;
      }
  })
  routeLayer.bindTooltip(function (layer) {
      let pop = `${layer.feature.properties.name}`;
      return pop;
  })
  routeLayer.addEventListener('click', _lineOnClick);
  routeLayer.eachLayer(lay=> {polys.push(lay)});
  layerControl.addOverlay(routeLayer, name);
  routeLayer.addTo(map);
}

var server = "https://script.google.com/macros/s/AKfycbzplxYBoOcR9IPskJHrtIEs8TnLtX8iAPibQAVaQCOJNScwAtYz51HHiu8Uhwb7XSy54g/exec";
var lookup = {
    "UBOCP":{name:"Upper Bedford Ouse Catchment Partnership",url:"https://ubocp.org.uk/",color:"rgb(81, 34, 34)"},
    "CamEO":{name:"Cambridge Ely Ouse",url:"https://www.cameopartnership.org/",color:"rgb(2, 120, 41)"},
    "WCP":{name:"Water Care Partnership",url:"https://www.cambsacre.org.uk/water-care-catchment-partnership/",color:"rgb(3, 163, 163)"}	
}

function _constituencyOnClick(e){
  if(e.sourceTarget.feature.properties.image){
  popup_text = `
    <div class="card mb-3">
     <img src="${e.sourceTarget.feature.properties.image}" class="img-fluid rounded-start" style="max-height:250px" alt="${e.sourceTarget.feature.properties.name}" title = "${e.sourceTarget.feature.properties.name}">
     <div class="card-img-overlay">
       <div class="row justify-content-evenly"><div class="col"><a href="${e.sourceTarget.feature.properties.link}" class="h3" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:white; text-shadow:-1px 1px 0 #000, 1px 1px 0 #000; ">${e.sourceTarget.feature.properties.name}</a></div><div class="col-3"></div></div>
     </div>
     <ul class="list-group list-group-flush">
      <li class="list-group-item"><b>Distance: ${decodeURIComponent(e.sourceTarget.feature.properties.distance)} km</b> ${decodeURIComponent(e.sourceTarget.feature.properties.description)} <a href="${e.sourceTarget.feature.properties.link}"> more...</a></li>
     </ul>
    </div>`
  popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map); 
  }
}

function _lineOnClick(e){
    let uri = e.layer.feature.properties.uri; 
    document.getElementById("toast-body").innerHTML	= `<a href="${uri.replace("/so/","/")}" target="_blank" class="card-link">${e.layer.feature.properties.name}</a>`;
    const toastElement = document.getElementById('liveToast');
    const toast = bootstrap.Toast.getOrCreateInstance(toastElement);
    toast.show();  
  }

function loadMap(){
    map = L.map('map').setView([52.3322, -0.2773], 9);
    var rel = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {attribution: 'Tiles &copy; Esri &mdash; Source: Esri',maxZoom: 13});
    var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19,	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
    var img = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'});
    var top = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'});

    var baseMaps = {
        "OpenStreetMap":osm,
        "Satelite":img,
        "Topological":top,
        "Shaded relief":rel
    }
    layerControl = L.control.layers(baseMaps).addTo(map);
    //addLine(`./data/GreatOuse.geojson`,"Great Ouse");
    addLine(`./data/ubocp.geojson`,"Ouse Upper and Bedford MC");
    addLine(`./data/cameo.geojson`,"Cam and Ely Ouse MC");
    addLine(`./data/wcp.geojson`,"Old Bedford and Middle MC");
    addLine(`./data/3059.geojson`,"Nene MC");
    addLine(`./data/3065.geojson`,"North West Norfolk MC");
    addLine(`./data/3112.geojson`,"Welland MC");
    addLine(`./data/3156.geojson`,"Witham MC");
    addLine(`./data/3288.geojson`,"Witham Lower MC"); 
    addLine(`./data/3413.geojson`,"South Forty Foot Drain MC");
    addLine(`./data/3508.geojson`,"Witham Upper MC");
    addConstituencies(`./data/west.geojson`,"Westminster Parliamentary Constituencies")
    //getBetaCSOInfo();
    //getLatestCSOInfo();
    //getStationData();
    getRainfallData();
    //map.fitBounds(geo.getBounds());
}
