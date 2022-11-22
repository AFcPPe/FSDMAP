//browserify ./public/js/map.js > ./public/js/bundle.js
const schedule = require('node-schedule')
// const needle = require('needle')
// const Console = require("console")
// const L = require("./leaflet");

let ctrcolor = {
    color: 'rgb(0,139,255)',
    weight: 2,
    fillOpacity: 0.1
}

let tmacolor = {
    color: 'rgb(0,255,185)',
    weight: 2,
    fillOpacity: 0.1

}

let ratings = ['已封号', '暂无管制资质', 'A1', 'A2', 'A3', 'M1', 'M2', 'M3', 'I1', 'I2', 'I3', 'SUP', 'ADM']
let facilities = ['未知', '观察员', '放行', '机坪', '地面', '塔台', '终端', '区域', '监督员', '通波', '飞服', '教员', '模拟机']
let FSSJson = {
    'PRC': ['ZBPE', 'ZSHA', 'ZGZU', 'ZJSY', 'ZLHW', 'ZPKM', 'ZYSH', 'ZWUQ']
}
let corner1 = L.latLng(-90, -30),
    corner2 = L.latLng(90, 390),
    bounds = L.latLngBounds(corner1, corner2);
const map = L.map('map', {maxBounds: bounds}).setView([37, 107], 5);


// const tiles = L.tileLayer('resources/openstreetmap/{z}/{x}/{y}.png', {
//     maxZoom: 8,
//     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a></a>|6184制作</a>'
// }).addTo(map);

var sidebar = L.control.sidebar({container: 'sidebar'}).addTo(map)


// // add panels dynamically to the sidebar
// sidebar
//     .addPanel({
//         id:   'js-api',
//         tab:  '<i class="fa fa-gear"></i>',
//         title: 'JS API',
//         pane: '<p>The Javascript API allows to dynamically create or modify the panel state.<p/><p><button onclick="sidebar.enablePanel(\'mail\')">enable mails panel</button><button onclick="sidebar.disablePanel(\'mail\')">disable mails panel</button></p><p><button onclick="addUser()">add user</button></b>',
//     })
//     // add a tab with a click callback, initially disabled
//     .addPanel({
//         id:   'mail',
//         tab:  '<i class="fa fa-envelope"></i>',
//         title: 'Messages',
//         button: function() { alert('opened via JS callback') },
//         disabled: true,
//     })
//
// // be notified when a panel is opened
// sidebar.on('content', function (ev) {
//     switch (ev.id) {
//         case 'autopan':
//             sidebar.options.autopan = true;
//             break;
//         default:
//             sidebar.options.autopan = false;
//     }
// });
// var userid = 0
// function addUser() {
//     sidebar.addPanel({
//         id:   'user' + userid++,
//         tab:  '<i class="fa fa-user"></i>',
//         title: 'User Profile ' + userid,
//         pane: '<p>user ipsum dolor sit amet</p>',
//     });
// }
const tiles = L.tileLayer('https://api.mapbox.com/styles/v1/lidazi763305292/cl7fk796e000f14lifip3hnip/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGlkYXppNzYzMzA1MjkyIiwiYSI6ImNrbnZ3Y3JpczBlaHYydm95d3RiaW1qcjIifQ.rWX99Qfah7TUviARiR3l_A', {
    maxZoom: 18,
    minZoom: 3,
    attribution: '<a href="https://www.mapbox.com/">&copy; Mapbox</a></a> | 6184制作</a>'
}).addTo(map);
// https://tiles.flightradar24.com/navdata_ha/{z}/103/48/tile.png

// const fr = L.tileLayer('https://tiles.flightradar24.com/navdata_ha/{z}/{x}/{y}/tile.png', {
//     maxZoom: 18,
//     minZoom: 3,
//     attribution: '<a href="https://www.mapbox.com/">&copy; Mapbox</a></a> | 6184制作</a>'
// }).addTo(map);

// const tiles = L.tileLayer('resources/mapbox/{z}/{x}/{y}.png', {
//     maxZoom: 9,
//     minZoom: 3,
//     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a></a>|6184制作</a>'
// }).addTo(map);

// const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 8,
//     minZoom: 3,
//     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a></a>|6184制作</a>'
// }).addTo(map);


const myIcon = L.icon({
    iconUrl: '../resources/img/plane.png',
    iconAnchor: [15, 15],
    iconSize: [30, 30],
});
// const marker = new L.marker([37, 107], { rotationAngle: 180, icon: myIcon }).addTo(map)


let layerATC = new L.layerGroup([])
let layerLabel = new L.layerGroup([])
let layerTwr = new L.layerGroup([])
let layerUtil = new L.layerGroup([])
let layerPlane = new L.layerGroup([])
let layerht = new L.layerGroup([])


layerATC.addTo(map)
layerLabel.addTo(map)
layerTwr.addTo(map)
layerUtil.addTo(map)
layerPlane.addTo(map)
layerht.addTo(map)




let ctrbondaries
let tmabondaries
let airportPos
//ctrbondaries
//tmabondaries
fetch('../resources/data/ctrbondaries.json')
    .then((response) => response.json())
    .then((json) => {
        ctrbondaries = json["features"]
        fetch('../resources/data/tmabondaries.json')
            .then((response) => response.json())
            .then((json) => {
                tmabondaries = json["features"]
                fetch('../resources/data/airports.json')
                    .then((response) => response.json())
                    .then((json) => {
                        airportPos = json
                        update()
                    });
            });
    });


let UserRefreshRule = new schedule.RecurrenceRule();
UserRefreshRule.second = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
let refreshUsers = schedule.scheduleJob(UserRefreshRule, () => update())
let whazzup

let htcallsign = ''
map.on('click',function (e) {
    layerht.clearLayers()
    htcallsign = ''
})

