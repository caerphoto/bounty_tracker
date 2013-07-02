"use strict";

var express = require("express"),

    site = require("./site"),
    registration = require("./api/registration"),
    session = require("./api/session"),
    search_state = require("./api/search_state"),
    guild_info = require("./api/guild_info"),
    password = require("./api/password"),
    feedback = require("./api/feedback"),

    secrets = require("./lib/secrets"),
    utils = require("./lib/utils"),

    npc_list = require("./lib/npc_data").list,

    RedisStore = require("connect-redis")(express),
    app = express(),

    init;

process.on("DISABLEDuncaughtException", function (err) {
    var mailer = require("nodemailer");

    console.log("Uncaught exception on", new Date());
    console.log(new Date(), err.stack);
    console.trace();

    mailer = mailer.createTransport("SMTP", secrets.smtp_options);

    mailer.sendMail({
        from: secrets.from_email,
        to: secrets.error_email,
        subject: "[ERROR] Uncaught exception in Bounty Tracker",
        text: "Date:" + (new Date()) + "\n\n" + err.stack
    });

    process.exit(1); // ABANDON SHIP
});

init = function (env) {
    var fs = require("fs"),
        f,
        jsfiles = [], cssfiles = [],
        is_comment = /^\s*#/,
        db = require("redis").createClient();

    app.set("views", __dirname + "/views");
    app.set("view engine", "ejs");
    app.set("trust proxy", true);
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
        store: new RedisStore(),
        secret: secrets.session_secret
    }));

    // Handle errors, rather than just exiting.
    app.use(function (err, req, res, next) {
        console.error(err.stack);
        next(err);
    });

    db.set("bounty:user count", 0, function () {
        db.end();
    });

    // Load individual files if in dev environment, otherwise load single
    // minified files.
    if (env === "development") {
        f = fs.readFileSync("jsfiles", { encoding: "utf8" });
        f = f.split("\n");

        f.forEach(function (filename) {
            if (filename && !is_comment.test(filename)) {
                jsfiles.push(filename.replace("public", ""));
            }
        });

        f = fs.readFileSync("cssfiles", { encoding: "utf8" });
        f = f.split("\n");

        f.forEach(function (filename) {
            if (filename && !is_comment.test(filename)) {
                cssfiles.push(filename.replace("public", ""));
            }
        });
    } else {
        f = /bounty\.min-[0-9]+\.[cjs]{2,3}/;

        // Fetch latest filename of minified JS and CSS files.
        cssfiles = fs.readdirSync("public/css/").filter(function (fn) {
            return f.test(fn);
        })
        .map(function (fn) {
            return "/css/" + fn;
        });

        jsfiles = fs.readdirSync("public/js/").filter(function (fn) {
            return f.test(fn);
        })
        .map(function (fn) {
            return "/js/" + fn;
        });
    }

    app.locals({
        cssfiles: cssfiles,
        jsfiles: jsfiles,
        npc_list: npc_list
    });
};

init(app.get("env"));

app.post("/api/register", registration.create);
app.post("/api/logout", session.destroy);
app.post("/api/login", session.create);
app.post("/api/guild_info", guild_info.update);
app.post("/api/reset_password", password.reset);

app.post("/api/assign_player", search_state.assignPlayer);
app.post("/api/remove_player", search_state.removePlayer);
app.post("/api/reset_state", search_state.resetState);
app.post("/api/set_npc_state", search_state.setNPCState);
app.get("/api/search_state", search_state.fetch);

app.post("/api/feedback", feedback.log);

app.get("/", site.index);

if (app.get("env") === "production") {
    // Only listen on localhost, so only traffic passed from nginx reaches the
    // app.
    app.listen(3000, "127.0.0.1");
    utils.log("STARTUP", "port 3000", "production");
} else {
    app.listen(4000);
    utils.log("STARTUP", "port 3000", "development");
}
