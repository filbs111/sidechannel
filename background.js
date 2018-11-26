console.log("SIDECHANNEL BACKGROUND : in script!");

//AFAIK if a popup is sent, this event never gets sent!!!!!!!! !!!!!!!!!!
//how to have a popup and have a background script?
//want to be able to fire a search on page load so that clicking the browser
//or page action button reveals the results!!!!!!
var browserAction = browser.browserAction;

browser.browserAction.onClicked.addListener(function(evt){
	console.log("SIDECHANNEL BACKGROUND : background script knows that page action was clicked!");
});

var myCount=0;
function updateTitle(){
	setTimeout(updateTitle,5000);
	console.log("SIDECHANNEL BACKGROUND , will update title");
	browser.browserAction.getTitle({}).then(function(something){
		console.log("SIDECHANNEL BACKGROUND "+ something);
	});	//some promise thingy TODO understand promises https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/getTitle
	browserAction.setTitle({title: "TITLE #" + (myCount++)});
}
updateTitle();