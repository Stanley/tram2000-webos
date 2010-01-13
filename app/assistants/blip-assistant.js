function BlipAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */

  // Database object
  this.sqlite = new Sqlite("tram2000")
  // Number of seconds since beginning of the journey
	this.seconds = 0
  // Latest timestamp returned by GPS
  this.timestamp = 0
  // Keeps active blip object
  this.blip = false
  // Latest know position
  this.lat_lng = false
  // How many stops did we past
  this.count = 0
}

// this function is for setup tasks that have to happen when the scene is first created
BlipAssistant.prototype.setup = function() {

  // Timer setup
  this.timerRollHandler = this.timerRoll.bind(this)
  this.interval = window.setInterval(this.timerRollHandler, 1000)

  // Crate database table 'Blips' if does not exist
  Blip.createTable(this.sqlite, function(){})

  // Command menu setup
  this.commandMenuModel = {items: [{label: 'Pokaż szczegóły', command: 'show-details'}, {label: 'Reset', icon:'refresh', command:'reset'}]}
  this.controller.setupWidget(Mojo.Menu.commandMenu, {}, this.commandMenuModel)

  // Start tracking
  this.controller.serviceRequest('palm://com.palm.location', {
    method        : "startTracking",
    parameters: {
		  accuracy    : 1,
	    responseTime: 1,
      subscribe   : true
		},
    onSuccess     : this.onGpsSuccess.bind(this),
    onFailure     : this.onGpsFailure.bind(this)
  })

  // Require the device to stay awake
  this.controller.serviceRequest("palm://com.palm.power/com/palm/power", {
    method        : "activityStart",
    parameters: {
      id          : "com.palm.app.news.update-1",
      duration_ms : "900000" // = 15 minutes (max)
    },
    onSuccess     : function(){ console.log("Keeping awake for 15 min...") },
    onFailure     : function(){ console.log("Keeping awake failure.") }
  })

}

BlipAssistant.prototype.onGpsSuccess = function(data) {

  // Time which might be useful if we create new blip
  this.timestamp = data.timestamp

  // Current speed
  var speed = 0
  // Current position
  var p2 = {lat: data.latitude, lng: data.longitude, time: data.timestamp}

  // If this is not a first call (so we can display current speed)
  if(this.lat_lng){
    // this will be our reference
    var p1 = this.lat_lng

    // Estimate current speed (if there is a movement)
    if(p1.lat != p2.lat || p1.lng != p2.lng)
      speed = Math.round(length(p1, p2) * ((p2.time - p1.time) * (100/36)))

    // append new data to blip
    if(this.blip)
      this.blip.add( length(p2, this.blip) * 1000, Math.round(data.timestamp / 1000.0) )

    // Only if there is no speed,
    // check if we are close enough to a stop (or stops)
    if(speed == 0){

      // We substr geohash to 8 characters, which will give us bigger area in which we will be looking for nearby stops
      var geohash = encodeGeoHash(p2.lat, p2.lng).substr(0,8)

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
      this.sqlite.db.transaction(
        function (transaction) {
          transaction.executeSql(sql, [geohash, neighbors.top, neighbors.top_right, neighbors.top_left, neighbors.bottom, neighbors.bottom_right, neighbors.bottom_left, neighbors.right, neighbors.left],
            this.dbSuccessHandler.bind(this),
            this.sqlite.failureHandler.bind(this)
          )
        }.bind(this)
      )
    }
  }

  //  console.log(Object.toJSON(data))
  this.controller.get("speed").update(speed + " km/h")

  // We no longer need previous position
  this.lat_lng = p2
}

BlipAssistant.prototype.onGpsFailure = function(status){
  // console.log("Porażka gps" + Object.toJSON(errorCode))
  window.clearInterval(this.interval)
  this.controller.showAlertDialog({
    onChoose: function() {  },
    title: 'Błąd GPS ('+ status.errorCode +')',
    message: 'Nie mogłem ustalić bieżącego położenia.',
    choices: [
      {label: 'Spróbuj ponownie'},
      {label: 'Anuluj'}
    ]
  })
}