// function update() {
//     {
//         fetch('../resources/data/whazzup.json')
//             .then((response) => {
//                 response.text().then(r => {
//
//                     whazzup = r
//                     let str = r.toString().split('\n')
//
//                     layerPlane.clearLayers()
//                     layerATC.clearLayers()
//                     layerLabel.clearLayers()
//                     layerTwr.clearLayers()
//                     layerWeather.clearLayers()
//                     let checkWeather = document.getElementsByTagName('input')[0];
//                     if(checkWeather.checked){
//                         let weatherTiles = L.tileLayer('https://tilecache.rainviewer.com/v2/radar/1668853800/256/{z}/{x}/{y}/4/1_1.png')
//                         layerWeather.addLayer(weatherTiles)
//                     }
//
//
//
//                     let tbody =  document.querySelectorAll('tbody')
//                     let tbodyFlight = tbody[0]
//                     let tbodyATC = tbody[1]
//                     let allFlight = tbodyFlight.querySelectorAll('tr')
//                     let allController = tbodyATC.querySelectorAll('tr')
//                     for(let i =0; i<allFlight.length; i++){
//                         tbodyFlight.removeChild(allFlight[i])
//                     }
//                     for(let i =0; i<allController.length; i++){
//                         tbodyATC.removeChild(allController[i])
//                     }
//
//                     let flightCount = 0;
//                     let atcConut = 0;
//
//                     let airports = {}
//
//                     for(const i in str) {
//
//                         let each = str[i].split(':');
//                         if (each[3] == 'PILOT') {
//                             if(each[11]=='')continue
//                             flightCount++;
//                             let tr = document.createElement('tr')
//                             tbodyFlight.appendChild(tr)
//                             let td1 = document.createElement('td')
//                             let td2 = document.createElement('td')
//                             let td3 = document.createElement('td')
//                             let td4 = document.createElement('td')
//                             let td5 = document.createElement('td')
//                             let td6 = document.createElement('td')
//                             tr.appendChild(td1)
//                             tr.appendChild(td2)
//                             tr.appendChild(td3)
//                             tr.appendChild(td4)
//                             tr.appendChild(td5)
//                             tr.appendChild(td6)
//                             td1.innerHTML = each[0]
//                             td2.innerHTML = each[1]
//                             let acftype = each[9]
//                             let acfpre = acftype.substring(0,2)
//                             if(acfpre =='H/'||acfpre =='L/'||acfpre =='J/'||acfpre =='T/')each[9]=each[9].substring(2)
//                             td3.innerHTML =each[9]
//                             td4.innerHTML = each[11]
//                             td5.innerHTML = each[13]
//                             if(each[7]>8000){
//                                 if(each[8]>50)td6.innerHTML = '<span class="badge badge-success">执飞中</span>';
//                             }else{
//                                 if(each[8]<50){
//                                     if(each[8]==0){
//                                         td6.innerHTML = '<span class="badge badge-warning">登机中</span>';
//                                     }else{
//                                         td6.innerHTML = '<span class="badge badge-primary">滑行中</span>';
//                                     }
//                                 }else{
//                                     td6.innerHTML = '<span class="badge badge-success">执飞中</span>';
//                                 }
//                             }
//                             // updateFlightStr+= '<tr class="table-row1" data-id="whazzup-'+each[1]+'-'+each[0]+'-'+each[37]+'" data-latitude="'+each[5]+'" data-longitude="'+each[5]+'">\n' +
//                             //     '    <td>'+each[1]+'</td>\n' +
//                             //     '    <td>'+each[0]+'</td>\n' +
//                             //     '    <td>'+each[9]+'</td>\n' +
//                             //     '    <td>'+each[11]+'</td>\n' +
//                             //     '    <td>'+each[13]+'</td>\n' +
//                             //     '    <td><span class="badge badge-success">执飞中</span></td>\n' +
//                             //     '</tr>'
//                             for(let i =-1;i<=1;i++){
//                                 let long = Number(each[6]) +i*360
//                                 let plane = new L.marker([each[5], long], {
//                                     rotationAngle: unpackPBH(parseInt(each[38])),
//                                     icon: myIcon
//                                 })
//                                 let classn = 'datablock'
//                                 if(each[17]=='7700'||each[17]=='7600'||each[17]=='7500')classn = 'datablockEMG'
//                                 plane.bindTooltip('<strong>'+each[0] + '</strong> ' + each[9] + '</br>' + each[7] + '    ' + each[8]+ '    ' + each[17] + '</br>' + each[11] + '   ' + each[13], {className: classn,offset:[15, 0]}).openTooltip();
//                                 plane.on('click', function (e) {
//                                     console.log(each[0])
//                                 });
//                                 layerPlane.addLayer(plane)
//                             }
//                             continue
//                         }
//                         if (each[3] == 'ATC') {
//                             if(each[16] <=1) {
//                                 continue
//                             }
//                             atcConut++;
//                             let tr = document.createElement('tr')
//                             tbodyATC.appendChild(tr)
//                             let td1 = document.createElement('td')
//                             let td2 = document.createElement('td')
//                             let td3 = document.createElement('td')
//                             let td4 = document.createElement('td')
//                             let td5 = document.createElement('td')
//                             let td6 = document.createElement('td')
//                             tr.appendChild(td1)
//                             tr.appendChild(td2)
//                             tr.appendChild(td3)
//                             tr.appendChild(td4)
//                             tr.appendChild(td5)
//                             tr.appendChild(td6)
//                             td1.innerHTML = each[0]
//                             td2.innerHTML = '未知'
//                             td3.innerHTML = each[1]
//                             td4.innerHTML = each[4]
//                             td5.innerHTML = ratings[each[16]]
//                             let time = getTime(each[37])
//
//                             td6.innerHTML =time
//                             const callsp = each[0].split('_')
//                             if (callsp[callsp.length - 1] == 'OBS'){
//                                 td2.innerHTML = facilities[1]
//                                 continue
//                             }
//                             if (callsp[callsp.length - 1] == 'FSS'){
//                                 if(ctrbondaries==undefined)continue
//                                 td2.innerHTML = facilities[10]
//                                 let labs =  FSSJson[callsp[0]]
//                                 let pol={}
//                                 for(let eLabs in labs){
//                                     let queryData = ctrbondaries.filter(function (_data) {
//                                         return _data.properties.id == labs[eLabs]
//                                     });
//                                     let pol = new L.geoJSON(queryData, ctrcolor)
//                                     let dictr = new L.divIcon({
//                                         className: 'ctr_div_icon',
//                                         html: '<strong>' + each[0]/*queryData[0].properties.id*/ + '</strong>',
//                                         iconSize: '0'
//                                     });
//                                     let olocctr = new L.marker([queryData[0].properties.label_lat, queryData[0].properties.label_lon], {
//                                         icon: dictr,
//                                     })
//                                     olocctr.on('mouseover', function (e) {
//                                         pol.setStyle({fillOpacity:0.5})
//                                         // pol.remove();
//                                         // pol = new L.geoJSON(queryData, {
//                                         //     color: 'rgb(255, 13, 245)',
//                                         //     weight: 2,
//                                         //     fillOpacity: 0.5
//                                         // });
//                                         // layerATC.addLayer(pol)
//                                     });
//                                     olocctr.on('mouseout', function (e) {
//                                         pol.setStyle({fillOpacity:0.1})
//                                         // pol = new L.geoJSON(queryData, {
//                                         //     color: 'rgb(255, 13, 245)',
//                                         //     weight: 2,
//                                         //     fillOpacity: 0.1
//                                         // });
//                                         // layerATC.addLayer(pol)
//                                     });
//                                     olocctr.bindTooltip('<strong>' + each[0] + '</strong>' + '   ' + each[1] + '   ' + each[4], {direction: 'left',className: 'datablockATC'}).openTooltip()
//                                     layerATC.addLayer(pol)
//                                     layerLabel.addLayer(olocctr)
//
//                                 }
//                             }
//                             if (callsp[callsp.length - 1] == 'CTR') {
//                                 if(ctrbondaries==undefined)continue
//                                 td2.innerHTML = facilities[7]
//                                 let queryData = ctrbondaries.filter(function (_data) {
//                                     return _data.properties.id == callsp[0]
//                                 });
//                                 let pol = new L.geoJSON(queryData, ctrcolor)
//                                 let dictr = new L.divIcon({
//                                     className: 'ctr_div_icon',
//                                     html: '<strong>' + each[0]/*queryData[0].properties.id*/ + '</strong>',
//                                     iconSize: '0'
//                                 });
//                                 let olocctr = new L.marker([queryData[0].properties.label_lat, queryData[0].properties.label_lon], {
//                                     icon: dictr,
//                                 })
//                                 olocctr.on('mouseover', function (e) {
//                                     pol.setStyle({fillOpacity:0.5})
//                                     // pol.remove();
//                                     // pol = new L.geoJSON(queryData, {
//                                     //     color: 'rgb(255, 13, 245)',
//                                     //     weight: 2,
//                                     //     fillOpacity: 0.5
//                                     // });
//                                     // layerATC.addLayer(pol)
//                                 });
//                                 olocctr.on('mouseout', function (e) {
//                                     pol.setStyle({fillOpacity:0.1})
//                                     // pol = new L.geoJSON(queryData, {
//                                     //     color: 'rgb(255, 13, 245)',
//                                     //     weight: 2,
//                                     //     fillOpacity: 0.1
//                                     // });
//                                     // layerATC.addLayer(pol)
//                                 });
//                                 olocctr.bindTooltip('<strong>' + each[0] + '</strong>' + '   ' + each[1] + '   ' + each[4], {direction: 'left',className: 'datablockATC'}).openTooltip()
//                                 layerATC.addLayer(pol)
//                                 layerLabel.addLayer(olocctr)
//
//                                 continue
//                             }
//                             if (callsp[callsp.length - 1] == 'APP'||callsp[callsp.length - 1] == 'DEP') {
//                                 if(tmabondaries==undefined)continue
//                                 td2.innerHTML = facilities[6]
//                                 let queryData = tmabondaries.filter(function (_data) {
//                                     return _data.properties.prefix == callsp[0]
//                                 });
//                                 if (queryData.length == 0) {
//
//                                     let pol = new L.circle([each[5], each[6]], tmacolor)
//                                     pol.setStyle({radius:parseInt(each[19]) * 1852})
//                                     let di = new L.divIcon({
//                                         className: 'tma_div_icon',
//                                         html: '<strong>' + each[0] + '</strong>',
//                                         iconSize: '0'
//                                     });
//                                     let oloc = new L.marker([each[5], each[6]], {
//                                         icon: di,
//                                     })
//                                     oloc.on('mouseover', function (e) {
//                                         pol.setStyle({fillOpacity:0.5})
//                                         // pol.remove();
//                                         // pol = new L.circle([each[5], each[6]], {
//                                         //     radius: parseInt(each[19]) * 1852,
//                                         //     color: 'rgb(0,255,4)',
//                                         //     weight: 2,
//                                         //     fillOpacity: 0.5
//                                         // });
//                                         // layerATC.addLayer(pol)
//                                     });
//                                     oloc.on('mouseout', function (e) {
//                                         pol.setStyle({fillOpacity:0.1})
//                                         // pol.remove();
//                                         // pol = new L.circle([each[5], each[6]], {
//                                         //     radius: parseInt(each[19]) * 1852,
//                                         //     color: 'rgb(0,255,4)',
//                                         //     weight: 2,
//                                         //     fillOpacity: 0.1
//                                         // });
//                                         // layerATC.addLayer(pol)
//                                     });
//                                     oloc.bindTooltip('<strong>' + each[0] + '</strong>' + '   ' + each[1] + '   ' + each[4], {direction: 'left',className: 'datablockATC'}).openTooltip()
//                                     layerATC.addLayer(pol)
//                                     layerLabel.addLayer(oloc)
//                                     continue
//                                 }
//                                 let pol = new L.geoJSON(queryData, tmacolor)
//                                 let diapp = new L.divIcon({
//                                     className: 'tma_div_icon',
//                                     html: '<strong>' + each[0]/*queryData[0].properties.id*/ + '</strong>',
//                                     iconSize: '0'
//                                 });
//                                 let olocapp = new L.marker([queryData[0].geometry.coordinates[0][0][0][1], queryData[0].geometry.coordinates[0][0][0][0]],
//                                     {
//                                         icon: diapp,
//                                     })
//                                 olocapp.on('mouseover', function (e) {
//                                     pol.setStyle({fillOpacity:0.5})
//                                 });
//                                 olocapp.on('mouseout', function (e) {
//                                     pol.setStyle({fillOpacity:0.1})
//                                 });
//                                 olocapp.bindTooltip('<strong>' + each[0] + '</strong>' + '   ' + each[1] + '   ' + each[4], {direction: 'left',className:'datablockATC'}).openTooltip()
//                                 layerATC.addLayer(pol)
//                                 layerLabel.addLayer(olocapp)
//
//                                 continue
//                             }
//                             if (callsp[callsp.length - 1] == 'TWR'){
//                                 if(airportPos==undefined)continue
//                                 td2.innerHTML = facilities[5]
//                                 if(airports[callsp[0]]==undefined){
//                                     airports[callsp[0]] = {
//                                         "TWR":each,
//                                         "GND":undefined,
//                                         "DEL":undefined,
//                                         "ATIS":undefined
//                                     }
//                                 }else{
//                                     airports[callsp[0]]["TWR"] = each
//                                 }
//
//                             }
//                             if (callsp[callsp.length - 1] == 'GND'||callsp[callsp.length - 1] == 'APN'){
//                                 if(airportPos==undefined)continue
//                                 if(callsp[callsp.length - 1] == 'APN')td2.innerHTML = facilities[3];
//                                 else td2.innerHTML = facilities[4]
//
//                                 if(airports[callsp[0]]==undefined){
//                                     airports[callsp[0]] = {
//                                         "TWR":undefined,
//                                         "GND":each,
//                                         "DEL":undefined,
//                                         "ATIS":undefined
//                                     }
//                                 }else{
//                                     airports[callsp[0]]["GND"] = each
//                                 }
//
//                             }
//                             if (callsp[callsp.length - 1] == 'DEL'){
//                                 if(airportPos==undefined)continue
//                                 td2.innerHTML = facilities[2]
//                                 if(airports[callsp[0]]==undefined){
//                                     airports[callsp[0]] = {
//                                         "TWR":undefined,
//                                         "GND":undefined,
//                                         "DEL":each,
//                                         "ATIS":undefined
//                                     }
//                                 }else{
//                                     airports[callsp[0]]["DEL"] = each
//                                 }
//
//                             }
//                             if (callsp[callsp.length - 1] == 'ATIS'){
//                                 if(airportPos==undefined)continue
//                                 td2.innerHTML = facilities[9]
//                                 if(airports[callsp[0]]==undefined){
//                                     airports[callsp[0]] = {
//                                         "TWR":undefined,
//                                         "GND":undefined,
//                                         "DEL":undefined,
//                                         "ATIS":each
//                                     }
//                                 }else{
//                                     airports[callsp[0]]["ATIS"] = each
//                                 }
//
//                             }
//                             if(callsp[callsp.length - 1] == 'INS'){
//                                 td2.innerHTML = facilities[11]
//                                 continue
//                             }
//                             if(callsp[callsp.length - 1] == 'SUP'){
//                                 td2.innerHTML = facilities[8]
//                                 continue
//                             }
//                             if(callsp[callsp.length - 1] == 'SIM'){
//                                 td2.innerHTML = facilities[12]
//                                 continue
//                             }
//                         }
//                     }
//                     let span = document.querySelectorAll('h1')
//                     let spanFlight = document.querySelectorAll('h1')[0].querySelector('span')
//                     let spanATC = document.querySelectorAll('h1')[1].querySelector('span')
//                     spanFlight.innerHTML = flightCount
//                     spanATC.innerHTML = atcConut
//                     for(let each in airports){
//                         let ct =1
//                         let str = ''
//                         if(airports[each]['TWR']!=undefined){
//                             ct+=1
//                             str+='<strong>' + airports[each]['TWR'][0] + '</strong>' + '   ' + airports[each]['TWR'][1] + '   ' + airports[each]['TWR'][4]+'<br>'
//                         }
//                         if(airports[each]['GND']!=undefined){
//                             ct+=1
//                             str+='<strong>' + airports[each]['GND'][0] + '</strong>' + '   ' + airports[each]['GND'][1] + '   ' + airports[each]['GND'][4]+'<br>'
//                         }
//                         if(airports[each]['DEL']!=undefined){
//                             ct+=1
//                             str+='<strong>' + airports[each]['DEL'][0] + '</strong>' + '   ' + airports[each]['DEL'][1] + '   ' + airports[each]['DEL'][4]+'<br>'
//                         }
//                         if(airports[each]['ATIS']!=undefined){
//                             str+='<strong>' + airports[each]['ATIS'][0] + '</strong>' + '   ' + airports[each]['ATIS'][1] + '   ' + airports[each]['ATIS'][4]+'<br>'
//                         }
//                         let width=46
//                         if(ct>2)width=ct*23;
//                         let di = new L.divIcon({className: 'twr_div_icon', html: getLocalTooltip(airports[each],each), iconSize: 'auto',iconAnchor:[width/2,23]});
//                         if(airportPos[each]==undefined){
//                             continue
//                         }
//                         let oloc = new L.marker([airportPos[each]['lat'], airportPos[each]['lon']],
//                             {
//
//                                 icon: di,
//                             }).bindTooltip(str,{direction:'left',offset:[-20, 0],className: 'datablockATC'}).openTooltip()
//
//
//                         layerTwr.addLayer(oloc)
//                     }
//                 })
//             })
//             .catch(err => {
//                 console.error(err)
//             })
//     }
// }
function update() {
    fetch('../resources/data/whazzup.json')
        .then((response) => response.json())
        .then((data) => {
            layerPlane.clearLayers()
            layerATC.clearLayers()
            layerLabel.clearLayers()
            layerTwr.clearLayers()
            layerht.clearLayers()
            if(htcallsign!=''){

                fetch('../resources/data/historytrack/'+htcallsign+'.json')
                    .then((response) => response.text())
                    .then((data) => {

                        let json = JSON.parse(data)
                        let jsss = '{"type":"FeatureCollection","name":"fix","crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:OGC:1.3:CRS84"}},"features":[{"type":"Feature","geometry":{"type":"LineString","coordinates":['+json['pts']+']}}]}'
                        let g = new L.geoJSON(JSON.parse(jsss)).addTo(layerht)
                    })
            }




            let tbody = document.querySelectorAll('tbody')
            let tbodyFlight = tbody[0]
            let tbodyATC = tbody[1]
            let allFlight = tbodyFlight.querySelectorAll('tr')
            let allController = tbodyATC.querySelectorAll('tr')
            for (let i = 0; i < allFlight.length; i++) {
                tbodyFlight.removeChild(allFlight[i])
            }
            for (let i = 0; i < allController.length; i++) {
                tbodyATC.removeChild(allController[i])
            }
            let flightCount = 0;
            let atcConut = 0;
            let airports = {}
            for (const i in data) {
                let eachdata = data[i]
                if (eachdata['type'] == 'PILOT') {
                    if (eachdata['depairport'] == '') continue
                    flightCount++;
                    let tr = document.createElement('tr')
                    tbodyFlight.appendChild(tr)
                    let td1 = document.createElement('td')
                    let td2 = document.createElement('td')
                    let td3 = document.createElement('td')
                    let td4 = document.createElement('td')
                    let td5 = document.createElement('td')
                    let td6 = document.createElement('td')
                    tr.appendChild(td1)
                    tr.appendChild(td2)
                    tr.appendChild(td3)
                    tr.appendChild(td4)
                    tr.appendChild(td5)
                    tr.appendChild(td6)
                    td1.innerHTML = eachdata['callsign']
                    td2.innerHTML = eachdata['cid']
                    let acftype = eachdata['aircraft']
                    let acfpre = acftype.substring(0, 2)
                    if (acfpre == 'H/' || acfpre == 'L/' || acfpre == 'J/' || acfpre == 'T/') eachdata['aircraft'] = eachdata['aircraft'].substring(2)
                    td3.innerHTML = eachdata['aircraft']
                    td4.innerHTML = eachdata['depairport']
                    td5.innerHTML = eachdata['destairport']
                    if (eachdata['currentaltitude'] > 8000) {
                        if (eachdata['groundspeed'] > 0) td6.innerHTML = '<span class="badge badge-success">执飞中</span>';
                    } else {
                        if (eachdata['currentaltitude'] < 50) {
                            if (eachdata['groundspeed'] == 0) {
                                td6.innerHTML = '<span class="badge badge-warning">登机中</span>';
                            } else {
                                td6.innerHTML = '<span class="badge badge-primary">滑行中</span>';
                            }
                        } else {
                            td6.innerHTML = '<span class="badge badge-success">执飞中</span>';
                        }
                    }
                    // updateFlightStr+= '<tr class="table-row1" data-id="whazzup-'+each[1]+'-'+each[0]+'-'+each[37]+'" data-latitude="'+each[5]+'" data-longitude="'+each[5]+'">\n' +
                    //     '    <td>'+each[1]+'</td>\n' +
                    //     '    <td>'+each[0]+'</td>\n' +
                    //     '    <td>'+each[9]+'</td>\n' +
                    //     '    <td>'+each[11]+'</td>\n' +
                    //     '    <td>'+each[13]+'</td>\n' +
                    //     '    <td><span class="badge badge-success">执飞中</span></td>\n' +
                    //     '</tr>'
                    for (let i = -1; i <= 1; i++) {
                        let long = Number(eachdata['lon']) + i * 360
                        let plane = new L.marker([eachdata['lat'], long], {
                            rotationAngle: unpackPBH(parseInt(eachdata['pbh'])),
                            icon: myIcon
                        })
                        let classn = 'datablock'
                        if (eachdata['transponder'] == '7700' || eachdata['transponder'] == '7600' || eachdata['transponder'] == '7500') classn = 'datablockEMG'
                        plane.bindTooltip('<strong>' + eachdata['callsign'] + '</strong> ' + eachdata['aircraft'] + '</br>' + eachdata['currentaltitude'] + '    ' + eachdata['groundspeed'] + '    ' + eachdata['transponder'] + '</br>' + eachdata['depairport'] + '   ' + eachdata['destairport'], {
                            className: classn,
                            offset: [15, 0]
                        }).openTooltip();
                        plane.on('click', function (e) {
                            htcallsign = eachdata['callsign']
                            layerht.clearLayers()
                            fetch('../resources/data/historytrack/'+htcallsign+'.json')
                                .then((response) => response.text())
                                .then((data) => {
                                    let json = JSON.parse(data)
                                    let jsss = '{"type":"FeatureCollection","name":"fix","crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:OGC:1.3:CRS84"}},"features":[{"type":"Feature","geometry":{"type":"LineString","coordinates":['+json['pts']+']}}]}'
                                    let g = new L.geoJSON(JSON.parse(jsss)).addTo(layerht)
                                })
                        });
                        layerPlane.addLayer(plane)
                    }
                    continue
                }

                if (eachdata['type'] == 'ATC') {

                    if (eachdata['rating'] <= 1) {
                        continue
                    }
                    atcConut++;
                    let tr = document.createElement('tr')
                    tbodyATC.appendChild(tr)
                    let td1 = document.createElement('td')
                    let td2 = document.createElement('td')
                    let td3 = document.createElement('td')
                    let td4 = document.createElement('td')
                    let td5 = document.createElement('td')
                    let td6 = document.createElement('td')
                    tr.appendChild(td1)
                    tr.appendChild(td2)
                    tr.appendChild(td3)
                    tr.appendChild(td4)
                    tr.appendChild(td5)
                    tr.appendChild(td6)
                    td1.innerHTML = eachdata['callsign']
                    td2.innerHTML = '未知'
                    td3.innerHTML = eachdata['cid']
                    td4.innerHTML = eachdata['frequency']
                    td5.innerHTML = ratings[eachdata['rating']]
                    let time = getTime(eachdata['starttime'])

                    td6.innerHTML = time
                    const callsp = eachdata['callsign'].split('_')

                    if (callsp[callsp.length - 1] == 'OBS') {
                        td2.innerHTML = facilities[1]
                        continue
                    }
                    if (callsp[callsp.length - 1] == 'FSS') {
                        if (ctrbondaries == undefined) continue
                        td2.innerHTML = facilities[10]
                        let labs = FSSJson[callsp[0]]
                        let pol = {}
                        for (let eLabs in labs) {
                            let queryData = ctrbondaries.filter(function (_data) {
                                return _data.properties.id == labs[eLabs]
                            });
                            let pol = new L.geoJSON(queryData, ctrcolor)
                            let dictr = new L.divIcon({
                                className: 'ctr_div_icon',
                                html: '<strong>' + eachdata['callsign']/*queryData[0].properties.id*/ + '</strong>',
                                iconSize: '0'
                            });
                            let olocctr = new L.marker([queryData[0].properties.label_lat, queryData[0].properties.label_lon], {
                                icon: dictr,
                            })
                            olocctr.on('mouseover', function (e) {
                                pol.setStyle({fillOpacity: 0.5})
                                // pol.remove();
                                // pol = new L.geoJSON(queryData, {
                                //     color: 'rgb(255, 13, 245)',
                                //     weight: 2,
                                //     fillOpacity: 0.5
                                // });
                                // layerATC.addLayer(pol)
                            });
                            olocctr.on('mouseout', function (e) {
                                pol.setStyle({fillOpacity: 0.1})
                                // pol = new L.geoJSON(queryData, {
                                //     color: 'rgb(255, 13, 245)',
                                //     weight: 2,
                                //     fillOpacity: 0.1
                                // });
                                // layerATC.addLayer(pol)
                            });
                            olocctr.bindTooltip('<strong>' + eachdata['callsign'] + '</strong>' + '   ' + eachdata['cid'] + '   ' + eachdata['frequency'], {
                                direction: 'left',
                                className: 'datablockATC'
                            }).openTooltip()
                            layerATC.addLayer(pol)
                            layerLabel.addLayer(olocctr)

                        }
                    }

                    if (callsp[callsp.length - 1] == 'CTR') {
                        if (ctrbondaries == undefined) continue
                        td2.innerHTML = facilities[7]
                        let queryData = ctrbondaries.filter(function (_data) {
                            return _data.properties.id == callsp[0]
                        });
                        let pol = new L.geoJSON(queryData, ctrcolor)
                        let dictr = new L.divIcon({
                            className: 'ctr_div_icon',
                            html: '<strong>' + eachdata['callsign']/*queryData[0].properties.id*/ + '</strong>',
                            iconSize: '0'
                        });
                        let olocctr = new L.marker([queryData[0].properties.label_lat, queryData[0].properties.label_lon], {
                            icon: dictr,
                        })
                        olocctr.on('mouseover', function (e) {
                            pol.setStyle({fillOpacity: 0.5})
                            // pol.remove();
                            // pol = new L.geoJSON(queryData, {
                            //     color: 'rgb(255, 13, 245)',
                            //     weight: 2,
                            //     fillOpacity: 0.5
                            // });
                            // layerATC.addLayer(pol)
                        });
                        olocctr.on('mouseout', function (e) {
                            pol.setStyle({fillOpacity: 0.1})
                            // pol = new L.geoJSON(queryData, {
                            //     color: 'rgb(255, 13, 245)',
                            //     weight: 2,
                            //     fillOpacity: 0.1
                            // });
                            // layerATC.addLayer(pol)
                        });
                        olocctr.bindTooltip('<strong>' + eachdata['callsign'] + '</strong>' + '   ' + eachdata['cid'] + '   ' + eachdata['frequency'], {
                            direction: 'left',
                            className: 'datablockATC'
                        }).openTooltip()
                        layerATC.addLayer(pol)
                        layerLabel.addLayer(olocctr)

                        continue
                    }

                    if (callsp[callsp.length - 1] == 'APP' || callsp[callsp.length - 1] == 'DEP') {
                        if (tmabondaries == undefined) continue
                        td2.innerHTML = facilities[6]
                        let queryData = tmabondaries.filter(function (_data) {
                            return _data.properties.prefix == callsp[0]
                        });
                        if (queryData.length == 0) {

                            let pol = new L.circle([eachdata['lat'], eachdata['lon']], tmacolor)
                            pol.setStyle({radius: parseInt(eachdata['visualrange']) * 1852})
                            let di = new L.divIcon({
                                className: 'tma_div_icon',
                                html: '<strong>' + eachdata['callsign'] + '</strong>',
                                iconSize: '0'
                            });
                            let oloc = new L.marker([eachdata['lat'], eachdata['lon']], {
                                icon: di,
                            })
                            oloc.on('mouseover', function (e) {
                                pol.setStyle({fillOpacity: 0.5})
                                // pol.remove();
                                // pol = new L.circle([each[5], each[6]], {
                                //     radius: parseInt(each[19]) * 1852,
                                //     color: 'rgb(0,255,4)',
                                //     weight: 2,
                                //     fillOpacity: 0.5
                                // });
                                // layerATC.addLayer(pol)
                            });
                            oloc.on('mouseout', function (e) {
                                pol.setStyle({fillOpacity: 0.1})
                                // pol.remove();
                                // pol = new L.circle([each[5], each[6]], {
                                //     radius: parseInt(each[19]) * 1852,
                                //     color: 'rgb(0,255,4)',
                                //     weight: 2,
                                //     fillOpacity: 0.1
                                // });
                                // layerATC.addLayer(pol)
                            });
                            oloc.bindTooltip('<strong>' + eachdata['callsign'] + '</strong>' + '   ' + eachdata['cid'] + '   ' + eachdata['frequency'], {
                                direction: 'left',
                                className: 'datablockATC'
                            }).openTooltip()
                            layerATC.addLayer(pol)
                            layerLabel.addLayer(oloc)
                            continue
                        }
                        let pol = new L.geoJSON(queryData, tmacolor)
                        let diapp = new L.divIcon({
                            className: 'tma_div_icon',
                            html: '<strong>' + eachdata['callsign']/*queryData[0].properties.id*/ + '</strong>',
                            iconSize: '0'
                        });
                        let olocapp = new L.marker([queryData[0].geometry.coordinates[0][0][0][1], queryData[0].geometry.coordinates[0][0][0][0]],
                            {
                                icon: diapp,
                            })
                        olocapp.on('mouseover', function (e) {
                            pol.setStyle({fillOpacity: 0.5})
                        });
                        olocapp.on('mouseout', function (e) {
                            pol.setStyle({fillOpacity: 0.1})
                        });
                        olocapp.bindTooltip('<strong>' + eachdata['callsign'] + '</strong>' + '   ' + eachdata['cid'] + '   ' + eachdata['frequency'], {
                            direction: 'left',
                            className: 'datablockATC'
                        }).openTooltip()
                        layerATC.addLayer(pol)
                        layerLabel.addLayer(olocapp)

                        continue
                    }

                    if (callsp[callsp.length - 1] == 'TWR') {
                        if (airportPos == undefined) continue
                        td2.innerHTML = facilities[5]
                        if (airports[callsp[0]] == undefined) {
                            airports[callsp[0]] = {
                                "TWR": eachdata,
                                "GND": undefined,
                                "DEL": undefined,
                                "ATIS": undefined
                            }
                        } else {
                            airports[callsp[0]]["TWR"] = eachdata
                        }

                    }
                    if (callsp[callsp.length - 1] == 'GND' || callsp[callsp.length - 1] == 'APN') {
                        if (airportPos == undefined) continue
                        if (callsp[callsp.length - 1] == 'APN') td2.innerHTML = facilities[3];
                        else td2.innerHTML = facilities[4]

                        if (airports[callsp[0]] == undefined) {
                            airports[callsp[0]] = {
                                "TWR": undefined,
                                "GND": eachdata,
                                "DEL": undefined,
                                "ATIS": undefined
                            }
                        } else {
                            airports[callsp[0]]["GND"] = eachdata
                        }

                    }
                    if (callsp[callsp.length - 1] == 'DEL') {
                        if (airportPos == undefined) continue
                        td2.innerHTML = facilities[2]
                        if (airports[callsp[0]] == undefined) {
                            airports[callsp[0]] = {
                                "TWR": undefined,
                                "GND": undefined,
                                "DEL": eachdata,
                                "ATIS": undefined
                            }
                        } else {
                            airports[callsp[0]]["DEL"] = eachdata
                        }

                    }
                    if (callsp[callsp.length - 1] == 'ATIS') {
                        if (airportPos == undefined) continue
                        td2.innerHTML = facilities[9]
                        if (airports[callsp[0]] == undefined) {
                            airports[callsp[0]] = {
                                "TWR": undefined,
                                "GND": undefined,
                                "DEL": undefined,
                                "ATIS": eachdata
                            }
                        } else {
                            airports[callsp[0]]["ATIS"] = eachdata
                        }

                    }
                    if (callsp[callsp.length - 1] == 'INS') {
                        td2.innerHTML = facilities[11]
                        continue
                    }
                    if (callsp[callsp.length - 1] == 'SUP') {
                        td2.innerHTML = facilities[8]
                        continue
                    }
                    if (callsp[callsp.length - 1] == 'SIM') {
                        td2.innerHTML = facilities[12]
                        continue
                    }
                }
            }
            let span = document.querySelectorAll('h1')
            let spanFlight = document.querySelectorAll('h1')[0].querySelector('span')
            let spanATC = document.querySelectorAll('h1')[1].querySelector('span')
            spanFlight.innerHTML = flightCount
            spanATC.innerHTML = atcConut
            for (let each in airports) {
                // console.log(airports[each])
                let ct = 1
                let str = ''
                if (airports[each]['TWR'] != undefined) {
                    ct += 1
                    str += '<strong>' + airports[each]['TWR']['callsign'] + '</strong>' + '   ' + airports[each]['TWR']['cid'] + '   ' + airports[each]['TWR']['frequency'] + '<br>'
                }
                if (airports[each]['GND'] != undefined) {
                    ct += 1
                    str += '<strong>' + airports[each]['GND']['callsign'] + '</strong>' + '   ' + airports[each]['GND']['cid'] + '   ' + airports[each]['GND']['frequency'] + '<br>'
                }
                if (airports[each]['DEL'] != undefined) {
                    ct += 1
                    str += '<strong>' + airports[each]['DEL']['callsign'] + '</strong>' + '   ' + airports[each]['DEL']['cid'] + '   ' + airports[each]['DEL']['frequency'] + '<br>'
                }
                if (airports[each]['ATIS'] != undefined) {
                    str += '<strong>' + airports[each]['ATIS']['callsign'] + '</strong>' + '   ' + airports[each]['ATIS']['cid'] + '   ' + airports[each]['ATIS']['frequency'] + '<br>'
                }
                let width = 46
                if (ct > 2) width = ct * 23;
                let di = new L.divIcon({
                    className: 'twr_div_icon',
                    html: getLocalTooltip(airports[each], each),
                    iconSize: 'auto',
                    iconAnchor: [width / 2, 23]
                });
                if (airportPos[each] == undefined) {
                    continue
                }
                let oloc = new L.marker([airportPos[each]['lat'], airportPos[each]['lon']],
                    {

                        icon: di,
                    }).bindTooltip(str, {direction: 'left', offset: [-20, 0], className: 'datablockATC'}).openTooltip()


                layerTwr.addLayer(oloc)
            }
        });
}
let weatherTiles = L.tileLayer()

