let fbid;
let name;
window.fbAsyncInit = function() {
  FB.init({
    appId            : '153038318758624',
    autoLogAppEvents : true,
    xfbml            : true,
    version          : 'v2.11'
  });

  FB.getLoginStatus(function(response) {
      if (response.status === 'connected') {
        fbid = response.id;
        name = response.name;
      }
      else{
        if(window.location.toString().indexOf("fblogin")){
          window.location = "/home";
        }
      }
      
  });


};

/*(function(d, s, id){
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = "https://connect.facebook.net/en_US/sdk.js";
   fjs.parentNode.insertBefore(js, fjs);
 });*/