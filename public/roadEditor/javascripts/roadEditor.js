

//--------------------
//
//Global Variables
//
//--------------------

//element entries
let landElement = document.getElementById("land");
let editorElement = document.getElementById("editor");
let mainWindowElement = document.getElementById("mainWindow");
let propertyEditorElement = document.getElementById("mainWindow");
let markingSpaceElement = document.getElementById("markingSpace");
let redoButtonElement = document.getElementById("redoButton");
let undoButtonElement = document.getElementById("undoButton");
let nextButtonElement = document.getElementById("nextButton");
let prevButtonElement = document.getElementById("prevButton");
let warningPopupElement = document.getElementById("warningPopup");
let midErrorWindowElement = document.getElementById("midErrorWindow");
let typeColoringModeButtonElement = document.getElementById("typeColoringModeBtn");
let importFromSectionButtonElement = document.getElementById("sectionImportButton");

//road element template
let roadTemplate = document.getElementById("land");
let sidewalkTemplate = document.getElementById("land");
let bollardTemplate = document.getElementById("land");
let roadComponentTemplate = document.getElementById("land");
let slowlaneTemplate = document.getElementById("land");
let templateBase = {};

//road layout editor variable
let dragElement = null;
let dragRecord = null;

//-1: trashcan
//-2: miss
// >= 0: hit position
let dragDest = null;
let oriDest = null;
let placeholderId = 0;
let placeholderPos = null;
let componentCounter = 0;
let draging = false;

//landwidth 
let landWidth = 15;

//conponent layout
let roadSegmentRecord = [];
let undoStack = [];
let redoStack = [];
let maxStackStep = 50;
let tempVariables = {};

//stage indecator
let typeColoringMode = false;
let currentStage = 0;
const StageName = {
	0:"道路段",
	1:"儲車段",
	2:"漸變段",
}

//conponent default data
let componentMinWidth = {
	"road": 0.1,
	"sidewalk": 1.5,
	"bollard": 0.5,
	"shoulder" : 0.1,
	"slowlane": 0.1,
};

let componentDefaultWidth = {
	"road": 3,
	"sidewalk": 1.5,
	"bollard": 0.5,
	"shoulder": 0.5,
	"slowlane": 2,
};

const componentConstantProperty = {
	"road":{
		"pointyEnd":false,
	},
	"sidewalk":{
		"pointyEnd":false,
	},
	"bollard":{
		"pointyEnd":true,
	},
	"shoulder":{
		"pointyEnd":true,
	},
	"slowlane":{
		"pointyEnd":false,
	},
}

const componentDefaultProperty = {
	"bollard" : {
		"type":"bollard",
		"width": componentDefaultWidth['bollard'],
	},

	"road" : {
		"type":"road",
		"width": componentDefaultWidth['road'],
		"direction": 3,
		"exitDirection": 7,
		"crossability":3,
	},

	"sidewalk":{
		"type": "sidewalk",
		"width": componentDefaultWidth['sidewalk'],
	},
	"shoulder":{
		"type": "shoulder",
		"width": componentDefaultWidth['shoulder'],
	},
	"slowlane":{
		"type": "slowlane",
		"width": componentDefaultWidth['slowlane'],
		"direction": 3,
	},
};

const componentLayout = {
	'road': ["direction", "exitDirection", "crossability"],
	'bollard':[],
	'sidewalk':[],
	'shoulder':[],
	'slowlane':["direction"],
}

const DesignStage = [
	"road",
	"stop",
	"intermidiate"
];

const TempStorageTemplate = {
	landWidth: 15,
	stage: 0,
	tempVersion: "1",
	hasArcade: false,
	roadType: "primary",
}

const ComponentType2Name = {
	shoulder:"停車帶",
	road:"車道",
	sidewalk:"人行道",
	bollard:"分隔島",
	slowlane:"慢車道"
}

//left slide out variables
let leftSlidoutOn = false;

//-----------------------
//
// Utility functions
//
//-----------------------
function GetComponentIdx(component){
	return (Array.prototype.slice.call(landElement.getElementsByClassName("drag")).indexOf(component));
}

function M2Px(width){
	return (width / landWidth) * landElement.clientWidth;
}

function M2Percent(width){
	return `${100 * (width / landWidth)}%`;
}

function PreventDefault(event){
	event.preventDefault();
}

function LineLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4){
	let tempA = (x3 * y4 - y3 * x4);
	let tempB = (x1 - x2) * (y3 - y4) - (y1 - y2)*( x3 - x4);
	let tempC = (x1 * y2 - y1 * x2);

	return [(tempC * (x3 - x4) - (x1 - x2) * tempA) / tempB, (tempC * (y3 - y4) - (y1 - y2) * tempA) /tempB];
}

//-------------------------
//
//Initialization functions
//
//-------------------------
function LandInit() {
	let sidebarElement = document.getElementById("sidebar");
	
	dragElement = null;
	componentCounter = 0;
	draging = false;
	roadSegmentRecord = [];
	redoStack = [];
	undoStack = [];
	maxStackStep = 50;

	landElement = document.createElement("div");
	document.getElementById(`${DesignStage[currentStage]}Section`).appendChild(landElement);
	landElement.setAttribute("id", "land");
	landElement.innerHTML = `<svg id="markingSpace" class="markingSpace"></svg>`;
	markingSpaceElement = document.getElementById("markingSpace");
	
	sidebarElement.classList.remove("intermidiate");
	document.getElementById("stopSection").classList.remove("intermidiate");
	document.getElementById("roadSection").classList.remove("intermidiate");

	document.addEventListener("keydown", KeyEventHnadler);
}

function IntermidiateStageInit(){
	let sectionElement = document.getElementById(`${DesignStage[currentStage]}Section`);
	let sidebarElement = document.getElementById("sidebar");
	dragElement = null;
	draging = false;
	roadSegmentRecord = [];
	redoStack = [];
	undoStack = [];
	maxStackStep = 50;

	landElement = document.createElement("div");

	sectionElement.innerHTML = "";
	sectionElement.appendChild(landElement);
	landElement.setAttribute("id", "land");
	landElement.classList.add("intermidiate");
	landElement.innerHTML = `<svg id="markingSpace" class="markingSpace"></svg>`;
	markingSpaceElement = document.getElementById("markingSpace");

	sidebarElement.classList.add("intermidiate");
	document.getElementById("stopSection").classList.add("intermidiate");
	document.getElementById("roadSection").classList.add("intermidiate");
}

function InitElementVariables(){
	//set element
	editorElement = document.getElementById("editor");
	mainWindowElement = document.getElementById("mainWindow");
	propertyEditorElement = document.getElementById("propertyEditor");

	//button elements
	redoButtonElement = document.getElementById("redoButton");
	undoButtonElement = document.getElementById("undoButton");
	nextButtonElement = document.getElementById("nextButton");
	prevButtonElement = document.getElementById("prevButton");
	typeColoringModeButtonElement = document.getElementById("typeColoringModeBtn");
	importFromSectionButtonElement = document.getElementById("sectionImportButton");

	//window element
	warningPopupElement = document.getElementById("warningPopup");
	midErrorWindowElement = document.getElementById("midErrorWindow");

	//get template element from document
	templateBase["road"] = document.getElementById("roadTemplate").cloneNode(true);
	templateBase["sidewalk"] = document.getElementById("sidewalkTemplate").cloneNode(true);
	templateBase["bollard"] = document.getElementById("bollardTemplate").cloneNode(true);
	templateBase["shoulder"] = document.getElementById("shoulderTemplate").cloneNode(true);
	templateBase["slowlane"] = document.getElementById("slowlaneTemplate").cloneNode(true);

	//setting template
	templateBase["road"].removeAttribute("id");
	templateBase["sidewalk"].removeAttribute("id");
	templateBase["bollard"].removeAttribute("id");
	templateBase["shoulder"].removeAttribute("id");
	templateBase["slowlane"].removeAttribute("id");

	//setting road component template
	roadComponentTemplate = document.getElementById("roadComponentTemplate").cloneNode(true);
	roadComponentTemplate.removeAttribute("id");

}

function LoadEntryConfig(){
	let entryConfig = JSON.parse(sessionStorage.getItem("entryConfig"));
	let temp;
	
	if(entryConfig === null){
		console.log("restore from prev");
		return LoadPrevSession();
	}
	if(entryConfig.loadLocal){
		console.log("load from prev");
		return LoadPrevSession();
	}
	
	localStorage.removeItem("tempStorage");
	sessionStorage.removeItem("entryConfig");
	console.log("load from entry config");

	temp = TempStorageTemplate;
	
	//setting up temp storage
	temp.hasArcade = entryConfig.hasArcade === "true";
	temp.roadType = entryConfig.roadType;
	temp.landWidth = entryConfig.landWidth;

	//setting up land width
	landWidth = entryConfig.landWidth;

	//load extern template
	if(entryConfig.loadExtern && TemplateVerify(entryConfig.template, entryConfig)){
		console.log("load template");
		let template = JSON.parse(entryConfig.template);
		if( template.section.road){
			temp.road = template.section.road;
		}
		if( template.section.stop){
			temp.stop = template.section.stop;
		}
		if( template.section.intermidiate){
			temp.intermidiate = template.section.intermidiate;
		}
		
		localStorage.setItem("tempStorage", JSON.stringify(temp));
		return temp[DesignStage[currentStage]];
	}

	// setting up limition

	localStorage.setItem("tempStorage", JSON.stringify(temp));
	return null;

}

function LoadPrevSession(){
	let temp = TempStorageTemplate;
	temp.landWidth = landWidth;

	//load previous work session
	let tempStorage = localStorage.getItem("tempStorage");

	if(tempStorage !== null){
		tempStorage = IntermidiateStageTempStorageRefit();
		if(temp.tempVersion !== tempStorage.tempVersion){
			console.log("temp storage version mismatch");
			localStorage.setItem("tempStorage", JSON.stringify(temp));
		}else if(tempStorage.confirm === 1){
			console.log("tempStorage confirmed");
			location.href = "../present";
			return null;
		}else{
			console.log("temp storage match");
			currentStage = tempStorage.stage;
			if(tempStorage[DesignStage[currentStage]]){
				landWidth = tempStorage.landWidth;
				return tempStorage[DesignStage[currentStage]];
			}
		}
	}else{
		console.log("temp storage not found");
		localStorage.setItem("tempStorage", JSON.stringify(temp));
	}
	return null;
}

function RebuildUnusedSection(){
	let storage = JSON.parse(localStorage.getItem("tempStorage"));
	if(storage === null) return;
	DesignStage.forEach(stage => {
		if(storage[stage] && stage !== DesignStage[currentStage] && stage !== "intermidiate"){
			document.getElementById(`${stage}Section`).innerHTML = MakeRoadSegmentHTML(storage[stage]);
		}
	});

	UnusedMarkingSpaceInit(true, currentStage === 2);
}

window.OnLoad = function() {
	let prevRecord;
	let targetSection;
	console.log("load");

	//initialize temp variavbles
	tempVariables['road'] = {
		'redo':'[]',
		'undo':'[]' 
	}
	tempVariables['stop'] = {
		'redo':'[]',
		'undo':'[]' 
	}

	prevRecord = LoadEntryConfig();
	
	LandInit();
	InitElementVariables();

	setTimeout(() =>{RebuildUnusedSection();}, 200);
	
	targetSection = document.getElementById(`${DesignStage[currentStage]}Section`);
	targetSection.classList.remove("unusedSection");
	targetSection.classList.add("usingSection");

	if(currentStage === 2){
		EnterIntermidiateStage();
	}

	StageVerify();
	UpdatePrevButtonVis();
	UpdateSidewalkMinWidth();

	
	if(prevRecord !== null){
		ImportRoadSegmentRecordJSON(prevRecord, false);
		
		if(currentStage !== 2){
			markingSpaceElement.style.opacity = "0";
			markingSpaceElement.style.transitionDuration = "500ms";
			setTimeout(()=>{
				UpdateMarkingSpace();
				markingSpaceElement.style.opacity = "1";
				setTimeout(()=>{
					markingSpaceElement.style.removeProperty("opacity");
					markingSpaceElement.style.removeProperty("transition-duration");
				}, 550);
				
			}, 300);
		}else{
			setTimeout(()=>{
				RenderIntermidiateStage();
			}, 300);

		}
		UpdatePrevButtonVis();
	}

		
	//initialize landwidth indicator
	document.getElementById("landWidthIndicator").innerText = landWidth.toString();

	//initialize total stage count
	document.getElementById("totalStageCount").innerText = "3";

	//info bar update(stage name, width info)
	InfoBarSectionSwitch();
}

function ImportRoadSegmentRecordJSON(json, updateMarking = true){
	if(currentStage === 2){
		//overwrite roadSegmentRecord
		roadSegmentRecord = json;
		
		if(updateMarking){
			//Render
			RenderIntermidiateStage();
		}
	}else{
		ClearRoadSegmentRecord();
		
		//construct html
		for(let i = 0;i< json.length;++i){
			let componentType = json[i].type;
			let component = roadComponentTemplate.cloneNode(true);
	
	
			//set up new component
			component.id = "comp" + componentCounter.toString();
			component.style.width = M2Percent(json[i].width);
			component.setAttribute("component", componentType);
			component.appendChild(templateBase[componentType].cloneNode(true));
			landElement.appendChild(component);
			++componentCounter;
		}
		
		//overwrite roadSegmentRecord
		roadSegmentRecord = json;
	
		//update marking and icon
		if(updateMarking){
			UpdateMarkingSpace();
		}
		UpdateRoadExitDirectionIcon();
	}
	StageVerify();
}

function ExportRoadSegmentRecordJSON(){
	return JSON.parse(JSON.stringify(roadSegmentRecord));
}

function UnusedMarkingSpaceInit(ruler = true, auxWorkspaceFlag = false, removeAux = true){
	let sectionElement;
	let sectionSvgElement;
	let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));

	for(let i = 0; i < 2;++i){
		if(i === currentStage)continue;
		let newMarking = "";
		let newAnchor = "";
		let widthSum = 0;
		let record = tempStorage[DesignStage[i]];
		let anchorWidth = M2Percent(0.3);
		let anchorWOffset = 0.15;
		let anchorAlign;

		sectionElement = document.getElementById(`${DesignStage[i]}Section`);

		if(tempStorage[DesignStage[i]]){
			newMarking = CreateNewMarking(tempStorage[DesignStage[i]], sectionElement.clientHeight - 10, 20, ruler, i===1);
		}

		sectionSvgElement = sectionElement.getElementsByClassName("markingSpace");
		for(let j = 0;j<sectionSvgElement.length;++j){
			sectionSvgElement[j].remove();
		}
		sectionElement.innerHTML +=   `<svg class="markingSpace">${newMarking}</svg>`;

		if(auxWorkspaceFlag){
			//setup aux workspace
			if(i == 0){
				anchorAlign = "top";
			}else{
				anchorAlign = "bottom";
			}
			for(let recordIdx = 0; recordIdx < record.length;++recordIdx){
				//console.log(record[recordIdx]);
				if(recordIdx === 0){
					newAnchor += `<div id="${DesignStage[i]}PointAnchor_${recordIdx}" class="anchor" index="${recordIdx}" style="${anchorAlign}:0px;left:${M2Percent(widthSum)};width:${M2Percent(0.15)};"></div>`;
				}else{
					newAnchor += `<div id="${DesignStage[i]}PointAnchor_${recordIdx}" class="anchor" index="${recordIdx}" style="${anchorAlign}:0px;left:${M2Percent(widthSum - anchorWOffset)};width:${anchorWidth};"></div>`;
				}
				widthSum += record[recordIdx].width;
			}
			newAnchor += `<div id="${DesignStage[i]}PointAnchor_${record.length}" class="anchor" index="${record.length}" style="${anchorAlign}:0px;left:${M2Percent(widthSum - anchorWOffset)};width:${M2Percent(0.15)};"></div>`;

			sectionElement.innerHTML += `<div id="${DesignStage[i]}AuxWorkspace" class="auxWorkspace">${newAnchor}</div>`;

		}else if(removeAux){
			if(document.getElementById("roadAuxWorkspace"))document.getElementById("roadAuxWorkspace").remove();
			if(document.getElementById("stopAuxWorkspace"))document.getElementById("stopAuxWorkspace").remove();
		}
	}
}

function UpdateSidewalkMinWidth(){
	if(landWidth < 8){
		componentMinWidth.sidewalk=0;
	}
}

//-----------------------------
//
//Component behavior functions
//
//-----------------------------
function InsertViewportComponent(index){
	let component = roadComponentTemplate.cloneNode(true);
	let record = roadSegmentRecord[index];
	let componentType =  record.type;

	component.id = "comp" + componentCounter.toString();
	component.style.width = M2Percent(record.width);

	component.setAttribute("component", componentType);
	component.appendChild(templateBase[componentType].cloneNode(true));
	landElement.insertBefore(component, landElement.getElementsByClassName("drag")[index]);
	++componentCounter;

}

function InsertComponentA(index, record){
	// road segment record operation
	tempVariables.state = JSON.parse(JSON.stringify(roadSegmentRecord));
	AddComponentRecord(index, record);
	PushUndoStack(tempVariables.state);

	// viewport operation
	InsertViewportComponent(index);
}

function InsertPlaceholder(index){
	const PlaceholderClass = ["roadComponent", "placeholder"];
	let placeholder = document.createElement("div");
	++placeholderId;
	let id = `placeholder_${placeholderId}`;

	placeholder.classList.add(...PlaceholderClass);
	placeholder.id = id;
	landElement.insertBefore(placeholder, landElement.getElementsByClassName("drag")[index]);
	placeholder.style.width = "0px";

	setTimeout((target, width) => {
		target.style.width = width;
	}, 10, placeholder, M2Percent(dragRecord.width));
	return id;
}

function RemoveViewportComponent(index){
	let target = landElement.getElementsByClassName("drag")[index];
	target.classList.remove("drag");
	target.style.width = "0px";
	
	setTimeout((target) => {
		target.style.display = "none";
		setTimeout((target) => {
			target.remove();
		}, 10000, target);
	}, 100, target);
}

function RemoveComponentA(index){
	tempVariables.state = JSON.parse(JSON.stringify(roadSegmentRecord));
	
	RemoveComponentRecord(index);
	
	PushUndoStack(tempVariables.state);

}

