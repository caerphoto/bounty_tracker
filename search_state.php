<?php
ob_start();
header("Content-Type: application/json");
header("HTTP/1.0 403 Forbidden");

// Abort if not logged in
$id = isset($_SESSION["guild id"]) ? $_SESSION["guild id"] : null;
if (!$id) {
  ob_flush();
  exit(0);
}

include "config.php";
include "common.php";

$req_method = isset($_SERVER["REQUEST_METHOD"]) ? $_SERVER["REQUEST_METHOD"] : "GET";
if ($req_method === "GET") {
  // Simplest case: fetch current search state.
  $state = fetchGuildData("id", $id, array("search_state"));
  if (!$state) {
    header("HTTP/1.0 404 Not Found");
    ob_flush();
    exit(0);
  }

  header("HTTP/1.0 200 OK");
  echo $state; // state is already JSON-encoded.
  ob_flush();
  exit(0);
}

// Request method is POST, meaning the page is sending a state update.
$previous_state = fetchGuildData("id", $id, array("search_state"));
?>
