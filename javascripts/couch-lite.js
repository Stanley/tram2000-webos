// OBJECT

CouchDB.failureHandler = function(XMLHttpRequest, textStatus, errorThrown){
  console.log(Object.toJSON(XMLHttpRequest))
  Mojo.Controller.getAppController().showBanner("Wystąpił błąd przy połączeniu ze zdalną bazą danych.", {source: 'notification'})
}

// CLASS

function CouchDB(db, name, user, password) {
  this.db = db
  this.name = name
  this.user = user

  if(user === undefined)
    this.server = "http://db.wasiutynski.net/"
  else if(password === undefined)
    this.server = "http://"+ user +"@db.wasiutynski.net/"
  else
    this.server = "http://"+ user +":"+ password +"@db.wasiutynski.net/"

  this.uri = this.server + this.name
  // this.modelAssistant = modelAssistant
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
CouchDB.prototype.pull = function(rev, callback, assistant){

  var db = this.db
  var uri = this.uri

  // Save results in local db and update cookie with update date
  this.bulkSave = function(results){

    var count = this.count
//    var modelAssistant = this.modelAssistant
    var cookie = new Mojo.Model.Cookie('stops')

    db.transaction(
      function(transaction){
        results.forEach(function(row){
          var updated_at = row.key
          var doc = row.doc
          // Calcutate geohash and replace latitude & longitude with it
          doc.geo = encodeGeoHash(doc.lat, doc.lng)
          // Notice: We don't need UPDATE query because of conflict resolution defined when created database
          console.log(Object.toJSON([doc._id, doc.name, doc.location, doc.buses, doc.trams, doc.next.join(","), doc.geo]))
          transaction.executeSql("INSERT INTO stops (id, name, loc, bus, tram, next, geo) VALUES (?, ?, ?, ?, ?, ?, ?)", [doc._id, doc.name, doc.location, doc.buses, doc.trams, doc.next.join(","), doc.geo],
            function(){
              // console.log("insert or update sukces")
              cookie.put(row.seq) // the newest record in db
              assistant.updateProgress(1.0 / count)
            },
            Sqlite.failureHandler
          )
        })
      },
      function(){ console.log("failure") },
      function(){
        assistant.drawer.mojo.setOpenState(false) // Hide progress bar
        assistant.updateProgress(-1)

        Mojo.Controller.getAppController().showBanner('Bieżąca wersja bazy danych: ' + cookie.get() , {source: 'notification'})
        callback()
      }
    )
  }

  // TODO: delete old records

  $.ajax({
    url     : uri + "/_changes?filter=Stop/all&include_docs=true&since=" + rev,
    type    : "GET",
    dataType: "jsonp",
    success : function(json){
      console.log(uri + "/_changes?filter=Stop/all&include_docs=true&since=" + rev)
      // TODO: DB Error handling
      Mojo.Controller.getAppController().showBanner("Proszę czekać, trwa aktualizacja bazy.", {source: 'notification'})
      this.count = json.results.length
      console.log(this.count)
      this.bulkSave(json.results)
    }.bind(this),
    error   : CouchDB.failureHandler.bind(this)
  })
}

// Push one document to CouchDB
CouchDB.prototype.push = function(assistant){

  var uri = this.uri
  var user = this.user

  this.db.transaction(
    function (transaction) {

      var sql = "SELECT * FROM blips"
      transaction.executeSql(sql, [],
        function(transaction, result){

          var count = result.rows.length
          for(var i=0; i < count ; i++) {
            var doc = result.rows.item(i)
            push(doc, function(){
              assistant.updateProgress(1.0/count)
              this.refreshList()
            }.bind(this))
          }

          assistant.drawer.mojo.setOpenState(false) // Hide progress bar
          if(count > 0) assistant.updateProgress(-1)

        },
        Sqlite.failureHandler.bind(this)
      )
    }.bind(this)
  )


  function push(doc, callback){
    try{
      doc.owner = user
    console.log("Push: " + Object.toJSON(doc) + " to: " +  uri)
    $.ajax({
      url     : uri,
      type    : "POST",
      data    : Object.toJSON(doc),
      dataType: "json",
      success : callback,
      error   : CouchDB.failureHandler.bind(this)
    })
    }catch(e){console.log(e)}
  }
}

// This prototype should not exist
CouchDB.prototype.handleSqlError = function(transaction, error){
  console.log("An SQL Error occured: " + err.message)
  Mojo.Controller.getAppController().showBanner("Wystąpił błąd połączenia ze zdalną bazą danych.")
}

CouchDB.prototype.authenticate = function(login, password){
  
}