// On found nearby stops
BlipAssistant.prototype.dbSuccessHandler = function(transaction, SQLResultSet) {
  // Handle successful queries including receiving results
  // console.log("SQL success: " + SQLResultSet.rows.length)
  var the_nearest_stop

  if(SQLResultSet.rows.length > 1) {
    // Find the closest stop
    var first_stop = SQLResultSet.rows.item(0)
    // Infinity
    var closest_distance = length(decodeGeoHash(first_stop.geo), this.lat_lng) // We can use this.lat_lng because it is the same as current position
    the_nearest_stop = first_stop

    for(var i=1; i<SQLResultSet.rows.length; i++){
      var stop = SQLResultSet.rows.item(i)
      var distance = length(decodeGeoHash(stop.geo), this.lat_lng)
      if(closest_distance > distance){
        closest_distance = distance
        the_nearest_stop = stop
      }
    }
  } else if(SQLResultSet.rows.length == 1) {
    the_nearest_stop = SQLResultSet.rows.item(0)
  } else {
    // Nothing to do here
    return
  }

  // console.log("Najbliższy przystanek: " + the_nearest_stop.id)
  // console.log("Next: " + Object.toJSON(this.blip.next))

//  if(!this.blip){
//    // The same stop. Nothing do do here
//    return
//  }

  // Check whether or not we are where we were
  if(this.blip && this.blip.beg_id != the_nearest_stop.id) {

    if(this.blip.next.indexOf( the_nearest_stop.id ) == -1) {
      var transfer = false
      $.each(this.blip.alternate_next, function(id, hash){
        if(hash.next.indexOf( the_nearest_stop.id ) != -1){
          transfer = {id: id, time: hash.time}
          return
        }
      })
      if(transfer) { // There was a transfer (previously)
        // Remove redundant data
        var transfer_time = Math.round((transfer.time - this.blip.beg_time) / 1000)
//        console.log(transfer_time)
        this.data = this.blip.data.substring(transfer_time)

        this.blip.beg_id = transfer.id
        this.blip.beg_time = transfer.time
      } else {
        // We may transferred
        if(!this.blip.alternate_next[the_nearest_stop.id]) {
          this.blip.alternate_next[the_nearest_stop.id] = {next: the_nearest_stop.nx.split(",").map(parseInt), time: this.timestamp}

        }
        return
      }
    }
    // Otherwise we have the simplest scenario

    // Finish and save current blip
    // These are common actions for both situations: with and without transfer
    this.blip.end_id = the_nearest_stop.id
    this.blip.save()
    this.blip = false

  } else if(this.blip) {
    // Prevent double blip
    return
  }
  
  // Begin new blip
  this.blip = new Blip(this.sqlite, this.timestamp, the_nearest_stop)
  this.controller.get("count").update(this.count++)
}

BlipAssistant.prototype.timerRoll = function(event){
  this.seconds++;

  var min = Math.floor(this.seconds / 60);
  var sec = this.seconds % 60;
  if(sec < 10) sec = "0" + sec
  this.controller.get("time").update(min + ":" + sec);
}

BlipAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


BlipAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */	   
}

BlipAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	   
	clearInterval(this.interval)
}

BlipAssistant.prototype.toggleDetails = function(){
  //  console.log("showing details")
  $("#details").toggleClass("hidden")
  // Nie mogłem połączyć się z siecią internet.
}

BlipAssistant.prototype.handleCommand = function(event) {

  if(event.type == Mojo.Event.command) {
    switch(event.command) {
      case 'show-details':
        this.commandMenuModel.temp = this.commandMenuModel.items
        this.commandMenuModel.items = [{label: 'Ukryj szczegóły', command: 'hide-details'}, {label: 'Reset', icon:'refresh', command:'reset'}] 
        this.controller.modelChanged(this.commandMenuModel)
        this.toggleDetails()
        break

      case 'hide-details':
        this.commandMenuModel.items = this.commandMenuModel.temp
        this.controller.modelChanged(this.commandMenuModel)
        this.toggleDetails()
        break
    
      case 'reset':
        Mojo.Controller.stageController.activeScene().showAlertDialog({
          onChoose: function(value) {
            if(value){
              this.blip = false
              this.count = 0
              this.seconds = -1
              this.controller.get("count").update("-")
            }
          },
          title: "Restart",
          message: "Czy na pewno chcesz na nowo rozpocząć proces monitorowania podróży?",
          	choices:[
              {label: 'Tak', value: true},
          		{label: 'Nie', value: false}
          	]
      	})
        break
    }
  }
}

// Converts degrees to radians
Number.prototype.toRad = function() {
  return this * Math.PI / 180
}

// Returns length between two points in km
function length(p1, p2){
  var R = 6371                            // Radius of the earth in km
  var dLat = (p2.lat - p1.lat).toRad()    // Javascript functions in radians
  var dLon = (p2.lng - p1.lng).toRad()
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(p1.lat.toRad()) * Math.cos(p2.lat.toRad()) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c  // Return distance in km
}
