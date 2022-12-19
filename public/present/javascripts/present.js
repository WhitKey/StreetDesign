
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
								(tempVariable.componentX.stop[record.stopIndex] + tempVariable.componentX.stop[record.stopIndex + 1]) / 2
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

function CreateLineMarking(lineProp, points, yOffsetDir = 1, coloroverride = undefined){
	let rtn = "";
	let linePaths = [];
	let lineWidth = lineProp.width * tempVariable.M2PxFactor;
	let dashLength = 3 * tempVariable.M2PxFactor;
	let color = "white";
	let totalWidth;
	let temp = "";
	let yOffset = 0;

	console.log(points);
	console.log(lineProp);
	
	if((lineProp.width === 0.15) || (lineProp.left === 1 && lineProp.right === 1)){
		
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

		if(lineProp.width === 0.15){
			return `<path fill="transparent" stroke="${color}" d="${temp}" stroke-width="${lineWidth}"/>`;
		}
		
		return `<path fill="transparent" stroke="${color}" d="${temp}" stroke-width="${lineWidth}" stroke-dasharray="${dashLength}"/>`;
	}

	totalWidth = lineWidth * 3;
	yOffset = yOffsetDir * lineWidth /2 - yOffsetDir * totalWidth / 2;
	if(!lineProp.sameDir){
		color = "yellow";
	}

	//left
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
	yOffset += yOffsetDir * totalWidth;
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
	if(!lineProp.sameDir) return `<circle cx="${points[0][0]}" cy="${points[0][1]}" r="2" fill="yellow"/>`;

	return `<circle cx="${points[0][0]}" cy="${points[0][1]}" r="2" fill="red"/>`;
}

