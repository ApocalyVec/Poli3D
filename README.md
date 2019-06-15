# Poli3D
This program implements WebGL to view a .ply file. It offers a variety of ways to interact with the drawn mesh.

## User commands
B for Pulsing

R for Rotating along the x axis of the mesh itself

X for toggling moving along the Positive X axis

C for toggling moving along the Negative X axis

Y for toggling moving along the Positive Y axis

U for toggling moving along the Negative Y axis

Z for toggling moving along the Positive Z axis

A for toggling moving along the Negative Z axis

N for displaying the surface normals for all the faces of the mesh

Drag over the canvas to rotate the mesh

Use the Shear Slider to shear the mesh along any axis

##Extra Features
* the pulsing is using the sin function, those achieving a wave-like behavior (non-linear increment/decrement)
* use mouse to drag on canvas to rotate the mesh 
* Press N key to display the surface normals of the mesh
* Shear Slider to apply shear on all directions

##Structure of the Program
This program implements Webgl as a 3D view application. 

###Reading file
When a .ply file is uploaded. The program fires onChange callback to read the given file. The file is parsed using the 
map and filter function to optimize performance. The two resulting variable from reading the files are:
* ver_lines: list of vertex information, each entry contains the coordinates of all the vertices as a list of floats
* pg_lines: list of polygon information, each entry contains the index of the vertices that make up a polygon. The entries are list of integers.

###Render and Offset
Then the program calls render to process and draw the polygons.
To retain viewable scale for any mesh, the function 'poliScaleTranslate' is used. It returns a scale and a translate 
offset matrix. The scale matrix scales the mesh uniformly along all axis by the maximum length of the mesh (x, y,or z).
The translate offset is to ensure the mesh is centered in the scene; it translates x by -(xMax+xMin)/2, y by -(yMax+yMin)/2,
and z by -(zMax+zMin)/2
###User Interactions
The user can interact with the drawn mesh in various ways. All the user inputs are handled by either window or html 
element listeners. The effect of the inputs (i.e. rotate,  translate) are processed in the render call.
####Rotate
User may press the R key to toggle on and off constant rotation along the X axis. This rotate matrix is initialized in 
the render call and apply into the current view (CT) matrix, which is then parsed to the vertex shader and multiplied with the all the
mesh vertices
####Translate
User may press the six keys specified in 'User Commands' to translate the mesh along a specific axis. The user translation
matrix, like the rotate and offset matrices, is initialized in the render call and multiplied into the CT matrix.
####Pulse
To toggle breathing (pulsing), user may press the B key. Once enabled, every time the render function is called. It translates
all the triangles that make up the mesh along their individual surface normals. The amount it translates changes with every
call on render. This amount varies through -1 to 1 and is process through sinusoid to give the effect of wave-like breathing.
####Drag to Rotate
The user can rotate the mesh by drag the mouse over the canvas. The mouse event is processed to get the current cursor
location and the last cursor location. Those information are used in creating the rotate matrix in render and later multiplied
into the CT matrix.
####Drawing Surface Normal
If display normal is toggled on, in addition to pushing the mesh vertices to the GPU buffer, we push an additional
three points for every triangle. Those three points, when drawn as a line_loop, will be the surface normal for
each triangle in the mesh. The three points are:
* the center of the triangle x 2 
* the surface normal vector of the triangle, normalized
Because we draw every three points as a line loop in the draw call. To make the 
surface normal line complete, we have to include one extra point; in this case, we draw the center twice. When the three
points are drawn, it will appear as a straight line.
Moreover, to make the surface normal start at the center of each triangle and of reasonable length. The program:
* translates the normalized surface normal point to the the centroid of each triangle.
* scales the normalized surface normal point by the inverse of the model scale vector, then scales by the pre-defined 
length of the normal line (=0.1). In doing so, we ensure that the surface normal for different mesh will all have a 
consistent length.
It is worth noting that the drawn normals does not interact with the pulsing. [this is a feature!]
####Shearing
In addition to the rotate, scale and translate matrix. Render process an addition Shear Matrix, defined as follows:

               1,   Syx,  Szx,  0,
               Sxy,     1,  Szy,  0,
               Sxz,   Syz,   1,   0,
                 0,     0,   0,   1  
                 
 Where the S-headed variables are the amount of shearing along a specified axis in the given direction (i.e. Syz is the amount
 of shear along the y-to-z axis). This shear matrix gets those amounts of shearing from the Shear Sliders. The shear
 matrix is then applied into the CT matrix along with all other model transformation matrices.