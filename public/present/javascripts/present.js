
//-----------------------------------------
//
// Global Variables
//
//-----------------------------------------
const EditorPath =  window.location.protocol + "//"+ window.location.host;
const Sections = ["road", "stop", "intermidiate"];
const PresentStages = ["confirm", "present"];
const StopSectionLength = 18;
const MinRoadSectionLength = 5;

const DefaultRoadRecord = '{\"intermidiateLength\":0,\"record\":{\"landWidth\":9,\"stage\":2,\"tempVersion\":\"1\",\"hasArcade\":false,\"roadType\":\"service\",\"road\":[{\"type\":\"sidewalk\",\"width\":1.5},{\"type\":\"road\",\"width\":3,\"direction\":1,\"exitDirection\":7,\"crossability\":3},{\"type\":\"road\",\"width\":3,\"direction\":2,\"exitDirection\":7,\"crossability\":3},{\"type\":\"sidewalk\",\"width\":1.5}],\"stop\":[{\"type\":\"sidewalk\",\"width\":1.5},{\"type\":\"road\",\"width\":3,\"direction\":1,\"exitDirection\":7,\"crossability\":3},{\"type\":\"road\",\"width\":3,\"direction\":2,\"exitDirection\":7,\"crossability\":3},{\"type\":\"sidewalk\",\"width\":1.5}],\"intermidiate\":[{\"type\":\"cc\",\"roadLinkType\":\"component\",\"stopLinkType\":\"component\",\"roadIndex\":2,\"stopIndex\":2,\"serialNumber\":1,\"overrideSerialNumber\":1,\"roadSideRecord\":\"{\\"type\\":\\"road\\",\\"width\\":3,\\"direction\\":2,\\"exitDirection\\":7,\\"crossability\\":3}\",\"stopSideRecord\":\"{\\"type\\":\\"road\\",\\"width\\":3,\\"direction\\":2,\\"exitDirection\\":7,\\"crossability\\":3}\"},{\"type\":\"cc\",\"roadLinkType\":\"component\",\"stopLinkType\":\"component\",\"roadIndex\":3,\"stopIndex\":3,\"serialNumber\":2,\"overrideSerialNumber\":2,\"roadSideRecord\":\"{\\"type\\":\\"sidewalk\\",\\"width\\":1.5}\",\"stopSideRecord\":\"{\\"type\\":\\"sidewalk\\",\\"width\\":1.5}\"},{\"type\":\"cc\",\"roadLinkType\":\"component\",\"stopLinkType\":\"component\",\"roadIndex\":1,\"stopIndex\":1,\"serialNumber\":3,\"overrideSerialNumber\":3,\"roadSideRecord\":\"{\\"type\\":\\"road\\",\\"width\\":3,\\"direction\\":1,\\"exitDirection\\":7,\\"crossability\\":3}\",\"stopSideRecord\":\"{\\"type\\":\\"road\\",\\"width\\":3,\\"direction\\":1,\\"exitDirection\\":7,\\"crossability\\":3}\"},{\"type\":\"cc\",\"roadLinkType\":\"component\",\"stopLinkType\":\"component\",\"roadIndex\":0,\"stopIndex\":0,\"serialNumber\":4,\"overrideSerialNumber\":4,\"roadSideRecord\":\"{\\"type\\":\\"sidewalk\\",\\"width\\":1.5}\",\"stopSideRecord\":\"{\\"type\\":\\"sidewalk\\",\\"width\\":1.5}\"}],\"confirm\":1}}';

//copy from roadEditor.js
const componentLayout = {
	'road': ["direction", "exitDirection", "crossability"],
	'bollard':[],
	'sidewalk':[],
	'shoulder':[],
}

let workingAreaElement = document.getElementById("workingArea");
let stateNameElement = document.getElementById("stateName");
let dimensionSwitchElement = document.getElementById("dimensionSwitch");
let sectionSwitchElement = document.getElementById("sectionSwitch");

let tempVariable = {
	intermidiateLength: 0 ,
	stopLength: 18,
	landWidth: 0,
	componentX : {
		road: [],
		stop: []
	},
}

let intersectionRecord = {
	primaryRoad: {},
	intersection: [],
};

//TODO:remove before publish
//------------------------------------------
//
// Debug function 
//
//------------------------------------------
window.unconfirm = function(){
	let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));
	tempStorage.confirm = 0;
	localStorage.setItem("tempStorage", JSON.stringify(tempStorage));
	location.reload();
}

window.createTemplate = function(){
	let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));
	let output = {
		roadType: tempStorage.roadType,
		version: "1", //copy from roadEditor.js, tempStorageTemplate.version
		section:{
			road:tempStorage.road,
			stop:tempStorage.stop,
			intermidiate: tempStorage.intermidiate
		}
	}

	console.log(JSON.stringify(output));
}

