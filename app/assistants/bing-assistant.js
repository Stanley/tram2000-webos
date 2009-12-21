function BingAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

BingAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */

    this.db = openDatabase("tram2000", 1, "Tram2000", 250000);

    //  console.log(stops)

	this.seconds = 0;
//    this.speed = 0
//    this.lat_lng;
	
	//this.interval = setInterval("StageAssistant.handleUpdate()", 1000)
    this.timerRollHandler = this.timerRoll.bind(this);
    this.interval = setInterval(this.timerRollHandler, 1000);

    this.controller.serviceRequest('palm://com.palm.location', {
        method:"startTracking",
        parameters:{
			'accuracy'     : 1,
			'responseTime' : 1,
            'subscribe'    : true
		},
        onSuccess: this.onGpsSuccess.bind(this),
        onFailure: function(status){
//            console.log("Porażka gps" + Object.toJSON(errorCode))
            Mojo.Controller.getAppController().showBanner('GPS: ' + status.errorCode, {source: 'notification'})
        }        
    })

}

BingAssistant.prototype.onGpsSuccess = function(data) {
 // Handle successful queries including receiving results
    var p2 = {lat: data.latitude, lng: data.longitude, time: data.timestamp}

    if(this.lat_lng){
        var p1 = this.lat_lng
        var v = 0

        // Oblicz prędkość chwilową
        if(p1.lat != p2.lat || p1.lng != p2.lng)
            v = length(p1, p2) * ((p2.time - p1.time) * (100/36))

        // Sprawdź czy jesteś w pobliżu przystanku
        if(v == 0){
          var sql = "SELECT id FROM stops WHERE SUBSTR(geo,0,9) IN (?, ?, ?, ?, ?, ?, ?, ?, ?)"
          var geohash = encodeGeoHash(p2.lat, p2.lng).substr(0,8)

          var neighbors = {}
          neighbors.top          = calculateAdjacent(geohash, "top")
          neighbors.top_right    = calculateAdjacent(neighbors.top, "right")
          neighbors.top_left     = calculateAdjacent(neighbors.top, "left")
          neighbors.bottom       = calculateAdjacent(geohash, "bottom")
          neighbors.bottom_right = calculateAdjacent(neighbors.bottom, "right")
          neighbors.bottom_left  = calculateAdjacent(neighbors.bottom, "left")
          neighbors.right        = calculateAdjacent(geohash, "right")
          neighbors.left         = calculateAdjacent(geohash, "left")

          this.db.transaction(
            function (transaction) {
              transaction.executeSql(sql, [geohash, neighbors.top, neighbors.top_right, neighbors.top_left, neighbors.bottom, neighbors.bottom_right, neighbors.bottom_left, neighbors.right, neighbors.left],
                this.dbSuccessHandler.bind(this),
                this.dbFailureHandler.bind(this)
              )
            }.bind(this)
          )
        }

        this.controller.get("speed").update(Math.round(v * 10) / 10 + " km/h")

    }
    // console.log(Object.toJSON(data))
    console.log("Czas: " + data.timestamp)
    console.log("Lat: " + data.latitude)
    console.log("Lng: " + data.longitude)

    this.lat_lng = p2;


    function length(p1, p2){
        var R = 6371; // Radius of the earth in km
        var dLat = (p2.lat - p1.lat).toRad();  // Javascript functions in radians
        var dLon = (p2.lng - p1.lng).toRad();
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(p1.lat.toRad()) * Math.cos(p2.lat.toRad()) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in km
    }

// console.log(Object.toJSON(status))
};

BingAssistant.prototype.dbSuccessHandler = function(transaction, SQLResultSet) {
  // Handle successful queries including receiving results
  console.log("SQL success: " + SQLResultSet.rows.length)
  if(SQLResultSet.rows.length > 1){
    // Szukam najbliższego przystanku
  }
  else if(SQLResultSet.rows.length == 1){
    // Rozpoczynam proces zbierania danych...
  }
};


BingAssistant.prototype.dbFailureHandler = function(transaction, error) {

  console.log('An SQL error occurred: '+ error.message);
  console.log(Object.toJSON(transaction))

 // Handle errors or other failure modes
};

BingAssistant.prototype.timerRoll = function(event){
  this.seconds++;

  var min = Math.floor(this.seconds / 60);
  var sec = this.seconds % 60;
  if(sec < 10) sec = "0" + sec
  this.controller.get("time").update(min + ":" + sec);
}

BingAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */

//  console.log(this.db)


//  this.db.transaction(function(t){ //.bind(this);
//    transaction.executeSql('SOME SQL', [], this.successHandler.bind(this), this.failureHandler.bind(this));
//  })

//  var sql = "CREATE TABLE IF NOT EXISTS 'stops' (id INTEGER PRIMARY KEY, name TEXT, lat REAL, lng REAL)";  // check sqlite data types for other values
//
//  this.db.transaction(
//    function (transaction) {
//      transaction.executeSql(sql, [],
//        this.dbSuccessHandler.bind(this),
//        this.dbFailureHandler.bind(this));
//    }.bind(this)); //this is important!
//
//console.log(Object.inspect(Mojo.Menu.editItem))


}


BingAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */	   
}

BingAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	   
	clearInterval(this.interval)
}

Number.prototype.toRad = function() {  // convert degrees to radians
  return this * Math.PI / 180;
}
