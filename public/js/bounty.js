/*jshint jquery: true, browser: true*/
/*global GBT, Mustache, soundManager*/
$(function () {
    "use strict";

    var $body = $(document.body),
        $npc_table = $("#npcs"),
        $manual_refresh = $("#manual-refresh"),
        $error = $("#error"),
        error_template = $("#error-template").html(),

        player_list_template = $("#player-list-template").html(),

        min_sync_interval = 3000, // miniumum time in ms between sync requests
        sync_interval = min_sync_interval,
        sync_timer, // handle returned by setTimeout()

        idle_time,
        idle_timer,

        has_played_sound = false,

        base_doc_title = document.title,

        npc_lookup = {},

        error_messages = {
            "exists": "A guild with that name has already been registered.",
            "missing": "The <em>%s</em> field cannot be left blank.",
            "length": "The <em>%s</em> field cannot be longer than <em>%d</em> characters.",
            "mismatch": "The <em>%s</em> does not match.",
            "invalid": "The <em>%s</em> contains invalid characters."
        },
        field_names = {
            "guildname": "guild name",
            "admin_pw": "admin password",
            "admin_email": "admin email",
            "admin_pw_confirm": "admin password confirmation",
            "member_pw": "member password"
        },

        initTable,
        isInList,
        errorDialog,
        fetchState,
        applyState,
        setNPCState,
        assignPlayer,
        removePlayer,
        resetState,
        beginAutoSync,
        logIn,
        incrementIdleTime;

    initTable = function () {
        // One-time setup stuff.
        var npc_row_template = $("#npc-row-template").html();

        $npc_table.html(Mustache.render(npc_row_template, { NPCs: GBT.npc_list }));

        GBT.npc_list.forEach(function (npc) {
            npc_lookup[npc.short_name] = npc;
        });
    };

    isInList = function (name, list) {
        // Performs a case-insensitive search for name in list, and returns true
        // if it's found.
        name = name.toUpperCase();
        return list.some(function (n) {
            return n.toUpperCase() === name;
        });
    };

    errorDialog = function (view) {
        // View object should have the following properties:
        // message: the error message to display,
        // code: an HTTP response code,
        // prev_location: a location hash to return to.
        $error.html(Mustache.render(error_template, view));
        window.location.hash = "error-dialog";
        $error.find("a.button").get(0).focus();
    };

    fetchState = function (callback) {
        $.ajax({
            url: "api/search_state",
            type: "GET",
            dataType: "json",
            success: function (response) {
                // Server may return HTTP 204, indicating success but that the
                // state has not changed since the previous request.
                if (response) {
                    GBT.search_state = response;
                    applyState();
                }
                if (typeof callback === "function") {
                    callback(true);
                }
            },
            error: function () {
                if (typeof callback === "function") {
                    callback(false);
                }
            }
        });

    };

    applyState = function () {
        // Sets the whole NPC table's state according to the state object stored
        // in GBT.seach_state.
        var count = 0,
            state = GBT.search_state,
            this_player_u = "";

        // Detect when an admin has removed/changed a member's assignment.
        if (GBT.this_player) {
            this_player_u = GBT.this_player.toUpperCase();
            GBT.assignment = "";
            $.each(state, function (short_name, npc) {
                if (!npc.players) {
                    npc.players = [];
                }
                if (isInList(this_player_u, npc.players)) {
                    GBT.assignment = short_name;
                }
            });

            $body.toggleClass("assigned", !!GBT.assignment);
        }

        $.each(state, function (short_name, npc) {
            var $row = $("#npc-" + short_name),
                $list,
                view = {};

            if (npc.found) {
                count += 1;
            }

            $row.toggleClass("found", npc.found);

            $list = $row.find(".player-names .player-list");

            if (npc.players) {
                view.players = npc.players.map(function (player) {
                    return {
                        name: player,
                        this_player: player.toUpperCase() === this_player_u
                    };
                });
            } else {
                view.players = npc.players = [];
            }

            $list.html(Mustache.render(player_list_template, view));
            $row.toggleClass("assigned", GBT.assignment === short_name);
        });

        if (count >= GBT.npc_list.length) {
            if (!has_played_sound) {
                soundManager.play("all_found");
                has_played_sound = true;
            }
        } else {
            has_played_sound = false;
        }

        $("#found-count").text(count);
        document.title = "(" + count + ") " + base_doc_title;
    };

    setNPCState = function (short_name, found, callback) {
        // Sends the given NPC found state to the server.
        $.ajax({
            url: "api/set_npc_state",
            type: "POST",
            data: {
                short_name: short_name,
                found: !!found
            },
            dataType: "json",
            success: function (response) {
                // Expects response to be either true or false, which should
                // match the 'found' parameter passed to setNPCState().
                GBT.search_state[short_name].found = response;

                // TODO: this is a bit heavy-handed.
                applyState();

                if (typeof callback === "function") {
                    callback(true);
                }
            },
            error: function (xhr) {
                if (typeof callback === "function") {
                    callback(false, xhr.responseText);
                }
            }
        });
    };

    assignPlayer = function (player_name, npc_short_name, callback) {
        // Assign the current player to the given NPC. If the user is not an
        // admin, GBT.this_player must be set to a player name before calling
        // this function.
        var is_cb = typeof callback === "function";

        if (!player_name && GBT.is_admin) {
            if (is_cb) {
                callback(false, "No player name given.");
            }
            return false;
        }

        if (!player_name && !GBT.this_player && !GBT.is_admin) {
            if (is_cb) {
                callback(false, "Logged-in player name not set.");
            }
            return false;
        }

        if (!player_name) {
            player_name = GBT.this_player;
        }

        $.ajax({
            url: "api/assign_player",
            type: "POST",
            data: {
                npc_short_name: npc_short_name,
                player_name: player_name
            },
            dataType: "json",
            success: function (full_state) {
                GBT.search_state = full_state;
                if (!GBT.is_admin) {
                    GBT.assignment = npc_short_name;
                }
                $npc_table.addClass("assigned");
                applyState();

                if (typeof callback === "function") {
                    callback(true);
                }
            },
            error: function (xhr) {
                // TODO: use proper dialog.
                alert(xhr.responseText);
                if (typeof callback === "function") {
                    callback(false, xhr.responseText);
                }
            }
        });
    };

    removePlayer = function (player_name, npc_short_name, callback) {
        if (!GBT.is_admin && (!player_name || !npc_short_name)) {
            if (typeof callback === "function") {
                callback(false);
            }
            return false;
        }

        $.ajax({
            url: "api/remove_player",
            type: "POST",
            data: {
                npc_short_name: npc_short_name,
                player_name: player_name
            },
            dataType: "json",
            success: function (full_state) {
                GBT.search_state = full_state;
                applyState();

                if (typeof callback === "function") {
                    callback(true);
                }
            },
            error: function (xhr) {
                // TODO: use proper dialog.
                if (typeof callback === "function") {
                    callback(false, xhr.responseText);
                }
            }
        });
    };

    resetState = function (callback) {
        // Resets the state of all NPCs on the table.
        if (!GBT.is_admin) {
            if (typeof callback === "function") {
                callback(false, "Not authorised: not an admin.");
            }
            return;
        }

        $.ajax({
            url: "api/reset_state",
            type: "POST",
            dataType: "json",
            success: function (clean_state) {
                GBT.search_state = clean_state;
                applyState();
                if (typeof callback === "function") {
                    callback(true);
                }
            },
            error: function (xhr) {
                // TODO: use proper dialog.
                alert(xhr.responseText);
                if (typeof callback === "function") {
                    callback(false, xhr.responseText);
                }
            }
        });
    };

    beginAutoSync = function () {
        if ($body.hasClass("demo")) {
            return;
        }

        if (!idle_timer) {
            idle_time = 0;
            idle_timer = setInterval(incrementIdleTime, 600000); // 10 minutes
        }

        fetchState(function (success) {
            // If successful, reduce sync interval until at minimum, otherwise
            // double it. The idea is to be tolerant of network problems.
            if (success) {
                if (sync_interval > min_sync_interval) {
                    sync_interval = sync_interval / 2;
                }
            } else {
                sync_interval = sync_interval * 2;
            }

            if (document.getElementById("toggle-autosync").checked && GBT.guild_data) {
                sync_timer = setTimeout(beginAutoSync, sync_interval);
            }
        });
    };

    logIn = function (login_data) {
        GBT.guild_data = login_data.guild_data;
        GBT.is_admin = login_data.is_admin;
        GBT.search_state = login_data.search_state;

        GBT.assignment = "";
        GBT.this_player = "";

        $body.removeClass("logged-out");
        $body.addClass("logged-in");
        $body.toggleClass("member", !GBT.is_admin);
        $body.toggleClass("admin", !!GBT.is_admin);
        window.location.hash = "";

        $("#logged-in-guildname").text(GBT.guild_data.guildname);
        $("#options-member-pw").val(GBT.guild_data.member_pw);
        $("#options-admin-email").val(GBT.guild_data.admin_email);

        $("#login-guildname").get(0).blur();
        $("#login-password").get(0).blur();

        if (GBT.search_state) {
            applyState();
        }

        setTimeout(function () {
            beginAutoSync();
        }, sync_interval);
    };

    $("#register").on("submit", function () {
        // Override form submit handling to use ajax instead.
        var form = this,
            $submit_button = $(form).find('input[type="submit"]');

        $submit_button.addClass("working");

        $.ajax({
            url: form.action,
            type: form.method,
            data: {
                guildname: form.guildname.value,
                admin_email: form.admin_email.value,
                admin_pw: form.admin_pw.value,
                admin_pw_confirm: form.admin_pw_confirm.value,
                member_pw: form.member_pw.value
            },
            dataType: "json",
            success: function (response) {
                logIn(response);

                // TODO: change this to something less terrible
                window.alert("Success!");
            },
            error: function (xhr) {
                var error = JSON.parse(xhr.responseText),
                    view = {
                        message: error_messages[error[1]],
                        code: xhr.status,
                        prev_location: window.location.hash
                    };

                view.message = view.message.replace("%s", field_names[error[0]]);
                view.message = view.message.replace("%d", error[2]);

                errorDialog(view);
            },
            complete: function () {
                $submit_button.removeClass("working");
            }
        });

        return false; // prevent default handling of form submission
    });

    $("#login").on("submit", function () {
        var form = this,
            $submit_button = $(form).find('input[type="submit"]');

        $submit_button.addClass("working");

        $.ajax({
            url: form.action,
            type: form.method,
            data: {
                guildname: form.guildname.value,
                password: form.password.value
            },
            dataType: "json",
            success: function (response) {
                form.password.value = "";
                logIn(response);
            },
            error: function (xhr) {
                var view = {
                    message: "Invalid guild name or password.",
                    code: xhr.status,
                    prev_location: "#"
                };

                if (xhr.status === 403) {
                    errorDialog(view);
                } else {
                    // I know this is bad UX but it's low priority, since it's
                    // unlikely to happen anyway.
                    window.alert(xhr.status + " " + xhr.statusText);
                }
            },
            complete: function () {
                $submit_button.removeClass("working");
            }
        });

        return false;
    });

    $("#log-out").on("click", function () {
        var $button = $(this),
            doLogout;

        $button.addClass("working");

        doLogout = function () {
            $.ajax({
                url: "api/logout",
                type: "POST",
                success: function () {
                    $body.removeClass("admin logged-in");
                    $body.addClass("logged-out");
                    window.location.hash = "";
                    clearTimeout(sync_timer);
                    document.title = base_doc_title;
                    GBT.guild_data = false;
                },
                error: function () {
                    // Something has gone terribly wrong if this happens.
                    errorDialog({
                        message: "Unable to log you out. Please try again in a few minutes.",
                        code: "unknown",
                        prev_location: ""
                    });
                },
                complete: function () {
                    $button.removeClass("working");
                }
            });
        };

        if (GBT.is_admin || !GBT.this_player || !GBT.assignment) {
            doLogout();
            return;
        }

        removePlayer(GBT.this_player, GBT.assignment, function (success) {
            if (!success) {
                errorDialog({
                    message: "There was a problem unassigning you from <em>" +
                        npc_lookup[GBT.assignment] + "</em>.",
                    code: "unknown",
                    prev_location: ""
                });
            }
            doLogout();
        });

    });

    $("#reset-password").on("submit", function () {
        var form = this,
            $submit_button = $(form).find('input[type="submit"]');

        $submit_button.addClass("working");

        $.ajax({
            url: form.action,
            type: form.method,
            data: {
                guildname: form.guildname.value,
                admin_email: form.admin_email.value
            },
            dataType: "json",
            success: function () {
                window.location.hash = "";
                window.alert("Your password has been reset. Please check your email.");
            },
            error: function (xhr) {
                var view = {
                    code: xhr.status,
                    prev_location: "#forgot-password-dialog"
                },
                messages = {
                    "400": "Neither field can be left blank.",
                    "403": "Incorrect email address.",
                    "404": "No guild found called <em>%s</em>."
                };

                if (messages[xhr.status.toString()]) {
                    view.message = messages[xhr.status.toString()].
                        replace("%s", form.guildname.value);
                    errorDialog(view);
                } else {
                    // Should not happen, so use basic browser alert.
                    window.alert(xhr.status + " " + xhr.statusText);
                }
            },
            complete: function () {
                $submit_button.removeClass("working");
            }
        });

        return false;
    });

    $("#options").on("submit", function () {
        var form = this,
            $submit_button = $(form).find('input[type="submit"]'),
            data = {};

        $submit_button.addClass("working");

        // Only send field data if they're not blank.
        if (form.member_pw.value) {
            data.member_pw = form.member_pw.value;
        }
        if (form.admin_email.value) {
            data.admin_email = form.admin_email.value;
        }
        if (form.admin_pw.value) {
            data.admin_pw = form.admin_pw.value;
            data.admin_pw_confirm = form.admin_pw_confirm.value;
        }

        $.ajax({
            url: form.action,
            type: form.method,
            data: data,
            dataType: "json",
            success: function (response) {
                GBT.guild_data.member_pw = response.member_pw;
                GBT.guild_data.admin_email = response.admin_email;

                form.admin_pw.value = "";
                form.admin_pw_confirm.value = "";

                window.location.hash = "";
            },
            error: function (xhr) {
                var error = JSON.parse(xhr.responseText),
                    view = {
                        message: error_messages[error[1]],
                        code: xhr.status,
                        prev_location: window.location.hash
                    };

                view.message = view.message.replace("%s", field_names[error[0]]);
                view.message = view.message.replace("%d", error[2]);

                errorDialog(view);
            },
            complete: function () {
                $submit_button.removeClass("working");
            }
        });

        return false;
    });

    $("#assign-player").on("submit", function () {
        var form = this,
            $submit_button = $(form).find('input[type="submit"]'),
            player_name,
            npc_short_name;

        player_name = form.player_name.value;

        if (!form.player_name.value) {
            return false;
        }

        $submit_button.addClass("working");

        npc_short_name = form.npc_short_name.value;
        if (!GBT.is_admin) {
            GBT.this_player = player_name;
        }
        assignPlayer(player_name, npc_short_name, function (success, msg) {
            $submit_button.removeClass("working");
            window.location.hash = "";
            if (!success) {
                window.alert(msg);
            }
        });

        return false;
    });

    $(window).on("hashchange", function () {
        // Generic dialog input box focusser thing.
        var hash = window.location.hash,
            $input;

        if (!hash || hash === "#") {
            return;
        }

        $input = $(hash + " > form > input").first();
        if ($input.length) {
            $input.get(0).focus();
        }
    });

    // Toggle NPC 'found' status on either button click.
    $npc_table.on("click", ".npc-controls button", function () {
        var $button = $(this),
            $row = $button.closest(".npc-row"),
            npc = npc_lookup[$row.data("short_name")];

        $button.addClass("working");
        setNPCState(npc.short_name, $button.hasClass("found"), function () {
            $button.removeClass("working");
        });
    }).on("click", ".assign-player", function (evt) {
        var $button = $(this),
            $row = $button.closest(".npc-row"),
            npc = npc_lookup[$row.data("short_name")],
            $dialog_npc_name = $("#assign-player-npc"),
            form;

        // Don't bother showing Enter Name dialog if the player name is already
        // known and player is a member.
        if (!GBT.is_admin && GBT.this_player) {
            evt.preventDefault();

            $button.addClass("working");
            assignPlayer(GBT.this_player, npc.short_name, function () {
                $button.removeClass("working");
            });

            return false;
        }

        $dialog_npc_name.html(npc.name);
        form = document.getElementById("assign-player");
        form.npc_short_name.value = npc.short_name;
        form.player_name.value = "";

    }).on("click", ".remove-player", function () {
        var $button = $(this);

        if (!GBT.is_admin) {
            return false;
        }

        removePlayer($button.data("player_name"),
            $button.closest(".npc-row").data("short_name"),
            function (success, msg) {
            if (!success) {
                window.alert("Unable to reove player:\n\n" + msg);
            }
        });
    });

    $("#stop-hunting").on("click", function () {
        var $button = $(this);

        $button.addClass("working");
        removePlayer(GBT.this_player, GBT.assignment, function (success, msg) {
            $button.removeClass("working");
            if (success) {
                applyState();
            } else {
                window.alert(msg);
            }
        });
    });

    $("#toggle-autosync").on("change", function () {
        $manual_refresh.toggleClass("disabled", this.checked);
        if (this.checked) {
            beginAutoSync();
        } else {
            clearTimeout(sync_timer);
        }
    });

    $manual_refresh.on("click", function () {
        fetchState();
    });

    $("#reset").on("click", function () {
        var $button = $(this);
        $button.addClass("working");

        resetState(function () {
            $button.removeClass("working");
        });
    });

    // Idle timer: disable auto-sync if no activity for 3 hours.
    $body.on("mousemove keyup", function () {
        idle_time = 0;
    });

    incrementIdleTime = function () {
        idle_time += 1; // Timer is incremented every 10 minutes.
        if (idle_time >= 18) { // 3 hours (3 x 10 mins)
            clearTimeout(sync_timer);
            idle_timer = clearTimeout(idle_timer);
            $("#toggle-autosync").get(0).checked = false;
        }
    };

    soundManager.setup({
        url: "/media/soundmanager2.swf",
        onready: function () {
            // SM2 is ready to play audio!
            soundManager.createSound({
                id: "all_found",
                url: "/media/all_found.mp3"
            });
        }
    });

    initTable();

    if (GBT.guild_data && GBT.search_state) {
        applyState(GBT.search_state);
    }

    // Start sync if user appears to be logged in.
    if (GBT.guild_data) {
        beginAutoSync();
    }

});