let UtilRefreshRule = new schedule.RecurrenceRule();
UtilRefreshRule.second = [new schedule.Range(0,59)];
let refreshUtils = schedule.scheduleJob(UtilRefreshRule, () => getButtonStatus())
fetch('https://api.rainviewer.com/public/weather-maps.json')
    .then((response) => response.json())
    .then((data)=>{
        weatherTiles = L.tileLayer('https://tilecache.rainviewer.com'+data['radar']['past'][0]['path']+'/256/{z}/{x}/{y}/4/1_1.png')
    })


let highAirwayTiles = L.tileLayer('https://tiles.flightradar24.com/navdata_ha/{z}/{x}/{y}/tile.png')
let lowAirwayTiles = L.tileLayer('https://tiles.flightradar24.com/navdata_la/{z}/{x}/{y}/tile.png')

function getButtonStatus(){
    if(document.getElementsByTagName('input')[0].checked){
        layerUtil.addLayer(weatherTiles)
    }else{
        layerUtil.removeLayer(weatherTiles)
    }
    if(document.getElementsByTagName('input')[1].checked){
        layerUtil.addLayer(highAirwayTiles)
    }else {
        layerUtil.removeLayer(highAirwayTiles)
    }
    if(document.getElementsByTagName('input')[2].checked){
        layerUtil.addLayer(lowAirwayTiles)
    }else {
        layerUtil.removeLayer(lowAirwayTiles)
    }
}

