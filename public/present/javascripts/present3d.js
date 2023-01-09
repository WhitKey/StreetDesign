import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let group, camera, scene, renderer;
let present3dWindow = document.getElementById("intersectionRenderArea3d");;
let inited = false;


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
		scene.add( new THREE.AxesHelper( 20 ) );

		const plane = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ),0 );
		const helper = new THREE.PlaneHelper( plane, 100, 0x00f0f0 );
		scene.add( helper );
	}

	//build model
	{
		console.log(modelParameter);
	}

}

function resize(){
	camera.aspect = present3dWindow.clientWidth / present3dWindow.clientHeight;
	camera.updateProjectionMatrix();
	
	renderer.setSize( present3dWindow.clientWidth, present3dWindow.clientHeight );

}

export function onWindowResize() {
	resize();

}

function animate() {

	requestAnimationFrame( animate );
	render();

}

function render() {

	renderer.render( scene, camera );

}

export function init3D(modelParameter){
	console.log("three initialize");
	init(modelParameter);
	animate();
}