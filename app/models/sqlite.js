function Sqlite(name) {
  this.db = openDatabase(name, 1, name, 250000)
}

// Handle errors
Sqlite.failureHandler = function(transaction, error) {
  console.log('An SQL error occurred: '+ error.message)
//  console.log(Object.toJSON(transaction))
}
