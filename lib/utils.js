/*jslint node: true, devel: true*/
exports.createNewState = function () {
    "use strict";

    var npc_list = require("./npc_data").list,
        new_state = {};

    npc_list.forEach(function (npc) {
        new_state[npc.short_name] = {
            player: "",
            found: false
        };
    });

    return new_state;
};

exports.validateParams = function (params) {
    "use strict";
    var guildname,
        validName = /^[a-z0-9 ]+$/;

    Object.keys(params).forEach(function (key) {
        if (params[key].length > 70) {
            return [key, "length"];
        }
    });

    if (params.admin_pw && !params.admin_pw_confirm) {
        return ["admin_pw_confirm", "missing"];
    }

    if (params.admin_pw !== params.admin_pw_confirm) {
        return ["admin_pw_confirm", "mismatch"];
    }

    if (params.guildname) {
        guildname = params.guildname.toLowerCase();
        if (!validName.test(guildname)) {
            return ["guildname", "invalid"];
        }
    }

    return true;
};

exports.generateKey = function (guildname) {
    "use strict";
    // Create a key for the guild by converting to lower case and replacing
    // spaces with underscores.
    return guildname.toLowerCase().replace(/ /g, "_");
};