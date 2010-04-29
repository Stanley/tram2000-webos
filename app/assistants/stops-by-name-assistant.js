function StopsByNameAssistant(stops_name) {
  this.stops_name = stops_name
  this.markers = ""
  this.panelOpen = false
  this.dest = []
}

StopsByNameAssistant.prototype.setup = function() {

  $('#palm-header-toggle-menupanel').text(this.stops_name)

  this.db = openDatabase("tram2000", 1, "Tram2000", 250000)

  this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, {items: [{},
    {toggleCmd: 'map', items:[
      {label: 'Map', iconPath:'images/menu-icon-xapp-maps.png', command: 'map'},
			{label: 'Satellite', iconPath:'images/menu-icon-satellite.png', command: 'sat'}
	  ]},{}
  ]})

  this.menupanel = $("#menupanel")
  this.scrim = $("#scrim")

  this.controller.listen('palm-header-toggle-menupanel', Mojo.Event.tap, this.toggleMenuPanel.bindAsEventListener(this))
  this.controller.listen('scrim', Mojo.Event.tap, this.toggleMenuPanel.bindAsEventListener(this))

  var list_attributes = {
    itemTemplate: 'stops/list/next-stop',
    itemsCallback: this.next_stops.bind(this)
  }

  this.listWidget = this.controller.get('menu-stops')
  this.controller.setupWidget('menu-stops', list_attributes)

}

StopsByNameAssistant.prototype.next_stops = function(listWidget, offset, limit){

  var sql = "SELECT name,geo,next FROM 'stops' WHERE name = ?"
  this.db.transaction(
    function(transaction){
      transaction.executeSql(sql, [this.stops_name], this.dbSuccessSelectHandler.bind(this), this.dbFailureHandler.bind(this));
    }.bind(this)
  )
}

StopsByNameAssistant.prototype.dbSuccessSelectHandler = function(transaction, result) {
  var c = "A".charCodeAt()
  var next_stops = []

  for(var i=0; i < result.rows.length; i++) {
    var point = decodeGeoHash(result.rows.item(i).geo)
    var char = String.fromCharCode(c+i)
    this.markers += "&markers=label:" + char + "|" + point.lat + "," + point.lng

    // In order to query DB with ony one additional query, we need one variable which contains all next stops ids
    if(result.rows.item(i).next)
      next_stops.push(result.rows.item(i).next.split(","))
    else
      next_stops.push([])
  }

  // Set background as google static map
  this.map_url = 'http://maps.google.com/maps/api/staticmap?size=480x480' + this.markers + '&sensor=false&key=ABQIAAAAzr2EBOXUKnm_jVnk0OJI7xSsTL4WIgxhMZ0ZK_kHjwHeQuOD4xQJpBVbSrqNn69S6DOTv203MQ5ufA'
  $('#map').css('background-image', 'url('+ this.map_url +'&mobile=true)')

  var sql = "SELECT id,name FROM stops WHERE id IN ('"+ next_stops.flatten().join("','") +"')"
  this.db.transaction(
    function(transaction){
      transaction.executeSql(sql, [], function(transaction, result){

        // Results by id
        var by_id = {}
        for(var i=0; i < result.rows.length; i++){
          item = result.rows.item(i)
          by_id[item.id] = item.name
        }

        // Converting ids to names
        var dest = this.dest
        var i = 0
        $.each(next_stops, function(){
          var stops = []
          $.each(this, function(){
            stops.push(by_id[this])
          })
          dest.push({char: String.fromCharCode(c+i), name: stops.join(", ") || "koniec trasy"})
          i += 1
        })

        // Update list widget
        this.listWidget.mojo.noticeUpdatedItems(0, this.dest)

      }.bind(this), this.dbFailureHandler.bind(this))
    }.bind(this)
  )

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
//  $('body').css('background', '')
}

StopsByNameAssistant.prototype.toggleMenuPanel = function(){
  this.scrim.animate({opacity: "toggle"}, "fast")
  this.menupanel.toggle()
}

StopsByNameAssistant.prototype.handleCommand = function(event) {
  if(event.type == Mojo.Event.command) {
    switch(event.command) {
      case 'map':
        // Displays bottom background and pushes current to bottom
        $('#map').css('background-image', $('#map').css('background-image').split(", ").reverse().join(", "))
        break
      case 'sat':
        // Adds second background and display it
        $('#map').css('background-image', 'url('+ this.map_url +'&maptype=hybrid), ' + $('#map').css('background-image').split(", ").first())
        break
    }
  }
}
