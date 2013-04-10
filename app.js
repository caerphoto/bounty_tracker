/*jslint node: true, devel: true*/
var express = require("express"),
    ejs = require("ejs"),
    redis = require("redis"),
    npc_list = require("npc_data").list,

    registration = require("./api/registration"),
    session = require("./api/session"),
    search_state = require("./api/search_state"),

    RedisStore = require("connect-redis")(express),
    app = express(),

    external_files = {
        css: [],
        js: []
    },

    init;

init = function (env) {
    "use strict";

    var fs = require("fs"),
        f;

    app.set("views", __dirname + "/views");
    app.set("view engine", "ejs");
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
        store: new RedisStore(),
        secret: "just testing"
    }));

    if (env === "development") {
        f = fs.readFileSync("jsfiles", { encoding: "utf8" });
        f = f.split("\n");

        f.forEach(function (filename) {
            if (filename) {
                external_files.js.push(filename.replace("public", ""));
            }
        });

        f = fs.readFileSync("cssfiles", { encoding: "utf8" });
        f = f.split("\n");

        f.forEach(function (filename) {
            if (filename) {
                external_files.css.push(filename.replace("public", ""));
            }
        });
    } else {
        external_files.css = [ "/css/bounty.min.css" ];
        external_files.js = [ "/js/bounty.min.js" ];
    }
};

init(app.get("env"));

app.get("/", function (req, res) {
    "use strict";

    var db;
    if (req.session.guild_key) {
        db = redis.createClient();

        db.on("error", function (err) {
            console.log("Redis Error:", err);
        });

        db.hgetall("guild:" + req.session.guild_key, function (err, reply) {
            var guild_data,
                search_state = reply.search_state,
                is_admin = req.session.is_admin;

            if (is_admin) {
                guild_data = {
                    guildname: reply.guildname,
                    admin_email: reply.admin_email,
                    member_pw: reply.member_pw
                };
            } else {
                guild_data = {
                    guildname: reply.guildname
                };
            }


            res.render("index", {
                cssfiles: external_files.css,
                jsfiles: external_files.js,
                body_class: "logged-in " + (is_admin ? "admin" : ""),
                guild_data: guild_data,
                npc_list: npc_list,
                search_state: search_state
            });

            db.quit();
        });
    } else {
        // Not logged in
        res.render("index", {
            cssfiles: external_files.css,
            jsfiles: external_files.js,
            body_class: "",
            guild_data: false,
            npc_list: npc_list,
            search_state: false
        });
    }
});

app.post("/api/register", registration.create);
app.post("/api/logout", session.destroy);
app.post("/api/login", session.create);
app.get("/api/search_state", search_state.fetch);
app.post("/api/search_state", search_state.update);

app.listen(3000);
console.log("Listening on port 3000");
