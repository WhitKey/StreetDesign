
var landElement = document.getElementById("land");

var roadTemplate = document.getElementById("land");
var sidewalkTemplate = document.getElementById("land");
var bollardTemplate = document.getElementById("land");
var roadComponentTemplate = document.getElementById("land");
var rangeButtonTemplate = document.getElementById("rangeSlider");

var templateBase = {
};

var landWidth = 15;
var dragElement = null;
var hitboxCounter = 0;
var componentCounter = 0;
var inHitboxId = null;
var selectedElement = null;
var rangeSlderElement = null;

const componentDefaultWidth = {
    "road": 3,
    "sidewalk": 1,
    "bollard": 0.5,
}

function LandInit(){
    const hitboxTemplate= document.getElementById("hitboxTemplate");
    landElement.innerHTML="";
    AddHitbox();
}

function OnLoad()
{
    console.log("load");
    //set element
    landElement = document.getElementById("land");

    templateBase["road"] = document.getElementById("roadTemplate").cloneNode(true);
    templateBase["sidewalk"] = document.getElementById("sidewalkTemplate").cloneNode(true);
    templateBase["bollard"] = document.getElementById("bollardTemplate").cloneNode(true);

    templateBase["road"].removeAttribute("id");
    templateBase["sidewalk"].removeAttribute("id");
    templateBase["bollard"].removeAttribute("id");

    roadComponentTemplate = document.getElementById("roadComponentTemplate").cloneNode(true);
    roadComponentTemplate.removeAttribute("id");

    //initalize land
    LandInit();
}

function AddHitbox(referencePos = null){
    const hitboxTemplate = document.getElementById("hitboxTemplate");
    const emptyRoadComponentTemplate = document.getElementById("emptyRoadComponentTemplate");

    var hitbox = hitboxTemplate.cloneNode(true);
    var emptyComp = emptyRoadComponentTemplate.cloneNode(true);

    hitbox.id = "hb" + hitboxCounter.toString();
    emptyComp.id = hitbox.id + "c";
    

    if(referencePos === null){
        
        hitbox.style.position= "absolute";
        landElement.appendChild(emptyComp);
        landElement.appendChild(hitbox);
    }else {
        referencePos.appendChild(hitbox);
        landElement.insertBefore(emptyComp, referencePos.nextSibling);
        //landElement.insertBefore(hitbox, emptyComp);
    }
    ++hitboxCounter;
}

function RemoveHitbox(hitboxId){
    document.getElementById(hitboxId).remove();
    document.getElementById(hitboxId + "c").remove();
}

async function InsertComponent(hitboxId, move = false){
    const hitbox = document.getElementById(hitboxId);
    const emptyComp = document.getElementById(hitboxId + "c");
    const componentType = dragElement.getAttribute("component");
    var component = roadComponentTemplate.cloneNode(true);
    component.id = "comp"+componentCounter.toString();
    ++componentCounter;
    
    component.style.width = emptyComp.style.width;
    component.setAttribute("component", componentType);
    if(!move)
    {
        var clone = templateBase[componentType].cloneNode(true);
        clone.addEventListener("dblclick", ComponentSelect);
        component.appendChild(clone);
    }
    else{
        var target = document.getElementById(dragElement.getAttribute("target"));
        console.log({target});

        RemoveHitbox(target.children[1].id);
        component.append(...target.childNodes);
        RemoveComponent(target);
    }

    landElement.insertBefore(component, emptyComp.nextSibling);
    AddHitbox(component);
}

function RemoveComponent(target){
    console.log("remove component");
    //console.log({target});
    if(target.lastChild !== null){
        if(target.lastChild.classList.contains("hitbox")){
            RemoveHitbox(target.lastChild.id);
        }
    }
    target.remove();
}

function EnterHitbox(event)
{
    if(landElement.hasAttribute("hitOn"))
    {
        console.log("enter hitbox");
        var refPercent = 100.0 / landWidth ;
        var emptyComp = document.getElementById(event.srcElement.id + "c");
        emptyComp.style.width = parseFloat(refPercent * parseFloat(componentDefaultWidth[dragElement.getAttribute("component")])).toString()+"%";
        inHitboxId = event.target.id;
    }
}

function LeaveHitbox(event){
    if(landElement.hasAttribute("hitOn")){
        inHitboxId = null;
        console.log("leave hitbox");
        var emptyComp = document.getElementById(event.srcElement.id + "c");
        emptyComp.style.width = "0px";
    }
}

function EnterTrashcan(){
    inHitboxId = -1;
}

function LeaveTrashcan(){
    inHitboxId = null;
}
// range slider

function RangeSlider_Move(event)
{
    if (rangeSlderElement !== null)
    {
        console.log("RangeSlider_Move");

        let mouseX = event.clientX;
        let rangeSlider_TargeId = rangeSlderElement.getAttribute("targetId")
        let target = document.getElementById(rangeSlider_TargeId);
        var rect = target.getBoundingClientRect();
        if (mouseX > rect.left + 20) // 確保不會變反向
        {
            target.style.width = (mouseX - rect.left) + "px";
        }
    }
}
function RangeSlider_Start(event)
{
    console.log("RangeSlider_Start");
    rangeSlderElement = event.srcElement;

}
function RangeSlider_End(event)
{
    console.log("RangeSlider_End");
    rangeSlderElement = null;
}

