/*
* Key features:
* 	the pulsing is using the sin function, those achieving a wave-like behavior (non-linear increment/decrement)
*
* */

// TODO shearing along x axis
// TODO draw the face normal

var gl;
var program;

var points;
var colors;
var theta = 0;
var alpha = 0;

let vBuffer;
let cBuffer;

let ver_lines, pg_lines;

// animation variables
let isPulse = false;
let isRotate = false;

let isMovingX = false;
let isPosX = 1;  // is the mesh translating along the positive x axis

let isMovingY = false;
let isPosY = 1;

let isMovingZ = false;
let isPosZ = 1;

function main() 
{
	// element for reading files
	const input = document.querySelector('input[type="file"]')
	input.addEventListener('change', function(e) {
		const reader = new FileReader();
		reader.readAsText(input.files[0]);

		reader.onload = function() {
			var lines = reader.result.split('\n').map(function(line) {
				return line.trim().split(/(?: | )+/);
			});

			if(lines[0][0] != 'ply') {
				throw "Invalid file type, not ply";
			}

			ver_lines = lines.filter(function(line) {  // lines that hold the vertex coordinates
				return line.length == 3 && !isNaN(line[0]);
			}).map(function(line) {
				return line.map(function(element) {
					return parseFloat(element);
				})
			});
			pg_lines = lines.filter(function(line) {  // lines that hold the polygon info
				return line.length == 4 && !isNaN(line[0]);
			}).map(function(line) {
				return line.map(function(element) {
					return parseFloat(element);
				})
			});

			render();
		}
	});

	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	gl = WebGLUtils.setupWebGL(canvas, undefined);
	if (!gl) 
	{
		console.log('Failed to get the rendering context for WebGL');
		return;
	}
	
	// Initialize shaders
	// This function call will create a shader, upload the GLSL source, and compile the shader
	program = initShaders(gl, "vshader", "fshader");
	gl.useProgram(program);

	//Set up the viewport
	gl.viewport( 0, 0, canvas.width, canvas.height );

	// initialize point and color arrary
	points = [];
	colors = [];
	//Create the buffer object
	vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

	//bind vertex buffer
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	//Specify the vertex size
	var offsetLoc = gl.getUniformLocation(program, "vPointSize");
	gl.uniform1f(offsetLoc, 10.0);

	//bind color buffer
	cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);

	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	isPulse = false;
	window.addEventListener("keypress", function(e) {

		if (e.key == 'b') {
			console.log('toggle breathing: ' + isPulse);
			isPulse = ! isPulse;
		}
		else if (e.key == 'r') {
			isRotate = ! isRotate;
		}

		else if (e.key == 'x') {
			isMovingX = ! isMovingX;
			isPosX = 1;
		}
		else if (e.key == 'c') {
			isMovingX = ! isMovingX;
			isPosX = -1;
		}

		else if (e.key == 'y') {
			isMovingY = ! isMovingY;
			isPosY = 1;
		}
		else if (e.key == 'u') {
			isMovingY = ! isMovingY;
			isPosY = -1;
		}

		else if (e.key == 'z') {
			isMovingZ = ! isMovingZ;
			isPosZ = 1;
		}
		else if (e.key == 'a') {
			isMovingZ = ! isMovingZ;
			isPosZ = -1;
		}

	});
}
let transRate = 0.01
let transX = 0;
let transY = 0;
let transZ = 0;

function getUserTranslate() {

	if(isMovingX) {
		transX += isPosX * transRate;
	}
	if(isMovingY) {
		transY += isPosY * transRate;
	}
	if(isMovingZ) {
		transZ += isPosZ * transRate;
	}


	return translate(transX, transY, transZ);
}

function poliScaleTranslate(ver_lines) {
	/*
	* return the scale matrix based on the leftmost, rightmost, top, bottom, nearest and furthest vertices
	* */
	let allX = ver_lines.flatMap(function(line){
		return line[0];
	});
	let allY = ver_lines.flatMap(function(line){
		return line[1];
	});
	let allZ = ver_lines.flatMap(function(line){
		return line[2];
	});
	let xMax = Math.max.apply(Math, allX);
	let xMin = Math.min.apply(Math, allX);
	let yMax = Math.max.apply(Math, allY);
	let yMin = Math.min.apply(Math, allY);
	let zMax = Math.max.apply(Math, allZ);
	let zMin = Math.min.apply(Math, allZ);

	let xScale = 1/(xMax - xMin);
	let yScale = 1/(yMax - yMin);
	let zScale = 1/(zMax - zMin);

	// if divided by 0
	if(!isFinite(xScale)) {
		xScale = 1;
	}
	if(!isFinite(yScale)) {
		yScale = 1;
	}
	if(!isFinite(zScale)) {
		zScale = 1;
	}

	let xyzScale = Math.min(xScale, yScale, zScale);
	let scaleMatrix = mat4(
		xyzScale,0,0,0,
		0,xyzScale,0,0,
		0,0,xyzScale,0,
		0,0,0,1
	);

	// calculate the translate matrix
	let translateMatrix = translate(-(xMax+xMin)/2, -(yMax+yMin)/2, -(zMax+zMin)/2);

	//calculate the fov based on the extend
	let opposite = Math.max((xyzScale * (xMax - xMin)), (xyzScale*(yMax - yMin)))/2;
	let adjacent = 1.5;
	// Converts from radians to degrees.
	Math.degrees = function(radians) {
		return radians * 180 / Math.PI;
	};
	let fov = Math.degrees(Math.atan(opposite / adjacent));  // give 2 degree tolerance
	return [scaleMatrix, translateMatrix];
}

