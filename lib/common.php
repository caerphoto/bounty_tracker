<?php
function fix_slashes(&$str) {
  // I hate that this is even necessary.
  return get_magic_quotes_gpc() ? stripslashes($str) : $str;
}

function makeQueryParam($value) {
  // Very simple function, generally used with array_map
  return ":" . $value;
};

function createNewState() {
  // Create a new default search state.
  global $npc_list;

  $new_state = array();
  foreach ($npc_list as $npc) {
    $new_state[$npc["short_name"]] = array(
      "player" => "",
      "found" => false
    );
  }

  return $new_state;
}

function fetchGuildData($col, $term, $select_cols=false) {
  // Returns id, name and member password based on the given search info
  // $col: which column to match against
  // $term: the data in $col to match against
  global $db_conn, $db_user, $db_pw;

  if (!$select_cols) {
    $select_cols = array("id", "name");
  }

  $dbh = new PDO($db_conn, $db_user, $db_pw);

  $query = $dbh->prepare(
    "select ".
    join(", ", $select_cols) .
    " from guild_bounty.guilds" .
    " where LOWER(" . $col . ") = LOWER(:" . $col . ");"
  );

  $query->bindParam(":" . $col, $term);

  $result = $query->execute();
  $guild = $query->fetch(PDO::FETCH_ASSOC);

  unset($dbh);

  if (!$guild) {
    return false;
  } else {
    return $guild;
  }

}

function fetchSearchState($id, $decode=false) {
  global $db_conn, $db_user, $db_pw;

  $dbh = new PDO($db_conn, $db_user, $db_pw);
  $query = $dbh->prepare(
    "select search_state from guild_bounty.guilds where id=:id"
  );
  $query->bindParam(":id", $id);
  $result = $query->execute();
  $fetched_state = $query->fetch(PDO::FETCH_ASSOC);
  $fetched_state = $fetched_state["search_state"];

  unset($dbh);

  if ($result && $fetched_state) {
    return $decode ? json_decode($fetched_state, true) : $fetched_state;
  } else {
    return false;
  }
}

function outputError($field, $reason, $extra="") {
  echo json_encode(array($field, $reason, $extra));
  return false;
}

function validateParams($params) {
  // Returns true if the given parameters pass some basic validation checks.
  global $db_conn, $db_user, $db_pw;

  // Length check. 200 characters was chosen because it's plenty of space for 
  // almost anything, but not so big as to be unwieldy.
  foreach ($params as $field) {
    if (mb_strlen($field) > 200) {
      return outputError($field, "length");
    }
  }

  if (isset($params["admin_pw"])) {
    // Fail if admin password confirmation is not provided.
    if (!isset($params["admin_pw_confirm"])) {
      return outputError("admin_pw_confirm", "missing");
    }

    // Check the two given passwords match.
    if ($params["admin_pw"] !== $params["admin_pw_confirm"]) {
      return outputError("admin_pw", "mismatch");
    }
  }

  if (isset($param["name"])) {
    // Check for invalid characters in guild name.
    // Valid characters are: [a-z0-9 ]
    $guildname = mb_strtolower($params["name"]);
    if (preg_match("/[^a-z0-9 ]/", $guildname) === 1) {
      return outputError("name", "invalid");
    }
  }

  return true;
} // validateParams()

function updateGuildData($id, $new_data) {
  global $db_conn, $db_user, $db_pw;

  if (isset($new_data["id"])) {
    unset($new_data["id"]);
  }

  function makeUpdateParam($key) {
    return $key . " = :" . $key;
  }
  $keys = array_keys($new_data);
  $update_param = array_map("makeUpdateParam", $keys);

  $dbh = new PDO($db_conn, $db_user, $db_pw);
  $query = $dbh->prepare(
    "update guild_bounty.guilds set\n" .
    join(", ", $update_param) . "\n" .
    "where id = :id;"
  );

  foreach ($new_data as $key => $value) {
    $query->bindValue(":" . $key, $value);
  }
  $query->bindParam(":id", $id);

  $result = $query->execute();
  unset($dbh);

  return $result;
}
?>