function RemovePlaceholder(id, instant = false){

	let target = document.getElementById(id);
	if(target === null)return;
	if(instant){
		target.remove();
		return;
	}
	setTimeout((target) => {
		target.style.width = "0px";
	
		setTimeout((target) => {
			target.remove();
		}, 150, target);
	}, 15, target);
}

function MoveComponentA(fromIdx, toIdx){

	if(dragRecord === null)return;
	if(fromIdx === toIdx){
		InsertViewportComponent(toIdx);
		return;
		
	}
	
	//if(toIdx > fromIdx)--toIdx;
	tempVariables.state = JSON.parse(JSON.stringify(roadSegmentRecord));
	RemoveComponentRecord(fromIdx);
	AddComponentRecord(toIdx, dragRecord);
	PushUndoStack(tempVariables.state);
	InsertViewportComponent(toIdx);

}

//----------------------------------------
//
//Component variabels management functions
//
//----------------------------------------
function CreateComponentRecord(compType){
	return JSON.parse(JSON.stringify(componentDefaultProperty[compType]));   
}

function GetComponentRecord(index){
	return roadSegmentRecord.slice(index, index + 1)[0];
}

function AddComponentRecord(index, record){
	roadSegmentRecord.splice(index, 0, record);
}

function RemoveComponentRecord(index){
	roadSegmentRecord.splice(index, 1);
}

function ClearRoadSegmentRecord(){
	dragElement = null;
	componentCounter = 0;
	draging = false;
	roadSegmentRecord = [];
	landElement.innerHTML = `<svg id="markingSpace" class="markingSpace"></svg>`;
	markingSpaceElement = document.getElementById("markingSpace");
}

//---------------------------------------
//
//Component dragging processing functions
//
//----------------------------------------
window.ComponentDragStart = function(event) {
	if(draging)return;

	//set touch event flag
	let touchevent = false;

	if (event.type == "touchstart") {
		event.preventDefault();
		touchevent = true;
	}

	draging = false;
	let target = event.srcElement;
	const xOffset = -target.clientWidth / 2;
	const yOffset = -target.clientHeight / 2;

	if (dragElement !== null) {
		return
	}

	//if draging placed component
	while (!target.classList.contains("drag")) {
		target = target.parentElement;
	}

	//preprocessing
	oriDest = null;
	dragDest = -2;
	dragElement = target.cloneNode(true);
	if(target.classList.contains("roadComponent")){
		console.log("old component");
		oriDest = GetComponentIdx(target);
		
		dragRecord = JSON.parse(JSON.stringify(roadSegmentRecord[oriDest]));
	}else{
		console.log("new component");
		dragRecord = JSON.parse(JSON.stringify(componentDefaultProperty[target.getAttribute("component")]));
	}

	//drag element setting
	dragElement.setAttribute("target", dragElement.id);
	dragElement.removeAttribute("id");
	dragElement.removeAttribute("onmousedown");
	dragElement.style.removeProperty("opacity");
	dragElement.style.width = target.clientWidth + "px";
	dragElement.style.height = target.clientHeight + "px";

	//move drag element to the poition of the pointer/finger
	dragElement.classList.add("draggingElement");
	dragElement.style.position = "absolute";

	//attach the draging element
	document.body.appendChild(dragElement);

	//adding  event listener
	if (touchevent) {
		setTimeout(()=>{document.body.addEventListener("touchmove", ComponentDrag);}, 10);
		document.body.addEventListener("touchend", ComponentDragEnd);
	} else {
		setTimeout(()=>{document.body.addEventListener("mousemove", ComponentDrag);}, 10);
		document.body.addEventListener("mouseup", ComponentDragEnd);
	}

}

window.ComponentDrag = function(event) {

	let isTouch = false;

	if(event.type === "touchmove"){
		event.preventDefault();
		isTouch = true;
		event = event.touches[0];
	}

	const target = dragElement;
	const xOffset = -target.clientWidth / 2;
	const yOffset = -target.clientHeight / 2;

	
	// set flag
	if (!draging) {
		//set the hit on flag
		landElement.classList.add("hitOn");
		landElement.setAttribute("hitOn", "");
		if (dragElement.classList.contains("roadComponent")) {
			editorElement.classList.add("hitOn");
			editorElement.setAttribute("hitOn", "");
		}
		
		// remove old element
		if(oriDest !== null){
			RemoveViewportComponent(oriDest);
		}
		draging = true;
	}

	target.style.left = event.clientX + xOffset + "px";
	target.style.top = event.clientY + yOffset + "px";
	let raycast = document.elementFromPoint(event.clientX, event.clientY);

	//raycast detection
	if(raycast.classList.contains("placeholder")){
		return;
	}

	if(raycast.id === "editor"){
		let editorPosRatio = (event.pageX - editorElement.offsetLeft) / editorElement.clientWidth;

		if(editorPosRatio <= 0.05){
			dragDest = 0;
		}else if(editorPosRatio >= 0.95){
			if(oriDest !== roadSegmentRecord.length - 1){
				if(oriDest === null){
					dragDest = roadSegmentRecord.length;
				}else{
					dragDest = roadSegmentRecord.length - 1;
				}
			}else{
				dragDest = oriDest;
			}
		}
	}else if(raycast.id === "land"){

		//insert to the most right of the land
		if(oriDest !== roadSegmentRecord.length - 1){
			if(oriDest === null){
				dragDest = roadSegmentRecord.length;
			}else{
				dragDest = roadSegmentRecord.length - 1;
			}
		}else{
			dragDest = oriDest;
		}

	}else if(raycast.id === "trashcan"){
		//delete the component
		dragDest = -1;
	}else{
		//insert / move the component
		
		raycast = raycast.closest(".component");
		if(raycast !== null) {
			let raycastParent = raycast.parentElement
			let hitComponentIdx = GetComponentIdx(raycastParent);
			let hitPos = (event.clientX - raycastParent.getBoundingClientRect().x) / raycastParent.clientWidth;
			
			//calculate where to put the component
			if(hitPos < 0)hitPos = 0;
			if(hitPos > 1)hitPos = 1;
			if(hitPos < 0.5){
				dragDest = hitComponentIdx;
			}else{
				dragDest = hitComponentIdx + 1;
			}

			
			if(hitComponentIdx < 0)dragDest = -2;

		}else{
			dragDest = -2;
		}
	}

	let insertPos = dragDest;

	if(dragDest === -2 && oriDest !== null){
		insertPos = oriDest;
	}

	if(placeholderPos !== insertPos){
		if(placeholderPos !== null && insertPos < 0){
			RemovePlaceholder(`placeholder_${placeholderId}`);
			placeholderPos = null;
		}else if(insertPos >= 0){
			if(placeholderPos !== null){
				RemovePlaceholder(`placeholder_${placeholderId}`);
			}

			placeholderPos = insertPos;
			InsertPlaceholder(insertPos);
		}
	}
}

window.ComponentDragEnd = function(event) {
	let isTouch = false;
	
	if(event.type === "touchend"){
		isTouch = true;
		document.body.removeEventListener("touchmove", ComponentDrag);
		document.body.removeEventListener("touchend", ComponentDragEnd);
	}else{
		document.body.removeEventListener("mousemove", ComponentDrag);
		document.body.removeEventListener("mouseup", ComponentDragEnd);
	}




	if (draging === false) {
		console.log("click");
		if(dragElement.classList.contains("roadComponent")){
			PropertySettingStart(dragElement.getAttribute("target"), dragElement.getAttribute("component"));
		}

	}else if(oriDest !== null && dragDest === -2){
			InsertViewportComponent(oriDest);
	}

	console.log("drag end");
	landElement.classList.remove("hitOn");
	landElement.removeAttribute("hitOn");
	editorElement.classList.remove("hitOn");
	editorElement.removeAttribute("hitOn");



	dragElement.remove();
	dragElement = null;

	// miss
	if(dragDest === -2){
		UpdateRoadExitDirectionIcon("drag");
		setTimeout(()=>{draging = false;}, 120);
		
		// cleanup placeholder
		if(placeholderPos !== null){
			RemovePlaceholder(`placeholder_${placeholderId}`, true);
			placeholderPos = null;
		}
		return;
	}

	// delete
	if(dragDest === -1){
		RemoveComponentA(oriDest);
		UpdateMarkingSpace();
		UpdateRoadExitDirectionIcon("drag");
		setTimeout(()=>{draging = false;}, 120);
		return;
	}

	// insert / move
	if(oriDest !== null){
		MoveComponentA(oriDest, dragDest);
	}else{
		InsertComponentA(dragDest, dragRecord);
	}

	UpdateMarkingSpace();
	UpdateRoadExitDirectionIcon("drag");
	setTimeout(()=>{draging = false;}, 120);
	
	// cleanup placeholder
	if(placeholderPos !== null){
		RemovePlaceholder(`placeholder_${placeholderId}`, true);
		placeholderPos = null;
	}
}


//---------------------------
//
//Property Setting functions
//
//---------------------------
function CreatePropertyCard(type = String, value = Number, compRecord, recordIdx = Number){
	let propertyTitle = "";
	let cardToggle = "";
	let index = "";
	let toggleValue = "";

	if(type === "direction"){
		propertyTitle = "上/下行";
		let toggleValue = "";
		let index = "";
		
		//下行
		index = "0";
		if(value & 0b1){
			toggleValue = "true";
		}else{
			toggleValue = "false";
		}
		cardToggle += `<div id="propertyToggle_${type}_${index}" class="propertyToggle enable ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="./images/straight_arrow.svg" style="transform: scaleY(-1); pointer-events: none;"></div>`;
		
		//上行
		index = "1";
		if(value & 0b10){
			toggleValue = "true";
		}else{
			toggleValue = "false";
		}
		cardToggle += `<div id="propertyToggle_${type}_${index}" class="propertyToggle enable ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="./images/straight_arrow.svg" style="pointer-events: none;"></div>`;

	}else if(type === "exitDirection"){
		propertyTitle = "出口方向";
		let enableFlag = "";
		let direction = compRecord["direction"];
		if(direction !==  3 && direction !== 0){
			enableFlag = "enable"
		}

		if(direction !== 1){
			//左轉
			index = "0";
			if(value & 0b1){
				toggleValue = "true";
			}else{
				toggleValue = "false";
			}
			cardToggle += `<div id="propertyToggle_${type}_${index}" class="propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="./images/left_arrow.svg" style="pointer-events: none;"></div>`;
			
			//直行
			index = "1";
			if(value & 0b10){
				toggleValue = "true";
			}else{
				toggleValue = "false";
			}
			cardToggle += `<div id="propertyToggle_${type}_${index}" class="propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="./images/straight_arrow.svg" style="pointer-events: none;"></div>`;
			
			//右轉
			index = "2";
			if(value & 0b100){
				toggleValue = "true";
			}else{
				toggleValue = "false";
			}
			cardToggle += `<div id="propertyToggle_${type}_${index}" class="propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="./images/right_arrow.svg" style="pointer-events: none;"></div>`;
		}else{
			//右轉
			index = "2";
			if(value & 0b100){
				toggleValue = "true";
			}else{
				toggleValue = "false";
			}
			cardToggle += `<div id="propertyToggle_${type}_${index}" class=" propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="./images/right_arrow.svg" style="pointer-events: none;transform:rotate(180deg);"></div>`;
			
			//直行
			index = "1";
			if(value & 0b10){
				toggleValue = "true";
			}else{
				toggleValue = "false";
			}
			cardToggle += `<div id="propertyToggle_${type}_${index}" class=" propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="./images/straight_arrow.svg" style="pointer-events: none;transform:rotate(180deg);"></div>`;
			
			//左轉
			index = "0";
			if(value & 0b1){
				toggleValue = "true";
			}else{
				toggleValue = "false";
			}
			cardToggle += `<div id="propertyToggle_${type}_${index}" class=" propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="./images/left_arrow.svg" style="pointer-events: none;transform:rotate(180deg);"></div>`;
		}
		

	}else if(type === "crossability"){
		propertyTitle = "標線設置";
		let iconPath = "";
		let enableFlag = "";


		//左側標線
		if(recordIdx !== 0&& roadSegmentRecord[recordIdx-1].type === "road"){
			enableFlag = "enable";
		}
		index = "0";
		if(value & 0b1){
			toggleValue = "true";
		}else{
			toggleValue = "false";
		}
		cardToggle += `<div id="propertyToggle_${type}_${index}" class="propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img class="true togglableImg" src="./images/break_line.svg" style="pointer-events: none;"><img class="false togglableImg" src="./images/solid_line.svg" style="pointer-events: none;"></div>`;
		
		//右側標線
		enableFlag = ""
		if(recordIdx < roadSegmentRecord.length - 1 && roadSegmentRecord[recordIdx + 1].type === "road"){
			enableFlag = "enable"
		}
		index = "1";
		if(value & 0b10){
			toggleValue = "true";
		}else{
			toggleValue = "false";
		}
		cardToggle += `<div id="propertyToggle_${type}_${index}" class="propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img class="true togglableImg" src="./images/break_line.svg" style="pointer-events: none;"><img class="false togglableImg" src="./images/solid_line.svg" style="pointer-events: none;"></div>`;
		
	}
	
	return `
	<div class="window card propertyCard" PropertyToggleBlock="${type}">
		<div class="card-header" style="overflow-x: hidden;">
			<h6 class="card-title" style="white-space: nowrap;">${propertyTitle}</h6>
		</div>
		<div class="card-body cardToggleCollection" style="display:flex; justify-content:space-around; overflow-x:hidden;">
			${cardToggle}
		</div>
	</div>
	`;
}

window.PropertySettingChange = function(event, type){
	let propertySettingElement = document.getElementById("propertySettings");
	let compIdx = parseInt(propertySettingElement.getAttribute("component_idx"));
	let componentElement = document.getElementById(propertyEditorElement.getAttribute("target"));
	let compType = componentElement.getAttribute("component");

	if(type === "width"){
		let newWidth = event.target.value;
		let refPercent = 100.0 / landWidth; // % per meter
		
		if(newWidth < componentMinWidth[compType]){
			event.target.value = componentMinWidth[compType];
			newWidth = componentMinWidth[compType];
		}

		console.log("update width");
		componentElement.style.width = (refPercent * parseFloat(newWidth)).toString() + "%";
		roadSegmentRecord[compIdx].width = parseFloat(newWidth);

		UpdateWidthInfo();
	}

	if(type === "crossability" || type==="width"){
		UpdateMarkingSpace();
	}

	tempVariables.propertySettingChangeFlag = true;
}

async function PropertySettingStart(compId, compType){
	tempVariables.state = JSON.parse(JSON.stringify(roadSegmentRecord));

	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	
	let target = document.getElementById(compId);

	while(leftSlidoutOn){
		console.log("slide out conflict");
		await sleep(500);
	}
	leftSlidoutOn = true;

	if(!target.classList.contains("selected")){
		target.classList.add("selected");
	}

	SetLeftSlideout(true);
	propertyEditorElement.setAttribute("target", compId);

	document.body.addEventListener("mousedown", PropertySettingExitTrigger);
	document.body.addEventListener("touchstart", PropertySettingExitTrigger, {passive: true});

	ConfigPropertySetting(compId, compType);

	//target.removeAttribute("onmousedown");
	//target.removeAttribute("ontouchstart");
	//target.removeEventListener("mousedown", ComponentDragStart);
	//target.removeEventListener("touchstart", ComponentDragStart);
}

function ConfigPropertySetting(compId, compType){

	let compIdx = GetComponentIdx(document.getElementById(compId));
	let propertyRecord =  GetComponentRecord(compIdx);
	let propertyCards = "";
	let cardLayout = componentLayout[propertyRecord["type"]];

	for(let i = 0; i < cardLayout.length; ++i){
		propertyCards += (CreatePropertyCard(cardLayout[i], propertyRecord[cardLayout[i]], propertyRecord, compIdx));
	}

	//set up property editor
	propertyEditorElement.innerHTML = `
	<div class="propertySettingFrame">
		<h1 style="max-height:45px; overflow:hidden;flex-shrink:0;">屬性設定</h1>
		<div id="propertySettings" component_idx=${compIdx}>
			<div class="componentTypeDisplay"> ${ComponentType2Name[compType]} </div>
			<div class="input-group mb-1 mt-1" style="max-height:40px; overflow:hidden;">
				<span class="input-group-text" id="basic-addon1" style="white-space: nowrap;">寬度</span>
				<input onchange="PropertySettingChange(event, 'width');" type="number" class="form-control" value="${propertyRecord['width']}" min="${componentMinWidth[compType]}" step="0.1" aria-describedby="basic-addon1">
				<span class="input-group-text" id="basic-addon1">m</span>
			</div>
			<div id="propertyToggles">
				${propertyCards}
			</div>
		</div>
	</div>
	`;
}

function SetLeftSlideout(value){
	if(value === true){
		if(!mainWindowElement.classList.contains("clickOn")){
			mainWindowElement.classList.add("clickOn");
		}
	}else{
		if(mainWindowElement.classList.contains("clickOn")){
			mainWindowElement.classList.remove("clickOn");
		}
	}
}

window.PropertySettingExitTrigger = function(event = null){
	let target;
	let check = false;
	
	if(event !== null){
		target = event.target;
		while(target){
			if(target.id === "leftSlideout" || target.classList.contains("propertyConfig")){
				check = true;
				break;
			}
			target = target.parentElement;
		}
	}

	if(check){
		console.log("click on config");
	}else{
		SetLeftSlideout(false);
		propertyEditorElement.innerHTML = "";
		document.body.removeEventListener("mousedown", PropertySettingExitTrigger);
		document.body.removeEventListener("touchstart", PropertySettingExitTrigger);
		let target = document.getElementById(propertyEditorElement.getAttribute("target"));
		target.classList.remove("selected");
		target.addEventListener("mousedown", ComponentDragStart);
		target.addEventListener("touchstart", ComponentDragStart, {passive: true});
		leftSlidoutOn = false;
		if(tempVariables.propertySettingChangeFlag === true){
			PushUndoStack(tempVariables.state);
		}
		tempVariables.propertySettingChangeFlag = undefined;
	}

}

//-------------------------------
//
// Property Toggle Functions
//
//-------------------------------
window.PropertyToggleCallbackTest = function(event){
	console.log("eventCallback");
}

