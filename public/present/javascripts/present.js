
import * as present3d from "./present3d.js";

//-----------------------------------------
//
// Global Variables
//
//-----------------------------------------
const EditorPath = "../roadEditor";
const Sections = ["road", "stop", "intermidiate"];
const PresentStages = ["confirm", "present"];
const StopSectionLength = 18;
const MinRoadSectionLength = 5;
const MinIntermidiateSectionLength = 1;
const RoadLength3d = 50;

const ComponentType2Name = {
	shoulder:"路肩",
	road:"道路",
	sidewalk:"人行道",
	bollard:"分隔島",
	slowlane:"慢車道"
}

const DefaultRoadRecord = '{\"intermidiateLength\":0,\"record\":{\"landWidth\":9,\"stage\":2,\"tempVersion\":\"1\",\"hasArcade\":false,\"roadType\":\"service\",\"road\":[{\"type\":\"sidewalk\",\"width\":1.5},{\"type\":\"road\",\"width\":3,\"direction\":1,\"exitDirection\":7,\"crossability\":3},{\"type\":\"road\",\"width\":3,\"direction\":2,\"exitDirection\":7,\"crossability\":3},{\"type\":\"sidewalk\",\"width\":1.5}],\"stop\":[{\"type\":\"sidewalk\",\"width\":1.5},{\"type\":\"road\",\"width\":3,\"direction\":1,\"exitDirection\":7,\"crossability\":3},{\"type\":\"road\",\"width\":3,\"direction\":2,\"exitDirection\":7,\"crossability\":3},{\"type\":\"sidewalk\",\"width\":1.5}],\"intermidiate\":[{\"type\":\"cc\",\"roadLinkType\":\"component\",\"stopLinkType\":\"component\",\"roadIndex\":2,\"stopIndex\":2,\"serialNumber\":1,\"overrideSerialNumber\":1,\"roadSideRecord\":\"{\\"type\\":\\"road\\",\\"width\\":3,\\"direction\\":2,\\"exitDirection\\":7,\\"crossability\\":3}\",\"stopSideRecord\":\"{\\"type\\":\\"road\\",\\"width\\":3,\\"direction\\":2,\\"exitDirection\\":7,\\"crossability\\":3}\"},{\"type\":\"cc\",\"roadLinkType\":\"component\",\"stopLinkType\":\"component\",\"roadIndex\":3,\"stopIndex\":3,\"serialNumber\":2,\"overrideSerialNumber\":2,\"roadSideRecord\":\"{\\"type\\":\\"sidewalk\\",\\"width\\":1.5}\",\"stopSideRecord\":\"{\\"type\\":\\"sidewalk\\",\\"width\\":1.5}\"},{\"type\":\"cc\",\"roadLinkType\":\"component\",\"stopLinkType\":\"component\",\"roadIndex\":1,\"stopIndex\":1,\"serialNumber\":3,\"overrideSerialNumber\":3,\"roadSideRecord\":\"{\\"type\\":\\"road\\",\\"width\\":3,\\"direction\\":1,\\"exitDirection\\":7,\\"crossability\\":3}\",\"stopSideRecord\":\"{\\"type\\":\\"road\\",\\"width\\":3,\\"direction\\":1,\\"exitDirection\\":7,\\"crossability\\":3}\"},{\"type\":\"cc\",\"roadLinkType\":\"component\",\"stopLinkType\":\"component\",\"roadIndex\":0,\"stopIndex\":0,\"serialNumber\":4,\"overrideSerialNumber\":4,\"roadSideRecord\":\"{\\"type\\":\\"sidewalk\\",\\"width\\":1.5}\",\"stopSideRecord\":\"{\\"type\\":\\"sidewalk\\",\\"width\\":1.5}\"}],\"confirm\":1}}';

//copy from roadEditor.js
const componentLayout = {
	'road': ["direction", "exitDirection", "crossability"],
	'bollard':[],
	'sidewalk':[],
	'shoulder':[],
	'slowlane':[],
}

let workingAreaElement = document.getElementById("workingArea");
let stateNameElement = document.getElementById("stateName");
let dimensionSwitchElement = document.getElementById("dimensionSwitch");
let sectionSwitchElement = document.getElementById("sectionSwitch");
let crossViewElement = document.getElementById("crossView");

let currentStage = 0;
let modelParameter = null;

let tempVariable = {
	intermidiateLength: 0 ,
	stopLength: 18,
	landWidth: 0,
	componentX : {
		road: [],
		stop: []
	},
	resizeFunction: undefined
};

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

window.toggleCrossViewDisable = function(){
	//remember to modify OnCrossDisable
	if(tempVariable.crossViewDisable === undefined){
		tempVariable.crossViewDisable = 1;
		console.log("disable cross view disable function");
	}else{
		tempVariable.crossViewDisable = undefined;
		console.log("enable cross view disable function");
	}
}

//------------------------------------------
//
// Utilities Functions
//
//------------------------------------------
window.ResizeTrigger = function(){
	const timeWindow = 300;
	console.log("resize");

	if(tempVariable.resizeFunction === undefined)return;

	if(tempVariable.timeout === undefined){
		tempVariable.timeout = null;
	}
	if(tempVariable.timeout){
		clearTimeout(tempVariable.timeout); 
	}
	tempVariable.timeout = setTimeout(()=>{tempVariable.resizeFunction(tempVariable.resizeVariable);}, timeWindow);
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
	crossViewElement = document.getElementById("crossView");

	BuildCrossSectionView(tempStorage);
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
	
	crossViewElement.addEventListener("focusout", window.OnCrossDisable);
	crossViewElement.tabIndex = 0;
	crossViewElement.focus();
	crossViewElement.classList.add("active");

	dimensionSwitchElement.disabled = true;
	dimensionSwitchElement.style.pointerEvents = "none";
}

window.OnCrossDisable = function(){
	console.log("disable cross section view");
	if(tempVariable.crossViewDisable === undefined){
		crossViewElement.classList.remove("active");
	}
	dimensionSwitchElement.disabled = false;
	dimensionSwitchElement.style.pointerEvents = "unset";
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
						
						if(storageJSON.road[record.roadIndex].type === "road" || storageJSON.road[record.roadIndex].type === "slowlane"){
							let temp = Math.abs(
								(tempVariable.componentX.road[record.roadIndex] + tempVariable.componentX.road[record.roadIndex + 1]) / 2 - 
								(tempVariable.componentX.stop[record.stopIndex] + tempVariable.componentX.stop[record.stopIndex + 1]) / 2
							);
							if(temp > maxDiv){
								maxDiv = temp;
							}
						}
					}
				}
				tempVariable.intermidiateLength = 16 * maxDiv;
				if(tempVariable.intermidiateLength < MinIntermidiateSectionLength){
					tempVariable.intermidiateLength = MinIntermidiateSectionLength;
				}

				intersectionRecord.primaryRoad.intermidiateLength = tempVariable.intermidiateLength;
				intersectionRecord.primaryRoad.record = JSON.parse(JSON.stringify(storageJSON));

				//check all road, sidewalk, slowlane has connection
					//road section
				for(let i = 0;i<storageJSON.road.length;++i){
					let record = storageJSON.road[i];
					if(record.type==="road" || record.type === "sidewalk" || record.type === "slowlane"){
						if(!hasConnect.road.includes(i)){
							throw "road section intermidiate connection missing";
						}

						
					}
				}

					//stop section
				for(let i = 0;i<storageJSON.stop.length;++i){
					let record = storageJSON.stop[i];
					if(record.type==="road" || record.type === "sidewalk" || record.type === "slowlane"){
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
								if(storageJSON.stop[connectivity.road[i][j]].type === "road"){
									temp |= storageJSON.stop[connectivity.road[i][j]].exitDirection;
								}
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
								if(storageJSON.road[connectivity.stop[i][j]].type === "road"){
									temp |= storageJSON.road[connectivity.stop[i][j]].exitDirection;
								}
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
		location.href = "../entryPage";
		return false;
	}
	return true;
}

//------------------------------------------
//
// Road Section Functions
//
//------------------------------------------
function CalculateRoadSetting(roadRecord, svgElementId){
	let svgElement = document.getElementById(svgElementId);
	let minLength = roadRecord.intermidiateLength + StopSectionLength + MinRoadSectionLength;
	let roadLength = 0;
	let M2PxFactor = 0;
	let yOffset = 0;
	let intermidiateStartX = 0;
	let intermidiateEndX = 0;
	let intermidiateMidX = 0;

	if(svgElement.clientWidth / minLength * roadRecord.record.landWidth <  svgElement.clientHeight){
		M2PxFactor = svgElement.clientWidth / minLength;
		yOffset = (svgElement.clientHeight - roadRecord.record.landWidth * M2PxFactor) / 2;
		roadLength = MinRoadSectionLength;
	}else{
		M2PxFactor = svgElement.clientHeight / roadRecord.record.landWidth;
		roadLength = svgElement.clientWidth / M2PxFactor - StopSectionLength - roadRecord.intermidiateLength;
	}

	intermidiateStartX = roadLength * M2PxFactor;
	intermidiateEndX = svgElement.clientWidth - StopSectionLength * M2PxFactor;
	intermidiateMidX = (intermidiateEndX + intermidiateStartX) / 2;

	return {
		"yOffset": yOffset,
		"intermidiateStartX": intermidiateStartX,
		"intermidiateMidX": intermidiateMidX,
		"intermidiateEndX": intermidiateEndX,
		"M2PxFactor":M2PxFactor
	};

}

