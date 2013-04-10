/*jslint node: true, devel: true, sloppy: true */
var express = require("express"),
    ejs = require("ejs"),
    app = express();

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));

app.get("/", function (req, res) {
    res.render("index", {
        cssfiles: [ "/css/bounty.min.css" ],
        jsfiles: [ "/js/bounty.min.js" ],
        body_class: "",
        guild_data: {},
        npc_list: [],
        search_state: {}
    });
});

app.listen(3000);
console.log("Listening on port 3000");
