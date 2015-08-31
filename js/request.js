var TICKS_20MIN = 10000 * 1000 * 60 * 20;

var utcToTicks = function (utcTime) {
    return (utcTime * 10000) + 621355968000000000;
};
var ticksToUTC = function (ticks) {
    return (ticks - 621355968000000000) / 10000;
};
var msToHours = function (deltaTicks) {
    return deltaTicks / (1000 * 60 * 60);
};

window.onload = function () {
    var utcNow = (new Date()).getTime();
    var queryStart = utcNow - (1000 * 60 * 60 * 24); // MS in 24 hours
    var ticks = utcToTicks(queryStart);
    $.ajax({
      url: "https://api.kii.com/api/apps/3c82b108/buckets/worlds/query",
      method: "POST",
      headers: {
        "X-Kii-AppID": "3c82b108",
        "X-Kii-AppKey": "7c04df9f1777c38ee02504a808aaa8a3",
        "Content-type": "application/vnd.kii.QueryRequest+json"
      },
      dataType: "json",
      data: JSON.stringify({
        "bucketQuery": {
          "clause": {
            "type": "range",
            "field": "expires",
            "lowerLimit": ticks,
            "lowerIncluded": "true"
          },
          "orderBy": "expires",
          "descending": "true"
        }
      })
    })
    .done(onGetWorlds)
    .fail(onFailGetWorlds);
}

var onGetWorlds = function (data) {
    $("#status").text("Data loaded successfully.");
    console.log(data.results);
    var scores = {};
    var finalExpires = {}
    for (var i = 0; i < data.results.length; i++) {
        var player = data.results[i]["owner"];
        if (player.substring(0, 6) == "NOBODY") {
            continue;
        }
        var prestige = data.results[i]["worldPrestige"];
        var expires = data.results[i]["expires"];
        if (!(player in scores)) {
            scores[player] = 0;
        }
        scores[player] += prestige;
        if (!(player in finalExpires)) {
            finalExpires[player] = expires;
        } else if (expires > finalExpires[player]) {
            finalExpires[player] = expires;
        }
    }

    var boardList = [];
    for (var player in scores) {
        if (scores.hasOwnProperty(player)) {
            var obj = {
                player: player,
                prestige: scores[player],
                lastLogin: finalExpires[player] - TICKS_20MIN
            };
            boardList.push(obj);
        }
    }
    boardList.sort(function(a, b) {return b.prestige - a.prestige});
    for (var i = 0; i < boardList.length; i++) {
        var row = "<tr>";
        row += "<td>" + (i + 1).toString() + "</td>";
        row += "<td>" + boardList[i].player + "</td>";
        row += "<td>" + (boardList[i].prestige + 3).toString() + "</td>";
        row += "</tr>";
        $("#board").append(row);
    }
    console.log(boardList);
}

var onFailGetWorlds = function (xhr, textStatus, errorThrown) {
    $("#status").html("There was an error loading the data. Please try again."
            + "<br>Status: " + textStatus + "<br>Error: " + errorThrown);
    $("#status").css("color", "#A00").css("font-weight", "bold");
}
