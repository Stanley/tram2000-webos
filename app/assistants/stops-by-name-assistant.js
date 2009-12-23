function StopsByNameAssistant(stops_name) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */

  this.stops_name = stops_name
  this.markers = ""
  this.panelOpen = false
}

StopsByNameAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */

  $('#palm-header-toggle-menupanel').text(this.stops_name)

  this.db = openDatabase("tram2000", 1, "Tram2000", 250000)

  var sql = "SELECT geo FROM 'stops' WHERE name = ?"
  this.db.transaction(    
    function(transaction){
      transaction.executeSql(sql, [this.stops_name], this.dbSuccessSelectHandler.bind(this), this.dbFailureHandler.bind(this)); 
    }.bind(this)
  )

  this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, {items: [
    {},
    {toggleCmd: 'map', items:[
      {label: 'Map', iconPath:'images/menu-icon-xapp-maps.png', command: 'map'},
			{label: 'Satellite', iconPath:'images/menu-icon-satellite.png', command: 'sat'}
	  ]},
    {}
  ]})


  this.menupanel = this.controller.sceneElement.querySelector('div[x-mojo-menupanel]')
  this.scrim = this.controller.sceneElement.querySelector('div[x-mojo-menupanel-scrim]')

  this.controller.listen('palm-header-toggle-menupanel', Mojo.Event.tap, this.toggleMenuPanel.bindAsEventListener(this))
  this.controller.listen(this.scrim, Mojo.Event.tap, this.toggleMenuPanel.bindAsEventListener(this))

  this._dragHandler = this._dragHandler.bindAsEventListener(this)

  this.menuPanelVisibleTop = this.menupanel.offsetTop
  this.menupanel.style.top = (0 - this.menupanel.offsetHeight - this.menupanel.offsetTop)+'px'
  this.menuPanelHiddenTop = this.menupanel.offsetTop

  this.scrim.hide()
  this.scrim.style.opacity = 0
}

StopsByNameAssistant.prototype.dbSuccessSelectHandler = function(transaction, result) {
  var c = "A".charCodeAt()
//  var markers = ""

  for(var i=0; i < result.rows.length; i++) {
    var point = decodeGeoHash(result.rows.item(i).geo)
    this.markers += "&markers=label:" + String.fromCharCode(c+i) + "|" + point.latitude[2] + "," + point.longitude[2]
  }
  $('body').css('background', 'url("http://maps.google.com/maps/api/staticmap?size=320x480' + this.markers + '&sensor=false&key=ABQIAAAAzr2EBOXUKnm_jVnk0OJI7xSsTL4WIgxhMZ0ZK_kHjwHeQuOD4xQJpBVbSrqNn69S6DOTv203MQ5ufA")')
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

StopsByNameAssistant.prototype.animateMenuPanel = function(panel, reverse, callback){
  Mojo.Animation.animateStyle(panel, 'top', 'bezier', {
    from: this.menuPanelHiddenTop,
    to: this.menuPanelVisibleTop,
    duration: 0.12,
    curve: 'over-easy',
    reverse: reverse,
    onComplete: callback
  })
}

StopsByNameAssistant.prototype.menuPanelOn = function(){
  var animateMenuCallback;
  var that = this;
  that.panelOpen = true;
  this.scrim.style.opacity = 0;
  this.scrim.show();
  this.enableSceneScroller();
  animateMenuCallback = function(){
    that.menupanel.show();
    that.animateMenuPanel(that.menupanel, false, Mojo.doNothing);
  };
  Mojo.Animation.Scrim.animate(this.scrim, 0, 1, animateMenuCallback);
}

StopsByNameAssistant.prototype.menuPanelOff = function(){
  var animateMenuCallback;
  var that = this;
  that.panelOpen = false;
  this.disableSceneScroller();
  animateMenuCallback = function(){
    that.menupanel.hide();
    Mojo.Animation.Scrim.animate(that.scrim, 1, 0, that.scrim.hide.bind(that.scrim));
  };
  this.animateMenuPanel(this.menupanel, true, animateMenuCallback);
}

StopsByNameAssistant.prototype.toggleMenuPanel = function(e){
  if(this.panelOpen){
    this.menuPanelOff();
  }else{
    this.menuPanelOn();
  }
}

/*
 * Disable the scene scroller to prevent the web view from scrolling underneath whatever is being displayed on top of it
 */
StopsByNameAssistant.prototype.disableSceneScroller = function() {
  this.controller.listen(this.controller.sceneElement, Mojo.Event.dragStart, this._dragHandler);
}

/** @private */
StopsByNameAssistant.prototype._dragHandler = function(event) {
  // prevents the scene from scrolling.
  event.stop();
}

/*
 * Enable the scene scroller (everything back to normal)
 */
StopsByNameAssistant.prototype.enableSceneScroller = function() {
  this.controller.stopListening(this.controller.sceneElement, Mojo.Event.dragStart, this._dragHandler);
}

StopsByNameAssistant.prototype.handleCommand = function(event) {

  if(event.type == Mojo.Event.command) {
    switch(event.command) {
      case 'map':
        $('body').css('background', 'url("http://maps.google.com/maps/api/staticmap?size=320x480' + this.markers + '&sensor=false&mobile=true&key=ABQIAAAAzr2EBOXUKnm_jVnk0OJI7xSsTL4WIgxhMZ0ZK_kHjwHeQuOD4xQJpBVbSrqNn69S6DOTv203MQ5ufA")')
        break
      case 'sat':
        $('body').css('background', 'url("http://maps.google.com/maps/api/staticmap?size=320x480' + this.markers + '&sensor=false&key=ABQIAAAAzr2EBOXUKnm_jVnk0OJI7xSsTL4WIgxhMZ0ZK_kHjwHeQuOD4xQJpBVbSrqNn69S6DOTv203MQ5ufA&maptype=hybrid")') 
        break
    }
  }
}