window.RerenderPropertyToggle = function(event){
	let toggleBlock = document.getElementById("propertyToggles");
	let recordIdx = parseInt(document.getElementById("propertySettings").getAttribute("component_idx"));
	let propertyRecord = GetComponentRecord(recordIdx);
	let cardLayout = componentLayout[propertyRecord["type"]];
	let propertyCards = "";

	for(let i = 0; i < cardLayout.length; ++i){
		propertyCards += (CreatePropertyCard(cardLayout[i], propertyRecord[cardLayout[i]], propertyRecord, recordIdx));
	}
	console.log("rerender property config");
	toggleBlock.innerHTML = propertyCards;
	UpdateRoadExitDirectionIcon("drag");
	UpdateMarkingSpace();
}

window.PropertyToggleTrigger = function(event, callback = null){
	let recordIndex = parseInt(document.getElementById("propertySettings").getAttribute("component_idx"));
	let targetElement = event.target;
	let oriValue = targetElement.getAttribute("value");
	let maskIndex = parseInt(targetElement.getAttribute("index"));
	let type = targetElement.getAttribute("type");

	if(oriValue === undefined)return;
	
	if(!targetElement.classList.contains("enable")){
		console.log("toggle disabled");
		return;
	}

	if(oriValue === "true"){
		if(type === "exitDirection" && (roadSegmentRecord[recordIndex][type] & ~(1<<maskIndex)) === 0){
			return;
		}else{
			targetElement.classList.remove("true");
			targetElement.classList.add("false");
			targetElement.setAttribute("value", "false");
			roadSegmentRecord[recordIndex][type] &= ~(1<<maskIndex);
	
			if(type === "direction"){
				roadSegmentRecord[recordIndex][type] |= 1<< (1-maskIndex);
			}
		}

	}else{
		targetElement.classList.remove("false");
		targetElement.classList.add("true");
		targetElement.setAttribute("value", "true");
		roadSegmentRecord[recordIndex][type] |= 1<<maskIndex;
	}

	RerenderPropertyToggle();
	if(callback !== null) callback(event);
	tempVariables.propertySettingChangeFlag = true;
}

function UpdateRoadExitDirectionIcon(componentId = "roadComponent"){
	let uiList = landElement.getElementsByClassName(componentId);
	for(let i = 0;i<uiList.length && i < roadSegmentRecord.length;++i){
		
		//road
		if(roadSegmentRecord[i].type === "road"){
			let iconContainer = uiList[i].getElementsByClassName("roadComponentIcon")[0];
			let direction = roadSegmentRecord[i].direction;
			let exitDirection = roadSegmentRecord[i].exitDirection;
			let iconSrc = "";
			iconContainer.innerHTML = "";
			
			//下行
			if (direction !== 2){
				if(!iconContainer.classList.contains("rot180"))iconContainer.classList.add("rot180");
			}//上行
			else{
				if(iconContainer.classList.contains("rot180"))iconContainer.classList.remove("rot180");
			}
			
			if(direction !== 3){
				if(exitDirection === 0)continue;
				if(exitDirection === 1) iconSrc = "./images/left_arrow.svg";
				else if(exitDirection === 2) iconSrc = "./images/straight_arrow.svg";
				else if(exitDirection === 3) iconSrc = "./images/straight_left_arrow.svg";
				else if(exitDirection === 4) iconSrc = "./images/right_arrow.svg";
				else if(exitDirection === 5) iconSrc = "./images/left_right_arrow.svg";
				else if(exitDirection === 6) iconSrc = "./images/straight_right_arrow.svg";
				else if(exitDirection === 7) iconSrc = "./images/three_way_arrow.svg";
			}else{
				iconSrc = "./images/double_arrow.svg";
			}
			iconContainer.innerHTML = `<img src="${iconSrc}"  draggable="false">`;
		}//slow lane
		else if(roadSegmentRecord[i].type === "slowlane"){
			let iconContainer = uiList[i].getElementsByClassName("roadComponentIcon")[0];
			let direction = roadSegmentRecord[i].direction;
			let iconSrc = "";

			iconContainer.innerHTML = "";
			
			//下行
			if (direction !== 2){
				if(!iconContainer.classList.contains("rot180"))iconContainer.classList.add("rot180");
			}//上行
			else{
				if(iconContainer.classList.contains("rot180"))iconContainer.classList.remove("rot180");
			}
			
			if(direction !== 3){
				iconSrc = "./images/straight_arrow.svg";
			}else{
				iconSrc = "./images/double_arrow.svg";
			}
			iconContainer.innerHTML = `<img src="${iconSrc}"  draggable="false">`;
		}
	}
}

//-------------------------------
//
// shortcut functions
//
//-------------------------------
function KeyEventHnadler(event){
	let key = event.code;

	if(key === "ArrowRight"){
		MoveSelect(1, event);

	}else if(key === "ArrowLeft"){
		MoveSelect(-1, event);
	
	}else if(key === "Delete"){
		DeleteKey(event);
	
	}else if(key === "KeyZ" && event.ctrlKey){
		RedoUndoKey(event);
	
	}else if(key === "Escape"){
		PropertyEscape(event);

	}
}

function DeleteKey(event){
	if(currentStage >= 2)return;
	let targetId = propertyEditorElement.getAttribute("target");
	let recordIdx;

	if(targetId === null)return
	recordIdx = GetComponentIdx(document.getElementById(targetId));

	PropertySettingExitTrigger();

	//delete component
	RemoveViewportComponent(recordIdx);
	RemoveComponentA(recordIdx);
	
	//update ui
	UpdateMarkingSpace();
	UpdateRoadExitDirectionIcon("drag");

	//select next component
	if(recordIdx >= roadSegmentRecord.length)return;
	let nextComponent =  landElement.getElementsByClassName("drag")[recordIdx];
	PropertySettingStart(nextComponent.id, nextComponent.getAttribute("component"));

}

function MoveSelect(direction, event){
	if(currentStage >= 2)return;
	let targetId = propertyEditorElement.getAttribute("target");
	let recordIdx;
	let nextPos = direction;
	let nextComponent;

	if(targetId === null)return;

	//get next component
	recordIdx = GetComponentIdx(document.getElementById(targetId));
	nextPos += recordIdx;
	if(nextPos >= roadSegmentRecord.length || nextPos < 0)return;
	nextComponent = landElement.getElementsByClassName("drag")[nextPos];

	//switch property setting page
	PropertySettingExitTrigger();
	PropertySettingStart(nextComponent.id, nextComponent.getAttribute("component"));
}

function RedoUndoKey(event){
	if(currentStage < 2){
		if(mainWindowElement.classList.contains("clickOn")){
			PropertySettingExitTrigger();
		}
	}

	if(event.shiftKey){
		//ctrl + shift + z
		OnRedo();
	}else{
		//ctrl + z
		OnUndo();
	}
}

function PropertyEscape(event){
	if(currentStage >= 2)return;
	if(propertyEditorElement.getAttribute("target") === null)return;
	PropertySettingExitTrigger();
}

//-------------------------------------
//
//Marking space functions
//
//-------------------------------------
function ClearMarkingSpace(){
	markingSpaceElement.innerHTML = "";
	console.log("clear marking");
}

function CreateVerticalMarking(color, x, type, markingWidth, offsetIndex = 0, dashLineOverride = -1){
	let y = landElement.clientHeight;
	let rtn = "";
	let xInc= 0;
	let dashedLength = M2Px(1);

	if(dashLineOverride !== -1){
		dashedLength = dashLineOverride;
	}

	if(type.length === 2){
		if((type[0] !== 0) && (type[1]!==0)){
			type = [type[0]];
		}
	}
	xInc = markingWidth / 2 + x - (((2 * type.length) - 1) / 2 * markingWidth) + offsetIndex * (((2 * type.length) - 1) / 2 * markingWidth);

	for(let i = 0;i<type.length;++i){
		if(type[i] === 0){//solid line
			rtn += `<path class="marking" d="M ${xInc} 0 L ${xInc} ${y}" stroke="${color}" stroke-width="${markingWidth}"/>`
		}else{// dashed line
			rtn += `<path class="marking" d="M ${xInc} 0 L ${xInc} ${y}" stroke="${color}" stroke-width="${markingWidth}" stroke-dasharray="${dashedLength}"/>`
		}

		xInc += 2 * markingWidth;
	}
	return rtn;
}

function CreateRulerMarking(x, y, record, isLast = false, isFirst = false){
	let fontsize = 15;
	let textY = y - fontsize/2 ;
	let arrowHeadLength = 5;
	let arrowHeadWidth = 3;
	let lineWidth = 1;
	let rtn = "";
	let lineLength = 0;
	let color = "magenta";
	let width = M2Px(record.width);
	let divLineX =  x ;

	if(width > arrowHeadLength * 2){
		lineLength = width - arrowHeadLength * 2; 
	}else{
		lineLength = 0;
		arrowHeadWidth = arrowHeadWidth * (width / 2) / arrowHeadLength;
		arrowHeadLength = width / 2;
	}

	if(isFirst){
		divLineX = x + lineWidth / 2;
	}

	//create line
	if(lineLength > 0){
		rtn += `<line x1="${x + arrowHeadLength}" y1="${y}" x2="${width + x - arrowHeadLength}" y2="${y}" stroke = "${color}" stroke-width="${lineWidth}"/>`;
	}

	//craete arrow
	arrowHeadWidth /= 2;
	rtn += `<polygon points="${x + 1} ${y}, ${x + arrowHeadLength} ${y - arrowHeadWidth}, ${x + arrowHeadLength} ${y + arrowHeadWidth}" stroke="${color}" fill="${color}"/>`;
	rtn += `<polygon points="${width + x - 1} ${y}, ${width + x - arrowHeadLength} ${y - arrowHeadWidth}, ${width + x - arrowHeadLength} ${y + arrowHeadWidth}" stroke ="${color}" fill="${color}"/>`;
	rtn += `<line x1="${divLineX}" y1="${y - 10}" x2="${divLineX}" y2="${y+ 10}" stroke-width="${lineWidth}" stroke ="${color}" />`;
	
	if(isLast){
		rtn += `<line x1="${width + x - lineWidth / 2}" y1="${y - 10}" x2="${width + x - lineWidth / 2}" y2="${y+ 10}" stroke-width="${lineWidth}" stroke ="${color}" />`;
	}

	//craete text
	rtn += `<text x="${x + width / 2}" y="${textY}" fill="${color}" font-size="${fontsize}" text-anchor="middle" background="red">${record.width} m</text>`

	return rtn;
}

function CreateStopLine(xStart, xEnd, y, lineWidth){
	//create stop line
	y = lineWidth / 2;
	return `<path class="marking" d="M ${xStart} ${y} L ${xEnd} ${y}" stroke="white" stroke-width="${lineWidth}"/>`;
}

function CreateNewMarking(record, rulerY, dashLineOverride = -1, ruler=true, isStopSection= false){
	let widthSum = 0;
	let leftD = "";
	let rightD = "";
	let newMarking = "";
	let stopMarkingStartX = -1;
	let marking15cm = M2Px(0.15);
	let marking10cm = M2Px(0.1);
	let stopLineWidth = M2Px(0.4);

	if(dashLineOverride !== -1){
		stopLineWidth = 5;
	}

	for(let i = 0;i< record.length;++i){
		if(record[i].type === "road" || record[i].type === "slowlane"){
			leftD = "";
			rightD = "";

			//left marking
			if(i === 0 || (record[i-1].type !== "road" && record[i - 1].type !== "slowlane")){
				leftD = CreateVerticalMarking("white", M2Px(widthSum), [0],  marking15cm, 1, dashLineOverride);

				//stop line start condition
				if((record[i].direction & 0b10) !== 0 && isStopSection){
					stopMarkingStartX = M2Px(widthSum) + marking15cm;
				}
			}
			
			//right marking
			if(i === record.length - 1){

				//stop line end condition
				if(isStopSection && stopMarkingStartX !== -1){
					newMarking += CreateStopLine(stopMarkingStartX, M2Px(widthSum + record[i].width) - marking15cm, 0, stopLineWidth);
					stopMarkingStartX = -1;
				}
				rightD = CreateVerticalMarking("white", M2Px(widthSum + record[i].width), [0],  marking15cm, -1, dashLineOverride);
			}else if(record[i + 1].type === "road" || record[i + 1].type === "slowlane"){
				let color = "white";
				if(record[i].direction !== record[i + 1].direction){
					color = "yellow";

					//calculating stop line parameter
					if(isStopSection){
						if(stopMarkingStartX !== -1){// stopLine end condition
							if( (record[i + 1].direction&0b10) === 0){

								//draw stop line
								if(record[i + 1].type === "slowlane" || record[i].type === "slowlane" ||(record[i].crossability&0b10) !== 0 && (record[i + 1].crossability&0b1) !== 0){
									newMarking += CreateStopLine(stopMarkingStartX,  M2Px(widthSum + record[i].width) - marking10cm / 2, 0, stopLineWidth);
								}else{
									newMarking += CreateStopLine(stopMarkingStartX,  M2Px(widthSum + record[i].width) - marking10cm * 3 / 2, 0, stopLineWidth);
								}
								stopMarkingStartX = -1;
							}

						} else if((record[i + 1].direction & 0b10) !== 0){// stop line start condition
							if(record[i].type === "slowlane" || (record[i].crossability&0b10)!==0 && (record[i + 1].crossability&0b1) !== 0){
								stopMarkingStartX = M2Px(widthSum + record[i].width) + marking10cm / 2;
							}else{
								stopMarkingStartX = M2Px(widthSum + record[i].width) + marking10cm * 3 / 2;
							}
						}
					}
				}

				if(record[i].type === "slowlane" || record[i + 1].type === "slowlane"){
					if(record[i].type === "road" || record[i + 1].type === "road"){
						rightD = CreateVerticalMarking(color, M2Px(widthSum + record[i].width), [0], marking10cm, 0, dashLineOverride);
					}else{
						rightD = CreateVerticalMarking(color, M2Px(widthSum + record[i].width), [1 , 1], marking10cm, 0, dashLineOverride);
					}
				}else{
					rightD = CreateVerticalMarking(color, M2Px(widthSum + record[i].width), [record[i].crossability&0b10, record[i + 1].crossability&0b1], marking10cm, 0, dashLineOverride);
				}
			}else{
				// stop line end condition
				if(isStopSection && stopMarkingStartX !== -1){
					newMarking += CreateStopLine(stopMarkingStartX, M2Px(widthSum + record[i].width) - marking15cm, 0, stopLineWidth);
					stopMarkingStartX = -1;
				}
				rightD = CreateVerticalMarking("white", M2Px(widthSum + record[i].width), [0],  marking15cm, -1, dashLineOverride);
			}

			if(leftD !== ""){
				newMarking += leftD;
			}
			if(rightD !== ""){
				newMarking += rightD;
			}
		}
		if(ruler){
			newMarking += CreateRulerMarking(M2Px(widthSum), rulerY, record[i], i==record.length-1, i == 0);
		}
		widthSum += record[i].width;
	}
	return newMarking;
}

function UpdateMarkingSpace(){
	if(currentStage === 2){
		RenderIntermidiateStage();
	}else{
		markingSpaceElement.innerHTML = CreateNewMarking(roadSegmentRecord, landElement.clientHeight * (6 / 7), -1, currentStage !== 2, currentStage === 1);
	}
	console.log("updating marking space");

}

window.ResizeMarkingSpace = function(timeWindow){
	if(ResizeMarkingSpace.timeout === undefined){
		ResizeMarkingSpace.timeout = null;
	}
	if(ResizeMarkingSpace.timeout){
		clearTimeout(ResizeMarkingSpace.timeout); 
	}
	ResizeMarkingSpace.timeout = setTimeout(()=>{UpdateMarkingSpace(); UnusedMarkingSpaceInit(true, false, false);}, timeWindow);
}

//-----------------------------
//
// utility button functions
//
//-----------------------------
window.OnRedo = function(){
	new Promise(
		(res,rej)=>{PushUndoStack(roadSegmentRecord, false);res();}
	).then(
		()=>{ImportRoadSegmentRecordJSON(redoStack.pop());}
	).then(
		()=>{
			SaveTempStorage();
			if(redoButtonElement.classList.contains("active") && redoStack.length === 0){
				redoButtonElement.classList.remove("active");
				redoButtonElement.removeEventListener("click", OnRedo);
			}
					
			//update width info
			UpdateWidthInfo();
		}
	);
	
	console.log("redo");
}

window.OnUndo = function(){
	new Promise(
		(res, rej)=>{PushRedoStack(roadSegmentRecord);res();}
	).then(
		()=>{
			ImportRoadSegmentRecordJSON(undoStack.pop());
		}
	).then(
		() => {
			SaveTempStorage();
			if(undoButtonElement.classList.contains("active") && undoStack.length === 0){
				undoButtonElement.classList.remove("active");
				undoButtonElement.removeEventListener("click", OnUndo);
			}
			
			//update width info
			UpdateWidthInfo();
		}
	);
	console.log("undo");
	
}

window.OnClearLocalStorage = function (){
	localStorage.clear();
	//rebuild entry setting
	let entryConfig = {
		"loadExtern": false,
		"landWidth": landWidth,
		"roadType": "primary",
		"hasArcade": "false",
		"template": ""
	}

	sessionStorage.setItem("entryConfig", JSON.stringify(entryConfig));

	window.location.reload();
}

function PushUndoStack(state, clearRedo = true){
	if(clearRedo){
		redoStack = [];
		if(redoButtonElement.classList.contains("active") && redoStack.length === 0){
			redoButtonElement.classList.remove("active");
			redoButtonElement.removeEventListener("click", OnRedo);
		}
		
		SaveTempStorage();
	}

	if (undoStack.length >= maxStackStep){
		undoStack.splice(0, 1);
		console.log("pop undo stack a");
	}
	
	undoStack.push(JSON.parse(JSON.stringify(state)));

	if(!undoButtonElement.classList.contains("active")){
		undoButtonElement.classList.add("active");
		undoButtonElement.addEventListener("click", OnUndo);
	}

	
	//update width info
	UpdateWidthInfo();

	console.log("push undo stack");
}