function CreateLineMarking(lineProp, points, yOffsetDir = 1, coloroverride = undefined){
	let rtn = "";
	let lineWidth = lineProp.width * tempVariable.M2PxFactor;
	let dashLength = 3 * tempVariable.M2PxFactor;
	let color = "white";
	let totalWidth;
	let temp = "";
	let yOffset = 0;
	
	if((lineProp.width === 0.15) || (lineProp.left === 1 && lineProp.right === 1) || lineProp.slowlane){
		
		if(lineProp.width === 0.15){
			yOffset = yOffsetDir * lineWidth / 2;
			color = "white";
		}else if(!lineProp.sameDir){
			color = "yellow";
		}

		if(coloroverride !== undefined){
			color = coloroverride;
		}

		for(let i = 0;i<points.length;++i){
			let item = points[i];
			if(i === 0){
				temp += `M ${item[0]} ${item[1] + yOffset} `;
				continue;
			}
			
			if(item.length === 3){
				temp += `C ${item[0][0]} ${item[0][1] + yOffset}, ${item[1][0]} ${item[1][1] + yOffset}, ${item[2][0]} ${item[2][1] + yOffset} `;
			}else{
				temp += `L ${item[0]} ${item[1] + yOffset} `;
			}
		}

		if(lineProp.width === 0.15 || lineProp.slowlane){
			return `<path fill="transparent" stroke="${color}" d="${temp}" stroke-width="${lineWidth}"/>`;
		}
		
		return `<path fill="transparent" stroke="${color}" d="${temp}" stroke-width="${lineWidth}" stroke-dasharray="${dashLength}"/>`;
	}

	totalWidth = lineWidth * 3;
	yOffset = yOffsetDir * lineWidth /2 - yOffsetDir * totalWidth / 2;
	if(!lineProp.sameDir){
		color = "yellow";
	}

	//filler
	temp = "";
	for(let i = 0;i<points.length;++i){
		let item = points[i];
		if(i === 0){
			temp += `M ${item[0]} ${item[1]} `;
			continue;
		}
		
		if(item.length === 3){
			temp += `C ${item[0][0]} ${item[0][1]}, ${item[1][0]} ${item[1][1]}, ${item[2][0]} ${item[2][1]} `;
		}else{
			temp += `L ${item[0]} ${item[1]} `;
		}
	}
	
	rtn += `<path class="markingFiller" d="${temp}" stroke-width="${totalWidth}"/>`;
	
	//left
	temp = "";
	for(let i = 0;i<points.length;++i){
		let item = points[i];
		if(i === 0){
			temp += `M ${item[0]} ${item[1] + yOffset} `;
			continue;
		}
		
		if(item.length === 3){
			temp += `C ${item[0][0]} ${item[0][1] + yOffset}, ${item[1][0]} ${item[1][1] + yOffset}, ${item[2][0]} ${item[2][1] + yOffset} `;
		}else{
			temp += `L ${item[0]} ${item[1] + yOffset} `;
		}
	}
	if(lineProp.left === 0){
		rtn += `<path fill="transparent" stroke="${color}" d="${temp}" stroke-width="${lineWidth}"/>`;
	}else{
		rtn +=  `<path fill="transparent" stroke="${color}" d="${temp}" stroke-width="${lineWidth}" stroke-dasharray="${dashLength}"/>`;
	}

	//right
	yOffset += yOffsetDir * totalWidth - yOffsetDir * lineWidth / 2;
	temp = "";
	for(let i = 0;i<points.length;++i){
		let item = points[i];
		if(i === 0){
			temp += `M ${item[0]} ${item[1] + yOffset} `;
			continue;
		}
		
		if(item.length === 3){
			temp += `C ${item[0][0]} ${item[0][1] + yOffset}, ${item[1][0]} ${item[1][1] + yOffset}, ${item[2][0]} ${item[2][1] + yOffset} `;
		}else{
			temp += `L ${item[0]} ${item[1] + yOffset} `;
		}
	}

	if(lineProp.right === 0){
		rtn += `<path fill="transparent" stroke="${color}" d="${temp}" stroke-width="${lineWidth}"/>`;
	}else{
		rtn +=  `<path fill="transparent" stroke="${color}" d="${temp}" stroke-width="${lineWidth}" stroke-dasharray="${dashLength}"/>`;
	}
	
	return rtn;
}

