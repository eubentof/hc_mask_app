const section = document.getElementById("section");
const selectedFilter = document.getElementById("active-filter");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');

const filters = document.getElementById("filters");
const btnClose = document.getElementById('close');
const popup = document.getElementById('popup');

const canvasWidthInput = document.getElementById('canvas-width');
const menuButtons = document.getElementById('menu');

let filterSize = null;
let maskSize = 0;

let mask = [];
let maskFilters = {};
const colorsPerFilterSize = {};

const menuClickActions = {
  'eraser': allowErasing,
  'clear': clearMask,
  'export-txt': exportMask,
  'export-png': exportImage,
  'export-json': exportFilters,
}

function map(number, inMin, inMax, outMin, outMax) {
  return Math.floor((number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);
}

btnClose.addEventListener('click', () => {

  popup.classList.add('hide');
  canvas.style.display = 'block';
  maskSize = Number(canvasWidthInput.value);
  mask = Array.from(new Array(maskSize), () => new Array(maskSize).fill(0));
  section.style.width = `${maskSize * 2}px`
  section.style.height = `${maskSize * 2}px`

  canvas.style.width = `${maskSize * 2}px`
  canvas.width = maskSize * 2;
  canvas.style.height = `${maskSize * 2}px`
  canvas.height = maskSize * 2;
  canvas.style.opacity = 1;

  ctx.beginPath(); //Start path
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, maskSize * 2, maskSize * 2);
  ctx.closePath();
  ctx.stroke();

  menuButtons.style.display = 'flex';
  const children = menuButtons.children;
  for (var i = 0; i < children.length; i++) {
    const child = children[i];
    child.addEventListener('click', menuClickActions[child.id]);
  }

  getFilters()
})

function getFilters() {
  var filter_template = document.getElementsByTagName("template")[0];
  var filter = filter_template.content.querySelector('div');
  let i = 2;
  while (i < maskSize) {
    colorsPerFilterSize[i] = `hsl(${map(i === 2 ? 0 : i * 3, 0, maskSize, 0, 365)}, 50%, 50%)`
    const item = document.importNode(filter, true);
    item.innerHTML = `
      <div class="filter" style="width: ${i}px; height: ${i}px; background-color:${colorsPerFilterSize[i]};"></div>
      <p style="color: white">${i}x${i}</p>
    `;
    item.dataset.size = i;
    item.addEventListener('click', selectFilter)
    filters.appendChild(item);
    i *= 2;
  }
}

function selectFilter(e) {
  filterSize = Number(e.target.parentNode.dataset.size);
  selectedFilter.style.width = `${filterSize * 2}px`;
  selectedFilter.style.height = `${filterSize * 2}px`;
  selectedFilter.style.opacity = .5;
  selectedFilter.style.backgroundColor = colorsPerFilterSize[filterSize];
}

function findCell(x, y) {
  let sliceSize = maskSize / 2;
  let startX = 0;
  let startY = 0;

  while (sliceSize >= filterSize) {
    // 4th quad
    startX += sliceSize;
    startY += sliceSize;

    // 1st quad
    if (y <= startY) {
      startY -= sliceSize;

      // 2dn quad
      if (x <= startX) {
        startX -= sliceSize;
      }
      // 3rd quad
    } else if (x <= startX) startX -= sliceSize;

    sliceSize /= 2;
  }

  return { startX, startY }
}

function getCoords(e) {
  const x = map(e.layerX, 0, canvas.clientWidth, 0, maskSize);
  const y = map(e.layerY, 0, canvas.clientHeight, 0, maskSize);
  return findCell(x, y)
}

let activeRegion = {};
let isDown = false;
let isValid = false;

// Handles the movement of the filter
canvas.addEventListener('mousemove', mouseMove);
function mouseMove(e) {
  if (filterSize) {
    activeRegion = getCoords(e);
    selectedFilter.style.top = `${activeRegion.startY * 2}px`;
    selectedFilter.style.left = `${activeRegion.startX * 2}px`;
    checkFilter(e);
  }
}

// Handles the action of filling a part of the mask
selectedFilter.addEventListener('mousedown', () => isDown = true);
selectedFilter.addEventListener('mouseup', () => isDown = false);
selectedFilter.addEventListener('click', addFilter);
selectedFilter.addEventListener('mousemove', () => checkFilter);

function checkFilter(e) {
  isValid = false;

  const flippedY = maskSize - activeRegion.startY - filterSize;
  const cellIsNotEmpty = mask[activeRegion.startX][flippedY] > 0;
  const filterIsLower = mask[activeRegion.startX][flippedY] > filterSize;
  selectedFilter.style.cursor = 'crosshair';

  if (cellIsNotEmpty && filterIsLower) {
    selectedFilter.style.cursor = 'not-allowed';
    return
  }

  isValid = true;
  if (isDown) addFilter(e);
}