function PushRedoStack(state){
	if (redoStack.length >= maxStackStep){
		redoStack.splice(0, 1);
	}
	redoStack.push(JSON.parse(JSON.stringify(state)));
	if(!redoButtonElement.classList.contains("active")){
		redoButtonElement.classList.add("active");
		redoButtonElement.addEventListener("click", OnRedo);
	}

	//update width info
	UpdateWidthInfo();

	console.log("push redo stack");
}

function SaveTempStorage(){
	let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));
	
	tempStorage[DesignStage[currentStage]] = roadSegmentRecord;
	tempStorage.stage = currentStage;

	localStorage.setItem("tempStorage", JSON.stringify(tempStorage));

	StageVerify();
}

function RestoreSectionStack(){
	redoStack = JSON.parse(tempVariables[DesignStage[currentStage]]['redo']);
	undoStack = JSON.parse(tempVariables[DesignStage[currentStage]]['undo']);
	
	if(redoStack.length === 0){
		if(redoButtonElement.classList.contains('active')){
			redoButtonElement.classList.remove('active');
		}
	}else{
		if(!redoButtonElement.classList.contains('active')){
			redoButtonElement.classList.add('active');
		}
	}
	
	if(undoStack.length === 0){
		if(undoButtonElement.classList.contains('active')){
			undoButtonElement.classList.remove('active');
		}
	}else{
		if(!undoButtonElement.classList.contains('active')){
			undoButtonElement.classList.add('active');
		}
	}

}

window.OnClearLand = function(){
	if(roadSegmentRecord.length === 0)return;
	tempVariables.state = JSON.parse(JSON.stringify(roadSegmentRecord));
	ClearRoadSegmentRecord();
	PushUndoStack(tempVariables.state);
	UpdateMarkingSpace();
}

window.OnToggleTypeColoringMode = function(){
	typeColoringMode = !typeColoringMode;
	if(typeColoringMode){
		typeColoringModeButtonElement.title = "切換至預覽模式";
		typeColoringModeButtonElement.innerText = "類型模式";
		document.body.classList.add("typeMode");
	}else{
		typeColoringModeButtonElement.title = "切換至類型模式";
		typeColoringModeButtonElement.innerText = "預覽模式";
		document.body.classList.remove("typeMode");
	}
	console.log(typeColoringModeButtonElement);
}

window.OnImportFromSection = function(){
	if(!importFromSectionButtonElement.classList.contains("active"))return;
	
	let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));
	tempVariables.state = JSON.parse(JSON.stringify(roadSegmentRecord));

	console.log(tempStorage);
	if(currentStage === 1){
		console.log("import road -> stop");
		PushUndoStack(tempVariables.state);
		ImportRoadSegmentRecordJSON(JSON.parse(JSON.stringify(tempStorage.road)));
		SaveTempStorage();
		UpdateWidthInfo();
	}else if(currentStage === 0){
		console.log("import stop -> road");
		PushUndoStack(tempVariables.state);
		ImportRoadSegmentRecordJSON(JSON.parse(JSON.stringify(tempStorage.stop)));
		SaveTempStorage();
		UpdateWidthInfo();
	}
	UpdateMarkingSpace();
}

//------------------------------
//
// Validation functions
//
//------------------------------
function StageVerify(updateWarningPopup = false){
	let widthSum = 0;
	let chkFlag = true;

	if(updateWarningPopup){
		InitWarningPopup();
	}

	if(currentStage !== 2){
		//check width sum
		roadSegmentRecord.forEach(record => {
			widthSum+=record.width;
		});
	
		if(widthSum !== landWidth){
			chkFlag = false;

			if(updateWarningPopup){
				if(widthSum > landWidth){
					WarningPopupAddMessage("腹地空間不足", 3);
				}else{
					WarningPopupAddMessage("道路空間未填滿", 3);
				}
			}
		}
	
	
		
	}else{
		chkFlag = false;
		
		//if(updateWarningPopup){
		//	WarningPopupAddMessage("not avaliable", 3);
		//}
		chkFlag = IntermidiateValidation(updateWarningPopup);
	}

	//check process
	if(chkFlag){
		if(!nextButtonElement.classList.contains("active")){
			nextButtonElement.classList.add("active");
		}
	}else{
		if(nextButtonElement.classList.contains("active")){
			nextButtonElement.classList.remove("active");
		}
	}
	return chkFlag;
}

function IntermidiateStageTempStorageRefit(){
	let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));
	let intermidiateRecord = tempStorage.intermidiate;
	let removeList = [];

	console.log("intermidiate stage refit");

	if(intermidiateRecord === undefined){
		tempStorage.intermidiate = [];
		return tempStorage;
	}

	// select for remove
	for(let i = 0;i<intermidiateRecord.length;++i){
		let record =  intermidiateRecord[i];
		let roadConnectionRecord = JSON.parse(record.roadSideRecord);
		let stopConnectionRecord = JSON.parse(record.stopSideRecord);

		//component - component link
		if(record.type === "cc"){
			
			//index out of range
			if(record.roadIndex < 0 || record.roadIndex >= tempStorage.road.length || record.stopIndex < 0|| record.stopIndex >= tempStorage.stop.length){
				removeList.push(i);
				continue;
			}
			
			//component type mismatch
			if(roadConnectionRecord.type !== tempStorage.road[record.roadIndex].type || stopConnectionRecord.type !== tempStorage.stop[record.stopIndex].type){
				removeList.push(i);
				continue;
			}
			
			if(roadConnectionRecord.type === "road" && stopConnectionRecord.type === "road"){
				//road direction mismatch
				if(
					(roadConnectionRecord.direction !== tempStorage.road[record.roadIndex].direction) ||
					(stopConnectionRecord.direction !== tempStorage.stop[record.stopIndex].direction )
					){
					removeList.push(i);
					continue;
				}
				
				//road exit direction mismatch
				if(
					(roadConnectionRecord.exitDirection & tempStorage.road[record.roadIndex].exitDirection) === 0 ||
					(stopConnectionRecord.exitDirection & tempStorage.stop[record.stopIndex].exitDirection) === 0
				){
					removeList.push(i);
					continue;
				}
			}
		}//component - point link
		else if(record.type === "cp"){
			if(record.roadLinkType === "component"){
				if(record.roadIndex >= tempStorage.road.length){
					removeList.push(i);
				}else if(roadConnectionRecord.type !== tempStorage.road[record.roadIndex].type){
					removeList.push(i);
				}else if(record.stopIndex > tempStorage.stop.length){
					removeList.push(i);
				}else{
					let check = true;
					if(record.stopIndex > 0 && tempStorage.stop[record.stopIndex - 1].type === roadConnectionRecord.type){
						removeList.push(i);
						check = false;
					}
					
					if(check && record.stopIndex < tempStorage.stop.length - 1 && tempStorage.stop[record.stopIndex].type === roadConnectionRecord.type){
						removeList.push(i);
						check = false;
					}
				}
				
			}else{
				if(record.stopIndex >= tempStorage.stop.length){
					removeList.push(i);
				}else if(stopConnectionRecord.type !== tempStorage.stop[record.stopIndex].type){
					removeList.push(i);
				}else if(record.roadIndex > tempStorage.road.length){
					removeList.push(i);
				}else{
					let check = true;
					if(record.roadIndex > 0 && tempStorage.road[record.roadIndex - 1].type === stopConnectionRecord.type){
						removeList.push(i);
						check = false;
					}

					if(check && record.roadIndex < tempStorage.road.length - 1 && tempStorage.road[record.roadIndex].type === stopConnectionRecord.type){
						removeList.push(i);
						check = false;
					}
				}
			}

		}
	}

	//remove
	removeList = removeList.sort().reverse();
	for(let i = 0;i< removeList.length;++i){
		tempStorage.intermidiate.splice(removeList[i], 1);
	}
	// update local storage
	localStorage.setItem("tempStorage", JSON.stringify(tempStorage));
	return tempStorage;
}

function InitWarningPopup(){
	document.getElementById("warningPopupBody").innerHTML = "";
}

function WarningPopupAddMessage(message, level){
	document.getElementById("warningPopupBody").innerHTML += 
	`<div class = "warning">
		<i class="fa-solid fa-triangle-exclamation"></i>
		<div class = "info">${message}</div>
	</div>`;
}

function TemplateVerify(template, entryConfig){
	let templateJson;
	let keys;
	
	InitWarningPopup();
	try {
		templateJson = JSON.parse(template);
		// check match of template road type and setting road type
		if(templateJson.roadType !== entryConfig.roadType){
			throw "road type miss match";
		}

		//version check
		if(templateJson.version !== TempStorageTemplate.tempVersion){
			throw "version miss match";
		}

		keys = Object.keys(templateJson.section);
		keys.forEach(key => {
			console.log(key);

			//verifing the stage existance
			if(!DesignStage.includes(key)){
				throw "invalid stage";
			}
			
			if(key !== "intermidiate"){
				//verify the components
				templateJson.section[key].forEach( component=>{
					//verify component type existance
					if(componentLayout[component.type] === undefined){
						throw "invalid component type";
					}
					
					//verify component layout
					componentLayout[component.type].forEach(element => {
						if(component[element] === undefined){
							throw "invalid component layout";
						}
					});
				});
			}else{
				//TODO: intermidiate stage check
			}
		});
	} catch (error) {
		WarningPopupAddMessage("模板解析失敗", 3);
		ActivateWarningPopup();
		console.error(error);
		return false;
	}

	return true;
}

function IntermidiateValidation( updateWarningPopup = false){
	
	let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));

	let hasConnect = {
		road:[],
		stop:[]
	};
	let connectivity = {
		road:{},
		stop:{}
	};

	let cpConnectivity = {
		road:{},
		stop:{}
	};
	
	let check = true;

	if(updateWarningPopup){
		InitWarningPopup();
	}

	//check all road, sidewalk, slowlane has connection
	for(let i = 0;i<roadSegmentRecord.length; ++i){
		let record = roadSegmentRecord[i];
		if(record.type==="cc"){
			if(!hasConnect.road.includes(record.roadIndex))hasConnect.road.push(record.roadIndex);
			if(!hasConnect.stop.includes(record.stopIndex))hasConnect.stop.push(record.stopIndex);

			if(connectivity.road[record.roadIndex]){
				connectivity.road[record.roadIndex].push(record.stopIndex);
			}else{
				connectivity.road[record.roadIndex] = [record.stopIndex];
			}

			if(connectivity.stop[record.stopIndex]){
				connectivity.stop[record.stopIndex].push(record.roadIndex);
			}else{
				connectivity.stop[record.stopIndex] = [record.roadIndex];
			}
		}else{
			if(record.roadLinkType === "component"){
				cpConnectivity.road[record.roadIndex] =true;
			}else{
				cpConnectivity.stop[record.stopIndex] =true;
			}
		}
	}

	//checking road section
	for(let i = 0;i<tempStorage.road.length;++i){
		let record = tempStorage.road[i];
		//if(record.type==="road" || record.type === "sidewalk" || record.type === "slowlane"){
		if(!hasConnect.road.includes(i) && cpConnectivity.road[i] !== true){
			check = false;
			if(updateWarningPopup){
				WarningPopupAddMessage(`道路段第${i+1}個物件(${ComponentType2Name[record.type]}) 需連結至儲車段`, 3);
			}
		}
		//}
		
		//slow lane can only has one connection
		if(record.type === "slowlane"){
			if(connectivity.road[i]){
				if(connectivity.road[i].length > 1){
					check = false;
					WarningPopupAddMessage(`道路段第${i+1}個物件(慢車道) 只能有最多一個連結`, 3);
				}
			}
		}
	}
	
	//checking stop section
	for(let i = 0;i<tempStorage.stop.length;++i){
		let record = tempStorage.stop[i];
		//if(record.type==="road" || record.type === "sidewalk" || record.type === "slowlane"){
		if(!hasConnect.stop.includes(i)  && cpConnectivity.stop[i] !== true){
			if(updateWarningPopup){
				if(updateWarningPopup){
					WarningPopupAddMessage(`道路段第${i+1}個物件(${ComponentType2Name[record.type]}) 需連結至儲車段`, 3);
				}
			}
			check = false;
		}
		//}
		
		//slow lane can only has one connection
		if(record.type === "slowlane"){
			if(connectivity.stop[i]){
				if(connectivity.stop[i].length > 1){
					check = false;
					WarningPopupAddMessage(`道路段第${i+1}個物件(慢車道) 只能有最多一個連結`, 3);
				}
			}
		}
	}


	//check road section road exit direction connectivity
	for(let i = 0;i< tempStorage.road.length;++i){
		let record = tempStorage.road[i];
		if(record.type === "road"){
			if(record.direction !== 3){
				let temp = 0;
				if(connectivity.road[i] !== undefined){
					for(let j = 0;j< connectivity.road[i].length;++j){
						if(tempStorage.stop[connectivity.road[i][j]].type === "road"){
							temp |= tempStorage.stop[connectivity.road[i][j]].exitDirection;
						}
					}
				}
				
	
				if(record.exitDirection - temp > 0){
					if(updateWarningPopup){
						WarningPopupAddMessage(`道路段第${i+1}個物件(道路) 儲車段方向缺失`, 3);
					}
					check = false;
				}
			}else{
				let roadLinkCounter = 0;
				if(connectivity.road[i] !== undefined){
					for(let j = 0;j< connectivity.road[i].length;++j){
						if(tempStorage.stop[connectivity.road[i][j]].type === "road"){
							++roadLinkCounter;
						}
					}
				}
				
				if(roadLinkCounter === 0){
					WarningPopupAddMessage(`道路段第${i+1}個物件(道路) 儲車段需連接道路`, 3);
					check = false;
				}
			}

		}
	}

	//check stop section road exit direction connectivity
	for(let i = 0;i< tempStorage.stop.length;++i){
		let record = tempStorage.stop[i];
		if(record.type === "road"){
			if(record.direction !== 3){
				let temp = 0;
				if(connectivity.stop[i] !== undefined){
					for(let j = 0;j< connectivity.stop[i].length;++j){
						if(tempStorage.road[connectivity.stop[i][j]].type === "road"){
							temp |= tempStorage.road[connectivity.stop[i][j]].exitDirection;
						}
					}
				}
				
	
				if(record.exitDirection - temp > 0){
					if(updateWarningPopup){
						WarningPopupAddMessage(`儲車段第${i+1}個物件(道路) 道路段方向缺失`, 3);
					}
					check = false;
				}
			}else{
				let roadLinkCounter = 0;
				if(connectivity.stop[i] !== undefined){
					for(let j = 0;j< connectivity.stop[i].length;++j){
						if(tempStorage.road[connectivity.stop[i][j]].type === "road"){
							++roadLinkCounter;
						}
					}
				}

				if(roadLinkCounter === 0){
					WarningPopupAddMessage(`儲車段第${i+1}個物件(道路) 道路段需連接道路`, 3);
					check = false;
				}
			}
		}
	}
	return check;


}

//-----------------------------
//
// stage controlling function
//
//-----------------------------
function MakeRoadSegmentHTML(record){
	let el= document.createElement("div");
	for(let i = 0;i<record.length;++i){
		let compType = record[i].type;
		let component = roadComponentTemplate.cloneNode(true);


		//set up new component
		component.style.width = M2Percent(record[i].width);
		component.setAttribute("component", compType);
		component.appendChild(templateBase[compType].cloneNode(true));
		el.appendChild(component);

		//remove unused attrubute
		component.removeAttribute("ontouchstart");
		component.removeAttribute("onmousedown");
		component.classList.remove("drag");

		//init intermidiate stage attribute
		if(currentStage === 2){
			component.setAttribute("onmousedown", "OnIntermidiateDragStart(event);");
			component.setAttribute("ontouchstart", "OnIntermidiateDragStart(event);");
			component.setAttribute("index", i.toString());
		}

		//rebuild road exit direction icon
		if(compType === "road"){
			let iconContainer = component.getElementsByClassName("roadComponentIcon")[0];
			let direction = record[i].direction;
			let exitDirection = record[i].exitDirection;
			let iconSrc = "";

			iconContainer.innerHTML = "";
			
			//下行
			if (direction !== 2){
				if(!iconContainer.classList.contains("rot180"))iconContainer.classList.add("rot180");
			}//上行
			else{
				if(iconContainer.classList.contains("rot180"))iconContainer.classList.remove("rot180");
			}
		
			if(direction !== 3){
				if(exitDirection === 0)continue;
				if(exitDirection === 1) iconSrc = "./images/left_arrow.svg";
				else if(exitDirection === 2) iconSrc = "./images/straight_arrow.svg";
				else if(exitDirection === 3) iconSrc = "./images/straight_left_arrow.svg";
				else if(exitDirection === 4) iconSrc = "./images/right_arrow.svg";
				else if(exitDirection === 5) iconSrc = "./images/left_right_arrow.svg";
				else if(exitDirection === 6) iconSrc = "./images/straight_right_arrow.svg";
				else if(exitDirection === 7) iconSrc = "./images/three_way_arrow.svg";
			}else{
				iconSrc = "./images/double_arrow.svg";
			}
			iconContainer.innerHTML = `<img src="${iconSrc}"  draggable="false">`;
		}else if (compType === "slowlane"){
			let iconContainer = component.getElementsByClassName("roadComponentIcon")[0];
			let direction = record[i].direction;
			let iconSrc = "";

			iconContainer.innerHTML = "";
			
			//下行
			if (direction !== 2){
				if(!iconContainer.classList.contains("rot180"))iconContainer.classList.add("rot180");
			}//上行
			else{
				if(iconContainer.classList.contains("rot180"))iconContainer.classList.remove("rot180");
			}
		
			if(direction !== 3){
				iconSrc = "./images/straight_arrow.svg";
			}else{
				iconSrc = "./images/double_arrow.svg";
			}
			iconContainer.innerHTML = `<img src="${iconSrc}"  draggable="false">`;
		}

	}
	return el.innerHTML;
}

