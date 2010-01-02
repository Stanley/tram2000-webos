function CouchDB(db, name) {

  this.db = db
  this.name = name
  this.server = "http://db.wasiutynski.net/"
  this.uri = this.server + this.name

}

// GET a document from CouchDB, by id. Returns an Object.
CouchDB.prototype.get = function(){

}

// GET changes between local and remote databases
// and GET each document
// and save them in local db
CouchDB.prototype.pull = function(rev, callback){

  var db = this.db
  var uri = this.uri

  this.applay_changes = function(results, seq){
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
              this.applay_changes(results, change.seq)
            }.bind(this),
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
            transaction.executeSql("SELECT id FROM stops WHERE id = ? LIMIT 1", [doc.id],
              function(event, result){
                console.log("select success")
                if(result.rows.length == 1){
                  db.transaction(
                    function(transaction){
                      transaction.executeSql("UPDATE stops SET name = ?, geo = ? WHERE id = ?", [doc.name, doc.geohash, doc.id],
                        function(event){
                          console.log("update sukces")
                          this.applay_changes(results, change.seq)
                        }.bind(this),
                        this.handleSqlError.bind(this)
                      )
                    }.bind(this)
                  )
                } else {
                  db.transaction(
                    function(transaction){
                      transaction.executeSql("INSERT INTO stops (id, name, geo) VALUES (?, ?, ?)", [doc.id, doc.name, doc.geohash],
                        function(event){
                          console.log("insert sukces")
                          this.applay_changes(results, change.seq)
                        }.bind(this),
                        this.handleSqlError.bind(this)
                      )
                    }.bind(this)
                  )
                }
              }.bind(this),
              this.handleSqlError.bind(this)
            )
          }.bind(this))
        }.bind(this)
      })
    }
  }

  $.ajax({
    url:  uri + "/_changes?since=" + rev,
    type: "GET",
    dataType: "jsonp",
    success: function(json){
      console.log(uri + "/_changes?since=" + rev)
      // TODO: DB Error handling
      Mojo.Controller.getAppController().showBanner("Proszę czekać, trwa aktualizacja bazy.", {source: 'notification'})
      this.applay_changes(json.results, rev)
    }.bind(this),
    error: function(){
      console.log("Nie mogę połączyć się ze zdalną bazą danych.")
    }
  })
}

// POST an array of documents to CouchDB
CouchDB.prototype.push = function(){
}

CouchDB.prototype.handleSqlError = function(transaction, error){
  console.log("An SQL Error occured: " + err.message)
  Mojo.Controller.getAppController().showBanner("Wystąpił błąd przy aktualizacji")
}

