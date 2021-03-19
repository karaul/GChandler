// https://adrianmejia.com/building-a-node-js-static-file-server-files-over-http-using-es6/

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const open = require('open');
const portscanner = require('portscanner');

// Garmin Connect
const gc = require('./src/gc.js');

/*let config = {};
try {
  config = require('./credentials.json');
} catch (e) {
  config = require('./mycredentials.json');
}
const
  username = config.username, 
  password = config.password; 
*/

const debug = false;
const verboseLogin = true;

let
  loginFlag = false,
  loginCounter = 0;
userinfo = {},
  activitiesList = [];


//var port = process.argv[2] || 4001;

portscanner.findAPortNotInUse(3000, 3999, '127.0.0.1', function (error, port) {
  console.log('AVAILABLE PORT AT: ' + port);

  // you can pass the parameter in the command line. e.g. node static_server.js 3000


  // maps file extention to MIME types
  // full list can be found here: https://www.freeformatter.com/mime-types-list.html
  const mimeType = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.cjs': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.doc': 'application/msword',
    '.eot': 'application/vnd.ms-fontobject',
    '.ttf': 'application/x-font-ttf'
  };
  //'.fit': 'application/octet-stream'  // not needed. fit extension must be added as binary

  var params = {};
  var foo;
  const parseParams = function (s) {
    s.split("&").forEach(e => {
      let d = e.split("=");
      params[`${d[0]}`] = `${d[1]}`
    })
  };

  http.createServer(function (req, res) {
    console.log(`${req.method} ${req.url}`);


    if (`${req.method}` === "POST") {
      let data = '';
      req.on('data', chunk => {
        data += chunk;
      })
      req.on('end', () => {
        //let params = JSON.parse(data);
        //console.log(params);
        data = data.replace("%40", "@");
        console.log("data: " + data);
        params = {};
        parseParams(data.slice(data.indexOf("?") + 1));
        console.log("post params:")
        console.log(params)
        foo = params.foo || "";
        if ((!loginFlag) && foo === "login") {
          loginCounter++;
          if (loginCounter === 1) {
            console.log("start login ...")
            var loginStatus;
            if (debug) {
              loginStatus = gc.loginTest(params.username, params.password, verboseLogin)
            } else {
              loginStatus = gc.login(params.username, params.password, verboseLogin)
            }
            loginStatus.then(r => {
              console.log("... end login")
              //console.log("resolve loginTest");
              console.log(r);
              loginFlag = true;
              //let t = JSON.stringify(r);
              //res.end(t); 
            })
          } else
            console.log(" ... process login ...")
        }
      })
    }

    if (`${req.method}` === "GET") {
      let a = req.url;
      params = {};
      parseParams(a.slice(a.indexOf("?") + 1));
      console.log("get params:")
      console.log(params)
    }

    // Garmin Connect functions
    foo = params.foo || "";
    if (foo.length > 0) {
      console.log(" foo: " + foo);
      if (foo === "status") {
        const r = {
          loginFlag: loginFlag,
          loginCounter: loginCounter
        };
        console.log(r);
        //if (loginFlag) {
          let t = JSON.stringify(r);
          res.end(t);
        //} else {
        //  console.log(" ... process login ...")
        //}
      }
      if (loginFlag) {
        switch (foo) {
          case "userinfo":
            if (debug) {
              userinfo = gc.userinfoTest();
            } else {
              userinfo = gc.userinfo();
            }
            userinfo.then(r => {
              console.log(r)
              let t = JSON.stringify(r);
              res.end(t);
            })
            break;
          case "activitiesList":
            activitiesList = gc.activitiesList(params.start_index, params.max_limit);
            activitiesList.then(r => {
              r.forEach(el => {
                let id = el.activityId;
                console.log("activityID: " + id);
              });
              let t = JSON.stringify(r);
              res.end(t);
            })
            break;
          case "downloadActivity":
            //let downloadDir = "./";
            // activitiesList mus be resolved
            //let activity = activitiesList[0];
            gc.downloadActivity(params.downloadDir, params.fileName, params.id)
              .then(r => {
                console.log(r + " is downloaded")
              });
            break;
        }
      }
    } else {
      const parsedUrl = url.parse(req.url);

      // extract URL path
      // Avoid https://en.wikipedia.org/wiki/Directory_traversal_attack
      // e.g curl --path-as-is http://localhost:9000/../fileInDanger.txt
      // by limiting the path to current directory only
      const sanitizePath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
      let pathname = path.join(__dirname, sanitizePath);

      //console.log("before: " + pathname);
      pathname = pathname.replace(/LevelUp/g, '/../');
      //console.log("after:" + pathname);

      // the simplest, nο sanitizePath. does not work ?
      //let pathname = path.join(__dirname, parsedUrl.pathname);

      //dirty way
      //if (path.parse(pathname).ext === ".fit") 
      //  pathname = path.join(__dirname, '..', '..', sanitizePath);

      fs.exists(pathname, function (exist) {

        if (!exist) {
          // if the file is not found, return 404
          res.statusCode = 404;
          res.end(`File ${pathname} not found!`);
          return;
        }

        // if is a directory, then look for index.html
        if (fs.statSync(pathname).isDirectory()) {
          pathname += './index.html';
        }

        // read file from file system
        fs.readFile(pathname, function (err, data) {
          if (err) {
            res.statusCode = 500;
            res.end(`Error getting the file: ${err}.`);
          } else {
            // based on the URL path, extract the file extention. e.g. .js, .doc, ...
            const ext = path.parse(pathname).ext;
            res.setHeader('Content-type', mimeType[ext] || 'text/plain');
            res.end(data);
          }
        });
      });
    }
  }).listen(parseInt(port));

  console.log(`Server listening on port ${port}`);
  open(`http://127.0.0.1:${port}/`)

})