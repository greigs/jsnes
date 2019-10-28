var SCREEN_WIDTH = 256;
var SCREEN_HEIGHT = 240;
var FRAMEBUFFER_SIZE = SCREEN_WIDTH*SCREEN_HEIGHT;

var noscrollWidth = 512;//2816; //767;
var noscrollSplit = 64;
var noscrollFullWidth = 2816;
var noscrollOffset = 0;	

var canvas_ctx, image;
var framebuffer_u8, framebuffer_u32;
var scrollOffsetX = 0;
var screenOffset = 0;
var AUDIO_BUFFERING = 512;
var SAMPLE_COUNT = 4*1024;
var SAMPLE_MASK = SAMPLE_COUNT - 1;
var audio_samples_L = new Float32Array(SAMPLE_COUNT);
var audio_samples_R = new Float32Array(SAMPLE_COUNT);
var audio_write_cursor = 0, audio_read_cursor = 0;

var nes = new jsnes.NES({
	onFrame: function(framebuffer_24){
		for(var i = 0; i < FRAMEBUFFER_SIZE; i++) framebuffer_u32[i] = 0xFF000000 | framebuffer_24[i];
	},
	onAudioSample: function(l, r){
		audio_samples_L[audio_write_cursor] = l;
		audio_samples_R[audio_write_cursor] = r;
		audio_write_cursor = (audio_write_cursor + 1) & SAMPLE_MASK;
	},
});

function onAnimationFrame(){
	window.requestAnimationFrame(onAnimationFrame);
	
	image.data.set(framebuffer_u8);
	//canvas_ctx.putImageData(image, 0, 0);

	// ctx.putImageData(imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
	//cube_canvas_ctx.putImageData(image, 0,  -140, 0, 140, 256, 64);

	// void ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
	//var offset1 = noscrollWidth - (noscrollWidth + (scrollOffsetX + ((screenOffset - 1) * 256)));
	var offset2 = scrollOffsetX + ((screenOffset - 1) * 256)
	var characterPos = offset2 + ((SCREEN_WIDTH - 16) / 2);
	if (characterPos < 0){
		characterPos = 20;
	}
	var startWindow = characterPos - 128;
	var endWindow = characterPos + 128
	
	noscroll_canvas_ctx.drawImage(img,0,48);
	var offset3 = (offset2 + SCREEN_WIDTH - 16) - noscrollWidth;
	noscroll_canvas_ctx.putImageData(image, offset2, 0, 8,0, SCREEN_WIDTH - 16, SCREEN_HEIGHT);
	var offset4 = scrollOffsetX - ((screenOffset - 1) * 256);
	if (offset2 + SCREEN_WIDTH - 16 > noscrollWidth && offset3 < SCREEN_WIDTH  ){
		console.log(offset4)
		noscroll_canvas_ctx.putImageData(image,offset4, 0, SCREEN_WIDTH - offset3 - 8, 0, offset3, SCREEN_HEIGHT);
	}


	noscroll_canvas_ctx0.drawImage(img,0,48);
	noscroll_canvas_ctx0.putImageData(image, offset2, 0, 8,0, SCREEN_WIDTH - 16, SCREEN_HEIGHT);

	noscroll_canvas_ctx1.drawImage(img,0,48);
	noscroll_canvas_ctx1.putImageData(image, offset2, 0, 8,0, SCREEN_WIDTH - 16, SCREEN_HEIGHT);
	if (offset2 + SCREEN_WIDTH - 16 > noscrollWidth){
		
		noscroll_canvas_ctx0.putImageData(image,offset4, 0, SCREEN_WIDTH - offset3 - 8, 0, offset3, SCREEN_HEIGHT);
		noscroll_canvas_ctx1.putImageData(image,offset4, 0, SCREEN_WIDTH - offset3 - 8, 0, offset3, SCREEN_HEIGHT);
	}

	//console.log(offset)
	//cube_canvas_ctx.putImageData(image, 64, 0, 64,  0, 64, 64);
	nes.frame();
}

function audio_remain(){
	return (audio_write_cursor - audio_read_cursor) & SAMPLE_MASK;
}