function RenderRoad(roadRecord){
	let svgElement = document.getElementById("roadRenderArea");
	let minLength = roadRecord.intermidiateLength + StopSectionLength + MinRoadSectionLength;
	let roadLength = 0;
	let M2PxFactor = 0;
	let yOffset = 0;
	let intermidiateStartX = 0;
	let intermidiateEndX = 0;
	let intermidiateMidX = 0;
	let roadEndX = svgElement.clientWidth;

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
	intermidiateStartX = roadLength * M2PxFactor;
	intermidiateEndX = svgElement.clientWidth - StopSectionLength * M2PxFactor;
	intermidiateMidX = (intermidiateEndX + intermidiateStartX) / 2;
	tempVariable.M2PxFactor = M2PxFactor;

	//build lookup table
	roadRecord.record.intermidiate.forEach(record=>{
		if(record.type === "cc"){
			if(ccConnect[record.roadIndex] === undefined){
				ccConnect[record.roadIndex] = [record.stopIndex];
			}else{
				ccConnect[record.roadIndex].push(parseInt(record.stopIndex));
			}

			if(roadRecord.record.road[record.roadIndex].type === "road"){
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
			
			//marking space
			if(record.type === "road"){
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

				//let color = undefined;

				//add direction marking
				//road
				if(connectedLog.road[i] !== 1){
					if(record.direction === 3){
						deg = 90;
						imgSrc = "/roadEditor/images/double_arrow.svg";
					}else{
						if(record.direction === 2){
							deg = 90;
						}else{
							deg = -90;
						}
						
						switch(record.exitDirection){
							case 1:
								imgSrc = "/roadEditor/images/left_arrow.svg";
								break;
							case 2:
								imgSrc = "/roadEditor/images/straight_arrow.svg";
								break;
							case 3:
								imgSrc = "/roadEditor/images/straight_left_arrow.svg";
								break;
							case 4:
								imgSrc = "/roadEditor/images/right_arrow.svg";
								break;
							case 5:
								imgSrc = "/roadEditor/images/left_right_arrow.svg";
								break;
							case 6:
								imgSrc = "/roadEditor/images/straight_right_arrow.svg";
								break;
							case 7:
								imgSrc = "/roadEditor/images/three_way_arrow.svg";
								break;
						}
					}
					
					let roadWidth = componentX.road[i + 1] - componentX.road[i];
					transform = `rotate(${deg}, ${padding + roadWidth / 2}, ${componentX.road[i] + roadWidth / 2})`;
					markingSpace += `<image href="${imgSrc}" transform="${transform}" height="${roadWidth}" width="${roadWidth}" x="${padding}" y="${componentX.road[i]}"/>`;
				}
				
				//stop
				if(connectedLog.stop[stopIndex] !== 1){
					let stopRecord = roadRecord.record.stop[stopIndex];
					if(stopRecord.direction === 3){
						deg = 90;
						imgSrc = "/roadEditor/images/double_arrow.svg";
					}else{
						if(stopRecord.direction === 2){
							deg = 90;
						}else{
							deg = -90;
						}
	
						switch(stopRecord.exitDirection){
							case 1:
								imgSrc = "/roadEditor/images/left_arrow.svg";
								break;
							case 2:
								imgSrc = "/roadEditor/images/straight_arrow.svg";
								break;
							case 3:
								imgSrc = "/roadEditor/images/straight_left_arrow.svg";
								break;
							case 4:
								imgSrc = "/roadEditor/images/right_arrow.svg";
								break;
							case 5:
								imgSrc = "/roadEditor/images/left_right_arrow.svg";
								break;
							case 6:
								imgSrc = "/roadEditor/images/straight_right_arrow.svg";
								break;
							case 7:
								imgSrc = "/roadEditor/images/three_way_arrow.svg";
								break;
						}
					}
					
					let roadWidth = componentX.stop[stopIndex + 1] - componentX.stop[stopIndex];
					transform = `rotate(${deg}, ${roadEndX - padding - roadWidth / 2}, ${componentX.stop[stopIndex] + roadWidth / 2})`;
	
					markingSpace += `<image href="${imgSrc}" transform="${transform}" height="${roadWidth}" width="${roadWidth}" x="${roadEndX - padding - roadWidth}" y="${componentX.stop[stopIndex]}"/>`;
				}

				//add marking
				{
					let points = [];
					let lineProp = {
						left: 0,
						right: 0,
						sameDir: false,
						width: 0
					};

					let tempLineProp = {
						left: 0,
						right: 0,
						sameDir: false,
						width: 0
					};
					let check;
					//left
					
					//stopSection
					if(connectedLog.stop[stopIndex] !== 0){
						if(stopIndex === 0){
							lineProp.width = 0.15;
						}else if(roadRecord.record.stop[stopIndex - 1].type !== "road"){
							lineProp.width = 0.15;
						}else{
							let tempRecord = roadRecord.record.stop[stopIndex - 1];
							
							lineProp.width = 0.1;
							lineProp.sameDir = stopRecord.direction === tempRecord.direction;
							lineProp.left = (tempRecord.crossability & 0b10) === 0? 0:1;
							lineProp.right = (stopRecord.crossability & 0b1) === 0? 0:1;
						}

						points.push([roadEndX, componentX.stop[stopIndex]]);
						points.push([intermidiateEndX, componentX.stop[stopIndex]]);
					}

					//check cover
					check = false;
					if(i === 0 || stopIndex === 0){
						check = true;
						tempLineProp.width = 0.15;
					}else if(stopIndex !== 0){
						if(roadRecord.record.road[i - 1].type !== "road" && roadRecord.record.stop[stopIndex -1].type !== "road"){
							tempLineProp.width = 0.15;
							check = true;
						}else{
							//check for spliting
							for(let k = 0;k < intermidiateConnectTable.road[i].length; ++k){
								if(intermidiateConnectTable.road[i][k].stopIndex < stopIndex){
									let temp = intermidiateConnectTable.road[i][k]
									check = true;
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
									}else{
										tempLineProp.width = 0;
									}
								}
							}
							if(!check){
								for(let k = 0;k < intermidiateConnectTable.stop[stopIndex].length; ++k){
									if(intermidiateConnectTable.stop[stopIndex][k].roadIndex < i){
										let temp = intermidiateConnectTable.stop[stopIndex][k]
										check = true;
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
										}else{
											tempLineProp.width = 0;
										}
									}
								}
							}
							

							//check for parallel
							if(! check && roadRecord.record.road[i -1].type === "road"){
								for(let k = 0;k<intermidiateConnectTable.road[i - 1].length;++k){
									if(intermidiateConnectTable.road[i - 1][k].stopIndex === stopIndex - 1){
										let connection = intermidiateConnectTable.road[i-1][k];
										let tempRoadRecord = roadRecord.record.road[connection.roadIndex];
										let tempStopRecord = roadRecord.record.stop[connection.stopIndex];

										check = true;
										tempLineProp.width = 0.1;
										tempLineProp.sameDir = record.direction === tempStopRecord.direction;
										tempLineProp.left = (((tempRoadRecord.crossability & 0b10) === 0? 1:0) + ((tempStopRecord.crossability & 0b10) === 0? 1:0)) === 0? 1: 0;
										tempLineProp.right = (((record.crossability & 0b1) === 0? 1:0) + ((stopRecord.crossability & 0b1) === 0? 1:0)) === 0? 1: 0;
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

					//check for diff line property
					check = false;
					if(lineProp.width !== tempLineProp.width){
						check = true;
					}else if(lineProp.width === 0.1){
						if(
							lineProp.left !==tempLineProp.left||
							lineProp.right !==tempLineProp.right||
							lineProp.sameDir !==tempLineProp.sameDir
						){
							check = true;
						}
					}

					if(check || tempLineProp.width === 0){
						if(points.length !== 0){
							markingSpace += CreateLineMarking(lineProp, points);
						}
						points = [];
						lineProp.width = tempLineProp.width;
						lineProp.left = tempLineProp.left;
						lineProp.right = tempLineProp.right;
						lineProp.sameDir = tempLineProp.sameDir;
					}

					//intermidiate stage
					if(lineProp.width !== 0){
						if(points.length === 0){
							points.push([intermidiateEndX, componentX.stop[stopIndex]]);
						}
						points.push([[intermidiateMidX, componentX.stop[stopIndex]], [intermidiateMidX, componentX.road[i]], [intermidiateStartX, componentX.road[i]]]);
						//markingSpace += CreateLineMarking(lineProp, points, 1);
					}
					
					
					if(connectedLog.road[i] !== 1){
						//road stage line prop
						if(i === 0){
							tempLineProp.width = 0.15;
						}else if(roadRecord.record.road[i - 1].type !== "road"){
							tempLineProp.width = 0.15;
						}else{
							let tempRecord = roadRecord.record.road[i -1];
							tempLineProp.width = 0.1;
							tempLineProp.sameDir = record.direction === tempRecord.direction;
							tempLineProp.left = (tempRecord.crossability & 0b10) === 0? 0:1;
							tempLineProp.right = (record.crossability & 0b1) === 0? 0:1;
						}

						//line prop diff check
						check = false;
						if(lineProp.width !== tempLineProp.width){
							check = true;
						}else if(lineProp.width === 0.1){
							if(
								lineProp.left !==tempLineProp.left||
								lineProp.right !==tempLineProp.right||
								lineProp.sameDir !==tempLineProp.sameDir
							){
								check = true;
							}
						}

						//road section marking
						if(check || tempLineProp.width === 0){
							if(points.length !== 0){
								markingSpace += CreateLineMarking(lineProp, points);
							}
							points = [];
							lineProp.width = tempLineProp.width;
							lineProp.left = tempLineProp.left;
							lineProp.right = tempLineProp.right;
							lineProp.sameDir = tempLineProp.sameDir;
						}

						//push point
						if(points.length === 0){
							points.push([intermidiateStartX, componentX.road[i]]);
						}
						points.push([0, componentX.road[i]]);
					}
					
					if(points.length !== 0){
						markingSpace += CreateLineMarking(lineProp, points, 1);
					}
					
					//right
					{
						//stop section
						check = false;
						lineProp.width = 0;
						points = [];
						if(stopIndex === roadRecord.record.stop.length - 1){
							check = true;
						}else if(roadRecord.record.stop[stopIndex + 1].type !== "road"){
							check = true;
						}
						
						if(check){
							lineProp.width = 0.15;
							points.push([roadEndX, componentX.stop[stopIndex + 1]]);
							points.push([intermidiateEndX, componentX.stop[stopIndex + 1]]);
						}
						
						//build intermidiate section line property
						check = false;
						if(i < roadRecord.record.road.length - 1){
							tempLineProp.width = 0;
							if(stopIndex === roadRecord.record.stop.length - 1){
								check = true;
							}
							else{
								//road side branch out
								if(roadRecord.record.stop[stopIndex + 1].type === "road"){
									for(let k = 0;k < intermidiateConnectTable.road[i].length; ++k){
										if(intermidiateConnectTable.road[i][k].stopIndex > stopIndex){
											let temp = intermidiateConnectTable.road[i][k]
											check = true;
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
											}else{
												tempLineProp.width = 0;
											}
										}
									}
								}
								
								//stop side brabnch out
								if(!check && roadRecord.record.road[i + 1].type === "road"){
									for(let k = 0;k < intermidiateConnectTable.stop[stopIndex].length; ++k){
										if(intermidiateConnectTable.stop[stopIndex][k].roadIndex > i){
											let temp = intermidiateConnectTable.stop[stopIndex][k]
											check = true;
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
											}else{
												tempLineProp.width = 0;
											}
										}
									}
								}
								
								if(check){
									check = false;
								}else if(roadRecord.record.road[i + 1].type !== "road" || roadRecord.record.stop[stopIndex + 1].type !== "road"){
									check = true;
								}
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
								lineProp.sameDir !== tempLineProp.sameDir
							){
								check = true;
							}
						}

						if(check){
							if(points.length !== 0){
								markingSpace += CreateLineMarking(lineProp, points, -1);
							}
							points = [];
							
							lineProp.width = tempLineProp.width;
							lineProp.left = tempLineProp.left;
							lineProp.right = tempLineProp.right;
							lineProp.sameDir = tempLineProp.sameDir;
						}

						//intermidiate section
						if(lineProp.width !== 0){
							if(points.length === 0){
								points.push([intermidiateEndX, componentX.stop[stopIndex + 1]]);
							}
							
							points.push([[intermidiateMidX, componentX.stop[stopIndex + 1]], [intermidiateMidX, componentX.road[i + 1]], [intermidiateStartX, componentX.road[i + 1]]]);
						}


						// create road lineProp
						check = false;
						if(i === roadRecord.record.road.length - 1){
							check = true;
						}else if(roadRecord.record.road[i + 1].type !== "road"){
							check = true;
						}
						
						if(lineProp.width !== 0.15){
							if(points.length !== 0){
								markingSpace += CreateLineMarking(lineProp, points, -1);
								points = [];
							}
						}
						lineProp.width = 0.15;
						
						if(check){
							points.push([intermidiateStartX, componentX.road[i + 1]]);
							points.push([0, componentX.road[i + 1]]);
						}


						if(points.length !== 0){
							markingSpace += CreateLineMarking(lineProp, points, -1);
						}

					}
				}


			}
			connectedLog.road[i] = 1;
			connectedLog.stop[stopIndex] = 1;
		}
	}
	svgElement.innerHTML += markingSpace;

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
		}else{
			let stopB = componentX.stop[record.stopIndex + 1];
			component = `<path class=${roadRecord.record.stop[record.stopIndex].type} d="M ${roadEndX} ${stopT} L ${intermidiateEndX} ${stopT} C ${intermidiateMidX} ${stopT}, ${intermidiateMidX} ${roadT}, ${intermidiateStartX} ${roadT} C ${intermidiateMidX} ${roadT}, ${intermidiateMidX} ${stopB}, ${intermidiateEndX} ${stopB} L ${roadEndX} ${stopB} Z"/>`;
			connectedLog.stop[record.stopIndex] = 1;
		}
		svgElement.innerHTML += component;
	}
	
	//build empty component
	for(let i = 0;i< roadRecord.record.road.length;++i){
		if(connectedLog.road[i] !== 1){
			let component = `<path class=${roadRecord.record.road[i].type} d="M 0 ${componentX.road[i]} L ${intermidiateStartX} ${componentX.road[i]} L ${intermidiateStartX} ${componentX.road[i+1]} L 0 ${componentX.road[i+1]}Z"/>`;
			svgElement.innerHTML += component;
		}
	}
	
	for(let i = 0;i< roadRecord.record.stop.length;++i){
		if(connectedLog.stop[i] !== 1){
			let component = `<path class=${roadRecord.record.stop[i].type} d="M ${roadEndX} ${componentX.stop[i]} L ${intermidiateEndX} ${componentX.stop[i]} L ${intermidiateEndX} ${componentX.stop[i+1]} L ${roadEndX} ${componentX.stop[i+1]}Z"/>`;
			svgElement.innerHTML += component;
		}
	}
}

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
	tempVariable.resizeFunction = RenderRoad;
	tempVariable.resizeVariable = intersectionRecord.primaryRoad;
	RenderRoad(intersectionRecord.primaryRoad);
}

function Switch2DRoad(){
	tempVariable.resizeFunction = RenderRoad;
	if(document.getElementById("roadRenderArea").innerHTML === ""){
		//render road
		RenderRoad(intersectionRecord.primaryRoad);
		tempVariable.resizeVariable = intersectionRecord.primaryRoad;
	}else{
		setTimeout((record) => {
			RenderRoad(record);
		}, 300, intersectionRecord.primaryRoad);
	}

	SetToolbar("intersection","2D 道路", "cross");
}

function Switch2DIntersection(){
	console.log("switch 2d intersection");
	tempVariable.resizeFunction = undefined;
	SetToolbar("road","2D 路口", "3D");
}

function Switch3DView(){
	console.log("switch 3d view");
	tempVariable.resizeFunction = undefined;
	SetToolbar(undefined,"3D 路口", "2D");
}

