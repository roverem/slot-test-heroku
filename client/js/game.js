import { SOCKET } from "../main.js";
import { Reel } from "./reel.js";

export class Game{
	constructor(app){
		this.app = app;
		
		this.spritesheet = null;
		this.char_spritesheet = null;
		this.enemy_spritesheet = null;
		
		this.assets = {};
		this.state = {
			playing: "waiting",
			server_data_ready : false,
			last_spin_data: null
		}
		
		this.server_data = {};
	}
	
	preload_handler(loader, resource){
		console.log("preloader", this.assets)
		if (!this.assets.preload) {
			
			this.assets.preload = new PIXI.Container();
			
			this.assets.preload_button = new PIXI.Graphics()
				.lineStyle(8,0x66CCFF, 1)
				.beginFill(0xFFFF00, 0.8)
				.drawRect(0, 0, 1600, 1200)
				.endFill();
			
			this.assets.preload_text = new PIXI.Text("Cargando" + loader.progress.toString() + "%", {fontFamily: 'Arial', fontSize: 34, fill: 0xffffff, align: 'center'});
			
			this.assets.preload.addChild(this.assets.preload_button);
			this.assets.preload.addChild(this.assets.preload_text);
			
			this.addToStage(this.assets.preload);
			
		}else{
			this.assets.preload_text.text = "Cargando " + loader.progress.toString() + "%";
			
		}
		
		console.log("loading", resource.url);
		
		console.log("progress:", loader.progress, "%")
	}
	
	setup(){
		
		document.body.appendChild(this.app.view);
		
		PIXI.Loader.shared
			.add("assets/spritesheet.json")
			.on("progress", this.preload_handler.bind(this))
			.load(this.setup_start.bind(this))
			
		
		SOCKET.emit("user_request_initial_data");
			
		SOCKET.on('sending_reels', this.receive_reels.bind(this) );
		SOCKET.on('sending_paylines', this.receive_paylines.bind(this) );
		SOCKET.on('sending_paytable', this.receive_paytable.bind(this) );
		
		//SOCKET.on("confirm_play", this.confirm_play.bind(this));
		SOCKET.on( "spin", this.spin.bind(this) );
	}
	
	setup_start(){
		
		this.assets.preload_text.text = "Cargado 100% \n\nPRESIONE PARA CONTINUAR";
		
		this.assets.preload.interactive = true;
		this.assets.preload.buttonMode = true;
		this.assets.preload.addListener('pointerdown', ()=>{
			console.log("START GAME");
			this.app.stage.removeChild(this.assets.preload);
			this.setup_assets();
		});
	}
	
	setup_assets(){
		
		//BOARD
		this.assets.board = new PIXI.Container();
		let board_rect_frame = new PIXI.Graphics()
			.lineStyle(8,0x66CCFF, 1)
			.beginFill(0xFF0000, 0)
			.drawRect(0, 240, 580, 355)
			.endFill();
		board_rect_frame.name = "board_frame";
			
		let board_rect = new PIXI.Graphics()
			.beginFill(0xFF0000)
			.drawRect(0, 240, 580, 355)
			.endFill();
		board_rect.name = "board_rect";
		
		
		this.assets.board.addChild(board_rect);
		this.assets.board.addChild(board_rect_frame);
		this.assets.board.x = 200;
		this.assets.board.y = 100;
		
		let mask = new PIXI.Graphics()
			.beginFill(0xFF0000)
			.drawRect(this.assets.board.x, 340, board_rect.width, board_rect.height)
			.endFill();
		this.addToStage(mask);
		this.assets.board.mask = mask;
		
		this.addToStage(this.assets.board);
		
		//REEL ITEM ASSETS
		this.spritesheet = PIXI.Loader.shared.resources["assets/spritesheet.json"].spritesheet;
		
		
		//SPIN BUTTON
		let spin_button = new PIXI.Container();
		spin_button.x = 650;
		spin_button.y = 250;
		
		
		spin_button.interactive = true;
		spin_button.buttonMode = true;
		spin_button.addListener('pointerdown', ()=>{
			console.log("SPIN!");
			if (this.state.playing == "waiting"){
				SOCKET.emit("request_spin");
			}
			
		});
		
		let spin_button_frame = new PIXI.Graphics()
			.beginFill(0xFF0000)
			.drawRect(0, 0, 200, 100)
			.endFill();
		let spin_button_text = new PIXI.Text("SPIN", {fontFamily: 'Arial', fontSize: 34, fill: 0xffffff, align: 'center'});
		spin_button_text.x = spin_button_frame.width / 2 - spin_button_text.width / 2;
		spin_button_text.y = spin_button_frame.height / 2 - spin_button_text.height / 2;
		spin_button.addChild(spin_button_frame);
		spin_button.addChild(spin_button_text);
		
		spin_button.pivot.x = spin_button.width / 2;
		spin_button.pivot.y = spin_button.height / 2;
		
		this.assets.spin_button = spin_button;
		
		
		this.addToStage(spin_button);
		
		//PRIZE WIN DISPLAY
		
		let prize_display = new PIXI.Container();
		prize_display.x = 200;
		prize_display.y = 200;
		let prize_frame = new PIXI.Graphics()
			.beginFill(0xFF0000)
			.drawRect(0, 0, 200, 100)
			.endFill();
			
		prize_display.addChild(prize_frame);
		
		let prize_text = new PIXI.Text("$0", {fontFamily: 'Arial', fontSize: 34, fill: 0xffffff, align: 'center'})
		prize_text.x = prize_frame.width / 2 - prize_text.width / 2;
		prize_text.y = prize_frame.height / 2 - prize_text.height / 2;
		prize_display.addChild(prize_text);
		
		this.assets.prize_text = prize_text;
		
		this.addToStage(prize_display);
		
		this.state.assets_ready = true;
		this.setup_game();
	}
	
