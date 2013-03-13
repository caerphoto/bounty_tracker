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

$msg = array();
$msg[] = "The admin password for the guild";
$msg[] = $guild["name"];
$msg[] = "has beeen reset to:";
$msg[] = $new_password;
$msg [] = "For extra security (and because it's not very memorable), please change it the next time you log in.";
$msg = join("\r\n\r\n", $msg);

$headers = array();
$headers[] = "From: no-reply@caerphoto.com";
$headers[] = "Content-Type: text/plain; charset=utf-8";

$result = mail(
  $guild["admin_email"],
  "[Guild Bounty Tracker] Password reset for " . $guild["name"],
  $msg,
  join("\r\n", $headers)
);

if ($result) {
  header("HTTP/1.0 204 No Content");
}
?>
