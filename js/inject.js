//CSS 

//var WWW_HOST = 'https://localhost:4000';
// var WWW_HOST = 'https://www.kimstage.com';
var WWW_HOST = 'https://www.kimonolabs.com';

var css = document.createElement("link");
    css.setAttribute("rel", "stylesheet");
    css.setAttribute("type", "text/css");
    css.setAttribute("href", WWW_HOST + '/css/kimono.min.css');

document.getElementsByTagName("head")[0].appendChild(css);

// chrome.runtime.onMessage.addListener(function(msg){
//   if(msg.type === 'data') console.log(msg.data);
// });

// chrome.runtime.sendMessage("get-user");



// function createScriptResource (src){
//   var script = document.createElement("script");
//       script.setAttribute("type", "text/javascript");
//       script.setAttribute("src", chrome.extension.getURL(src));
//   document.getElementsByTagName("head")[0].appendChild(script);
// }

// function createScript (text){
//   var script = document.createElement("script");
//       script.setAttribute("type", "text/javascript");
//       script.text = '$(document).ready(function(){'+ text+'})';
//   document.getElementsByTagName("head")[0].appendChild(script);
// }


// // Scripts
  // try{ jQuery; } catch(e){ createScriptResource("js/lib/jquery.min.js"); }
  // createScriptResource("js/lib/draggabilly.min.js");
  // createScriptResource("js/common.js");


// window.addEventListener("message", function(event) {
//   // if (event.source != window)
//   //   return;
//   if (event.data.type && (event.data.type == "get-user")) {
//     //console.log(event.source);
//     //window.kim_load_user("test");
//     //event.source.postMessage({ type: "post-user", text: "user" }, "*");
//     //console.log(window.kim_load_user);
//   }

// }, false);



// // chrome.


