document.addEventListener('DOMContentLoaded', function () {

    var config;
    var activitiesList = {};

    window.onclick = function (event) {
        var m = document.getElementById('modal');
        if (event.target == m) {
            m.style.display = "none";
        }
    }

    document.getElementById("Login").onclick = function (e) {
        if (loginCounter == 0) {
            setTimeout(makeXMLHttpRequest({
                foo: "status"
            }), 3000);
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
            params.start_index = document.getElementById('start_index').value;
            params.max_limit = document.getElementById('max_limit').value;
            makeXMLHttpRequest(params);
        } else {
            pending();
        }
    }


    document.getElementById("downloadNewActivities").onclick = function (e) {
        if (document.getElementById("loginStatus").value === "logged") {
            const maxOnlineId = document.getElementById('maxOnlineActivityId').value || 0;
            const maxLocalId = document.getElementById('maxLocalActivityId').value;
            if (maxOnlineId == 0) {
                alert("Click GREEN BUTTON signed:\n" + 
                    "Get GarminConnect Id's for start_index, max_limit")
                return null;
            }
            if (maxOnlineId <= maxLocalId) {
                alert("All activities are downloaded, local_max_Id >= start_index_Id, where\n" + 
                    "local_max_Id = the Latest downloaded activity Id\n" +
                    "start_index_Id = the given  GarminConnect start_index\n\n" +
                    "To download ALL the activities, please set:\n" + 
                    "start_index = 0, max_limit = 999999, local_max_Id = 0\n" +
                    "WARNING: it takes time")
                return null;
            }

            params.foo = "downloadActivity";
            params.downloadDir = document.getElementById("downloadDir").value
            async function getActivity(a) {
                const id = a.activityId;
                if (id > maxLocalId) {
                    const time = new Date(a.startTimeLocal).toISOString();
                    params.fileName = time.replace(/:/g, "_").replace(".000Z", "+00_00") + "_" + id + ".fit";
                    params.id = id;
                    makeXMLHttpRequest(params); //,"json",false);
                    return "downloaded";
                }
                return "existed";
            }        
            async function downloadNewActivitues() {
                let report = {downloaded: 0, existed: 0};
                for (const a of activitiesList) {
                    await getActivity(a).then( r=>{report[r]++} )
                }
                return report;
            }
            downloadNewActivitues().then( report => {
                params.foo = "maxLocalActivityId";
                params.maxLocalActivityId = maxOnlineId;
                for ( let [key, value] of Object.entries(report) ) {
                    const s = key + ":" + value.toString();
                    addParagraph(s);
                }
                makeXMLHttpRequest(params);
                document.getElementById('maxLocalActivityId').value = maxOnlineId;
            })
        } else {
            pending();
        }
    }

    function httpRequestOnLoad() {
        if (this.readyState === 4 && this.status === 200) {
            //console.log(this)
            switch (params.foo) {
                case "maxLocalActivityId":
                    addParagraph(this.response.text);
                    break;
                case "login":
                    params.foo = "status";
                    setTimeout(makeXMLHttpRequest(params), 3000);
                    break;
                case "status":
                    if (this.response.loginFlag) {
                        if ("config" in this.response) {
                            config = this.response.config;
                            showGarminConnectControls();
                        } else {
                            let errorInfo = "Error at login:\n" + this.response.error +
                                "\nCheck username and password";
                            if (this.response.error === "No host") errorInfo += "\nRestart http-server-static"
                            alert(errorInfo);
                            document.location.reload();
                        }
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
                        activitiesList = this.response;
                        console.log(activitiesList.slice(-1));
                        document.getElementById("maxOnlineActivityId").value = activitiesList[0].activityId;
                        document.getElementById("minOnlineActivityId").value = activitiesList.slice(-1)[0].activityId;
                        //console.log(activitiesList);
                    }
                    break;
                case "downloadActivity":
                    //let content = toArrayBuffer(this.response);
                    //console.log(this.response);
                    addParagraph("downloaded: " +
                        document.getElementById('downloadDir').value + "/" + params.fileName + " Ok");
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
        document.getElementById('downloadDir').value = config.downloadDir;
        document.getElementById('downloadDir').style.display = "inline";
        document.getElementById('downloadDirLabel').style.display = "inline";
        //document.getElementById('maxActivityIdΤitle').style.display = "inline";
        document.getElementById('maxLocalActivityId').value = config.maxLocalActivityId;
        document.getElementById('maxLocalActivityId').style.display = "inline";
        document.getElementById('maxLocalActivityIdLabel').style.display = "inline";
        document.getElementById('getLatestId').style.display = "inline";
        document.getElementById('maxOnlineActivityId').value = 0;
        document.getElementById('maxOnlineActivityId').style.display = "inline";
        document.getElementById('maxOnlineActivityIdLabel').style.display = "inline";
        document.getElementById('minOnlineActivityId').value = 0;
        document.getElementById('minOnlineActivityId').style.display = "inline";
        document.getElementById('minOnlineActivityIdLabel').style.display = "inline";
        document.getElementById('downloadNewActivities').style.display = "inline";
        //document.getElementById('activityFileNameLabel').style.display = "inline";
        //document.getElementById('activityFileName').style.display = "inline";
        //document.getElementById('activityIdLabel').style.display = "inline";
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

    function makeXMLHttpRequest(params, type = "json", asyncmode = true) {
        let xhr = new XMLHttpRequest();
        xhr.onload = httpRequestOnLoad;
        //xhr.onreadystatechange = httpRequestOnLoad;        
        xhr.open('GET', url + formatParams(params), asyncmode);
        if (type === "json") {
            xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            if (asyncmode) xhr.responseType = 'json';
        }
        if (type === "arraybuffer") {
            //console.log(type);
            xhr.setRequestHeader('Content-type', 'application/octet-stream');
            if (asyncmode) xhr.responseType = 'arraybuffer';
        }
        xhr.onerror = function (e) {
            console.log(error(xhr.statusText));
        }
        xhr.send(null);
    }

    var loginCounter = 0;

})