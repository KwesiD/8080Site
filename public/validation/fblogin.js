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
        post('/login/fblogin',{name:name,fbid:fbid});
      }
      else{
        if(window.location.toString().indexOf("fblogin")){
          window.location = "/home";
        }
      }
      
  });


};

function checkLoginState(){
  FB.getLoginStatus(function(response) {
      if (response.status === 'connected') {
          FB.api('/me', function(response) {
            let fbid = response.id;
            let fbname = response.name;
            post('/login/fblogin',{name:fbname,fbid:fbid});
            //console.log(response);
          });
      }
  });
}


/**
https://stackoverflow.com/a/133997
**/
function post(path, params, method) {
    method = method || "post"; // Set method to post by default if not specified.

    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
        }
    }

    document.body.appendChild(form);
    form.submit();
}





/*(function(d, s, id){
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = "https://connect.facebook.net/en_US/sdk.js";
   fjs.parentNode.insertBefore(js, fjs);
 });*/