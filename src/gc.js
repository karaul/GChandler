'use strict';

const axios = require('axios').default;
axios.defaults.withCredentials = true;

const qs = require('qs');
const fs = require('fs');
const stream = require('stream');
const path = require('path');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);

const admzip = require('adm-zip');
// https://stackoverflow.com/questions/63291156/download-zip-with-axios-and-unzip-with-adm-zip-in-memory-electron-app

// https://github.com/La0/garmin-uploader/blob/master/garmin_uploader/api.py
// https://stackoverflow.com/questions/66010962/javascript-equivalent-of-python-requests-session
// https://stackoverflow.com/questions/52549079/does-axios-support-set-cookie-is-it-possible-to-authenticate-through-axios-http

/*
const GC_MODERN = 'https://connect.garmin.com/modern';
const BASE_URL = `${GC_MODERN}/proxy`;
const DOWNLOAD_SERVICE = `${BASE_URL}/download-service`;

const ACTIVITY_SERVICE = `${BASE_URL}/activity-service`;
const ACTIVITYLIST_SERVICE = `${BASE_URL}/activitylist-service`;
const CURRENT_USER_SERVICE = `${GC_MODERN}/currentuser-service/user/info`;
const DEVICE_SERVICE = `${BASE_URL}/device-service`;
*/

const
    URL_HOSTNAME = 'https://connect.garmin.com/modern/auth/hostname',
    URL_LOGIN = 'https://sso.garmin.com/sso/login',
    URL_POST_LOGIN = 'https://connect.garmin.com/modern/',
    URL_PROFILE = 'https://connect.garmin.com/modern/currentuser-service/user/info',
    URL_HOST_SSO = 'sso.garmin.com',
    URL_HOST_CONNECT = 'connect.garmin.com',
    URL_SSO_SIGNIN = 'https://sso.garmin.com/sso/signin',
    URL_ACTIVITIES_LIST = "https://connect.garmin.com/proxy/activitylist-service/activities/search/activities",
    URL_UPLOAD = 'https://connect.garmin.com/modern/proxy/upload-service/upload',
    URL_ACTIVITY_TYPES = 'https://connect.garmin.com/proxy/activity-service/activity/activityTypes';

const
    URL_ACTIVITY_HEAD = (id) => `https://connect.garmin.com/proxy/activity-service/activity/${id}/details`,
    URL_ACTIVITY_BODY = (id) => `https://connect.garmin.com/proxy/download-service/files/activity/${id}`;


// Who needs mandatory urls in a request parameters !
/*var params = {
    'gauthHost': 'https://sso.garmin.com/sso',
    'service': 'https://connect.garmin.com/modern/',
}*/

var params = {
    'clientId': 'GarminConnect',
    'connectLegalTerms': 'true',
    'consumeServiceTicket': 'false',
    'createAccountShown': 'true',
    'cssUrl': 'https://connect.garmin.com/gauth-custom-v1.2-min.css',
    'displayNameShown': 'false',
    'embedWidget': 'false',
    'gauthHost': 'https://sso.garmin.com/sso',
    'generateExtraServiceTicket': 'true',
    'generateNoServiceTicket': 'false',
    'generateTwoExtraServiceTickets': 'true',
    'globalOptInChecked': 'false',
    'globalOptInShown': 'true',
    'id': 'gauth-widget',
    'initialFocus': 'true',
    'locale': 'fr_FR',
    'locationPromptShown': 'true',
    'mfaRequired': 'false',
    'mobile': 'false',
    'openCreateAccount': 'false',
    'privacyStatementUrl': 'https://www.garmin.com/fr-FR/privacy/connect/',
    'redirectAfterAccountCreationUrl': 'https://connect.garmin.com/modern/',
    'redirectAfterAccountLoginUrl': 'https://connect.garmin.com/modern/',
    'rememberMeChecked': 'false',
    'rememberMeShown': 'true',
    'rememberMyBrowserChecked': 'false',
    'rememberMyBrowserShown': 'false',
    'service': 'https://connect.garmin.com/modern/',
    'showConnectLegalAge': 'false',
    'showPassword': 'true',
    'showPrivacyPolicy': 'false',
    'showTermsOfUse': 'false',
    'source': 'https://connect.garmin.com/signin/',
    'useCustomHeader': 'false',
};

var headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:48.0) Gecko/20100101 Firefox/50.0',
    'NK': 'NT',
    'Cookie': []
};


var common_headers = {
    'NK': 'NT',
};


function setHeadersCookie(r) {
    const setCookies = r && r.headers && r.headers['set-cookie'];
    headers.Cookie = headers.Cookie || [];
    if (setCookies) {
        headers.Cookie = headers.Cookie.concat(setCookies);
    }
}

function errorHandler(r, message) {
    console.log("My catch reports an error: " + message);
    let status = "status" in r ? r.status : 999999;
    //console.log("r:" + typeof r);
    //console.log("status: " + status);
    if (status == 429) {
        console.log("statusText: " + r.statusText);
        console.log("retry after:" + r.headers['retry-after']);
        throw new Εrror("status 429");
    }
    if (status == 500) {
        throw new Εrror("status 500");
    }
    return status;
}

async function nextget(location) { // params: params
    return await axios.get(location, {
            headers: headers,
            maxRedirects: 0
        })
        .then((r) => {
            return r;
        }).catch((r) => {
            let status = errorHandler(r.response, "nextget");
            if (status == 302 || status == 301) {
                return r.response;
            } else {
                console.log(typeof r.response);
                console.log(Object.entries(r.response));
                throw new Εrror("Error status: " + status);
            }

        })
}

// https://staxmanade.com/2016/07/easily-simulate-slow-async-calls-using-javascript-async-await/
async function stall(stallTime = 3000) {
    await new Promise(resolve => setTimeout(resolve, stallTime));
}

