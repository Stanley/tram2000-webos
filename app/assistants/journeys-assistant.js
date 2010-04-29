function JourneysAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */


  // Open html5 storage connection
  this.sqlite = new Sqlite("tram2000")

  this.day = ["Niedziela","Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota"]
  this.month = ["Stycznia","Lutego","Marca","Kwietnia","Maja","Czerwca","Lipca","Sierpnia","Września","Października","Listopada","Grudnia"]
}

JourneysAssistant.prototype.setup = function() {


  // Aplication menu setup
	var menu_model = {
    items: [
      {label: "Informacje", command: 'about'},
      {label: "Opcje", command: 'pref'},
      {label: "Działania", items:[
        {label: "Wyślij wszystko", command: 'blips-send'},
        {label: "Usuń wszystko", command: 'blips-remove-all'}
      ]},
      {label: "Pomoc", command: 'help'}
    ]
	}

  this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, menu_model)

  // Command menu setup
  this.commandMenuModel = {items: [{}, {label: 'Send', icon:'send', command:'blips-send'}]}
  this.controller.setupWidget(Mojo.Menu.commandMenu, {}, this.commandMenuModel)

//  this.timeFormatter = this.timeFormatter.bind(this)

  var list_attributes = {
//    renderLimit: 200,
//	  lookahead: 15,
//    delay: 100,
//    listTemplate:  'journeys/list/container',
    swipeToDelete:    true,
    itemTemplate:     'journeys/list/item',
    emptyTemplate:    'journeys/list/empty',
    dividerTemplate:  'journeys/list/divider',
    itemsCallback:    this.getJourneys.bind(this),
    dividerFunction:  this.printDate.bind(this)
  }

  this.listWidget = this.controller.get('journeys')
  this.controller.setupWidget('journeys', list_attributes)

//  this.listTapHandler = this.listTapHandler.bindAsEventListener(this)
//  Mojo.Event.listen(this.listWidget, Mojo.Event.listTap, this.listTapHandler)

  // Setup progress pill and its drawer
  this.drawer = this.controller.get('ProgressDrawer')
  this.controller.setupWidget('ProgressDrawer', {unstyled: true}, {open: false})

  this.model = {title: "Proszę czekać...", value: 0}
  this.progress = 0
  this.controller.setupWidget('progressPill', {}, this.model)

}

JourneysAssistant.prototype.getJourneys = function(listWidget, offset, limit) {
  Blip.byJourney( this.sqlite, this.dbSuccessHandler.bind(this) )
}

JourneysAssistant.prototype.printDate = function(item){
  var date = new Date(item.time)
  return this.day[date.getDay()] + ", " + date.getDate() + " " + this.month[date.getMonth()]
}

JourneysAssistant.prototype.updateProgress = function(plus){
  this.progress += plus
  if(Math.abs(this.progress - this.model.value) > 0.02) this.model.value = this.progress
  this.model.title = "Aktualizacja: "+ Math.round(this.progress*100) +"%"
  this.controller.modelChanged(this.model)
}

JourneysAssistant.prototype.hideProgress = function(){
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

JourneysAssistant.prototype.dbSuccessHandler = function(items){
  console.log("db success: " + items.length)
  this.listWidget.mojo.noticeUpdatedItems(0, items)
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

JourneysAssistant.prototype.handleCommand = function(event) {
  if(event.type == Mojo.Event.command) {
    switch(event.command) {
      case 'blips-send':

        var user_cookie = new Mojo.Model.Cookie('user').get() || { username: "Anonymous", password: "Anonymous" }

        if(user_cookie.username && !user_cookie.password){
          this.controller.showDialog({
            template: 'preferences/dialog/login-scene',
            assistant: new LoginAssistant(this, function(){console.log("callback")}),
            preventCancel: false
          });

        }

        // Show progress bar and hide send button
        this.drawer.mojo.setOpenState(true)
        this.controller.setMenuVisible(Mojo.Menu.commandMenu, false)

        var couch = new CouchDB(this.sqlite.db, "blips_development", user_cookie.username, user_cookie.password)
        couch.push(this)


//        Blip.sendAll(this.sqlite, function(){
//          this.model.value = this.progress
//          this.model.title = "Wysyłanie: "+ Math.round(this.progress*100) +"%"
//          this.controller.modelChanged(this.model)
//          this.progress += 1.0 / Blip.count
//        }.bind(this))

//        var couch = new CouchDB(this.db, "stops", this)
//        couch.pull(new Mojo.Model.Cookie('stops').get() || 0, function(){
//          this.refreshList()
//        }.bind(this))
        break

      case 'blips-remove-all':
        Mojo.Controller.stageController.activeScene().showAlertDialog({
          onChoose: function(value) {
            if(value){
              Blip.dropTable(this.sqlite,
                 function(){
                  // Create new table
                  Blip.createTable(this.sqlite,
                    function(){
                      // Refresh list
                      try{
                        console.log(this.listWidget)
                      this.listWidget.mojo.noticeUpdatedItems(0, [])
                       } catch(e){console.log(e)}
                    }.bind(this)
                  )
                }.bind(this)
              )
            }
          },
          title: "Potwierdź akcję",
          message: "Czy na pewno chcesz usunąć całą bazę podróży?",
            choices:[
              {label: 'Nie', value: false},
              {label: 'Tak', value: true, type:'negative'}
            ]
        })
        break
    }
  }
}
