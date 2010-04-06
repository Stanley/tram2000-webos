//
Stop.findNearby = function(sqlite, point, callback){

  // We substr geohash to 8 characters, which will give us bigger area in which we will be looking for nearby stops
  var geohash = encodeGeoHash(point.lat, point.lng).substr(0,8)

  // Find neighbours of above geohash
  var neighbors = {}
  neighbors.top          = calculateAdjacent(geohash, "top")
  neighbors.top_right    = calculateAdjacent(neighbors.top, "right")
  neighbors.top_left     = calculateAdjacent(neighbors.top, "left")
  neighbors.bottom       = calculateAdjacent(geohash, "bottom")
  neighbors.bottom_right = calculateAdjacent(neighbors.bottom, "right")
  neighbors.bottom_left  = calculateAdjacent(neighbors.bottom, "left")
  neighbors.right        = calculateAdjacent(geohash, "right")
  neighbors.left         = calculateAdjacent(geohash, "left")

  // Find all stops which are nearby
  var sql = "SELECT id,geo,nx FROM stops WHERE SUBSTR(geo,0,9) IN (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  sqlite.db.transaction(
    function (transaction) {
      transaction.executeSql(sql, [geohash, neighbors.top, neighbors.top_right, neighbors.top_left, neighbors.bottom, neighbors.bottom_right, neighbors.bottom_left, neighbors.right, neighbors.left],
        //this.dbSuccessHandler.bind(this),
        callback,
        sqlite.failureHandler.bind(this)
      )
    }.bind(this)
  )
}

function Stop(db){

  this.db = db

}

