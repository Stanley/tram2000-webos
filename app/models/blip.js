// This model represents journey between two neighbour stops
function Blip(db, time, beg){

  this.db = db
  this.beg = beg

  // Information kept in db
  this.beg_time = time
  this.beg_id = beg.id
  this.end_id = 0
  this.data = ""

}

// Connects to remote db, tries to sends all records one by one. If successfully, removes record from local db
Blip.sendAll = function() {

}

// Journey is a sequence of blips, which were created one by one without any break.
// Returns array of journeys.
Blip.byJourney = function() {

}

// Adds given distance to data field
Blip.prototype.add = function(distance){

  // result is integer between 0 and 1023
  // 0..767 represents positive numbers
  // 768..1023 represents negative numbers
  var result = distance - this.data[this.data.length - 1]
  if(result < 0 ) {
    if(result > - 256) {
      result = 1023 + result
    } else {
      console.log("błąd zakresu ujemnego")
    }
  } else if(result > 767) {
    console.log("błąd zakresu dodatniego")
  }

  // Because we want represent each received gps information as one byte, we must cut off two last, less significant, bites of our result number
  // Our 8-bit number is represented as utf-8 character in db
  this.data += String.fromCharCode(result >> 2)
}

// Saves record in local db
Blip.prototype.save = function() {

}