<!DOCTYPE html>
<html>
  <head>
<!--[if lt IE 9]>
<script>
document.createElement('header');
document.createElement('nav');
document.createElement('section');
document.createElement('article');
document.createElement('aside');
document.createElement('footer');
document.createElement('hgroup');
</script>
<style>
header,
nav,
section,
article,
aside,
footer,
hgroup {
  display: block;
}
</style>
<![endif]-->

    <script type="text/javascript" src="//use.typekit.net/hge8nui.js"></script>
    <script type="text/javascript">try{Typekit.load();}catch(e){}</script>

<?php
  if (file_exists('cssfiles')) {
    $file = file('cssfiles');

    foreach ($file as $i => $line) {
      $line = trim(preg_replace('/\s+/', ' ', $line));
      echo '<link rel="stylesheet" href="' . $line . '">' . "\n";
    }
    unset($file);
  } else {
    echo '<link rel="stylesheet" href="bounty_all.css">';
  }
?>

    <link rel="shortcut icon" href="media/favicon.ico">

    <title>Guild Bounty Tracker</title>
  </head>
  <body class="<?php echo $body_class; ?>">
    <header>
      <a href="#register-dialog" id="register-link">Register your guild</a>

      <form id="login" action="api/login.php" method="POST">
        <label for="login-guildname">Guild name:</label>
        <input type="text" id="login-guildname" name="guildname">
        <label for="login-password">Password:</label>
        <input type="password" id="login-password" name="password">
        <a href="#forgot-password-dialog" id="forgot-password">forgot?</a>
        <input type="submit" value="Log In">
      </form>

      <div id="logged-in">Logged in as a<span id="logged-in-admin">n admin
          of</span><span id="logged-in-member"> member of</span>
        <span id="logged-in-guildname"><?php echo $guild_data["name"];?></span> &middot;
        <span id="logged-in-options"><a href="#options-dialog">options</a>
          &middot; </span>
        <button id="log-out">Log Out</button>
      </div>
    </header>

    <section id="register-dialog" class="dialog">
      <form id="register" action="api/register.php" method="POST">
        <h2>Register Guild</h2>
        <label for="register-guildname">Guild name:</label>
        <input id="register-guildname" name="guildname" type="text">
        <p class="info">The guild name is not case-sensitive. Valid
          characters are <em>letters</em>, <em>numbers</em> and
          <em>spaces</em>.</p>

        <label for="register-admin-email">Admin email:</label>
        <input id="register-admin-email" name="admin_email" type="text">
        <p class="info">This is so you can reset the admin password if you
        forget it. You can leave it blank but this is not recommended.</p>

        <label for="register-admin-pw">Admin password:</label>
        <input id="register-admin-pw" name="admin_pw" type="password">
        <p class="info">This is your login password.</p>

        <label for="register-admin-pw-confirm">Confirm admin password:</label>
        <input id="register-admin-pw-confirm" name="admin_pw_confirm" type="password">
        <span class="info">Just to make sure you made no mistakes typing the
          password.</span>

        <label for="register-member-pw">Member password:</label>
        <input id="register-member-pw" name="member_pw" type="text">
        <p class="info">This is what regular guild members will use to log
        in.  It is <em>not encrypted</em>, since you&rsquo;ll be sharing it with
        lots of (hopefully trustworthy) people anyway.</p>

        <div class="button-bar">
          <a href="#" class="button">Cancel</a>
          <input type="submit" value="Register Guild">
        </div>
      </form>
    </section>

    <section id="options-dialog" class="dialog">
      <form id="options" action="api/update_info.php" method="POST">
        <h2>Options</h2>

        <label for="options-member-pw">Member password:</label>
        <input type="text" id="options-member-pw" name="member_pw" value="<?php
        echo $guild_data["member_pw"];?>">

        <label for="options-admin-email">Admin email:</label>
        <input type="email" id="options-admin-email" name="admin_email" value="<?php
        echo $guild_data["admin_email"];?>">

        <label for="options-admin-pw">Change admin password:</label>
        <input type="password" id="options-admin-pw" name="admin_pw">

        <label for="options-admin-pw-confirm">Confirm new admin password:</label>
        <input type="password" id="options-admin-pw-confirm" name="admin_pw_confirm">

        <div class="button-bar">
          <a href="#" class="button">Cancel</a>
          <input type="submit" value="OK">
        </div>
      </form>
    </section>

    <section id="forgot-password-dialog" class="dialog">
      <form id="reset-password" action="api/reset_password.php" method="POST">
        <h2>Forgot Your Password?</h2>
        <p>Enter the admin email address in the box below then click the
        <em>Reset</em> button to reset the <em>admin password</em> to a new
        random one. An email will be sent containing the new password.</p>

        <label for="forgot-password-admin-email">Admin email:</label>
        <input id="forgot-password-admin-email" type="email" name="admin_email">

        <div class="button-bar">
          <a href="#" class="button">Cancel</a>
          <input type="submit" value="Reset">
        </div>
      </form>
    </section>

    <section id="main">
      <h1>Guild Bounty Tracker</h1>
      <p class="intro info">This tool is to assist guilds with the <em>Guild
        Bounty</em> mission in Guild Wars 2, by allowing everyone to keep track
      of who has found which bounty NPC.</p>

      <p class="intro info"><strong>NOTE:</strong> this tool is still under
      construction, so some of the error messages etc. on aren't very polished
      or friendly.</p>

