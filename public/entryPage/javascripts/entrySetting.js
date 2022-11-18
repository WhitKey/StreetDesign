

//--------------------------
//
// global variable
//
//--------------------------
const LandMaxWidth = 100;
const LandMinWidth = 1;
const SessionStorageName = "entryConfig";

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
