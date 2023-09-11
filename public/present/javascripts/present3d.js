import * as THREE from 'three';
import { EllipseCurve, ZeroSlopeEnding } from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


const M2CoordFactor = 2;
const RoadLevel = 0.01;
const ExtrudeHeight = 0.2;
const MarkingTextureMagLevel = 100;

let roadGroup, camera, scene, renderer;
let present3dWindow = document.getElementById("intersectionRenderArea3d");;
let inited = false;
let showing = false;


//---------------------------------------
//
// model function
//
//---------------------------------------
function AddShape(shape, compType, rotate){
	const extrudeSettings = { depth: ExtrudeHeight, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0, bevelThickness: 0 };
	let color;
	let geometry;
	let material;
	
	if(compType === "road"){
		color = 0x1c1c1c;
	}else if(compType === "sidewalk"){
		color = 0x912727;
	}else if(compType === "bollard"){
		color = 0x808080;
	}else if(compType === "shoulder"){
		color = 0x1c1c1c;
	}else{
		color = 0x0f0f0f;
	}
	
	if(compType === "sidewalk" || compType === "bollard"){
		geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
	}else{
		geometry = new THREE.ShapeGeometry( shape );
	}

	material = new THREE.MeshPhongMaterial( { "color": color } );
	let mesh = new THREE.Mesh( geometry, material ) ;
	mesh.scale.set(M2CoordFactor,M2CoordFactor,M2CoordFactor);
	mesh.position.set (0,RoadLevel, 0);
	mesh.rotation.set (-Math.PI / 2, 0, Math.PI-rotate);
	roadGroup.add(mesh);
}

function AddRoadMarking(context, xOffset, points, lineProp){
	function CoordTransform(point, xOffset, yOffset){
		if(point.length === 3){
			let newPoint = [];
			for(let i= 0;i<3;++i){
				newPoint.push([
					(point[i][0] + xOffset) * MarkingTextureMagLevel,
					(point[i][1] + yOffset) * MarkingTextureMagLevel
				]);
			}
			return newPoint;
		}
		return [
			(point[0] + xOffset) * MarkingTextureMagLevel,
			(point[1] + yOffset) * MarkingTextureMagLevel
		];
	}

	function AddLine(context, points, xOffset, yOffset){
		let firstFlag = true;
		points.forEach(element => {
			let item = CoordTransform(element, xOffset, yOffset);
			if(firstFlag){
				firstFlag = false;
				context.moveTo(item[0], item[1]);
				return;
			}
			
			if(item.length === 3){
				context.bezierCurveTo(
					item[0][0], item[0][1],
					item[1][0], item[1][1],
					item[2][0], item[2][1],
					);
					return
			}
			context.lineTo(item[0], item[1]);
		});
	}

	const DashedPattern = [3 * MarkingTextureMagLevel, 3 * MarkingTextureMagLevel];
	const FillerColor = "hsl(0, 0%, 11%)";
	let lineWidth = lineProp.width * MarkingTextureMagLevel;
	let yOffset = 0;
	let totalWidth;
	let color = lineProp.width !== 0.1 || lineProp.sameDir ? "white" : "yellow";
	
	
	
	
	//single line
	if(lineProp.width !== 0.1 || lineProp.slowlane){
		if(lineProp.width === 0.15){
			if(lineProp.right === 1){
				yOffset = -lineProp.width / 2;
			}else{
				yOffset = lineProp.width / 2;
			}
		}
		
		context.beginPath();
		context.setLineDash([]);
		context.strokeStyle = color;
		context.lineWidth = lineWidth;
		
		AddLine(context, points, xOffset, yOffset);
		context.stroke();
		return;
	}

	// double crossable
	if(lineProp.left === 1 && lineProp.right === 1){
		context.beginPath();
		context.strokeStyle = color;
		context.lineWidth = lineWidth;
		context.setLineDash(DashedPattern);
		
		AddLine(context, points, xOffset, yOffset);
		
		context.stroke();
		return;
	}
	
	totalWidth = lineProp.width * 3;
	yOffset = lineProp.width/2 - totalWidth / 2;
	//left
	{
		context.beginPath();
		context.strokeStyle = color;
		context.lineWidth = lineWidth;
		context.setLineDash([]);
		
		if(lineProp.left === 1){
			context.setLineDash(DashedPattern);
		}
		
		AddLine(context, points, xOffset, yOffset);
		context.stroke();
	}
	yOffset += lineProp.width;
	
	//filler
	{
		context.beginPath();
		context.strokeStyle = FillerColor;
		context.lineWidth = lineWidth;
		context.setLineDash([]);
		
		AddLine(context, points, xOffset, yOffset);
		context.stroke();
	}
	yOffset += lineProp.width;
	
	//right
	{
		context.beginPath();
		context.strokeStyle = color;
		context.lineWidth = lineWidth;
		context.setLineDash([]);
		
		if(lineProp.right === 1){
			context.setLineDash(DashedPattern);
		}
		
		AddLine(context, points, xOffset, yOffset);
		context.stroke();
	}
}