function SwitchEditorRoadSegment(fromStage, toStage){
	UpdatePrevButtonVis();
	
	let fromSection = document.getElementById(`${DesignStage[fromStage]}Section`);
	let toSection = document.getElementById(`${DesignStage[toStage]}Section`);
	let segmentHTML = "";
	if(fromStage !== 2){
		segmentHTML= MakeRoadSegmentHTML(roadSegmentRecord);
	}

	//switching editor section 
	fromSection.classList.remove("usingSection");
	fromSection.classList.add("unusedSection");
	if(fromSection === 2){
		fromSection.innerHTML = "";
	}else{
		fromSection.innerHTML = segmentHTML;
	}

	toSection.classList.remove("unusedSection");
	toSection.classList.add("usingSection");
	toSection.innerHTML = "";

	//store old undo / redo stack
	if(fromStage !== 2){
		tempVariables[DesignStage[fromStage]]['redo'] = JSON.stringify(redoStack);
		tempVariables[DesignStage[fromStage]]['undo'] = JSON.stringify(undoStack);
	}

	let sectionElement;
	let sectionSvgElement;

	//remove old marking space
	for(let i = 0; i < 2;++i){
		if(i === currentStage)continue;
		sectionElement = document.getElementById(`${DesignStage[i]}Section`);
		sectionSvgElement = sectionElement.getElementsByClassName("markingSpace");
		for(let j = 0;j<sectionSvgElement.length;++j){
			sectionSvgElement[j].remove();
		}
	}
}

function UpdatePrevButtonVis(){
	if(currentStage === 0){
		prevButtonElement.classList.remove("active");
	}else{
		prevButtonElement.classList.add("active");
	}

	// update import from section button
	let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));
	if(currentStage == 1 ){
		
		importFromSectionButtonElement.title = "載入道路段配置";

		if(tempStorage.road === undefined){
			importFromSectionButtonElement.classList.remove("active");
		}else if(tempStorage.road.length !== 0){
			importFromSectionButtonElement.classList.add("active");
		}else{
			importFromSectionButtonElement.classList.remove("active");
		}
		
	}else if(currentStage == 0){
		
		importFromSectionButtonElement.title = "載入儲車段配置";

		if(tempStorage.stop === undefined){
			importFromSectionButtonElement.classList.remove("active");
		}else if(tempStorage.stop.length !== 0){
			importFromSectionButtonElement.classList.add("active");
		}else{
			importFromSectionButtonElement.classList.remove("active");
		}
		
	}else{
		importFromSectionButtonElement.title = "";
		importFromSectionButtonElement.classList.remove("active");
	}
}

// switch to next segment when is next is true, switch to previous if false
window.OnSwitchSegment = function(isNext = true){
	let prevRecord = null;
	let oriStage = currentStage;

	//validation
	if(!StageVerify(true) && isNext){
		ActivateWarningPopup();
		return;
	}
	//switch to presentation page
	if(currentStage === 2 && isNext){
		console.log("switch to present stage");
		location.href = "../present";
		return;
	}


	// inc / dec current stage
	if(isNext){
		currentStage += 1;
	}else{
		if(currentStage === 0)return;
		currentStage -= 1;
	}

	SwitchEditorRoadSegment(oriStage, currentStage);
	
	if(currentStage === 2 && isNext){
		//switch to intermidiate section
		//LandInit();
		EnterIntermidiateStage();
	}else{
		if(currentStage === 1 && !isNext){
			ExitIntremidiateStage();
		}

		LandInit();
	}
	StageVerify();

	//update marking space
	prevRecord = IntermidiateStageTempStorageRefit()[DesignStage[currentStage]];
	if(prevRecord){
		ImportRoadSegmentRecordJSON(prevRecord, false);
		if(currentStage !== 2){
			markingSpaceElement.style.opacity = "0";
			markingSpaceElement.style.transitionDuration = "500ms";
			setTimeout(()=>{
				UpdateMarkingSpace();
				markingSpaceElement.style.opacity = "1";
				setTimeout(()=>{
					markingSpaceElement.style.removeProperty("opacity");
					markingSpaceElement.style.removeProperty("transition-duration");
				}, 550);
			}, 400);
		}else{
			setTimeout(()=>{
				RenderIntermidiateStage();
			}, 330);
		}
	}
	
	//info bar update
	InfoBarSectionSwitch();
	
	// update unused marking space
	setTimeout(()=>{
		UnusedMarkingSpaceInit(true, currentStage===2);
	}, 300);

	// storage related process
	if(currentStage !== 2){
		RestoreSectionStack();
	}
	SaveTempStorage();

}

function UpdateWidthInfo(){
	if(currentStage === 2)return;

	let totalWidth = 0;
	let indicator = document.getElementById("designedWidthIndicator");
	roadSegmentRecord.forEach(record => {
		totalWidth += record.width;
	});

	if(totalWidth !== landWidth){
		indicator.style.color = "red";
	}else{
		indicator.style.color = "black";
	}

	indicator.innerText = totalWidth.toString();
}

function UpdateStageName(){
	document.getElementById("stageName").innerText = StageName[currentStage];
}

function UpdateStageProgressBar(){
	document.getElementById("currentStageCount").innerText = (currentStage + 1).toString();
	document.getElementById("stageProgress").style.width = `${(currentStage + 1) / 3 * 100}%`;
}

function InfoBarSectionSwitch(){
	if(currentStage !== 2){
		UpdateWidthInfo();
	}
	
	UpdateStageProgressBar();
	UpdateStageName();
}

//-------------------------------
//
// warning pop up functions
//
//-------------------------------
window.OnWarningPopupFocusout = function(event){
	event.target.classList.remove("active");
}

function ActivateWarningPopup(){
	warningPopupElement.classList.add("active");
	warningPopupElement.focus();
}

//------------------------------
//
// intermidiate stage function
//
//------------------------------
function CreateLinkErrorMsg(msg){
	let errorMsg = document.createElement("div");
	errorMsg.classList.add(...["errormsg", "window"]);
	errorMsg.innerText = msg;
	midErrorWindowElement.appendChild(errorMsg);
	
	setTimeout((element) => {
		element.style.opacity = "0";
		element.style.height = "0px";
		setTimeout((element) => {
			element.remove();
		}, 300, element);
	}, 1000, errorMsg);
}

function EnterIntermidiateStage(){
	
	// internmidiate stage initialization
	IntermidiateStageInit();

	let roadSectionElement = document.getElementById("roadSection");
	let stopSectionElement = document.getElementById("stopSection");
	let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));
	let components;
	let tempElement;

	tempVariables.intermidiateSerialCounter = 0;

	for(let i = 0;i< roadSegmentRecord.length;++i){
		tempVariables.intermidiateSerialCounter = tempVariables.intermidiateSerialCounter > roadSegmentRecord[i].serial ? tempVariables.intermidiateSerialCounter : roadSegmentRecord[i].serial;
	}
	++tempVariables.intermidiateSerialCounter;

	//process road section
	components = roadSectionElement.getElementsByClassName("roadComponent");
	for(let i = 0;i<components.length;++i){
		let component = components[i];
		component.setAttribute("ontouchstart", "OnIntermidiateDragStart(event);");
		component.setAttribute("onmousedown", "OnIntermidiateDragStart(event);");
		component.setAttribute("index", i.toString());
	}

	tempVariables.componentXCoord = {
		road:[],
		stop:[]
	};
	//calculate road component width
	let widthSum;
	//road section
	widthSum = 0;
	for(let i = 0;i<tempStorage.road.length;++i){
		let component = tempStorage.road[i];
		widthSum += component.width;
		tempVariables.componentXCoord.road.push(widthSum);
	}
	
	//stop section
	widthSum = 0;
	for(let i = 0;i<tempStorage.stop.length;++i){
		let component = tempStorage.stop[i];
		widthSum += component.width;
		tempVariables.componentXCoord.stop.push(widthSum);
	}

	//update info bar
	document.getElementById("widthInfo").style.display = "none";
	
	//update stage control button text
	nextButtonElement.innerText = "完成";
	nextButtonElement.title = "進入檢視階段";
	prevButtonElement.innerText = "上";
	
	console.log("enter imtermidiate stage");

}

function ExitIntremidiateStage(){
	let roadSectionElement = document.getElementById("roadSection");
	let stopSectionElement = document.getElementById("stopSection");
	let components;
	
	//process road section
	components = roadSectionElement.getElementsByClassName("roadComponent");
	for(let i = 0;i<components.length;++i){
		components[i].removeAttribute("ontouchstart");
		components[i].removeAttribute("onmousedown");
		components[i].removeAttribute("index");
	}
	
	// update info bar
	document.getElementById("widthInfo").style.display = "flex";

	//update stage control button text
	nextButtonElement.innerText = "下一步";
	nextButtonElement.title = "下一步";
	prevButtonElement.innerText = "上一步";

	console.log("exit intermidate stage");
}

function VerifyLink(roadIndex, stopIndex, tempStorage){

	let roadRecord = tempStorage.road[roadIndex];
	let stopRecord = tempStorage.stop[stopIndex];
	let isCenter = true;

	let centerStopRecord = null;
	let centerRoadRecord = null;
	let check = false;

	if(roadRecord.type !== stopRecord.type) {
		if(!((roadRecord.type === "road" && stopRecord.type === "slowlane") || (roadRecord.type === "slowlane" && stopRecord.type === "road"))){
			//type mismatch
			return false;
		}else{
			if(!draging){
				let roadLinkCounter = 0;
				let stopLinkCounter = 0;
	
				for(let i = 0;i< roadSegmentRecord.length;++i){
					let record = roadSegmentRecord[i];
	
					if(record.roadIndex === roadIndex){
						++roadLinkCounter;
					}
	
					if(record.stopIndex === stopIndex){
						++stopLinkCounter;
					}
				}
	
				if(roadRecord.type === "slowlane"){
					if(roadLinkCounter !== 0)return false;
				}
	
				if(stopRecord.type === "slowlane"){
					if(stopLinkCounter !== 0)return false;
				}
			}
		}
	}

	//road - road link property verification
	if(roadRecord.type === "road" && stopRecord.type === "road"){
		if(roadRecord.direction !== stopRecord.direction)return false;
		if((roadRecord.exitDirection & stopRecord.exitDirection) === 0) return false; 
	}

	// slowlane - road/slowlane link verification
	if((roadRecord.type === "slowlane" &&(stopRecord.type === "road" || stopRecord.type === "slowlane")) || (stopRecord.type === "slowlane" &&(roadRecord.type === "road" || roadRecord.type === "slowlane"))){
		if(roadRecord.direction !== stopRecord.direction) return false; 
	}

	for(let i =0;i<roadSegmentRecord.length;++i){
		let record = roadSegmentRecord[i];
		//check for remake connection
		if((record.roadIndex === roadIndex) && (record.stopIndex === stopIndex)){
			isCenter = true;
			check = true;
			continue;
		}

		if(!check && ((record.roadIndex === roadIndex) || (record.stopIndex === stopIndex))){
			isCenter =  false;
		}

		//check link crossing
		if((record.roadIndex < roadIndex && record.stopIndex > stopIndex) || (record.roadIndex > roadIndex && record.stopIndex < stopIndex) )return false;


		if(!draging){
			if(roadRecord.type === "road"){
				if(record.roadIndex === roadIndex && tempStorage.stop[record.stopIndex].type === "road"){
					if(centerRoadRecord === null){
						centerRoadRecord = record;
					}else{
						if(centerRoadRecord.overrideSerialNumber < record.overrideSerialNumber){
							centerRoadRecord = record;
						}else if(centerRoadRecord.overrideSerialNumber === record.overrideSerialNumber && centerRoadRecord.serialNumber > record.serialNumber){
							centerRoadRecord = record;
						}
					}
				}
			}

			if(stopRecord.type === "road"){
				if(record.stopIndex === stopIndex && tempStorage.road[record.roadIndex].type === "road"){
					if(centerStopRecord === null){
						centerStopRecord = record;
					}else{
						if(centerStopRecord.overrideSerialNumber < record.overrideSerialNumber){
							centerStopRecord = record;
						}else if(centerStopRecord.overrideSerialNumber === record.overrideSerialNumber && centerStopRecord.serialNumber > record.serialNumber){
							centerStopRecord = record;
						}
					}
				}
			}
		}
	}

	if(!draging){
		if(!isCenter && (roadRecord.type === "road" || roadRecord.type === "slowlane" || stopRecord.type === "slowlane")){
			for(let i = 0;i < roadSegmentRecord.length;++i){
				let record = roadSegmentRecord[i];
				if(centerStopRecord !== null){
					if(record.stopIndex === centerStopRecord.stopIndex && (((record.roadIndex > roadIndex) && (record.roadIndex < centerStopRecord.roadIndex)) || ((record.roadIndex < roadIndex) && (record.roadIndex > centerStopRecord.roadIndex)))){
						return false;
					}
				}
				if(centerRoadRecord !== null){
					if(record.roadIndex === centerRoadRecord.roadIndex && (((record.stopIndex > stopIndex) && (record.stopIndex < centerRoadRecord.stopIndex)) || ((record.stopIndex < stopIndex) && (record.stopIndex > centerRoadRecord.stopIndex)))){
						return false;
					}
				}
			}
		}
	}
	return check || !draging;
}

function VerifyComponentPointLink(isRoadComponent, isStopComponent, roadIndex, stopIndex, tempStorage, verbose = false){
	let record;
	let check = false;
	

	if(isRoadComponent){
		//index boundry check
		if(stopIndex > tempStorage.stop.length + 1){
			if(verbose)CreateLinkErrorMsg("index越界");
			return false;
		}
		if(roadIndex > tempStorage.road.length){
			if(verbose)CreateLinkErrorMsg("index越界");
			return false;
		}
		
		if(stopIndex < tempStorage.stop.length){
			if(tempStorage.stop[stopIndex].type === tempStorage.road[roadIndex].type) {
				if(verbose)CreateLinkErrorMsg("同種類物件旁點連結");
				return false;
			}
		}

		if(stopIndex !== 0){
			if(tempStorage.stop[stopIndex - 1].type === tempStorage.road[roadIndex].type){
				if(verbose)CreateLinkErrorMsg("同種類物件旁點連結");
				return false;
			}
		}
		
		for(let i = 0;i< roadSegmentRecord.length;++i){
			record = roadSegmentRecord[i];
			
			//test for repeat link
			if(record.type === "cp"){
				if(record.roadLinkType==="component" && record.stopLinkType === "point"){
					if(record.roadIndex === roadIndex && record.stopIndex === stopIndex){
						check = true;
					}
				}
			}
			
			//test for crossing
			if((record.roadIndex < roadIndex && record.stopIndex >= stopIndex) || (record.roadIndex > roadIndex && record.stopIndex < stopIndex) ){
				if(verbose)CreateLinkErrorMsg("跨越其他連結");
				return false;
			}
		}
	}else{
		
		//index boundry check
		if(stopIndex > tempStorage.stop.length){
			if(verbose)CreateLinkErrorMsg("index越界");
			return false;
		}
		if(roadIndex > tempStorage.road.length + 1){
			if(verbose)CreateLinkErrorMsg("index越界");
			return false;
		}
		
		if(roadIndex < tempStorage.road.length){
			if(tempStorage.stop[stopIndex].type === tempStorage.road[roadIndex].type) {
				if(verbose)CreateLinkErrorMsg("同種類物件旁點連結");
				return false;
			}
		}

		if(roadIndex !== 0){
			if(tempStorage.stop[stopIndex].type === tempStorage.road[roadIndex - 1].type){
				if(verbose)CreateLinkErrorMsg("同種類物件旁點連結");
				return false;
			}
		}

		for(let i = 0;i< roadSegmentRecord.length;++i){
			record = roadSegmentRecord[i];
			
			//test for repeat link
			if(record.type === "cp"){
				if(record.stopLinkType==="component" && record.roadLinkType === "point"){
					if(record.roadIndex === roadIndex && record.stopIndex === stopIndex){
						check = true;
						continue;
					}
				}
			}

			//test for crossing
			if((record.roadIndex < roadIndex && record.stopIndex > stopIndex) || (record.roadIndex >= roadIndex && record.stopIndex < stopIndex) ){
				if(verbose)CreateLinkErrorMsg("跨越其他連結");
				return false;
			}
			
		}

	}
	if(check !== draging){
		if(verbose)CreateLinkErrorMsg("連結失敗");
		return false;
	}
	return true;
}