function BuildRoadSvg(roadRecord, svgElementId, M2PxFactor, yOffset, intermidiateStartX, intermidiateMidX, intermidiateEndX, build3dFlag = false, buildIntersection = false, roadSection = -1){
	function MarkingPriorty(markingProp){
		if((markingProp.width === 0.15) || (markingProp.left === 1 && markingProp.right === 1))return -1;
		
		if(markingProp.sameDir) return 1;
		return 0;
	}

	let svgElement = document.getElementById(svgElementId);
	let roadEndX = svgElement.clientWidth;
	let roadExtend = RoadLength3d - intermidiateStartX / M2PxFactor;
	let intermidiateStart3d = intermidiateStartX / M2PxFactor;
	let intermidiateEnd3d = intermidiateEndX / M2PxFactor;
	let intermidiateMid3d = intermidiateMidX / M2PxFactor;
	let roadEnd3d = roadEndX / M2PxFactor;
	let model = [];
	
	const RoadBackingLength = 0.9;// unit: m
	let markingRoadEnd = buildIntersection? roadEndX - RoadBackingLength * M2PxFactor: roadEndX;
	let markingRoadEnd3d = buildIntersection? roadEnd3d - RoadBackingLength: roadEnd3d;

	let componentX = {road:[], stop:[]};
	let ccConnect = {};
	let intermidiateConnectTable = {
		road:{},
		stop:{}
	};
	let connectedLog = {
		road:{},
		stop:{}
	};

	let highPriortyMarking = {
		0:[],
		1:[],
	};
	
	tempVariable.M2PxFactor = M2PxFactor;

	//clear svg
	svgElement.innerHTML = "";

	//build lookup table
	roadRecord.record.intermidiate.forEach(record=>{
		if(record.type === "cc"){
			if(ccConnect[record.roadIndex] === undefined){
				ccConnect[record.roadIndex] = [record.stopIndex];
			}else{
				ccConnect[record.roadIndex].push(parseInt(record.stopIndex));
			}

			if(roadRecord.record.road[record.roadIndex].type === "road" || roadRecord.record.road[record.roadIndex].type === "slowlane" ){
				if(intermidiateConnectTable.road[record.roadIndex] === undefined){
					intermidiateConnectTable.road[record.roadIndex] = [record];
				}else{
					intermidiateConnectTable.road[record.roadIndex].push(record);
				}

				if(intermidiateConnectTable.stop[record.stopIndex] === undefined){
					intermidiateConnectTable.stop[record.stopIndex] = [record];
				}else{
					intermidiateConnectTable.stop[record.stopIndex].push(record);
				}
			}
		}
	});

	for(let i = 0;i<roadRecord.record.road.length; ++i){
		if(ccConnect[i] === undefined)continue;
		ccConnect[i].sort((a,b)=>{return a-b;});
	}

	Object.keys(intermidiateConnectTable.road).forEach(key=>{
		intermidiateConnectTable.road[key].sort((a, b)=>{return a.stopIndex - b.stopIndex;});
	});

	Object.keys(intermidiateConnectTable.stop).forEach(key=>{
		intermidiateConnectTable.stop[key].sort((a, b)=>{return a.roadIndex - b.roadIndex;});
	});

	let widthSum = 0;
	roadRecord.record.road.forEach(record => {
		componentX.road.push(widthSum * M2PxFactor + yOffset);
		widthSum += record.width;
	});
	componentX.road.push(widthSum * M2PxFactor + yOffset);
	
	widthSum = 0;
	roadRecord.record.stop.forEach(record => {
		componentX.stop.push(widthSum * M2PxFactor + yOffset);
		widthSum += record.width;
	});
	componentX.stop.push(widthSum* M2PxFactor + yOffset);

	//build component - component link
	let markingSpace = "";
	for(let i = 0;i< roadRecord.record.road.length;++i){
		let record = roadRecord.record.road[i];
		let roadT = componentX.road[i];
		let roadB = componentX.road[i + 1];

		if(ccConnect[i] === undefined)continue;

		for(let j = 0;j < ccConnect[i].length; ++j){
			let stopIndex = parseInt(ccConnect[i][j])
			let stopT = componentX.stop[stopIndex];
			let stopB = componentX.stop[stopIndex + 1];
			let stopRecord = roadRecord.record.stop[stopIndex];
			let component = `<path class=${record.type} d="M 0 ${roadT} L ${intermidiateStartX} ${roadT} C ${intermidiateMidX} ${roadT}, ${intermidiateMidX} ${stopT}, ${intermidiateEndX} ${stopT} L ${roadEndX} ${stopT} L ${roadEndX} ${stopB} L ${intermidiateEndX} ${stopB} C ${intermidiateMidX} ${stopB}, ${intermidiateMidX} ${roadB}, ${intermidiateStartX} ${roadB} L 0 ${roadB} Z"></path>`;
			svgElement.innerHTML += component;
			
			//build 3d model parameter
			if(build3dFlag){
				let roadT3d = roadT / M2PxFactor;
				let stopT3d = stopT / M2PxFactor;
				let roadB3d = roadB / M2PxFactor;
				let stopB3d = stopB / M2PxFactor;
				
				
				model.push(
					{
						"type": "component",
						"componentType" : record.type,
						"path":[
							[-roadExtend, roadT3d],
							[intermidiateStart3d, roadT3d],
							[[intermidiateMid3d, roadT3d],[intermidiateMid3d, stopT3d],[intermidiateEnd3d, stopT3d]],
							[roadEnd3d, stopT3d],
							[roadEnd3d, stopB3d],
							[intermidiateEnd3d, stopB3d],
							[[intermidiateMid3d, stopB3d],[intermidiateMid3d, roadB3d],[intermidiateStart3d, roadB3d]],
							[-roadExtend, roadB3d],
							[-roadExtend, roadT3d],
						],
					}
				);
			}

			//marking space
			if(record.type === "road" || record.type === "slowlane"){
				let padding = 1 * M2PxFactor;
				let imgSrc = "";
				let transform;
				let deg = 0;

				let serial, overrideSerial;
				for(let k = 0;k < intermidiateConnectTable.road[i].length; ++k){
					if(intermidiateConnectTable.road[i][k].stopIndex === stopIndex){
						let temp = intermidiateConnectTable.road[i][k];
						serial = temp.serialNumber;
						overrideSerial = temp.overrideSerialNumber;
						break;
					}
				}

				//add direction marking
				//road
				if(connectedLog.road[i] !== 1){
					if(record.direction === 3){
						deg = 90;
						imgSrc = "../roadEditor/images/double_arrow.svg";
					}else{
						if(record.direction === 2){
							deg = 90;
						}else{
							deg = -90;
						}
						
						if(record.type === "road"){
							switch(record.exitDirection){
								case 1:
									imgSrc = "../roadEditor/images/left_arrow.svg";
									break;
								case 2:
									imgSrc = "../roadEditor/images/straight_arrow.svg";
									break;
								case 3:
									imgSrc = "../roadEditor/images/straight_left_arrow.svg";
									break;
								case 4:
									imgSrc = "../roadEditor/images/right_arrow.svg";
									break;
								case 5:
									imgSrc = "../roadEditor/images/left_right_arrow.svg";
									break;
								case 6:
									imgSrc = "../roadEditor/images/straight_right_arrow.svg";
									break;
								case 7:
									imgSrc = "../roadEditor/images/three_way_arrow.svg";
									break;
							}
						}else{
							imgSrc = "../roadEditor/images/straight_arrow.svg";
						}
					}
					
					let roadWidth = componentX.road[i + 1] - componentX.road[i];
					transform = `rotate(${deg}, ${padding + roadWidth / 2}, ${componentX.road[i] + roadWidth / 2})`;
					markingSpace += `<image href="${imgSrc}" transform="${transform}" height="${roadWidth}" width="${roadWidth}" x="${padding}" y="${componentX.road[i]}"/>`;
					model.push(
						{
							"type": "dirMarking",
							"section": "road",
							"src": imgSrc,
							"rot": deg,
							"yOffset": componentX.road[i] / M2PxFactor,
							"roadWidth": roadWidth / M2PxFactor,
						}
					);
				}
				
				//stop
				if(connectedLog.stop[stopIndex] !== 1){
					let stopRecord = roadRecord.record.stop[stopIndex];
					if(stopRecord.direction === 3){
						deg = 90;
						imgSrc = "../roadEditor/images/double_arrow.svg";
					}else{
						if(stopRecord.direction === 2){
							deg = 90;
						}else{
							deg = -90;
						}
						
						if(stopRecord.type === "road"){
							switch(stopRecord.exitDirection){
								case 1:
									imgSrc = "../roadEditor/images/left_arrow.svg";
									break;
								case 2:
									imgSrc = "../roadEditor/images/straight_arrow.svg";
									break;
								case 3:
									imgSrc = "../roadEditor/images/straight_left_arrow.svg";
									break;
								case 4:
									imgSrc = "../roadEditor/images/right_arrow.svg";
									break;
								case 5:
									imgSrc = "../roadEditor/images/left_right_arrow.svg";
									break;
								case 6:
									imgSrc = "../roadEditor/images/straight_right_arrow.svg";
									break;
								case 7:
									imgSrc = "../roadEditor/images/three_way_arrow.svg";
									break;
							}
						}else{
							imgSrc = "../roadEditor/images/straight_arrow.svg";
						}
					}
					
					let roadWidth = componentX.stop[stopIndex + 1] - componentX.stop[stopIndex];
					transform = `rotate(${deg}, ${markingRoadEnd - padding - roadWidth / 2}, ${componentX.stop[stopIndex] + roadWidth / 2})`;
	
					markingSpace += `<image href="${imgSrc}" transform="${transform}" height="${roadWidth}" width="${roadWidth}" x="${markingRoadEnd - padding - roadWidth}" y="${componentX.stop[stopIndex]}"/>`;
					model.push(
						{
							"type": "dirMarking",
							"section": "stop",
							"src": imgSrc,
							"rot": deg,
							"yOffset": componentX.stop[stopIndex] / M2PxFactor,
							"roadWidth": roadWidth / M2PxFactor,
						}
					);
				}

				//add marking
				{
					let points = [];
					let markingModel = [];
					let lineProp = {
						left: 0,
						right: 0,
						sameDir: false,
						width: 0,
						slowlane: false
					};

					let tempLineProp = {
						left: 0,
						right: 0,
						sameDir: false,
						width: 0,
						slowlane: false,
					};
					let check;
					//left
					
					//stopSection
					if(connectedLog.stop[stopIndex] !== 0){
						if(stopIndex === 0){
							lineProp.width = 0.15;
						}else if(roadRecord.record.stop[stopIndex - 1].type !== "road" && roadRecord.record.stop[stopIndex - 1].type !== "slowlane"){
							lineProp.width = 0.15;
						}else if((roadRecord.record.stop[stopIndex].type === "road" && roadRecord.record.stop[stopIndex - 1].type === "slowlane")|| (roadRecord.record.stop[stopIndex].type === "slowlane" && roadRecord.record.stop[stopIndex - 1].type === "road")){
							let tempRecord = roadRecord.record.stop[stopIndex - 1];
							lineProp.width = 0.1;
							lineProp.slowlane = true;
							lineProp.sameDir = stopRecord.direction === tempRecord.direction;
							lineProp.left = 0;
							lineProp.right = 0;
						}else{
							let tempRecord = roadRecord.record.stop[stopIndex - 1];
							
							lineProp.width = 0.1;
							lineProp.sameDir = stopRecord.direction === tempRecord.direction;

							if(stopRecord.type === "slowlane"){
								lineProp.left = 1;
								lineProp.right = 1;
							}else{
								lineProp.left = (tempRecord.crossability & 0b10) === 0? 0:1;
								lineProp.right = (stopRecord.crossability & 0b1) === 0? 0:1;
							}
							lineProp.slowlane = false;
						}

						points.push([markingRoadEnd, componentX.stop[stopIndex]]);
						points.push([intermidiateEndX, componentX.stop[stopIndex]]);
						if(build3dFlag){
							markingModel.push([markingRoadEnd3d, componentX.stop[stopIndex] / M2PxFactor]);
							markingModel.push([intermidiateEnd3d, componentX.stop[stopIndex] / M2PxFactor]);
						}

					}

					//check cover
					check = false;
					//check for spliting
					for(let k = 0;k < intermidiateConnectTable.road[i].length; ++k){
						if(intermidiateConnectTable.road[i][k].stopIndex < stopIndex){
							let temp = intermidiateConnectTable.road[i][k]
							check = true;

							if(stopRecord.type === "slowlane"){
								tempLineProp.width = 0;
								break;
							}
							
							if(overrideSerial > temp.overrideSerialNumber){
								tempLineProp.width = 0.1;
								tempLineProp.left = 1;
								tempLineProp.right = 1;
								tempLineProp.sameDir = true;
								tempLineProp.slowlane = false;
							}else if(overrideSerial === temp.overrideSerialNumber && serial < temp.serialNumber){
								tempLineProp.width = 0.1;
								tempLineProp.left = 1;
								tempLineProp.right = 1;
								tempLineProp.sameDir = true;
								tempLineProp.slowlane = false;
							}else if(roadRecord.record.road[temp.roadIndex].type === "slowlane" || roadRecord.record.stop[temp.stopIndex].type === "slowlane"){
								tempLineProp.width = 0.1;
								tempLineProp.left = 1;
								tempLineProp.right = 1;
								tempLineProp.sameDir = true;
								tempLineProp.slowlane = false;
							}else{
								tempLineProp.width = 0;
								tempLineProp.slowlane = false;
							}
						}
					}
					if(!check){
						for(let k = 0;k < intermidiateConnectTable.stop[stopIndex].length; ++k){
							if(intermidiateConnectTable.stop[stopIndex][k].roadIndex < i){
								let temp = intermidiateConnectTable.stop[stopIndex][k]
								check = true;

								if(stopRecord.type === "slowlane"){
									tempLineProp.width = 0;
									break;
								}

								if(overrideSerial > temp.overrideSerialNumber){
									tempLineProp.width = 0.1;
									tempLineProp.left = 1;
									tempLineProp.right = 1;
									tempLineProp.sameDir = true;
									tempLineProp.slowlane = false;
								}else if(overrideSerial === temp.overrideSerialNumber && serial < temp.serialNumber){
									tempLineProp.width = 0.1;
									tempLineProp.left = 1;
									tempLineProp.right = 1;
									tempLineProp.sameDir = true;
									tempLineProp.slowlane = false;
								}else if(roadRecord.record.road[temp.roadIndex].type === "slowlane" || roadRecord.record.stop[temp.stopIndex].type === "slowlane"){
									tempLineProp.width = 0.1;
									tempLineProp.left = 1;
									tempLineProp.right = 1;
									tempLineProp.sameDir = true;
									tempLineProp.slowlane = false;
								}else{
									tempLineProp.width = 0;
								}
							}
						}
					}

					if(!check){
						if(i === 0 || stopIndex === 0){
							check = true;
							tempLineProp.width = 0.15;
						}else if(stopIndex !== 0){
							if(roadRecord.record.road[i - 1].type !== "road" && roadRecord.record.stop[stopIndex -1].type !== "road" && roadRecord.record.road[i - 1].type !== "slowlane" && roadRecord.record.stop[stopIndex -1].type !== "slowlane"){
								tempLineProp.width = 0.15;
								check = true;
							}else{
								
								//check for parallel
								if(! check && (roadRecord.record.road[i -1].type === "road" || roadRecord.record.road[i -1].type === "slowlane")){
									for(let k = 0;k<intermidiateConnectTable.road[i - 1].length;++k){
										if(intermidiateConnectTable.road[i - 1][k].stopIndex === stopIndex - 1){
											let connection = intermidiateConnectTable.road[i-1][k];
											let tempRoadRecord = roadRecord.record.road[connection.roadIndex];
											let tempStopRecord = roadRecord.record.stop[connection.stopIndex];
	
											check = true;
											
											tempLineProp.width = 0.1;
											tempLineProp.sameDir = record.direction === tempStopRecord.direction;
											
											if(tempStopRecord.type === stopRecord.type){
												if(stopRecord.type === "road"){
													tempLineProp.left = (((tempRoadRecord.crossability & 0b10) === 0? 1:0) + ((tempStopRecord.crossability & 0b10) === 0? 1:0)) === 0? 1: 0;
													tempLineProp.right = (((record.crossability & 0b1) === 0? 1:0) + ((stopRecord.crossability & 0b1) === 0? 1:0)) === 0? 1: 0;
												}else{
													tempLineProp.left = 1;
													tempLineProp.right = 1;
												}
												tempLineProp.slowlane = false;
											}else{
												tempLineProp.left = 0;
												tempLineProp.right = 0;
												tempLineProp.slowlane = true;
											}

											break;
										}
									}
								}
								
								//else
								if(!check){
									tempLineProp.width = 0.15;
									check = true;
								}
							}
						}else{
							tempLineProp.width = 0.15;
							check = true;
						}
					}

					//check for diff line property
					check = false;
					if(lineProp.width !== tempLineProp.width){
						check = true;
					}else if(lineProp.width === 0.1){
						if(
							lineProp.left !==tempLineProp.left||
							lineProp.right !==tempLineProp.right||
							lineProp.sameDir !==tempLineProp.sameDir||
							lineProp.slowlane !== lineProp.slowlane
						){
							check = true;
						}
					}

					if(check || tempLineProp.width === 0){
						if(points.length !== 0){
							if(lineProp.width === 0.15)lineProp.right = 0;

							let markingPriorty = MarkingPriorty(lineProp);
							let marking =  CreateLineMarking(lineProp, points);
							if(markingPriorty === -1){
								markingSpace += marking;
							}
							else{
								highPriortyMarking[markingPriorty].push(marking);
							}

							if(build3dFlag){
								model.push({
									"type": "marking",
									"markingPriority": markingPriorty,
									"lineProp":JSON.parse(JSON.stringify(lineProp)),
									"path": markingModel,
								});
								markingModel = [];
							}
						}
						points = [];
						lineProp.width = tempLineProp.width;
						lineProp.left = tempLineProp.left;
						lineProp.right = tempLineProp.right;
						lineProp.sameDir = tempLineProp.sameDir;
						lineProp.slowlane = tempLineProp.slowlane;
					}

					//intermidiate stage
					if(lineProp.width !== 0){
						if(points.length === 0){
							points.push([intermidiateEndX, componentX.stop[stopIndex]]);
						}
						points.push([[intermidiateMidX, componentX.stop[stopIndex]], [intermidiateMidX, componentX.road[i]], [intermidiateStartX, componentX.road[i]]]);

						if(build3dFlag){
							if(markingModel.length === 0){
								markingModel.push([intermidiateEnd3d, componentX.stop[stopIndex] / M2PxFactor]);
							}
							markingModel.push([[intermidiateMid3d, componentX.stop[stopIndex] / M2PxFactor], [intermidiateMid3d, componentX.road[i] / M2PxFactor], [intermidiateStart3d, componentX.road[i] / M2PxFactor]]);
						}
					}
					
					
					if(connectedLog.road[i] !== 1){
						//road stage line prop
						tempLineProp.slowlane = false;
						if(i === 0){
							tempLineProp.width = 0.15;
						}else if(roadRecord.record.road[i - 1].type !== "road" && roadRecord.record.road[i - 1].type !== "slowlane"){
							tempLineProp.width = 0.15;
						}else if((roadRecord.record.road[i].type === "road" && roadRecord.record.road[i - 1].type === "slowlane")|| (roadRecord.record.road[i].type === "slowlane" && roadRecord.record.road[i - 1].type === "road")){
							let tempRecord = roadRecord.record.road[i - 1];
							tempLineProp.width = 0.1;
							tempLineProp.slowlane = true;
							tempLineProp.sameDir = record.direction === tempRecord.direction;
							tempLineProp.left = 0;
							tempLineProp.right = 0;
						}else{
							let tempRecord = roadRecord.record.road[i -1];
							tempLineProp.width = 0.1;
							tempLineProp.sameDir = record.direction === tempRecord.direction;

							if(stopRecord.type === "slowlane"){
								tempLineProp.left = 1;
								tempLineProp.right = 1;
							}else{
								tempLineProp.left = (tempRecord.crossability & 0b10) === 0? 0:1;
								tempLineProp.right = (stopRecord.crossability & 0b1) === 0? 0:1;
							}
						}

						//line prop diff check
						check = false;
						if(lineProp.width !== tempLineProp.width){
							check = true;
						}else if(lineProp.width === 0.1){
							if(
								lineProp.left !==tempLineProp.left||
								lineProp.right !==tempLineProp.right||
								lineProp.sameDir !==tempLineProp.sameDir||
								lineProp.slowlane !==tempLineProp.slowlane
							){
								check = true;
							}
						}

						//road section marking
						if(check || tempLineProp.width === 0){
							if(points.length !== 0){
								if(lineProp.width === 0.15)lineProp.right = 0;

								let markingPriorty = MarkingPriorty(lineProp);
								let marking =  CreateLineMarking(lineProp, points);
								if(markingPriorty === -1) markingSpace += marking;
								else highPriortyMarking[markingPriorty].push(marking);

								//build model
								if(build3dFlag){
									model.push({
										"type": "marking",
										"markingPriority": markingPriorty,
										"lineProp":JSON.parse(JSON.stringify(lineProp)),
										"path": markingModel,
									});
									markingModel = [];
								}
							}
							points = [];
							lineProp.width = tempLineProp.width;
							lineProp.left = tempLineProp.left;
							lineProp.right = tempLineProp.right;
							lineProp.sameDir = tempLineProp.sameDir;
							lineProp.slowlane = tempLineProp.slowlane;
						}

						//push point
						if(points.length === 0){
							points.push([intermidiateStartX, componentX.road[i]]);
						}
						points.push([0, componentX.road[i]]);

						if(build3dFlag){
							if(markingModel.length === 0){
								markingModel.push([intermidiateStart3d, componentX.road[i] / M2PxFactor]);
							}
							markingModel.push([-roadExtend, componentX.road[i] / M2PxFactor]);
						}
					}
					
					if(points.length !== 0){
						if(lineProp.width === 0.15)lineProp.right = 0;

						let markingPriorty = MarkingPriorty(lineProp);
						let marking =  CreateLineMarking(lineProp, points);
						if(markingPriorty === -1) markingSpace += marking;
						else highPriortyMarking[markingPriorty].push(marking);

						//build model
						if(build3dFlag){
							model.push({
								"type": "marking",
								"markingPriority": markingPriorty,
								"lineProp":JSON.parse(JSON.stringify(lineProp)),
								"path": markingModel,
							});
							markingModel = [];
						}
					}
					
					//right
					{
						//stop section
						check = false;
						lineProp.width = 0;
						lineProp.slowlane = false;
						points = [];
						markingModel = [];
						if(stopIndex === roadRecord.record.stop.length - 1){
							check = true;
						}else if(roadRecord.record.stop[stopIndex + 1].type !== "road" && roadRecord.record.stop[stopIndex + 1].type !== "slowlane"){
							check = true;
						}
						
						if(check){
							lineProp.width = 0.15;
							points.push([markingRoadEnd, componentX.stop[stopIndex + 1]]);
							points.push([intermidiateEndX, componentX.stop[stopIndex + 1]]);

							if(build3dFlag){
								markingModel.push([markingRoadEnd3d, componentX.stop[stopIndex + 1] / M2PxFactor]);
								markingModel.push([intermidiateEnd3d, componentX.stop[stopIndex + 1] / M2PxFactor]);
							}
						}
						
						//build intermidiate section line property
						check = false;
						if(i < roadRecord.record.road.length - 1 || stopIndex < roadRecord.record.stop.length - 1){
							tempLineProp.width = 0;
							
							//road side branch out
							if(stopIndex < roadRecord.record.stop.length - 1){
								if(roadRecord.record.stop[stopIndex + 1].type === "road" || roadRecord.record.stop[stopIndex + 1].type === "slowlane" ){
									for(let k = 0;k < intermidiateConnectTable.road[i].length; ++k){
										if(intermidiateConnectTable.road[i][k].stopIndex > stopIndex){
											let temp = intermidiateConnectTable.road[i][k]
											check = true;
											
											if(stopRecord.type === "slowlane"){
												tempLineProp.width = 0;
												break;
											}
											tempLineProp.slowlane = false;
											if(overrideSerial > temp.overrideSerialNumber){
												tempLineProp.width = 0.1;
												tempLineProp.left = 1;
												tempLineProp.right = 1;
												tempLineProp.sameDir = true;
											}else if(overrideSerial === temp.overrideSerialNumber && serial < temp.serialNumber){
												tempLineProp.width = 0.1;
												tempLineProp.left = 1;
												tempLineProp.right = 1;
												tempLineProp.sameDir = true;
											}else if(roadRecord.record.road[temp.roadIndex].type === "slowlane" || roadRecord.record.stop[temp.stopIndex].type === "slowlane"){
												tempLineProp.width = 0.1;
												tempLineProp.left = 1;
												tempLineProp.right = 1;
												tempLineProp.sameDir = true;
												tempLineProp.slowlane = false;
											}else{
												tempLineProp.width = 0;
											}
										}
									}
								}
							}
							
							//stop side branch out
							if(i < roadRecord.record.road.length - 1){
								if(!check && (roadRecord.record.road[i + 1].type === "road" || roadRecord.record.road[i + 1].type === "slowlane")){
									for(let k = 0;k < intermidiateConnectTable.stop[stopIndex].length; ++k){
										if(intermidiateConnectTable.stop[stopIndex][k].roadIndex > i){
											let temp = intermidiateConnectTable.stop[stopIndex][k]
											check = true;
											tempLineProp.slowlane = false;
											if(stopRecord.type === "slowlane"){
												tempLineProp.width = 0;
												break;
											}

											if(overrideSerial > temp.overrideSerialNumber){
												tempLineProp.width = 0.1;
												tempLineProp.left = 1;
												tempLineProp.right = 1;
												tempLineProp.sameDir = true;
											}else if(overrideSerial === temp.overrideSerialNumber && serial < temp.serialNumber){
												tempLineProp.width = 0.1;
												tempLineProp.left = 1;
												tempLineProp.right = 1;
												tempLineProp.sameDir = true;
											}else if(roadRecord.record.road[temp.roadIndex].type === "slowlane" || roadRecord.record.stop[temp.stopIndex].type === "slowlane"){
												tempLineProp.width = 0.1;
												tempLineProp.left = 1;
												tempLineProp.right = 1;
												tempLineProp.sameDir = true;
												tempLineProp.slowlane = false;
											}else{
												tempLineProp.width = 0;
											}
										}
									}
								}
							}

							if(check){
								check = false;
							}else if(roadRecord.record.road[i + 1].type !== "road" && roadRecord.record.road[i + 1].type !== "slowlane"){
								check = true;
							}

						}else{
							check = true;
						}

						if(check){
							tempLineProp.width = 0.15;
						}

						//check line prop diff
						check = false;
						if(lineProp.width !== tempLineProp.width || tempLineProp.width === 0){
							check = true;
						}else if(lineProp.width === 0.1){
							if(
								lineProp.left !== tempLineProp.left||
								lineProp.right !== tempLineProp.right||
								lineProp.sameDir !== tempLineProp.sameDir||
								lineProp.slowlane !== tempLineProp.slowlane
							){
								check = true;
							}
						}

						if(check){
							if(points.length !== 0){
								if(lineProp.width === 0.15)lineProp.right = 1;

								let markingPriorty = MarkingPriorty(lineProp);
								let marking =  CreateLineMarking(lineProp, points, -1);
								if(markingPriorty === -1) markingSpace += marking;
								else highPriortyMarking[markingPriorty].push(marking);

								//build model
								if(build3dFlag){
									model.push({
										"type": "marking",
										"markingPriority": markingPriorty,
										"lineProp":JSON.parse(JSON.stringify(lineProp)),
										"path": markingModel,
									});
									markingModel = [];
								}
							}

							points = [];
							
							lineProp.width = tempLineProp.width;
							lineProp.left = tempLineProp.left;
							lineProp.right = tempLineProp.right;
							lineProp.sameDir = tempLineProp.sameDir;
							lineProp.slowlane = tempLineProp.slowlane;
						}

						//intermidiate section
						if(lineProp.width !== 0){
							if(points.length === 0){
								points.push([intermidiateEndX, componentX.stop[stopIndex + 1]]);
							}
							
							points.push([[intermidiateMidX, componentX.stop[stopIndex + 1]], [intermidiateMidX, componentX.road[i + 1]], [intermidiateStartX, componentX.road[i + 1]]]);


							if(build3dFlag){
								if(markingModel.length === 0){
									markingModel.push([intermidiateEnd3d, componentX.stop[stopIndex + 1] / M2PxFactor]);
								}
								markingModel.push([[intermidiateMid3d, componentX.stop[stopIndex + 1] / M2PxFactor], [intermidiateMid3d, componentX.road[i + 1] / M2PxFactor], [intermidiateStart3d, componentX.road[i + 1] / M2PxFactor]]);
							}
						}


						// create road lineProp
						check = false;
						if(i === roadRecord.record.road.length - 1){
							check = true;
						}else if(roadRecord.record.road[i + 1].type !== "road" && roadRecord.record.road[i + 1].type !== "slowlane"){
							check = true;
						}
						
						if(lineProp.width !== 0.15){
							if(points.length !== 0){
								if(lineProp.width === 0.15)lineProp.right = 1;

								let markingPriorty = MarkingPriorty(lineProp);
								let marking =  CreateLineMarking(lineProp, points);
								if(markingPriorty === -1) markingSpace += marking;
								else highPriortyMarking[markingPriorty].push(marking);
								points = [];

								//build model
								if(build3dFlag){
									model.push({
										"type": "marking",
										"markingPriority": markingPriorty,
										"lineProp":JSON.parse(JSON.stringify(lineProp)),
										"path": markingModel,
									});
									markingModel = [];
								}
							}
						}
						lineProp.width = 0.15;
						
						if(check){
							points.push([intermidiateStartX, componentX.road[i + 1]]);
							points.push([0, componentX.road[i + 1]]);
							
							if(build3dFlag){
								markingModel.push([intermidiateStart3d, componentX.road[i + 1] / M2PxFactor]);
								markingModel.push([-roadExtend, componentX.road[i + 1] / M2PxFactor]);
							}
						}


						if(points.length !== 0){
							if(lineProp.width === 0.15)lineProp.right = 1;

							let markingPriorty = MarkingPriorty(lineProp);
							let marking =  CreateLineMarking(lineProp, points, -1);
							if(markingPriorty === -1) markingSpace += marking;
							else highPriortyMarking[markingPriorty].push(marking);

							//build model
							if(build3dFlag){
								model.push({
									"type": "marking",
									"markingPriority": markingPriorty,
									"lineProp":JSON.parse(JSON.stringify(lineProp)),
									"path": markingModel,
								});
								markingModel = [];
							}
						}

					}
				}


			}
			connectedLog.road[i] = 1;
			connectedLog.stop[stopIndex] = 1;
		}
	}

	//build high priority marking
	highPriortyMarking[1].forEach(marking => {
		markingSpace+= marking;
	});
	highPriortyMarking[0].forEach(marking => {
		markingSpace+= marking;
	});
	//console.log(highPriortyMarking);
	

	//build component - point connection
	for(let i = 0;i< roadRecord.record.intermidiate.length;++i){
		let record = roadRecord.record.intermidiate[i];	
		let roadT = componentX.road[record.roadIndex];
		let stopT = componentX.stop[record.stopIndex];
		let component = "";
		
		if(record.type === "cc")continue;
		
		if(record.roadLinkType === "component"){
			let roadB = componentX.road[record.roadIndex + 1];
			component = `<path class=${roadRecord.record.road[record.roadIndex].type} d="M 0 ${roadT} L ${intermidiateStartX} ${roadT} C ${intermidiateMidX} ${roadT}, ${intermidiateMidX} ${stopT}, ${intermidiateEndX} ${stopT} C ${intermidiateMidX} ${stopT}, ${intermidiateMidX} ${roadB}, ${intermidiateStartX} ${roadB} L 0 ${roadB} Z"/>`;
			connectedLog.road[record.roadIndex] = 1;

			//build 3d model parameter
			if(build3dFlag){
				let roadT3d = roadT / M2PxFactor;
				let stopT3d = stopT / M2PxFactor;
				let roadB3d = roadB / M2PxFactor;

				model.push(
					{
						"type": "component",
						"componentType" : roadRecord.record.road[record.roadIndex].type,
						"path":[
							[-roadExtend, roadT3d],
							[intermidiateStart3d, roadT3d],
							[[intermidiateMid3d, roadT3d],[intermidiateMid3d, stopT3d],[intermidiateEnd3d, stopT3d]],
							[[intermidiateMid3d, stopT3d],[intermidiateMid3d, roadB3d],[intermidiateStart3d, roadB3d]],
							[-roadExtend, roadB3d],
							[-roadExtend, roadT3d],
						],
					}
				);
			}
		}else{
			let stopB = componentX.stop[record.stopIndex + 1];
			component = `<path class=${roadRecord.record.stop[record.stopIndex].type} d="M ${roadEndX} ${stopT} L ${intermidiateEndX} ${stopT} C ${intermidiateMidX} ${stopT}, ${intermidiateMidX} ${roadT}, ${intermidiateStartX} ${roadT} C ${intermidiateMidX} ${roadT}, ${intermidiateMidX} ${stopB}, ${intermidiateEndX} ${stopB} L ${roadEndX} ${stopB} Z"/>`;
			connectedLog.stop[record.stopIndex] = 1;

			//build 3d model parameter
			if(build3dFlag){
				let roadT3d = roadT / M2PxFactor;
				let stopT3d = stopT / M2PxFactor;
				let stopB3d = stopB / M2PxFactor;
				
				model.push(
					{
						"type": "component",
						"componentType" : roadRecord.record.stop[record.stopIndex].type,
						"path":[
							[roadEnd3d, stopT3d],
							[intermidiateEnd3d, stopT3d],
							[[intermidiateMid3d, stopT3d],[intermidiateMid3d, roadT3d],[intermidiateStart3d, roadT3d]],
							[[intermidiateMid3d, roadT3d],[intermidiateMid3d, stopB3d],[intermidiateEnd3d, stopB3d]],
							[roadEnd3d, stopB3d],
							[roadEnd3d, stopT3d],
						],
					}
				);
			}
		}
		svgElement.innerHTML += component;
	}
	
	//build empty component
	for(let i = 0;i< roadRecord.record.road.length;++i){
		if(connectedLog.road[i] !== 1){
			let component = `<path class=${roadRecord.record.road[i].type} d="M 0 ${componentX.road[i]} L ${intermidiateStartX} ${componentX.road[i]} L ${intermidiateStartX} ${componentX.road[i+1]} L 0 ${componentX.road[i+1]}Z"/>`;
			svgElement.innerHTML += component;

			//build 3d model parameter
			if(build3dFlag){
				let roadT3d = componentX.road[i] / M2PxFactor;
				let roadB3d = componentX.road[i+ 1] / M2PxFactor;

				model.push(
					{
						"type": "component",
						"componentType" : roadRecord.record.road[i].type,
						"path":[
							[-roadExtend, roadT3d],
							[intermidiateStart3d, roadT3d],
							[intermidiateStart3d, roadB3d],
							[-roadExtend, roadB3d],
							[-roadExtend, roadT3d],
						],
					}
				);
			}
		}
	}
	
	let startX = -1;
	let endX = -1;
	let stopMarkingWidth = 0.4 * M2PxFactor;

	let lineX = markingRoadEnd - stopMarkingWidth / 2;
	let marking15cm = 0.15 * M2PxFactor;
	let marking10cm = 0.1 * M2PxFactor;
	for(let i = 0;i< roadRecord.record.stop.length;++i){
		let record = roadRecord.record.stop[i];
		let check;

		//build empty component
		if(connectedLog.stop[i] !== 1){
			let component = `<path class=${roadRecord.record.stop[i].type} d="M ${roadEndX} ${componentX.stop[i]} L ${intermidiateEndX} ${componentX.stop[i]} L ${intermidiateEndX} ${componentX.stop[i+1]} L ${roadEndX} ${componentX.stop[i+1]}Z"/>`;
			svgElement.innerHTML += component;
			
			//build 3d model parameter
			if(build3dFlag){
				let stopT3d = componentX.stop[i] / M2PxFactor;
				let stopB3d = componentX.stop[i + 1] / M2PxFactor;
				
				model.push(
					{
						"type": "component",
						"componentType" : roadRecord.record.stop[i].type,
						"path":[
							[roadEnd3d, stopT3d],
							[intermidiateEnd3d, stopT3d],
							[intermidiateEnd3d, stopB3d],
							[roadEnd3d, stopB3d],
							[roadEnd3d, stopT3d],
						],
					}
				);
			}
			
		}

		//build stop marking
		if((record.type === "road" || record.type === "slowlane") && (record.direction & 0b10) !== 0){
			if(i === 0 || startX === -1){
				if(i === 0){
					startX = componentX.stop[i] + marking15cm;
				}else if(roadRecord.record.stop[i - 1].type === "road"){
					if(record.type === "slowlane"){
						startX = componentX.stop[i] + marking10cm * 0.5;
					}else if((record.crossability & 0b1) === 0 || (roadRecord.record.stop[i - 1].crossability & 0b10) === 0){
						startX = componentX.stop[i] + marking10cm * 1.5;
					}else{
						startX = componentX.stop[i] + marking10cm * 0.5;
					}
				}else if (roadRecord.record.stop[i - 1].type === "slowlane"){
					startX = componentX.stop[i] + marking10cm * 0.5;
				}else{
					startX = componentX.stop[i] + marking15cm;
				}
			}

			
			check = false;
			if(i === roadRecord.record.stop.length - 1){
				check = true;
				endX = componentX.stop[i + 1] - marking15cm;
			}else{
				let nextComponent = roadRecord.record.stop[i + 1];
				check = true;
				if(nextComponent.type !== "road" && nextComponent.type !== "slowlane"){
					endX = componentX.stop[i + 1] - marking15cm;
				}else if((nextComponent.direction & 0b10) === 0){
					if(record.type === "road"){
						if((record.crossability & 0b10) === 0 || (nextComponent.crossability & 0b1) === 0){
							endX = componentX.stop[i + 1] - marking10cm * 1.5;
						}else {
							endX = componentX.stop[i + 1] - marking10cm * 0.5;
						}
					}else{
						endX = componentX.stop[i + 1] - marking10cm * 0.5;
					}
				}else{
					check = false;
				}
			}

			if(check){
				if(build3dFlag){
					model.push({
						"type": "marking",
						"markingPriority": 0,
						"lineProp":{
							width: 0.4,
							left: 0,
							right: 0,
							sameDir: true,
						},
						"path": [[lineX / M2PxFactor,  startX / M2PxFactor], [lineX / M2PxFactor, endX / M2PxFactor]],
					});
				}

				markingSpace += `<path d="M ${lineX} ${startX} L ${lineX} ${endX}" stroke-width="${stopMarkingWidth}" stroke="white"/>`
				startX = -1;
				endX = -1;
			}
		}
	}

	svgElement.innerHTML += markingSpace;
	if(build3dFlag){
		modelParameter[roadSection] = {
			"model":model,
			"roadLength": roadEnd3d + roadExtend,
			"roadEnd": roadEnd3d - RoadBackingLength,
			"intermidiateStart": intermidiateStart3d,
			"intermidiateEnd": intermidiateEnd3d,
			"intermidiateMid": intermidiateMid3d,
		};
	}
}

