var myWindowId;
const pageNameBox = document.querySelector("#pagename");
const searchButton = document.querySelector("#searchbutton");
const numSearchResults = document.getElementById("numsearchresults");
const searchResultsDiv = document.getElementById("searchresults");
const preSearchButton = document.querySelector("#presearchbutton");
var currentUrl = "";
var currentSearchTerm = "";
var mycount=0;

var retainedResults = {};

var autoSearchHosts = [ 
	"www.theguardian.com",
	"www.bbc.co.uk", "www.bbc.com",
	"www.nytimes.com"
	];	//list of sites where will automatically do a search.
	//not a good idea to auto-search everything since would result in sending user's navigation data to reddit!
	//therefore intially only want family friendly sites here that won't get people persecuted by the state and/or society
	//maybe want more general regex

//get rid of params so search finds something more useful.
//some places do want to retain params - eg youtube ?v=
//other places want to get rid of params - eg nytimes has ...&action=click&module=editorsPicks... etc
//for unknown sites, possibly UI should provide options, or preemptivaly search for URL as is, and stripped

//simple way, accept same params regardless of website.
var acceptableParams = ["v"];	//v so youtube works
//TODO list params that wish to retain for each host. later could be specific to endpoints.

//sites that AFAIK have the same content
//TODO combine config for this and autoSearchHosts.
var equivalentSites = [
	[ "www.bbc.co.uk", "www.bbc.com" ]	//these are looking for exact match - requires www
	];


var mylog=function(txt){console.log("sidechannellog: " + txt);}	//for filtering browser console
	
function updateContent() {
  mylog("UPDATING CONTENT");
  mylog(mycount++);
  browser.tabs.query({windowId: myWindowId, active: true})
    .then((tabs) => {

	//url would like to search for
	currentUrl = new URL(tabs[0].url);
	
	//check for match in auto search hosts array
	//TODO avoid repeating this during page loading - appears to be triggered multiple times for some sites
	//TODO disable pre-search button when performing search
	var currentHost = currentUrl.hostname;
	
	//var newSearchTerm = currentUrl.origin + currentUrl.pathname;
	
	var searchParams=currentUrl.searchParams;
	searchParams.forEach(function(val,key){
		if (acceptableParams.indexOf(key)==-1){searchParams.delete(key);};
	});
	var newSearchTerm = currentUrl.toString();	//redundant. TODO use currentUrl in place of newSearchTerm
	
	mylog("old and new search terms:");
	mylog(currentSearchTerm);
	mylog(newSearchTerm);
	
	if (currentSearchTerm != newSearchTerm){	//todo check that equivalentSites set is same (currently this check will re-search on redirect from bbc.co.uk to bbc.com)
		mylog("setting question mark!");
		numSearchResults.innerHTML = "?";
		searchResultsDiv.innerHTML = "";
		
		currentSearchTerm = newSearchTerm;		
	
		var filteredMatches = autoSearchHosts.filter(function(matchstring){return currentHost.match(matchstring);});
		mylog("filteredMatches: " + filteredMatches);
		
		if (filteredMatches.length && filteredMatches.length>0){
			mylog("host match found. will auto-search");
			performPreSearch(currentUrl, true);	//use stored data if available and fresh, else perform search query
		}else{
			performPreSearch(currentUrl, false);	//only use stored data. don't perform search query.
			mylog("no host match");
		}
	}else{
		mylog("same search term as last. skipping search");	//TODO timeout ( search result considered out of date if, say 5 minutes old )
															//TODO remember recent results (useful if switching between tabs)
	}
	
	currentSearchTerm = newSearchTerm;
	//pageNameBox.innerHTML = currentUrl;
    });
}

function getEquivalentSites(host){
	//check whether host is on the equivalentSites list
	//assume each site only listed once here.
	var hostArr = [host];	//default array of results
	for (var ss in equivalentSites){
		var siteList = equivalentSites[ss];
		if (siteList.indexOf(host)!=-1){
			hostArr = siteList;
		}
	}
	//mylog("currentHosts = " + currentHosts);
	return hostArr;
}

