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
        callback()
        return
      }

      if(change.deleted){
        // Destroy document
        console.log(change.seq + ": usuń rekord: " + change.id)
//        console.log("class =" + change.id.getClassName())
        db.transaction(    
    		  function (transaction) {  
      	   	transaction.executeSql("DELETE FROM stops WHERE id = ?", [parseInt(change.id)],
              function(event){
                console.log("delete sukces")
                applay_changes(results, change.seq)
              },
              this.handleSqlError.bind(this)
            )
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
            db.transaction(function(transaction){
//              console.log("rozpoczynam transakcję")  
        	   	transaction.executeSql("SELECT id FROM stops WHERE id = ? LIMIT 1", [doc.id],
                function(event, result){
//                  console.log("select success")
                  if(result.rows.length == 1) {
                    db.transaction(
                      function(transaction) {
                        transaction.executeSql("UPDATE stops SET name = ?, geo = ? WHERE id = ?", [doc.name, doc.geohash, doc.id],
                          function(event){
                            console.log("update sukces")
                            applay_changes(results, change.seq)
                          },
                          this.handleSqlError.bind(this)
//                          function(t, err){
//                            console.log("UPDATE porażka")

//                          }
                        )
                      }.bind(this)
                    )
                  } else {
                    db.transaction(
                      function(transaction) {
                        transaction.executeSql("INSERT INTO stops (id, name, geo) VALUES (?, ?, ?)", [doc.id, doc.name, doc.geohash],
                          function(event){
                            console.log("insert sukces")
                            applay_changes(results, change.seq)
                          },
                          this.handleSqlError.bind(this)
                        )
                      }.bind(this)
                    )
                  }
                },
                this.handleSqlError.bind(this)
              )
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
        console.log("Nie mogę połączyć się ze zdalną bazą danych.")
      }
    })      
  }

  // POST an array of documents to CouchDB
  this.push = function(){

  }

  this.handleSqlError = function(transaction, error){
    Mojo.Controller.getAppController().showBanner("Wystąpił błąd przy aktualizacji")
    console.log("An SQL Error occured: " + err.message)
  }
}