module.exports = {

    test: async function (data) {
        let result = "test gc, data: " + data;
        return result;
    },

    loginTest: async function (username, password, verbose) {
        if (verbose) {
            console.log("enter test login:");
            console.log("username: " + username);
            console.log("password: " + password);
        }
        //var loginStatus=  await stall(500); // stalls for 500 ms = 0.5 sec
        var loginStatus=  await stall() // stalls for 3000 ms deault
            .then( r=> { return {login: "OK"} } )
            .catch( r=> { return {login: "NO"} } )
        return loginStatus;
    },

    userinfoTest: async function () {
        console.log("enter userinfoTest:");
        var userinfo =  await stall() // stalls for 3000 ms deault
            .then( r=> { return {displayName: "bestRunner"} } )
            .catch( r=> { return {displayName: "undedefined"} } )
        return userinfo;
    },

    login: async function (username, password, verbose) {

        var verbose = verbose || false;
        var data = {
            'embed': 'false',
            'username': username,
            'password': password,
        }

        // get host
        let webhost = await axios.get(URL_HOSTNAME, {
                headers: headers
            })
            .then((r) => {
                return r.data.host;
            })
            .catch((r) => {
                throw Error("No host")
            })
        params['webhost'] = webhost;
        if (verbose) console.log("host: " + webhost);

        // get csrf_token
        let csrf_token = await axios.get(URL_LOGIN, {
                headers: headers,
                params: params
            }).then((r) => {
                let t = r.data;
                let s = t.substring(t.indexOf('input type="hidden" name="_csrf"'));
                let csrf_token = s.slice(0, s.indexOf("/>")).split('"')[5] || "";
                return csrf_token;
            })
            .catch((r) => {
                throw Error("No csrf_token")
            })
        data['_csrf'] = csrf_token;
        if (verbose) console.log("csrf_token: " + csrf_token);

        headers['Host'] = URL_HOST_SSO;
        headers['Referer'] = URL_SSO_SIGNIN;

        // get ticket
        let ticket = await axios.post(URL_LOGIN, qs.stringify(data), {
                headers: headers,
                params: params
            })
            .then((r) => {
                let t = r.data;
                //console.log("passed");
                //console.log(r);
                let s = t.substring(t.indexOf('var response_url'));
                let ticket = s.slice(s.indexOf("?ticket"), s.indexOf("\";")); // +8
                //console.log("\ncookies after post\n");
                //console.log(r.headers['set-cookie']);
                setHeadersCookie(r);
                return ticket;
            })
            .catch((r) => {
                throw Error("Post error, no ticket");
            });


        if (verbose) {
            console.log(ticket);
            console.log("\nheaders.Cookie:");
            console.log(headers.Cookie);
        }

        headers = {};
        headers['Host'] = URL_HOST_CONNECT;

        // auxaliry function to get final cookies
        async function getcookies() {
            let status;
            let location = URL_POST_LOGIN + ticket;
            for (let k = 0; k < 8; k++) {
                console.log("k=" + k);
                status = await nextget(location).then(r => {
                    //console.log(r);
                    status = r.status;
                    location = r.headers.location;
                    console.log("status:" + status);
                    console.log("location: " + location);
                    console.log("Current set-cookie");
                    console.log(r.headers['set-cookie']);
                    setHeadersCookie(r);
                    return status;
                })
                if (status == 200) break;
            }
            return status;
        }

        // get final cookies
        await getcookies().then(status => {
                if (verbose) {
                    console.log("getcookies status: " + status);
                    console.log("Final cookies");
                    console.log(headers.Cookie);
                }
            })
            .catch(() => {
                throw Error("No coockies")
            })

        let loginStatus = {login: "OK"};
        return loginStatus;
    },


    // check login
    userinfo: async function () {
        const userinfo =  await axios.get(URL_PROFILE, //, params: params
            {
                headers: headers
            }).then((r) => {
            //console.log("\nuserinfo set-cookie\n");    
            //console.log(r.headers['set-cookie']);
            //console.log("r.data");
            //console.log(r.data);
            return r.data;
        })
        .catch(() => {
            throw Error("No userinfo")
        })
        return userinfo
    },

    // retrieve a list of the activities
    //let start_index = 0;
    //let max_limit = 4;
    activitiesList: async function(start_index, max_limit) {
        const activitiesList =  await axios.get(URL_ACTIVITIES_LIST, //, params: params
                {
                    headers: headers,
                    params: {
                        "start": start_index,
                        "limit": max_limit
                    }
                })
            .then((r) => {
                return r.data;
            })
            .catch(() => {
                throw Error("No activitiesList")
            })
        return activitiesList;
    },

    // activities id:
    //activitiesList.forEach(el => {
    //   let id = el.activityId;
    //    console.log("activityID: " + id);
    //    console.log("URL: " + URL_ACTIVITY_BODY(id))
    //});    

    // retrieve a head of the activities
    //let id = activitiesList[0].activityId;
    activitiesHead: async function (id) {
        //var id = activity.activityId || activity;
        const activitiesHead = await axios.get(URL_ACTIVITY_HEAD(id), //, params: params
                {
                    headers: headers
                })
            .then((r) => {
                return r.data;
            })
            .catch(() => {
                throw Error("No activitiesHead")
            })
        return activitiesHead;
    },

    /*
    let downloadDir = "./../myactivities/";
    let k = 0;
    let activity = activitiesList[k];
    id = activitiesList[k].activityId;
    */

    // download activity
    downloadActivity: async function downloadActivity(downloadDir, fileName, id) {
        //const id = activity.activityId;
        //const time = new Date(activity.startTimeLocal).toISOString();
        //let fileName = time.replace(/:/g, "_") + "_" + id + ".fit";
        const url = URL_ACTIVITY_BODY(id);
        await axios.get(url, //, params: params
                {
                    headers: headers,
                    responseType: 'arraybuffer'
                })
            .then(r => {
                const zipfile = new admzip(r.data);
                const filenameOrig = zipfile.getEntries()[0].name;
                zipfile.extractAllTo(downloadDir, true);
                fs.rename(downloadDir + "/" + filenameOrig, downloadDir + "/" + fileName, function (err) {
                    if (err) console.log('ERROR at renaming: ' + fileName + err);
                })
                console.log(fileName + ": OK")
            })
            .catch(r => {
                console.log("Error: " + fileName + " is not downloaded")
            })
        return fileName
    }
}