/*jslint node: true, devel: true*/
// Single-shot program to replace _ characters in guild key names with spaces.
var redis = require("redis"),
    db = redis.createClient();

db.keys("guild:*", function (err, keys) {
    "use strict";
    var new_names, multi;

    console.log("Current keys:", keys.length);
    console.log(keys.join("\n"));

    new_names = keys.map(function (key) {
        return key.replace(/_/g, " ");
    });

    multi = db.multi();

    keys.forEach(function (key, index) {
        multi.rename(key, new_names[index], function (e, result) {
            console.log("Rename", key, "to", new_names[index] + ":", result);
        });
    });

    multi.exec(function () {
        db.keys("guild:*", function (error, new_keys) {
            console.log("New keys:", new_keys.length);
            console.log(new_keys.join("\n"));
            db.quit();
        });
    });
});


