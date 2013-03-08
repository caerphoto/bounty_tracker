<?php
include "private.php";

// Global variables used by various things.

$guilds_table_cols = array(
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
