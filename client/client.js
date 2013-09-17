if (Meteor.isClient) {
  Meteor.startup(function () {

	/* *******************
	 * Objects
	 * Unable to have them in seperate files otherwise they go out of scope
	 * http://stackoverflow.com/questions/16469062/meteor-js-serve-javascript-files-without-function-callthis
	 * ********************/

	/* Teams 
	* teamId - id of the team
	* teamMembers - Array of the members
	* teamName - Well ... this is straight forward 
	* currentStanding - The current standing to be assigned to a player
	* totalDrinks - Total number of drinks for the entire team 
	* playersPlaced - Number of players who have been placed
	* disableDrinks - Disables the drink button
	* drank - bool that says if the team was given drinks already */
	function teamObj(id, teamMembers, teamName, currentStanding){
		this.teamId = id;
		this.teamMembers = teamMembers;
		this.teamName = teamName;
		this.currentStanding = currentStanding;
		this.totalDrinks = 0;
		this.playersPlaced = 0;
		this.disableDrinks = "";
		this.drank = false;
	}

	// Conversion array to convert the standing from a number to a word 
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
	
	// Bonus Drink Modal
	$('#bonusModal').modal({
		show: false
	});

	// Navigation clicks
	$('body').on('click', '.nav-btn', function(){
		Session.set('page', $(this).attr('id'));
	});

	// Create the game
	$('body').on('click', '.create-game', function(){
		CreateGame();
	});

	// Placing players from first to last. All information is stored in the Teams Object.
	$('body').on('click', '.team-members a', function(){
		
		var teamId = $(this).parents('.team').data('teamid');
		var playerId = $(this).data('playerid');
		
		var teams = Session.get('teams'); //Create copy of current team list
		var currentStanding = teams[teamId].currentStanding;
		var playerStanding = $(this).data('placed');

		// If the team already drank don't allow them to rearrange player ranking

		if (teams[teamId].drank) { return; } 

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
					player.placed = '';
					player.standing = 0;
					player.standingText = "";
					teams[teamId].currentStanding = currentStanding - 1;
					teams[teamId].playersPlaced--;

					Session.set('teams', teams);
				}
			});
		}
		else if (!($(this).hasClass('placed'))) { //Not yet placed

			// Do not allow players to be placed after 10th place
			if (teams[teamId].playersPlaced == 10) { return; }

			$.each(teams[teamId].teamMembers, function(i, player){
				if (player.id == playerId) {
					player.placed = 'placed';
					player.standing = currentStanding;
					player.standingText = standings[currentStanding - 1];
					teams[teamId].currentStanding = currentStanding + 1;
					teams[teamId].playersPlaced++;

					Session.set('teams', teams);
				}
			});
		}

	});

	// Pass out drinks to players in the current team
	$('body').on('click', '.give-drinks', function(){

		var teamId = $(this).data('teamid');
		GenerateDrinks(teamId);
		BonusDrinks();
	});

	// Give a chance for bonus drinks when the game is finished
	$('body').on('click', '.game-finished', function(){
		BonusDrinks();
		TeamDrankMost();
		WhoDrankMost();
	});

	// Prevent scroll to top of page from href="#" in the team members list when clicked
	// http://stackoverflow.com/a/7012906/1052068
	$('body').on('click', '.team-members a', function(ev){
		ev.preventDefault();
		ev.stopPropagation();
		return false;
	});

	/* ================================================================================
   	   Game Functions
       ================================================================================*/

    // Take the players and put them into teams thus creating the game
	function CreateGame() {
		var players = Session.get("players");
		var teamSize = Session.get("team_size");
		var numOfPlayers = _.size(players);
		var numOfTeams = (teamSize==10) ? 1 : Math.ceil(numOfPlayers/teamSize);

		players = randomizeArray(players); //randomize players array

		// If use selected 10+ players then create one team 
		// Otherwise even out the teams and create them
		var teams;
		if (numOfTeams == 1) {
			teams = CreateOneTeam(players);
		}
		else {
			players = EvenOutTeams(numOfPlayers, teamSize, players); //Even out the teams
			teams = CreateMultipleTeams(players, numOfTeams, teamSize);
		}

		Session.set("teams", teams);
	}

	// Create a single team
	function CreateOneTeam(players) {
		var team = [];
		team.push(new teamObj(0, players, "Singular", 1));
		return team;
	}

	// Create multiple teams
	function CreateMultipleTeams(players, numOfTeams, teamSize) {
		var teams = [];
		for (var i=0; i < numOfTeams; i++) {
			var teamMembers = players.splice(0,teamSize);
			var teamName = i; 
			var teamId = i;
			teams.push(new teamObj(teamId, teamMembers, teamName, 1));
		}
		return teams;
	}

	// Generate drinks to hand out to the players
	// The better they do, the more drinks they get
	function GenerateDrinks(teamId) {
		var teamDrinks = 0;
		var teams = Session.get('teams');
		teams[teamId].disableDrinks = "disabled"; // They can only click this once
		teams[teamId].drank = true;

		// Assign drinks to each player on the current team
		$.each(teams[teamId].teamMembers, function(i, player) {
			var maxDrinks = GetMaxDrinks(player.standing);
			var numDrinks = Math.ceil(Math.random()*maxDrinks);
			player.numDrinks = numDrinks;
			teamDrinks += numDrinks; // track num of drinks for the team
			AddDrinksOverallTotal(numDrinks);
			AddToPlayerOverallDrinks(player.id, numDrinks);
		});

		teams[teamId].totalDrinks = teamDrinks;
		Session.set('teams', teams);
	}

	// Give the chance of random bonus drinks to the players
	function BonusDrinks() {
		var chance = Math.random();

		// 30% chance of bonus drank
		if (chance < 0.3) {
			var drinks = Math.ceil(Math.random()*2);
			Session.set("bonus_drinks", drinks);
			$('#bonusModal').modal('show');
		}
	}

	/* ================================================================================
       Helper Functions
       ================================================================================*/
  	
  	// Uses the fisherYates to randomize the array
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
	 * Some players will be playing twice, thus getting more drunk than others */
	function EvenOutTeams(numPlayers, teamSize, playersArray) {
		
		// If number of players is not divible by team size choose players 
		// then fill the array with duplicate players until even team sizes
		var teamEven = (numPlayers%teamSize);
		if (teamEven != 0) {
			var additionalPlayers = [];

			// figure out how many addition players we need
			var playersNeeded = (teamSize - teamEven);

			for (var i=0; i < playersNeeded; i++) {
				additionalPlayers.push(playersArray[i]); // array is already randomized
			}

			playersArray.push.apply(playersArray, additionalPlayers);
			return playersArray;
		}
		else {
			return playersArray;
		}

	}

	// Get the max number of drinks a player can possibly get based on their standing
	function GetMaxDrinks(standing) {
		
		var maxDrinks = 0;

		switch(standing) {
			case 1: // 1st
				maxDrinks = 5;
				break;
			case 2: // 2nd
				maxDrinks = 4;
				break;
			case 3: // 3rd
				maxDrinks = 3;
				break;
			default: // All other places
				maxDrinks = 2;
		}

		return maxDrinks;
	}

	// Keep track of the number of drinks handed out to all users
	function AddDrinksOverallTotal(numDrinks) {
		var overallDrinks = Session.get("total_drinks");
		Session.set("total_drinks", overallDrinks + numDrinks);
	}

	// Add the total number of drinks for the player in the global players array
	function AddToPlayerOverallDrinks(id, numDrinks) {
		var players = Session.get("players");

		$.each(players, function(i, player) {
			if (player.id === id){
				player.numDrinks += numDrinks;
			}
		});

		Session.set("players", players);
	}

	// Which team drank the most?
	function TeamDrankMost() {
		var drunkTeams = Session.get("teams");
		var mostDrinks = 0;

		$.each(drunkTeams, function(i, team){
			if (team.totalDrinks > mostDrinks) {
				mostDrinks = team.totalDrinks;
				Session.set("mostDrunkTeamName", team.teamName);
				Session.set("mostdrunkTeamDrinks", team.totalDrinks);
			}

		});
	}

	// Who is the most tipsy?
	function WhoDrankMost() {
		var players = Session.get("players");
		var mostDrinks = 0;

		$.each(players, function(i, player){
			if (player.numDrinks > mostDrinks) {
				mostDrinks = player.numDrinks;
				Session.set("playerMostDrinks", player.playerName);
				Session.set("playerTotalDrinks", player.numDrinks);
			}
		});
	}
  });
}