/*global GBT */
$(function () {
    "use strict";

    var $body = $(document.body),
        init,
        fetchState,
        postState,
        applyStateToTable;

    init = function () {
        // One-time setup stuff.
        var $npc_table = $("#npcs"),
            npc_row_template = $("#npc-row-template").html(),
            html;

        $npc_table.html(Mustache.render(npc_row_template, { NPCs: GBT.npc_list }));

        // Toggle NPC 'found' status on either button click.
        $npc_table.on("click", "button", function () {
            $(this).closest(".npc-row").toggleClass("found");
            $("#found-count").text($(".npc-row.found").length);
        });
    };

    init();

    $("#register-link").click(function () {
        // Move the focus call to the end of the queue so it gets called after
        // the dialog is made visible.
        setTimeout(function () {
            $("#register-guildname").focus();
        }, 0);
    });

    $("#register").submit(function () {
        // Override form submit handling to use ajax instead.
        var form = this;

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
                window.location.hash = "";
                GBT.guild_data = response.guild_data;
                $("#logged-in-guildname").text(GBT.guild_data.name);

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
        var form = this;

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

                if (response.is_admin) {
                    $body.addClass("admin");
                }
                window.location.hash = "";
                GBT.guild_data = response.guild_data;
                $("#logged-in-guildname").text(GBT.guild_data.name);

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
        $.ajax({
            url: "logout.php",
            type: "POST",
            success: function () {
                $body.removeClass("admin logged-in");
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
});