function addFilter(e) {
  if (!isValid) return

  const shift = e.getModifierState("Shift");
  const ctrl = e.getModifierState("Control");
  const alt = e.getModifierState("Alt");

  if (isErasing) clearFilter()
  else if (ctrl) {
    if (shift) fillAvailableArea();
    if (!shift) clearFilter();
  } else {
    drawFilter();
  }

}

function clearFilter() {
  if (!filterSize) return
  drawFilter({ color: 'white', erase: true })
}

function fillAll() {
  ctx.beginPath(); //Start path
  ctx.fillStyle = colorsPerFilterSize[filterSize];
  ctx.fillRect(0, 0, maskSize * 2, maskSize * 2);
  ctx.closePath();
  ctx.stroke();

  maskFilters[`${0}:${0}`] = maskSize;
}

function fillAvailableArea() {
  for (let startY = (maskSize - filterSize); startY >= 0; startY -= filterSize) {
    let flippedY = maskSize - startY - filterSize;
    for (let startX = 0; startX <= (maskSize - filterSize); startX += filterSize) {
      if (mask[startX][flippedY] === 0) {
        drawFilter({ startX, startY })
      }
    }
  }
}

function drawFilter(params) {

  let { startX, startY, size, color, erase } = params || {};

  if (size === undefined) size = filterSize
  if (startX === undefined) startX = activeRegion.startX;
  if (startY === undefined) startY = activeRegion.startY;
  if (color === undefined) color = colorsPerFilterSize[filterSize];

  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.fillRect(startX * 2, startY * 2, size * 2, size * 2);
  ctx.closePath();
  ctx.stroke();

  /**
   * The canvas element origin is in the top left corner, 
   * this translates it to the bottom left corner,
   * doing a vertical flip.
   */
  startY = maskSize - startY - size;

  setMaskFilter({ startX, startY, size, erase });

  for (let i = startX; i < startX + size; i++) {
    for (let j = startY; j < startY + size; j++) {
      mask[i][j] = erase ? 0 : size;
    }
  }
}

function setMaskFilter(params) {
  let { startX, startY, size, erase } = params || {};

  // console.log(startX, startY);

  /**
   * In case the new filter has a bigger degree, the follow piece of code
   * will check if there are other filters of smaller degrees in the area 
   * that the new filter is filling, if so, it will delete it all.
   */
  Object.keys(maskFilters).forEach(key => {
    const [coordX, coordY] = key.split(':');
    const isContainedInXAxis = startX <= coordX && coordX <= startX + (size - 1);
    const isContainedInYAxis = startY <= coordY && coordY <= startY + (size - 1);
    const isContainedInNewMask = isContainedInXAxis && isContainedInYAxis;
    // const isSmallerFilter = maskFilters[`${coordX}:${coordY}`] < size;
    // if (isContainedInNewMask && isSmallerFilter) delete maskFilters[`${coordX}:${coordY}`];
    if (isContainedInNewMask) delete maskFilters[`${coordX}:${coordY}`];
  })

  if (erase) delete maskFilters[`${startX}:${startY}`]
  else maskFilters[`${startX}:${startY}`] = filterSize;
}


function clearMask() {
  ctx.beginPath(); //Start path
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, maskSize * 2, maskSize * 2);
  ctx.closePath();
  ctx.stroke();
  mask = Array.from(new Array(maskSize), () => new Array(maskSize).fill(0));
  maskFilters = {};
}

function exportMask() {
  let file = new Blob([JSON.stringify(mask)], { type: 'txt' });
  let blobUrl = URL.createObjectURL(file);
  download(blobUrl, 'mask.txt');
}

function exportFilters() {
  let file = new Blob([JSON.stringify(maskFilters)], { type: 'json' });
  let blobUrl = URL.createObjectURL(file);
  download(blobUrl, 'mask.json');
  // console.log(Object.keys(maskFilters).length);
}

function exportImage() {
  var myImage = canvas.toDataURL("image/png");
  download(myImage, 'mask.png')
}

function download(href, file_name) {
  // if (typeof navigator.msSaveBlob == "function")
  // return navigator.msSaveBlob(blob, file_name);

  var saver = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
  var blobURL = saver.href = href, body = document.body;

  saver.download = file_name;

  body.appendChild(saver);
  saver.dispatchEvent(new MouseEvent("click"));
  body.removeChild(saver);
  URL.revokeObjectURL(blobURL);
}

// [x] - Preencher a mascara conforme o filtro.
// [x] - Olhar uma forma mais eficiente de encontrar a posição no grid.
// [x] - Add o botão de reset
// [x] - Add o botão de export
// [] - Ao clicar com o shift, ir preenchendo uma área.
// [] - Add um título para a página
// [] - Add um footer com o "created by Filipe Bento"

let isErasing = false;
function allowErasing(e) {
  let target = e.target;
  if (target.id !== "eraser") target = target.parentElement
  if (isErasing) {
    isErasing = false;
    target.classList.remove('active');
  } else {
    isErasing = true;
    target.classList.add('active');
  }
}