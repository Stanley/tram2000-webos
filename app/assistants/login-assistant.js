function LoginAssistant(sceneAssistant, callback) {
	this.callback = callback
	this.sceneAssistant = sceneAssistant
	this.controller = sceneAssistant.controller
}

LoginAssistant.prototype.setup = function(widget) {
	this.widget = widget
	/* this function is for setup tasks that have to happen when the scene is first created */		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */	
	/* setup widgets here */	
	/* add event handlers to listen to events from widgets */

	this.controller.setupWidget('password', {hintText: 'Wprowadź hasło', modelProperty: 'password'})  

	Mojo.Event.listen(this.controller.get('login'), Mojo.Event.tap, this.proceed.bind(this))

}

LoginAssistant.prototype.proceed = function(event){
	/* put in event handlers here that should only be in effect when this scene is active. For
	 example, key handlers that are observing the document */

	this.callback()
	this.widget.mojo.close()
}

LoginAssistant.prototype.cancel = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	  
  this.widget.mojo.close()
}

LoginAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}

LoginAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

LoginAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	Mojo.Event.stopListening(this.controller.get('login'), Mojo.Event.tap, this.proceed)
}