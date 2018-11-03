var myWindowId;
const pageNameBox = document.querySelector("#pagename");
const searchButton = document.querySelector("#searchbutton");
const numSearchResults = document.getElementById("numsearchresults");
const preSearchButton = document.querySelector("#presearchbutton");
var currentUrl = "";

function updateContent() {
  numSearchResults.innerHTML = "?";
  browser.tabs.query({windowId: myWindowId, active: true})
    .then((tabs) => {
	//url would like to search for
	currentUrl = tabs[0].url;
	//pageNameBox.innerHTML = currentUrl;
    });
}

searchButton.addEventListener("click",function(evt){
	window.open("https://www.reddit.com/search?q="+encodeURI(currentUrl));
});
preSearchButton.addEventListener("click",function(evt){
	//var jsonSearchUrl = "https://www.reddit.com/search.json?limit=1&q="+encodeURIComponent(currentUrl);
	var jsonSearchUrl = "https://www.reddit.com/search.json?q="+encodeURIComponent(currentUrl);
		//currently limit appears to not be applied. same results irrespective of limit. is this a bug? does it happen for curl? 
		//appears to follow a 302 when open in browser address bar, rather than actually providing useful json data as requested.
		//best guess doing something "clever" (stupid) when search for url. try workaround - search for url without it getting pegged as an url
		//deleting https:// from url gets 0 results.
	
	//urls appear to redirect to "submit", but submit doesn't take limit param
	//var jsonSearchUrl = "https://www.reddit.com/submit.json?limit=1&q="+encodeURIComponent(currentUrl);
	
	//var jsonSearchUrl = "https://www.reddit.com/search.json?limit=1&q=test";
		//limit functions here ok
		
	console.log("will search for " +  jsonSearchUrl);
		
	//var jsonSearchUrl = "https://duckduckgo.com/";	//this can be called ok.
	var xhr = new XMLHttpRequest();
	xhr.open("GET", jsonSearchUrl, true);
	xhr.onload = function (e) {
	  if (xhr.readyState === 4) {
		if (xhr.status === 200) {
		  console.log(xhr.responseText);
		  var numresults = 0;
			//figure out if has results.
			var responseObject = JSON.parse(xhr.responseText);
			
			//seems responseObject is sometimes array-like, sometimes not!
			//can see it's like an array by length property
			console.log( typeof responseObject);	//always object, not array
			console.log( responseObject.length);
			var thingWeWant = responseObject.length ? responseObject[0]:responseObject;
			
			//console.log(responseObject);
			//console.log(responseObject[0]);
			
			console.log(thingWeWant.data);
			if (thingWeWant.data && thingWeWant.data.children){
				numresults =  thingWeWant.data.children.length;
			}
			console.log("number of results : " + numresults);
			numSearchResults.innerHTML = numresults;
		} else {
		  console.error(xhr.statusText);
		}
	  }
	};
	xhr.onerror = function (e) {
	  console.error(xhr.statusText);
	};
	xhr.send(null);
});

/*
Update content when a new tab becomes active.
*/
browser.tabs.onActivated.addListener(updateContent);

/*
Update content when a new page is loaded into a tab.
*/
browser.tabs.onUpdated.addListener(updateContent);

/*
When the sidebar loads, get the ID of its window,
and update its content.
*/
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
  myWindowId = windowInfo.id;
  updateContent();
});
