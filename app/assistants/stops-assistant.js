function StopsAssistant() {
}

StopsAssistant.prototype.setup = function(){

  // Application menu setup
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

  // Create object representing stops in db
  this.stops = new Stops(this.db)

  var list_attributes = {
    renderLimit: 20,
	  lookahead: 15,
    delay: 100,
    emptyTemplate: 'stops/list/empty',
    itemTemplate: 'stops/list/item',
//    itemsCallback: this.itemsCallback.bind(this),
    filterFunction: this.showList.bind(this),
    dividerFunction: function(item){ return item.name[0] }
  }

  this.listWidget = this.controller.get('stops')
  this.controller.setupWidget('stops', list_attributes)

  this.listTapHandler = this.listTapHandler.bindAsEventListener(this)
  Mojo.Event.listen(this.listWidget, Mojo.Event.listTap, this.listTapHandler)

  this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, {items: [{},{label: 'Refresh', icon:'sync', command:'stops-sync'}]});

  this.controller.setupWidget('ProgressDrawer', {unstyled: true}, {open: false})
  this.drawer = this.controller.get('ProgressDrawer')

  this.model = {title: "Proszę czekać...", value: 0}
  this.progress = 0
  this.controller.setupWidget('progressPill', {}, this.model)

//  progressPillContainer
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
  console.log('showList called')
  Mojo.Log.info($L("offset = ") + offset)
  Mojo.Log.info($L("count = ") + count)
  
  var sql = "SELECT name, COUNT(*) AS count FROM 'stops' WHERE name LIKE ? GROUP BY name ORDER BY name LIMIT ?, ?"
  this.db.transaction(    
    function (transaction) { 
      transaction.executeSql(sql, ["%" + filterString + "%", offset, count], this.dbSuccessSelectHandler.bind(this, filterString, offset), this.dbFailureHandler.bind(this)); 
    }.bind(this)
  )
}

StopsAssistant.prototype.listTapHandler = function(event) {
  this.controller.stageController.pushScene('stops-by-name', event.item.name)
}

StopsAssistant.prototype.dbSuccessSelectHandler = function(filterString, offset, transaction, result) {

  console.log("SQL select: success")

  var subset = []
  for(var i=0; i < result.rows.length; i++) {
    subset.push(result.rows.item(i))
  }

  this.listWidget.mojo.noticeUpdatedItems(offset, subset)
		
  // Set the list's lenght & count if we're not repeating the same filter string from an earlier pass
//  if (this.filter !== filterString) {
    this.listWidget.mojo.setLength(subset.length)
    this.listWidget.mojo.setCount(subset.length)
//  }
//  this.filter = filterString



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
  Stops.createTable(this.db)
  this.listWidget.mojo.setLength(0)
}

StopsAssistant.prototype.updateProgress = function(plus){
  this.progress += plus
  if(Math.abs(this.progress - this.model.value) > 0.02) this.model.value = this.progress
  this.model.title = "Aktualizacja: "+ Math.round(this.progress*100) +"%"
  this.controller.modelChanged(this.model)
}

// Hide progress bar in 2s
StopsAssistant.prototype.hideProgress = function(){
  var that = this
  setTimeout(function(){
    that.drawer.mojo.setOpenState(false)
    setTimeout(function(){
      that.updateProgress(-1)
      setTimeout(function(){
        that.controller.setMenuVisible(Mojo.Menu.commandMenu, true)
      }, 7000)
    }, 1000)
  } , 2000)
}

StopsAssistant.prototype.handleCommand = function(event) {

  if(event.type == Mojo.Event.command) {
    switch(event.command) {
      case 'stops-sync':
        // Show progress bar and hide sync button
        var controller = this.controller
        controller.setMenuVisible(Mojo.Menu.commandMenu, false)
        this.drawer.mojo.setOpenState(true)

        var couch = new CouchDB(this.db, "podsadzacz_development")
        couch.pull(new Mojo.Model.Cookie('stops').get() || 0, function(){
          this.refreshList()
        }.bind(this), this)
        break
				
      case 'stops-remove':
        Mojo.Controller.stageController.activeScene().showAlertDialog({
          onChoose: function(value) {
            if(value == 'yes'){
              this.db.transaction(    
                function (transaction) {
                  transaction.executeSql("DROP TABLE stops", [], this.clearDbSuccess.bind(this) , function(){});
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

StopsAssistant.prototype.itemsCallback = function(listWidget, offset, count) {
  console.log("itemsCallback")
}