function BuildRoad(model, rotDeg, centerOffsetX, centerOffsetY){
	function AddDirMarking(context, model, texture, roadModel, xOffset){
		let dimension = model.roadWidth * MarkingTextureMagLevel;
		let img = new Image();
		let rot = model.rot * Math.PI / 180;
		let coord = [ 0 , model.yOffset * MarkingTextureMagLevel + dimension / 2];

		img.onload = function (){
			context.save()
			if(model.section === "stop"){
				coord[0] = (xOffset + roadModel.roadEnd - 2 ) * MarkingTextureMagLevel- dimension / 2;
			}else{
				coord[0] = (xOffset + roadModel.intermidiateStart - 5 ) * MarkingTextureMagLevel- dimension / 2;
			}

			context.translate(coord[0], coord[1]);
			context.rotate(rot);
			context.drawImage(img, -dimension / 2, -dimension / 2, dimension, dimension);
			context.restore();

			texture.needsUpdate = true;
		}
		
		img.height=dimension;
		img.width=dimension;
		img.src = model.src;
	}

	function RoadCoordTransform(coord, centerOffsetY, xOffset){
		let newCoord = [
			coord[0] + xOffset ,
			-(coord[1] - centerOffsetY)
		];

		return newCoord;
	}
	let setting = model[0]
	let xOffset = -model.roadLength - model.model[0].path[0][0] - centerOffsetX//model.model[0].path[0][0]+ centerOffsetX - model.roadLength ;
	let canvas = document.createElement("canvas");
	let context;
	let markingXOffset = -model.model[0].path[0][0];
	let markingQueue = {"-1": [], "0": [], "1":[]};
	let roadTexture = new THREE.CanvasTexture(canvas);
	
	canvas.width = model.roadLength * MarkingTextureMagLevel;
	canvas.height = model.roadWidth * MarkingTextureMagLevel;

	context = canvas.getContext("2d");
	context.fillStyle = "hsl(0, 0%, 1%)";
	//context.fillStyle = "red";
	context.fillRect(0, 0, model.roadLength * MarkingTextureMagLevel, model.roadWidth * MarkingTextureMagLevel);


	model.model.forEach(element => {
		//build component
		if(element.type === "component"){
			if(element.componentType === "road" || element.componentType === "shoulder" || element.componentType === "slowlane")return;

			let moveFlag = true;
			let shape = new THREE.Shape();

			//build shape
			element.path.forEach(point => {
				//b curve
				if(point.length > 2){

					let newPoint = [];
					for(let i = 0;i<3;++i){
						newPoint.push(RoadCoordTransform(point[i], centerOffsetY, xOffset));
					}

					shape.bezierCurveTo(
						newPoint[0][0], newPoint[0][1],
						newPoint[1][0], newPoint[1][1],
						newPoint[2][0], newPoint[2][1],
					);
					return;
				}

				let newPoint = RoadCoordTransform(point, centerOffsetY, xOffset);
				if(moveFlag){
					shape.moveTo(newPoint[0], newPoint[1]);
					moveFlag = false;
					return;
				}
				shape.lineTo(newPoint[0], newPoint[1]);
			});
			AddShape(shape, element.componentType, rotDeg *Math.PI / 180 );
		}else if(element.type === "marking"){
			markingQueue[element.markingPriority].push(element);
		}else if(element.type === "dirMarking"){
			AddDirMarking(context, element, roadTexture, model, markingXOffset);
		}
	});
	
	//add road
	{
		//build shape
		let shape = new THREE.Shape();
		{
			let point = RoadCoordTransform([model.model[0].path[0][0], 0], centerOffsetY, xOffset);
			shape.moveTo(point[0], point[1]);
			point = RoadCoordTransform([model.roadLength + model.model[0].path[0][0], 0], centerOffsetY, xOffset);
			shape.lineTo(point[0], point[1]);
			point = RoadCoordTransform([model.roadLength + model.model[0].path[0][0], model.roadWidth], centerOffsetY, xOffset);
			shape.lineTo(point[0], point[1]);
			point = RoadCoordTransform([model.model[0].path[0][0], model.roadWidth], centerOffsetY, xOffset);
			shape.lineTo(point[0], point[1]);
			point = RoadCoordTransform([model.model[0].path[0][0], 0], centerOffsetY, xOffset);
			shape.lineTo(point[0], point[1]);
		}

		//build texture canvas
		{
			markingQueue[-1].forEach(element => {
				AddRoadMarking(context, markingXOffset, element.path, element.lineProp);
			});
			markingQueue[1].forEach(element => {
				AddRoadMarking(context, markingXOffset, element.path, element.lineProp);
			});
			markingQueue[0].forEach(element => {
				AddRoadMarking(context, markingXOffset, element.path, element.lineProp);
			});
		}

		//build shape mesh
		{
			let geometry;
			let material;
			
			roadTexture.magFilter = THREE.NearestFilter;
			roadTexture.minFilter = THREE.NearestFilter;

			geometry = new THREE.ShapeGeometry( shape );

			material = new THREE.MeshPhongMaterial( { map: roadTexture} );
			material.side = THREE.DoubleSide;

			let mesh = new THREE.Mesh( geometry, material ) ;
			mesh.scale.set(M2CoordFactor,M2CoordFactor,M2CoordFactor);
			mesh.position.set (0,RoadLevel - 0.01, 0);
			mesh.rotation.set (-Math.PI / 2, 0, Math.PI-rotDeg *Math.PI / 180);

			//reassign uv
			{
				let attUv = mesh.geometry.attributes.uv;
				attUv.setXY(0, 0, 1);
				attUv.setXY(1, 1, 1);
				attUv.setXY(2, 1, 0);
				attUv.setXY(3, 0, 0);
			}
			roadGroup.add(mesh);
		}

		//AddShape(shape, "road", rotDeg *Math.PI / 180);
	}
}