let pulseRatio = 0;
let pulseRate = 100;
let pulsePercentage = 0.2;

let rotateRate = 5;
let rotateAngle = 0;


function render() {
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	// gl.clearColor(0.0, 0.0, 0.0, 1.0);
	// gl.enable(gl.DEPTH_TEST);

	// console.log('Ver lines are:');
	// for(let i = 0; i < ver_lines.length; i++) {
	// 	console.log(ver_lines[i]);
	// }
	// console.log('Pg lines are:');
	// for(let i = 0; i < pg_lines.length; i++) {
	// 	console.log(pg_lines[i]);
	// }


	// calculate the current transformation matrix
	//resolve user input on rotation
	if (isRotate) {
		rotateAngle += rotateRate
	}
	let rotMatrix = rotateX(rotateAngle);

	let scaleTranslateFov = poliScaleTranslate(ver_lines);
	let scaleMatrix = scaleTranslateFov[0];
	let offsetTranslateMatrix = scaleTranslateFov[1];
	let userTranslateMatrix = getUserTranslate();

	let ctMatrix = mult(userTranslateMatrix, mult(mult(rotMatrix, scaleMatrix), offsetTranslateMatrix));

	let ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));

	//calculate the view matrix
	let eye = vec3(0.0, 0.0, 1.5);
	let at = vec3(0.0, 0.0, 0.0);
	let up = vec3(0.0, 1.0, 0.0);
	let viewMatrix = lookAt(eye, at, up);
	let viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));

	// calculate the projection matrix
	let fovy = 55.0; // opposite side is always 0.5, adjacent side is always 1.5 (how far the eye is from the mesh)
	let thisProj = perspective(fovy, 1, 0.1, 100);
	let projMatrix = gl.getUniformLocation(program, 'projMatrix');
	gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));

	// draw the triangles
	points = [];
	colors = [];
	let color = vec4(1.0,1.0,1.0,1.0);

	if(isPulse) {
		pulseRatio += Math.PI / pulseRate;
	}

	for(let i = 0; i < pg_lines.length; i++) {

		let first = ver_lines[pg_lines[i][1]];
		let second = ver_lines[pg_lines[i][2]];
		let third = ver_lines[pg_lines[i][3]];

		// resolve animation

		let v1 = vec4(first[0], first[1], first[2], 1.0);
		let v2 = vec4(second[0], second[1], second[2], 1.0);
		let v3 = vec4(third[0], third[1], third[2], 1.0);

		let norm = newell(v1, v2, v3);
		// console.log('Norm is: ' + norm + ', Pulse ratio is ' + pRatio);
		let pulse_co = (Math.abs(pulsePercentage * Math.sin(pulseRatio))) / scaleMatrix[0][0];  // divide by the scale to ensure all meshes pulse uniformly at given pulse percentage (0.2)
		let pulseTranslateM = translate(pulse_co * norm[0], pulse_co * norm[1], pulse_co * norm[2]);

		points.push(mult(pulseTranslateM, v1));
		points.push(mult(pulseTranslateM, v2));
		points.push(mult(pulseTranslateM, v3));


		colors.push(color);
		colors.push(color);
		colors.push(color);
	}

	// bind the vertex and color buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	// manually draw triangles by
	for(let i = 0; i < points.length-2; i += 3) {
		gl.drawArrays(gl.LINE_LOOP, i, 3);
	}

	requestAnimationFrame(render);
}

function newell(v1, v2, v3) {
	/*
	* finds the surface normal for v1, v2, and v3
	* return the surface normal as a unit vector
	* */

	let n1, n2, n3; //

	n1 = (v1[1] - v2[1]) * (v1[2] + v2[2]) +
		(v2[1] - v3[1]) * (v2[2] + v3[2]) +
		(v3[1] - v1[1]) * (v3[2] + v1[2]);

	n2 = (v1[2] - v2[2]) * (v1[0] + v2[0]) +
		(v2[2] - v3[2]) * (v2[0] + v3[0]) +
		(v3[2] - v1[2]) * (v3[0] + v1[0]);

	n3 = (v1[0] - v2[0]) * (v1[1] + v2[1]) +
		(v2[0] - v3[0]) * (v2[1] + v3[1]) +
		(v3[0] - v1[0]) * (v3[1] + v1[1]);

	return normalize(vec3(n1,n2,n3), false);
}

// function render() {
// 	var rotMatrix = rotateX(0);
// 	var translateMatrix = translate(0, 0, 0);
// 	var ctMatrix = mult(translateMatrix, rotMatrix);
//
// 	theta += 0.5;
// 	alpha += 0.005;
//
// 	var eye = vec3(3.0, 3.0, 3.0);
// 	var at = vec3(0.0, 0.0, 0.0);
// 	var up = vec3(0.0, 1.0, 0.0);
//
// 	var viewMatrix = lookAt(eye, at, up);
// 	var viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
// 	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));
//
// 	var ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
// 	gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));
//
// 	// also clear the depth buffer bit
// 	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
//
// 	gl.drawArrays(gl.TRIANGLES, 0, points.length);
//
// 	// id = requestAnimationFrame(render);
//
// }