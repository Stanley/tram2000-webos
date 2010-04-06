// OBJECT

CouchDB.failureHandler = function(XMLHttpRequest, textStatus, errorThrown){
  console.log(Object.toJSON(XMLHttpRequest))
  Mojo.Controller.getAppController().showBanner("Wystąpił błąd przy połączeniu ze zdalną bazą danych.", {source: 'notification'})
}

// CLASS

function CouchDB(db, name, modelAssistant) {

  this.db = db
  this.name = name
  this.server = "http://192.168.1.223:5984/"
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

  // Save results in local db and update cookie with update date
  this.bulkSave = function(results){

    var count = this.new_count
    var modelAssistant = this.modelAssistant
    var cookie = new Mojo.Model.Cookie('stops')

    db.transaction(
      function(transaction){
        results.forEach(function(row){
          var updated_at = row.key
          var doc = row.value
          // Calcutate geohash and replace latitude & longitude with it
          var lng = doc.pop()
          var lat = doc.pop()
          doc.push(encodeGeoHash(lat, lng))
          // Force the same id
          doc.unshift(row.id)
          // Notice: We don't need UPDATE query because of conflict resolution defined when created database
          transaction.executeSql("INSERT INTO stops (id, name, loc, type, next, geo) VALUES (?, ?, ?, ?, ?, ?)", doc,
            function(){
              // console.log("insert or update sukces")
              cookie.put(updated_at) // the newest record in db
              modelAssistant.updateProgress(1.0 / count)
            },
            Sqlite.failureHandler
          )
        })
      },
      function(){ console.log("failure") },
      function(){
        modelAssistant.drawer.mojo.setOpenState(false) // Hide progress bar
        Mojo.Controller.getAppController().showBanner('Bieżąca wersja: ' + cookie.get(), {source: 'notification'})
        callback()
      }
    )
  }

  // TODO: delete old records

  $.ajax({
    url     : uri + "/_design/Stop/_view/by_updated_at?startkey=\"" + rev + "\"",
    type    : "GET",
    dataType: "jsonp",
    success : function(json){
      console.log(uri + "/_design/Stop/_view/by_updated_at?startkey=\"" + rev + "\"")
      // TODO: DB Error handling
      Mojo.Controller.getAppController().showBanner("Proszę czekać, trwa aktualizacja bazy.", {source: 'notification'})
      this.new_count = json.rows.length // or total_rows - offset
      this.bulkSave(json.rows)
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

CouchDB.prototype.authenticate = function(login, password){
  
}