function audio_callback(event){
	var dst = event.outputBuffer;
	var len = dst.length;
	
	// Attempt to avoid buffer underruns.
	if(audio_remain() < AUDIO_BUFFERING) nes.frame();
	
	var dst_l = dst.getChannelData(0);
	var dst_r = dst.getChannelData(1);
	for(var i = 0; i < len; i++){
		var src_idx = (audio_read_cursor + i) & SAMPLE_MASK;
		dst_l[i] = audio_samples_L[src_idx];
		dst_r[i] = audio_samples_R[src_idx];
	}
	
	audio_read_cursor = (audio_read_cursor + len) & SAMPLE_MASK;
}

function keyboard(callback, event){
	var player = 1;
	switch(event.keyCode){
		case 38: // UP
			callback(player, jsnes.Controller.BUTTON_UP); break;
		case 40: // Down
			callback(player, jsnes.Controller.BUTTON_DOWN); break;
		case 37: // Left
			callback(player, jsnes.Controller.BUTTON_LEFT); break;
		case 39: // Right
			callback(player, jsnes.Controller.BUTTON_RIGHT); break;
		case 65: // 'a' - qwerty, dvorak
		case 81: // 'q' - azerty
			callback(player, jsnes.Controller.BUTTON_A); break;
		case 83: // 's' - qwerty, azerty
		case 79: // 'o' - dvorak
			callback(player, jsnes.Controller.BUTTON_B); break;
		case 9: // Tab
			callback(player, jsnes.Controller.BUTTON_SELECT); break;
		case 13: // Return
			callback(player, jsnes.Controller.BUTTON_START); break;
		default: break;
	}
}

function nes_init(canvas_id){
	var canvas = document.getElementById(canvas_id);
	canvas_ctx = canvas.getContext("2d");
	image = canvas_ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
	
	canvas_ctx.fillStyle = "black";
	canvas_ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

	
	var canvas_cube = document.getElementById('cube-canvas');
	cube_canvas_ctx = canvas_cube.getContext("2d");
	image_cube = cube_canvas_ctx.getImageData(0, 0, 265, 64);
	
	cube_canvas_ctx.fillStyle = "black";
	cube_canvas_ctx.fillRect(0, 0, 265, 64);

	var canvas_noscroll = document.getElementById('noscroll-canvas');
	noscroll_canvas_ctx = canvas_noscroll.getContext("2d");
	img = new Image() 
	img.src = "../map1.png" 
	

	var canvas_noscroll0 = document.getElementById('noscroll-canvas0');
	noscroll_canvas_ctx0 = canvas_noscroll0.getContext("2d");
	var canvas_noscroll1 = document.getElementById('noscroll-canvas1');
	noscroll_canvas_ctx1 = canvas_noscroll1.getContext("2d");
	


	// Allocate framebuffer array.
	var buffer = new ArrayBuffer(image.data.length);
	framebuffer_u8 = new Uint8ClampedArray(buffer);
	framebuffer_u32 = new Uint32Array(buffer);
	
	// Setup audio.
	var audio_ctx = new window.AudioContext();
	var script_processor = audio_ctx.createScriptProcessor(AUDIO_BUFFERING, 0, 2);
	script_processor.onaudioprocess = audio_callback;
	script_processor.connect(audio_ctx.destination);
}

function nes_boot(rom_data){
	nes.loadROM(rom_data);
	window.requestAnimationFrame(onAnimationFrame);
}

function nes_load_data(canvas_id, rom_data){
	nes_init(canvas_id);
	nes_boot(rom_data);
}

function nes_load_url(canvas_id, path){
	nes_init(canvas_id);
	
	var req = new XMLHttpRequest();
	req.open("GET", path);
	req.overrideMimeType("text/plain; charset=x-user-defined");
	req.onerror = () => console.log(`Error loading ${path}: ${req.statusText}`);
	
	req.onload = function() {
		if (this.status === 200) {
		nes_boot(this.responseText);
		nes.loadSave()
		} else if (this.status === 0) {
			// Aborted, so ignore error
		} else {
			req.onerror();
		}
	};
	
	req.send();
}

document.addEventListener('keydown', (event) => {keyboard(nes.buttonDown, event)});
document.addEventListener('keyup', (event) => {keyboard(nes.buttonUp, event)});
