# three.bas
THREE.JS Buffer Animation System

--Work in Progress--

The casual way of doing animations in THREE.js is updating transfomation matrices on the CPU, and sending that data to the GPU.
However, if you have to update many objects, sending all that data becomes a bottleneck, and things slow down.

The hardcore way is to calculate the transformation on the GPU, based on vertex attributes and material uniforms.
This approach is less flexible, and more difficult to manage.
But the performance gain is huge.

This library is an attempt to streamline this approach.
