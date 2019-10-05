import express from 'express';
import http from 'http';
import io from 'socket.io';


const APP = express();
const HTTP = http.createServer(APP);
const IO = io(HTTP);

const columns = {
	/*column_1 : [0,1,2,3,4,5,6],
	column_2 : [0,1,5,6,2,3,4],
	column_3 : [6,1,5,3,2,0,4]*/
	
	column_1 : [0,1,2,3,4],
	column_2 : [3,2,1,0,4],
	column_3 : [1,2,0,4,3]
}

const LAYOUT_COLS = 3;
const LAYOUT_ROWS = 3;

const REELS = [
	['b', 'b', 'c', 'b', 'a', 'd', 'e', 'd', 'a', 'a', 'e', 'b', 'a', 'd', 'c', 'c', 'e', 'e', 'c', 'd'],
	['d', 'b', 'e', 'e', 'e', 'b', 'c', 'b', 'a', 'd', 'd', 'e', 'a', 'a', 'b', 'c', 'c', 'd', 'c', 'a'],
	['d', 'c', 'a', 'e', 'c', 'a', 'c', 'b', 'a', 'e', 'd', 'e', 'a', 'b', 'b', 'e', 'b', 'd', 'c', 'd']
];

const PAYLINES = [
	[3, 4, 5],
	[0, 1, 2],
	[6, 7, 8],
	[0, 4, 8],
	[6, 4, 2]
];

const PAYTABLE = [
	{ symbol: "a", prize:50 },
	{ symbol: "b", prize:45 },
	{ symbol: "c", prize:40 },
	{ symbol: "d", prize:35 },
	{ symbol: "e", prize:30}
];

APP.use('/', express.static("client/"));

IO.on('connection', function(socket){
	console.log("user connected");
	
	socket.on('disconnect', function(){
		console.log("user disconnected");
	});
	
	socket.on('user_request_initial_data', ()=> {
		user_requested_data(socket)
	});
	
	socket.on('request_spin', ()=>{
		socket.emit( 'spin', spin() );
	});
	
	/*socket.on('user_starts', ()=>{
		socket.emit("slot_config", columns);
	});
	
	socket.on('user_plays', ()=> { oldSpin(socket)});*/
});

function user_requested_data(socket){
	socket.emit('sending_reels', getReels() );
	
	socket.emit('sending_paylines', getPaylines() );
	
	socket.emit('sending_paytable', getPaytable() );
	
	console.log( spin() );
}

function oldSpin(socket){
	let r1 = Math.floor(Math.random() * columns.column_1.length);
	let r2 = Math.floor(Math.random() * columns.column_2.length)
	let r3 = Math.floor(Math.random() * columns.column_3.length);
	let c1 = "id_slot_" + r1;
	let c2 = "id_slot_" + r2;
	let c3 = "id_slot_" + r3;
	
	let result = "wins";
	console.log(columns.column_1[r1]);
	console.log(columns.column_2[r2]);
	console.log(columns.column_3[r3]);
	
	if (columns.column_1[r1] != columns.column_2[r2]){
		result = "loses";
	}
	
	if (columns.column_1[r1] != columns.column_3[r3]){
		result = "loses";
	}
	
	//let result = columns.column_1[r1] == columns.column_2[r2] == columns.column_3[r3] ? "wins" : "loses";
	
	socket.emit("confirm_play", { 
		play: {
			column_1 : c1,
			column_2 : c2,
			column_3 : c3
		},
		result: result
	});
	
	console.log(c1);
	console.log(c2);
	console.log(c3);
	console.log(result);
}

function getReels()
{
	console.log(REELS);
	return REELS;
}

function getPaylines()
{
	console.log(PAYLINES);
	return PAYLINES;
}

function getPaytable ()
{
	console.log(PAYTABLE);
	return PAYTABLE;
}

function spin()
{
	var stop_points = getRandomStops();
	var prizes = getPrizes(stop_points);
	var result = getResultData(stop_points, prizes);

	return result;
}

function getRandomStops()
{
	var sp = new Array();
	var rnd;
	for(var i = 0; i < LAYOUT_COLS; i++)
	{
		rnd = Math.floor(Math.random() * REELS[i].length);
		sp.push(rnd);
	}

	//return [0, 0, 0];
	return sp;
}

function getPrizes(sp)
{
	var layout = getGridLayout(sp);
	var prizes = [];
	var prize = null;
	for(var i = 0; i < PAYLINES.length; i++)
	{
		prize = getLinePrize(i, layout);
		if(prize != null)
		{
			prizes.push( prize );
		}
	}

	return prizes;
}

function getResultData(sp, prizes)
{
	var result = {};
	result.stopPoints = sp;
	result.layout = getGridLayout(sp);
	result.reelsLayout = [ 
		getReelLayout(0, sp[0]),
		getReelLayout(1, sp[1]),
		getReelLayout(2, sp[2])
	];
	result.prizes = prizes;
	result.winnings = 0;
	for(var i = 0; i < prizes.length; i++)
	{
		result.winnings += prizes[i].winnings;
	}

	return result;
}

function getGridLayout(sp)
{
	var grid = [];
	var reel = null;
	for(var i = 0; i < LAYOUT_COLS; i++)
	{
		reel = getReelLayout(i, sp[i]);
		grid.push(reel);
	}

	var layout = [];
	var col = 0;
	var row = 0;
	var symId = null;
	while(row < LAYOUT_ROWS)
	{
		symId = grid[col][row];
		layout.push(symId);

		col++;
		if(col == LAYOUT_COLS)
		{
			col = 0;
			row++;
		}
	}

	return layout;
}

function getReelLayout(reelId, sp)
{
	var reel = REELS[reelId];
	var index = sp;
	var symId = null;
	var layout = [];

	for(var i = 0; i < LAYOUT_ROWS; i++)
	{
		if(index >= reel.length) { index = 0; }
		var symId = reel[index];
		layout.push( symId );

		index++;
	}

	return layout;
}

function getLinePrize(lineId, layout)
{
	var line = PAYLINES[lineId];
	var firstSymId = layout[ line[0] ];
	
	var	hasPrize = true;
	var symPos = null;
	for(var i = 1; i < line.length; i++)
	{
		symPos = line[i];
		if(layout[symPos] != firstSymId)
		{
			hasPrize = false;
			break;
		}
	}

	var prize = null;
	if(hasPrize)
	{
		prize = {};
		prize.lineId = lineId;
		prize.symId = firstSymId;
		prize.winnings = getSymbolPrize(firstSymId);
	}
	
	return prize;
}

function getSymbolPrize(symId)
{
	var symConfig = null;
	var prize = 0;
	for(var i = 0; i < PAYTABLE.length; i++)
	{
		symConfig = PAYTABLE[i];
		if(symId == symConfig.symbol)
		{
			prize = symConfig.prize;
		}
	}

	return prize;
}

HTTP.listen(process.env.PORT || 3000, function(){
	console.log('listening on *:3000');
});