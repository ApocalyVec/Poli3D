//TODO calculate FOV through image extent
//TODO make sure the aspect ratio is correct in the projection matrix
// TODO calculate the eye position based on the extent
var gl;
var program;

var points;
var colors;
var theta = 0;
var alpha = 0;

let vBuffer;
let cBuffer;

function main() 
{
	// element for reading files
	const input = document.querySelector('input[type="file"]')
	input.addEventListener('change', function(e) {
		console.log(input.files);
		const reader = new FileReader();
		reader.readAsText(input.files[0]);

		reader.onload = function() {
			var lines = reader.result.split('\n').map(function(line) {
				return line.trim().split(/(?: | )+/);
			});

			var ver_lines = lines.filter(function(line) {  // lines that hold the vertex coordinates
				return line.length == 3 && !isNaN(line[0]);
			}).map(function(line) {
				return line.map(function(element) {
					return parseFloat(element);
				})
			});
			var pg_lines = lines.filter(function(line) {  // lines that hold the polygon info
				return line.length == 4 && !isNaN(line[0]);
			}).map(function(line) {
				return line.map(function(element) {
					return parseFloat(element);
				})
			});

			render(ver_lines, pg_lines);
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
	let translateMatrix = translate(-(xMax+xMin)/2, -(yMax+yMin)/2, -(zMax+zMin)/2);

	return [scaleMatrix, translateMatrix];
}

function render(ver_lines, pg_lines) {
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	// console.log('Ver lines are:');
	// for(let i = 0; i < ver_lines.length; i++) {
	// 	console.log(ver_lines[i]);
	// }
	// console.log('Pg lines are:');
	// for(let i = 0; i < pg_lines.length; i++) {
	// 	console.log(pg_lines[i]);
	// }
	// calculate the model matrix
	let rotMatrix = rotateX(0);
	let scaleTranslateM = poliScaleTranslate(ver_lines);
	let scaleMatrix = scaleTranslateM[0];
	let translateMatrix = scaleTranslateM[1];

	let ctMatrix = mult(mult(rotMatrix, scaleMatrix), translateMatrix);

	let ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));

	//calculate the view matrix
	let eye = vec3(0.0, 0.0, 2.0);
	let at = vec3(0.0, 0.0, 0.0);
	let up = vec3(0.0, 1.0, 0.0);
	let viewMatrix = lookAt(eye, at, up);
	let viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));

	// calculate the projection matrix
	let fovy = 30;
	let thisProj = perspective(fovy, 1, .1, 100);
	let projMatrix = gl.getUniformLocation(program, 'projMatrix');
	gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));

	// draw the triangles
	points = [];
	colors = [];
	for(let i = 0; i < pg_lines.length; i++) {
		color = vec4(1.0,1.0,1.0,1.0);

		let first = ver_lines[pg_lines[i][1]];
		let second = ver_lines[pg_lines[i][2]];
		let third = ver_lines[pg_lines[i][3]];

		points.push(vec4(first[0], first[1], first[2]));
		points.push(vec4(second[0], second[1], second[2]));
		points.push(vec4(third[0], third[1], third[2]));

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