function BuildRoadStageSvg(roadRecord, svgElementId){
	let roadSetting = CalculateRoadSetting(roadRecord, svgElementId);
	BuildRoadSvg(roadRecord, svgElementId, roadSetting.M2PxFactor, roadSetting.yOffset, roadSetting.intermidiateStartX, roadSetting.intermidiateMidX, roadSetting.intermidiateEndX);
}

//-----------------------------------------
//
// Intersection Function
//
//-----------------------------------------
function CalculateIntersectionSetting(){
	let areaElement = document.getElementById("intersectionRenderArea");
	let horiMinLength = 0;
	let vertMinLength = 0;
	let horiRoadExcessLength = 0;
	let vertRoadExcessLength = 0;
	let M2PxFactor = 0;

	let rtn = {
		M2PxFactor: 0,
		roads:[]
	}

	horiMinLength = 2 * (MinRoadSectionLength + StopSectionLength) 
		+ ( intersectionRecord.intersection[0].intermidiateLength < MinIntermidiateSectionLength ? MinIntermidiateSectionLength : intersectionRecord.intersection[0].intermidiateLength)
		+ ( intersectionRecord.intersection[2].intermidiateLength < MinIntermidiateSectionLength ? MinIntermidiateSectionLength : intersectionRecord.intersection[2].intermidiateLength)
		+ ( intersectionRecord.intersection[1].record.landWidth < intersectionRecord.intersection[3].record.landWidth ? intersectionRecord.intersection[3].record.landWidth : intersectionRecord.intersection[1].record.landWidth);
		
	vertMinLength = 2 * (MinRoadSectionLength + StopSectionLength) 
	+ ( intersectionRecord.intersection[1].intermidiateLength < MinIntermidiateSectionLength ? MinIntermidiateSectionLength : intersectionRecord.intersection[1].intermidiateLength)
	+ ( intersectionRecord.intersection[3].intermidiateLength < MinIntermidiateSectionLength ? MinIntermidiateSectionLength : intersectionRecord.intersection[3].intermidiateLength)
	+ ( intersectionRecord.intersection[2].record.landWidth < intersectionRecord.intersection[0].record.landWidth ? intersectionRecord.intersection[0].record.landWidth : intersectionRecord.intersection[2].record.landWidth);


	//get min M2PxFactor
	{
		let hori = 0;
		let vert = 0;

		hori = areaElement.clientWidth / horiMinLength;
		vert = areaElement.clientHeight / vertMinLength;
		M2PxFactor = hori < vert? hori:vert;

		horiRoadExcessLength = (areaElement.clientWidth / M2PxFactor) - horiMinLength;
		vertRoadExcessLength = (areaElement.clientHeight / M2PxFactor) - vertMinLength;

		horiRoadExcessLength /= 2;
		vertRoadExcessLength /= 2;
	}

	//init road svg element
	for(let i = 0;i<4;++i){
		let svg = document.getElementById(`intersectionRoad_${i}`);

		let elementLength = (MinRoadSectionLength + StopSectionLength + ((i & 1) === 0 ? horiRoadExcessLength : vertRoadExcessLength) + (intersectionRecord.intersection[i].intermidiateLength < MinIntermidiateSectionLength ? MinIntermidiateSectionLength : intersectionRecord.intersection[i].intermidiateLength));
		elementLength *= M2PxFactor;
		
		let roadLength = MinRoadSectionLength + ((i & 1) === 0 ? horiRoadExcessLength : vertRoadExcessLength);
		let intermidiateStartX = roadLength * M2PxFactor;
		let intermidiateEndX = elementLength - StopSectionLength * M2PxFactor;
		let intermidiateMidX = (intermidiateEndX + intermidiateStartX) / 2;

		// build road setting
		rtn.roads.push({
			"intermidiateStartX": intermidiateStartX,
			"intermidiateMidX": intermidiateMidX,
			"intermidiateEndX": intermidiateEndX,
			"elementLength":elementLength,
			"roadWidth": intersectionRecord.intersection[i].record.landWidth * M2PxFactor,
		});


		svg.style.width = `${elementLength}px`;
		svg.style.height = `${intersectionRecord.intersection[i].record.landWidth * M2PxFactor}px`;
		svg.innerHTML = "";

		if(i === 0){
			svg.style.left = "0px";
		}else if(i === 1){
			svg.style.top = `${(elementLength - intersectionRecord.intersection[i].record.landWidth * M2PxFactor) / 2}px`;
			svg.style.left = `${rtn.roads[0].elementLength - (elementLength - intersectionRecord.intersection[i].record.landWidth * M2PxFactor) / 2}px`;
		}else if(i === 2){
			svg.style.top = `${(rtn.roads[1].elementLength)}px`;
			svg.style.left = `${rtn.roads[0].elementLength + rtn.roads[1].roadWidth}px`;
		}else if(i === 3){
			svg.style.top = `${rtn.roads[2].roadWidth + (rtn.roads[1].elementLength) + (elementLength - intersectionRecord.intersection[i].record.landWidth * M2PxFactor) / 2}px`;
			svg.style.left = `${rtn.roads[0].elementLength - (elementLength - intersectionRecord.intersection[i].record.landWidth * M2PxFactor) / 2}px`;
		}
	}

	{
		let centerPiece = document.getElementById("intersectionRoad_center");
		document.getElementById("intersectionRoad_0").style.top =  `${(rtn.roads[1].elementLength)}px`;
		centerPiece.style.top =  `${(rtn.roads[1].elementLength)}px`;
		centerPiece.style.left =  `${rtn.roads[0].elementLength}px`;
		centerPiece.style.width = `${rtn.roads[1].roadWidth}px`
		centerPiece.style.height = `${rtn.roads[0].roadWidth}px`
	}

	rtn.M2PxFactor = M2PxFactor;

	return rtn;
	
}

