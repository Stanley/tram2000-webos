function JourneysAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */

}

JourneysAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */

	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */

	/* setup widgets here */

	/* add event handlers to listen to events from widgets */

  // Aplication menu setup
	var menu_model = {
    items: [
      {label: "Informacje", command: 'about'},
      {label: "Opcje", command: 'pref'},
      {label: "Działania", items:[
        {label: "Wyślij wszystko", command: 'send-all'},
        {label: "Usuń wszystko", command: 'remove-all'}
      ]},
      {label: "Pomoc", command: 'help'}
    ]
	}

  this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, menu_model)

  // Open html5 storage connection
  this.db = openDatabase("tram2000", 1, "Tram2000", 250000)

  // Create stops table if doesn't exist
  this.db.transaction(
    function (transaction) {
      var sql = "CREATE TABLE IF NOT EXISTS journeys (begin INTEGER UNIQUE, beg_id INTEGER, end_id INTEGER, data BLOB)"
      transaction.executeSql(sql, [],
        function(){
          console.log("Table was successfully created.")
        },
        this.dbFailureHandler.bind(this)
      )
    }.bind(this)
  )

//  this.timeFormatter = this.timeFormatter.bind(this)

  var list_attributes = {
//    renderLimit: 200,
//	  lookahead: 15,
//    delay: 100,
//    listTemplate:  'journeys/list/container',
    swipeToDelete: true,
    itemTemplate:  'journeys/list/item',
    emptyTemplate: 'journeys/list/empty',
    dividerTemplate: 'journeys/list/divider',
    itemsCallback: function (listWidget, offset, limit) {
      var items = [];

//      for (var i = 0; i < limit; i++) {
          items.push({"time": "Piątek, 20 grudnia", "beg": "Teatr bagatela", "end": "Politechnika", "dur": 15, "stops": "5"});
          items.push({"time": "Środa, 22 grudnia", "beg": "Uniwersytet Jagielloński", "end": "Kombinat", "dur": 21, "stops": "8"});
          items.push({"time": "Środa, 22 grudnia", "beg": "Plac Inwalidów", "end": "Bronowice Małe", "dur": 21, "stops": "8"});
          items.push({"time": "Sobota, 29 grudnia", "beg": "Reymana", "end": "Filharmonia", "dur": 7, "stops": "3"});
//      }

      listWidget.mojo.noticeUpdatedItems(offset, items);
    },
    dividerFunction: function(item){ return item.time } 
  }

  this.listWidget = this.controller.get('journeys')
  this.controller.setupWidget('journeys', list_attributes)

//  this.listTapHandler = this.listTapHandler.bindAsEventListener(this)
//  Mojo.Event.listen(this.listWidget, Mojo.Event.listTap, this.listTapHandler)

}

JourneysAssistant.prototype.dbFailureHandler = function(transaction, error) {
  console.log('An SQL error occurred: ' + error.message)
}

JourneysAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


JourneysAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

JourneysAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as
	   a result of being popped off the scene stack */
}