function BuildCenter(model, xLength, zLength){
	function CenterCoordTransform(coord){
		let newCoord = [
			coord[0] - zLength,
			-coord[1] + xLength
		];
		return newCoord;
	}

	function MarkingCoordTransform(coord){
		if(coord.length === 3){
			let newCoord = [];
			for(let i = 0;i<3;++i){
				newCoord.push([
					coord[0] * MarkingTextureMagLevel,
					coord[1] * MarkingTextureMagLevel,
				]);
			}
			return newCoord;
		}
		return [
			coord[0] * MarkingTextureMagLevel,
			coord[1] * MarkingTextureMagLevel,
		];
	}

	let canvas = document.createElement("canvas");
	let context = canvas.getContext("2d");

	canvas.width = zLength * 2* MarkingTextureMagLevel;
	canvas.height = xLength * 2 * MarkingTextureMagLevel;
	context.fillStyle = "hsl(0, 0%, 1%)";
	context.fillRect(0, 0, canvas.width, canvas.height);

	model.forEach(element => {
		if(element.type === "component"){
			let moveFlag = true;
			let shape = new THREE.Shape();
			//build shape
			element.path.forEach(point => {
				//b curve
				if(point.length > 2){

					let newPoint = [];
					for(let i = 0;i<3;++i){
						newPoint.push(CenterCoordTransform(point[i]));
					}

					shape.bezierCurveTo(
						newPoint[0][0], newPoint[0][1],
						newPoint[1][0], newPoint[1][1],
						newPoint[2][0], newPoint[2][1],
					);
					return;
				}

				let newPoint = CenterCoordTransform(point);
				if(moveFlag){
					shape.moveTo(newPoint[0], newPoint[1]);
					moveFlag = false;
					return;
				}
				shape.lineTo(newPoint[0], newPoint[1]);
			});
			AddShape(shape, element.componentType,0 );
		}else if(element.type === "marking"){
			if(element.markingType === "zebra"){
				let moveFlag = true;

				context.beginPath();
				context.lineWidth = element.width * MarkingTextureMagLevel;
				context.strokeStyle = "white";
				context.setLineDash ([0.4 * MarkingTextureMagLevel, 0.4 * MarkingTextureMagLevel]);

				element.path.forEach(points => {
					let item = MarkingCoordTransform(points);
					if(moveFlag){
						moveFlag = false;
						context.moveTo(item[0], item[1]);
						return;
					}

					if(item.length === 3){
						context.bezierCurveTo(
							item[0][0], item[0][1],
							item[1][0], item[1][1],
							item[2][0], item[2][1],
						);
						return;
					}

					context.lineTo(item[0], item[1]);
				});

				context.stroke();
			}
		}
	});

	//build pavement
	{
		let shape = new THREE.Shape();
		
		//create shape
		shape.moveTo(-zLength, -xLength)
		.lineTo(-zLength, xLength)
		.lineTo(zLength, xLength)
		.lineTo(zLength, -xLength)
		.lineTo(-zLength, -xLength)

		//build shape mesh
		{
			let geometry;
			let material;
			let texture = new THREE.CanvasTexture(canvas);
			texture.magFilter = THREE.NearestFilter;
			texture.minFilter = THREE.NearestFilter;

			geometry = new THREE.ShapeGeometry( shape );

			material = new THREE.MeshPhongMaterial( { map: texture} );
			material.side = THREE.DoubleSide;

			let mesh = new THREE.Mesh( geometry, material ) ;
			mesh.scale.set(M2CoordFactor,M2CoordFactor,M2CoordFactor);
			mesh.position.set (0,RoadLevel, 0);
			mesh.rotation.set (-Math.PI / 2, 0,0);

			//reassign uv
			{
				let attUv = mesh.geometry.attributes.uv;
				attUv.setXY(0, 1, 1);
				attUv.setXY(1, 1, 0);
				attUv.setXY(2, 0, 0);
				attUv.setXY(3, 0, 1);
			}
			roadGroup.add(mesh);
		}

		//AddShape(shape, "road",0 );
	}


	//console.log(model);
}

