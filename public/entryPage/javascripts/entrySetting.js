

//--------------------------
//
// global variable
//
//--------------------------
const LandMaxWidth = 100;
const LandMinWidth = 1;
const SessionStorageName = "entryConfig";
const editorLocation = "/";
const editorLoadingTime = 1000;

const Pages = {
	title:{
		content:`<div class="pageinner" style="/*background-color:green;*/"></div>`
	},

	page1:{
		content:`<div class = "pageinner" ><div style="height:100%;width:80%;background-color:cyan;"></div></div>`,
		onload: TestFunc
	},

	loadLocal:{
		content:`
<div class = "pageinner">
	<div class = "questionContainer">
		<span class="question">載入之前的存檔?</span>
		<div class="flowArea">
			<button class="next" onclick="OnSwitchPage(1, 'selectRoadType')">新的道路</button>
			<button class="next" onclick="OnSwitchPage(-1, 'ToEditor')">載入存檔</button>
		</div>
	</div>
</div>
`
	},

	ToEditor:{
		content:`
		<div class = "pageinner" style="background-color:green">
		</div>
		`,
		onload:ToEditorCallback
	},

	selectRoadType:{
		content:`
<div class = "pageinner" >
	<div class="questionContainer">
		<span class="question">請選擇道路種類</span>
		<select id="roadTypeSelect" class="form-select form-select-lg mb-5" aria-label=".form-select-lg example" config="roadType" onchange="SaveOnChange(event);">
			<option value="primary" >主要/次要道路</option>
			<option value="service">服務性道路</option>
		</select>
		<div class="flowArea">
			<button class="prev" onclick="OnSwitchPage(-1, 'loadLocal')">上一步</button>
			<button class="next" onclick="OnSwitchoutRoadType('selectRoadSide')">下一步</button>
		</div>
	</div>
</div>
		`,
		onload:OnLoadSelectRoadType,
	},

	selectRoadSide:{
		content:`
<div class = "pageinner" >
	<div class="questionContainer">
		<span class="question">請選擇鄰接土地建物型式</span>
		<select id="roadSideSelect" class="form-select form-select-lg mb-5" aria-label=".form-select-lg example" config="hasArcade" onchange="SaveOnChange(event);">
			<option value="false" >無 騎樓 / 退縮空間</option>
			<option value="true">有 騎樓 / 退縮空間</option>
		</select>
		<div class="flowArea">
			<button class="prev" onclick="OnSwitchPage(-1, 'selectRoadType')">上一步</button>
			<button class="next" onclick="OnSwitchoutRoadSide('inputRoadWidth')">下一步</button>
		</div>
	</div>
</div>
		`,
		onload:()=>{RestoreValue("roadSideSelect")},
	},

	inputRoadWidth:{
		content:`
<div class = "pageinner" >
	<div class="questionContainer">
		<span class="question">請選擇入腹地寬度</span>
		<div class="input-group mb-3 mt-4" style="max-height:40px; overflow:hidden;">
			<input id="roadWidthInput" onchange="OnChangeLandWidth(event);" type="number" class="form-control" value="15" min="1" max="100" step="0.1" aria-describedby="basic-addon1" onchange="OnChangeLandWidth(event);">
			<span class="input-group-text" id="basic-addon1">m</span>
		</div>
		<div class="flowArea">
			<button class="prev" onclick="OnSwitchPage(-1, 'selectRoadSide')">上一步</button>
			<button class="next" onclick="OnSwitchoutRoadWidth('getTemplate')">下一步</button>
		</div>
	</div>
</div>
		`,
		onload:()=>{RestoreValue("roadSideSelect")},
	},

	getTemplate:{
		content:`
<div class = "pageinner" >
	<div class="questionContainer">
		<span class="question">輸入模板</span>
		<div class="input-group mb-3 mt-4" style="max-height:40px; overflow:hidden;">
			<input id="roadTemplateInput" type="text" class="form-control" aria-describedby="basic-addon1" onchange="SaveOnChange(event);" config ="template">
		</div>
		<div class="flowArea">
			<button class="prev" onclick="OnSwitchPage(-1, 'inputRoadWidth')">上一步</button>
			<button class="next" onclick="OnSwitchoutRoadTemplate()">開始編輯</button>
		</div>
	</div>
</div>
		`,
		onload:()=>{RestoreValue("roadTemplateInput")},
	}
}


