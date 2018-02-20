
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
            //console.log(key,params[key],params,hiddenField);

            form.appendChild(hiddenField);
        }
    }

    document.body.appendChild(form);
    form.submit();
}

function setFbCredentials(params){
    var form = document.getElementById("register");

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);
            //console.log(key,params[key],params,hiddenField);

            form.appendChild(hiddenField);
        }
    }
}

function loginStatus(){
  FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {
          FB.api('/me', function(apiResponse) {
            let fbid = apiResponse.id;
            let fbname = apiResponse.name;
            if((window.location.toString().indexOf("/login") !== -1 || window.location.toString().indexOf("/register") !== -1)
              && window.location.toString().indexOf("fblogin") === -1){
              post('/login/fblogin',{name:fbname,fbid:fbid});
              /*if(window.location.toString().lastIndexOf("/") === window.location.toString().length-1){
                window.location = window.location + "fblogin";
              }
              else{
                window.location = window.location + "/fblogin";
              }*/
            }
            else if(window.location.toString().indexOf("/logout") !== -1){
              FB.logout(function(logoutResponse){
                //console.log(logoutResponse);
                window.location = "/home";
              });
            }
          });
         
        }
        else if(window.location.toString().indexOf("fblogin") > -1){
            window.location = "/home";
        }
        else if(window.location.toString().indexOf("logout") > -1){
            window.location = "/home";
        }
        
    });
}


window.fbAsyncInit = function() {
  FB.init({
    appId            : '153038318758624',
    autoLogAppEvents : true,
    xfbml            : true,
    version          : 'v2.11'
  });
  loginStatus();
};




/*(function(d, s, id){
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = "https://connect.facebook.net/en_US/sdk.js";
   fjs.parentNode.insertBefore(js, fjs);
 });*/