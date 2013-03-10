/*global GBT */
$(function () {
    "use strict";

    var $body = $(document.body),
        $npc_table = $("#npcs"),
        initTable,
        fetchState,
        postState,
        applyState;

    initTable = function () {
        // One-time setup stuff.
        var npc_row_template = $("#npc-row-template").html(),
            html;

        $npc_table.html(Mustache.render(npc_row_template, { NPCs: GBT.npc_list }));

    };

    fetchState = function () {
        $.ajax({
            url: "search_state.php",
            type: "GET",
            dataType: "json",
            success: function (response) {
                if (response) {
                    applyState(response);
                }
            },
            error: function (xhr) {
                console.log(xhr.responseText);
            }
        });

    };

    applyState = function (state) {
        $.each(state, function (short_name, status) {
            var $row = $("#npc-" + short_name);
            $row.toggleClass("found", status.found).
                find(".player-name input").val(status.player);
        });
    };

    postState = function (short_name, player, found, callback) {
        $.ajax({
            url: "search_state.php",
            type: "POST",
            data: {
                short_name: short_name,
                player: player,
                found: found
            },
            dataType: "json",
            success: function (response) {
                if (typeof callback === "function") {
                    callback();
                }
            },
            error: function (xhr) {
                console.log(xhr.responseText);
            }
        });
    };

    $("#register-link").click(function () {
        // Move the focus call to the end of the queue so it gets called after
        // the dialog is made visible.
        setTimeout(function () {
            $("#register-guildname").focus();
        }, 0);
    });

    $("#register").submit(function () {
        // Override form submit handling to use ajax instead.
        var form = this,
            $submit_button = $(form).find('input[type="submit"]');

        $submit_button.addClass("working");

        $.ajax({
            url: form.action,
            type: form.method,
            data: {
                name: form.guildname.value,
                admin_email: form.admin_email.value,
                admin_pw: form.admin_pw.value,
                admin_pw_confirm: form.admin_pw_confirm.value,
                member_pw: form.member_pw.value
            },
            dataType: "json",
            success: function (response) {
                $body.addClass("admin logged-in");
                $submit_button.removeClass("working");
                window.location.hash = "";
                GBT.guild_data = response.guild_data;
                $("#logged-in-guildname").text(GBT.guild_data.name);
                $("#options-member-pw").text(GBT.guild_data.member_pw);

                // TODO: change this to something less terrible
                window.alert("Success!");
            },
            error: function (xhr) {
                // I know this is bad UX but it's low priority.
                window.alert(xhr.responseText);
            }
        });

        return false; // prevent default handling of form submission
    });

    $("#login").submit(function () {
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
                $body.addClass("logged-in");
                $submit_button.removeClass("working");

                if (response.is_admin) {
                    $body.addClass("admin");
                }
                window.location.hash = "";
                GBT.guild_data = response.guild_data;
                if (response.search_state) {
                    applyState(response.search_state);
                }

                $("#logged-in-guildname").text(GBT.guild_data.name);
                $("#options-member-pw").text(GBT.guild_data.member_pw);

                form.password.value = "";
            },
            error: function (xhr) {
                if (xhr.status === 403) {
                    window.alert("Invalid guild name or password.");
                } else {
                    // I know this is bad UX but it's low priority.
                    window.alert(xhr.status + " " + xhr.statusText);
                }
            }
        });

        return false;
    });

    $("#log-out").click(function () {
        var $button = $(this);

        $button.addClass("working");

        $.ajax({
            url: "logout.php",
            type: "POST",
            success: function () {
                $body.removeClass("admin logged-in");
                $button.removeClass("working");
                window.location.hash = "";
            },
            error: function (xhr) {
                // I know this is bad UX but it's low priority.
                window.alert(xhr.statusCode());
            }
        });
    });

    $("#demo-toggle").click(function () {
        $body.toggleClass("demo");
    });

    // Toggle NPC 'found' status on either button click.
    $npc_table.on("click", "button", function () {
        var $row = $(this).closest(".npc-row"),
            $buttons = $row.find("button"),
            found = !$row.hasClass("found");

        $row.toggleClass("found");
        $buttons.addClass("working");

        postState($row.attr("id").slice(4),
            $row.find(".player-name input").val(),
            found,
            function () {
                $buttons.removeClass("working");
            }
        );

        $("#found-count").text($(".npc-row.found").length);
    });

    $("#refresh").click(function () {
        fetchState();
    });

    initTable();
    if (GBT.search_state) {
        applyState(GBT.search_state);
    }

});
