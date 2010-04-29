// OBJECT
// Creates table
Blip.createTable = function(sqlite) {
  sqlite.transaction(
    function (transaction) {
      var sql = "CREATE TABLE IF NOT EXISTS blips (time INTEGER PRIMARY KEY, beg INTEGER, end INTEGER, data TEXT)"
      transaction.executeSql(sql, [],
        function(){
          console.log("Table was successfully created.")
        },
        Sqlite.failureHandler.bind(this)
      )
    }
  )
}

Blip.count = 0

// Connects to remote db, tries to sends all records one by one. If successfully, removes record from local db
//Blip.sendAll = function(sqlite, callback) {
//  var couch = new CouchDB(sqlite.db, "blips_development")
//  sqlite.db.transaction(
//    function (transaction) {
//      transaction.executeSql("SELECT * FROM blips", [],
//        function(transaction, result){
//
//          Blip.count = result.rows.length
//          for(var i=0; i < result.rows.length; i++) {
//            couch.push(result.rows.item(i), callback)
//          }
//        },
//        sqlite.failureHandler.bind(this)
//      )
//    }.bind(this)
//  )
//}

// Journey is a sequence of blips, which were created one by one without any break.
// Returns array of journeys.
Blip.byJourney = function(sqlite, callback) {

  sqlite.db.transaction(
    function (transaction) {
      // Select all blips:
      // load data length instead of data itself (note: length equals journey duration in seconds)
      // replace begin stop id with its name
      // replace ending stop id with its name
      var sql = "SELECT blips.time, length(blips.data) AS seconds, beg.name AS beg, end.name AS end FROM blips LEFT OUTER JOIN stops AS beg ON blips.beg = beg.id LEFT OUTER JOIN stops AS end ON blips.end = end.id ORDER BY time"
      transaction.executeSql(sql, [],
        function(transaction, result){

          var items = []

//                                    try{
          for(var i=0; i < result.rows.length; i++) {

            var row = result.rows.item(i)
            //  console.log(Object.toJSON(row))
//            var date = new Date(row.time)
            
            var item = {
              "time": row.time, // ,
              "beg": row.beg,
              "end": row.end,
              "dur": row.seconds, //Math.ceil(row.seconds / 60),
              "dur_str": second_to_minutes(row.seconds),
              "stops": 1
            }

            var prev = items[items.length - 1]

//            if(prev)
//              console.log( item.time +"-"+ prev.time +"-"+ prev.dur*1000 +"="+ (item.time - prev.time - prev.dur*1000) )

            if(prev && item.time - prev.time - prev.dur*1000 < 1000){
              // merge
              prev.end = item.end
              prev.dur += item.dur
              prev.dur_str = second_to_minutes(prev.dur),
              prev.stops += 1
            } else {
              items.push(item)
            }
          }

//                                    } catch(e) {console.log(e)}
          callback(items)
        },
        Sqlite.failureHandler.bind(this)
      )
    }.bind(this)
  )

  function second_to_minutes(seconds){
    var sec_str = seconds % 60
    if(sec_str < 10)
      sec_str = "0" + sec_str
    return Math.floor(seconds / 60) + ":" + sec_str
  }

//
//  return items
}

// Drops table and creates empty one
Blip.dropTable = function(sqlite, callback){
  sqlite.db.transaction(
    function (transaction) {
      try{
      transaction.executeSql("DROP TABLE blips", [],
        callback,
        sqlite.failureHandler.bind(this)
      )
      }catch(e){console.log(e)}
    }.bind(this)
  )
}

// CLASS
// This class represents journey between two neighbour stops
function Blip(sqlite, time, beg){

  this.sqlite = sqlite
  // Current time
//  this.time = Math.round(time / 1000.0)
  // Distance between beginning and last position measurement
  this.sum = 0

  // Used to calculate distance
  var lat_lng = decodeGeoHash(beg.geo)
  this.lat = lat_lng.lat
  this.lng = lat_lng.lng

  // Array of possible next stops
  this.next = beg.next.split(",").map(parseInt)
  // Array of another possible next stops (useful after transfer)
  this.alternate_next = { }
//  console.log(Object.toJSON(this.next))

  // Information kept in db
  this.beg_time = time
  this.beg_id = beg.id
  this.end_id = 0
  this.data = ""
}

// Adds given distance to data field
Blip.prototype.add = function(distance,  seconds){

//  var seconds = timestamp - this.time
//  if(seconds < 1){
//    return // Should not happen
//  }

  // result is an integer between 0 and 255
  // 0..63 represent negative numbers
  // 64..127 represent 0 and positive numbers
  var result = Math.round(distance - this.sum)
  var result_per_second = Math.round(result / seconds + 64)
  this.sum += result
//  this.time = timestamp

  if(result_per_second < 0 || result_per_second > 127)
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
    console.log("Saving blip: { time: " + this.beg_time + ", beg: " + this.beg_id + ", end: " + this.end_id + ", data: " + this.data + "}")
  this.sqlite.db.transaction(
    function(transaction){
      transaction.executeSql("INSERT INTO blips (time, beg, end, data) VALUES (?, ?, ?, ?)", [this.beg_time, this.beg_id, this.end_id, this.data],
        function(){
          console.log("Blip saved")
        }.bind(this),
        Sqlite.failureHandler.bind(this)
      )
    }.bind(this)
  )
}