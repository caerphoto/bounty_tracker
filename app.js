/*jslint node: true, devel: true*/
var express = require("express"),
    ejs = require("ejs"),

    site = require("./site"),
    registration = require("./api/registration"),
    session = require("./api/session"),
    search_state = require("./api/search_state"),
    guild_info = require("./api/guild_info"),
    password = require("./api/password"),

    npc_list = require("./lib/npc_data").list,

    RedisStore = require("connect-redis")(express),
    app = express(),

    init;

init = function (env) {
    "use strict";

    var fs = require("fs"),
        f,
        jsfiles = [], cssfiles = [];

    app.set("views", __dirname + "/views");
    app.set("view engine", "ejs");
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
        store: new RedisStore(),
        secret: "just testing"
    }));

    // Load individual files if in dev environment, otherwise load single
    // minified files.
    if (env === "development") {
        f = fs.readFileSync("jsfiles", { encoding: "utf8" });
        f = f.split("\n");

        f.forEach(function (filename) {
            if (filename) {
                jsfiles.push(filename.replace("public", ""));
            }
        });

        f = fs.readFileSync("cssfiles", { encoding: "utf8" });
        f = f.split("\n");

        f.forEach(function (filename) {
            if (filename) {
                cssfiles.push(filename.replace("public", ""));
            }
        });
    } else {
        cssfiles = ["/css/bounty.min.css"];
        jsfiles = ["/js/bounty.min.js"];
    }

    app.locals({
        cssfiles: cssfiles,
        jsfiles: jsfiles,
        npc_list: npc_list
    });
};

init(app.get("env"));

app.get("/", site.index);
app.post("/api/register", registration.create);
app.post("/api/logout", session.destroy);
app.post("/api/login", session.create);
app.get("/api/search_state", search_state.fetch);
app.post("/api/search_state", search_state.update);
app.post("/api/guild_info", guild_info.update);
app.post("/api/reset_password", password.reset);

app.listen(3000);
console.log("Listening on port 3000");
