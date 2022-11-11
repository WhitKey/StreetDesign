

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

//road element template
let roadTemplate = document.getElementById("land");
let sidewalkTemplate = document.getElementById("land");
let bollardTemplate = document.getElementById("land");
let roadComponentTemplate = document.getElementById("land");
let templateBase = {};

//road layout editor variable
let dragElement = null;
let hitboxCounter = 0;
let componentCounter = 0;
let inHitboxId = null;
let touchHitbox = false;
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
let currentStage = 0

//conponent default data
let componentMinWidth = {
    "road": 3,
    "sidewalk": 1.5,
    "bollard": 0.5,
};

const componentDefaultProperty = {
    "bollard" : {
        "type":"bollard",
        "width": componentMinWidth['bollard'],
    },

    "road" : {
        "type":"road",
        "width": componentMinWidth['road'],
        "direction": 3,
        "exitDirection": 7,
        "crossability":3,
    },

    "sidewalk":{
        "type": "sidewalk",
        "width": componentMinWidth['sidewalk'],
    },
};

const componentLayout = {
    'road': ["direction", "exitDirection", "crossability"],
    'bollard':[],
    'sidewalk':[]
}

const DesignStage = [
    "road",
    "stop",
    "intermidiate"
];

const TempStorageTemplate = {
    landWidth: 0,
    stage: 0,
    tempVersion: "1",
}

//let currentSection = ""

//left slide out variables
let leftSlidoutOn = false;

//-----------------------
//
// Utility functions
//
//-----------------------
function GetComponentIdx(component){
    return (Array.prototype.slice.call(landElement.children).indexOf(component)-2)/2;
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

//-------------------------
//
//Initialization functions
//
//-------------------------
function LandInit() {
    let sidebarElement = document.getElementById("sidebar");
    
    dragElement = null;
    hitboxCounter = 0;
    componentCounter = 0;
    inHitboxId = null;
    touchHitbox = false;
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
    AddHitbox();

    
    sidebarElement.classList.remove("intermidiate");
    document.getElementById("stopSection").classList.remove("intermidiate");
    document.getElementById("roadSection").classList.remove("intermidiate");
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

    warningPopupElement = document.getElementById("warningPopup");

    //get template element from document
    templateBase["road"] = document.getElementById("roadTemplate").cloneNode(true);
    templateBase["sidewalk"] = document.getElementById("sidewalkTemplate").cloneNode(true);
    templateBase["bollard"] = document.getElementById("bollardTemplate").cloneNode(true);

    //setting template
    templateBase["road"].removeAttribute("id");
    templateBase["sidewalk"].removeAttribute("id");
    templateBase["bollard"].removeAttribute("id");

    //setting road component template
    roadComponentTemplate = document.getElementById("roadComponentTemplate").cloneNode(true);
    roadComponentTemplate.removeAttribute("id");

}

function LoadPrevSession(){
    let temp = TempStorageTemplate;
    temp.landWidth = landWidth;

    //load previous work
    let tempStorage = localStorage.getItem("tempStorage");
    //currentSection = editorElement.getAttribute("currentSection");
    if(tempStorage !== null){
        tempStorage = JSON.parse(tempStorage);
        if(landWidth !== tempStorage.landWidth || temp.tempVersion !== tempStorage.tempVersion){
            localStorage.setItem("tempStorage", JSON.stringify(temp));
        }else{
            currentStage = tempStorage.stage;
            if(tempStorage[DesignStage[currentStage]]){
                return tempStorage[DesignStage[currentStage]];
            }
        }
    }else{
        localStorage.setItem("tempStorage", JSON.stringify(temp));
    }
    return null;
}

function RebuildUnusedSection(){
    let storage = JSON.parse(localStorage.getItem("tempStorage"));
    if(storage === null) return;
    DesignStage.forEach(stage => {
        if(storage[stage] && stage !== DesignStage[currentStage]){
            document.getElementById(`${stage}Section`).innerHTML = MakeRoadSegmentHTML(storage[stage]);
        }
    });

    UnusedMarkingSpaceInit(currentStage !== 2);
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
    tempVariables['intermidiate'] = {
        'redo':'[]',
        'undo':'[]' 
    }
    tempVariables['stop'] = {
        'redo':'[]',
        'undo':'[]' 
    }

    prevRecord = LoadPrevSession();
    
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
        if(currentStage !== 2){
            ImportRoadSegmentRecordJSON(prevRecord, false);
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
        }
        UpdatePrevButtonVis();
    }
}

