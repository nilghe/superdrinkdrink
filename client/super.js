/* Players = new Meteor.Collection("globalPlayers"); */

if (Meteor.isClient) {

  /* *******************
   * Session Setup
   * *******************/
  Session.set("page", 'main'); //Default page
  Session.set("teams", null); //Teams Object
  Session.set("players", []); //Player Object
  
  Session.set("game_name", null); //Name of the game the user set
  Session.set("team_size", null); //Team sizes

  /* *******************
   * Objects
   * Unable to have them in seperate files otherwise they go out of scope
   * http://stackoverflow.com/questions/16469062/meteor-js-serve-javascript-files-without-function-callthis
   * ********************/

  /* Player 
   * playerName - Name of the player
   * numDrinks - Number of drinks for the player */
  function playerObj(playerName, numDrinks){
    this.playerName = playerName;
    this.numDrinks = numDrinks;
  }

  /* *******************
   * Reactive and Page Events Bindings 
   * *******************/

  /* Determine which 'page' to display to the user */
  Template.body.page_is = function(data, options) {
    
    /* Using example from 
     * https://github.com/sqow/multiple-view-example */
    if (Session.equals("page", data)) {
      return options.fn(this);
    }
    return options.inverse(this);
  }

  Template.create.events({
    'click .game-button' : function () {
      var game = $('#game-name').val();
      var players = $('#num-players').val();
      Session.set("game_name", game);
      Session.set("team_size", players);
      //Session.set("game_selected", true);
      //Players.insert({game_name_log: game, num_of_players: players});
    },

    'click #add-player' : function () {
      var singlePlayer = new playerObj($('#player').val(), 0);
      var currentPlayers = Session.get("players");
      currentPlayers.push(singlePlayer);
      Session.set("players", currentPlayers);
    }
  });

  Template.create.player = function() {
    return Session.get("players");
  }

  Template.teams.game_name = function() {
    return Session.get("game_name");
  }  

  Template.teams.team_size = function() {
    return Session.get("team_size");
  }

  /* Gaming Log - NOT USED */
  /* Template.game.playerlog = function(){
    return Players.find();
  } */

  /* Total number of players globally */
  /* Template.game.global_total = function(){
    var players = Players.find();

    var count = 0;
    players.forEach(function (x) {
      count += parseInt(x.num_of_players, 10);
    });
    return count;
  } */
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