<!--[if lt IE 9]>
      <p class="intro info"><strong>NOTE:</strong> you appear to be using an
      outdated version of <em>Internet Explorer</em>. Although the primary
      functions of this app (tracking and sync) will still work, you won't be
      able to register a new guild, reset your password or change guild options
      unless you return with a modern browser.</p>
<![endif]-->

      <p class="intro info">If you&rsquo;re a guild leader/officer, you can
      register your guild, then set up a password for other guild members to log
      in with. Other guild members, log in with the password an officer gives
      you.</p>

      <p class="info">Each NPC&rsquo;s name links to the relevant section of <a
        href="http://dulfy.net/2013/02/27/gw2-guild-bounty-guide/">Dulfy&rsquo;s
        guide</a> in a new window, wherein you can find a picture of the NPC and
      a map of their route.</p>

      <p class="intro info">To see what the tracker looks like without
      registering/logging in, try the demo:<button id="demo-toggle">Toggle
        Demo</button></p>

      <p class="instructions info">Enter your name in one of the boxes below.
      When you've found the relevant NPC, click the <em>Found!</em> button.</p>

      <h2 id="found-display">Found so far: <span id="found-count">0</span></h2>

      <script id="npc-row-template" type="text/mustache">
<table id="npc-table">
  <thead>
    <tr class="npc-row">
      <th class="npc-name">NPC</th>
      <th class="npc-location">Location</th>
      <th class="player-name" colspan="2">Player</th>
    </tr>
  </thead>

  <tbody>
  {{#NPCs}}
    <tr class="npc-row" id="npc-{{short_name}}">
      <td class="npc-name"><a href="{{url}}" target="_blank">{{{name}}}</a></td>
      <td class="npc-location">{{{location}}}</td>
      <td class="player-name"><input type="text" required="required"></td>
      <td>
        <button class="found">Found!</button>
        <button class="lost">Lost :(</button>
      </td>
    </tr>
  {{/NPCs}}
  </tbody>
</table>
      </script>

      <div id="npcs"></div>

      <div class="button-bar" id="list-controls">
        <input id="toggle-autosync" type="checkbox" checked>
        <label for="toggle-autosync" title="Will be turned off after 3 hours of inactivity.">Auto-sync</label>

        <button id="manual-refresh" class="disabled">Refresh</button>

        <button id="reset" class="reset">Reset</button>
      </div>

    </section>

    <footer>
      <p>By <a href="//caerphoto.com/">Andy Farrell</a> &middot; source
        available <a href="https://github.com/caerphoto/bounty_tracker">on GitHub</a></p>
    </footer>

    <script>
      var GBT = {
        guild_data: <?php echo json_encode($guild_data); ?>,
        npc_list: <?php echo json_encode($npc_list); ?>,
        search_state: <?php echo $search_state; ?>
      };
    </script>

<?php
  if (file_exists('jsfiles')) {
    $file = file('jsfiles');

    foreach ($file as $i => $line) {
      $line = trim(preg_replace('/\s+/', ' ', $line));
      echo '<script src="' . $line . '"></script>' . "\n";
    }
    unset($file);
  } else {
    echo '<script src="bounty.min.js"></script>';
  }
?>
  </body>
</html>
