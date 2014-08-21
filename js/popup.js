// initialization stuff
$('.kim-spinner').hide();
$('.kim-error-container').hide();


//click actions
var login = function(e){
  var username = $('#kim-LoginEmail').value();
  var password = $('#kim-LoginPassword').value();
  console.log('logging in');
  e.preventDefualt();
};