/* Players = new Meteor.Collection("globalPlayers"); */

if (Meteor.isClient) {

  /* *******************
   * Session Setup
   * *******************/
  Meteor.startup(function () {
    Session.setDefault("page", 'main'); //Default page
    Session.setDefault("teams", []); //Teams Object Array
    Session.setDefault("players", []); //Player Object Array
    
    Session.set("game_name", null); //Name of the game the user set
    Session.set("team_size", null); //Team sizes
    Session.set("total_drinks", 0);
    Session.set("player_id", 0); //ID of each individual player. Increments by 1
  });

  /* *******************
   * Objects
   * Unable to have them in seperate files otherwise they go out of scope
   * http://stackoverflow.com/questions/16469062/meteor-js-serve-javascript-files-without-function-callthis
   * ********************/

  /* Player 
   * playerName - Name of the player
   * numDrinks - Number of drinks for the player 
   * standing - Where the player finished/placed 
   * standingText - The text for their placement 
   * cssClass - CSS Classes that are added to the user */
  function playerObj(id, playerName, numDrinks, standing, standingText, cssClass){
    this.id = id;
    this.playerName = playerName;
    this.numDrinks = numDrinks;
    this.standing = standing;
    this.standingText = standingText;
    this.cssClass = cssClass;
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

  // Create Game
  Template.create.events({
    'click .create-game' : function () {
      var game = $('#game-name').val();
      var players = $('#num-players').val();
      Session.set("game_name", game);
      Session.set("team_size", players);
      //Session.set("game_selected", true);
      //Players.insert({game_name_log: game, num_of_players: players});
    },

    'click #add-player' : function () {
      var playerId = Session.get("player_id");
      var singlePlayer = new playerObj(playerId, $('#player').val(), 0, 0, "", "");
      var currentPlayers = Session.get("players");
      currentPlayers.push(singlePlayer);
      Session.set("players", currentPlayers);
      Session.set("player_id", playerId + 1);
    }
  });

  Template.create.player = function() {
    return Session.get("players");
  }


  // Teams
  Template.teams.game_name = function() {
    return Session.get("game_name");
  }  

  Template.teams.team_size = function() {
    return Session.get("team_size");
  }

  Template.teams.team = function() {
    return Session.get("teams");
  }

  // Results
  Template.results.events({
    'click .play-again' : function() { //Reset the drink count for the players but keep teams
      var teams = Session.get("teams");

      $.each(teams, function(i, team) {
          team.currentStanding = 1; 
            $.each(team.teamMembers, function(j, player) {
              player.numDrinks = 0;
              player.standing = 0;
              player.standingText = "";
              player.cssClass = "";
        });
      });

      Session.set("teams", teams);
      Session.set("total_drinks", 0);
    },

    'click .new-game' : function() { // Reset the game completely
      Session.set("teams", []);
      Session.set("players", []);
    }
  });

  Template.results.total_drinks = function() {
    return Session.get("total_drinks");
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
