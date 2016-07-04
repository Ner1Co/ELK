'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var log4js = require('log4js');
var app = express();

app.use(bodyParser.json());

const LOG_FILE = 'uber-logger.txt';

log4js.configure({
    "appenders": [
        {
            "type": "log4js-logstash",
            "host": "localhost",
            "port": 5959,
            "fields": {
                "app": "my-app",
                "env": "dev"
            }
        }
    ],
    "replaceConsole": false
});

var httpLogFormat = ':remote-addr - - [:date] ":method :url ' +
    'HTTP/:http-version" :status :res[content-length] ' +
    '":referrer" ":user-agent" :response-time';

app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'auto', format: httpLogFormat }));

app.get('/text/:rows', function (req, res) {
    if(req.params.rows){
        fs.readFile(LOG_FILE, "utf-8",  (err, data) => {
            let lines = data.split("\n");

            if(req.params.rows < lines.length && req.params.rows > 0)
                lines = lines.slice(lines.length - req.params.rows - 1);

            res.send(lines.join("\n"));
        });
    } else {
        res.send('Missing the rows param! (  /text/:rows  )');
    }

});

app.put('/text', function (req, res) {
    if(req.body.text){
        fs.appendFile(LOG_FILE, req.body.text + '\n',  (err) => {
            fs.stat(LOG_FILE, function(err, stat) {
                if(err) {
                    // handle error
                }
                fs.writeFileSync("size.json", JSON.stringify({size: stat.size}));

                res.send("Done.")
            });


        });
    } else {
        res.send('Missing the text json!');
    }
});

app.delete('/text/:rows',  (req, res) => {
    if(req.params.rows){
        fs.readFile(LOG_FILE, "utf-8",  (err, data) => {
            let lines = data.split("\n");

            if(req.params.rows < lines.length && req.params.rows > 0)
                lines = lines.slice(0, lines.length - req.params.rows - 1);


            fs.writeFile(LOG_FILE, lines.join("\n") + "\n", 'utf8', (err) =>{
                if (err) throw err;

                fs.stat(LOG_FILE, function(err, stat) {
                    if(err) {
                        // handle error
                    }
                    fs.writeFileSync("size.json", JSON.stringify({size: stat.size}));

                    res.send("deleted " + req.params.rows + " lines");
                });


            });
        });
    } else {
        res.send('Missing the rows param! (  /text/:rows  )');
    }
});

app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});