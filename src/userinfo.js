document.addEventListener('DOMContentLoaded', function () {
    
    function httpRequestOnLoad() {
        if (this.readyState === 4 && this.status === 200) {
            switch (params.foo) {
                case "userinfo":
                    var userinfo = this.response;
                    document.getElementById("userinfo").value = userinfo.displayName;
                    makeTable(userinfo);
                    break;
                default:
                    break;
            }
        }
        if (this.status === 404) {
            throw Error("Errow with httpRequestOnLoad");
        }
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
        "foo": "userinfo", //activitiesList", // "userinfo",
        "start_index": 0,
        "max_limit": 20,
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

    params.foo = "userinfo";
    makeXMLHttpRequest(params);

})


function makeTable(userinfo) {


    var row, cell;
    table = document.createElement("table");
    table.Id = "mytable";
    table.style.display = "block";
    table.style.overflow = "auto";
    table.style.height = "700px";
    table.style.width = "600px";

    const tHead = table.createTHead();
    row = tHead.insertRow();
    row.style = "color: #fff; background-color: #555;";
    //row.style.position = "sticky";
    //row.style.top = "0";
    let cellstyle = "text-align:right; word-wrap:break-word; position:sticky; top:0;";
    let headers = ["key", "value"];
    headers.forEach(p => {
        cell = row.insertCell();
        cell.textContent = p;
        cell.tabIndex = 0;
        switch (p) {
            case "key":
                cell.style = "text-align:right; word-wrap:break-word; width=100px"
                break;
            case "value":
                cell.style = "text-align:left; word-wrap:break-word;  width=500px"
                break;
        }
    });
    //tHead.addEventListener("click", sortByColumn);
    //tHead.addEventListener("keyup", sortByColumn);

    //console.log(userinfo);
    const tBody = table.createTBody();
    for (let [key, value] of Object.entries(userinfo)) {
        row = tBody.insertRow();
        headers.forEach(p => {
            cell = row.insertCell();
            switch (p) {
                case "key":
                    cell.textContent = key;
                    cell.style = "text-align:right; word-wrap:break-word;"
                    break;
                case "value":
                    cell.textContent = value;
                    cell.style = "text-align:left; word-wrap:break-word; width=500px"
                    break;
            }
        });
    }
    document.body.appendChild(table);
    resizableGrid(table);
}
//----- create and fill the table ------------------

//------- make nice view of the table -------------
function resizableGrid(table) {
    var row = table.getElementsByTagName('tr')[0],
        cols = row ? row.children : undefined;
    if (!cols) return;

    table.style.overflow = 'hidden';

    var tableHeight = table.offsetHeight;

    for (var i = 0; i < cols.length; i++) {
        var div = createDiv(tableHeight);
        cols[i].appendChild(div);
        cols[i].style.position = 'relative';
        setListeners(div);
    }

    function setListeners(div) {
        var pageX, curCol, nxtCol, curColWidth, nxtColWidth;

        div.addEventListener('mousedown', function (e) {
            curCol = e.target.parentElement;
            nxtCol = curCol.nextElementSibling;
            pageX = e.pageX;

            var padding = paddingDiff(curCol);

            curColWidth = curCol.offsetWidth - padding;
            if (nxtCol)
                nxtColWidth = nxtCol.offsetWidth - padding;
        });

        div.addEventListener('mouseover', function (e) {
            e.target.style.borderRight = '2px solid #0000ff';
        })

        div.addEventListener('mouseout', function (e) {
            e.target.style.borderRight = '';
        })

        document.addEventListener('mousemove', function (e) {
            if (curCol) {
                var diffX = e.pageX - pageX;

                if (nxtCol)
                    nxtCol.style.width = (nxtColWidth - (diffX)) + 'px';

                curCol.style.width = (curColWidth + diffX) + 'px';
            }
        });

        document.addEventListener('mouseup', function (e) {
            curCol = undefined;
            nxtCol = undefined;
            pageX = undefined;
            nxtColWidth = undefined;
            curColWidth = undefined
        });
    }

    function createDiv(height) {
        var div = document.createElement('div');
        div.style.top = 0;
        div.style.right = 0;
        div.style.width = '5px';
        div.style.position = 'absolute';
        div.style.cursor = 'col-resize';
        div.style.userSelect = 'none';
        div.style.height = height + 'px';
        return div;
    }

    function paddingDiff(col) {

        if (getStyleVal(col, 'box-sizing') == 'border-box') {
            return 0;
        }

        var padLeft = getStyleVal(col, 'padding-left');
        var padRight = getStyleVal(col, 'padding-right');
        return (parseInt(padLeft) + parseInt(padRight));

    }

    function getStyleVal(elm, css) {
        return (window.getComputedStyle(elm, null).getPropertyValue(css))
    }
};
//----------- make nice view of the table ------------------