function ImportRoadSegmentRecordJSON(json, updateMarking = true){
    ClearRoadSegmentRecord();
    
    //construct html
    for(let i = 0;i< json.length;++i){
        let componentType = json[i].type;
        let component = roadComponentTemplate.cloneNode(true);
        let emptyComp = document.getElementById(`hb${i}c`);


        //set up new component
        component.id = "comp" + componentCounter.toString();
        component.style.width = M2Percent(json[i].width);
        component.setAttribute("component", componentType);
        component.appendChild(templateBase[componentType].cloneNode(true));
        ++componentCounter;

        //insert component into land 
        landElement.insertBefore(component, emptyComp.nextSibling);
        AddHitbox(component);
    }
    
    //overwrite roadSegmentRecord
    roadSegmentRecord = json;

    //update marking and icon
    if(updateMarking){
        UpdateMarkingSpace();
    }
    UpdateRoadExitDirectionIcon();
    StageVerify();
}

function ExportRoadSegmentRecordJSON(){
    return JSON.parse(JSON.stringify(roadSegmentRecord));
}

function UnusedMarkingSpaceInit(ruler = true){
    let sectionElement;
    let sectionSvgElement;
    let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));

    for(let i = 0; i < 2;++i){
        if(i === currentStage)continue;
        let newMarking = "";
        sectionElement = document.getElementById(`${DesignStage[i]}Section`);

        if(tempStorage[DesignStage[i]]){
            newMarking = CreateNewMarking(tempStorage[DesignStage[i]], sectionElement.clientHeight - 10, 20, ruler, i===1);
        }

        sectionSvgElement = sectionElement.getElementsByClassName("markingSpace");
        for(let j = 0;j<sectionSvgElement.length;++j){
            sectionSvgElement[j].remove();
        }
        sectionElement.innerHTML +=   `<svg class="markingSpace">${newMarking}</svg>`;
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
function AddHitbox(referencePos = null) {
    const hitboxTemplate = document.getElementById("hitboxTemplate");
    const emptyRoadComponentTemplate = document.getElementById("emptyRoadComponentTemplate");

    let hitbox = hitboxTemplate.cloneNode(true);
    let emptyComp = emptyRoadComponentTemplate.cloneNode(true);

    hitbox.id = "hb" + hitboxCounter.toString();
    emptyComp.id = hitbox.id + "c";


    if (referencePos === null) {

        hitbox.style.position = "absolute";
        landElement.appendChild(emptyComp);
        landElement.appendChild(hitbox);
    } else {
        referencePos.appendChild(hitbox);
        landElement.insertBefore(emptyComp, referencePos.nextSibling);
        //landElement.insertBefore(hitbox, emptyComp);
    }

    ++hitboxCounter;
}

function RemoveHitbox(hitboxId) {
    document.getElementById(hitboxId).remove();
    document.getElementById(hitboxId + "c").remove();
}

function InsertComponent(hitboxId, move = false) {
    const emptyComp = document.getElementById(hitboxId + "c");
    const componentType = dragElement.getAttribute("component");
    let component = roadComponentTemplate.cloneNode(true);
    //let nextComp = null;

    let oldComp = null
    let toIndex = null;

    tempVariables.state = JSON.parse(JSON.stringify(roadSegmentRecord));
    component.id = "comp" + componentCounter.toString();
    ++componentCounter;

    component.style.width = emptyComp.style.width;
    component.setAttribute("component", componentType);

    if (!move) {
        component.appendChild(templateBase[componentType].cloneNode(true));
    } else {
        let target = document.getElementById(dragElement.getAttribute("target"));

        oldComp = GetComponentRecord(GetComponentIdx(target));
        RemoveHitbox(target.children[1].id);
        component.append(...target.childNodes);
        RemoveComponent(target, true);
    }

    landElement.insertBefore(component, emptyComp.nextSibling);
    AddHitbox(component);

    
    toIndex = GetComponentIdx(component);
    if(oldComp === null){
        AddNewComponentRecord(toIndex, componentType);
        console.log("add new record");
    }else{
        AddComponentRecord(toIndex, oldComp);
        console.log("copy old record");
    }
    //console.log(roadSegmentRecord);
    PushUndoStack(tempVariables.state);
}

function RemoveComponent(target, move = false) {
    //console.log("remove component");
    //console.log({target});
    tempVariables.state = JSON.parse(JSON.stringify(roadSegmentRecord));
    if (target.lastChild !== null) {
        if (target.lastChild.classList.contains("hitbox")) {
            RemoveHitbox(target.lastChild.id);
        }
    }
    
    let compIndex = GetComponentIdx(target);
    RemoveComponentRecord(compIndex);
    console.log(roadSegmentRecord);

    target.remove();
    if(!move){
        PushUndoStack(tempVariables.state);
    }
}

window.EnterHitbox = function(event) {
    if (landElement.hasAttribute("hitOn")) {
        //console.log("enter hitbox");
        let refPercent = 100.0 / landWidth;
        let emptyComp = document.getElementById(event.srcElement.id + "c");
        if (dragElement.classList.contains("roadComponent")) {
            let targetElement = document.getElementById(dragElement.getAttribute("target"));
            //console.log(targetElement);
            document.getElementById(dragElement.getAttribute("target")).style.opacity = "0.3";
            emptyComp.style.width = targetElement.style.width;
        }else{
            emptyComp.style.width = parseFloat(refPercent * parseFloat(componentMinWidth[dragElement.getAttribute("component")])).toString() + "%";
        }

        inHitboxId = event.target.id;
    }
}

window.LeaveHitbox = function(event) {
    if (landElement.hasAttribute("hitOn")) {
        inHitboxId = null;
        //console.log("leave hitbox");

        if (dragElement.classList.contains("roadComponent")) {
            document.getElementById(dragElement.getAttribute("target")).style.opacity = "1";
        }

        let emptyComp = document.getElementById(event.srcElement.id + "c");
        emptyComp.style.width = "0px";
    }
}

window.EnterTrashcan = function() {
    //console.log("enter trash can");
    if (dragElement === null) return;
    if (dragElement.classList.contains("roadComponent")) {
        document.getElementById(dragElement.getAttribute("target")).style.opacity = "0.3";
    }
    inHitboxId = -1;
}

window.LeaveTrashcan = function() {
    //console.log("leave trash can");
    if (dragElement === null) return;

    if (dragElement.classList.contains("roadComponent")) {
        document.getElementById(dragElement.getAttribute("target")).style.opacity = "1";
    }
    inHitboxId = null;
}

//----------------------------------------
//
//Component variabels management functions
//
//----------------------------------------
function CreateComponentRecord(compType){
    return JSON.parse(JSON.stringify(componentDefaultProperty[compType]));   
}

function AddNewComponentRecord(index, compType){
    let comp = CreateComponentRecord(compType);
    
    if(comp === undefined)return;

    roadSegmentRecord.splice(index, 0, comp);
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
    hitboxCounter = 0;
    componentCounter = 0;
    inHitboxId = null;
    touchHitbox = false;
    draging = false;
    roadSegmentRecord = [];
    landElement.innerHTML = `<svg id="markingSpace" class="markingSpace"></svg>`;
    markingSpaceElement = document.getElementById("markingSpace");
    AddHitbox();
}

//---------------------------------------
//
//Component dragging processing functions
//
//----------------------------------------
window.ComponentDragStart = function(event) {

    //set touch event flag
    let touchevent = false;
    if (event.type == "touchstart") {
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

    //drag element setting
    dragElement = target.cloneNode(true);
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

    //remove all hitbox in the drag element
    const hitbox = dragElement.querySelectorAll('.hitbox');
    hitbox.forEach(box => {
        box.remove();
    });

    //adding  event listener
    if (touchevent) {
        document.body.addEventListener("touchmove", ComponentDrag);
        document.body.addEventListener("touchend", ComponentDragEnd);
    } else {
        setTimeout(()=>{document.body.addEventListener("mousemove", ComponentDrag);}, 10);
        document.body.addEventListener("mouseup", ComponentDragEnd);
    }

}

window.ComponentDrag =  function(event) {
    let touchEvent = false;
    if (event.type === "touchmove") {
        touchEvent = true;
    }

    if (!draging) {
        //set the hit on flag
        landElement.classList.add("hitOn");
        landElement.setAttribute("hitOn", "");
        if (dragElement.classList.contains("roadComponent")) {
            editorElement.classList.add("hitOn");
            editorElement.setAttribute("hitOn", "");
        }
        draging = true;
    }
    const target = dragElement;
    const xOffset = -target.clientWidth / 2;
    const yOffset = -target.clientHeight / 2;

    if (touchEvent) {
        target.style.left = event.touches[0].clientX + xOffset + "px";
        target.style.top = event.touches[0].clientY + yOffset + "px";
        const overElement = document.elementFromPoint(event.touches[0].clientX, event.touches[0].clientY);
        if (overElement !== null) {
            if (overElement.classList.contains("hitbox") || overElement.id === "trashcan") {
                if (inHitboxId !== null) {
                    if (inHitboxId === -1) {
                        if (overElement.id !== "trashcan") {
                            document.getElementById("trashcan").dispatchEvent(new Event("mouseleave"));
                        }
                    } else if (overElement.id !== inHitboxId) {
                        document.getElementById(inHitboxId).dispatchEvent(new Event("mouseleave"));
                    }
                }

                touchHitbox = true;
                let event = new Event("mouseenter");
                overElement.dispatchEvent(event);
            } else if (inHitboxId !== null) {
                if (inHitboxId === -1) {
                    document.getElementById("trashcan").dispatchEvent(new Event("mouseleave"));
                } else {
                    document.getElementById(inHitboxId).dispatchEvent(new Event("mouseleave"));
                }
            }
        } else if (touchHitbox) {
            touchHitbox = false;
            if (inHitboxId === -1) {
                document.getElementById("trashcan").dispatchEvent(new Event("mouseleave"));
            } else {
                document.getElementById(inHitboxId).dispatchEvent(new Event("mouseleave"));
            }
        }

    } else {
        target.style.left = event.clientX + xOffset + "px";
        target.style.top = event.clientY + yOffset + "px";
    }

}

window.ComponentDragEnd = function(event) {

    let touchEvent = false;
    if (event.type === "touchend") {
        touchEvent = true;
        touchHitbox = false;
        //console.log("touch end");
        document.body.removeEventListener("touchmove", ComponentDrag);
        document.body.removeEventListener("touchend", ComponentDragEnd);
    } else {
        document.body.removeEventListener("mousemove", ComponentDrag);
        document.body.removeEventListener("mouseup", ComponentDragEnd);

    }

    if (draging === false) {
        console.log("click");
        if(dragElement.classList.contains("roadComponent")){
            PropertySettingStart(dragElement.getAttribute("target"), dragElement.getAttribute("component"));
        }
    }

    //console.log("drag end");
    landElement.classList.remove("hitOn");
    landElement.removeAttribute("hitOn");
    editorElement.classList.remove("hitOn");
    editorElement.removeAttribute("hitOn");

    if (inHitboxId !== null) {
        let emptyComp = document.getElementById(inHitboxId + "c");
        if (dragElement.classList.contains("roadComponent")) {
            let target = document.getElementById(dragElement.getAttribute("target"));
            document.getElementById(dragElement.getAttribute("target")).style.opacity = "1";
            if (inHitboxId === -1) {
                RemoveComponent(target);
                inHitboxId = null;
                dragElement.remove();
                dragElement = null;
                setTimeout(UpdateMarkingSpace, 100);
                return;
            } else {
                if (target.children[1].id !== inHitboxId) {
                    InsertComponent(inHitboxId, true);
                }
            }
        } else if (inHitboxId !== -1) {
            InsertComponent(inHitboxId);
        } else {
            inHitboxId = null;
            dragElement.remove();
            dragElement = null;
            return;
        }
        inHitboxId = null;

        emptyComp.style.width = "0px";
        emptyComp.style.display = "none";
        setTimeout(() => {
            emptyComp.style.display = "block";
        }, 300);
        UpdateMarkingSpace();
    }
    dragElement.remove();
    dragElement = null;
    //setTimeout(UpdateMarkingSpace, 100);
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
        cardToggle += `<div id="propertyToggle_${type}_${index}" class="propertyToggle enable ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="images/straight_arrow.svg" style="transform: scaleY(-1); pointer-events: none;"></div>`;
        
        //上行
        index = "1";
        if(value & 0b10){
            toggleValue = "true";
        }else{
            toggleValue = "false";
        }
        cardToggle += `<div id="propertyToggle_${type}_${index}" class="propertyToggle enable ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="images/straight_arrow.svg" style="pointer-events: none;"></div>`;

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
            cardToggle += `<div id="propertyToggle_${type}_${index}" class="propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="images/left_arrow.svg" style="pointer-events: none;"></div>`;
            
            //直行
            index = "1";
            if(value & 0b10){
                toggleValue = "true";
            }else{
                toggleValue = "false";
            }
            cardToggle += `<div id="propertyToggle_${type}_${index}" class="propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="images/straight_arrow.svg" style="pointer-events: none;"></div>`;
            
            //右轉
            index = "2";
            if(value & 0b100){
                toggleValue = "true";
            }else{
                toggleValue = "false";
            }
            cardToggle += `<div id="propertyToggle_${type}_${index}" class="propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="images/right_arrow.svg" style="pointer-events: none;"></div>`;
        }else{
            //右轉
            index = "2";
            if(value & 0b100){
                toggleValue = "true";
            }else{
                toggleValue = "false";
            }
            cardToggle += `<div id="propertyToggle_${type}_${index}" class=" propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="images/right_arrow.svg" style="pointer-events: none;transform:rotate(180deg);"></div>`;
            
            //直行
            index = "1";
            if(value & 0b10){
                toggleValue = "true";
            }else{
                toggleValue = "false";
            }
            cardToggle += `<div id="propertyToggle_${type}_${index}" class=" propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="images/straight_arrow.svg" style="pointer-events: none;transform:rotate(180deg);"></div>`;
            
            //左轉
            index = "0";
            if(value & 0b1){
                toggleValue = "true";
            }else{
                toggleValue = "false";
            }
            cardToggle += `<div id="propertyToggle_${type}_${index}" class=" propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img src="images/left_arrow.svg" style="pointer-events: none;transform:rotate(180deg);"></div>`;
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
        cardToggle += `<div id="propertyToggle_${type}_${index}" class="propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img class="true togglableImg" src="images/break_line.svg" style="pointer-events: none;"><img class="false togglableImg" src="images/solid_line.svg" style="pointer-events: none;"></div>`;
        
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
        cardToggle += `<div id="propertyToggle_${type}_${index}" class="propertyToggle ${enableFlag} ${toggleValue}" value="${toggleValue}" type="${type}" index="${index}" onclick="PropertyToggleTrigger(event);"><img class="true togglableImg" src="images/break_line.svg" style="pointer-events: none;"><img class="false togglableImg" src="images/solid_line.svg" style="pointer-events: none;"></div>`;
        
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
            return
        }

        console.log("update width");
        componentElement.style.width = (refPercent * parseFloat(newWidth)).toString() + "%";
        roadSegmentRecord[compIdx].width = parseFloat(newWidth);
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

    target.removeAttribute("onmousedown");
    target.removeAttribute("ontouchstart");
    target.removeEventListener("mousedown", ComponentDragStart);
    target.removeEventListener("touchstart", ComponentDragStart);
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
            <div class="input-group mb-3 mt-4" style="max-height:40px; overflow:hidden;">
                <span class="input-group-text" id="basic-addon1" style="white-space: nowrap;">寬度</span>
                <input onchange="PropertySettingChange(event, 'width');" type="number" class="form-control" value="${propertyRecord['width']}" min="${componentMinWidth[compType]}" step="0.1" aria-describedby="basic-addon1">
                <span class="input-group-text" id="basic-addon1">m</span>
            </div>
            <!--<div class="window propertyCollection"></div>-->
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

window.PropertySettingExitTrigger = function(event){
    let target = event.target;
    let check = false;
    while(target){
        if(target.id === "leftSlideout" || target.classList.contains("propertyConfig")){
            check = true;
            break;
        }
        target = target.parentElement;
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
    UpdateRoadExitDirectionIcon();
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

function UpdateRoadExitDirectionIcon(){
    let uiList = landElement.getElementsByClassName("roadComponent");
    for(let i = 0;i<uiList.length;++i){
        if(roadSegmentRecord[i].type === "road"){
            let iconContainer = uiList[i].getElementsByClassName("roadComponentIcon")[0];
            let direction = roadSegmentRecord[i].direction;
            let exitDirection = roadSegmentRecord[i].exitDirection;
            let iconSrc = "";

            iconContainer.innerHTML = "";
            
            if (direction === 3)continue;
            //上行
            if (direction === 2){
                if(iconContainer.classList.contains("rot180"))iconContainer.classList.remove("rot180");
            }//下行
            else{
                if(!iconContainer.classList.contains("rot180"))iconContainer.classList.add("rot180");
            }
            

            if(exitDirection === 0)continue;
            if(exitDirection === 1) iconSrc = "images/left_arrow.svg";
            else if(exitDirection === 2) iconSrc = "images/straight_arrow.svg";
            else if(exitDirection === 3) iconSrc = "images/straight_left_arrow.svg";
            else if(exitDirection === 4) iconSrc = "images/right_arrow.svg";
            else if(exitDirection === 5) iconSrc = "images/left_right_arrow.svg";
            else if(exitDirection === 6) iconSrc = "images/straight_right_arrow.svg";
            else if(exitDirection === 7) iconSrc = "images/three_way_arrow.svg";
            iconContainer.innerHTML = `<img src="${iconSrc}"  draggable="false">`;
        }
    }
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
    let fontsize = 10;
    let textY = y - fontsize - 2;
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
        arrowHeadwidth = arrowHeadWidth * (width / 2) / arrowHeadLength;
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
    rtn += `<text x="${x + width / 2}" y="${textY}" fill="${color}" font-size="${fontsize}" text-anchor="middle">${record.width} m</text>`

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
        if(record[i].type === "road"){
            leftD = "";
            rightD = "";

            //left marking
            if(i === 0 || record[i-1].type !== "road"){
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
            }else if(record[i + 1].type === "road"){
                let color = "white";
                if(record[i].direction !== record[i + 1].direction){
                    color = "yellow";

                    //calculating stop line parameter
                    if(isStopSection){
                        if(stopMarkingStartX !== -1){// stopLine end condition
                            if((record[i + 1].direction&0b10) === 0){

                                //draw stop line
                                if((record[i].crossability&0b10) !== 0 && (record[i + 1].crossability&0b1) !== 0){
                                    newMarking += CreateStopLine(stopMarkingStartX,  M2Px(widthSum + record[i].width) - marking10cm / 2, 0, stopLineWidth);
                                }else{
                                    newMarking += CreateStopLine(stopMarkingStartX,  M2Px(widthSum + record[i].width) - marking10cm * 3 / 2, 0, stopLineWidth);
                                }
                                stopMarkingStartX = -1;
                            }

                        } else if((record[i + 1].direction & 0b10) !== 0){// stop line start condition
                            if((record[i].crossability&0b10)!==0 && (record[i + 1].crossability&0b1) !== 0){
                                stopMarkingStartX = M2Px(widthSum + record[i].width) + marking10cm / 2;
                            }else{
                                stopMarkingStartX = M2Px(widthSum + record[i].width) + marking10cm * 3 / 2;
                            }
                        }
                    }
                }
                rightD = CreateVerticalMarking(color, M2Px(widthSum + record[i].width), [record[i].crossability&0b10, record[i + 1].crossability&0b1], marking10cm, 0, dashLineOverride);
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

    markingSpaceElement.innerHTML = CreateNewMarking(roadSegmentRecord, landElement.clientHeight * (6 / 7), -1, currentStage !== 2, currentStage === 1);
    console.log("updating marking space");

}

window.ResizeMarkingSpace = function(timeWindow){
    if(ResizeMarkingSpace.timeout === undefined){
        ResizeMarkingSpace.timeout = null;
    }
    if(ResizeMarkingSpace.timeout){
        clearTimeout(ResizeMarkingSpace.timeout); 
    }
    ResizeMarkingSpace.timeout = setTimeout(()=>{UpdateMarkingSpace(); UnusedMarkingSpaceInit(currentStage !== 2);}, timeWindow);
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
        }
    );
    console.log("undo");
    
}

window.OnClearLocalStorage = function (){
    localStorage.clear();
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

//------------------------------
//
// Validation functions
//
//------------------------------
function StageVerify(){
    let widthSum = 0;
    let chkFlag = true;
    
    //check width sum
    roadSegmentRecord.forEach(record => {
        widthSum+=record.width;
    });

    if(widthSum !== landWidth){
        chkFlag = false;
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
            
            if (direction === 3)continue;
            //上行
            if (direction === 2){
                if(iconContainer.classList.contains("rot180"))iconContainer.classList.remove("rot180");
            }//下行
            else{
                if(!iconContainer.classList.contains("rot180"))iconContainer.classList.add("rot180");
            }
            

            if(exitDirection === 0)continue;
            if(exitDirection === 1) iconSrc = "images/left_arrow.svg";
            else if(exitDirection === 2) iconSrc = "images/straight_arrow.svg";
            else if(exitDirection === 3) iconSrc = "images/straight_left_arrow.svg";
            else if(exitDirection === 4) iconSrc = "images/right_arrow.svg";
            else if(exitDirection === 5) iconSrc = "images/left_right_arrow.svg";
            else if(exitDirection === 6) iconSrc = "images/straight_right_arrow.svg";
            else if(exitDirection === 7) iconSrc = "images/three_way_arrow.svg";
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
    tempVariables[DesignStage[fromStage]]['redo'] = JSON.stringify(redoStack);
    tempVariables[DesignStage[fromStage]]['undo'] = JSON.stringify(undoStack);

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
        prevButtonElement.style.visibility = "hidden";
    }else{
        prevButtonElement.style.removeProperty("visibility");
    }
}

// switch to next segment when is next is true, switch to previous if false
window.OnSwitchSegment = function(isNext = true){
    let prevRecord = null;
    let oriStage = currentStage;

    //validation
    if(!StageVerify() && isNext){
        ActivateWarningPopup();
        return;
    }
    //switch to presentation page
    if(currentStage === 2 && isNext){
        //TODO: switch to present page
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
        //TODO: switch to intermidiate section
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
    if(currentStage !== 2){
        prevRecord = JSON.parse(localStorage.getItem("tempStorage"))[DesignStage[currentStage]];
        if(prevRecord){
            ImportRoadSegmentRecordJSON(prevRecord, false);
            
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
        }
    }
    
    // update unused marking space
    setTimeout(()=>{
        UnusedMarkingSpaceInit(currentStage!==2);
    }, 300);

    // storage related process
    RestoreSectionStack();
    SaveTempStorage();

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
function EnterIntermidiateStage(){
    
    // internmidiate stage initialization
    IntermidiateStageInit();

    let roadSectionElement = document.getElementById("roadSection");
    let stopSectionElement = document.getElementById("stopSection");
    let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));
    let components;

    tempVariables.intermidiateSerialCounter = 0;
    tempVariables.intermidiateOverrideCounter = 0;

    for(let i = 0;i< roadSegmentRecord.length;++i){
        tempVariables.intermidiateSerialCounter = tempVariables.intermidiateSerialCounter > roadSegmentRecord.serial ? tempVariables.intermidiateSerialCounter : roadSegmentRecord.serial;
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
    
    console.log("exit intermidate stage");
}

function VerifyLink(roadIndex, stopIndex, tempStorage){

    let roadRecord = tempStorage.road[roadIndex];
    let stopRecord = tempStorage.stop[stopIndex];
    let isCenter = true;

    let centerStopRecord = null;
    let centerRoadRecord = null;
    let check = false;

    if(roadRecord.type !== stopRecord.type) return false;
    
    if(roadRecord.type === "road"){
        if(roadRecord.direction !== stopRecord.direction)return false;
        if((roadRecord.exitDirection & stopRecord.exitDirection) === 0) return false; 
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
                if(record.roadIndex === roadIndex){
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
                
                if(record.stopIndex === stopIndex){
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
        if(!isCenter && roadRecord.type === "road"){
            for(let i = 0;i < roadSegmentRecord.length;++i){
                let record = roadSegmentRecord[i];
                if(centerStopRecord !== null){
                    console.log(record, centerStopRecord, roadIndex);
                    console.log(((record.roadIndex > roadIndex) && (record.roadIndex < centerStopRecord.roadIndex)) , ((record.roadIndex < roadIndex) && (record.roadIndex > centerStopRecord.roadIndex)));
                    if(record.stopIndex === centerStopRecord.stopIndex && (((record.roadIndex > roadIndex) && (record.roadIndex < centerStopRecord.roadIndex)) || ((record.roadIndex < roadIndex) && (record.roadIndex > centerStopRecord.roadIndex)))){
                        return false;
                    }
                }
                if(centerRoadRecord !== null){
                    console.log(record, centerRoadRecord, stopIndex);
                    console.log((record.stopIndex > stopIndex) && (record.stopIndex < centerRoadRecord.stopIndex),  ((record.stopIndex < stopIndex) && (record.stopIndex > centerRoadRecord.stopIndex)));
                    if(record.roadIndex === centerRoadRecord.roadIndex && (((record.stopIndex > stopIndex) && (record.stopIndex < centerRoadRecord.stopIndex)) || ((record.stopIndex < stopIndex) && (record.stopIndex > centerRoadRecord.stopIndex)))){
                        return false;
                    }
                }
            }
        }
    }
    return check || !draging;
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

    // link compoent type check
    if(roadRecord.type !== stopRecord.type) return false;
    
    //road component check
    if(roadRecord.type === "road"){
        if(roadRecord.direction !== stopRecord.direction)return false;
        if((roadRecord.exitDirection & stopRecord.exitDirection) === 0) return false; 
    }

    // find center component
    for(let i = 0;i<roadSegmentRecord.length;++i){
        let record = roadSegmentRecord[i]
        if((record.roadIndex === roadIndex) && (record.stopIndex === stopIndex)){
            replaceIdx = i;
            isCenter = true;
            break;
        }

        if((record.roadIndex === roadIndex) || (record.stopIndex === stopIndex)){
            isCenter =  false;
        }

        //check link crossing
        if((record.roadIndex < roadIndex && record.stopIndex > stopIndex) || (record.roadIndex > roadIndex && record.stopIndex < stopIndex) )return false;

        if(roadRecord.type === "road"){
            if(record.roadIndex === roadIndex){
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
            
            if(record.stopIndex === stopIndex){
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

    if(!isCenter && roadRecord.type === "road"){
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

    
    // center index override
    if(replaceIdx !== -1){
        ++tempVariables.intermidiateOverrideCounter;
        roadSegmentRecord[replaceIdx].overrideSerialNumber = tempVariables.intermidiateOverrideCounter;
        centerRoadRecord = roadSegmentRecord[replaceIdx];
        centerStopRecord = roadSegmentRecord[replaceIdx];
        
    }else{
        // making link
        if(isCenter){
            ++tempVariables.intermidiateOverrideCounter;
        }
        
        roadSegmentRecord.push(
            {
                roadIndex: roadIndex,
                stopIndex: stopIndex,
                serialNumber: tempVariables.intermidiateSerialCounter,
                overrideSerialNumber: tempVariables.intermidiateOverrideCounter,
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
    
    console.log(centerRoadRecord);
    console.log(centerStopRecord);
    for(let i =0;i<roadSegmentRecord.length;++i){
        let record = roadSegmentRecord[i];
        if(roadRecord.type === "road"){
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

    console.log(
        roadRightFlag,
        roadLeftFlag,
        stopRightFlag,
        stopLeftFlag
        );
    console.log(removeIdx);

    for(let i = 0;i<removeIdx.length;++i){
        roadSegmentRecord.splice(removeIdx[i], 1);
    }
    
    
    
    console.log(roadSegmentRecord);



    return true;
}

function VerifyAndDelete(roadIndex, stopIndex){
    for(let i = 0;i<roadSegmentRecord.length;++i){
        let record = roadSegmentRecord[i];
        if(record.roadIndex === roadIndex && record.stopIndex === stopIndex){
            roadSegmentRecord.splice(i, 1);
        }
    }
}

function OnIntermidiateDragEnd(event){
    let linkage = {
        stopSection:-1,
        roadSection:-1,
    };
    
    let hitElement = null;
    let hitSection;

    if(event.type === "touchend"){
        //TODO: touch event
    }else{
        hitElement = document.elementFromPoint(event.clientX, event.clientY);
    }
    setTimeout(()=>{document.removeEventListener('contextmenu', PreventDefault);}, 100);
    
    if(hitElement !== null){
        hitSection = hitElement.closest(".roadScope").id;
        if(hitSection === "roadSection" || hitSection === "stopSection"){
            linkage[hitSection] = parseInt(hitElement.closest(".roadComponent").getAttribute("index"));
            linkage[dragElement.closest(".roadScope").id] = parseInt(dragElement.getAttribute("index"));
            
            if(linkage.stopSection !== -1 && linkage.roadSection !== -1){
                if(draging){
                    //deleting mode
                    VerifyAndDelete(linkage.roadSection, linkage.stopSection);
                }else{
                    // adding mode
                    if(VerifyAndLink(linkage.roadSection, linkage.stopSection)){
                        //
                    }
                }
            }
        }
    }

    //remove event listener
    document.removeEventListener("touchend", OnIntermidiateDragEnd);
    document.removeEventListener("mouseup", OnIntermidiateDragEnd);
    document.removeEventListener("touchmove", OnIntermidiateDragMove);
    document.removeEventListener("mousemove", OnIntermidiateDragMove);

    document.getElementById("dragTemp").remove();

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
        //TODO: touch event;
    }
    
    raycast = document.elementFromPoint(clientX, clientY);
    
    clientX -= markingRect.left;
    clientY -= markingRect.top;
    
    let chk = true;
    if(raycast !== null){
        raycastSection = raycast.closest(".roadScope");
        if(raycastSection !== null){
            raycastSection = raycastSection.id;
            if(raycastSection === "roadSection"){
                raycastSection = "road";
            }else if(raycastSection === "stopSection"){
                raycastSection = "stop";
            }
    
            if((raycastSection === "road" && section === "stop")|| (raycastSection === "stop" && section === "road")){
                let endY;
                let elementIndex = parseInt(raycast.closest(".roadComponent").getAttribute("index"));
                let X = M2Px(tempVariables.componentXCoord[raycastSection][elementIndex] - tempStorage[raycastSection][elementIndex].width / 2);
                let roadIndex;
                let stopIndex;

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
    if(chk){
        dragTempElement.classList.remove("accept");
        dragTempElement.classList.add("fail");
        dragTempElement.setAttribute("points", `${elementX - elementWidth},${startY} ${elementX + elementWidth},${startY} ${clientX + elementWidth},${clientY} ${clientX - elementWidth},${clientY}`);
    }

}

function BuildIntermidiateComponent(roadIndex, stopIndex, type){
    let maxY = markingSpaceElement.clientHeight;
    let tl; //top left x coord
    let tr; //top right x coord
    let bl; //bottom left x coord
    let br; //bottom right x coord

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


    return `<polygon points="${tl},${0} ${tr},${0} ${br},${maxY} ${bl},${maxY}" class="${type}">`;
}

function RenderIntermidiateStage(){
    let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));
    markingSpaceElement.innerHTML = "";
    for(let i = 0;i<roadSegmentRecord.length;++i){
        let component = roadSegmentRecord[i];
        markingSpaceElement.innerHTML += BuildIntermidiateComponent(component.roadIndex, component.stopIndex, tempStorage.road[component.roadIndex].type);
    }
    //console.log(tempVariables.componentXCoord);
    //console.log(markingSpaceElement);
}

window.OnIntermidiateDragStart  = function(event){
    dragElement = event.srcElement.closest(".roadComponent");
    document.addEventListener('contextmenu', PreventDefault);
    
    let tempStorage = JSON.parse(localStorage.getItem("tempStorage"));
    let section = dragElement.closest(".roadScope").id;;
    let dragTempElementX = 0;
    let elementIndex = parseInt(dragElement.getAttribute("index"));
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
    
    // show acceptable.
    if(section === "road"){
        let stopSectionElements = document.getElementById("stopSection").getElementsByClassName("roadComponent");
        for(let stopIndex = 0;stopIndex < tempStorage.stop.length; ++stopIndex){
            if(VerifyLink(elementIndex, stopIndex, tempStorage)){
                stopSectionElements[stopIndex].classList.add("acceptable");
            }
        }
    }else if(section === "stop"){
        let roadSectionElements = document.getElementById("roadSection").getElementsByClassName("roadComponent");
        for(let roadIndex = 0;roadIndex < tempStorage.road.length; ++roadIndex){
            if(VerifyLink(roadIndex, elementIndex, tempStorage)){
                roadSectionElements[roadIndex].classList.add("acceptable");
            }
        }

    }
}
