const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
const menu=document.getElementById("menu");
document.getElementById("startBtn").onclick=start;

let COLS=5,ROWS=7,SIZE,grid=[],sel=null;
const types=["leaf","stone","fire","water","air"];
const col={leaf:"#6bbf7a",stone:"#555",fire:"#e07a5f",water:"#5fa8d3",air:"#eee"};

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
for(let c=0;c<COLS;c++)row.push(types[Math.random()*5|0]);
grid.push(row);
}
}

function loop(){
ctx.clearRect(0,0,canvas.width,canvas.height);
draw();
requestAnimationFrame(loop);
}

function draw(){
for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
let t=grid[r][c]; if(!t)continue;
ctx.beginPath();
ctx.arc(c*SIZE+SIZE/2,canvas.height-(r+1)*SIZE,SIZE*0.35,0,7);
ctx.fillStyle=col[t];
ctx.fill();
}
}

canvas.onpointerdown=e=>{
let r=Math.floor((canvas.height-e.clientY)/SIZE);
let c=Math.floor(e.clientX/SIZE);
if(!grid[r])return;
if(!sel) sel={r,c};
else{
if(Math.abs(sel.r-r)+Math.abs(sel.c-c)==1){
[grid[sel.r][sel.c],grid[r][c]]=[grid[r][c],grid[sel.r][sel.c]];
match();
}
sel=null;
}
};

function match(){
let rem=[];
for(let r=0;r<ROWS;r++)for(let c=0;c<COLS-2;c++){
let t=grid[r][c];
if(t&&t==grid[r][c+1]&&t==grid[r][c+2])
rem.push([r,c],[r,c+1],[r,c+2]);
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
