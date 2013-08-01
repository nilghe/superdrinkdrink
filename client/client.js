if (Meteor.isClient) {
  Meteor.startup(function () {

	/* *******************
	 * Objects
	 * Unable to have them in seperate files otherwise they go out of scope
	 * http://stackoverflow.com/questions/16469062/meteor-js-serve-javascript-files-without-function-callthis
	 * ********************/

	/* Teams 
	* playerName - Name of the player
	* numDrinks - Number of drinks for the player */
	function teamObj(teamMembers, teamName){
		this.teamMembers = teamMembers;
		this.teamName = teamName;
	}

	/* ================================================================================
	   Dynamic Element Event Binding
	   ================================================================================*/
	
	//Navigation clicks
	$('body').on('click', '.game-button, .back-button', function(){
		Session.set('page', $(this).attr('id'));
	});

	//Create the game
	$('body').on('click', '.create-game', function(){
		CreateGame();
	});

	/* ================================================================================
   	   Game Functions
       ================================================================================*/

	function CreateGame() {
		var players = Session.get("players");
		var teamSize = Session.get("team_size");
		var numOfPlayers = _.size(players);
		var numOfTeams = Math.ceil(numOfPlayers/teamSize);

		players = randomizeArray(players); //randomize players array
		players = EvenOutTeams(numOfPlayers, teamSize, players); //Even out the teams

		//Create the teams
		var allTeams = Session.get("teams");
		for (var i=0; i < numOfTeams; i++) {
			var teamMembers = players.splice(0,teamSize);
			var teamName = i;
			allTeams.push(new teamObj(teamMembers, teamName));
		}

		Session.set("teams", allTeams);
	}

	/* ================================================================================
       Helper Functions
       ================================================================================*/
  	//Uses the fisherYates to randomize the array
	function randomizeArray (myArray) {
	  var i = myArray.length;
	  if ( i == 0 ) return false;
	  while ( --i ) {
	     var j = Math.floor( Math.random() * ( i + 1 ) );
	     var tempi = myArray[i];
	     var tempj = myArray[j];
	     myArray[i] = tempj;
	     myArray[j] = tempi;
	   }
		return myArray;
	}

	/* Pad the players array with extra players if needed
	 * This is to ensure the teams are all even
	 * Some players will be playing twice, thus getting more drunk than others
	 * Fun! */
	function EvenOutTeams(numPlayers, teamSize, playersArray) {
		
		/* If number of players is not divible by team size choose players 
		 * then fill the array with duplicate players until even team sizes */
		var teamEven = (numPlayers%teamSize);
		if (teamEven != 0) {
			var additionalPlayers = [];

			//figure out how many addition players we need
			var playersNeeded = (teamSize - teamEven);

			for (var i=0; i < playersNeeded; i++) {
				additionalPlayers.push(playersArray[i]); //array is already randomized
			}

			playersArray.push.apply(playersArray, additionalPlayers);
			return playersArray;
		}
	}
  });
}