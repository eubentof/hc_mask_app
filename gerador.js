const canvas = document.getElementById("mask");
const filters = document.getElementById("filters");
const btnClose = document.getElementById('close');
const popup = document.getElementById('popup');
const canvasWidth = document.getElementById('canvas-width');

// canvas.addEventListener("mousemove", e => {
//   if (this.active) {
//     var rect = canvas.getBoundingClientRect();
//     var x = e.clientX - rect.left;
//     var y = e.clientY - rect.top;
//     x = Math.floor(this.width * x / canvas.clientWidth);
//     y = Math.floor(this.height * y / canvas.clientHeight);
//     if (tools[Tool.pen]) {
//       this.draw(x, y)
//     }
//     else if (tools[Tool.eraser]) {
//       this.erase(x, y);
//     }
//   }
// });

function showContent() {
  var filter_template = document.getElementsByTagName("template")[0];
  var filter = filter_template.content.querySelector('div');
  for (let i = 5; i > 0; i--) {
    const item = document.importNode(filter, true);
    item.textContent = `${2 ** i}x${2 ** i}`;
    item.style.width = 2 ** i * 10;
    item.style.height = 2 ** i * 10;
    console.log(item);
    filters.appendChild(item);
  }
}

btnClose.addEventListener('click', () => {
  const width = Number(canvasWidth.value);
  popup.classList.add('hide');
  canvas.style.display = 'block';
  showContent()
})

class Canvas {
  constructor(width, height) { }  // initialize all canvas properties

  draw(x, y) { }  // method to draw a pixel on canvas

  erase(x, y) { }  // method to erase a pixel on canvas

  setcolor(color) { }  // method to set the current color

  setmode(i) { }  // method to set the active tool

  save() { }  // method to save pixel art as image

  clear() { }  // method to clear canvas

  addFrame() { }  // method to add current frame to frame list

  deleteFrame(f) { }  // method to delete a specific frame

  loadFrame(f) { }  // method to load a specific frame onto canvas

  renderGIF() { }  // method to render a GIF using frames

  undo() { }  // method to undo a given step

  redo() { }  // method to redo a given step

  addImage() { }  // method to load an image as pixel art
}