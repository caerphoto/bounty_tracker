<?php
include "private.php";

// Global variables used by various things.

// Columns required for guild registration.
$register_guild_cols = array(
  "name",
  "admin_email",
  "admin_pw",
  "member_pw"
);

// Used when retrieving guild data for members.
$member_guild_cols = array(
  "id",
  "name",
  "member_pw"
);

// Used when retrieving guild data for admins. A superset of $member_guild_cols
$admin_guild_cols = array(
  "id",
  "name",
  "admin_email",
  "admin_pw",
  "member_pw"
);

$required_registration_fields = array(
  "name",
  // admin_email is not required for registration
  "admin_pw",
  "admin_pw_confirm",
  "member_pw"
);

$state_table_cols = array(
  "id",
  "guild_id",
  "state"
);

// Enable error output if in local (dev) environment.
if (!file_exists('../local.txt')) {
    error_reporting(0);
    ini_set('display_errors', '0');
}
