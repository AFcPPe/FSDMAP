const mysql = require('mysql')
let connection = mysql.createConnection({
    host     : '43.143.80.202',
    user     : 'xfstech',
    password : '48cyPPRpkdsWA2Xx',
    port: '3306',
    database: 'xflysim'
});
connection.connect();
let sql = 'SELECT * FROM historytrack WHERE callsign = "CSZ6184"'
connection.query(sql,function (err, result) {

    console.log(result[0]['historytrack'])
    result[0]['historytrack'].push({x:50,y:20})
    console.log(result[0]['historytrack'])

})