function StageAssistant() {
}

StageAssistant.prototype.setup = function() {

	appMenuAttr = {
        omitDefaultItems: true
    };

	appMenuModel = {
	  	items: [
	    	{label: "Informacje", command: 'do-about'},
	    	{label: "Opcje", command: 'do-pref'},	  	
	  		{label: "Baza danych", items:[
	  			{label: "Przystanki", command: 'do-stops'},
	  			{label: "Wiadomości", command: 'do-stops'}
	  		]},	    	
	    	{label: "Pomoc", command: 'do-help'}	    	
	  	]
	};

	this.db = openDatabase("tram2000", 1, "Tram2000", 250000);
	this.controller.pushScene("main");	

}

StageAssistant.prototype.handleCommand = function(event) {
	// this.controller = Mojo.Controller.stageController.activeScene();
	
	if(event.type == Mojo.Event.command) {

  		switch(event.command) {
    		case 'do-about':
      			Mojo.Controller.stageController.activeScene().showAlertDialog({
            		onChoose: function(value) {},
            		title: $L("Tram2000 v1.0"),
            		message: $L("Copyright 2009, Stanisław Wasiutyński"),
            		choices:[
              			{label:$L("OK"), value:""}
            		]
      			});
    			break;
    			
			case 'do-pref':
  				this.controller.pushScene("preferences");
				break;

			case 'do-help':
				this.controller.pushScene("help");
				break;
				
			case 'do-stops':
				this.controller.pushScene("stops");
				break;
							
		}
	}
};
