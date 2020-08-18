const express = require('express');
const fs = require('fs');
const { exec } = require("child_process");
const { resolve } = require('path');
const router = express.Router();
router.get('/', function(req, res, next) {
    let script;
    fs.readFile('scripts/run.py',(error, data)=>{
      if(!error){
        script = data;
        res.render('index', { title: 'Thymio',script:script });
      }
    })
    
  });

router.post("/save", (req,res)=>{
  // console.log(req.body.script)
  fs.writeFile("scripts/run.py", req.body.script.toString(), (error)=>{
    if(error){
      res.send({error:error});
    }else{
      res.json(0)
    }
  });
})

  router.post('/connect', (req,res)=>{
    reconnect().then(()=>{
          exec('asebamedulla "ser:device=/dev/ttyACM0" ', (error, stdout, stderr)=>{
      if(error){res.send({error: error})}
      else if(stderr){res.send({stderr: stderr})}
      else{
        res.send({stdout: stdout})}
    });
    });

  });

  router.post('/disconnect', (req,res)=>{
    exec('killall asebamedulla', (error, stdout, stderr)=>{
      if(error){res.send({error: error})}
      else if(stderr){res.send({stderr: stderr})}
      else{res.send({stdout: stdout})}
    });
  });

function reconnect(){
  return new Promise((resolve,reject)=>{
    exec('killall asebamedulla', (error, stdout, stderr)=>{
      resolve();
    })
  })
}

module.exports = router;