function unpackPBH(pbh) {
    let pitchInt = uint(pbh >> 22)
    let pitch = pitchInt / 1024.0 * -360.0
    if (pitch > 180.0) {
        pitch -= 360.0
    } else if (pitch <= -180.0) {
        pitch += 360.0
    }
    let bankInt = uint((pbh >> 12) & 0x3FF)
    let bank = bankInt / 1024.0 * -360.0
    if (bank > 180.0) {
        bank -= 360.0
    } else if (bank <= -180.0) {
        bank += 360.0
    }
    let hdgInt = uint((pbh >> 2) & 0x3FF)
    let heading = hdgInt / 1024.0 * 360.0
    if (heading < 0.0) {
        heading += 360.0
    } else if (heading >= 360.0) {
        heading -= 360.0
    }
    return heading
}

function modulo(a, b) {
    return a - Math.floor(a / b) * b;
}

function uint(x) {
    return modulo(x, Math.pow(2, 32));
}

function getTime(time) {

    let d1 = new Date((parseInt(time) + 8 * 60 * 60) * 1000);
    let d2 = new Date();
    let sec = parseInt(d2 - d1) / 1000
    let hour = parseInt(sec / 60 / 60)
    let min = parseInt(sec / 60 % 60)
    let seco = parseInt(sec % 60)
    //hour -=8
    if (hour < 10) hour = '0' + hour
    if (min < 10) min = '0' + min
    if (seco < 10) seco = '0' + seco
    return hour + ':' + min + ':' + seco

}

