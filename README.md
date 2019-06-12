# Polibook
This program implements WebGL in a 2D polibook .


## User commands
###B for Pulsing
###R for Rotating

##General
In any mode, press the same mode key again to clear the canvas
```
In file mode, press 'f' to clear the canvas
```

##Limitations
1. The current implementation of the Paint mode draws dots instead of lines. This is due to gl.lineWid() is not supported 
in most browsers. The causes the 'lines' drawn in paint mode to break into dots if the user moves the mouse too quickly.
2. Because WebGL cannot process points with different size in the same canvas. Paint mode's brush size will affect all 
points, though the information about points with different size is kept in PaintPointsDict and PaintColorsDict.
