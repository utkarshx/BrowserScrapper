(function(){
  
  //var WWW_HOST = 'https://localhost:4000';
  //var WWW_HOST = 'https://www.kimstage.com';
  var WWW_HOST = 'https://www.kimonolabs.com';


  chrome.browserAction.setBadgeBackgroundColor({color: '#838383'});

  var tabsInfo = {};

  var loadKimono = function (tabId, callback){
    $.ajax({
      dataType: 'text',
      type: 'GET',
      url: WWW_HOST + "/js/extension_kimono.js",
      success: function (scriptBody, textStatus, jsXHR){
        chrome.tabs.executeScript(tabId, {file: './js/inject.js'});
        chrome.tabs.executeScript(tabId, {code: scriptBody}); 
        if(callback) callback(true);
      },
      error: function (){
        console.log(arguments);
        if(callback) callback(false);
      }
    }); 
  };

  var size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
  };

  var createIncognitoPopup = function (url, tabsInfoObject, callback){
    chrome.windows.onCreated.addListener(function windowListener(windowObj){
      chrome.windows.onCreated.removeListener(windowListener);
      chrome.windows.onRemoved.addListener(windowRemoveListener);
      chrome.tabs.query({windowId: windowObj.id}, function (tabs){
        var tab = tabs[0];
        tabsInfo[tab.id] = tabsInfoObject;
        tabsInfo[tab.id].windowId = windowObj.id;
        loadKimono(tab.id, function (noErr){
          if(!noErr){
            createNotification('Kimono Labs', 'Please check your internet connection.', 'internet');
          }
          else if(callback) callback();
        });
      });  
    });
    chrome.windows.create({"url": url, "incognito": true, "type": "popup"}); 
  };

  // TODO: allow access to shared libraries chrome extension
  var seriesFlow = function (functions, callback){
    var next = function (stop){
      if(functions.length === 0 || stop){ 
        if(callback) { callback(); }
        return;
      }
      functions.shift()(next);
    };
    next();
  };

  var createTabsInfo = function (props){
    return {
      nextLoad: props.nextLoad || undefined,
      step: props.step || '-1', 
      editing: props.editing || true, 
      apiid: props.apiid || undefined, 
      authEnabled: props.authEnabled || false, 
      authUrl: props.authUrl || '', 
      windowId: props.windowId || undefined, 
      targetUrl: props.targetUrl || '', 
      username: props.username || '', 
      password: props.password || '', 
      usernameSelector: props.usernameSelector || '', 
      passwordSelector: props.passwordSelector || '', 
      submitSelector: props.submitSelector || '',
      properties: props.properties || {}
    };
  };

  var checkForOtherIncognito = function (callback){
    chrome.windows.getAll(null, function (windows){
      var foundIncognito = false;
      for(var i = 0; i < windows.length; i++){
        if(windows[i].incognito){
          foundIncognito = true;
        }
      }
      callback(foundIncognito);
    });
  };
  
  var addUrlParam = function (param, value, url){
    var components = url.split('#');
    if(url.match(/\?/)) {
      components[0] = components[0] + '&' + param + '=' + value;
      return components.join('#');
    }
    else{
      components[0] = components[0] + '?' + param + '=' + value;
      return components.join('#');
    }
  };

  var createNotification = function (title, message, id, duration){
    var notificationOptions = {  
      type: "basic",
      title: title,
      message: message,
      iconUrl: "icon_sq_256.png"
    };

    chrome.notifications.create(id, notificationOptions, function(){});

    if(duration){
      var notificationTimeout = setTimeout(function(){
        chrome.notifications.clear(id, function(){});
      }, duration);

      chrome.notifications.onClosed.addListener(function notificationClosed(){
        clearTimeout(notificationTimeout);
      });
    }
  };

  var removeKimonoUrlParam = function (url){
    var output = url.replace(/(\&|\?)(kimonoeditapi=)[\s\S]{8}/, '');
    return output;  
  };

  var tabRemoveListener = function (id){
    for(var tabId in tabsInfo){
      if(tabsInfo[tabId] && tabId == id){
        delete tabsInfo[tabId];
      }
    }
    if(size(tabsInfo) === 0){
      chrome.tabs.onRemoved.removeListener(tabRemoveListener);
    }
  };  

  var windowRemoveListener = function (windowId){
    for(var tabId in tabsInfo){
      if(tabsInfo[tabId] && tabsInfo[tabId].windowId == windowId){
        delete tabsInfo[tabId];
      }
    }
    if(size(tabsInfo) === 0){
      chrome.windows.onRemoved.removeListener(windowRemoveListener);
    }
  };

  var handlePageLoad = function(tabId, tabUrl){

    if(typeof tabsInfo[tabId] == 'undefined') {
      if(tabUrl.match(/kimonolabs\.com/)) return; 
      $.ajax({
        type: 'GET',
        url: WWW_HOST+'/ws/siteapiscount?url='+encodeURIComponent(tabUrl),
        success: function(data, textStatus, jqXHR) {
          if(data && data > 0){
            chrome.browserAction.setBadgeText({text: data, tabId: tabId});
          }
        }
      });
      return; 
    } 

    if(tabsInfo[tabId].nextLoad){
      tabsInfo[tabId].nextLoad();
      tabsInfo[tabId].nextLoad = undefined;
    }

    //do things based on the current step

    // not in incognito window
    if(tabsInfo[tabId].step == '-1') { 
      if(removeKimonoUrlParam(tabUrl) != removeKimonoUrlParam(tabsInfo[tabId].targetUrl)){ // ignore kimonoedit url parameter
        // if we navigate away from the page - stop tracking the tab
        tabRemoveListener(tabId);
        return;
      }
    }
    else if(tabsInfo[tabId].step == 'listeningForLoginReload'){
      chrome.notifications.clear('logging_in', function(){});
      //chrome.tabs.update(tabId, {url: tabsInfo[tabId].targetUrl});
      tabsInfo[tabId].step = 'done';
    }
    else if(tabsInfo[tabId].step == 'kimonifying'){
      tabsInfo[tabId].step = '-1';    
    }

    //execute script again
    loadKimono(tabId, function (noError){
      if(!noError){
        createNotification('Kimono Labs', 'Please check your internet connection.', 'internet');
      }
    });

  };

  chrome.runtime.onMessage.addListener(function (msg, info){
    var targetTab = info.tab;

    if(msg.type == 'kimonostart'){  //editing apis

      tabsInfo[targetTab.id] = createTabsInfo({
        editing: true, 
        apiid: msg.data.apiid, 
        targetUrl: msg.data.url
      });
      chrome.tabs.update(targetTab.id, {url: msg.data.url});
      console.log('starting auth');
    }
    else if(msg.type == 'kimonostartauth'){  //editing auth apis

      seriesFlow([
        function (cb){
          checkForOtherIncognito(function (found){
            if(found){
              createNotification('Kimono', 'Please close all your other open incognito windows/tabs', 'incognito', 5000);
              cb(true);
            }
            else{
              cb(false);
            }
          });
        },
        function (cb){
          var tabsInfoObject = createTabsInfo({
            step: 'on', 
            editing: true,
            apiid: msg.data.apiid,
            authUrl: msg.data.authUrl,
            targetUrl: msg.data.url
          });



          createIncognitoPopup(msg.data.authUrl, tabsInfoObject, function(){
            tabRemoveListener(targetTab.id);
            chrome.tabs.update(targetTab.id, {url: targetTab.url});
          });
        }
      ]);
    }
    else if(msg.type == 'followLink'){
      if(tabsInfo[targetTab.id] && tabsInfo[targetTab.id].step != '-1'){
        chrome.tabs.remove(targetTab.id, function(){
          setTimeout(function(){
            chrome.windows.create({url: msg.data});
          }, 500);
        });
      }
      else{
        chrome.tabs.update(targetTab.id, {url: msg.data});
      }
    }
    else if(msg == 'authMode'){
      chrome.extension.isAllowedIncognitoAccess(function(isAllowedAccess) {
        if (!isAllowedAccess) {
          chrome.tabs.create({
              url: 'chrome://extensions/?id=' + chrome.runtime.id
          }, function(){
            tabRemoveListener(targetTab.id);
            chrome.tabs.update(targetTab.id, {url: targetTab.url});
            createNotification('Kimono', 'Auth mode requires you to first \'Allow icognito mode\' in the kimono chrome extension', 'incognito_enable', 5000);
          });
        }
        else{
          seriesFlow([
            function (cb){
              checkForOtherIncognito(function (found){
                if(found){
                  createNotification('Kimono', 'Please close all your other open incognito windows/tabs', 'incognito', 5000);
                  cb(true);
                }
                else{
                  cb(false);
                }
              });
            },
            function (cb){
              var tabsInfoObject =  createTabsInfo({
                step: 'on', 
                targetUrl: targetTab.url,
              });
              createIncognitoPopup(targetTab.url, tabsInfoObject, function(){
                tabRemoveListener(targetTab.id);
                chrome.tabs.update(targetTab.id, {url: targetTab.url});
              });
            }
          ]);
        }
      });
          
    }
    else if(msg == 'currentState'){
      if(tabsInfo[targetTab.id]){
        chrome.tabs.sendMessage(targetTab.id, {type: 'theState', data: tabsInfo[targetTab.id].step});
      }
      else{
        chrome.tabs.sendMessage(targetTab.id, {type: 'theState', data: '-1'});
      }
    }
    else if(msg == 'pageloaded') {
      handlePageLoad(targetTab.id, targetTab.url);
    }
    else if(msg.type == 'changeState' && tabsInfo[targetTab.id]){
      tabsInfo[targetTab.id].step = msg.data;
      chrome.tabs.sendMessage(targetTab.id, 'doneChangingState');
    }
    else if(msg.type == 'addProperty'){
      tabsInfo[targetTab.id].properties[msg.data.key] = mag.data.value;
    }
    else if(msg.type == 'getProperty'){
      chrome.tabs.sendMessage(targetTab.id, {type: 'property', data: tabsInfo[targetTab.id].properties[msg.data]});
    }
    else if(msg == 'isEditingApi'){
      if(tabsInfo[targetTab.id]){
        chrome.tabs.sendMessage(targetTab.id, {type: 'editingApi', data: tabsInfo[targetTab.id].apiid});
      }
      else{
        chrome.tabs.sendMessage(targetTab.id, {type: 'editingApi', data: undefined});
      }
    }
    else if (msg.type == 'getSiteApis'){
      $.get(WWW_HOST+"/ws/siteapis?url=" + encodeURIComponent(msg.data), function(data) {
          chrome.tabs.sendMessage(targetTab.id, {type: 'theSiteApis', data: data});
      });
    } 
    else if(msg.type == 'initiateListening'){
      tabsInfo[targetTab.id].step = 'listeningForLoginReload';
      tabsInfo[targetTab.id].authUrl = targetTab.url;
      tabsInfo[targetTab.id].username = msg.data.username;
      tabsInfo[targetTab.id].password = msg.data.password;
      tabsInfo[targetTab.id].usernameSelector = msg.data.usernameSelector;
      tabsInfo[targetTab.id].passwordSelector = msg.data.passwordSelector;
      tabsInfo[targetTab.id].submitSelector = msg.data.submitSelector;
      tabsInfo[targetTab.id].authEnabled = true; 
      
      var displayDomain = function(url) {
        if(!url) return;
        var match = url.match(/https?:\/\/(.*?)(\/|$)/);
        if(match) return match[1];
        else return url;
      };

      createNotification('Kimono', 'Something magical is happening. Logging into ' + displayDomain(targetTab.url) + '...', 'logging_in');
    }
    else if(msg.type === 'currentUser'){
      $.get(WWW_HOST+"/ws/users/me", function(data) {
          chrome.tabs.sendMessage(targetTab.id, {type: 'id', data: data});
      });
    }
    else if (msg.type === 'updateUserAlerts'){ // use this to update hint info about user
      $.post(WWW_HOST+"/ws/updateuser", {type: 'alerts', alerts: msg.alerts, userid: msg.userid});
    }
    else if (msg.type === 'prepareDownload'){
      $.post(WWW_HOST+"/ws/preparedownload", msg.data, function(data) {
          chrome.tabs.sendMessage(targetTab.id, {type: 'download', data: data.url});
      });
    }
    else if(msg.type === 'createApi'){

      if(tabsInfo[targetTab.id] && tabsInfo[targetTab.id].authEnabled){
        //add code to append auth object to apiObject
        msg.data.authSelectors = {
          username: tabsInfo[targetTab.id].usernameSelector,
          password: tabsInfo[targetTab.id].passwordSelector,
          submit: tabsInfo[targetTab.id].submitSelector
        };
        msg.data.credentials = {
          username: tabsInfo[targetTab.id].username,
          password: tabsInfo[targetTab.id].password
        };
        msg.data.authUrl = tabsInfo[targetTab.id].authUrl;
        msg.data.access = 'private';
      }

      var expressRoute = (msg.data.id) ? '/ws/editapi' : '/ws/create';

      $.ajax({
        type: 'POST',
        url: WWW_HOST + expressRoute,
        data: msg.data,
        success: function(data, textStatus, jqXHR) {
          if(data.error) {
            chrome.tabs.sendMessage(targetTab.id, {type: 'createApiError', data: data});
          }
          else {
            chrome.tabs.sendMessage(targetTab.id, {type: 'createApiSuccess', data: data});
          }
        },
        error: function(jqXHR, textStatus, err) {
          chrome.tabs.sendMessage(targetTab.id, {type: 'createApiFail', data: err});
        },
        dataType: 'json'
      });

    }
    else if(msg == 'getNotifications'){
      $.get( WWW_HOST+'/ws/getnotifications', function (data){
        if(data){
          chrome.tabs.sendMessage(targetTab.id, {type: 'notifications', data: data});
        }
        else{
          chrome.tabs.sendMessage(targetTab.id, {type: 'notificationsFailed'});
        }
      });
    }
    else if(msg.type == 'signup'){
      $.ajax({
        type: "POST",
        url: WWW_HOST+'/processsignup',
        data: {name: msg.data.name, email: msg.data.username, password: msg.data.password},
        success: function(data, textStatus, jqXHR) {
          chrome.tabs.sendMessage(targetTab.id, {type: 'signupSuccess', data: data});
        },
        error: function(jqXHR, textStatus, err) {
          chrome.tabs.sendMessage(targetTab.id, {type: 'signupFailed', data: err});
        },     
        dataType: 'json'
      });
    }
    else if(msg.type === 'userSession'){
      $.ajax({
          type: 'POST',
          url: WWW_HOST+'/users/session',
          data: msg.data,
          success: function(data, textStatus, jqXHR) {
            chrome.tabs.sendMessage(targetTab.id, {type: 'userSessionSuccess', data: data});
          },
          error: function(jqXHR, textStatus, err) {
            chrome.tabs.sendMessage(targetTab.id, {type: 'userSessionFail', data: err});
          },
          dataType: 'json'
        });
    }
    else if(msg.type == 'editApi'){
      $.ajax({
        type: "GET",
        url: WWW_HOST+"/ws/api/"+msg.data,
        success: function(data, textStatus, jqXHR) {
          chrome.tabs.sendMessage(targetTab.id, {type: 'editApiSuccess', data: data});
        },
        error: function(jqXHR, textStatus, err) {
          chrome.tabs.sendMessage(targetTab.id, {type: 'editApiFail', data: err});
        },
        dataType:'json'
      });
    }

  });



  chrome.browserAction.onClicked.addListener(function (the_tab) {
    

    tabsInfo[the_tab.id] = createTabsInfo({
      targetUrl: the_tab.url
    });

    chrome.tabs.onRemoved.addListener(tabRemoveListener);

    chrome.tabs.update(the_tab.id, {url: the_tab.url});

    //chrome.windows.create({"url": the_tab.url, "incognito": true, "type": "popup"});   
  });


})();
