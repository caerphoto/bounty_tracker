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

Not recommended yet.

It's complicated at the moment, as there's no automatic database setup script,
so you kinda have to do everything manually, and there's not a whole lot of
documentation explaining how to do this.

The app is currently undergoing a rewrite in Node, but I understand many people
will be using shared servers where the only options are PHP and MySQL, so once
the Node version is up and running, I'll get to work on making the installation
of the PHP version much simpler. Ideally it'd just be a case of running a
`setup.php` script and everything is magically done for you.

For the Node version specifically, I haven't even set it up on my staging server
yet, so I don't know how that's going to go :D
