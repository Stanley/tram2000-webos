function Sqlite(name) {
  this.db = openDatabase(name, 1, name, 250000)
}

//Sqlite.inherits()

// Handle errors or other failure modes
Sqlite.prototype.failureHandler = function(transaction, error) {
  console.log('An SQL error occurred: '+ error.message)
//  console.log(Object.toJSON(transaction))
}
