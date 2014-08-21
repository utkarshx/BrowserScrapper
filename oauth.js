chrome.runtime.sendMesage(null, "Hey", null, function (){
  console.log(arguments);
});