function VerifyAndLink(roadIndex, stopIndex){
	function uniq(a) {
		var seen = {};
		return a.filter(function(item) {
			return seen.hasOwnProperty(item) ? false : (seen[item] = true);
		});
	}

	let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));
	let roadRecord = tempStorage.road[roadIndex];
	let stopRecord = tempStorage.stop[stopIndex];
	let removeIdx = [];
	let replaceIdx = -1;
	let roadLeftFlag = false;
	let roadRightFlag =  false;
	let stopLeftFlag = false;
	let stopRightFlag =  false;

	let roadLeftRemoveIdx = -1;
	let stopLeftRemoveIdx = -1;
	let roadRightRemoveIdx = -1;
	let stopRightRemoveIdx = -1;
	let isCenter = true;

	let centerStopRecord = null;
	let centerRoadRecord = null;

	//slowlane connection limit
	if(roadRecord.type === "slowlane" || stopRecord.type === "slowlane"){
		let roadConnectionCounter = 0;
		let stopConnectionCounter = 0;
		
		for(let i = 0;i<roadSegmentRecord.length;++i){
			let record = roadSegmentRecord[i];
			if(record.type === "cp")continue;
			if(record.roadIndex === roadIndex){
				++roadConnectionCounter;
			}

			if(record.stopIndex === stopIndex){
				++stopConnectionCounter;
			}
		}

		if(roadRecord.type === "slowlane" && roadConnectionCounter !== 0){
			CreateLinkErrorMsg("慢車道過多連結");
			return false;
		}
		
		if(stopRecord.type === "slowlane" && stopConnectionCounter !== 0){
			CreateLinkErrorMsg("慢車道過多連結");
			return false;
		}

	}

	

	// link component type check
	if(roadRecord.type !== stopRecord.type){
		if(!((roadRecord.type === "slowlane" && stopRecord.type === "road") || (roadRecord.type === "road" && stopRecord.type === "slowlane"))){
		CreateLinkErrorMsg("不同種類物件連結");
		return false;
		}else{
			isCenter = false;
		}
	}

	//road component check
	if(roadRecord.type === "road" && stopRecord.type === "road"){
		if(roadRecord.direction !== stopRecord.direction){
			CreateLinkErrorMsg("上/下行 不匹配");
			return false;
		}
		if((roadRecord.exitDirection & stopRecord.exitDirection) === 0){
			CreateLinkErrorMsg("出口方向 不匹配");
			return false; 
		}	
	}


	// slowlane - road/slowlane link verification
	if((roadRecord.type === "slowlane" &&(stopRecord.type === "road" || stopRecord.type === "slowlane")) || (stopRecord.type === "slowlane" &&(roadRecord.type === "road" || roadRecord.type === "slowlane"))){
		if(roadRecord.direction !== stopRecord.direction){
			CreateLinkErrorMsg("上/下行 不匹配");
			return false;
		}
	}

	// find center component
	for(let i = 0;i<roadSegmentRecord.length;++i){
		let record = roadSegmentRecord[i];
		if((record.roadIndex === roadIndex) && (record.stopIndex === stopIndex)){
			replaceIdx = i;
			isCenter = true;
			break;
		}

		if((record.roadIndex === roadIndex) || (record.stopIndex === stopIndex)){
			isCenter =  false;
		}

		//check link crossing
		if((record.roadIndex < roadIndex && record.stopIndex > stopIndex) || (record.roadIndex > roadIndex && record.stopIndex < stopIndex) ){
			CreateLinkErrorMsg("跨越其他連結");
			return false;
		}

		//get center component
		if(roadRecord.type === "road"){
			if(record.roadIndex === roadIndex && tempStorage.stop[record.stopIndex].type === "road"){
				if(centerRoadRecord === null){
					centerRoadRecord = record;
				}else{
					if(centerRoadRecord.overrideSerialNumber < record.overrideSerialNumber){
						centerRoadRecord = record;
					}else if(centerRoadRecord.overrideSerialNumber === record.overrideSerialNumber && centerRoadRecord.serialNumber > record.serialNumber){
						centerRoadRecord = record;
					}
				}
			}
		}

		if(stopRecord.type === "road"){
			if(record.stopIndex === stopIndex && tempStorage.road[record.roadIndex].type === "road"){
				if(centerStopRecord === null){
					centerStopRecord = record;
				}else{
					if(centerStopRecord.overrideSerialNumber < record.overrideSerialNumber){
						centerStopRecord = record;
					}else if(centerStopRecord.overrideSerialNumber === record.overrideSerialNumber && centerStopRecord.serialNumber > record.serialNumber){
						centerStopRecord = record;
					}
				}
			}
		}
	}

	if(centerRoadRecord === null && centerStopRecord === null){
		if(roadRecord.type === "road" && stopRecord.type === "road"){
			isCenter = true;
		}
	}

	//road branch limit
	if(!isCenter && (roadRecord.type === "road" || stopRecord.type === "road")){
		for(let i = 0;i < roadSegmentRecord.length;++i){
			let record = roadSegmentRecord[i];
			if(centerStopRecord !== null){
				if(record.stopIndex === centerStopRecord.stopIndex && (((record.roadIndex > roadIndex) && (record.roadIndex < centerStopRecord.roadIndex)) || ((record.roadIndex < roadIndex) && (record.roadIndex > centerStopRecord.roadIndex)))){
					CreateLinkErrorMsg("過多同側岔出");
					return false;
				}
			}
			if(centerRoadRecord !== null){
				if(record.roadIndex === centerRoadRecord.roadIndex && (((record.stopIndex > stopIndex) && (record.stopIndex < centerRoadRecord.stopIndex)) || ((record.stopIndex < stopIndex) && (record.stopIndex > centerRoadRecord.stopIndex)))){
					CreateLinkErrorMsg("過多同側岔出");
					return false;
				}
			}
		}
	}

	
	// center index override
	if(replaceIdx !== -1){
		let intermidiateOverride = 0; 
		if(isCenter){
			//find max override serial
			for(let i = 0;i<roadSegmentRecord.length;++i){
				let record = roadSegmentRecord[i];
				if(record.overrideSerialNumber > intermidiateOverride ){
					intermidiateOverride = record.overrideSerialNumber;
				}
			}
			++intermidiateOverride;
		}
		roadSegmentRecord[replaceIdx].overrideSerialNumber = intermidiateOverride;
		centerRoadRecord = roadSegmentRecord[replaceIdx];
		centerStopRecord = roadSegmentRecord[replaceIdx];
		
	}else{
		// making link
		let intermidiateOverride = 0; 
		if(isCenter){
			//find max override serial
			for(let i = 0;i<roadSegmentRecord.length;++i){
				let record = roadSegmentRecord[i];
				if(record.overrideSerialNumber > intermidiateOverride ){
					intermidiateOverride = record.overrideSerialNumber;
				}
			}
			++intermidiateOverride;
		}
		
		//create component - component link
		roadSegmentRecord.push(
			{
				type:"cc",
				roadLinkType:"component",
				stopLinkType:"component",
				roadIndex: roadIndex,
				stopIndex: stopIndex,
				serialNumber: tempVariables.intermidiateSerialCounter,
				overrideSerialNumber: intermidiateOverride,
				roadSideRecord: JSON.stringify(roadRecord),
				stopSideRecord: JSON.stringify(stopRecord)
			}
			);
		if(isCenter){
			centerRoadRecord = roadSegmentRecord[roadSegmentRecord.length-1];
			centerStopRecord = centerRoadRecord;
		}
		++tempVariables.intermidiateSerialCounter;
	}

	
	console.log(centerRoadRecord, centerStopRecord);

	for(let i =0;i<roadSegmentRecord.length;++i){
		let record = roadSegmentRecord[i];
		if(roadRecord.type === "road"|| stopRecord.type === "road"){
			//check link position
			if(centerRoadRecord !== null){
				if(record.roadIndex === centerRoadRecord.roadIndex){
					if(record.stopIndex < centerRoadRecord.stopIndex){
						if(roadLeftRemoveIdx !== -1){
							roadLeftFlag = true;
							if(roadLeftRemoveIdx.stopIndex > record.stopIndex){
								roadLeftRemoveIdx = {
									index: i,
									stopIndex: record.stopIndex
								};
							}
						}else{
							roadLeftRemoveIdx = {
								index: i,
								stopIndex: record.stopIndex
							};
						}
					}else if(record.stopIndex > centerRoadRecord.stopIndex){
						if(roadRightRemoveIdx !== -1){
							roadRightFlag = true;
							if(roadRightRemoveIdx.stopIndex < record.stopIndex){
								roadRightRemoveIdx = {
									index: i,
									stopIndex: record.stopIndex
								};
							}
						}else{
							roadRightRemoveIdx = {
								index: i,
								stopIndex: record.stopIndex
							};
						}
					}
				}
			}
	
			if(centerStopRecord !== null){
				if(record.stopIndex === centerStopRecord.stopIndex){
					if(record.roadIndex < centerStopRecord.roadIndex){
						if(stopLeftRemoveIdx !== -1){
							if(stopLeftRemoveIdx.roadIndex > record.roadIndex){
								stopLeftRemoveIdx = {
									index: i,
									roadIndex: record.roadIndex
								};
							}
							stopLeftFlag = true;
						}else{
							stopLeftRemoveIdx = {
								index: i,
								roadIndex: record.roadIndex
							};
						}
					}else if(record.roadIndex > centerStopRecord.roadIndex){
						if(stopRightRemoveIdx !== -1){
							stopRightFlag = true;
							if(stopRightRemoveIdx.roadIndex < record.roadIndex){
								stopRightRemoveIdx = {
									index: i,
									roadIndex: record.roadIndex
								};
							}
						}else{
							stopRightRemoveIdx = {
								index: i,
								roadIndex: record.roadIndex
							};
						}
					}
				}
			}
		}
	}
	
	// select remove index
	if(roadRightFlag)removeIdx.push(roadRightRemoveIdx.index);
	if(roadLeftFlag)removeIdx.push(roadLeftRemoveIdx.index);
	if(stopRightFlag)removeIdx.push(stopRightRemoveIdx.index);
	if(stopLeftFlag)removeIdx.push(stopLeftRemoveIdx.index);
	removeIdx = uniq(removeIdx).sort().reverse();

/*
	console.log(
		roadRightFlag,
		roadLeftFlag,
		stopRightFlag,
		stopLeftFlag
		);
	console.log(removeIdx);
*/
	for(let i = 0;i<removeIdx.length;++i){
		roadSegmentRecord.splice(removeIdx[i], 1);
	}
	
	
	
	//console.log(roadSegmentRecord);



	return true;
}

function VerifyAndDelete(roadIndex, stopIndex, linkType){
	for(let i = 0;i<roadSegmentRecord.length;++i){
		let record = roadSegmentRecord[i];
		if(record.roadIndex === roadIndex && record.stopIndex === stopIndex && record.type === linkType){
			roadSegmentRecord.splice(i, 1);
		}
	}
}

function OnIntermidiateDragEnd(event){

	function LinkingProcess(hitElement){
		let linkage = {
			stopSection:-1,
			roadSection:-1,
		};
		
		
		let hitSection;
		let hitComponent;
		let startSection;
		let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));

		//check hit in the road
		if(hitElement === null)return;
		hitSection = hitElement.closest(".roadScope");
		
		//check hit in the section
		if(hitSection === null)return;
		hitSection = hitSection.id;

		
		if(hitElement.classList.contains("anchor")){
			startSection = dragElement.closest(".roadScope").id;

			linkage[hitSection] = parseInt(hitElement.getAttribute("index"));
			linkage[startSection] = parseInt(dragElement.getAttribute("index"));
			
			if(linkage.stopSection !== -1 && linkage.roadSection !== -1){
				tempVariables.state = JSON.parse(JSON.stringify(roadSegmentRecord));

				if(draging){
					//deleting mode
					VerifyAndDelete(linkage.roadSection, linkage.stopSection, "cp");
					// save to temp storage
					PushUndoStack(tempVariables.state);
				}else{
					let isRoadComponent = startSection === "roadSection";
					let isStopComponent = startSection === "stopSection";
					// create mode
					if(VerifyComponentPointLink(isRoadComponent, isStopComponent, linkage.roadSection, linkage.stopSection, tempStorage, true)){
						
						roadSegmentRecord.push(
							{
								type:"cp",
								roadLinkType: isRoadComponent? "component": "point",
								stopLinkType: isStopComponent? "component": "point",
								roadIndex: linkage.roadSection,
								stopIndex: linkage.stopSection,
								serialNumber: tempVariables.intermidiateSerialCounter,
								overrideSerialNumber: 0,
								roadSideRecord: isRoadComponent || linkage.roadSection < tempStorage.road.length? JSON.stringify(tempStorage.road[linkage.roadSection]) : "[]",
								stopSideRecord: isStopComponent || linkage.stopSection < tempStorage.stop.length? JSON.stringify(tempStorage.stop[linkage.stopSection]) : "[]"
							}
						);
						++tempVariables.intermidiateSerialCounter;
						
						// save to temp storage
						PushUndoStack(tempVariables.state);
					}
				}
			}
		}else{
			//check hit in the component
			hitComponent = hitElement.closest(".roadComponent");
			if (hitComponent === null) return;
	
			//link process
			linkage[hitSection] = parseInt(hitComponent.getAttribute("index"));
			linkage[dragElement.closest(".roadScope").id] = parseInt(dragElement.getAttribute("index"));
	
			if(linkage.stopSection !== -1 && linkage.roadSection !== -1){
				tempVariables.state = JSON.parse(JSON.stringify(roadSegmentRecord));
				if(draging){
					//deleting mode
					VerifyAndDelete(linkage.roadSection, linkage.stopSection, "cc");
					// save to temp storage
					PushUndoStack(tempVariables.state);
					
				}else{
					// adding mode
					if(VerifyAndLink(linkage.roadSection, linkage.stopSection)){
						PushUndoStack(tempVariables.state);
					}
				}
			}
		}

	}
	
	
	let hitElement = null;

	if(event.type === "touchend"){
		document.removeEventListener("touchend", OnIntermidiateDragEnd);
		document.removeEventListener("touchmove", OnIntermidiateDragMove);
		hitElement = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
	}else{
		hitElement = document.elementFromPoint(event.clientX, event.clientY);
		document.removeEventListener("mouseup", OnIntermidiateDragEnd);
		document.removeEventListener("mousemove", OnIntermidiateDragMove);
	}

	setTimeout(()=>{document.removeEventListener('contextmenu', PreventDefault);}, 100);

	LinkingProcess(hitElement);

	//remove event listener

	document.getElementById("dragTemp").remove();

	//remove editor dragging tag
	editorElement.classList.remove("dragging");


	// reset global variables
	draging = false;
	dragElement = null;

	RenderIntermidiateStage();
	
	//remove acceptable hint
	let sectionElements = document.getElementById("roadSection").getElementsByClassName("roadComponent");
	for(let i = 0;i < sectionElements.length; ++i){
		sectionElements[i].classList.remove("acceptable");
	}
	
	sectionElements = document.getElementById("stopSection").getElementsByClassName("roadComponent");
	for(let i = 0;i < sectionElements.length; ++i){
		sectionElements[i].classList.remove("acceptable");
	}

	sectionElements = document.getElementsByClassName("anchor");
	for(let i = 0;i < sectionElements.length; ++i){
		sectionElements[i].classList.remove("acceptable");
	}

}

function OnIntermidiateDragMove(event){
	let dragTempElement = document.getElementById("dragTemp");
	let elementWidth = parseFloat(dragTempElement.getAttribute("halfwidth"));
	let elementX = parseFloat(dragTempElement.getAttribute("x"));
	let section = dragTempElement.getAttribute("section"); 
	let startY;
	let clientX = 0;
	let clientY = 0;
	let raycast;
	let raycastSection;
	let markingRect = markingSpaceElement.getClientRects()[0];
	let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));

	if(section === "road"){
		startY = markingSpaceElement.clientHeight;
	}else if(section === "stop"){
		startY = 0;
	}
	if(event.type === "mousemove"){
		clientX = event.clientX;
		clientY = event.clientY;
	}else{
		clientX = event.touches[0].clientX;
		clientY = event.touches[0].clientY;
	}
	
	raycast = document.elementFromPoint(clientX, clientY);
	
	clientX -= markingRect.left;
	clientY -= markingRect.top;
	
	let chk = true;
	if(raycast !== null){
		raycastSection = raycast.closest(".roadScope");

		if(raycast.classList.contains("anchor")){
			let pointIndex = parseInt(raycast.getAttribute("index"));
			let endY = 0;
			let X = raycast.offsetLeft + raycast.clientWidth / 2;


			if(raycastSection.id === "roadSection"){
				endY = markingSpaceElement.clientHeight;
			}else if(raycastSection.id === "stopSection"){
				endY = 0;
			}

			chk = false;
			dragTempElement.setAttribute("points", `${elementX - elementWidth},${startY} ${elementX + elementWidth},${startY} ${X + elementWidth},${endY} ${X - elementWidth},${endY}`);
			dragTempElement.classList.add("accept");
			dragTempElement.classList.remove("fail");
		}
		else if(raycastSection !== null){
			raycastSection = raycastSection.id;
			if(raycastSection === "roadSection"){
				raycastSection = "road";
			}else if(raycastSection === "stopSection"){
				raycastSection = "stop";
			}
	
			// check inside opposite side
			if((raycastSection === "road" && section === "stop")|| (raycastSection === "stop" && section === "road")){
				let endY;
				let elementIndex = raycast.closest(".roadComponent");
				let X;
				let roadIndex;
				let stopIndex;
				
				if(elementIndex !== null){
					elementIndex = parseInt(elementIndex.getAttribute("index"));
					X = M2Px(tempVariables.componentXCoord[raycastSection][elementIndex] - tempStorage[raycastSection][elementIndex].width / 2);

					if(raycastSection === "road"){
						endY = markingSpaceElement.clientHeight;
						roadIndex = elementIndex;
						stopIndex = parseInt(dragTempElement.getAttribute("index"));
					}else if(raycastSection === "stop"){
						endY = 0;
						roadIndex = parseInt(dragTempElement.getAttribute("index"));
						stopIndex = elementIndex;
					}
					
					if(VerifyLink(roadIndex, stopIndex, tempStorage)){
						chk = false;
						dragTempElement.setAttribute("points", `${elementX - elementWidth},${startY} ${elementX + elementWidth},${startY} ${X + elementWidth},${endY} ${X - elementWidth},${endY}`);
						dragTempElement.classList.add("accept");
						dragTempElement.classList.remove("fail");
					}
				}
			}

		}
	}
	if(chk){
		dragTempElement.classList.remove("accept");
		dragTempElement.classList.add("fail");
		dragTempElement.setAttribute("points", `${elementX - elementWidth},${startY} ${elementX + elementWidth},${startY} ${clientX + elementWidth},${clientY} ${clientX - elementWidth},${clientY}`);
	}

}

function BuildIntermidiateComponent(roadIndex, stopIndex, type){
	const indicatorLineWidth = 1;
	const indicatorLineColor = "blue";
	
	let maxY = markingSpaceElement.clientHeight;
	let tl; //top left x coord
	let tr; //top right x coord
	let bl; //bottom left x coord
	let br; //bottom right x coord

	let tm; //top middle x coord
	let bm; // bottom middle x coord

	if(stopIndex === 0){
		tl = 0
	}else{
		tl = M2Px(tempVariables.componentXCoord.stop[stopIndex - 1]);
	}

	if(roadIndex === 0){
		bl = 0
	}else{
		bl = M2Px(tempVariables.componentXCoord.road[roadIndex - 1]);
	}

	tr = M2Px(tempVariables.componentXCoord.stop[stopIndex]);
	br = M2Px(tempVariables.componentXCoord.road[roadIndex]);

	tm = (tr + tl) / 2;
	bm = (br + bl) / 2;

	return [`<polygon points="${tl},${0} ${tr},${0} ${br},${maxY} ${bl},${maxY}" class="${type}"/>`, `<path d = "M ${tm} 0 L ${bm} ${maxY}" stroke="${indicatorLineColor}" stroke-width="${indicatorLineWidth}"/>`];
}

