const express = require('express');
const { exec } = require("child_process");
const router = express.Router();
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Medic' });
  });

  router.post('/connect', (req,res)=>{
    exec('asebamedulla "ser:device=/dev/ttyACM0" &', (error, stdout, stderr)=>{
      if(error){res.send({error: error})}
      else if(stderr){res.send({stderr: stderr})}
      else{res.send({stdout: stdout})}
    });
  });

  router.post('/disconnect', (req,res)=>{
    exec('killall asebamedulla', (error, stdout, stderr)=>{
      if(error){res.send({error: error})}
      else if(stderr){res.send({stderr: stderr})}
      else{res.send({stdout: stdout})}
    });
  });


module.exports = router;