function ComponentSelect(event)
{
    console.log("ComponentSelect");

    var target = event.srcElement;
    var test  = event.srcElement;

    if(target.classList.contains("component"))
    {
        target = target.parentElement;
    }
    if (selectedElement === target) // 取消
    {
        selectedElement.style.outline = '#000000 solid 0px'; // Disable HighLight
        var element = document.getElementById("rangeSlider");
        element.parentNode.removeChild(element);
        selectedElement = null;
        document.body.removeEventListener("mousemove", RangeSlider_Move);
        document.body.removeEventListener("mouseup", RangeSlider_End);
    }
    else // 選取
    {
        if (selectedElement!= null)
        {
            selectedElement.style.outline = '#000000 solid 0px'; // Disable HighLight
            var element = document.getElementById("rangeSlider");
            element.parentNode.removeChild(element);
        }
        else
        {
            document.body.addEventListener("mousemove", RangeSlider_Move);
            document.body.addEventListener("mouseup", RangeSlider_End);
        }
        selectedElement = target
        selectedElement.style.outline = '#FDFF47 solid 2px'; // Enable HighLight
        var rect = selectedElement.getBoundingClientRect();
        console.log(rect.top, rect.right, rect.bottom, rect.left);
        
        var rs = document.getElementById("rangeSlider").cloneNode(true);
        rs.setAttribute("targetId", target.id);
        console.log(target.id)
        rs.style.right = 0;
        rs.style.top = 0;
        
        test.appendChild(rs);
    }
}



function ComponentDragStart(event)
{
    console.log("DragStart")
    var target = event.srcElement;
    const xOffset = -target.clientWidth / 2;
    const yOffset = -target.clientHeight / 2;

    // 原本沒有選取物件
    if (dragElement !== null)
    {
        return
    }

    if(target.classList.contains("component"))
    {
        target = target.parentElement;
    }

    // 新增拖曳物件
    dragElement = target.cloneNode(true);
    dragElement.setAttribute("target", dragElement.id);
    dragElement.removeAttribute("id");
    dragElement.removeAttribute("onmousedown");
    dragElement.style.position = "absolute";
    dragElement.style.width = target.clientWidth + "px";
    dragElement.style.height = target.clientHeight + "px";
    dragElement.style.left = event.clientX + xOffset + "px";
    dragElement.style.top = event.clientY + yOffset + "px";
    dragElement.classList.add("draggingElement");
    const hitbox = dragElement.querySelectorAll('.hitbox');
    hitbox.forEach(box => { box.remove();});

    document.body.appendChild(dragElement);
    document.body.addEventListener("mousemove", ComponentDrag);
    document.body.addEventListener("mouseup", ComponentDragEnd);

    landElement.classList.add("hitOn");
    landElement.setAttribute("hitOn", "");
    ComponentDrag(event);
}

function ComponentDrag(event)
{
    const target = dragElement;
    const xOffset = -target.clientWidth / 2;
    const yOffset = -target.clientHeight / 2;
    target.style.left = event.clientX + xOffset + "px";
    target.style.top = event.clientY + yOffset + "px";

    console.log("mouse move");
    //console.log(event);
}

function ComponentDragEnd(event)
{
    console.log("drag end");
    landElement.classList.remove("hitOn");
    landElement.removeAttribute("hitOn");

    if(inHitboxId !== null)
    {
        var emptyComp = document.getElementById(inHitboxId + "c");
        if(dragElement.classList.contains("roadComponent"))
        {
            var target = document.getElementById(dragElement.getAttribute("target"));    
            if (inHitboxId === -1) // 編輯區->丟棄
            {
                RemoveComponent(target);
                inHitboxId = null;
                document.body.removeEventListener("mousemove", ComponentDrag);
                document.body.removeEventListener("mouseup", ComponentDragEnd);
                dragElement.remove();
                dragElement = null;
                return;
            }
            else // 編輯區->交換
            {
                //if((!(target.previousSibling.id === landElement.lastChild.id + "c")) && (!(target.children[1].id === inHitboxId))){
                    //if (target.previousSibling.previousSibling !== null){
                    //    if ((!(target.previousSibling.previousSibling.children[1].id === inHitboxId))){
                        if(target.children[1].id !== inHitboxId)
                        {
                            InsertComponent(inHitboxId, true);
                        }
                    //    }
                    //}
                //}
            }
        }
        else if (inHitboxId !== -1) // 工具區->放置
        {
            InsertComponent(inHitboxId);
        }
        else // 工具區->丟棄
        {
            inHitboxId = null;
            document.body.removeEventListener("mousemove", ComponentDrag);
            document.body.removeEventListener("mouseup", ComponentDragEnd);


            dragElement.remove();
            dragElement = null;
            return;
        }
        
        inHitboxId = null;
        emptyComp.style.width = "0px";
        emptyComp.style.display = "none";
        setTimeout(() => { emptyComp.style.display = "block";}, 300);
    }
    

    document.body.removeEventListener("mousemove", ComponentDrag);
    document.body.removeEventListener("mouseup", ComponentDragEnd);
    dragElement.remove();
    dragElement = null;
    
}