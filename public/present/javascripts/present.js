
const EditorPath =  window.location.protocol + "//"+ window.location.host;

//------------------------------------------
//
// Initialization Functions
//
//------------------------------------------
window.onload = function(){
	console.log("present Load");
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
	
}







