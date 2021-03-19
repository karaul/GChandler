document.addEventListener('DOMContentLoaded', function () {

    window.onclick = function (event) {
        var m = document.getElementById('modal');
        if (event.target == m) {
            m.style.display = "none";
        }
    }

    document.getElementById("Login").onclick = function (e) {
        if (loginCounter == 0) {
            params.foo = "status";
            makeXMLHttpRequest(params);
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




    var windowActivitiesList = null;
    document.getElementById("activitiesList").onclick = function (e) {
        if (document.getElementById("loginStatus").value === "logged") {
            if (windowActivitiesList == null || windowActivitiesList.closed) {
                let url = "LevelUpfitalyser/index.html" + "?action=GC" +
                    "&start_index=" + document.getElementById('start_index').value +
                    "&max_limit=" + document.getElementById('max_limit').value;
                windowActivitiesList = window.open(url); //'/activitieslist.html'
                //windowActivitiesList = window.open('activitieslist.html'); //'/activitieslist.html'
            } else {
                windowActivitiesList.focus();
            }
        } else {
            loginCounter++;
            document.getElementById("loginStatus").value = "pending  " + loginCounter + "...";
            params.foo = "status";
            makeXMLHttpRequest(params);
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
            loginCounter++;
            document.getElementById("loginStatus").value = "pending  " + loginCounter + "...";
            params.foo = "status";
            makeXMLHttpRequest(params);
        }
    }

    function httpRequestOnLoad() {
        if (this.readyState === 4 && this.status === 200) {
            //console.log(this)
            switch (params.foo) {
                case "login":
                    hiddedUsernamePassword();
                    params.foo = "status";
                    setTimeout(makeXMLHttpRequest(params), 3000);
                    break;
                case "status":
                    if (this.response.loginFlag) {
                        hiddedUsernamePassword();
                        document.getElementById("loginStatus").value = "logged";
                        //document.getElementById("userinfo").dispatchEvent(new Event('click'));
                    } else {
                        loginCounter++;
                        if (loginCounter == 1) {
                            document.getElementById("Login").dispatchEvent(new Event('click'));
                        }
                        document.getElementById("loginStatus").value = "pending  " + loginCounter + "...";
                        params.foo = "status";
                        setTimeout(makeXMLHttpRequest(params), 3000);
                    }
                    break;
                case "activitiesList":

                    break;
                default:
                    break;
            }
        }
        if (this.status === 404) {
            throw Error("Errow with httpRequestOnLoad");
        }
    }

    function hiddedUsernamePassword() {
        document.getElementById('username').style.display = "none";
        document.getElementById('password').style.display = "none";
        document.getElementById('Login').style.display = "none";
        document.getElementById('labelPassword').style.display = "none";
        document.getElementById('labelUsername').style.display = "none";
        document.getElementById('loginStatus').style.display = "inline";
        document.getElementById('userinfo').style.display = "inline";
        document.getElementById('start_index').style.display = "inline";
        document.getElementById('max_limit').style.display = "inline";
        document.getElementById('start_indexLabel').style.display = "inline";
        document.getElementById('max_limitLabel').style.display = "inline";
        document.getElementById('activitiesList').style.display = "inline";
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

    function makeXMLHttpRequest(params) {
        let xhr = new XMLHttpRequest();
        xhr.onload = httpRequestOnLoad;
        //xhr.onreadystatechange = httpRequestOnLoad;
        xhr.open('GET', url + formatParams(params), true);
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.responseType = 'json'; // for bynary 'arraybuffer'
        xhr.onerror = function (e) {
            console.log(error(xhr.statusText));
        }
        xhr.send(null);
    }

    var loginCounter = 0;

})