function BuildIntersectionCenter(build3dFlag = false){
	let M2PxFactor = tempVariable.M2PxFactor;
	let centerElement = document.getElementById("intersectionRoad_center");
	let elementWidth = centerElement.clientWidth + 0.5;
	let elementHeight = centerElement.clientHeight + 0.5;

	let elementWidth3d = elementWidth / M2PxFactor;
	let elementHeight3d = elementHeight / M2PxFactor;

	let sidewalkCorner = [];
	let model = [];
	
	let zebraLineDashWidth = 0.5 * M2PxFactor;

	centerElement.innerHTML = "";


	for(let i = 0;i<4;++i){
		sidewalkCorner.push([0, 0]);
	}

	//build sidewalk connection
	{
		let recordLeft;
		let recordRight;
		let leftSidewalkWidth;
		let rightSidewalkWidth;
		

		//top left
		recordLeft = intersectionRecord.intersection[0].record.stop;
		recordRight = intersectionRecord.intersection[1].record.stop;
		if(recordLeft[0].type=== "sidewalk" && recordRight[recordRight.length - 1].type === "sidewalk"){
			leftSidewalkWidth = recordLeft[0].width * M2PxFactor;
			rightSidewalkWidth = recordRight[recordRight.length - 1].width * M2PxFactor;
			centerElement.innerHTML+= `<path d="M 0 0 L ${rightSidewalkWidth} 0 C ${rightSidewalkWidth} ${leftSidewalkWidth}, ${rightSidewalkWidth} ${leftSidewalkWidth}, 0 ${leftSidewalkWidth} L 0 0" class="sidewalk"/>`;
			
			sidewalkCorner[0] = [rightSidewalkWidth, leftSidewalkWidth];

			//build model parameter
			if(build3dFlag){
				let rightSidewalkWidth3d = recordRight[recordRight.length - 1].width;
				let leftSidewalkWidth3d = recordLeft[0].width;

				model.push({
					"type" : "component",
					"componentType" : "sidewalk",
					"path":[
						[0, 0],
						[rightSidewalkWidth3d, 0],
						[[rightSidewalkWidth3d, leftSidewalkWidth3d], [rightSidewalkWidth3d, leftSidewalkWidth3d], [0, leftSidewalkWidth3d]],
						[0, 0],
					]
				});
			}
		}
		
		//top right
		recordLeft = intersectionRecord.intersection[1].record.stop;
		recordRight = intersectionRecord.intersection[2].record.stop;
		if(recordLeft[0].type=== "sidewalk" && recordRight[recordRight.length - 1].type === "sidewalk"){
			leftSidewalkWidth = recordLeft[0].width * M2PxFactor;
			rightSidewalkWidth = recordRight[recordRight.length - 1].width * M2PxFactor;
			
			centerElement.innerHTML+= `<path d="M ${elementWidth} 0 L ${elementWidth - leftSidewalkWidth} 0 C ${elementWidth - leftSidewalkWidth} ${rightSidewalkWidth}, ${elementWidth - leftSidewalkWidth} ${rightSidewalkWidth}, ${elementWidth} ${rightSidewalkWidth} L ${elementWidth} 0" class="sidewalk"/>`;
			sidewalkCorner[1] = [leftSidewalkWidth, rightSidewalkWidth];

			//build model parameter
			if(build3dFlag){
				let rightSidewalkWidth3d = recordRight[recordRight.length - 1].width;
				let leftSidewalkWidth3d = recordLeft[0].width;

				model.push({
					"type" : "component",
					"componentType" : "sidewalk",
					"path":[
						[elementWidth3d, 0],
						[elementWidth3d - leftSidewalkWidth3d, 0],
						[[elementWidth3d - leftSidewalkWidth3d, rightSidewalkWidth3d], [elementWidth3d - leftSidewalkWidth3d, rightSidewalkWidth3d], [elementWidth3d, rightSidewalkWidth3d]],
						[elementWidth3d, 0],
					]
				});
			}
		}
		
		//bottom right
		recordLeft = intersectionRecord.intersection[2].record.stop;
		recordRight = intersectionRecord.intersection[3].record.stop;
		if(recordLeft[0].type=== "sidewalk" && recordRight[recordRight.length - 1].type === "sidewalk"){
			leftSidewalkWidth = recordLeft[0].width * M2PxFactor;
			rightSidewalkWidth = recordRight[recordRight.length - 1].width * M2PxFactor;
			
			centerElement.innerHTML+= `<path d="M ${elementWidth} ${elementHeight} L ${elementWidth} ${elementHeight - leftSidewalkWidth} C ${elementWidth - rightSidewalkWidth} ${elementHeight - leftSidewalkWidth}, ${elementWidth - rightSidewalkWidth} ${elementHeight - leftSidewalkWidth}, ${elementWidth - rightSidewalkWidth} ${elementHeight} L ${elementWidth} ${elementHeight}" class="sidewalk"/>`;
			sidewalkCorner[2] = [rightSidewalkWidth, leftSidewalkWidth];

			//build model parameter
			if(build3dFlag){
				let leftSidewalkWidth3d = recordLeft[0].width;
				let rightSidewalkWidth3d = recordRight[recordRight.length - 1].width;

				model.push({
					"type" : "component",
					"componentType" : "sidewalk",
					"path":[
						[elementWidth3d, elementHeight3d],
						[elementWidth3d, elementHeight3d - leftSidewalkWidth3d],
						[[elementWidth3d - rightSidewalkWidth3d, elementHeight3d - leftSidewalkWidth3d], [elementWidth3d - rightSidewalkWidth3d, elementHeight3d - leftSidewalkWidth3d], [elementWidth3d - rightSidewalkWidth3d, elementHeight3d]],
						[elementWidth3d, elementHeight3d],
					]
				});
			}
		}
		
		//bottom left
		recordLeft = intersectionRecord.intersection[3].record.stop;
		recordRight = intersectionRecord.intersection[0].record.stop;
		if(recordLeft[0].type=== "sidewalk" && recordRight[recordRight.length - 1].type === "sidewalk"){
			leftSidewalkWidth = recordLeft[0].width * M2PxFactor;
			rightSidewalkWidth = recordRight[recordRight.length - 1].width * M2PxFactor;
			
			centerElement.innerHTML+= `<path d="M 0 ${elementHeight} L 0 ${elementHeight - rightSidewalkWidth} C ${leftSidewalkWidth} ${elementHeight - rightSidewalkWidth}, ${leftSidewalkWidth} ${elementHeight - rightSidewalkWidth}, ${leftSidewalkWidth} ${elementHeight} L 0 ${elementHeight}" class="sidewalk"/>`;
			sidewalkCorner[3] = [leftSidewalkWidth,rightSidewalkWidth];

			//build model parameter
			if(build3dFlag){
				let rightSidewalkWidth3d = recordRight[recordRight.length - 1].width;
				let leftSidewalkWidth3d = recordLeft[0].width;

				model.push({
					"type" : "component",
					"componentType" : "sidewalk",
					"path":[
						[0, elementHeight3d],
						[0, elementHeight3d - rightSidewalkWidth3d],
						[[leftSidewalkWidth3d, elementHeight3d - rightSidewalkWidth3d], [leftSidewalkWidth3d, elementHeight3d - rightSidewalkWidth3d], [leftSidewalkWidth3d, elementHeight3d]],
						[0, elementHeight3d],
					]
				});
			}
		}
		
	}

	//build zebra line
	{
		let recordA, recordB;
		let componentA, componentB;
		let sidewalkWidth;
		let zebraLineOffset;

		recordA = intersectionRecord.intersection[1].record.stop;
		recordB = intersectionRecord.intersection[3].record.stop;
		//left
		componentA = recordA[recordA.length - 1];
		componentB = recordB[0];
		if(componentA.type === "sidewalk" && componentB.type === "sidewalk"){
			let pointA, pointB;
			sidewalkWidth = componentA.width > componentB.width ? componentB.width : componentA.width;
			zebraLineOffset = 0.4 * sidewalkWidth * M2PxFactor;
			pointA = [0, sidewalkCorner[0][1]];
			pointB = [0, elementHeight - sidewalkCorner[3][1]];
			centerElement.innerHTML += `<path d="M ${pointA[0] + zebraLineOffset} ${pointA[1]} L ${pointB[0] + zebraLineOffset} ${pointB[1]}" stroke="white" stroke-width="${sidewalkWidth * M2PxFactor}" stroke-dasharray="${zebraLineDashWidth} ${0.5 * M2PxFactor}" />`
			
			if(build3dFlag){
				model.push({
					"type": "marking",
					"markingType": "zebra",
					"width" : sidewalkWidth,
					"path": [[(pointA[0] + zebraLineOffset) / M2PxFactor, pointA[1] / M2PxFactor], [(pointB[0] + zebraLineOffset) / M2PxFactor, pointB[1] / M2PxFactor]],
				});
			}
		}
		
		//right
		componentA = recordA[0];
		componentB = recordB[recordB.length -1];
		if(componentA.type === "sidewalk" && componentB.type === "sidewalk"){
			let pointA, pointB;
			sidewalkWidth = componentA.width > componentB.width ? componentB.width : componentA.width;
			zebraLineOffset = 0.4 * sidewalkWidth * M2PxFactor;
			pointA = [elementWidth, sidewalkCorner[1][1]];
			pointB = [elementWidth, elementHeight - sidewalkCorner[2][1]];
			centerElement.innerHTML += `<path d="M ${pointA[0] - zebraLineOffset} ${pointA[1]} L ${pointB[0] - zebraLineOffset} ${pointB[1]}" stroke="white" stroke-width="${sidewalkWidth * M2PxFactor}" stroke-dasharray="${zebraLineDashWidth} ${0.5 * M2PxFactor}" />`
			
			if(build3dFlag){
				model.push({
					"type": "marking",
					"markingType": "zebra",
					"width" : sidewalkWidth,
					"path": [[(pointA[0] - zebraLineOffset) / M2PxFactor, pointA[1] / M2PxFactor], [(pointB[0] - zebraLineOffset) / M2PxFactor, pointB[1] / M2PxFactor]],
				});
			}
		}
		
		
		recordA = intersectionRecord.intersection[0].record.stop;
		recordB = intersectionRecord.intersection[2].record.stop;
		//top
		componentA = recordA[0];
		componentB = recordB[recordB.length - 1];
		if(componentA.type === "sidewalk" && componentB.type === "sidewalk"){
			let pointA, pointB;
			sidewalkWidth = componentA.width > componentB.width ? componentB.width : componentA.width;
			zebraLineOffset = 0.4 * sidewalkWidth * M2PxFactor;
			pointA = [sidewalkCorner[0][0], 0];
			pointB = [elementWidth - sidewalkCorner[1][0], 0];
			centerElement.innerHTML += `<path d="M ${pointA[0]} ${pointA[1] + zebraLineOffset} L ${pointB[0] } ${pointB[1] + zebraLineOffset}" stroke="white" stroke-width="${sidewalkWidth * M2PxFactor}" stroke-dasharray="${zebraLineDashWidth} ${0.5 * M2PxFactor}" />`
			
			
			if(build3dFlag){
				model.push({
					"type": "marking",
					"markingType": "zebra",
					"width" : sidewalkWidth,
					"path": [[pointA[0] / M2PxFactor, (pointA[1] + zebraLineOffset) / M2PxFactor], [pointB[0] / M2PxFactor, (pointB[1] + zebraLineOffset) / M2PxFactor]],
				});
			}
		}
		
		//bottom
		componentA = recordA[recordA.length -1];
		componentB = recordB[0];
		if(componentA.type === "sidewalk" && componentB.type === "sidewalk"){
			let pointA, pointB;
			sidewalkWidth = componentA.width > componentB.width ? componentB.width : componentA.width;
			zebraLineOffset = 0.4 * sidewalkWidth * M2PxFactor;
			pointA = [sidewalkCorner[3][0], elementHeight];
			pointB = [elementWidth - sidewalkCorner[2][0], elementHeight];
			centerElement.innerHTML += `<path d="M ${pointA[0]} ${pointA[1] - zebraLineOffset} L ${pointB[0]} ${pointB[1] - zebraLineOffset}" stroke="white" stroke-width="${sidewalkWidth * M2PxFactor}" stroke-dasharray="${zebraLineDashWidth} ${0.5 * M2PxFactor}" />`
		
			if(build3dFlag){
				model.push({
					"type": "marking",
					"markingType": "zebra",
					"width" : sidewalkWidth,
					"path": [[pointA[0] / M2PxFactor, (pointA[1] - zebraLineOffset) / M2PxFactor], [pointB[0] / M2PxFactor, (pointB[1] - zebraLineOffset) / M2PxFactor]],
				});
			}
		}
	}


	if(build3dFlag){
		modelParameter["center"] = model;
	}
}

