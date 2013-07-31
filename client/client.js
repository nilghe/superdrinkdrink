if (Meteor.isClient) {
  Meteor.startup(function () {
  	$('body').on('click', '.game-button, .back-button', function(){
  		Session.set('page', $(this).attr('id'));
  	});
  });
}