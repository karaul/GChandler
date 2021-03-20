document.addEventListener('DOMContentLoaded', function () {

    var config;

    window.onclick = function (event) {
        var m = document.getElementById('modal');
        if (event.target == m) {
            m.style.display = "none";
        }
    }

    document.getElementById("Login").onclick = function (e) {
        if (loginCounter == 0) {
            setTimeout( makeXMLHttpRequest( {foo:"status"}), 3000);
        } else {
            var data = {
                "foo": "login", //activitiesList", // "userinfo",
                "username": document.getElementById("username").value,
                "password": document.getElementById("password").value,
            };
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "/", true);
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            xhr.onreadystatechange = httpRequestOnLoad;
            xhr.send(formatParams(data));
        };
    }


    function pending() {
        if (!(document.getElementById("loginStatus").value === "logged")) {
            loginCounter++;
            document.getElementById("loginStatus").value = "pending  " + loginCounter + "...";
            params.foo = "status";
            makeXMLHttpRequest(params);
        }
    }

    var windowActivitiesList = null;
    document.getElementById("activitiesList").onclick = function (e) {
        if (document.getElementById("loginStatus").value === "logged") {
            if (windowActivitiesList == null || windowActivitiesList.closed) {
                let url = "LevelUpfitalyser/index.html" + "?action=GC" +
                    "&start_index=" + document.getElementById('start_index').value +
                    "&max_limit=" + document.getElementById('max_limit').value +
                    "&downloadDir=" + document.getElementById('downloadDir').value;
                windowActivitiesList = window.open(url); //'/activitieslist.html'
                //windowActivitiesList = window.open('activitieslist.html'); //'/activitieslist.html'
            } else {
                windowActivitiesList.focus();
            }
        } else {
            pending();
        }
    }

    var windowUserInfo = null;
    document.getElementById("userinfo").onclick = function (e) {
        if (document.getElementById("loginStatus").value === "logged") {
            if (windowUserInfo == null || windowUserInfo.closed) {
                windowUserInfo = window.open('/userinfo.html')
            } else {
                windowUserInfo.focus();
            }
        } else {
            pending();
        }
    }

    document.getElementById("getLatestId").onclick = function (e) {
        if (document.getElementById("loginStatus").value === "logged") {
            params.foo = "activitiesList";
            params.start_index = 0;
            params.max_limit = 20;
            makeXMLHttpRequest(params);
        } else {
            pending();
        }
    }

    document.getElementById("downloadActivity").onclick = function (e) {
        if (document.getElementById("loginStatus").value === "logged") {
            params.foo = "downloadActivity";
            params.downloadDir = document.getElementById("downloadDir").value 
            params.fileName = document.getElementById("activityFileName").value;
            params.id = document.getElementById("activityId").value;
            //makeXMLHttpRequest(params,"arraybuffer");
            makeXMLHttpRequest(params);
        } else {
            pending();
        }
    }

    /*function toArrayBuffer(buf) {
        var ab = new ArrayBuffer(buf.length);
        var view = new Uint8Array(ab);
        for (var i = 0; i < buf.length; ++i) {
            view[i] = buf[i];
        }
        return ab;
    }*/

    function httpRequestOnLoad() {
        if (this.readyState === 4 && this.status === 200) {
            //console.log(this)
            switch (params.foo) {
                case "config":
                    config = this.response;
                    console.log("now config:")
                    console.log(config)
                    //config = {downloadDir: "./"};
                break;
                case "login":
                    params.foo = "status";
                    setTimeout(makeXMLHttpRequest(params), 3000);
                    break;
                case "status":
                    if (this.response.loginFlag) {
                        config = this.response.config;
                        showGarminConnectControls();
                    } else {
                        loginCounter++;
                        if (loginCounter == 1) {
                            hideUsernamePassword();
                            document.getElementById("Login").dispatchEvent(new Event('click'));
                        }
                        document.getElementById("loginStatus").value = "pending  " + loginCounter + "...";
                        params.foo = "status";
                        setTimeout(makeXMLHttpRequest(params), 3000);
                    }
                    break;
                case "activitiesList":
                    if (document.getElementById("loginStatus").value === "logged") {
                        var activitiesList = this.response;
                        //console.log(activitiesList);
                        var i = 0;
                        for (var k = 0; k < activitiesList.length; k++) {
                            if (activitiesList[k].activityId == document.getElementById("activityId").value) {
                                console.log(activitiesList[k].activityId + ":" + document.getElementById("activityId").value)
                                i = k;
                                break
                            }
                        }
                        const activity = activitiesList[i];
                        const id = activity.activityId;
                        const time = new Date(activity.startTimeLocal).toISOString();
                        let fileName = time.replace(/:/g, "_").replace(".000Z","+00_00") + "_" + id + ".fit";
                        document.getElementById("activityId").value = id;
                        document.getElementById("activityFileName").value = fileName;
                    }
                    break;
                case "downloadActivity":
                    //let content = toArrayBuffer(this.response);
                    console.log(this.response);
                    addParagraph( "Downloaded: " 
                        +  document.getElementById('downloadDir').value + "/" + this.response.file);
                    /*
                    const fitParser = new FitParser({
                        force: true,
                        speedUnit: 'km/h',
                        lengthUnit: 'km',
                        temperatureUnit: 'celcius',
                        elapsedRecordField: true,
                        mode: 'list',                
                      });
                      
                      fitParser.parse(content, function (error, data) {
                        if (error) {
                          console.log(error);
                          console.log("\nCheck path to FIT file\n");
                        } else {
                          console.log(data);
                        }
                      });
                    */                    
                    break;
                default:
                    break;
            }
        }
        if (this.status === 404) {
            throw Error("Errow with httpRequestOnLoad");
        }
    }

    function addParagraph(text) {     
        let p = document.createElement('p'); // is a node
        p.innerHTML = text;
        document.body.appendChild(p);    
    }

    function hideUsernamePassword() {
        document.getElementById('username').style.display = "none";
        document.getElementById('password').style.display = "none";
        document.getElementById('Login').style.display = "none";
        document.getElementById('labelPassword').style.display = "none";
        document.getElementById('labelUsername').style.display = "none";
    }

    function showGarminConnectControls() {
        hideUsernamePassword();
        document.getElementById("loginStatus").value = "logged";
        document.getElementById('gcTitle').innerHTML = "Garmin Connect handler";
        document.getElementById('loginStatus').style.display = "inline";
        document.getElementById('userinfo').style.display = "inline";
        document.getElementById('start_index').style.display = "inline";
        document.getElementById('max_limit').style.display = "inline";
        document.getElementById('start_indexLabel').style.display = "inline";
        document.getElementById('max_limitLabel').style.display = "inline";
        document.getElementById('activitiesList').style.display = "inline";
        document.getElementById('downloadDir').style.display = "inline";
        document.getElementById('downloadDir').value = config.downloadDir;
        document.getElementById('downloadDirLabel').style.display = "inline";
        document.getElementById('getLatestId').style.display = "inline";
        document.getElementById('activityId').style.display = "inline";
        document.getElementById('activityFileNameLabel').style.display = "inline";
        document.getElementById('activityFileName').style.display = "inline";
        document.getElementById('activityIdLabel').style.display = "inline";
        document.getElementById('downloadActivity').style.display = "inline";
    }

    function formatParams(params) {
        return "?" + Object
            .keys(params)
            .map(function (key) {
                return key + "=" + encodeURIComponent(params[key])
            })
            .join("&")
    };

    var url = "/";
    var params = {
        "foo": "status", //activitiesList", // "userinfo",
        "start_index": 0,
        "max_limit": 10,
        "downloadDir": "./",
        "fileName": "test",
        "id": "1234567890"
    };

    function makeXMLHttpRequest(params,type="json") {
        let xhr = new XMLHttpRequest();
        xhr.onload = httpRequestOnLoad;
        //xhr.onreadystatechange = httpRequestOnLoad;        
        xhr.open('GET', url + formatParams(params), true);
        if (type === "json") {
            xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            xhr.responseType = 'json'; 
        }
        if (type === "arraybuffer") {
            //console.log(type);
            xhr.setRequestHeader('Content-type', 'application/octet-stream');
            xhr.responseType = 'arraybuffer';
        }
        xhr.onerror = function (e) {
            console.log(error(xhr.statusText));
        }
        xhr.send(null);
    }

    var loginCounter = 0;

})