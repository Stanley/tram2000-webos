function PreferencesAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

PreferencesAssistant.prototype.setup = function() {

  // Loading configuration cookies
  var user_cookie = new Mojo.Model.Cookie('user').get()
  var sync_cookie = new Mojo.Model.Cookie('sync').get()

  // Setup default values
  if(!sync_cookie)
    sync_cookie = {send: 'true', recieve: 'false'}

  var anonymous = true
  if(!user_cookie)
    this.user_model = {username: '', password: ''}
  else {
    if(user_cookie.username && user_cookie.username != '')
      anonymous = false
    this.user_model = user_cookie
  }

  // Setup ToggleButton which shows or hides drawer
	this.controller.setupWidget('anonim', {trueLabel: 'tak', falseLabel: 'nie'}, {value: anonymous})

	this.toggleDrawer = this.toggleDrawer.bindAsEventListener(this)
	Mojo.Event.listen(this.controller.get('anonim'), Mojo.Event.propertyChange, this.toggleDrawer)

  // Setup drawer with login & password fields
	this.controller.setupWidget('login', {hintText: 'Użytkownik', modelProperty: 'username'}, this.user_model)
	this.controller.setupWidget('password', {hintText: 'Hasło', modelProperty: 'password'}, this.user_model)

	this.controller.setupWidget('login_and_password-drawer', {unstyled: true}, {open: !anonymous})
	this.drawer = this.controller.get('login_and_password-drawer')
		
	// Setup the choice arrays,
	// options for list selector choices:
  this.selector_opts = [                  
	  {label: 'Automatycznie',  value: 'true'},
	  {label: 'Ręcznie',        value: 'false'}
  ]

  this.servers = [
    {label: 'Kraków',  value: 'http://db.wasiutynski.net'},
  ]

  this.controller.setupWidget('server_selector', {label: 'Baza danych', choices: this.servers, modelProperty:'server', labelPlacement: Mojo.Widget.labelPlacementLeft}, sync_cookie)
	this.controller.setupWidget('recieving_selector', {label: 'Odbieranie', choices: this.selector_opts, modelProperty:'recieve', labelPlacement: Mojo.Widget.labelPlacementLeft}, sync_cookie)
  this.controller.setupWidget('sending_selector', {label: 'Wysyłanie', choices: this.selector_opts, modelProperty:'send', labelPlacement: Mojo.Widget.labelPlacementLeft}, sync_cookie)

  // Remember chenges
	this.handleTextFieldUpdate = this.handleTextFieldUpdate.bindAsEventListener(this)
  Mojo.Event.listen(this.controller.get('login'), Mojo.Event.propertyChange, this.handleTextFieldUpdate)
  Mojo.Event.listen(this.controller.get('password'), Mojo.Event.propertyChange, this.handleTextFieldUpdate)

	this.handleListSelectorUpdate = this.handleListSelectorUpdate.bindAsEventListener(this)
  Mojo.Event.listen(this.controller.get('recieving_selector'), Mojo.Event.propertyChange, this.handleListSelectorUpdate)
  Mojo.Event.listen(this.controller.get('sending_selector'), Mojo.Event.propertyChange, this.handleListSelectorUpdate)
}

// This function is called every time ToggleButton "anonim" changes it's state
PreferencesAssistant.prototype.toggleDrawer = function(e){		
  new Mojo.Model.Cookie('user').remove()
  this.drawer.mojo.setOpenState(!this.drawer.mojo.getOpenState())
}

// This function is called every time one of the ListSelectors changes it's value
PreferencesAssistant.prototype.handleListSelectorUpdate = function(event){
  var cookie = new Mojo.Model.Cookie('sync')
  cookie.put(event.model)
  // console.log(Object.toJSON(cookie.get()))
}

// This function is called every time login or password TextField changes it's value
PreferencesAssistant.prototype.handleTextFieldUpdate = function(event){
  var cookie = new Mojo.Model.Cookie('user')
  cookie.put({
    username: this.user_model['username'],
    password: this.user_model['password']
  })
  // console.log(Object.toJSON(cookie.get()))
}

PreferencesAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


PreferencesAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

PreferencesAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */

  // Calling TextFieldUpdate in case when cookie was destroyed by toggleDrawer
//  if(this.controller.get('anonim').value) Mojo.Event.send(this.controller.get('login'), Mojo.Event.propertyChange)

  Mojo.Event.stopListening(this.controller.get('anonim'), Mojo.Event.propertyChange, this.toggleDrawer)
  Mojo.Event.stopListening(this.controller.get('login'), Mojo.Event.propertyChange, this.handleTextFieldUpdate)
  Mojo.Event.stopListening(this.controller.get('password'), Mojo.Event.propertyChange, this.handleTextFieldUpdate)
  Mojo.Event.stopListening(this.controller.get('recieving_selector'), Mojo.Event.propertyChange, this.handleListSelectorUpdate)
  Mojo.Event.stopListening(this.controller.get('sending_selector'), Mojo.Event.propertyChange, this.handleListSelectorUpdate)
}
