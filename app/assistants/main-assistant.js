function MainAssistant() {
}

MainAssistant.prototype.setup = function() {

  if(this.controller.stageController.setWindowOrientation)
    this.controller.stageController.setWindowOrientation("free")
  
	this.controller.setupWidget(Mojo.Menu.appMenu, appMenuAttr, appMenuModel);
	this.controller.setupWidget('luncher', {}, {buttonLabel: 'Monitoruj', buttonClass: 'affirmative'});		
	this.controller.setupWidget('stats', {}, {buttonLabel: 'Moje statystyki'});
	
	Mojo.Event.listen(this.controller.get("luncher"), Mojo.Event.tap, this.handleRenderBlip.bind(this));
	Mojo.Event.listen(this.controller.get("stats"), Mojo.Event.tap, this.handleRenderStats.bind(this));
}

MainAssistant.prototype.handleRenderBlip = function(){
	this.controller.stageController.pushScene("blip")	
}

MainAssistant.prototype.handleRenderStats = function(event){
 	this.controller.serviceRequest("palm://com.palm.applicationManager", {
		method: "open",
		parameters: {
			id: 'com.palm.app.browser',
			params: {
				scene: 'page',
				target: 'http://wasiutynski.net'
				//target: 'http://stats.tram2000.pl'
			}
		}
	});
};

MainAssistant.prototype.activate = function(event) {
}

MainAssistant.prototype.deactivate = function(event) {
}

MainAssistant.prototype.cleanup = function(event) {
}
