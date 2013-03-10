<?php
function makeQueryParam($value) {
  // Very simple function, generally used with array_map
  return ":" . $value;
};

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
    " where " . $col . " = :" . $col
  );

  $query->bindParam(":" . $col, $term);
  $result = $query->execute();

  unset($dbh);

  if (!$result) {
    //header('HTTP/1.0 404 Not Found');
    //$error = $query->errorInfo();
    //var_dump($error);
    return false;
  } else {
    return $query->fetch(PDO::FETCH_ASSOC);
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

?>
