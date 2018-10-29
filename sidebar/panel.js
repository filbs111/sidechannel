var myWindowId;
const pageNameBox = document.querySelector("#pagename");
const searchButton = document.querySelector("#searchbutton");
var searchPage = "";

function updateContent() {
  browser.tabs.query({windowId: myWindowId, active: true})
    .then((tabs) => {
	pageNameBox.innerHTML = tabs[0].url;
	//url would like to search for 
	searchPage = "https://www.reddit.com/search?q="+encodeURI(tabs[0].url);
    });
}

searchButton.addEventListener("click",function(evt){
	window.open(searchPage);
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
