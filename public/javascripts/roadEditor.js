

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
let roadRecord = [];

//conponent default data
const componentDefaultWidth = {
    "road": 3,
    "sidewalk": 1,
    "bollard": 0.5,
};

const componentDefaultProperty = {
    "bollard" : {
        "type":"bollard",
        "width": componentDefaultWidth['bollard'],
        "layout" : [],
    },

    "road" : {
        "type":"road",
        "width": componentDefaultWidth['road'],
        "direction": 3,
        "exitDirection": 7,
        "crossability":3,
        "layout" : ["direction", "exitDirection", "crossability"],
    },

    "sidewalk":{
        "type": "sidewalk",
        "width": componentDefaultWidth['sidewalk'],
        "layout" : [],
    },
};

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

//-------------------------
//
//Initialization functions
//
//-------------------------
function LandInit() {
    landElement.innerHTML = `<svg id="markingSpace"></svg>`;
    AddHitbox();
}

function OnLoad() {
    console.log("load");
    //initalize land
    LandInit();

    //set element
    landElement = document.getElementById("land");
    editorElement = document.getElementById("editor");
    mainWindowElement = document.getElementById("mainWindow");
    propertyEditorElement = document.getElementById("propertyEditor");
    markingSpaceElement = document.getElementById("markingSpace");

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
    let nextComp = null;

    let oldComp = null
    let toIndex = null;


    component.id = "comp" + componentCounter.toString();
    ++componentCounter;

    component.style.width = emptyComp.style.width;
    component.setAttribute("component", componentType);

    nextComp = emptyComp.nextSibling;
    if (!nextComp.classList.contains("roadComponent")) {
        nextComp = null;
    }

    if (!move) {
        component.appendChild(templateBase[componentType].cloneNode(true));
    } else {
        let target = document.getElementById(dragElement.getAttribute("target"));

        oldComp = GetComponentRecord(GetComponentIdx(target));
        RemoveHitbox(target.children[1].id);
        component.append(...target.childNodes);
        RemoveComponent(target);
    }

    landElement.insertBefore(component, emptyComp.nextSibling);
    AddHitbox(component);

    
    toIndex =GetComponentIdx(component);
    if(oldComp === null){
        AddNewComponentRecord(toIndex, componentType);
        console.log("add new record");
    }else{
        AddComponentRecord(toIndex, oldComp);
        console.log("copy old record");
    }
    console.log(roadRecord);
}

function RemoveComponent(target) {
    //console.log("remove component");
    //console.log({target});
    if (target.lastChild !== null) {
        if (target.lastChild.classList.contains("hitbox")) {
            RemoveHitbox(target.lastChild.id);
        }
    }
    
    let compIndex = GetComponentIdx(target);
    RemoveComponentRecord(compIndex);
    console.log(roadRecord);

    target.remove();
}

function EnterHitbox(event) {
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
            emptyComp.style.width = parseFloat(refPercent * parseFloat(componentDefaultWidth[dragElement.getAttribute("component")])).toString() + "%";
        }

        inHitboxId = event.target.id;
    }
}

