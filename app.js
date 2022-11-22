const express = require('express')
// const needle = require('needle')
const fs = require('fs')
const schedule = require('node-schedule')
const path = require('path')
const mysql = require('mysql')
// const axios = require("axios");
const app = express()
app.use(express.static(path.join(__dirname, 'public')))
app.listen(8081, () => {
    console.log('listening port 8081')
})

const ff = path.resolve(__dirname, './public/resources/data/htcounts.json')
let count = 1;
fs.readFile(ff, 'utf8', (err, data)=>{
    let jss = JSON.parse(data)
    count = jss['count']
})

let whazzupData = {}

let rule = new schedule.RecurrenceRule();
rule.second = [0,6,12,18,24,30,36,42,48,54];
let job = schedule.scheduleJob(rule, () => {

    fs.writeFile(ff, '{"count":'+count+'}', 'utf8', (err) => {})
    let connection = mysql.createConnection({
        host     : '43.143.80.202',
        user     : 'xfstech',
        password : '48cyPPRpkdsWA2Xx',
        port: '3306',
        database: 'xflysim',
        multipleStatements: true
    });
    connection.connect();
    // let sql = 'SELECT * FROM currentwhazzup';
    let sql = 'SELECT * FROM currentwhazzup;';
    connection.query(sql,function (err, result) {
        if(err){
            console.log('[SELECT ERROR] - ',err.message);
            return
        }
        // console.log(result[0],result[1])
        whazzupData = result
        const whazzupFile = path.resolve(__dirname, './public/resources/data/whazzup.json')
        const writerStream = fs.createWriteStream(whazzupFile);
        writerStream.write(JSON.stringify(whazzupData),'utf-8');
        writerStream.write('\n','utf-8');
        writerStream.end();
        writerStream.on('finish', function() {
            console.log("新的whazzup json已写入");
        });
    });
    connection.end();
    count++;
    for (let each in whazzupData){
        if(whazzupData[each]['type']=='ATC')continue
        isFileExisted('./public/resources/data/historytrack/' + whazzupData[each]['callsign'] + '.json').then( r =>{
            const file = path.resolve(__dirname, './public/resources/data/historytrack/' + whazzupData[each]['callsign'] + '.json')
            fs.readFile(file, 'utf8', (err, data) => {
                if (err) {
                    console.log(err)
                    return
                }
                let jsdata = JSON.parse(data)
                if(count - jsdata['time']>10||count - jsdata['time']<-10)jsdata = JSON.parse('{"time" : '+count+',"pts":""}');
                if(Number(whazzupData[each]['lon'])<-30)whazzupData[each]['lon']=Number(whazzupData[each]['lon'])+360;
                console.log('['+ whazzupData[each]['lon']+','+whazzupData[each]['lat']+']')
                if('['+ whazzupData[each]['lon']+','+whazzupData[each]['lat']+']'=='[,]')return
                if(jsdata['pts'] ===''){
                    jsdata['pts'] = '['+ whazzupData[each]['lon']+','+whazzupData[each]['lat']+']';
                }else {
                    jsdata['pts'] = jsdata['pts']+',['+ whazzupData[each]['lon']+','+whazzupData[each]['lat']+']';
                }
                jsdata['time'] = count
                fs.writeFile(file, JSON.stringify(jsdata), 'utf8', (err) => {})
            })

        })

    }
    // needle('get', 'https://ol.xflysim.cn/whazzup.txt')
    //     .then(res => {
    //         const data = res.body.split('\r\n');
    //         if(data[1]=='!GENERAL') {
    //             const whazzupFile = path.resolve(__dirname, './public/resources/data/whazzup.txt')
    //
    //             const writerStream = fs.createWriteStream(whazzupFile);
    //             for (let i = 8; i < data.length-3; i++) {
    //                 writerStream.write(data[i],'utf-8');
    //                 writerStream.write('\n','utf-8');
    //             }
    //
    //             writerStream.end();
    //             writerStream.on('finish', function() {
    //                 console.log("新的whazzup.txt已写入");
    //             });
    //
    //             writerStream.on('error', function(err){
    //                 console.log(err.stack);
    //             });
    //         }else{
    //             console.log('404');
    //         }
    //
    //     })
    //     .catch(err => {
    //         console.error(err)
    //     })
});

function isFileExisted(path_way) {
    return new Promise((resolve, reject) => {
        fs.access(path_way, (err) => {
            if (err) {
                fs.appendFileSync(path_way, '{"time" : '+count+',"pts":""}', 'utf-8', (err) => {
                    if (err) {
                        return console.log('该文件不存在，重新创建失败！')
                    }
                    console.log("文件不存在，已新创建");
                });
                // reject(false);
            } else {
                resolve(true);
            }
        })
    })
};


