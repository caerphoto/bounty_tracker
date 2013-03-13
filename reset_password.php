<?php

include "config.php";
include "common.php";
include "PasswordHash.php";

ob_start();

header("HTTP/1.0 404 Not Found");

$guildname = mb_strtolower($_REQUEST["guildname"]);
$guild = fetchGuildData("name", $guildname, $reset_password_cols);

if (!$guild) {
  exit;
}

// Just in case something goes wrong saving/sending the new password.
header("HTTP/1.0 500 Internal Server Error");

$new_password = "something really random";
$hasher = new PasswordHash(8, false);
$hashed_password = $hasher->HashPassword($new_password);

if (!validateParams($_REQUEST)) {
  exit;
}

$result = updateGuildData(
  $guild["id"],
  array("admin_pw" => $hashed_password)
);

if (!$result) {
  exit;
}

$email_message = "The admin password for the guild\r\n\r\r" .
  $guild["name"] . "\r\n\r\n" .
  "has beeen reset to:\r\n\r\n" .
  $new_password . "\r\n\r\n" .
  "For extra security (and because it's not very memorable), please\r\n\r\n" .
  "change it the next time you log in.";

$result = mail(
  $guild["admin_email"],
  "[Guild Bounty Tracker] Password reset for " . $guild["name"],
  $message,
  "From: no-reply@caerphoto.com"
);

if ($result) {
  header("HTTP/1.0 204 No Content");
}
?>
