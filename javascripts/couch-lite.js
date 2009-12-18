function CouchDB(db, name) {

  this.db = db
  this.name = name
  var server = "http://db.wasiutynski.net/"
  var uri = server + this.name

  // GET a document from CouchDB, by id. Returns an Object.
  this.get = function(){
  }

  // GET changes between local and remote databases
  // and GET each document
  // and save them in local db
  this.pull = function(rev, callback){

    var db = this.db

    function applay_changes(results, seq){
      var change = results.shift()
//      Mojo.Controller.getAppController().showBanner("Zostało: " + results.length, {source: 'notification'})
      if(seq){ // Last db sequence which was successfully applied
        var cookie = new Mojo.Model.Cookie('stops')
        cookie.put(seq)
      }
      if(!change){ // End of update process
        Mojo.Controller.getAppController().showBanner('Bieżąca wersja bazy danych: ' + seq, {source: 'notification'})
        return
      }

      if(change.deleted){
        // Destroy document
        console.log(change.seq + ": usuń rekord: " + change.id)

        db.transaction(    
    		  function (transaction) {  
      	   	transaction.executeSql("DELETE FROM stops WHERE 'id' = ?", [change.id], function(event){
              console.log("delete sukces")
              applay_changes(results, change.seq)
            }, function(event){console.log("DELETE porażka")})
  			  }.bind(this)
        )

        
      } else {
        // Download and save new document
        $.ajax({
          url:  uri +"/"+ change.id,
          type: "GET",
          dataType: "jsonp",
          success: function(doc){
            console.log(change.seq + ": stwórz lub zmień rekord:" + doc.id)
            db.transaction( function (transaction) {
//              console.log("rozpoczynam transakcję")  
        	   	transaction.executeSql("SELECT id FROM stops WHERE id = ? LIMIT 1", [doc.id], function(event, result){
                if(result.rows.length == 1)
                  db.transaction(
              		  function (transaction) {  
                	   	transaction.executeSql("UPDATE stops SET name = ?, lat = ?, lng = ? WHERE id = ?", [doc.name, doc.lat, doc.lng, doc.id], function(event){
                        console.log("update sukces")
                        applay_changes(results, change.seq)
                      }, function(event){console.log("UPDATE porażka")})
            			  }.bind(this)
                  )
                else
                  db.transaction(    
              		  function (transaction) {  
                	   	transaction.executeSql("INSERT INTO stops (id, name, lat, lng) VALUES (?, ?, ?, ?)", [doc.id, doc.name, doc.lat, doc.lng], function(event){
                        console.log("insert sukces")
                        setTimeout(applay_changes(results, change.seq), 500)
                      }, function(event){console.log("INSERT porażka")})
            			  }.bind(this)
                  )
              }, function(event){console.log("SELECT porażka")})
			      }.bind(this))
          }
        })
      }
    }

    $.ajax({
      url:  uri + "/_changes?since=" + rev,
      type: "GET",
      dataType: "jsonp",
      success: function(json){
        console.log(uri + "/_changes?since=" + rev)
        Mojo.Controller.getAppController().showBanner("Proszę czekać, trwa aktualizacja bazy.", {source: 'notification'})
        applay_changes(json.results, rev)
      },
      error: function(){
        console.log("error")
      }
   })
      
  }

  // POST an array of documents to CouchDB
  this.push = function(){

  }
}
