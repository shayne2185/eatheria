const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
const menu=document.getElementById("menu");
const startBtn=document.getElementById("startBtn");

let COLS=5,ROWS=7,SIZE;
let grid=[],startTouch=null;

const types=["leaf","stone","fire","water","air"];
const colors={
leaf:"#6bbf7a",
stone:"#555",
fire:"#e07a5f",
water:"#5fa8d3",
air:"#ffffff"
};

startBtn.onclick=start;

function start(){
menu.style.display="none";
canvas.style.display="block";
resize();
init();
loop();
}

function resize(){
canvas.width=innerWidth;
canvas.height=innerHeight;
SIZE=Math.min(canvas.width/COLS,canvas.height/(ROWS+1));
}
addEventListener("resize",resize);

function init(){
grid=[];
for(let r=0;r<ROWS;r++){
let row=[];
for(let c=0;c<COLS;c++){
row.push(types[Math.random()*5|0]);
}
grid.push(row);
}
}

function loop(){
ctx.clearRect(0,0,canvas.width,canvas.height);
draw();
requestAnimationFrame(loop);
}

function draw(){
for(let r=0;r<ROWS;r++){
for(let c=0;c<COLS;c++){
let t=grid[r][c];
if(!t)continue;
let x=c*SIZE+SIZE/2;
let y=canvas.height-(r+1)*SIZE;
ctx.beginPath();
ctx.arc(x,y,SIZE*0.35,0,Math.PI*2);
ctx.fillStyle=colors[t];
ctx.fill();
}
}
}

// SWIPE (stable on iOS home screen)
canvas.addEventListener("pointerdown",e=>{
startTouch={x:e.clientX,y:e.clientY};
});

canvas.addEventListener("pointerup",e=>{
if(!startTouch)return;
let dx=e.clientX-startTouch.x;
let dy=e.clientY-startTouch.y;
if(Math.hypot(dx,dy)<20)return;

let c=Math.floor(startTouch.x/SIZE);
let r=Math.floor((canvas.height-startTouch.y)/SIZE);
let tc=c,tr=r;

if(Math.abs(dx)>Math.abs(dy)) tc+=dx>0?1:-1;
else tr+=dy>0?-1:1;

if(grid[r]&&grid[tr]&&grid[r][c]&&grid[tr][tc]){
[grid[r][c],grid[tr][tc]]=[grid[tr][tc],grid[r][c]];
match();
}
startTouch=null;
});

function match(){
let rem=[];
for(let r=0;r<ROWS;r++)for(let c=0;c<COLS-2;c++){
let t=grid[r][c];
if(t&&t==grid[r][c+1]&&t==grid[r][c+2])
rem.push([r,c],[r,c+1],[r,c+2]);
}
for(let c=0;c<COLS;c++)for(let r=0;r<ROWS-2;r++){
let t=grid[r][c];
if(t&&t==grid[r+1][c]&&t==grid[r+2][c])
rem.push([r,c],[r+1,c],[r+2,c]);
}
if(rem.length){
rem.forEach(p=>grid[p[0]][p[1]]=null);
setTimeout(refill,200);
}
}

function refill(){
for(let c=0;c<COLS;c++){
let s=[];
for(let r=0;r<ROWS;r++)if(grid[r][c])s.push(grid[r][c]);
while(s.length<ROWS)s.unshift(types[Math.random()*5|0]);
for(let r=0;r<ROWS;r++)grid[r][c]=s[r];
}
}
