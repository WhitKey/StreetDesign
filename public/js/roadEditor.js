

//--------------------
//
//Global Variables
//
//--------------------

//element entries
var landElement = document.getElementById("land");
var editorElement = document.getElementById("editor");
var mainWindowElement = document.getElementById("mainWindow");
var propertyEditorElement = document.getElementById("mainWindow");

//road element template
var roadTemplate = document.getElementById("land");
var sidewalkTemplate = document.getElementById("land");
var bollardTemplate = document.getElementById("land");
var roadComponentTemplate = document.getElementById("land");
var templateBase = {};

//road layout editor variable
var dragElement = null;
var hitboxCounter = 0;
var componentCounter = 0;
var inHitboxId = null;
var touchHitbox = false;
var draging = false;

//landwidth 
var landWidth = 15;

//conponent layout
var roadRecord = [];

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


//-------------------------
//
//Initialization functions
//
//-------------------------
function LandInit() {
    const hitboxTemplate = document.getElementById("hitboxTemplate");
    landElement.innerHTML = "";
    AddHitbox();
}

function OnLoad() {
    console.log("load");
    //set element
    landElement = document.getElementById("land");
    editorElement = document.getElementById("editor");
    mainWindowElement = document.getElementById("mainWindow");
    propertyEditorElement = document.getElementById("propertyEditor");

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

    //initalize land
    LandInit();
}

//-----------------------------
//
//Component behavior functions
//
//-----------------------------
function AddHitbox(referencePos = null) {
    const hitboxTemplate = document.getElementById("hitboxTemplate");
    const emptyRoadComponentTemplate = document.getElementById("emptyRoadComponentTemplate");

    var hitbox = hitboxTemplate.cloneNode(true);
    var emptyComp = emptyRoadComponentTemplate.cloneNode(true);

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
    const hitbox = document.getElementById(hitboxId);
    const emptyComp = document.getElementById(hitboxId + "c");
    const componentType = dragElement.getAttribute("component");
    var component = roadComponentTemplate.cloneNode(true);
    var nextComp = null;

    var oldComp = null
    var toIndex = null;


    component.id = "comp" + componentCounter.toString();
    ++componentCounter;

    component.style.width = emptyComp.style.width;
    component.setAttribute("component", componentType);
    component.setAttribute("originHitbox", hitboxId);

    nextComp = emptyComp.nextSibling;
    if (!nextComp.classList.contains("roadComponent")) {
        nextComp = null;
    }

    if (!move) {
        component.appendChild(templateBase[componentType].cloneNode(true));
    } else {
        var target = document.getElementById(dragElement.getAttribute("target"));
        //console.log({ target });

        oldComp = GetComponentRecord((Array.prototype.slice.call(landElement.children).indexOf(target)-1)/2);
        RemoveHitbox(target.children[1].id);
        component.append(...target.childNodes);
        RemoveComponent(target);
    }

    landElement.insertBefore(component, emptyComp.nextSibling);
    AddHitbox(component);

    if (nextComp !== null) {
        nextComp.setAttribute("originHitbox", component.children[1].id);
    }

    
    toIndex = (Array.prototype.slice.call(landElement.children).indexOf(component)-1)/2;
    if(oldComp === null){
        AddNewComponentRecord(toIndex, componentType);
    }else{
        AddComponentRecord(toIndex, oldComp);
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
    
    var compIndex = (Array.prototype.slice.call(landElement.children).indexOf(target)-1)/2;
    RemoveComponentRecord(compIndex);
    console.log(roadRecord);

    target.remove();
}

function EnterHitbox(event) {
    if (landElement.hasAttribute("hitOn")) {
        //console.log("enter hitbox");
        var refPercent = 100.0 / landWidth;
        var emptyComp = document.getElementById(event.srcElement.id + "c");
        if (dragElement.classList.contains("roadComponent")) {
            var targetElement = document.getElementById(dragElement.getAttribute("target"));
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

        var emptyComp = document.getElementById(event.srcElement.id + "c");
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
    return componentDefaultProperty[compType];
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
    var comp = CreateComponentRecord(compType);
    
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
    var touchevent = false;
    if (event.type == "touchstart") {
        touchevent = true;
        //console.log("touch start")
    }

    draging = false;
    var target = event.srcElement;
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
        document.body.addEventListener("mousemove", ComponentDrag);
        document.body.addEventListener("mouseup", ComponentDragEnd);
    }

}

function ComponentDrag(event) {
    var touchEvent = false;
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
                var event = new Event("mouseenter");
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

    var touchEvent = false;
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
        var emptyComp = document.getElementById(inHitboxId + "c");
        if (dragElement.classList.contains("roadComponent")) {
            var target = document.getElementById(dragElement.getAttribute("target"));
            document.getElementById(dragElement.getAttribute("target")).style.opacity = "1";
            if (inHitboxId === -1) {
                RemoveComponent(target);
                inHitboxId = null;
                dragElement.remove();
                dragElement = null;
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
    }
    dragElement.remove();
    dragElement = null;

}

//---------------------------
//
//Property Setting functions
//
//---------------------------

function CreatePropertyCard(type = String, value = Number){
    var propertyTitle = "";
    var cardInfo = "";
    if(type === "direction"){
        propertyTitle = "上/下行";
    }else if(type === "exitDirection"){
        propertyTitle = "出口方向";
    }else if(type === "crossability"){
        propertyTitle = "標線設置";
    }
    
    
    return `
    <div class="window card propertyCard">
        <div class="card-header" style="overflow-x: hidden;">
            <h6 class="card-title" style="white-space: nowrap;">${propertyTitle}</h6>
        </div>
        <div class="card-body" style="display:flex; justify-content:space-around; overflow-x:hidden;">
            <div class="propertyToggle enable false"><img src="img/line_no_cross.svg"></div>
            <div class="propertyToggle">⥒</div>
            <div class="propertyToggle">⥒</div>
        </div>
    </div>
    `;
}

function PropertySettingChange(event, type){
    var propertySettingElement = document.getElementById("propertySettings");
    var compIdx = parseInt(propertySettingElement.getAttribute("component_idx"));
    var componentElement = document.getElementById(propertyEditorElement.getAttribute("target"));

    if(type === "width"){
        var newWidth = event.target.value;
        var refPercent = 100.0 / landWidth; // % per meter

        console.log("update width");
        componentElement.style.width = (refPercent * parseFloat(newWidth)).toString() + "%";
        roadRecord[compIdx].width = parseFloat(newWidth);
    }
}

function PropertySettingStart(compId, compType){
    var target = document.getElementById(compId);

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

    var compIdx = (Array.prototype.slice.call(landElement.children).indexOf(document.getElementById(compId))-1)/2;
    var propertyRecord =  GetComponentRecord(compIdx);
    var propertyCards = "";
    var cardLayout = propertyRecord["layout"];

    for(var i = 0; i < cardLayout.length; ++i){
        propertyCards += (CreatePropertyCard(cardLayout[i], propertyRecord[cardLayout[i]]));
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
            ${propertyCards}
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
    var target = event.target;
    var check = false;
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
        document.body.removeEventListener("mousedown", PropertySettingExitTrigger);
        document.body.removeEventListener("touchstart", PropertySettingExitTrigger);
        SetLeftSlideout(false);
        var target = document.getElementById(propertyEditorElement.getAttribute("target"));
        target.classList.remove("selected");
        propertyEditorElement.innerHTML = "";
        target.addEventListener("mousedown", ComponentDragStart);
        target.addEventListener("touchstart", ComponentDragStart);
    }
}
