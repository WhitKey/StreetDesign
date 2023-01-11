import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


const M2CoordFactor = 1;
const RoadLevel = 0.01;
const MarkingLevel = RoadLevel + 0.002;
const MarkingLevelStep = 0.001;
const ExtrudeHeight = 0.2;

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
		color = 0x00ffff;
	}else if(compType === "sidewalk"){
		color = 0xff0000;
	}else if(compType === "bollard"){
		color = 0xffff00;
	}else if(compType === "shoulder"){
		color = 0x00ff00;
	}else{
		color = 0x0f0f0f;
	}
	
	if(compType === "sidewalk" || compType === "bollard"){
		geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
	}else{
		geometry = new THREE.ShapeGeometry( shape );
	}


	material = new THREE.MeshBasicMaterial( { "color": color } );
	let mesh = new THREE.Mesh( geometry, material ) ;
	mesh.scale.set(M2CoordFactor,M2CoordFactor,M2CoordFactor);
	mesh.position.set (0,RoadLevel, 0);
	mesh.rotation.set (-Math.PI / 2, 0, Math.PI-rotate);
	roadGroup.add(mesh);
}

function BuildRoad(model, rotDeg, centerOffsetX, centerOffsetY){
	function RoadCoordTransform(coord, centerOffsetY, xOffset){
		let newCoord = [
			coord[0] + xOffset ,
			-(coord[1] - centerOffsetY)
		];

		return newCoord;
	}

	let xOffset = -model.roadLength - model.model[0].path[0][0] - centerOffsetX//model.model[0].path[0][0]+ centerOffsetX - model.roadLength ;
	
	model.model.forEach(element => {
		//build component
		if(element.type === "component"){
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
			//console.log(element);
		}
	});
}

function BuildCenter(model, xLength, zLength){
	function CenterCoordTransform(coord){
		let newCoord = [
			coord[0] - zLength,
			-coord[1] + xLength
		];
		return newCoord;
	}

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
		}
	});

	//build pavement
	{
		let shape = new THREE.Shape();
		shape.moveTo(-zLength, -xLength)
		.lineTo(-zLength, xLength)
		.lineTo(zLength, xLength)
		.lineTo(zLength, -xLength)
		.lineTo(-zLength, -xLength)
		AddShape(shape, "road",0 );
	}


	console.log(model);
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
	renderer = new THREE.WebGLRenderer( { antialias: true } );
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
	controls.maxDistance = 1000;
	controls.maxPolarAngle = Math.PI;

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

		scene.background = new THREE.Color(0xffffff);
	}


	//light
	{
		// ambient light
		scene.add( new THREE.AmbientLight( 0x222222 ) );
		
		// point light
		const light = new THREE.PointLight( 0xffffff, 1 );
		camera.add( light );
	}

	// helper
	{
		scene.add( new THREE.AxesHelper( 200 ) );

		const plane = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ),0 );
		const helper = new THREE.PlaneHelper( plane, 100, 0x00f0f0 );
		scene.add( helper );
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
	render();
}

export function Exit3d(){
	console.log("exit 3d");
	showing = false;
}
