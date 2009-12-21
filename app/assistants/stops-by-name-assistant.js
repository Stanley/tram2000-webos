function StopsByNameAssistant(stops_name) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */

  this.stops_name = stops_name
}

StopsByNameAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */

  $('#header').text(this.stops_name)

  this.db = openDatabase("tram2000", 1, "Tram2000", 250000)

  var sql = "SELECT geo FROM 'stops' WHERE name = ?"
  this.db.transaction(    
    function (transaction) {
      transaction.executeSql(sql, [this.stops_name], this.dbSuccessSelectHandler.bind(this), this.dbFailureHandler.bind(this)); 
    }.bind(this)
)
}

StopsByNameAssistant.prototype.dbSuccessSelectHandler = function(transaction, result) {
  var c = "A".charCodeAt()
  var markers = ""

  for(var i=0; i < result.rows.length; i++) {
    var point = decodeGeoHash(result.rows.item(i).geo)
    markers += "&markers=label:" + String.fromCharCode(c+i) + "|" + point.latitude[2] + "," + point.longitude[2]
  }
  $('body').css('background', 'url("http://maps.google.com/maps/api/staticmap?size=320x480' + markers + '&sensor=false&key=ABQIAAAAzr2EBOXUKnm_jVnk0OJI7xSsTL4WIgxhMZ0ZK_kHjwHeQuOD4xQJpBVbSrqNn69S6DOTv203MQ5ufA")')
}

StopsByNameAssistant.prototype.dbFailureHandler = function(transaction, error) {
  console.log('An error occurred')
  console.log(error.message)
}

StopsByNameAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


StopsByNameAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

StopsByNameAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
  $('body').css('background', '')
}