function BuildIntermidiatePointComponent(roadIndex, stopIndex, type, isRoadComponent, isStopComponent){
	
	const indicatorLineWidth = 1;
	const indicatorLineColor = "blue";
	
	let l; //left coord of the triangle shape 
	let r; //right coord of the triangle shape
	let m;
	let top; // top coord of the triangle shape
	let anchor;
	let bottomY = 0;
	let topY = 0;
	
	//get l, r, top
	if(isRoadComponent){
		if(roadIndex === 0){
			l = 0
		}else{
			l = M2Px(tempVariables.componentXCoord.road[roadIndex - 1]);
		}
		
		r = M2Px(tempVariables.componentXCoord.road[roadIndex]);
		anchor = document.getElementById(`stopPointAnchor_${stopIndex}`);
		bottomY = markingSpaceElement.clientHeight;
		topY = 0;
	}else{
		if(stopIndex === 0){
			l = 0
		}else{
			l = M2Px(tempVariables.componentXCoord.stop[stopIndex - 1]);
		}
		
		r = M2Px(tempVariables.componentXCoord.stop[stopIndex]);
		
		anchor = document.getElementById(`roadPointAnchor_${roadIndex}`);
		bottomY = 0;
		topY = markingSpaceElement.clientHeight;
		
	}

	top = anchor.offsetLeft + anchor.clientWidth / 2;
	m = (l + r) / 2;

	return [`<polygon points="${l},${bottomY} ${r},${bottomY} ${top},${topY}" class="${type}"/>`, 
	`<path d = "M ${top} ${topY} L ${m} ${bottomY}" stroke="${indicatorLineColor}" stroke-width="${indicatorLineWidth}"/>`];

}

function RenderIntermidiateStage(){
	let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));
	let indicatorMarkings = [];

	markingSpaceElement.innerHTML = "";

	for(let i = 0;i<roadSegmentRecord.length;++i){
		let component = roadSegmentRecord[i];
		let temp;
		if(component.type === "cc"){
		
			temp = BuildIntermidiateComponent(component.roadIndex, component.stopIndex, tempStorage.road[component.roadIndex].type)
		
		}else{

			let componentType = component.roadLinkType === "component"? tempStorage.road[component.roadIndex].type : tempStorage.stop[component.stopIndex].type;
			temp = BuildIntermidiatePointComponent(component.roadIndex, component.stopIndex, componentType, component.roadLinkType === "component", component.stopLinkType === "component");
			
		}
		markingSpaceElement.innerHTML += temp[0];
		indicatorMarkings.push(temp[1]);
	}

	RenderIntermediateStageMarking(tempStorage);
	
	//render indicator marking
	for(let i = 0;i<roadSegmentRecord.length;++i){
		markingSpaceElement.innerHTML += indicatorMarkings[i];
	}

	//console.log(tempVariables.componentXCoord);
	//console.log(markingSpaceElement);
}

function RenderIntermediateStageMarking(tempStorage){
	function CreateSvgLine(startPoint, endPoint, width, color, dashLengthList, offset = -0.5){
		let xOffset = width * (dashLengthList.length * 2 - 1) * offset + width / 2;
		let rtn = "";

		if(dashLengthList.length > 1){
			rtn += `<path class="markingFiller" d = "M ${startPoint[0]} ${startPoint[1]} L ${endPoint[0]} ${endPoint[1]}"  stroke-width="${ width * (dashLengthList.length * 2 - 1)}" />`;
		}
		for (let i = 0;i< dashLengthList.length;++i){
			if(dashLengthList[i] === 0){
				rtn += `<path d = "M ${startPoint[0] + xOffset} ${startPoint[1]} L ${endPoint[0] + xOffset} ${endPoint[1]}" stroke="${color}" stroke-width="${width}" />`;
			}else{
				rtn += `<path d = "M ${startPoint[0] + xOffset} ${startPoint[1]} L ${endPoint[0] + xOffset} ${endPoint[1]}" stroke="${color}" stroke-width="${width}" stroke-dasharray="${dashLengthList[i]}"/>`;
			}
			xOffset += width * 2;
		}
		return rtn;
	}

	let roadRecordMap = {};
	let stopRecordMap = {};
	let maxY = markingSpaceElement.clientHeight;
	let highPriorityMarking = [];
	let centerLookup = {
		"road":{},
		"stop":{}
	};
	let branchOutLookup = {};

	//create record entry map
	for(let i = 0;i< roadSegmentRecord.length;++i){
		let record = roadSegmentRecord[i];
		let roadRecord = tempStorage.road[record.roadIndex];
		let stopRecord = tempStorage.road[record.stopIndex];
		
		if(roadRecord.type !== "road" && roadRecord.type !== "slowlane")continue;

		if(roadRecordMap[record.roadIndex] === undefined){
			roadRecordMap[record.roadIndex] = {};
		}
		roadRecordMap[record.roadIndex][record.stopIndex] = true;
		
		if(stopRecordMap[record.stopIndex] === undefined){
			stopRecordMap[record.stopIndex] = {};
		}
		stopRecordMap[record.stopIndex][record.roadIndex] = true;
	}

	//build center lookup
	for(let i = 0;i<roadSegmentRecord.length;++i){
		let record = roadSegmentRecord[i];
		if(record.type === "cp")continue;

		let roadRecord = tempStorage.road[record.roadIndex];
		let stopRecord = tempStorage.stop[record.stopIndex];
		let centerLink = null;
		let centerIndex = -1;
		let leftBranch = false;
		let rightBranch = false;
		

		//road side
		if(roadRecord.type === "road" || roadRecord.type === "slowlane"){

			for(let j = 0;j<roadSegmentRecord.length;++j){
				let scanRecord = roadSegmentRecord[j];
				if(scanRecord.type === "cp")continue;
				if(scanRecord.roadIndex !== record.roadIndex)continue;

				if(scanRecord.stopIndex < record.stopIndex) leftBranch = true;
				if(scanRecord.stopIndex > record.stopIndex) rightBranch = true;

				let linkIndex = scanRecord.stopIndex;
				let linkComp = tempStorage.stop[linkIndex];


				if(linkComp.type === "road"){
					if(centerLink === null){
						centerLink = scanRecord;
						centerIndex = linkIndex;
					}else{
						if(centerLink.overrideSerialNumber < scanRecord.overrideSerialNumber){
							centerLink = scanRecord;
							centerIndex = linkIndex;
						}else if(centerLink.overrideSerialNumber === scanRecord.overrideSerialNumber && centerLink.serialNumber > scanRecord.serialNumber){
							centerLink = scanRecord;
							centerIndex = linkIndex;
						}
					}
				}
			}

			if(centerIndex === -1){
				centerLookup.road[record.roadIndex] = record.stopIndex;
			}else{
				centerLookup.road[record.roadIndex] = centerIndex;
			}
		}

		//stop side
		centerLink = null;
		centerIndex = -1;
		if(stopRecord.type === "road" || stopRecord.type === "slowlane"){
			for(let j = 0;j<roadSegmentRecord.length;++j){
				let scanRecord = roadSegmentRecord[j];
				if(scanRecord.type === "cp")continue;
				if(scanRecord.stopIndex !== record.stopIndex)continue;

				
				if(scanRecord.roadIndex < record.roadIndex) leftBranch = true;
				if(scanRecord.roadIndex > record.roadIndex) rightBranch = true;

				let linkIndex = scanRecord.roadIndex;
				let linkComp = tempStorage.road[linkIndex];


				if(linkComp.type === "road"){
					if(centerLink === null){
						centerLink = scanRecord;
						centerIndex = linkIndex;
					}else{
						if(centerLink.overrideSerialNumber < scanRecord.overrideSerialNumber){
							centerLink = scanRecord;
							centerIndex = linkIndex;
						}else if(centerLink.overrideSerialNumber === scanRecord.overrideSerialNumber && centerLink.serialNumber > scanRecord.serialNumber){
							centerLink = scanRecord;
							centerIndex = linkIndex;
						}
					}
				}

			}

			if(centerIndex === -1){
				centerLookup.stop[record.stopIndex] = record.roadIndex;
			}else{
				centerLookup.stop[record.stopIndex] = centerIndex;
			}
		}

		branchOutLookup[i] = {
			"left": leftBranch,
			"right": rightBranch,
		}
	}

	//build marking
	for(let i = 0; i < roadSegmentRecord.length;++i){
		let record = roadSegmentRecord[i];
		if(RemoveComponentRecord.type === "cp")continue;
		
		let roadRecord = tempStorage.road[record.roadIndex];
		let stopRecord = tempStorage.stop[record.stopIndex];

		if(roadRecord.type !== "road" && roadRecord.type !== "slowlane")continue;

		let roadLeftRecord = null;
		let stopLeftRecord = null;
		let roadRightRecord = null;
		let stopRightRecord = null;
		let isCenter = (record.stopIndex === centerLookup.road[record.roadIndex]) && (record.roadIndex === centerLookup.stop[record.stopIndex]);

		let link = {
			roadComponent: {
				width: M2Px(roadRecord.width),
				right: M2Px(tempVariables.componentXCoord.road[record.roadIndex]),
				left: M2Px(tempVariables.componentXCoord.road[record.roadIndex]) -  M2Px(roadRecord.width)
			},

			stopComponent: {
				width: M2Px(stopRecord.width),
				right: M2Px(tempVariables.componentXCoord.stop[record.stopIndex]),
				left: M2Px(tempVariables.componentXCoord.stop[record.stopIndex]) - M2Px(stopRecord.width)
			}
		};

		if(record.roadIndex !== 0){
			roadLeftRecord = tempStorage.road[record.roadIndex - 1];
			if(roadLeftRecord.type !== "road" && roadLeftRecord.type !== "slowlane"){
				roadLeftRecord = null;
			}
		}
		if(record.stopIndex !== 0){
			stopLeftRecord = tempStorage.stop[record.stopIndex - 1];
			if(stopLeftRecord.type !== "road" && stopLeftRecord.type !== "slowlane"){
				stopLeftRecord = null;
			}
		}
		if(record.roadIndex !== tempStorage.road.length - 1){
			roadRightRecord = tempStorage.road[record.roadIndex + 1];
			if(roadRightRecord.type !== "road" && roadRightRecord.type !== "slowlane"){
				roadRightRecord = null;
			}
		}
		if(record.stopIndex !== tempStorage.stop.length - 1){
			stopRightRecord = tempStorage.stop[record.stopIndex + 1];
			if(stopRightRecord.type !== "road" && stopRightRecord.type !== "slowlane"){
				stopRightRecord = null;
			}
		}
		
		//left side
		//left side branch out
		if(branchOutLookup[i].left){
			if(isCenter){
				markingSpaceElement.innerHTML += CreateSvgLine([link.roadComponent.left, maxY], [link.stopComponent.left, 0], M2Px(0.1), "white", [M2Px(1)], -0.5);
			}
		}else if(roadLeftRecord === null || stopLeftRecord === null){
			//road side marking
			markingSpaceElement.innerHTML += CreateSvgLine([link.roadComponent.left, maxY], [link.stopComponent.left, 0], M2Px(0.15), "white", [0], 0);
			
		}
		else if(roadRecordMap[record.roadIndex - 1] === undefined || stopRecordMap[record.stopIndex - 1] === undefined){
			markingSpaceElement.innerHTML += CreateSvgLine([link.roadComponent.left, maxY], [link.stopComponent.left, 0], M2Px(0.15), "white", [0], 0);
			
		}else{
			let color = "white";
			
			if(roadLeftRecord.direction !== roadRecord.direction){
				color = "yellow";
			}
			
			//slowlane
			if((roadRecord.type === "slowlane" || roadLeftRecord.type === "slowlane")|| (stopRecord.type === "slowlane"  || stopLeftRecord.type === "slowlane")){
				
				if((roadRecord.type === "road" || roadLeftRecord.type === "road" || stopRecord.type === "road"  || stopLeftRecord.type === "road") && stopRecord.type === roadRecord.type){
					markingSpaceElement.innerHTML += CreateSvgLine([link.roadComponent.left, maxY], [link.stopComponent.left, 0], M2Px(0.1), color, [0], -0.5);
				}else{
					markingSpaceElement.innerHTML += CreateSvgLine([link.roadComponent.left, maxY], [link.stopComponent.left, 0], M2Px(0.1), color, [M2Px(1)], -0.5);
				}
			}else{
				let leftCrossability = (roadLeftRecord.crossability&0b10)&(stopLeftRecord.crossability&0b10);
				let rightCrossability = (roadRecord.crossability&0b1)&(stopRecord.crossability&0b1);
				let markingList = [];

				if(leftCrossability !== 0 && rightCrossability !== 0){
					markingList = [M2Px(1)];
				}else{
					if(leftCrossability !== 0){
						markingList.push(M2Px(1));
					}else{
						markingList.push(0);
					}
					if(rightCrossability !== 0){
						markingList.push(M2Px(1));
					}else{
						markingList.push(0);
					}
				}

				let marking = CreateSvgLine([link.roadComponent.left, maxY], [link.stopComponent.left, 0], M2Px(0.1), color, markingList, -0.5);
				if(markingList.length > 1){
					highPriorityMarking.push(marking);
				}else{
					markingSpaceElement.innerHTML += marking;
				}
			}
		}
		
		//right side
		if(branchOutLookup[i].right){
			if(isCenter){
				markingSpaceElement.innerHTML += CreateSvgLine([link.roadComponent.right, maxY], [link.stopComponent.right, 0], M2Px(0.1), "white", [M2Px(1)], -0.5);
			}
		//right side branch out
		}else if(roadRightRecord === null || stopRightRecord === null){
			//road side marking
			markingSpaceElement.innerHTML += CreateSvgLine([link.roadComponent.right, maxY], [link.stopComponent.right, 0], M2Px(0.15), "white", [0], -1);
		}else if(roadRecordMap[record.roadIndex + 1] === undefined || stopRecordMap[record.stopIndex + 1] === undefined){
			markingSpaceElement.innerHTML += CreateSvgLine([link.roadComponent.right, maxY], [link.stopComponent.right, 0], M2Px(0.15), "white", [0], -1);
		}


	}

	highPriorityMarking.forEach(marking => {
		markingSpaceElement.innerHTML += marking;
	});
}

window.OnIntermidiateDragStart  = function(event){
	dragElement = event.srcElement.closest(".roadComponent");
	document.addEventListener('contextmenu', PreventDefault);
	
	let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));
	let section = dragElement.closest(".roadScope").id;;
	let dragTempElementX = 0;
	let elementIndex = parseInt(dragElement.getAttribute("index"));
	let elementType;
	let startY;
	let tempElmentWidth = 3;

	tempElmentWidth /= 2;

	//refine section name
	if(section === "roadSection"){
		section = "road";
		startY = markingSpaceElement.clientHeight;
	}else if(section === "stopSection"){
		section = "stop";
		startY = 0;
	}else{
		section = undefined;
	}

	dragTempElementX = M2Px(tempVariables.componentXCoord[section][elementIndex] - tempStorage[section][elementIndex].width / 2);
	
	//add dragint temp element to marking space
	let points = `${dragTempElementX - tempElmentWidth},${startY} ${dragTempElementX + tempElmentWidth},${startY} ${dragTempElementX + tempElmentWidth},${startY} ${dragTempElementX - tempElmentWidth},${startY}`;
	markingSpaceElement.innerHTML += `<polygon id="dragTemp" index="${dragElement.getAttribute("index")}" class="fail" x="${dragTempElementX.toString()}" halfWidth="${tempElmentWidth}" section="${section}" points="${points}"></polygon>`;
	
	
	//event handling
	if(event.type === "touchstart"){
		document.addEventListener("touchend", OnIntermidiateDragEnd);
		document.addEventListener("touchmove", OnIntermidiateDragMove);

		//TODO: add touch event delete mode

	}else{
		document.addEventListener("mouseup", OnIntermidiateDragEnd);
		document.addEventListener("mousemove", OnIntermidiateDragMove);
		if(event.button === 2){
			//deleting mode
			draging = true;
		}else{
			//linking mode
			draging = false;
		}
	}
	
	//add dragging tag to editor
	editorElement.classList.add("dragging");


	// show acceptable.
	if(section === "road"){
		let stopSectionElements = document.getElementById("stopSection").getElementsByClassName("roadComponent");
		for(let stopIndex = 0;stopIndex < tempStorage.stop.length; ++stopIndex){
			if(VerifyLink(elementIndex, stopIndex, tempStorage)){
				stopSectionElements[stopIndex].classList.add("acceptable");
			}
		}

		//visualize point link anchor
		elementType = tempStorage.road[elementIndex].type;
		if(componentConstantProperty[elementType].pointyEnd){
			for(let i = 0;i<tempStorage.stop.length + 1; ++i){
				if(VerifyComponentPointLink(true, false, elementIndex, i, tempStorage)){
					document.getElementById(`stopPointAnchor_${i}`).classList.add("acceptable");
				}
			}
		}
	}else if(section === "stop"){
		let roadSectionElements = document.getElementById("roadSection").getElementsByClassName("roadComponent");
		for(let roadIndex = 0;roadIndex < tempStorage.road.length; ++roadIndex){
			if(VerifyLink(roadIndex, elementIndex, tempStorage)){
				roadSectionElements[roadIndex].classList.add("acceptable");
			}
		}
		//cisualize point link anchor
		elementType = tempStorage.stop[elementIndex].type;
		if(componentConstantProperty[elementType].pointyEnd){
			for(let i = 0;i<tempStorage.road.length + 1; ++i){
				if(VerifyComponentPointLink(false, true, i, elementIndex, tempStorage)){
					document.getElementById(`roadPointAnchor_${i}`).classList.add("acceptable");
				}
			}
		}
	}

}

//-------------------------------------------
//
// Land Width Changer
//
//-------------------------------------------
function ChangeLandWidth(newWidth){
	let storage = JSON.parse(localStorage.getItem("tempStorage"));
	let oriStage = currentStage;
	
	//switch stage
	currentStage = 0;
	SwitchEditorRoadSegment(oriStage, 0);
	
	// update land width variables
	landWidth = newWidth;
	storage.landWidth = newWidth;
	storage.stage = currentStage;
	LandInit();
	
	//initialize landwidth indicator
	document.getElementById("landWidthIndicator").innerText = landWidth.toString();
	
	// rebuild unused section
	RebuildUnusedSection();
	UnusedMarkingSpaceInit(true, currentStage===2);


	// rebuild road section
	if(currentStage !== 2){
		ImportRoadSegmentRecordJSON(storage.road);
	}

	//update current stage marking space
	markingSpaceElement.style.opacity = "0";
	markingSpaceElement.style.transitionDuration = "500ms";
	setTimeout(()=>{
		UpdateMarkingSpace();
		markingSpaceElement.style.opacity = "1";
		setTimeout(()=>{
			markingSpaceElement.style.removeProperty("opacity");
			markingSpaceElement.style.removeProperty("transition-duration");
		}, 550);
	}, 400);
	
	//restore redo/undo stack
	RestoreSectionStack();

	// update info bar
	InfoBarSectionSwitch();

	//save change
	localStorage.setItem("tempStorage", JSON.stringify(storage));
}

