export class Reel{
	constructor(data, id, item_spritesheet){
		this.data = data; //["b", "b", "c", "b", "a", "d", "e", "d", "a", "a", "e", "b", "a", "d", "c", "c", "e", "e", "c", "d"]
		this.id = "column_" + id.toString();
		this.item_spritesheet = item_spritesheet;
		
		this.asset = new PIXI.Container();
		
		this.velocity = 50;
		this.min_velocity = 18;
		
		this.is_spinning = false;
		this.is_ending = false;
		
		this.COLLISION_TOP = -250;
		this.COLLISION_BOTTOM = -150;
		this.BOARD_BOTTOM = 80;
		
		this.SPACING = 20;
		
		this.spin_time = 0;
		this.MIN_SPIN_TIME = 3 * 60;
		
		/*let hit_area = new PIXI.Graphics()
			.beginFill(0x006600)
			.drawRect(0, this.COLLISION_TOP, 100, (this.COLLISION_BOTTOM - this.COLLISION_TOP) )
			.endFill();
		this.asset.addChild(hit_area);*/
		
		this.stopping_point = null;
		
		this.items = [];
		this.asset_config = {
			a: "Food-1.png",
			b: "Food-2.png",
			c: "Food-3.png",
			d: "Food-4.png",
			e: "Food-5.png"
		}
		
		this.build_items();
		//this.setup_tween();
	}
	
	set_stop(point){
		this.stopping_point = point;
	}
	
	build_items(){
		for (let i= 0; i < this.data.length; i++){
			let asset_name = this.asset_config[ this.data[i] ];
			let item = new PIXI.Sprite( this.item_spritesheet.textures[asset_name] );
			item.scale.x = 6;
			item.scale.y = 6;
			item.y = this.COLLISION_TOP + i * this.SPACING * 6;
			item.id = i.toString();
			item.original_y = item.y;
			this.items.push(item);
			this.asset.addChild(item);
			
			/*item.addChild( new PIXI.Text(item.id, {fontFamily: 'Arial', fontSize: 12, fill: 0xffffff}) );
			let name = new PIXI.Text(this.data[i], {fontFamily: 'Arial', fontSize: 12, fill: 0xffffff});
			item.addChild( name );
			name.x = 12;*/
		}
		
		this.topmost_item = 0;
		for (let i=this.items.length-1; i >= 0; i--){
			this.check_and_reposition(i);
		}
		
		
	}
	
	getPaylinePosition(pos_in_reel, stop_point){
		console.log(stop_point, pos_in_reel);
		let real_pos = stop_point + pos_in_reel;
		if (real_pos >= this.items.length){
			real_pos -= this.items.length;
		}
		console.log(real_pos);
		let x_pos = this.asset.parent.x + this.asset.x + this.items[real_pos].width / 2;
		let y_pos = this.asset.parent.y + this.asset.y + this.items[real_pos].y + this.items[real_pos].height / 2;
		return new PIXI.Point(x_pos, y_pos);
	}
	
	setup_tween() {
		const tween = new TWEEN.Tween(this.asset)
			.to({ y: this.asset.y + 900 }, 3000) 
			.easing(TWEEN.Easing.Quadratic.InOut)
			//.onUpdate( (object)=>{ console.log(object.y) })
			.start();
	}
	
	update(delta){
		
		if (!this.is_spinning) return;
		
		this.spin_time += delta;
		
		//for (let i=0; i < this.items.length; i++){
		if (!this.is_ending){
			this.spinning(delta)
		}else{
			this.ending(delta);
		}
	}
	
	spinning(delta)
	{
		for (let i=this.items.length-1; i >= 0; i--){
			
			if (this.stopping_point != null && 
				this.spin_time >= this.MIN_SPIN_TIME &&
				this.is_between_collision_spot(this.items[this.stopping_point]))
			{
				this.is_ending = true
				this.spin_time = 0;
				return;
			}
			
			//this.items[i].y += this.velocity * delta;
			this.items[i].y += this.get_current_velocity() * delta;
			this.check_and_reposition(i)
		}
	}
	
	get_current_velocity(){
		let rate = 1 - this.spin_time / this.MIN_SPIN_TIME;
		if ( this.velocity * rate >= this.min_velocity){
			return this.velocity * rate;
		}else{
			return this.min_velocity;
		}
	}
	
	ending(delta)
	{
		if ( this.items[this.stopping_point].y < this.COLLISION_TOP ){
			for (let i=0; i < this.items.length; i++){
				
				if ( Math.abs( this.items[this.stopping_point].y - this.COLLISION_TOP) < 1 ){
					this.items[i].y += Math.abs( this.items[this.stopping_point].y - this.COLLISION_TOP );
				}else{
					this.items[i].y++;
				}
			}
		} else if (this.items[this.stopping_point].y > this.COLLISION_TOP){
			for (let i=0; i < this.items.length; i++){
				if ( Math.abs( this.items[this.stopping_point].y - this.COLLISION_TOP) < 1 ){
					this.items[i].y -= Math.abs( this.items[this.stopping_point].y - this.COLLISION_TOP);
				}else{
					this.items[i].y--;
				}
			}
		} else {
			this.is_spinning = false;
			this.is_ending = false;
		}
		
		
	}
	
	check_and_reposition(i){
		if (this.items[i].y > this.BOARD_BOTTOM){
			this.items[i].y = this.items[this.topmost_item].y - (this.items[i].height + this.SPACING);
			this.topmost_item = i;
		}
	}
	
	is_between_collision_spot(item)
	{
		let is_below_top=false;
		let is_above_bottom=false;
		
		if (item.y > this.COLLISION_TOP)
			is_below_top = true;
		
		if (item.y < this.COLLISION_BOTTOM)
			is_above_bottom = true;
		
		return is_above_bottom && is_below_top;
	}
}