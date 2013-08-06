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
	function teamObj(teamMembers, teamName, currentStanding){
		this.teamMembers = teamMembers;
		this.teamName = teamName;
		this.currentStanding = currentStanding;
	}

	var standings = [
		'1st',
		'2nd',
		'3rd',
		'4th',
		'5th',
		'6th',
		'7th',
		'8th',
		'9th',
		'10th'
	];

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

	//Placing players from first to last. All information is stored in the Teams Object.
	$('body').on('click', '.team-members li', function(){
		
		var teamId = $(this).parents('.team').data('teamid');
		var playerId = $(this).data('playerid');
		
		var teams = Session.get('teams'); //Create copy of current team list
		var currentStanding = teams[teamId].currentStanding;
		var playerStanding = $(this).data('placed');
		

		/* Player standings can be toggled
		 * If they've been placed (have class .placed), remove their placing, reset their placement, 
		 * and update the standing field for the team.
		 * Standings can only be reset in order they were placed in, Last to first. 
		 * This is to prevent a nightmare with keeping track of all the rankings.
		 * 
		 * If they haven't been placed (don't have class .placed) then put them in 
		 * the appropriate standing and update standing team field. */
		if ($(this).hasClass('placed') && playerStanding == (currentStanding - 1)) { //Already placed

			$.each(teams[teamId].teamMembers, function(i, player){
				if (player.id == playerId) {
					player.cssClass = '';
					player.standing = 0;
					player.standingText = "";
					teams[teamId].currentStanding = currentStanding - 1;

					Session.set('teams', teams);
				}
			});
		}
		else if (!($(this).hasClass('placed'))) { //Not yet placed

			$.each(teams[teamId].teamMembers, function(i, player){
				if (player.id == playerId) {
					player.cssClass = 'placed';
					player.standing = currentStanding;
					player.standingText = standings[currentStanding - 1];
					teams[teamId].currentStanding = currentStanding + 1;

					Session.set('teams', teams);
				}
			});


		}

	});

	//Pass out drinks to players in the current game
	$('body').on('click', '.give-drinks', function(){

		var teamId = $(this).data('teamid');
		var teams = Session.get('teams');

		//Hand out drinks
		$.each(teams[teamId].teamMembers, function(i, player) {
			switch(player.standing) {
				case 1:
					player.numDrinks = Math.ceil(Math.random()*5);
					console.log("First Place Drinks");
					break;
				case 2:
					player.numDrinks = Math.ceil(Math.random()*4);
					console.log("Second Place Drinks");
					break;
				case 3:
					player.numDrinks = Math.ceil(Math.random()*3);
					console.log("Third Place Drinks");
					break;
				default:
					player.numDrinks = Math.ceil(Math.random()*2); 
					console.log("Everyone Place Drinks");
			}
		});

		Session.set('teams', teams);

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
			allTeams.push(new teamObj(teamMembers, teamName, 1));
		}

		Session.set("teams", allTeams);
	}

	function GenerateDrinks() {
		var first = Math.ceil(Math.random()*4);
		var second = Math.ceil(Math.random()*3);
		var everyoneElse = Math.ceil(Math.random()*2);
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
		else {
			return playersArray;
		}

	}
  });
}