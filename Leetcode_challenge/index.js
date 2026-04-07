let w, h;
let x = 0, y = 0;
let dir = 0;
let per;

let moving = false;

function initRobot() {
  w = parseInt(document.getElementById("width").value);
  h = parseInt(document.getElementById("height").value);

  x = 0;
  y = 0;
  dir = 0;

  per = 2 * (w + h) - 4;

  createGrid();
  updateUI();
}

function createGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${w}, 50px)`;

  for (let j = h - 1; j >= 0; j--) {
    for (let i = 0; i < w; i++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      if (i === 0 || j === 0 || i === w - 1 || j === h - 1) {
        cell.classList.add("boundary");
      }

      cell.id = `cell-${i}-${j}`;
      grid.appendChild(cell);
    }
  }
}

async function moveRobot() {
  if (moving) return;
  moving = true;

  let num = parseInt(document.getElementById("steps").value);
  num %= per;

  if (num === 0 && x === 0 && y === 0) {
    dir = 3;
    updateUI();
    moving = false;
    return;
  }

  while (num > 0) {
    await moveOneStep();
    num--;
  }

  moving = false;
}

function moveOneStep() {
  return new Promise(resolve => {
    setTimeout(() => {

      if (dir === 0) {
        if (x < w - 1) x++;
        else dir = 1;
      }
      else if (dir === 1) {
        if (y < h - 1) y++;
        else dir = 2;
      }
      else if (dir === 2) {
        if (x > 0) x--;
        else dir = 3;
      }
      else {
        if (y > 0) y--;
        else dir = 0;
      }

      updateUI();
      resolve();

    }, 300); // animation speed
  });
}

function updateUI() {
  document.querySelectorAll(".cell").forEach(c => {
    c.classList.remove("robot");
    c.innerHTML = "";
  });

  const cell = document.getElementById(`cell-${x}-${y}`);
  if (cell) {
    cell.classList.add("robot");
    cell.innerHTML = "🤖";
  }

  const directions = ["East", "North", "West", "South"];

  document.getElementById("status").innerText =
    `Position: (${x}, ${y}) | Direction: ${directions[dir]}`;
}