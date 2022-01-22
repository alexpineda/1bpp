import React from "react";


function CatmullRom( t, p0, p1, p2, p3 ) {

	const v0 = ( p2 - p0 ) * 0.5;
	const v1 = ( p3 - p1 ) * 0.5;
	const t2 = t * t;
	const t3 = t * t2;
	return ( 2 * p1 - 2 * p2 + v0 + v1 ) * t3 + ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t2 + v0 * t + p1;

}

function getSplineAt( t, points ) {
    const p = ( points.length - 1 ) * t;

    const intPoint = Math.floor( p );
    const weight = p - intPoint;

    const p0 = points[ intPoint === 0 ? intPoint : intPoint - 1 ];
    const p1 = points[ intPoint ];
    const p2 = points[ intPoint > points.length - 2 ? points.length - 1 : intPoint + 1 ];
    const p3 = points[ intPoint > points.length - 3 ? points.length - 1 : intPoint + 2 ];

    return {
        x: CatmullRom( weight, p0.x, p1.x, p2.x, p3.x ),
        y: CatmullRom( weight, p0.y, p1.y, p2.y, p3.y )
    }
}

function DownloadCanvasAsImage() {
  let downloadLink = document.createElement("a");
  downloadLink.setAttribute("download", "1bpp.png");
  canvas.toBlob(function (blob) {
    let url = URL.createObjectURL(blob);
    downloadLink.setAttribute("href", url);
    downloadLink.click();
  });
}

interface XY {
  x: number;
  y: number;
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

const brush = {
  scale: 2,
  interpolate: "linear" as "off" | "linear",
};

const app = {
  scale: 3,
  dims: { w: 160, h: 160 },
  palette: ["white", "black"],
  init: function () {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 160, 160);

    document.getElementById("scale").addEventListener("change", (e) => {
      app.changeScale(parseInt(e.target.value));
    });

    document.getElementById("brush-scale").addEventListener("change", (e) => {
      brush.scale = parseInt(e.target.value);
    });

    document
      .getElementById("brush-scale-preset")
      .addEventListener("change", (e) => {
        brush.scale = parseInt(e.target.value);
      });

    document
      .getElementById("brush-interpolate")
      .addEventListener("change", (e) => {
        brush.interpolate = e.target.value;
      });

    document.getElementById("download-png").addEventListener("click", (e) => {
      e.preventDefault();
      DownloadCanvasAsImage();
    });
  },
  getCellIndex: function (xy: XY) {
    return xy.y * this.dims.w + xy.x;
  },
  drawCell: function ({ x, y }: XY, color: number) {
    ctx.save();
    ctx.fillStyle = this.palette[color];
    ctx.strokeStyle = "transparent";
    ctx.fillRect(x, y, brush.scale, brush.scale);
    ctx.restore();
  },
  drawInterpolated: function (xy: XY, history: XY[], color: number) {
    if (brush.interpolate === "off") {
      this.drawCell(xy, color);
    } else if (brush.interpolate === "linear") {
      ctx.save();
      ctx.strokeStyle = this.palette[color];
      ctx.fillStyle = "transparent";
        ctx.beginPath();
      const idx = history.length - 2;
      ctx.moveTo(history[idx].x, history[idx].y);
      ctx.lineTo(xy.x, xy.y);
      ctx.lineWidth = brush.scale;
      ctx.stroke();
      ctx.restore();
    }
  },
  changeScale: function (scale: number) {
    this.scale = scale;
    canvas.style.width = `${this.dims.w * this.scale}px`;
    canvas.style.height = `${this.dims.h * this.scale}px`;
  },
  toggleFilter: function () {
    ctx.filter = ctx.filter
      ? ""
      : "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxmaWx0ZXIgaWQ9ImZpbHRlciIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj48ZmVDb21wb25lbnRUcmFuc2Zlcj48ZmVGdW5jUiB0eXBlPSJpZGVudGl0eSIvPjxmZUZ1bmNHIHR5cGU9ImlkZW50aXR5Ii8+PGZlRnVuY0IgdHlwZT0iaWRlbnRpdHkiLz48ZmVGdW5jQSB0eXBlPSJkaXNjcmV0ZSIgdGFibGVWYWx1ZXM9IjAgMSIvPjwvZmVDb21wb25lbnRUcmFuc2Zlcj48L2ZpbHRlcj48L3N2Zz4=#filter)";
  },
};
//@ts-ignore
window.app = app;
app.init();

const events = new EventTarget();

enum MouseButton {
  Left,
  Middle,
  Right,
}

const mouse = {
  _start: { x: 0, y: 0 },
  _move: { x: 0, y: 0 },
  history: [],
  _stop: { x: 0, y: 0 },
  isDown: false,
  button: 0 as MouseButton,
  start: function (xy, button: number) {
    this._start = xy;
    this.isDown = true;
    this.button = button;
    console.log(button);
    events.dispatchEvent(new Event("mousestart"));
  },
  move: function (xy) {
    this.history.push(xy);
    this._move = xy;
    events.dispatchEvent(new Event("mousemove"));
  },
  stop: function (xy) {
    if (xy) {
      this._stop = xy;
    }
    this.isDown = false;
    events.dispatchEvent(new Event("mousestop"));
  },
  clearHistory: function () {
    this.history = [];
  },
  calcX: (e) =>
    clamp(
      Math.round(e.offsetX / app.scale - brush.scale / 2),
      0,
      app.dims.w - 1
    ),
  calcY: (e) =>
    clamp(
      Math.round(e.offsetY / app.scale - brush.scale / 2),
      0,
      app.dims.h - 1
    ),
};

const clamp = (x, min, max) => Math.min(Math.max(x, min), max);

canvas.addEventListener(
  "mousedown",
  (e: MouseEvent) => {
    const x = mouse.calcX(e);
    const y = mouse.calcY(e);
    mouse.start({ x, y }, e.button);
  },
  { passive: true }
);

canvas.addEventListener(
  "mousemove",
  (e: MouseEvent) => {
    const x = mouse.calcX(e);
    const y = mouse.calcY(e);
    mouse.move({ x, y });
  },
  { passive: true }
);

canvas.addEventListener(
  "mouseup",
  (e: MouseEvent) => {
    const x = mouse.calcX(e);
    const y = mouse.calcY(e);
    mouse.stop({ x, y });
  },
  { passive: true }
);

events.addEventListener("mousestart", () => {
  const color = mouse.button == MouseButton.Left ? 0 : 1;
  app.drawCell(mouse._start, color);
});

events.addEventListener("mousemove", () => {
  if (mouse.isDown) {
    const color = mouse.button == MouseButton.Left ? 0 : 1;
    app.drawInterpolated(mouse._move, mouse.history, color);
  }
});

events.addEventListener("mousestop", () => {
    mouse.clearHistory();
  });