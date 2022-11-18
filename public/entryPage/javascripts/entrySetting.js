

//--------------------------
//
// global variable
//
//--------------------------
const LandMaxWidth = 100;
const LandMinWidth = 1;
const SessionStorageName = "entryConfig";

let PageElement = document.getElementById("page");

let entryConfig = {
	loadLocal: false,
	loadExtern: false,
	landWidth: 15
};



//--------------------------
//
// initialization functions
//
//--------------------------
window.OnLoad = function(){
	console.log("load");
	PageElement = document.getElementById("page");
	//LoadPage(-1, "page0");
}

//--------------------------
//
// Page control function
//
//--------------------------
function GetPage(key){
	if(key === "page0"){
		return `<div class = "pageinner" style="display:flex;justify-content:center" style="background-color:lightgray;"></div>`
	}
	if(key === "page1"){
		return `<div class = "pageinner" style="display:flex;justify-content:center"><div style="height:100%;width:80%;background-color:cyan;"></div></div>`
	}
	if(key === "page2"){
		return `<div class = "pageinner" style="display:flex;justify-content:center"><div style="height:100%;width:80%;background-color:blue;"></div></div>`
	}
	if(key === "page3"){
		return `<div class = "pageinner" style="display:flex;justify-content:center"><div style="height:100%;width:80%;background-color:red;"></div></div>`
	}
	return ``;
}

function LoadPage(direction, pageKey){

	console.log("load page");

	//create new page
	let newPage = document.createElement("div");
	let oldPage = document.getElementById("currPage");
	
	oldPage.id = "";
	
	newPage.classList.add("pageFrame");
	newPage.id = "currPage";
	newPage.innerHTML = GetPage(pageKey);

	//inject element
	if(direction === 1){
		oldPage.after(newPage);
	}else if(direction === -1){
		oldPage.before(newPage);
	}
	
	setTimeout((oldPage, newPage) => {
		newPage.classList.add("currPage");
		oldPage.classList.remove("currPage");
		setTimeout((oldPage)=>{oldPage.remove();}, 600, oldPage);
	}, 10, oldPage, newPage);
}

window.OnSwitchPage = function(direction, pageKey){
	LoadPage(direction, pageKey);
}


//--------------------------
//
// storage functions
//
//--------------------------
function SaveToSession(){
	sessionStorage.setItem(SessionStorageName, JSON.stringify(entryConfig));
}


//--------------------------
//
// land width functions
//
//--------------------------
window.OnChangeLandWidth = function(event){
	let value = event.target.value;
	if(value > LandMaxWidth){
		value = LandMaxWidth;
		event.target.value = value;
	}
	else if(value < LandMinWidth){
		value = LandMinWidth;
		event.target.value = value;
	}
	entryConfig.landWidth = parseFloat(value);
}

window.ToEditor = function(){
	SaveToSession();
	window.location.replace('/');
}