function getLocalTooltip(target, icao) {

    let ct = 0;
    let tt = '';
    if (target['DEL'] != undefined) {
        tt += '<td class="text-white" style="background-color: #007cc4; text-align: center; padding: 0px 5px">D</td>';
        ct += 1;
    }
    if (target['GND'] != undefined) {
        tt += '<td class="text-white" style="background-color: #1bbe00; text-align: center; padding: 0px 5px">G</td>';
        ct += 1;
    }
    if (target['TWR'] != undefined) {
        tt += '<td class="text-white" style="background-color: #ff0000; text-align: center; padding: 0px 5px">T</td>';
        ct += 1;
    }
    // if(ct==1)
    // {
    tt += '<td class="text-white" style="background-color: #ffc500; text-align: center; padding: 0px 5px">A</td>';
    ct += 1;
    // }
    if (tt != '') {
        tt = '<table style="margin: auto; margin-top: 0rem; flex: 1; overflow: hidden; font-family: \'JetBrains Mono\', sans-serif; font-size: 0.6rem; overflow: hidden; font-weight: bold"><tr>' + tt + '</tr></table>';
    }
    // // If event, apply a border
    // if(eventsByAirport[icao])
    // {
    // }
    // else
    // {
    //     var event = '';
    // }
    let width = 46
    if (ct > 2) width = ct * 23;
    tt = '<div style="width: ' + width + 'px;height:45px"><div><table style="margin: auto; align-self: center; font-family: \'JetBrains Mono\', sans-serif; font-size: 0.6rem; overflow: hidden; font-weight: bold"><tr><td colspan="' + ct + '" class="text-light">' + icao + '</td></tr></table>' + tt + '</div></div>';
    // console.log(tt)
    return tt;
}