function LeaveHitbox(event) {
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

function EnterTrashcan() {
    //console.log("enter trash can");
    if (dragElement === null) return;
    if (dragElement.classList.contains("roadComponent")) {
        document.getElementById(dragElement.getAttribute("target")).style.opacity = "0.3";
    }
    inHitboxId = -1;
}

function LeaveTrashcan() {
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
    /*
    if(compType === "bollard"){
        return {
            "type":"bollard",
            "width": componentDefaultWidth[compType]
        }
    }else if(compType === "road"){
        return {
            "type":"road",
            "width": componentDefaultWidth[compType],
            "direction": "both",
            "exitDirection":"all"
        }
    }else if(compType === "sidewalk"){
        return {
            "type": "sidewalk",
            "width": componentDefaultWidth[compType],
        }
    }else{
        return undefined;
    }
    //*/
}

function AddNewComponentRecord(index, compType){
    let comp = CreateComponentRecord(compType);
    
    if(comp === undefined)return;

    roadRecord.splice(index, 0, comp);
}

function GetComponentRecord(index){
    return roadRecord.slice(index, index + 1)[0];
}

function AddComponentRecord(index, record){
    roadRecord.splice(index, 0, record);
}

function RemoveComponentRecord(index){
    roadRecord.splice(index, 1);
}

//---------------------------------------
//
//Component dragging processing functions
//
//----------------------------------------
function ComponentDragStart(event) {

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

function ComponentDrag(event) {
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

function ComponentDragEnd(event) {

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
        direction = compRecord["direction"];
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
        if(recordIdx !== 0&& roadRecord[recordIdx-1].type === "road"){
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
        if(recordIdx < roadRecord.length - 1 && roadRecord[recordIdx + 1].type === "road"){
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

function PropertySettingChange(event, type){
    let propertySettingElement = document.getElementById("propertySettings");
    let compIdx = parseInt(propertySettingElement.getAttribute("component_idx"));
    let componentElement = document.getElementById(propertyEditorElement.getAttribute("target"));

    if(type === "width"){
        let newWidth = event.target.value;
        let refPercent = 100.0 / landWidth; // % per meter

        console.log("update width");
        componentElement.style.width = (refPercent * parseFloat(newWidth)).toString() + "%";
        roadRecord[compIdx].width = parseFloat(newWidth);
    }

    if(type === "crossability" || type==="width"){
        UpdateMarkingSpace();
    }
}

async function PropertySettingStart(compId, compType){
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
    document.body.addEventListener("touchstart", PropertySettingExitTrigger);

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
    let cardLayout = propertyRecord["layout"];

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
                <input onchange="PropertySettingChange(event, 'width');" type="number" class="form-control" value="${propertyRecord['width']}" min="0.1" step="0.1" aria-describedby="basic-addon1">
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

function PropertySettingExitTrigger(event){
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
        target.addEventListener("touchstart", ComponentDragStart);
        leftSlidoutOn = false;
    }
}

//-------------------------------
//
// Property Toggle Functions
//
//-------------------------------
function PropertyToggleCallbackTest(event){
    console.log("eventCallback");
}

function RerenderPropertyToggle(event){
    let toggleBlock = document.getElementById("propertyToggles");
    let recordIdx = parseInt(document.getElementById("propertySettings").getAttribute("component_idx"));
    let propertyRecord = GetComponentRecord(recordIdx);
    let cardLayout = propertyRecord["layout"];
    let propertyCards = "";

    for(let i = 0; i < cardLayout.length; ++i){
        propertyCards += (CreatePropertyCard(cardLayout[i], propertyRecord[cardLayout[i]], propertyRecord, recordIdx));
    }
    console.log("rerender property config");
    toggleBlock.innerHTML = propertyCards;
    UpdateRoadExitDirectionIcon();
    UpdateMarkingSpace();
}

function PropertyToggleTrigger(event, callback = null){
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
        if(type === "exitDirection" && (roadRecord[recordIndex][type] & ~(1<<maskIndex)) === 0){
            return;
        }else{
            targetElement.classList.remove("true");
            targetElement.classList.add("false");
            targetElement.setAttribute("value", "false");
            roadRecord[recordIndex][type] &= ~(1<<maskIndex);
    
            if(type === "direction"){
                roadRecord[recordIndex][type] |= 1<< (1-maskIndex);
            }
        }

    }else{
        targetElement.classList.remove("false");
        targetElement.classList.add("true");
        targetElement.setAttribute("value", "true");
        roadRecord[recordIndex][type] |= 1<<maskIndex;
    }

    RerenderPropertyToggle();
    if(callback !== null) callback(event);
}

function UpdateRoadExitDirectionIcon(){
    let uiList = landElement.getElementsByClassName("roadComponent");
    for(let i = 0;i<uiList.length;++i){
        if(roadRecord[i].type === "road"){
            let iconContainer = uiList[i].getElementsByClassName("roadExitDirectionIcon")[0];
            let direction = roadRecord[i].direction;
            let exitDirection = roadRecord[i].exitDirection;
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

function CreateVerticalMarking(color, x, type, markingWidth, offsetIndex = 0){
    let y = landElement.clientHeight;
    let rtn = "";
    let xInc= 0;
    let dashedLength = M2Px(1);

    if(type.length === 2){
        if((type[0] !== 0) && (type[1]!==0)){
            type = [type[0]];
        }
    }
    xInc = markingWidth / 2 + x - (((2 * type.length) - 1) / 2 * markingWidth) + offsetIndex * (((2 * type.length) - 1) / 2 * markingWidth);

    for(let i = 0;i<type.length;++i){
        if(type[i] === 0){//solid line
            rtn += `<path d="M ${xInc} 0 L ${xInc} ${y}" stroke="${color}" stroke-width="${markingWidth}"/>`
        }else{// dashed line
            rtn += `<path d="M ${xInc} 0 L ${xInc} ${y}" stroke="${color}" stroke-width="${markingWidth}" stroke-dasharray="${dashedLength}"/>`
        }

        xInc += 2 * markingWidth;
    }
    return rtn;
}

function CreateRulerMarking(x, record, isLast = false, isFirst = false){
    let y = landElement.clientHeight * (6 / 7);
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

function UpdateMarkingSpace(){
    let widthSum = 0;
    let markingFlag = 0;
    let leftD = "";
    let rightD = "";
    let newMarking = "";

    for(let i = 0;i< roadRecord.length;++i){
        if(roadRecord[i].type === "road"){
            leftD = "";
            rightD = "";
            markingFlag = 0;

            //left marking
            if(i === 0 || roadRecord[i-1].type !== "road"){
                leftD = CreateVerticalMarking("white", M2Px(widthSum), [0],  M2Px(0.15), 1);
            }
            
            //right marking
            if(i === roadRecord.length - 1){
                rightD = CreateVerticalMarking("white", M2Px(widthSum + roadRecord[i].width), [0],  M2Px(0.15), -1);
            }else if(roadRecord[i + 1].type === "road"){
                let color = "white";
                if(roadRecord[i].direction !== roadRecord[i + 1].direction){
                    color = "yellow";
                }
                rightD = CreateVerticalMarking(color, M2Px(widthSum + roadRecord[i].width), [roadRecord[i].crossability&0b10, roadRecord[i + 1].crossability&0b1],  M2Px(0.1));
            }else{
                rightD = CreateVerticalMarking("white", M2Px(widthSum + roadRecord[i].width), [0],  M2Px(0.15), -1);
            }
            if(leftD !== ""){
                newMarking += leftD;
            }
            if(rightD !== ""){
                newMarking += rightD;
            }
        }
        newMarking += CreateRulerMarking(M2Px(widthSum), roadRecord[i], i==roadRecord.length-1, i == 0);
        widthSum += roadRecord[i].width;
    }

    markingSpaceElement.innerHTML = newMarking;
    console.log("updating marking space");

}

function ResizeMarkingSpace(timeWindow){
    if(ResizeMarkingSpace.timeout === undefined){
        ResizeMarkingSpace.timeout = null;
    }
    if(ResizeMarkingSpace.timeout){
        clearTimeout(ResizeMarkingSpace.timeout); 
    }
    ResizeMarkingSpace.timeout = setTimeout(UpdateMarkingSpace, timeWindow);
}
