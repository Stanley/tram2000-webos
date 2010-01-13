// OBJECT

CouchDB.failureHandler = function(XMLHttpRequest, textStatus, errorThrown){
  console.log(Object.toJSON(XMLHttpRequest))
  Mojo.Controller.getAppController().showBanner("Wystąpił błąd przy połączeniu ze zdalną bazą danych.", {source: 'notification'})
}

// CLASS

function CouchDB(db, name, modelAssistant) {

  this.db = db
  this.name = name
  this.server = "http://db.wasiutynski.net/"
  this.uri = this.server + this.name
  this.modelAssistant = modelAssistant

}

// GET a document from CouchDB, by id. Returns an Object.
CouchDB.prototype.get = function(id){


  $.ajax({
    url     :  uri +"/"+ id,
    type    : "GET",
    dataType: "jsonp",
    success : function(doc){ console.log("couch get success") },
    error   : CouchDB.failureHandler.bind(this)
  })  
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
      this.modelAssistant.updateProgress(1.0 / this.new_count)
    }
    if(!change){ // End of update process
      this.modelAssistant.drawer.mojo.setOpenState(false)
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

                if(doc['next'])
                  nx = doc['next'].join(",")
                else
                  nx = null

                if(result.rows.length == 1){
                  db.transaction(
                    function(transaction){
                      transaction.executeSql("UPDATE stops SET name = ?, geo = ?, nx = ? WHERE id = ?", [doc.name, doc.geohash, nx, doc.id],
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
                      transaction.executeSql("INSERT INTO stops (id, name, geo, nx) VALUES (?, ?, ?, ?)", [doc.id, doc.name, doc.geohash, nx],
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
    url     : uri + "/_changes?since=" + rev,
    type    : "GET",
    dataType: "jsonp",
    success : function(json){
      console.log(uri + "/_changes?since=" + rev)
      // TODO: DB Error handling
      Mojo.Controller.getAppController().showBanner("Proszę czekać, trwa aktualizacja bazy.", {source: 'notification'})
      this.new_count = json.results.length
      this.applay_changes(json.results, rev)
    }.bind(this),
    error   : CouchDB.failureHandler.bind(this)
  })
}

// Push one document to CouchDB
CouchDB.prototype.push = function(doc, callback){

//  console.log("pushing to: " +  this.uri +"/"+ doc.time)
  try{

//  var id = doc.id
//    var doc2 = JSON.parse(Object.toJSON(doc))
//  doc2.unset("data")
//    console.log(Object.toJSON(doc))

  $.ajax({
    url     : this.uri,
    type    : "POST",
    data    : Object.toJSON(doc),
    dataType: "json",
    success : callback,
    error   : CouchDB.failureHandler.bind(this)
  })
  } catch(e) {console.log(e)}
}

// This prototype should not exist
CouchDB.prototype.handleSqlError = function(transaction, error){
  console.log("An SQL Error occured: " + err.message)
  Mojo.Controller.getAppController().showBanner("Wystąpił błąd połączenia ze zdalną bazą danych.")
}

