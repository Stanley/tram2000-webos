function StopsAssistant() {
}

StopsAssistant.prototype.setup = function(){

  // Aplication menu setup
	var menu_model = {
	  	items: [
	    	{label: "Informacje", command: 'about'},
	    	{label: "Opcje", command: 'pref'},
	  		{label: "Działania", items:[
	  			{label: "Aktualizuj", command: 'stops-sync'},
	  			{label: "Wyczyść", command: 'stops-remove'}
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
      var sql = "CREATE TABLE IF NOT EXISTS stops (id INTEGER PRIMARY KEY, name TEXT, geo TEXT)"
      transaction.executeSql(sql, [],
        function(){
          console.log("Table was successfully created.")
        },
        this.dbFailureHandler.bind(this)
      )
    }.bind(this)
  )

  var list_attributes = {
    renderLimit: 200,
//	  lookahead: 15,
    delay: 100,
    emptyTemplate: 'stops/list-empty',
    itemTemplate: 'stops/list-item',
    filterFunction: this.showList.bind(this),
    dividerFunction: function(item){ return item.name[0] }
  }

  this.listWidget = this.controller.get('stops')
  this.controller.setupWidget('stops', list_attributes)

  this.listTapHandler = this.listTapHandler.bindAsEventListener(this)
  Mojo.Event.listen(this.listWidget, Mojo.Event.listTap, this.listTapHandler)
}

StopsAssistant.prototype.refreshList = function(){
  var sql = "SELECT name, COUNT(*) AS count FROM stops GROUP BY name ORDER BY name"
  console.log("refreshing")
  this.db.transaction(
    function (transaction) {
      transaction.executeSql(sql, [], this.dbSuccessSelectHandler.bind(this, "%", 0), this.dbFailureHandler.bind(this))
    }.bind(this)
  )
}

StopsAssistant.prototype.showList = function(filterString, listWidget, offset, count){
  var sql = "SELECT name, COUNT(*) AS count FROM 'stops' WHERE name LIKE ? OR name LIKE ? GROUP BY name ORDER BY name LIMIT ?, ?"
  this.db.transaction(    
    function (transaction) { 
      transaction.executeSql(sql, [filterString + "%", "% " + filterString + "%", offset, count], this.dbSuccessSelectHandler.bind(this, filterString, offset), this.dbFailureHandler.bind(this)); 
    }.bind(this)
  )
}

StopsAssistant.prototype.listTapHandler = function(event){
  this.controller.stageController.pushScene('stops-by-name', event.item.name)
}

StopsAssistant.prototype.dbSuccessSelectHandler = function(filterString, offset, transaction, result) {
  // Handle successful queries including receiving results
  console.log("SQL select: success")

  var subset = []

  for(var i=0; i < result.rows.length; i++) {
    var row = result.rows.item(i)
    subset.push(row)
  }

  this.listWidget.mojo.noticeUpdatedItems(offset, subset);
		
  // Set the list's lenght & count if we're not repeating the same filter string from an earlier pass
  if (this.filter !== filterString) {
    this.listWidget.mojo.setLength(subset.length)
    this.listWidget.mojo.setCount(subset.length)
  }
  this.filter = filterString    

//  if (this.offset > 50)
//    this.list.push.apply(this.list, subset)

//  console.log(this.offset)

  // update the items in the list with the subset
//	this.updateListWithNewItems(this.listWidget, this.offset, this.list.slice(this.offset, this.offset + this.count))
//	this.listWidget.mojo.setLength(this.list.length)
//  this.listWidget.mojo.noticeUpdatedItems(this.offset, this.list.slice(this.offset, this.offset + this.count))

}

StopsAssistant.prototype.updateListWithNewItems = function(listWidget, offset, items) {
  
}

StopsAssistant.prototype.dbFailureHandler = function(transaction, error) {
  console.log('An SQL error occurred: ' + error.message)
}

StopsAssistant.prototype.clearDbSuccess = function(){
  var cookie = new Mojo.Model.Cookie('stops')
  cookie.put(0)
  this.listWidget.mojo.setLength(0)
}

StopsAssistant.prototype.handleCommand = function(event) {

  if(event.type == Mojo.Event.command) {
    switch(event.command) {
      case 'stops-sync':
        var couch = new CouchDB(this.db, "stops")
        couch.pull(new Mojo.Model.Cookie('stops').get(), function(){
          this.refreshList()
        }.bind(this))
        break
				
      case 'stops-remove':
        Mojo.Controller.stageController.activeScene().showAlertDialog({
          onChoose: function(value) {
            if(value == 'yes'){
              this.db.transaction(    
                function (transaction) {
                  transaction.executeSql("DELETE FROM stops", [], this.clearDbSuccess.bind(this) , function(){});
                }.bind(this)
              )
            } 
          },
          title: "Potwierdź akcję",
          message: "Czy na pewno chcesz usunąć całą lokalną bazę przystanków?",
          	choices:[
           		{label: 'Nie', value:'no'},
          		{label: 'Tak', value:'yes', type:'negative'}
          	]
      	})
        break
    }
  }
}

StopsAssistant.prototype.activate = function(event) {
}

StopsAssistant.prototype.deactivate = function(event) {
}

StopsAssistant.prototype.cleanup = function(event) {
}