window.OnClickActivateLandWidthChanger = function (event){
	let target = document.getElementById("landWidthChanger");
	let originWidthLable = document.getElementById("originWidthLable");

	if(target.classList.contains("active"))return;
	console.log(event);
	target.classList.add("active");
	
	let targetInput = document.getElementById("newLandWidth");
	targetInput.value = landWidth;
	
	originWidthLable.innerText = `腹地寬度 ${landWidth}m -> `;

	targetInput.focus();
	targetInput.select();

	setTimeout(() => {
		document.addEventListener("mousedown", ExitChangeLandWidth);
	}, 100);
}

window.CancelLandWidthChange = function(){
	let target = document.getElementById("landWidthChanger");
	target.classList.remove("active");
	document.removeEventListener("click", ExitChangeLandWidth);
}

window.ApplyLandWidthChange = function(){
	let input = document.getElementById("newLandWidth");
	let newWidth = parseFloat(input.value);
	if(newWidth !== landWidth && newWidth >= 2 && newWidth <= 100){
		console.log("change landwidth to", newWidth);
		ChangeLandWidth(newWidth);
	}

	let target = document.getElementById("landWidthChanger");
	target.classList.remove("active");
	document.removeEventListener("click", ExitChangeLandWidth);
}

function ExitChangeLandWidth(event){
	if(event.target.closest("#landWidthChanger") === null){
		let target = document.getElementById("landWidthChanger");
		target.classList.remove("active");
		document.removeEventListener("mousedown", ExitChangeLandWidth);
	}
}

//-------------------------------------------
//
// discard
//
//-------------------------------------------
/*
function RenderIntermidiateStageMarkingOld(tempStorage){
	function CreateSvgLine(startPoint, endPoint, width, color, dashLengthList, offset = -0.5){
		let xOffset = width * (dashLengthList.length * 2 - 1) * offset + width / 2;
		let rtn = "";

		if(dashLengthList.length > 1){
			rtn += `<path class="markingFiller" d = "M ${startPoint[0]} ${startPoint[1]} L ${endPoint[0]} ${endPoint[1]}"  stroke-width="${ width * (dashLengthList.length * 2 - 1)}" />`;
		}
		for (let i = 0;i< dashLengthList.length;++i){
			if(dashLengthList[i] === 0){
				rtn += `<path d = "M ${startPoint[0] + xOffset} ${startPoint[1]} L ${endPoint[0] + xOffset} ${endPoint[1]}" stroke="${color}" stroke-width="${width}" />`;
			}else{
				rtn += `<path d = "M ${startPoint[0] + xOffset} ${startPoint[1]} L ${endPoint[0] + xOffset} ${endPoint[1]}" stroke="${color}" stroke-width="${width}" stroke-dasharray="${dashLengthList[i]}"/>`;
			}
			xOffset += width * 2;
		}
		return rtn;
	}

	let roadRecordMap = {};
	let stopRecordMap = {};
	let maxY = markingSpaceElement.clientHeight;
	let highPriorityMarking = [];
	

	//create record entry map
	for(let i = 0;i< roadSegmentRecord.length;++i){
		let record = roadSegmentRecord[i];
		
		if(roadRecordMap[record.roadIndex] === undefined){
			roadRecordMap[record.roadIndex] = [i];
		}else{
			roadRecordMap[record.roadIndex].push(i);
		}
		
		if(stopRecordMap[record.stopIndex] === undefined){
			stopRecordMap[record.stopIndex] = [i];
		}else{
			stopRecordMap[record.stopIndex].push(i);
		}
	}

	//set center
	for(let i = 0;i<roadSegmentRecord.length;++i){
		let record = roadSegmentRecord[i];
		if(record.type === "cp")continue;

		if(tempStorage.road[record.roadIndex].type !== "road")continue;

		let leftCombine = {
			isCombine: false,
			index: -1
		};
		let rightCombine = {
			isCombine: false,
			index: -1
		};

		let leftMarkingSetting = {
			stop:{
				crossing: false,
				isCenter: false,
				isCover: false,
				index: -1,
				point: (0, 0)
			},
			
			road:{
				crossing: false,
				isCenter: false,
				isCover: false,
				index: -1,
				point: (0, 0)
			}
		}

		let rightMarkingSetting = {
			stop:{
				crossing: false,
				isCenter: false,
				isCover: false,
				index: -1,
				point: (0, 0)
			},
			
			road:{
				crossing: false,
				isCenter: false,
				isCover: false,
				index: -1,
				point: (0, 0)
			}
		}
		
		// check left combine marking
		if(record.roadIndex !== 0 && record.stopIndex !== 0){
			let leftRoadIndex = record.roadIndex - 1;
			if(roadRecordMap[leftRoadIndex] !== undefined){
				for(let j = 0;j<roadRecordMap[leftRoadIndex].length;++j){
					let leftRoadRecordIndex = roadRecordMap[leftRoadIndex][j];
					if(roadSegmentRecord[leftRoadRecordIndex].type === "cc" && roadSegmentRecord[leftRoadRecordIndex].stopIndex === record.stopIndex - 1 && tempStorage.road[record.roadIndex - 1].type === "road"){
						leftCombine.isCombine = true;
						leftCombine.index = leftRoadIndex;
						break;
					}
				}
			}
		}
		
		// check right combine marking
		if((record.roadIndex !== tempStorage.road.length -1) && (record.stopIndex !== tempStorage.stop.length - 1) && tempStorage.road[record.roadIndex + 1].type === "road"){
			let rightRoadIndex = record.roadIndex + 1;
			if(roadRecordMap[rightRoadIndex] !== undefined){
				for(let j = 0;j<roadRecordMap[rightRoadIndex].length;++j){
					let rightRoadRecordIndex = roadRecordMap[rightRoadIndex][j];
					if(roadSegmentRecord[rightRoadRecordIndex].type === "cc" && roadSegmentRecord[rightRoadRecordIndex].stopIndex === record.stopIndex + 1){
						rightCombine.isCombine = true;
						rightCombine.index = rightRoadRecordIndex;
						break;
					}
				}
			}
		}

		
		//set road side setting
		let roadRecordIndexList = roadRecordMap[record.roadIndex];
		if(roadRecordIndexList.length !== 1){
			for(let j = 0; j<roadRecordIndexList.length; ++j){
				if(roadRecordIndexList[j] === i)continue;
				let linkRecord = roadSegmentRecord[roadRecordIndexList[j]];
				if(linkRecord.type === "cp")continue;

				if(linkRecord.stopIndex < record.stopIndex){
					leftMarkingSetting.road.crossing = true;
					leftMarkingSetting.road.index = roadRecordIndexList[j];
					if(linkRecord.overrideSerialNumber < record.overrideSerialNumber || (linkRecord.overrideSerialNumber === record.overrideSerialNumber && linkRecord.serialNumber > record.serialNumber)){
						leftMarkingSetting.road.isCenter = true;
					}else if(linkRecord.stopIndex === record.stopIndex - 1){
						leftMarkingSetting.road.isCover = true;
					}
				}else{
					rightMarkingSetting.road.crossing = true;
					rightMarkingSetting.road.index = roadRecordIndexList[j];
					if(linkRecord.overrideSerialNumber < record.overrideSerialNumber || (linkRecord.overrideSerialNumber === record.overrideSerialNumber && linkRecord.serialNumber > record.serialNumber)){
						rightMarkingSetting.road.isCenter = true;
					}else if(linkRecord.stopIndex === record.stopIndex + 1){
						rightMarkingSetting.road.isCover = true;
					}
				}
			}
		}

		//set stop side setting
		let stopRecordIndexList = stopRecordMap[record.stopIndex];
		if(stopRecordIndexList.length !== 1){
			for(let j = 0; j<stopRecordIndexList.length; ++j){
				if(stopRecordIndexList[j] === i)continue;
				let linkRecord = roadSegmentRecord[stopRecordIndexList[j]];
				if(linkRecord.type === "cp")continue;

				if(linkRecord.roadIndex < record.roadIndex){
					leftMarkingSetting.stop.crossing = true;
					leftMarkingSetting.stop.index = stopRecordIndexList[j];
					if(linkRecord.overrideSerialNumber < record.overrideSerialNumber || (linkRecord.overrideSerialNumber === record.overrideSerialNumber && linkRecord.serialNumber > record.serialNumber)){
						leftMarkingSetting.stop.isCenter = true;
					}else if(linkRecord.roadIndex === record.roadIndex - 1){
						leftMarkingSetting.stop.isCover = true;
					}
				}else{
					rightMarkingSetting.stop.crossing = true;
					rightMarkingSetting.stop.index = stopRecordIndexList[j];
					if(linkRecord.overrideSerialNumber < record.overrideSerialNumber || (linkRecord.overrideSerialNumber === record.overrideSerialNumber && linkRecord.serialNumber > record.serialNumber)){
						rightMarkingSetting.stop.isCenter = true;
					}else if(linkRecord.roadIndex === record.roadIndex + 1){
						rightMarkingSetting.stop.isCover = true;
					}
				}
			}
		}
	
		let link = {
			roadComponent: {
				width: M2Px(tempStorage.road[record.roadIndex].width),
				right: M2Px(tempVariables.componentXCoord.road[record.roadIndex]),
				left: M2Px(tempVariables.componentXCoord.road[record.roadIndex]) -  M2Px(tempStorage.road[record.roadIndex].width)
			},

			stopComponent: {
				width: M2Px(tempStorage.stop[record.stopIndex].width),
				right: M2Px(tempVariables.componentXCoord.stop[record.stopIndex]),
				left: M2Px(tempVariables.componentXCoord.stop[record.stopIndex]) - M2Px(tempStorage.stop[record.stopIndex].width)
			}
		};
		let intersection;

		//left marking
		if(!leftCombine.isCombine){
			if(!leftMarkingSetting.road.isCover && !leftMarkingSetting.stop.isCover){
				//if crossing at roadSide
				if(leftMarkingSetting.road.crossing){
					if( roadSegmentRecord[leftMarkingSetting.road.index].type==="cp"){
						leftMarkingSetting.road.crossing = false;
					}
				}

				if(leftMarkingSetting.stop.crossing){
					if( roadSegmentRecord[leftMarkingSetting.stop.index].type==="cp"){
						leftMarkingSetting.stop.crossing = false;
					}
				}

				if(leftMarkingSetting.road.crossing){
					let crossLink = roadSegmentRecord[leftMarkingSetting.road.index];
					//if is center
					if(leftMarkingSetting.road.isCenter || leftMarkingSetting.stop.isCenter){
						intersection = LineLineIntersection(
								link.roadComponent.left, maxY, 
								link.stopComponent.left, 0, 
								M2Px(tempVariables.componentXCoord.road[crossLink.roadIndex]), maxY, 
								M2Px(tempVariables.componentXCoord.stop[crossLink.stopIndex]), 0
						);

						markingSpaceElement.innerHTML += CreateSvgLine(
							[link.roadComponent.left, maxY],
							intersection, 
							M2Px(0.1), 
							"white", 
							[M2Px(1)],
							-0.5
						);
					}else{
						intersection = LineLineIntersection(
							link.roadComponent.left, maxY, 
							link.stopComponent.left, 0, 
							M2Px(tempVariables.componentXCoord.road[crossLink.roadIndex]), maxY, 
							M2Px(tempVariables.componentXCoord.stop[crossLink.stopIndex]), 0
						);
					}
					
					markingSpaceElement.innerHTML += CreateSvgLine(intersection, [link.stopComponent.left, 0], M2Px(0.15), "white", [0], 0);
					
				}// crossing at stop side
				else if(leftMarkingSetting.stop.crossing){
					let crossLink = roadSegmentRecord[leftMarkingSetting.stop.index];
					if(leftMarkingSetting.road.isCenter || leftMarkingSetting.stop.isCenter){
						intersection = LineLineIntersection(
								link.roadComponent.left, maxY, 
								link.stopComponent.left, 0, 
								M2Px(tempVariables.componentXCoord.road[crossLink.roadIndex]), maxY, 
								M2Px(tempVariables.componentXCoord.stop[crossLink.stopIndex]), 0
						);

						markingSpaceElement.innerHTML += CreateSvgLine(
							[link.stopComponent.left, 0],
							intersection, 
							M2Px(0.1), 
							"white", 
							[M2Px(1)],
							-0.5
						);
					}else{
						intersection = LineLineIntersection(
							link.roadComponent.left, maxY, 
							link.stopComponent.left, 0, 
							M2Px(tempVariables.componentXCoord.road[crossLink.roadIndex]), maxY, 
							M2Px(tempVariables.componentXCoord.stop[crossLink.stopIndex]), 0
						);
					}
					
					markingSpaceElement.innerHTML += CreateSvgLine(intersection, [link.roadComponent.left, maxY], M2Px(0.15), "white", [0], 0);
				}else{
					markingSpaceElement.innerHTML += CreateSvgLine([link.roadComponent.left, maxY], [link.stopComponent.left, 0], M2Px(0.15), "white", [0], 0);
				}
			}
		}  

		//right marking
		if(rightCombine.isCombine){
			let color = "white";

			let rightLink = roadSegmentRecord[rightCombine.index];

			let roadElement;
			let stopElement;
			let rightRoadElement;
			let rightStopElement;

			let leftCrossability;
			let rightCrossability;

			let markingList = [];

			roadElement = tempStorage.road[record.roadIndex];
			stopElement = tempStorage.stop[record.stopIndex];
			rightRoadElement = tempStorage.road[rightLink.roadIndex];
			rightStopElement = tempStorage.stop[rightLink.stopIndex];

			//set marking color
			if(rightRoadElement.direction !== roadElement.direction){
				color = "yellow";
			}

			leftCrossability = (roadElement.crossability&0b10)&(stopElement.crossability&0b10);
			rightCrossability = (rightRoadElement.crossability&0b1)&(rightStopElement.crossability&0b1);

			if(leftCrossability !== 0 && rightCrossability !== 0){
				markingList = [M2Px(1)];
			}else{
				if(leftCrossability !== 0){
					markingList.push(M2Px(1));
				}else{
					markingList.push(0);
				}
				if(rightCrossability !== 0){
					markingList.push(M2Px(1));
				}else{
					markingList.push(0);
				}
			}

			let marking = CreateSvgLine([link.roadComponent.right, maxY], [link.stopComponent.right, 0], M2Px(0.1), color, markingList, -0.5);
			if(markingList.length > 1){
				highPriorityMarking.push(marking);
			}else{
				markingSpaceElement.innerHTML += marking;
			}
		}else{
			if(!rightMarkingSetting.road.isCover && !rightMarkingSetting.stop.isCover){
				//if crossing at roadSide
				if(rightMarkingSetting.road.crossing){
					let crossLink = roadSegmentRecord[rightMarkingSetting.road.index];
					if(rightMarkingSetting.road.isCenter || rightMarkingSetting.stop.isCenter){
						intersection = LineLineIntersection(
								link.roadComponent.right, maxY, 
								link.stopComponent.right, 0, 
								M2Px(tempVariables.componentXCoord.road[crossLink.roadIndex] - tempStorage.road[crossLink.roadIndex].width), maxY, 
								M2Px(tempVariables.componentXCoord.stop[crossLink.stopIndex] - tempStorage.stop[crossLink.stopIndex].width), 0
						);

						markingSpaceElement.innerHTML += CreateSvgLine(
							[link.roadComponent.right, maxY],
							intersection, 
							M2Px(0.1), 
							"white", 
							[M2Px(1)],
							-0.5
						);
					}else{
						intersection = LineLineIntersection(
							link.roadComponent.right, maxY, 
							link.stopComponent.right, 0, 
							M2Px(tempVariables.componentXCoord.road[crossLink.roadIndex] - tempStorage.road[crossLink.roadIndex].width), maxY, 
							M2Px(tempVariables.componentXCoord.stop[crossLink.stopIndex] - tempStorage.stop[crossLink.stopIndex].width), 0
						);
					}
					
					markingSpaceElement.innerHTML += CreateSvgLine(intersection, [link.stopComponent.right, 0], M2Px(0.15), "white", [0], -1);
				}else if(rightMarkingSetting.stop.crossing){
					let crossLink = roadSegmentRecord[rightMarkingSetting.stop.index];
					if(rightMarkingSetting.road.isCenter || rightMarkingSetting.stop.isCenter){
						intersection = LineLineIntersection(
								link.roadComponent.right, maxY, 
								link.stopComponent.right, 0, 
								M2Px(tempVariables.componentXCoord.road[crossLink.roadIndex] - tempStorage.road[crossLink.roadIndex].width), maxY, 
								M2Px(tempVariables.componentXCoord.stop[crossLink.stopIndex] - tempStorage.stop[crossLink.stopIndex].width), 0
						);

						markingSpaceElement.innerHTML += CreateSvgLine(
							[link.stopComponent.right, 0],
							intersection, 
							M2Px(0.1), 
							"white", 
							[M2Px(1)],
							-0.5
						);
					}else{
						intersection = LineLineIntersection(
							link.roadComponent.right, maxY, 
							link.stopComponent.right, 0, 
							M2Px(tempVariables.componentXCoord.road[crossLink.roadIndex] - tempStorage.road[crossLink.roadIndex].width), maxY, 
							M2Px(tempVariables.componentXCoord.stop[crossLink.stopIndex] - tempStorage.stop[crossLink.stopIndex].width), 0
						);
					}
					
					markingSpaceElement.innerHTML += CreateSvgLine(intersection, [link.roadComponent.right, maxY], M2Px(0.15), "white", [0], -1);
				}else{
					markingSpaceElement.innerHTML += CreateSvgLine([link.roadComponent.right, maxY], [link.stopComponent.right, 0], M2Px(0.15), "white", [0], -1);
				}
			}
		}
	}

	highPriorityMarking.forEach(marking => {
		markingSpaceElement.innerHTML += marking;
	});
}
//*/