//------------------------------------------
//
// Initialization Functions
//
//------------------------------------------
window.onload = function(){
	let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));
	console.log("present Load");

	//input validation
	if(!InputValidation(tempStorage)){
		if(tempStorage.confirm === 1){
			tempStorage.confirm = 0;
			localStorage.setItem("tempStorage", JSON.stringify(tempStorage));
		}
		location.replace(EditorPath);
	}

	workingAreaElement = document.getElementById("workingArea");
	stateNameElement = document.getElementById("stateName");

	if(tempStorage.confirm !== 1){
		document.getElementById("mainWindow").classList.add("confirm");
		SwitchConfirmStage();
		return;
	}
	
	BuildIntersection();
	Switch2DRoad();
}

//------------------------------------------
//
// Control Button Functions
//
//------------------------------------------
window.OnReturnToEditor = function(){
	console.log("return to editor");
	console.log(EditorPath);
	location.replace(EditorPath);
}

window.OnConfirm = function (){
	//change into present stage
	document.getElementById("mainWindow").classList.remove("confirm");

	//change tempStorage
	let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));
	tempStorage.confirm = 1;
	localStorage.setItem("tempStorage", JSON.stringify(tempStorage));

	// build intersection Record
	BuildIntersection();

	//switch stage
	Switch2DRoad();
}

window.OnTo3D = function (){
	Switch3DView();
}

window.OnToIntersection = function(){
	Switch2DIntersection();
}

window.OnTo2DRoad = function(){
	Switch2DRoad();
}


window.OnCrossEnable = function(){
	console.log("enable cross section view");
	let crossViewElement = document.createElement("div");
	crossViewElement.id = "crossView";
	crossViewElement.addEventListener("focusout", window.OnCrossDisable);
	crossViewElement.tabIndex = 0;
	workingAreaElement.appendChild(crossViewElement);
	crossViewElement.focus();
	crossViewElement.classList.add("active");

	dimensionSwitchElement.disabled = true;
}

window.OnCrossDisable = function(){
	console.log("disable cross section view");
	let crossViewElement = document.getElementById("crossView");
	crossViewElement.classList.remove("active");
	dimensionSwitchElement.disabled = false;

	setTimeout((crossViewElement) => {
		crossViewElement.remove();
	}, 300, crossViewElement);
}

//------------------------------------------
//
// Validation Functions 
//
//------------------------------------------
function InputValidation(storageJSON){
	let keys;
	try {
		storageJSON = JSON.parse(localStorage.getItem("tempStorage"));

		tempVariable.landWidth = storageJSON.landWidth;

		//check stage integrity
		Sections.forEach(section => {
			if(storageJSON[section] === undefined)throw `${section} section missing`;
		});

		Sections.forEach(section => {
			if(section !== "intermidiate"){
				let records = storageJSON[section];
				let widthSum = 0;
				tempVariable.componentX[section] = [];
				
				//verify the components
				records.forEach(component=>{
					let layout = componentLayout[component.type];
					
					if(component.width === undefined)throw "component width missing";
					tempVariable.componentX[section].push(widthSum);
					widthSum += component.width;

					if(layout === undefined)throw "component not found";
					layout.forEach(attr=>{
						if(component[attr] === undefined)throw "component attrbute not found";
					})
				});

				tempVariable.componentX[section].push(tempVariable.landWidth);

				if(widthSum !== storageJSON.landWidth)throw "land width miss match";
			}else{
				let hasConnect = {
					road:[],
					stop:[]
				};

				let connectivity = {
					road:{},
					stop:{}
				};

				let maxDiv = 0;

				//build lookup tables
				for(let i = 0;i<storageJSON[section].length; ++i){
					let record = storageJSON[section][i];
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
						
						if(storageJSON.road[record.roadIndex].type === "road"){
							let temp = Math.abs(
								(tempVariable.componentX.road[record.roadIndex] + tempVariable.componentX.road[record.roadIndex + 1]) / 2 - 
								(tempVariable.componentX.stop[record.stopIndex] + tempVariable.componentX.stop[record.stopIndex] + 1) / 2
							);
							if(temp > maxDiv){
								maxDiv = temp;
							}
						}
					}
				}
				tempVariable.intermidiateLength = 16 * maxDiv;
				
				intersectionRecord.primaryRoad.intermidiateLength = tempVariable.intermidiateLength;
				intersectionRecord.primaryRoad.record = JSON.parse(JSON.stringify(storageJSON));

				//check all road, sidewalk has connection
					//road section
				for(let i = 0;i<storageJSON.road.length;++i){
					let record = storageJSON.road[i];
					if(record.type==="road" || record.type === "sidewalk"){
						if(!hasConnect.road.includes(i)){
							throw "road section intermidiate connection missing";
						}

						
					}
				}

					//stop section
				for(let i = 0;i<storageJSON.stop.length;++i){
					let record = storageJSON.stop[i];
					if(record.type==="road" || record.type === "sidewalk"){
						if(!hasConnect.stop.includes(i)){
							throw "stop section intermidiate connection missing";
						}
					}
				}

				//check road component exit direction connection
					//road section
				for(let i = 0;i< storageJSON.road.length;++i){
					let record = storageJSON.road[i];
					if(record.type === "road" && record.direction !== 3){
						let temp = 0;
						if(connectivity.road[i] !== undefined){
							for(let j = 0;j< connectivity.road[i].length;++j){
								temp |= storageJSON.stop[connectivity.road[i][j]].exitDirection;
							}
						}
						
						if(record.exitDirection - temp > 0){
							throw "road section road component exit direction miss match";
						}
					}
				}
					//stop section
				for(let i = 0;i< storageJSON.stop.length;++i){
					let record = storageJSON.stop[i];
					if(record.type === "road" && record.direction !== 3){
						let temp = 0;
						if(connectivity.stop[i] !== undefined){
							for(let j = 0;j< connectivity.stop[i].length;++j){
								temp |= storageJSON.road[connectivity.stop[i][j]].exitDirection;
							}
						}
						
			
						if(record.exitDirection - temp > 0){
							throw "stop section road component exit direction miss match";
						}
					}
				}
			}
		});
	} catch (error) {
		console.log(error);
		return false;
	}
	return true;
}

