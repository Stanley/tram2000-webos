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
	
	//this.interval = setInterval("StageAssistant.handleUpdate()", 1000)
    this.timerRollHandler = this.timerRoll.bind(this);
    this.interval = setInterval(this.timerRollHandler, 1000);

    this.controller.serviceRequest('palm://com.palm.location', {
        method:"startTracking",
        parameters:{
			'accuracy'     : 1,
			'responseTime' : 1
		},
        onSuccess:function(){
            Mojo.Controller.getAppController().showBanner('Sukces', {source: 'notification'})
        }        ,
        onFailure: function(){
            Mojo.Controller.getAppController().showBanner('Błąd GPS', {source: 'notification'})
        }        
    })

}

BingAssistant.prototype.dbSuccessHandler = function(transaction, SQLResultSet) {
 // Handle successful queries including receiving results
 console.log(SQLResultSet)
};


BingAssistant.prototype.dbFailureHandler = function(transaction, error) {

 console.log('An error occurred', error.message);

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

  var sql = "CREATE TABLE IF NOT EXISTS 'stops' (id INTEGER PRIMARY KEY, name TEXT, lat REAL, lng REAL)";  // check sqlite data types for other values

  this.db.transaction(
    function (transaction) { 
      transaction.executeSql(sql, [],
        this.dbSuccessHandler.bind(this),
        this.dbFailureHandler.bind(this)); 
    }.bind(this)); //this is important!

console.log(Object.inspect(Mojo.Menu.editItem))


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
