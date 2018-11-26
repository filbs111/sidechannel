console.log("SIDECHANNEL BACKGROUND : in script!");


function updateActiveTab(unknown_info) {	//TODO what is passed in here? 
			//can it be used to put separate info in each window's browser actions?
	console.log("SIDECHANNEL BACKGROUND : in updateActiveTab!");
	
	
	browser.tabs.query({active: true})	//active - Whether the tabs are active in their windows.	//what happens if have 2 windows open? can have multiple active tabs??? would like to have crowserAction button function in multiple open windows 
    .then(function(tabs){
		currentUrl = new URL(tabs[0].url);	//how many tabs are listed???
		console.log("SIDECHANNEL BACKGROUND : " + currentUrl);
	});
	//TODO handle what happens if promises return in wrong order.
	//is it possible to attach some id to the promise????
}

//taken from bookmark-it example:

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateActiveTab);

// update when the extension loads initially
updateActiveTab();


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
	setTimeout(updateTitle,1000);
	console.log("SIDECHANNEL BACKGROUND , will update title");
	browser.browserAction.getTitle({}).then(function(something){
		console.log("SIDECHANNEL BACKGROUND "+ something);
	});	//some promise thingy TODO understand promises https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/getTitle
	browserAction.setTitle({title: "TITLE #" + (myCount)});
	browserAction.setBadgeText({text: ""+myCount});	//handle for multiple windows/tabs. https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/setBadgeText
	
browser.browserAction.setBadgeBackgroundColor({color:[0,0,0,100]});	//near transparent. annoyinglt full transparent still has a drop shadow
	//TODO don't keep re-setting this
	
	myCount++;
}
updateTitle();