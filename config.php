<?php
include "private.php";
mb_internal_encoding("UTF-8");

// Global variables used by various things.

$login_check_cols = array(
  "id",
  "name",
  "admin_pw",
  "admin_email",
  "member_pw"
);

$reset_password_cols = array(
  "id",
  "name",
  "admin_email"
);

// Used when retrieving guild data for members.
$member_guild_cols = array(
  "id",
  "name",
  "member_pw"
);

// Used when retrieving guild data for admins. A superset of $member_guild_cols
$admin_guild_cols = array_slice($member_guild_cols, 0);
array_push($admin_guild_cols, "admin_email");

// Used when validating registration data.
$required_registration_fields = array(
  "name",
  "admin_pw",
  "admin_pw_confirm",
  "member_pw"
);

// admin_email is not required for registration, but it still needs to be 
// validated.
$all_registration_fields = array_slice($required_registration_fields, 0);
array_push($all_registration_fields, "admin_email");

// Columns used when creating a guild record.
$create_guild_cols = array(
  "name",
  "admin_email",
  "admin_pw",
  "member_pw"
);

$update_info_cols = array(
  "admin_email",
  "member_pw"
);

$dbh = new PDO($db_conn, $db_user, $db_pw);
$query = $dbh->prepare(
  "select name, location, short_name, url from guild_bounty.npcs order by name;"
);
$query->execute();
$npc_list = $query->fetchAll(PDO::FETCH_ASSOC);
unset($dbh);

// Enable error output if in local (dev) environment.
if (!file_exists('../local.txt')) {
    error_reporting(0);
    ini_set('display_errors', '0');
}
