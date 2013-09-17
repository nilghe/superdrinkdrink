/* Players = new Meteor.Collection("globalPlayers"); */

if (Meteor.isClient) {

  /* *******************
   * Session Setup
   * *******************/
  Meteor.startup(function () {
    SetSessionVariables();
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
   * placed - CSS Classes that are added to the user */
  function playerObj(id, playerName, numDrinks, standing, standingText, placed){
    this.id = id;
    this.playerName = playerName;
    this.numDrinks = numDrinks;
    this.standing = standing;
    this.standingText = standingText;
    this.placed = placed;
  }

  /* ***********************************
   * Reactive and Page Events Bindings *
   * ***********************************/

  /* Determine which 'page' to display to the user */
  Template.body.page_is = function(data, options) {
    
    /* Using example from 
     * https://github.com/sqow/multiple-view-example */
    if (Session.equals("page", data)) {
      return options.fn(this);
    }
    return options.inverse(this);
  }

  /* ================================================================================
     CREATE GAME HANDLEBARS TEMPLATE 
     ================================================================================*/

  // Create Game
  Template.create.events({
    // When the user changes the number of players on a team aka team size
    'change #num-players' : function () {
      Session.set("team_size", $('#num-players').val());
      CheckIfEnoughPlayers();
    },

    // Set the game name and team size. The game is created in the client.js file due to name spacing.
    'click .create-game' : function () {
      var game = $('#game-name').val();
      var players = $('#num-players').val();
      Session.set("game_name", game);
      Session.set("team_size", players);
    },

    // Add a player to the list of players
    'click #add-player' : function () {
      AddPlayer();
    },

    // Add player to the list of players when the user hits enter instead of the button
    'keypress #player' : function (event) {
      if (event.which === 13) {
        AddPlayer();
      }
    },

    // Remove Player
    'click .remove-player' : function() {
      RemovePlayer(this.id);
      CheckIfEnoughPlayers();
    }
  });

  // List of all the players the user inputted
  Template.create.player = function() {
    return Session.get("players");
  }

  // If there are enough players allow the user to create the game
  Template.create.enough_players = function() {
    return {
      enough_players: Session.get("enough_players"),
      team_size: Session.get("team_size")
    }; 
  }

  /* ================================================================================
     TEAM & GAME HANDLEBARS TEMPLATE 
     ================================================================================*/
  Template.teams.game_name = function() {
    return Session.get("game_name");
  }  

  Template.teams.team_size = function() {
    return Session.get("team_size");
  }

  Template.teams.team = function() {
    return Session.get("teams");
  }

  /* ================================================================================
     BONUS HANDLEBARS TEMPLATE 
     ================================================================================*/
  // preserve the state of the modal to it's not over written
  // http://stackoverflow.com/a/16377525/1052068
  Template.bonus.preserve(['#bonusModal']); 
  
  Template.bonus.bonus_drinks = function() {
    return Session.get("bonus_drinks");
  }

  /* ================================================================================
     RESULTS HANDLEBARS TEMPLATE 
     ================================================================================*/
  Template.results.events({
    // Allow the user to play again with the same teams
    'click .play-again' : function() {
      var teams = Session.get("teams");

      // reset all player stats in the teams
      $.each(teams, function(i, team) {
          team.currentStanding = 1;
          team.disableDrinks = "";
          team.drank = false;
          team.playersPlaced = 0;
          
            $.each(team.teamMembers, function(j, player) {
              player.numDrinks = 0;
              player.standing = 0;
              player.standingText = "";
              player.placed = "";
        });
      });

      // reset all player stats overall
      var players = Session.get("players");

      $.each(players, function(i, player) {
        player.numDrinks = 0;
      });

      Session.set("teams", teams);
      Session.set("players", players);
      Session.set("total_drinks", 0);
    },

    // Start over completely
    'click .new-game' : function() { // Reset the game completely
      SetSessionVariables();
    }
  });

  Template.results.game_stats = function() {
    return {
      total_drinks: Session.get("total_drinks"),
      most_drunk_team: Session.get("mostDrunkTeamName"),
      most_drunk_team_drinks: Session.get("mostdrunkTeamDrinks"),
      player_most_drinks: Session.get("playerMostDrinks"),
      player_total_drinks: Session.get("playerTotalDrinks")
    };
  }
}

  /* ================================================================================
     Helper Functions
     ================================================================================*/
  
  // Setup all the Session variables to be used globally
  function SetSessionVariables() {
    Session.set("page", 'main'); //Default page
    Session.set("teams", []); //Teams Object Array
    Session.set("players", []); //Global Player Object Array
    
    Session.set("game_name", null); //Name of the game the user set
    Session.set("team_size", 2); //Team sizes with a default of 2
    Session.set("total_players", 0);
    Session.set("enough_players", false);
    Session.set("total_drinks", 0);
    Session.set("player_id", 0); //ID of each individual player. Increments by 1
  }

  function CheckIfEnoughPlayers() {

      if (Session.get("total_players") >= Session.get("team_size")) {
        Session.set("enough_players", true);
      }
      else {
        Session.set("enough_players", false);
      }
  }

  // Add players to the current game
  function AddPlayer() {

      // Do not allow empty strings
      if (!($('#player').val())) { return; }

      // create player object
      var playerId = Session.get("player_id");
      var singlePlayer = new playerObj(playerId, $('#player').val(), 0, 0, "", "");
      
      // Add the newest player to the list of players
      var currentPlayers = Session.get("players");
      currentPlayers.push(singlePlayer);
      Session.set("players", currentPlayers);
      
      // increment for the next player ID
      Session.set("player_id", playerId + 1);

      // Keep track of how many players we have by adding 1
      var totalPlayers = Session.get("total_players");
      Session.set("total_players", totalPlayers + 1);

      // Check if there are enough players to create the game
      CheckIfEnoughPlayers();

      $('#player').val('');
  }

  // Remove a player from the list
  function RemovePlayer(id) {

    // using grep will return a new array of objects without the removed player
    // http://api.jquery.com/jQuery.grep/
    var remainingPlayers = $.grep(Session.get("players"), function(e){
      return e.id != id;
    });

    // Keep track of how many players we have by subtracting 1
    var totalPlayers = Session.get("total_players");
    Session.set("total_players", totalPlayers - 1);

    Session.set("players", remainingPlayers); 
  }

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
