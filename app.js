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
const { spawn } = require('child_process');
let PID = 0;
let childProcess = {}
var app = express()
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('port', process.env.PORT || 3005);

app.use('/', index);

var server = app.listen(app.get('port'), function () {
	debug('Express server listening on port ' + server.address().port);
});
var io = require('socket.io').listen(server);
io.on('connection', function (socket) {
	exec('asebamedulla "ser:device=/dev/ttyACM0" &', (error, stdout, stderr) => {
		if (error) { console.log({ error: error }) }
		else if (stderr) { console.log({ stderr: stderr }) }
		else { console.log({ stdout: stdout }) }
	});
	var currentConnect = null;
	socket.on('dbusConnect', function (data) {
		console.log(sessionBus.getService(destination).bus.exportedObjects)
		sessionBus.getService(destination).getInterface(PATH, interf, function (err, aseba) {
			if (!err) {
				currentConnect = aseba;
				getValues(aseba);
				console.log(aseba)
				socket.emit("state", "Connected")
				// console.log(aseba)
			} else {
				console.log(err)
				//getValues(aseba);
				socket.emit("state", err)
			}
		});
	});
	socket.on("dis", data => {
		// console.log(data);
		socket.disconnect();
	});
	socket.on('motor', function (data) {
		// var right = data.speed*data.right,left = data.speed*data.left;
		var left = parseInt(data.left)
		var right = parseInt(data.right)
		sessionBus.getService(destination).getInterface(PATH, interf, function (err, aseba) {
			// aseba.SetVariable("thymio-II", "motor.left.target",[left]);
			// aseba.SetVariable("thymio-II", "motor.right.target",[right]);
			aseba.SetVariable("thymio-II", "motor.left.target", [left]);
			aseba.SetVariable("thymio-II", "motor.right.target", [right]);
			aseba.SetVariable("thymio-II", "leds.top", [50, 150, 150]);
		});
	});
	socket.on("exec", data=>{
		// exec(`python scripts/run.py `, (error, stdout, stderr)=>{
		// 	if(error){socket.emit("error1",{error}); console.log(error)}
		// 	else if(stdout){socket.emit("stdout",stdout)}
		// 	else{socket.emit("stderr",stderr)}
		// });
		var child = spawn('python',['scripts/run.py']); 
		childProcess = child;
		// use event hooks to provide a callback to execute when data are available: 
		PID = child.pid
		child.stdout.on('data', function(data) {
			// console.log(data.toString()); 
			
			socket.emit("stdout",data.toString())
		});
	});
	socket.on("kill", data=>{
		// exec(`kill PID  ${PID} & killall asebamedulla`, (error, stdout, stderr)=>{
		// 	if(error){socket.emit("kill_error", {error})}
		// 	else if(stdout){socket.emit("kill_done", "kill_done")}
		// 	else{socket.emit("kill_error",{stderr})}
		// });
		childProcess.kill()
		socket.emit("kill_done", "kill_done")
	});
	function getValues(aseba) {
		var sensors = {
			prox: {
				horizontal: {},
				ground: {}
			},
			acc: [],
			temperature: null,
			mic: {
				intensity: null,
				threshold: null
			},
			motor: {
				left: 0,
				right: 0
			}
		}
		aseba.GetVariable("thymio-II", "prox.horizontal", function (error, data) {
			if (error) {
				console.log(error)
			} else {
				sensors.prox.horizontal = {
					'bottomRight': data[6],
					'bottomLeft': data[5],
					'right': data[4],
					'centerRight': data[3],
					'center': data[2],
					'centerLeft': data[1],
					'left': data[0],
				}
				aseba.GetVariable("thymio-II", "prox.ground.ambiant", function (error, data) {
					if(error){errorSensor(error)}
					sensors.prox.ground.ambiant = data
					aseba.GetVariable("thymio-II", "prox.ground.reflected", function (error, data) {
						if(error){errorSensor(error)}
						sensors.prox.ground.reflected = data
						aseba.GetVariable("thymio-II", "prox.ground.delta", function (error, data) {
							if(error){errorSensor(error)}
							sensors.prox.ground.delta = data
							aseba.GetVariable("thymio-II", "acc", function (error, data) {
								if(error){errorSensor(error)}
								sensors.acc = data;
								aseba.GetVariable("thymio-II", "temperature", function (error, data) {
									if(error){errorSensor(error)}
									sensors.temperature = data;
									aseba.GetVariable("thymio-II", "mic.intensity", function (error, data) {
										if(error){errorSensor(error)}
										sensors.mic.intensity = data;
										aseba.GetVariable("thymio-II", "mic.threshold", function (error, data) {
											if(error){errorSensor(error)}
											sensors.mic.threshold = data;
											aseba.GetVariable("thymio-II", "motor.left.pwm", function (error, data) {
												if(error){errorSensor(error)}
												sensors.motor.left = data;
												aseba.GetVariable("thymio-II", "motor.right.pwm", function (error, data) {
													if(error){errorSensor(error)}
													sensors.motor.right = data;
													socket.emit('sensors', sensors);
													// fs.writeFile("sensors.json", JSON.stringify(sensors),errrr=>{
													//     if(errrr)throw errrr
													// })
													setTimeout(function () { getValues(aseba) }, loop);
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
	}
	function errorSensor(error){
		console.log(error)
		// socket.emit("error", error)
	}
});

