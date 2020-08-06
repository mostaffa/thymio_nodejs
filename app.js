const debug = require('debug')('thymio');
const express = require('express')
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const dbus = require('dbus-native');
const sessionBus = dbus.sessionBus();
const destination = 'ch.epfl.mobots.Aseba';
const interf = 'ch.epfl.mobots.AsebaNetwork';
const PATH = '/';
const loop = 100;
const index = require('./routes/index')
const fs = require('fs');
const { json } = require('express');
const { exec } = require("child_process");

var app = express()
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('port', process.env.PORT || 3005);

app.use('/',index);

var server = app.listen(app.get('port'), function() {
	debug('Express server listening on port ' + server.address().port);
});
var io = require('socket.io').listen(server);

io.on('connection', function (socket) {
	exec('asebamedulla "ser:device=/dev/ttyACM0" &', (error, stdout, stderr)=>{
		if(error){console.log({error: error})}
		else if(stderr){console.log({stderr: stderr})}
		else{console.log({stdout: stdout})}
	  });
	var currentConnect = null;
	socket.on('dbusConnect', function (data) {
        console.log(data)
        // socket.emit("connect","{status:connected}")
		sessionBus.getService(destination).getInterface(PATH,interf, function(err, aseba) {
			if(!err){
				currentConnect = aseba;
                getValues(aseba);
                socket.emit("conn","Connected")
                // console.log(aseba)
			}else{
				console.log(err)
				//getValues(aseba);
				socket.emit("conn",err)
				
            }
		});
	});
    socket.on("hi",data=>{
        console.log(data);
        socket.emit('hi',"hi");
    });
	socket.on('motor', function (data) {
		// var right = data.speed*data.right,left = data.speed*data.left;
		var left = parseInt(data.left)
		var right = parseInt(data.right)
		sessionBus.getService(destination).getInterface(PATH,interf, function(err, aseba) {
			// aseba.SetVariable("thymio-II", "motor.left.target",[left]);
			// aseba.SetVariable("thymio-II", "motor.right.target",[right]);
			aseba.SetVariable("thymio-II", "motor.left.target",[left]);
			aseba.SetVariable("thymio-II", "motor.right.target",[right]);
			aseba.SetVariable("thymio-II", "leds.top",[50,150,150]);
		});
	});

	function getValues(aseba){
		var sensors = {
			prox:{
				horizontal:{},
				ground:{}
			},
			acc:[],
			temperature:null,
			mic:{
				intensity:null,
				threshold:null
			},
			motor:{
				left:0,
				right:0
			}
		}
		aseba.GetVariable("thymio-II", "prox.horizontal",function(error,data){
			sensors.prox.horizontal = {
				'bottomRight':data[6],
				'bottomLeft':data[5],
				'right':data[4],
				'centerRight':data[3],
				'center':data[2],
				'centerLeft':data[1],
				'left':data[0],
			}
			aseba.GetVariable("thymio-II", "prox.ground.ambiant",function(error,data){
				sensors.prox.ground.ambiant = data
				aseba.GetVariable("thymio-II", "prox.ground.reflected",function(error,data){
					sensors.prox.ground.reflected = data
					aseba.GetVariable("thymio-II", "prox.ground.delta",function(error,data){
						sensors.prox.ground.delta = data
						aseba.GetVariable("thymio-II", "acc",function(error,data){
							sensors.acc = data;
							aseba.GetVariable("thymio-II", "temperature",function(error,data){
								sensors.temperature = data;
								aseba.GetVariable("thymio-II", "mic.intensity",function(error,data){
									sensors.mic.intensity = data;
									aseba.GetVariable("thymio-II", "mic.threshold",function(error,data){
										sensors.mic.threshold = data;
										aseba.GetVariable("thymio-II", "motor.left.pwm",function(error,data){
											sensors.motor.left = data;
											aseba.GetVariable("thymio-II", "motor.right.pwm",function(error,data){
												sensors.motor.right = data;
                                                socket.emit('sensors', sensors);
                                                // fs.writeFile("sensors.json", JSON.stringify(sensors),errrr=>{
                                                //     if(errrr)throw errrr
                                                // })
												setTimeout(function(){getValues(aseba)},loop);
											});
										});
									});
								});
							});
						});
					});
				});
});
});
}
});
