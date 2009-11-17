function StopsAssistant() {
}

StopsAssistant.prototype.setup = function() {

  this.db = openDatabase("tram2000", 1, "Tram2000", 250000);	

  var attributes = {
        itemTemplate: 'stops/list-item',
        swipeToDelete: false,
        reorderable: false,
        filterFunction: this.list.bind(this),
//        formatters: {
//            name: this.formatName.bind(this),
 //           number: this.formatNumber.bind(this)
  //      },
        delay: 100, // 1 second delay before filter string is used
        emptyTemplate: 'stops/list-empty',
        disabledProperty: 'disabled'
  };

  this.model = {
    disabled: false
  };

  this.controller.setupWidget('stops', attributes, this.model);	
}

StopsAssistant.prototype.list = function(filterString, listWidget, offset, count){

  var sql = "SELECT * FROM 'stops' WHERE name LIKE ? OR name LIKE ? GROUP BY name ORDER BY name";  // check sqlite data types for other values

  this.filterString = filterString
  this.listWidget = listWidget
  this.offset = offset
  this.count = count

  this.db.transaction(    
    function (transaction) { 
     // transaction.executeSql("INSERT INTO 'stops' (name) VALUES ('nazwa')", [], this.dbSuccessHandler.bind(this), this.dbFailureHandler.bind(this)); 

      transaction.executeSql(sql, [filterString + "%", "% " + filterString + "%"], this.dbSuccessSelectHandler.bind(this), this.dbFailureHandler.bind(this)); 
  }.bind(this)); //this is important!

	appMenuModel = {
	  	items: [
	    	{label: "Informacje", command: 'do-about'},
	    	{label: "Opcje", command: 'do-pref'},	  	
	  		{label: "Działania", items:[
	  			{label: "Aktualizuj", command: 'do-stops-sync'},
	  			{label: "Wyczyść", command: 'do-stops-remove'}
	  		]},	    	
	    	{label: "Pomoc", command: 'do-help'}	    	
	  	]
	};
  this.controller.setupWidget(Mojo.Menu.appMenu, appMenuAttr, appMenuModel);
}


StopsAssistant.prototype.dbSuccessSelectHandler = function(transaction, result) {
 // Handle successful queries including receiving results
  console.log("Sql success select:")

  var data = []
  var totalSubsetSize = 0;

  for(var i=0; i < result.rows.length; i++) {
    var row = result.rows.item(i)
    data.push({name: row.name});
    totalSubsetSize++;
  }

  var subset = [];

    //update the items in the list with the subset
    this.listWidget.mojo.noticeUpdatedItems(this.offset, data);

    //set the list's length & count if we're not repeating
    // the same filter string from an earlier pass
    if (this.filter !== this.filterString) {
        this.listWidget.mojo.setLength(totalSubsetSize);
        this.listWidget.mojo.setCount(totalSubsetSize);
    }
    this.filter = this.filterString;
}

StopsAssistant.prototype.dbSuccessHandler = function(transaction, result) {
 // Handle successful queries including receiving results
 console.log("Sql success:")

//  for (var i = 0; i < result.rows.length; ++i) {
//    var row = result.rows.item(i);
//    console.log(row.name)
//  }
//SQLResultSet.rows.item(0).name
};


StopsAssistant.prototype.dbFailureHandler = function(transaction, error) {
 console.log('An error occurred')
  console.log(error.message)
};

StopsAssistant.prototype.handleCommand = function(event) {
  if(event.type == Mojo.Event.command) {
    switch(event.command) {
      case 'do-stops-sync':				 
		
	      var url = "http://192.168.1.100:3000/apps/2bb26ebefa62cc85108d01ac96bdd262/sources/Stops.json?callback=?"

        $.getJSON(url,
          function(data){
            this.db.transaction(
              function (transaction) {
			          $.each(data, function(i, stop) {
                  transaction.executeSql("INSERT INTO 'stops' (name, lat, lng) VALUES (?, ?, ?)", [stop.name, stop.lat, stop.lng]); 
                  // , function(transaction, results) { console.log("Successfully inserted row"); }, function(transaction, results) {}
                  console.log(stop.name + ", " + stop.lat + ", " + stop.lng );
                })
              }
			      )            
          }.bind(this)
	      )
								
				break;
				
			case 'do-stops-remove':
				Mojo.Controller.stageController.activeScene().showAlertDialog({
          onChoose: function(value) {
            if(value == 'yes'){
              this.db.transaction(    
      				  function (transaction) {  
        		    	transaction.executeSql("DELETE FROM stops", [], function(event){}, function(){event}); 
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
      	});
				break;
    }
  }
}

StopsAssistant.prototype.gotResults = function(t) {
  Mojo.Log.info ("gotResults:", Object.toJSON(t));

//	var r = transport.responseJSON;
}

StopsAssistant.prototype.failure = function(transport) {
	console.log ("failure");
	var t = new Template($L("Error: Status #{status} returned from AJAX Google search."));
	var m = t.evaluate(transport);
	
	/*
	 * Show an alert with the error.
	 */
	this.controller.showAlertDialog({
	    onChoose: function(value) {},
		title: $L("Error"),
		message: m,
		choices:[
			{label: $L('OK'), value:'ok', type:'color'}    
		]
	});	  
}

StopsAssistant.prototype.activate = function(event) {
}


StopsAssistant.prototype.deactivate = function(event) {
}

StopsAssistant.prototype.cleanup = function(event) {
}