//------------------------------------------
//
// Render Functions
//
//------------------------------------------
function IntersectionSvgLayout(){

}


function RenderRoad(roadRecord){
	let svgElement = document.getElementById("roadRenderArea");
	let minLength = roadRecord.intermidiateLength + StopSectionLength + MinRoadSectionLength;
	let roadLength = 0;
	let M2PxFactor = 0;
	let yOffset = 0;

	//clear svg
	svgElement.innerHTML = "";

	//get aspect ratio
	if(svgElement.clientWidth / minLength * roadRecord.record.landWidth <  svgElement.clientHeight){
		M2PxFactor = svgElement.clientWidth / minLength;
		yOffset = (svgElement.clientHeight - roadRecord.record.landWidth * M2PxFactor) / 2;
		roadLength = MinRoadSectionLength;
	}else{
		M2PxFactor = svgElement.clientHeight / roadRecord.record.landWidth;
		roadLength = svgElement.clientWidth / M2PxFactor - StopSectionLength - roadRecord.intermidiateLength;
	}

	

}

//------------------------------------------
//
// Stage Switch function
//
//------------------------------------------
function BuildIntersection(){
	//let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));

	// build intersection Record
	//intersectionRecord.primaryRoad.record = JSON.parse(JSON.stringify(tempStorage));
	intersectionRecord.intersection = [];
	intersectionRecord.intersection.push(JSON.parse(JSON.stringify(intersectionRecord.primaryRoad)));
	intersectionRecord.intersection.push(JSON.parse(DefaultRoadRecord));
	intersectionRecord.intersection.push(JSON.parse(JSON.stringify(intersectionRecord.primaryRoad)));
	intersectionRecord.intersection.push(JSON.parse(DefaultRoadRecord));
	console.log(intersectionRecord);
}



function SetToolbar(sectionTarget, stateName, dimensionTarget){
	//set section switch
	if(sectionTarget === "road"){
		sectionSwitchElement.disabled = false;
		sectionSwitchElement.innerText = "切換道路顯示";
		sectionSwitchElement.onclick = window.OnTo2DRoad;
	}else if(sectionTarget === "intersection"){
		sectionSwitchElement.disabled = false;
		sectionSwitchElement.innerText = "切換路口顯示";
		sectionSwitchElement.onclick = window.OnToIntersection;
		
	}else{
		sectionSwitchElement.disabled = true;
		sectionSwitchElement.innerText = "";
		sectionSwitchElement.onclick = null;
	}

	// set dimension switch
	if(dimensionTarget === "2D"){
		dimensionSwitchElement.disabled = false;
		dimensionSwitchElement.innerText = "切換2D顯示";
		dimensionSwitchElement.onclick = window.OnToIntersection;
	}else if(dimensionTarget === "3D"){
		dimensionSwitchElement.disabled = false;
		dimensionSwitchElement.innerText = "切換3D顯示";
		dimensionSwitchElement.onclick = window.OnTo3D;
		
	}else if(dimensionTarget === "cross"){
		dimensionSwitchElement.disabled = false;
		dimensionSwitchElement.innerText = "展開斷面顯示";
		dimensionSwitchElement.onclick = window.OnCrossEnable;
	}else{
		dimensionSwitchElement.disabled = true;
		dimensionSwitchElement.innerText = "";
		dimensionSwitchElement.onclick = null;
	}
	
	stateNameElement.innerText = stateName;

}

function SwitchConfirmStage(){
	//let render = RenderConfirmStage();
	let svg;
	//set working area
	RenderRoad(intersectionRecord.primaryRoad);
}

function Switch2DRoad(){
	if(document.getElementById("roadRenderArea") === null){
		//render road
		RenderRoad(intersectionRecord.primaryRoad);
	}

	SetToolbar("intersection","2D 道路", "cross");
}

function Switch2DIntersection(){
	console.log("switch 2d intersection");
	SetToolbar("road","2D 路口", "3D");
}

function Switch3DView(){
	console.log("switch 3d view");
	SetToolbar(undefined,"3D 路口", "2D");
}


