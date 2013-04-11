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

**NOTE:** Installing requires full access to the server, and as such will
probably not be possible on a shared server. You'll need a dedicated or virtual
server to install this app on.

Although the app is currently undergoing a rewrite in Node, I understand many
people will be using shared servers where the only options are PHP and MySQL, so
once the Node version is up and running, I'll get to work on making the
installation of the PHP version much simpler. Ideally it'd just be a case of
running a `setup.php` script and everything is magically done for you.

### Outline

The general procedure for installing the app is as follows:

0. Install Node, Git and Redis
1. Download the app
*. Install the app's dependencies
*. Configure the web server to be a proxy for the app

The software in Step 0 is a pre-requisite. There's [a guide] on the Node GitHub
wiki explaining how to install Node; likewise the Git website has [its own
guide] on how to
install Git, and the Redis site [also has a guide].

[a guide]:https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager
[its own guide]:http://git-scm.com/book/en/Getting-Started-Installing-Git
[also has a guide]:http://redis.io/download

### Download and install the app

Once you have Node and Git installed, you need to decide where you're going to
install the app; `/var/www` is a common location. You'll need to perform the
following operations either as root, or as another user with the required
permissions. [This SuperUser post] explains how to set up group with users that
have the necessary permissions.

    # cd /var/www
    # git clone git://github.com/caerphoto/bounty_tracker.git

[This SuperUser post]:http://superuser.com/questions/174343/unix-writing-permissions-for-two-users

### Configuring nginx

This is a potentially very complex topic, as the possibilities are endless, but
[this guide] on the Arg! Team blog is a good starting point, and explains the
reasoning behind using nginx to serve static assets (images, CSS, JS) whilst
passing other requests to the Node app.

[this guide]: http://blog.argteam.com/coding/hardening-node-js-for-production-part-2-using-nginx-to-avoid-node-js-load/
