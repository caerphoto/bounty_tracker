#Guild Bounty Tracker

This tool is for guilds that like to find all the Bounty NPCs before starting
the Guild Mission. It allows you to register your guild, then provide your guild
members with a password they can use to log in and update their hunt progress.

## Usage

The reference implementation is here:

<http://bounty.andyf.me/>

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

## Installing on your own server

If you want to set the app up on your own server, you're of course welcome to do
so, but you'll need some experience dealing with Node applications. You'll also
need, at minimum a working Redis database.

### Outline

The general procedure for getting the app up and running is:

1. Install dependencies
2. Download the app
3. Install the app's dependencies
4. Configure the web server to be a proxy for the app

The dependencies in step 1 are:

1. [Git] – version control and source control
2. [Node] – runs the actual application
3. [Redis] – key/value-based data store
4. *[JSMin] – JavaScript minifier*
5. *[Clean-CSS] – CSS minifier*
6. *[Forever] – restarts the application server if it crashes*

Each item links to a page explaining how to install it. The guides I've chosen
here are generally for Ubuntu, as that's what my staging and production servers
run.

The last three items are only necessary for staging/production – in a
development environment the minified files aren't used, and obviously it makes
no sense to keep automatically restarting the app after a crash while you're
still working on it.

[git]:http://git-scm.com/book/en/Getting-Started-Installing-Git
[node]:https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager
[redis]:http://redis.io/download
[jsmin]:http://realm3.com/articles/compiling_and_using_jsmin_on_ubuntu
[clean-css]:https://github.com/GoalSmashers/clean-css
[forever]:https://github.com/nodejitsu/forever

### Download and install the app

Once you have the dependencies installed (and your Redis server is running), you
need to decide where you're going to install the app. In development, just pick
a directory where you normally develop stuff, e.g.  `~/code/`, then run:

    $ git clone git://github.com/caerphoto/bounty_tracker.git
    $ npm install

You can then start the server with `node app.js` and then visit
`http://localhost:3000/` to see the app running.

In production, `/var/www` is a common install location. You'll need to perform
the following operations as a user with the required permissions; [this
SuperUser post] explains how to set up a user group that has the necessary
permissions, so you don't have to keep typing `sudo` (or worse, logging in as
root).

To download and install:

    $ cd /var/www
    $ git clone git://github.com/caerphoto/bounty_tracker.git
    $ npm install
    $ ./compile
    $ NODE_ENV=production forever start app.js

The `./compile` step may not be necessary, as the compiled JS and CSS files are
included in the Git repository, but it's best to run it anyway, just in case
I've forgotten to update them before a commit.

Once the app is running, you may be able to see it running at
`http://yourdomain.tld:3000/`, but clearly this isn't ideal from an end-user
point of view. That's where the final step comes in.

[this SuperUser post]:http://superuser.com/questions/174343/unix-writing-permissions-for-two-users

### Configuring your web server

This is a potentially very complex topic, as the possibilities are endless, but
if you're using *nginx*, [this guide] on the Arg! Team blog is a good starting
point, and explains the reasoning behind using nginx to serve static assets
(images, CSS, JS) whilst passing other requests to the Node app (tl;dr spoiler:
it's faster).

If you're using Apache, [this page] looks easy enough to follow, though I can't
vouch for it.

[this guide]: http://blog.argteam.com/coding/hardening-node-js-for-production-part-2-using-nginx-to-avoid-node-js-load/
[this page]: http://thatextramile.be/blog/2012/01/hosting-a-node-js-site-through-apache

## TODO

* NPC list needs maintenance.
* Dulfy links might be out of date - possibly better to have links to maps of
  paths directly?
