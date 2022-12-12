
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

//------------------------------------------
//
// Initialization Functions
//
//------------------------------------------
window.onload = function(){
	console.log("present Load");

	//input validation
	if(!InputValidation()){
		location.replace(EditorPath);
	}
	console.log("input validation pass");
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

//------------------------------------------
//
// Validation Functions 
//
//------------------------------------------
function InputValidation(){
	let storageJSON;
	let keys;
	try {
		storageJSON = JSON.parse(localStorage.getItem("tempStorage"));

		//check stage integrity
		Sections.forEach(section => {
			if(storageJSON[section] === undefined)throw `${section} section missing`;
		});

		Sections.forEach(section => {
			if(section !== "intermidiate"){
				let records = storageJSON[section];
				let widthSum = 0;
				
				//verify the components
				records.forEach(component=>{
					let layout = componentLayout[component.type];
					
					if(component.width === undefined)throw "component width missing";
					
					widthSum += component.width;

					if(layout === undefined)throw "component not found";
					layout.forEach(attr=>{
						if(component[attr] === undefined)throw "component attrbute not found";
					})
				});

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

				let check = true;

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
					}
				}

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
function RenderConfirmStage(){

}