function BuildIntersectionSvg(){
	let intersectionSetting = CalculateIntersectionSetting();
	let build3dFlag = (currentStage === 2) && modelParameter === null;
	if(build3dFlag){
		modelParameter = {};
	}

	for(let i = 0;i< 4;++i){
		let roadSetting= intersectionSetting.roads[i];
		BuildRoadSvg(intersectionRecord.intersection[i], `intersectionRoad_${i}`, intersectionSetting.M2PxFactor, 0, roadSetting.intermidiateStartX, roadSetting.intermidiateMidX, roadSetting.intermidiateEndX, build3dFlag, true, i);
		
		if(build3dFlag){
			modelParameter[i].roadWidth = intersectionRecord.intersection[i].record.landWidth;
		}
	
	}
	
	BuildIntersectionCenter(build3dFlag);
}


//------------------------------------------
//
// Cross View function
//
//------------------------------------------
function BuildCrossSectionView(tempStorage){
	//stop section
	BuildSectionCrossSection(tempStorage, tempStorage.stop, document.getElementById("stopSectionCrossSection").getElementsByClassName("view")[0])
	
	//road section
	BuildSectionCrossSection(tempStorage, tempStorage.road, document.getElementById("roadSectionCrossSection").getElementsByClassName("view")[0])
}