let hasTempStorage = false;

let PageElement = document.getElementById("page");

let entryConfig = {
	loadExtern: false,
	landWidth: 15,
	roadType: "primary",
	hasArcade: "false",
	template: ""
};



//--------------------------
//
// initialization functions
//
//--------------------------
window.OnLoad = function(){
	let tempStorage = localStorage.getItem("tempStorage");

	console.log("load");
	PageElement = document.getElementById("page");

	//setup default page
	PageElement.innerHTML = `<div id="currPage" class="pageFrame currPage">${Pages.title.content}</div>`;

	if(tempStorage){
		setTimeout(()=>{LoadPage(1, "loadLocal");}, 500);
		hasTempStorage = true;
	}else{
		setTimeout(()=>{LoadPage(1, "selectRoadType");}, 500);

	}
}

//--------------------------
//
// Page control function
//
//--------------------------
function LoadPage(direction, pageKey){
	//create new page
	let newPage = document.createElement("div");
	let oldPage = document.getElementById("currPage");
	let newPageInfo = Pages[pageKey];

	if(newPageInfo === undefined)return;

	oldPage.removeAttribute("id");
	
	newPage.classList.add("pageFrame");
	newPage.id = "currPage";
	newPage.innerHTML = newPageInfo.content;

	//inject element
	if(direction === 1){
		oldPage.after(newPage);
	}else if(direction === -1){
		oldPage.before(newPage);
	}
	
	if(newPageInfo.onload){
		setTimeout((target, callback)=>{callback(target);}, 10, newPage, newPageInfo.onload);
	}

	setTimeout((oldPage, newPage) => {
		newPage.classList.add("currPage");
		oldPage.classList.remove("currPage");
		setTimeout((oldPage)=>{oldPage.remove();}, 400, oldPage);
	}, 10, oldPage, newPage);
}

function ToEditorCallback(page){
	setTimeout(()=>{window.location.href = editorLocation;}, editorLoadingTime);
}

window.OnSwitchPage = function(direction, pageKey){
	LoadPage(direction, pageKey);
}

function TestFunc(page){
	console.log(entryConfig);
}


//--------------------------
//
// storage functions
//
//--------------------------
function SaveToSession(){
	sessionStorage.setItem(SessionStorageName, JSON.stringify(entryConfig));
}

function RestoreValue(id){
	let target = document.getElementById(id);
	let prop = target.getAttribute("config");

	target.value = entryConfig[prop];
}

window.SaveOnChange = function(event){
	let target = event.target;
	let prop = target.getAttribute("config");

	entryConfig[prop] = target.value;
}

function ToEditorWithSetting(){
	SaveToSession();
	LoadPage(1, 'ToEditor');
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

window.OnSwitchoutRoadWidth = function(nextPage){
	//console.log( document.getElementById("roadWidthInput"));
	let value = document.getElementById("roadWidthInput").value;
	if(value > LandMaxWidth){
		value = LandMaxWidth;
	}
	else if(value < LandMinWidth){
		value = LandMinWidth;
	}
	entryConfig.landWidth = parseFloat(value);

	LoadPage(1, nextPage);
}


//--------------------------
//
// road type functions
//
//--------------------------
function OnLoadSelectRoadType(page){
	RestoreValue("roadTypeSelect");
	if(hasTempStorage)return;
	page.getElementsByClassName("prev")[0].remove();
}

window.OnSwitchoutRoadType = function(nextPage){
	entryConfig.roadType = document.getElementById("roadTypeSelect").value;
	LoadPage(1, nextPage);
}

//--------------------------
//
// road side functions
//
//--------------------------
window.OnSwitchoutRoadSide = function(nextPage){
	entryConfig.hasArcade = document.getElementById("roadSideSelect").value;
	LoadPage(1, nextPage);
}

//--------------------------
//
// road template functions
//
//--------------------------
window.OnSwitchoutRoadTemplate = function(){
	entryConfig.template = document.getElementById("roadTemplateInput").value;

	if(entryConfig.template === ""){
		entryConfig.loadExtern = false;
	}else{
		entryConfig.loadExtern = true;
	}

	ToEditorWithSetting();
}


