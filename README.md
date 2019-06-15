# Polibook
This program implements WebGL in a 2D polibook .


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

###Render
Then the program calls render to process and draw the polygons.

###User Integrations
The user can interact with the drawn mesh in various ways. All the user inputs are handled by either window or html 
element listeners. The effect of the inputs (i.e. rotate,  translate) are processed in the render call.
####Rotate
####Translate
####Pulse
####Drag to Rotate
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