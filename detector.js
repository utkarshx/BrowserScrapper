//editing api
if(window.location.href.match('https://www.kimonolabs.com/apis/') ||
   window.location.href.match('https://kimonolabs.com/apis/') ||
   window.location.href.match('http://www.kimonolabs.com/apis/') ||
   window.location.href.match('http://kimonolabs.com/apis/') ||
   window.location.href.match('https://www.kimstage.com/apis/')) {

  setTimeout(function(){
    var deleteButton = document.querySelector('.btn.btn-default.api-edit-button');
    if(deleteButton){
      setTimeout(function(){
        deleteButton.href = '#';
      }, 300);
      deleteButton.onclick = function (e){
        var target = deleteButton.getAttribute('kimono-chrome-target');
        var authurl = deleteButton.getAttribute('kimono-chrome-auth');
        var apiid = deleteButton.getAttribute('kimono-chrome-apiid');
        deleteButton.setAttribute('ng-click', '');
        if(authurl){
          chrome.runtime.sendMessage({type: "kimonostartauth", data: {url: target, apiid: apiid, authUrl: authurl}});
        }
        else{
          chrome.runtime.sendMessage({type: "kimonostart", data: {url: target, apiid: apiid}});  
        }
        
        return false;
      };
    }
  }, 500);
    
}

// if( window.location.href.match('kimonoeditapi=') && 
//   !window.location.origin.match('http://kimonolabs.com') && 
//   !window.location.origin.match('http://kimonolabslocal.com')){
//   chrome.runtime.sendMessage("kimonostart");
// }


chrome.runtime.sendMessage("pageloaded");
