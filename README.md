# Graidients
##### https://magnogen.net/Graidients
## Generate Gradients and Patterns using Neural Networks

This is the source code for a section of my website.
You're welcome to snoop around to see how it works, maybe even make a pull request!
(I've been wanting to add an interesting UI!)

### How it works
Refresh the page to regenerate a random Neural Network and start drawing.
It works by feeding the X and Y coordinate into the neural network, and using the three outputs for the red, green and blue value at that pixel.
Different kinds of Networks produce different aesthetics.

### Plans for the future
Mostly UI stuff, you don't have any control over things otherwise.
- [x] A way to redraw the image (click it? a keybind?) 
  
  Click the image, or press the `Enter` Key
- [ ] Network customisation
  - [ ] Number of hidden layers, and nodes per layer should be changable
  - [ ] A way to change the inputs, like adding a Random value for a dithery effect
  - idk stuff like that
- [x] Rendering the image at custom resolutions.