	receive_reels(data){
		this.server_data.reels = data;
		
		this.check_all_data_received();
	}
	
	receive_paylines(data){
		this.server_data.paylines = data;
		
		this.check_all_data_received();
	}
	
	receive_paytable(data){
		this.server_data.paytable = data;
		
		this.check_all_data_received();
	}
	
	check_all_data_received(){
		if (this.server_data.paylines && this.server_data.reels && this.server_data.paytable){
			
			this.state.server_data_ready = true;
			this.setup_game();
		}
	}
	
	setup_game(){
		if (!this.state.server_data_ready)
			return;
		
		if (!this.state.assets_ready)
			return;
		
		this.build_slots();
	}
	
	build_slots(){
		console.log("Building slots", this.server_data )
		//COLUMNS - ROLLS
		
		this.assets.reels = [];
		
		for (let i=0; i < this.server_data.reels.length; i++){
			let reel = new Reel(this.server_data.reels[i], i + 1, this.spritesheet);
			this.assets.reels.push(reel);
			reel.asset.x = 50 + i * reel.asset.width + 100 * i;
			reel.asset.y = 500;
			this.assets.board.addChild(reel.asset);
		}
		
		this.assets.board.addChild( this.assets.board.getChildByName("board_frame") );
		
		this.app.ticker.add(delta => this.update(delta));
	}
	
	
	addToStage(child){
		this.app.stage.addChild(child);
	}
	
	update(delta){
		
		TWEEN.update();
		
		for (let r=0; r < this.assets.reels.length; r++){
			this.assets.reels[r].update(delta);
		}
		
		if (this.state.playing == "playing"){
			this.check_all_columns_stopped();
		}
	}
	
	spin(data){
		
		this.assets.prize_text.text = "$0";
		
		for (let p = 0; p < this.assets.reels.length; p++)
		{
			let line = this.app.stage.getChildByName("payline_" + p.toString() );
			if (line){
				this.app.stage.removeChild(line);
			}
		}
		
		
		let tween_expand = new TWEEN.Tween(this.assets.spin_button.scale)
			.to({x:1.2, y:1.1}, 200)
			.easing(TWEEN.Easing.Quadratic.InOut);
		
		let tween_contract = new TWEEN.Tween(this.assets.spin_button.scale)
			.to({x:1, y:1}, 200)
			.easing(TWEEN.Easing.Quadratic.InOut);
			
		tween_expand.chain(tween_contract);
		tween_expand.start();
		
		this.state.last_spin_data = data;
		for ( let i = 0; i < this.assets.reels.length; i++ ){
			this.assets.reels[i].is_spinning = true;
			this.assets.reels[i].set_stop(data.stopPoints[i]);
		}
		
		this.state.playing = "playing";
	}
	
	deliver_pay(){
		console.log(this.state.last_spin_data);
		
		let prizes = this.state.last_spin_data.prizes;
		let stop_points = this.state.last_spin_data.stopPoints;
		
		if (prizes){
			
			this.assets.prize_text.text = "$" + this.state.last_spin_data.winnings;
			
			for (let i=0; i < prizes.length; i++){
				let prize = prizes[i];
				console.log(prize);
				
				let payline = this.server_data.paylines[prize.lineId];
				let line = new PIXI.Graphics()
					.lineStyle(8,0x000000, 1);
				line.name = "payline_" + i.toString();
				this.addToStage(line);
				
				for ( let p=0; p < payline.length; p++){
					let pos_in_reel =  Math.ceil( (payline[p]+1) / this.assets.reels.length) - 1;
					
					let item = this.assets.reels[p].getPaylinePosition(pos_in_reel, stop_points[p]);

					if (line.first_draw == null){
						line.first_draw = true;
						line.moveTo(item.x,item.y);
					}else{
						line.lineTo(item.x, item.y);
					}
				}
			}
		}
	}
	
	reset_game_state(){
		console.log("resetting");
		if (this.state.playing == "playing"){
			this.state.playing = "waiting";
		}
	}
	
	check_all_columns_stopped(){
		let all_stopped = true;
		for (let i= 0; i < this.assets.reels.length;i++){
			let reel = this.assets.reels[i];
			if (reel.is_spinning){
				all_stopped = false;
			}
		}
		
		if (all_stopped){
			this.deliver_pay();
			this.reset_game_state();
		}
	}

}