function BuildCrossSectionComponent(record, M2PercentFactor, isLast = false){
	//console.log(record);
	let upperIcon = "";
	let lowerIcon = "";

	if(record.type === "road"){
		if(record.direction === 3){
			upperIcon = `<img src="./images/outline_double_arrow.svg" style="height:100%;pointer-events: none;color:red;">`;
		}else{
			let auxStyle = "";
			let iconSrc = "";
			
			if(record.direction === 1){
				auxStyle = `transform:rotate(180deg);`;
			}
			
			if(record.exitDirection === 1) iconSrc = "./images/outline_left_arrow.svg";
			else if(record.exitDirection === 2) iconSrc = "./images/outline_straight_arrow.svg";
			else if(record.exitDirection === 3) iconSrc = "./images/outline_straight_left_arrow.svg";
			else if(record.exitDirection === 4) iconSrc = "./images/outline_right_arrow.svg";
			else if(record.exitDirection === 5) iconSrc = "./images/outline_left_right_arrow.svg";
			else if(record.exitDirection === 6) iconSrc = "./images/outline_straight_right_arrow.svg";
			else if(record.exitDirection === 7) iconSrc = "./images/outline_three_way_arrow.svg";

			upperIcon = `<img src="${iconSrc}" style="height:100%;pointer-events: none;color:red;${auxStyle}">`;
		}
	}else if(record.type === "slowlane"){
		if(record.direction === 3){
			upperIcon = `<img src="./images/outline_double_arrow.svg" style="height:100%;pointer-events: none;color:red;">`;
		}else{
			let auxStyle = "";
			let iconSrc = "";
			
			if(record.direction === 1){
				auxStyle = `transform:rotate(180deg);`;
			}
			
			iconSrc = "./images/outline_straight_arrow.svg";

			upperIcon = `<img src="${iconSrc}" style="height:100%;pointer-events: none;color:red;${auxStyle}">`;
		}
	}


	//TODO: add lower icon


	return `
	<div class="crossViewComponent " style="width:${record.width * M2PercentFactor}%; ${isLast? "border-right: 2px solid magenta" : ""}">
		<div class="upperIcon">${upperIcon}</div>
		<div class="lowerIcon">${lowerIcon}</div>
		<div class="component ${record.type}"></div>
		<div class="name">${ComponentType2Name[record.type]}<br>${record.width} m</div>
	</div>`;
}