function BuildIntersection(modelParameter){
	let xLength;
	let zLength;

	roadGroup = new THREE.Group();
	xLength = modelParameter[0].roadWidth > modelParameter[2].roadWidth? modelParameter[0].roadWidth : modelParameter[2].roadWidth;
	zLength = modelParameter[1].roadWidth > modelParameter[3].roadWidth? modelParameter[1].roadWidth : modelParameter[3].roadWidth;

	xLength /= 2 ;
	zLength /= 2 ;

	//BuildRoad(modelParameter[0], 90, zLength, xLength);
	BuildRoad(modelParameter[0], 0, zLength, xLength);
	BuildRoad(modelParameter[1], 90, xLength, zLength);
	BuildRoad(modelParameter[2], 180, zLength, xLength);
	BuildRoad(modelParameter[3], 270, xLength, zLength);

	//build center
	BuildCenter(modelParameter.center, xLength, zLength);


	//console.log(modelParameter);
}


//----------------------------------
//
// utility functions
//
//----------------------------------
function init(modelParameter) {
	if(inited)return;
	inited = true;

	scene = new THREE.Scene();
	present3dWindow = document.getElementById("intersectionRenderArea3d");
	renderer = new THREE.WebGLRenderer( { antialias: true, logarithmicDepthBuffer: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( present3dWindow.clientWidth, present3dWindow.clientHeight );
	present3dWindow.appendChild( renderer.domElement );

	// camera
	{	
		let aspect =  present3dWindow.clientWidth / present3dWindow.clientHeight;
		let frustumSize = 600;
		camera = new THREE.PerspectiveCamera( 40, aspect, 1, 1000 );
		//camera = new THREE.OrthographicCamera( 0.5 * frustumSize * aspect / - 2, 0.5 * frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 0, 1000 );
		camera.position.set( 15, 20, 30 );
		scene.add( camera );
	}

	// controls
	const controls = new OrbitControls( camera, renderer.domElement );
	controls.minDistance = 20;
	controls.maxDistance = 500;
	controls.maxPolarAngle = Math.PI/2;
	//controls.minPolarAngle = Math.PI / 2;

	//background
	{
		//const loader = new THREE.CubeTextureLoader();
		//loader.setPath( './images/3dPresent/skybox/');
		//
		//const textureCube = loader.load( [
		//	'right.jpg', 'left.jpg',
		//	'top.jpg', 'bottom.jpg',
		//	'front.jpg', 'back.jpg',
		//] );
		//scene.background = textureCube;

		scene.background = new THREE.Color(0xb0b0b0);
	}


	//light
	{
		// ambient light
		scene.add( new THREE.AmbientLight( 0x505050 ) );
		
		// directional light
		let light = new THREE.DirectionalLight( 0xffffff, 1);

		light.position.set(0, 20, 10);
		scene.add( light );
	}

	// helper
	{
		scene.add( new THREE.AxesHelper( 200 ) );

		//const plane = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ),0 );
		//const helper = new THREE.PlaneHelper( plane, 100, 0x00f0f0 );
		//scene.add( helper );
	}

	//build model
	BuildIntersection(modelParameter);

	scene.add(roadGroup);
}


//---------------------------------------
//
// render utility functions
//
//---------------------------------------
function resize(){
	camera.aspect = present3dWindow.clientWidth / present3dWindow.clientHeight;
	camera.updateProjectionMatrix();
	
	renderer.setSize( present3dWindow.clientWidth, present3dWindow.clientHeight );

}

function render() {
	if(showing){
		requestAnimationFrame( render );
	}
	renderer.render( scene, camera );
	
}


//-------------------------------------
//
// export functions
//
//-------------------------------------

export function onWindowResize() {
	resize();

}

export function Trigger3d(modelParameter){
	console.log("3d triggered");
	showing = true;
	init(modelParameter);
	resize();
	render();
}

export function Exit3d(){
	console.log("exit 3d");
	showing = false;
}