preSearchButton.addEventListener("click",function(evt){
	performPreSearch(currentUrl, true);
});
function performPreSearch(urlToSearch, canActiveSearch){
	searchResultsDiv.innerHTML="";
	
	//get list of equivalent sites
	//perform search for all, updating list of all results
	var allResults = [];
	var currentHost = urlToSearch.hostname;	//redoing logic from elsewhere. todo combine
	var siteList = getEquivalentSites(currentHost);
	var numSearchesToDo = siteList.length;
	
	mylog("should do "+ numSearchesToDo + " searches...");
	
	for (var hh in siteList){
		mylog(urlToSearch.protocol+'//'+siteList[hh]+urlToSearch.pathname+urlToSearch.search);
		singleSearch(urlToSearch.protocol+'//'+siteList[hh]+urlToSearch.pathname+urlToSearch.search);
	}
	
	function singleSearch(searchTerm){
		var ageLimit = 10000;	//10 seconds
		//check database for past result.
		if (retainedResults[searchTerm]){	//TODO check age of result
			mylog("existing result found");
			var existingResult = retainedResults[searchTerm];
			//mylog(existingResult);
			var currentTime = new Date().getTime();
			var resultAge = currentTime - existingResult.time;
			mylog("age of saved results : " + Math.ceil(resultAge/1000) + " seconds" );
			if (resultAge<ageLimit){
				mylog("existing result is fresh");
				allResults = allResults.concat(existingResult.result);
				addResults(existingResult.result);
				return;
			}else{
				mylog("existing result too old. will search for " + searchTerm);
			}
		}else{
			mylog("no existing result found. will search for " + searchTerm);
		}
		
		if (!canActiveSearch){
			mylog("active search disabled, returning");
			return;
		}
		
		//var jsonSearchUrl = "https://www.reddit.com/search.json?limit=1&q="+encodeURIComponent(currentUrl);
		var jsonSearchUrl = "https://www.reddit.com/search.json?q="+encodeURIComponent(searchTerm);
			//currently limit appears to not be applied. same results irrespective of limit. is this a bug? does it happen for curl? 
			//appears to follow a 302 when open in browser address bar, rather than actually providing useful json data as requested.
			//best guess doing something "clever" (stupid) when search for url. try workaround - search for url without it getting pegged as an url
			//deleting https:// from url gets 0 results.
		
		//urls appear to redirect to "submit", but submit doesn't take limit param
		//var jsonSearchUrl = "https://www.reddit.com/submit.json?limit=1&q="+encodeURIComponent(currentUrl);
		
		//var jsonSearchUrl = "https://www.reddit.com/search.json?limit=1&q=test";
			//limit functions here ok
			
		mylog("will search for " +  jsonSearchUrl);
			
		//var jsonSearchUrl = "https://duckduckgo.com/";	//this can be called ok.
		var xhr = new XMLHttpRequest();
		xhr.open("GET", jsonSearchUrl, true);
		xhr.onload = function (e) {
		  if (xhr.readyState === 4) {
			if (xhr.status === 200) {
			  numSearchResults.innerHTML = "RESULT INCOMING";
			
			  mylog(xhr.responseText);
			  var numresults = 0;
				//figure out if has results.
				var responseObject = JSON.parse(xhr.responseText);
				
				//seems responseObject is sometimes array-like, sometimes not!
				//can see it's like an array by length property
				mylog( typeof responseObject);	//always object, not array
				mylog( responseObject.length);
				var thingWeWant = responseObject.length ? responseObject[0]:responseObject;
				
				mylog(responseObject);
				//mylog(responseObject[0]);
				
				mylog(thingWeWant.data);
				if (thingWeWant.data && thingWeWant.data.children){	
					var returnedResults = thingWeWant.data.children;
					allResults = allResults.concat(returnedResults);	//get back number results behaviour.
					addResults(returnedResults);
					
					retainedResults[searchTerm] = {
						time:new Date().getTime(),
						result:returnedResults 	//TODO check this is right place, including if there are no results.
					};
				}
			} else {
				numSearchResults.innerHTML = "ERROR";
			  console.error(xhr.statusText);
			}
			numSearchesToDo--;
		  }
		};
		xhr.onerror = function (e) {
		  console.error(xhr.statusText);
		};
		xhr.send(null);
	}
	
	function addResults(resultsData){
		for (var dd in resultsData){
			var linkElement = document.createElement("a");
			linkElement.href = "https://www.reddit.com" + resultsData[dd].data.permalink;
			var mytext = document.createTextNode(resultsData[dd].data.subreddit);
			linkElement.appendChild(mytext);
			searchResultsDiv.appendChild(linkElement);
			searchResultsDiv.appendChild(document.createElement("br"))
		}
		numSearchResults.innerHTML = allResults.length;
	}
};

/*
Update content when a new tab becomes active.
*/
browser.tabs.onActivated.addListener(
	function(){
		mylog("onActivated callback");
		updateContent();
	});

/*
Update content when a new page is loaded into a tab.
*/
browser.tabs.onUpdated.addListener(function(){
		mylog("onUpdated callback");
		updateContent();
	});

/*
When the sidebar loads, get the ID of its window,
and update its content.
*/
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
  myWindowId = windowInfo.id;
  updateContent();
});