function BuildSectionCrossSection(tempStorage, record, element){
	const M2PercentFactor = 100 / tempStorage.landWidth;
	element.innerHTML = "";

	for(let i = 0; i<record.length;++i){
		let component = record[i];
		element.innerHTML += BuildCrossSectionComponent(component, M2PercentFactor, i=== record.length - 1);
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
	//console.log(intersectionRecord);
}

function SetToolbar(sectionTarget, stateName, dimensionTarget){
	//set section switch
	if(sectionTarget === "road"){
		sectionSwitchElement.disabled = false;
		sectionSwitchElement.innerText = "道路";
		sectionSwitchElement.onclick = window.OnTo2DRoad;
	}else if(sectionTarget === "intersection"){
		sectionSwitchElement.disabled = false;
		sectionSwitchElement.innerText = "路口";
		sectionSwitchElement.onclick = window.OnToIntersection;
		
	}else{
		sectionSwitchElement.disabled = true;
		sectionSwitchElement.innerText = "";
		sectionSwitchElement.onclick = null;
	}

	// set dimension switch
	if(dimensionTarget === "2D"){
		dimensionSwitchElement.disabled = false;
		dimensionSwitchElement.innerText = "2D";
		dimensionSwitchElement.onclick = window.OnToIntersection;
	}else if(dimensionTarget === "3D"){
		dimensionSwitchElement.disabled = false;
		dimensionSwitchElement.innerText = "3D";
		dimensionSwitchElement.onclick = window.OnTo3D;
		
	}else if(dimensionTarget === "cross"){
		dimensionSwitchElement.disabled = false;
		dimensionSwitchElement.innerText = "斷面";
		dimensionSwitchElement.onclick = window.OnCrossEnable;
	}else{
		dimensionSwitchElement.disabled = true;
		dimensionSwitchElement.innerText = "";
		dimensionSwitchElement.onclick = null;
	}
	
	stateNameElement.innerText = stateName;

}

function SwitchConfirmStage(){
	console.log("switch confirm stage");
	currentStage = 0;

	//set working area
	workingAreaElement.classList.add("road");
	workingAreaElement.classList.remove("intersection");

	tempVariable.resizeFunction = ()=>{BuildRoadStageSvg(intersectionRecord.primaryRoad, "roadRenderArea")};
	BuildRoadStageSvg(intersectionRecord.primaryRoad,  "roadRenderArea");
}

function Switch2DRoad(){
	console.log("switch 2d road");
	currentStage = 1;
	//set working area
	workingAreaElement.classList.add("road");
	workingAreaElement.classList.remove("intersection");

	tempVariable.resizeFunction = ()=>{BuildRoadStageSvg(intersectionRecord.primaryRoad, "roadRenderArea")};
	if(document.getElementById("roadRenderArea").innerHTML === ""){
		//render road
		BuildRoadStageSvg(intersectionRecord.primaryRoad,  "roadRenderArea");
		tempVariable.resizeVariable = intersectionRecord.primaryRoad;
	}else{
		setTimeout((record) => {
			BuildRoadStageSvg(record,  "roadRenderArea");
		}, 300, intersectionRecord.primaryRoad);
	}

	SetToolbar("intersection","2D 道路", "cross");
	
}

function Switch2DIntersection(){
	console.log("switch 2d intersection");
	if(currentStage === 3){
		present3d.Exit3d();
	}

	currentStage = 2;
	//set working area
	workingAreaElement.classList.add("intersection");
	workingAreaElement.classList.remove("road");
	workingAreaElement.classList.remove("intersection3d");

	BuildIntersectionSvg();

	tempVariable.resizeFunction = ()=>{BuildIntersectionSvg()};
	SetToolbar("road","2D 路口", "3D");
	
}

function Switch3DView(){
	console.log("switch 3d view");
	currentStage = 3;
	workingAreaElement.classList.add("intersection3d");
	workingAreaElement.classList.remove("intersection");


	tempVariable.resizeFunction = undefined;
	SetToolbar(undefined,"3D 路口", "2D");
	setTimeout((modelParameter) => {
		present3d.Trigger3d(modelParameter);
		tempVariable.resizeFunction = ()=>{present3d.onWindowResize()};
	}, 300, modelParameter); 

	
}



