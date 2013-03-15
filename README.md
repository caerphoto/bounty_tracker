#Guild Bounty Tracker

This tool is for guilds that like to find all the Bounty NPCs before starting
the Guild Mission. It allows you to register your guild, then provide your guild
members with a password they can use to log in and update their hunt progress.

## Usage

The reference implementation is here:
<http://caerphoto.com/guild_bounty/>

Probably it's easiest if you use that, but if you'd rather run the app on your
own private server or whatever, you're welcome to do that.

The first step is to register your guild. This will create a guild account, with
the Admin login being for you (and other officers, if you share the admin
password with them), and the Member login being for regular members. Both logins
use the same guild name, it's only the password that decides which one a user
gets logged in as, so don't choose the same password for both. I should probably
add a validation check to prevent that, come to think of it.

All regular members can do is mark various NPCs as Found or not, and enter their
names in the Player boxes. Admins, on the other hand, can change the Member
password, and change the Admin email address or password. Admins also have a
Reset button they can use to clear all names and Found statuses from the table
in one go.

## Installation

It's complicated at the moment, as there's no automatic database setup script,
so you kinda have to do everything manually. I'll get round to sorting this out
once I'm comfortable with the general polish of the app itself.

There is a reference in `config.php` and `setup_npc_data.php` to a file called
`private.php`. This file is not included in source control, as it contains the
username, password and connection details to your database. It is required for
the app to work, and looks like this:
    <?php
    $db_user = "your_db_username";
    $db_pw = "your_db_password";
    $db_conn = "pgsql:dbname=your_db_name;host=localhost;port=your_db_port";
    ?>
