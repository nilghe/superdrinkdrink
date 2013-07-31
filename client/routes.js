/* Routing 
 */

/* if (Meteor.isClient) {
  
  Setup Routers with Backbone 
  var Router = Backbone.Router.extend({
    routes: {
      "create": 			"create", // http://super.nilghe.com/create
      "games":  			"games",  // http://super.nilghe.com/games
      "games/:id": 			"games" //http://super.nilghe.com/games/id
    },

    create: function() {
      alert('Create a game');
    },

    games: function(id) {

    	if (typeof id === "undefined") {
    		alert('Here are your games!');
    	}
    	else {
			alert('Your game ID is ' + id);
    	}
    }
  });
  
  var app = new Router;
  Backbone.history.start({ pushState: true });
 
 } */