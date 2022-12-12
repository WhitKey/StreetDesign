
//-----------------------------------------
//
// Global Variables
//
//-----------------------------------------
const EditorPath =  window.location.protocol + "//"+ window.location.host;
const Sections = ["road", "stop", "intermidiate"];
const PresentStages = ["confirm", "present"];

//copy from editor.js
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
	console.log(tempVariable);
	return true;
}

//------------------------------------------
//
// Render Functions
//
//------------------------------------------
function RenderRoad(id, direction){
	//id: id of the svg component
	//direction: 0->left, 1:top, 2:right, 3:bottom
	console.log(`render at ${id}, ${direction}`);
	console.log(document.getElementById(id));
}

//------------------------------------------
//
// Stage Switch function
//
//------------------------------------------
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
	console.log("switch confirm stage");
	


	//set working area
	svg = document.createElement("svg");
	svg.style.height="100%";
	svg.style.width="100%";
	svg.style.backgroundColor= " rgb(161, 114, 43)";
	svg.id = "roadRenderArea";
	workingAreaElement.innerHTML = svg.outerHTML;
	setTimeout(()=>{RenderRoad("roadRenderArea", 0), 100});
}

function Switch2DRoad(){
	console.log("switch 2d road");
	if(document.getElementById("roadRenderArea") === null){
		//render road
		let svg = document.createElement("svg");
		svg.style.height="100%";
		svg.style.width="100%";
		svg.style.backgroundColor= " rgb(161, 114, 43)";
		svg.id = "roadRenderArea";
		workingAreaElement.innerHTML = svg.outerHTML;
		setTimeout(()=>{RenderRoad("roadRenderArea", 0), 100});
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


