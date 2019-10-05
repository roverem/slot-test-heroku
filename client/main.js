import { Game } from "./js/game.js";

export let SOCKET = io();

const app = new PIXI.Application({ 
	width: 256,         
	height: 256,        
	antialias: true,    
	transparent: false, 
	resolution: 1,    
	backgroundColor: 0x061639
});

let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}

PIXI.utils.sayHello(type);

app.renderer.autoDensity = true;
app.renderer.resize(512, 512);

app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.resize(window.innerWidth, window.innerHeight);


const game = new Game(app);
window.onload = function() {
	
	game.setup();
}