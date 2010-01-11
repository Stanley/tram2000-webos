// OBJECT
// Creates table
Blip.createTable = function(sqlite) {
  sqlite.db.transaction(
    function (transaction) {
      var sql = "CREATE TABLE IF NOT EXISTS blips (time INTEGER PRIMARY KEY, beg INTEGER, end INTEGER, data TEXT)"
      transaction.executeSql(sql, [], function(){},
        sqlite.failureHandler.bind(this)
      )
    }.bind(this)
  )
}

// Connects to remote db, tries to sends all records one by one. If successfully, removes record from local db
Blip.sendAll = function() {

}

// Journey is a sequence of blips, which were created one by one without any break.
// Returns array of journeys.
Blip.byJourney = function() {

}

// CLASS
// This class represents journey between two neighbour stops
function Blip(sqlite, time, beg){

  this.sqlite = sqlite
  // Current time
  this.time = Math.round(time / 1000.0)
  // Distance between beginning and last position measurement
  this.sum = 0

  // Used to calculate distance
  var lat_lng = decodeGeoHash(beg.geo)
  this.lat = lat_lng.lat
  this.lng = lat_lng.lng

  // Array of possible next stops
  this.next = beg.nx.split(",").map(parseInt)
//  console.log(Object.toJSON(this.next))

  // Information kept in db
  this.beg_time = time
  this.beg_id = beg.id
  this.end_id = 0
  this.data = ""
}

// Adds given distance to data field
Blip.prototype.add = function(distance, timestamp){

  var seconds = timestamp - this.time
  if(seconds < 1){
    return // Should not happen
  }

  // result is an integer between 0 and 255
  // 0..127 represent negative numbers
  // 128..255 represent 0 and positive numbers
  var result = Math.round(distance - this.sum)
  var result_per_second = Math.round(result / seconds + 128)
  this.sum += result
  this.time = timestamp

  if(result_per_second < 0 || result_per_second > 255)
    console.log("Impossible out of range error.")

//  console.log("result: " + result_per_second)

  for(i=0; i<seconds; i++){
    // Each received gps information is represented as one byte
    // Our 8-bit number is represented as utf-8 character in db
    this.data += String.fromCharCode( result_per_second )
  }
}

// Saves record in local db
Blip.prototype.save = function() {
  //  console.log("Saving blip: { time: " + this.beg_time + ", beg: " + this.beg_id + ", end: " + this.end_id + ", data: " + this.data + "}")
  this.sqlite.db.transaction(
    function(transaction){
      transaction.executeSql("INSERT INTO blips (time, beg, end, data) VALUES (?, ?, ?, ?)", [this.beg_time, this.beg_id, this.end_id, this.data],
        function(){
          console.log("Blip saved")
        }.bind(this),
        this.sqlite.failureHandler.bind(this)
      )
    }.bind(this)
  )
}