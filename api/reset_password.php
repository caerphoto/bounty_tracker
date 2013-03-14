<?php

include "../config.php";
include "../lib/common.php";
include "../lib/PasswordHash.php";

ob_start();

header("HTTP/1.0 404 Not Found");

$email = mb_strtolower($_REQUEST["admin_email"]);
$guild = fetchGuildData("admin_email", $email, $reset_password_cols);

if (!$guild) {
  exit;
}

// Just in case something goes wrong saving/sending the new password.
header("HTTP/1.0 500 Internal Server Error");

function randomPassword($length) {
  $chars = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789_";
  $pass = array();
  $chars_length = mb_strlen($chars) - 1; // cache length-1 of string
  for ($i = 0; $i < $length; $i += 1) {
      $n = rand(0, $chars_length);
      $pass[] = $chars[$n];
  }
  return implode($pass);
}

$new_password = randomPassword(20);
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
$msg[] = "The admin password for the guild '" . $guild["name"] . "' has beeen reset to:";
$msg[] = $new_password;
$msg [] = "For extra security (and because it's not very memorable), please change it the next time you log in.";
$msg [] = "- Guild Bounty Tracker · http://caerphoto.com/guild_bounty/";
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
