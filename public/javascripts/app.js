var editor_log = CodeMirror.fromTextArea(document.getElementById("log"), {
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true,
    theme:"darcula"
  });

var socket = io();
socket.emit('dbusConnect', "dbusConnect");


socket.on("conn", data => {
})
socket.on("error1", m => {
    console.log(m)
})
socket.on("stdout", m => {
    console.log(m)
    editor_log.replaceSelection(m)
})
socket.on("stderr", error => {
    console.log(error)
})
socket.on("sensors", data => {
    if (data) {
        $(".connect_btn").hide();
        $(".disconnect_btn").show();
        $(".disconnect_btn").prop('disabled', false);
        updateSensors(data)
    }
})
socket.on("kill_error", m=>{
    console.log(m)
});
socket.on("kill_done", m=>{
    socket.emit("motor", { left: 0, right: 0 });
    $("#kill").prop('disabled', true);
    $("#run").prop('disabled', false);
});

$(document).ready(() => {
    $('.motorSlider').slider({ min: -250, max: 250, value: 0, step: 5 })
    var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true,
    theme:"darcula"
  });
 
    $(".connect_btn").click(e => {
        e.preventDefault();
        $(".connect_loader").show()
        $("#res").attr('class', '');
        $.ajax({
            url: '/connect',
            method: 'POST',
            data: '{connect: true}',
            success: response => {
                if (response.error) {
                    $("#res").addClass("bg-danger");
                    $("#res").html(response.error)
                } else if (response.stderr) {
                    $(".disconnect_btn").show();
                    $("#res").addClass("bg-warning");
                    $("#res").html(response.stderr)
                    $(".connect_btn").prop('disabled', true);
                } else {
                    $(".disconnect_btn").show();
                    $(".connect_btn").prop('disabled', true);
                    $("#res").addClass("bg-success");
                    $("#res").html(response.stdout)
                }console.log("Here");
                $(".connect_loader").hide(100)
            },
            error: err => {
                $(".connect_btn").prop('disabled', true);
                $(".connect_loader").hide(100)
                $(".disconnect_btn").show();
                $("#res").addClass("bg-success");
                $("#res").html("Thymio Connected ")
                socket.connect("", {'force new connection': true});
                socket.emit('dbusConnect', "dbusConnect");
            },
            timeout: 3000,
            
        })
    })
    $(".disconnect_btn").click(e => {
        socket.emit("motor", { left: 0, right: 0 })
        socket.emit('dis', "dis");
        e.preventDefault();
        $(".disconnect_loader").show()
        $("#res").attr('class', '');
        $.ajax({
            url: '/disconnect',
            method: 'POST',
            data: '{connect: true}',
            success: response => {
                $(".connect_loader").show(100)
                if (response.error) {
                    $("#res").addClass("bg-danger");
                    $("#res").html(response.error)
                } else if (response.stderr) {
                    $(".disconnect_btn").show();
                    $("#res").addClass("bg-warning");
                    $("#res").html(response.stderr)
                } else {
                    $(".disconnect_btn").hide();
                    $(".connect_btn").show(100)
                    $(".connect_btn").prop('disabled', false);
                    $(".disconnect_loader").hide()
                    $("#res").addClass("bg-success");
                    $("#res").html(response.stdout)
                    socket.disconnect();
                }
                $(".connect_loader").hide(100)
            },
            error: err => {
                console.log(err)
            },
            timeout: 3000
        });
    });
    $("#save").click(e=>{
        editor.save()
        e.preventDefault();
        $("#save_loader").show();
        $.ajax({
            url: "save",
            method: "POST",
            data: {script: $("#code").val()},
            success: response=>{
                $("#save_loader").hide(500);
                if(response.error){
                    alert("There was an error, File wasn't saved!.")
                }else{
                    console.log("File saved successfuly.")
                }
            },
            error: error=>{
                alert(error)
            }
        });
    });
    $("#run").click(e=>{
        e.preventDefault();
        socket.emit("exec", "exec");
        $("#kill").prop('disabled', false);
        $("#run").prop('disabled', true);
    })
    $("#kill").click(e=>{
        e.preventDefault();
        socket.emit("kill", "kill");
        $("#kill").prop('disabled', true);
        $("#run").prop('disabled', false);
    })
    $("#save_log").click(e=>{
        e.preventDefault();
        saveTextAsFile()
    })
    $("#clear_log").click(e=>{
        e.preventDefault();
        editor_log.setValue("");
    })
})

function updateSensors(data) {
    $("#proxLeft").css("width", `${data.prox.horizontal.left * 100 / 4500}%`).html(data.prox.horizontal.left);
    $("#proxCenterLeft").css("width", `${data.prox.horizontal.centerLeft * 100 / 4500}%`).html(data.prox.horizontal.centerLeft);
    $("#proxCenter").css("width", `${data.prox.horizontal.center * 100 / 4500}%`).html(data.prox.horizontal.center);
    $("#proxCenterRight").css("width", `${data.prox.horizontal.centerRight * 100 / 4500}%`).html(data.prox.horizontal.centerRight);
    $("#proxRight").css("width", `${data.prox.horizontal.right * 100 / 4500}%`).html(data.prox.horizontal.right);
    $("#proxBottomLeft").css("width", `${data.prox.horizontal.bottomLeft * 100 / 4500}%`).html(data.prox.horizontal.bottomLeft);
    $("#proxBottomRight").css("width", `${data.prox.horizontal.bottomRight * 100 / 4500}%`).html(data.prox.horizontal.bottomRight);
    $("#proxGroundAmbiant0").css("width", `${data.prox.ground.ambiant[0] * 100 / 3600}%`).html(data.prox.ground.ambiant[0]);
    $("#proxGroundAmbiant1").css("width", `${data.prox.ground.ambiant[1] * 100 / 3600}%`).html(data.prox.ground.ambiant[1]);
    $("#proxGroundReflect0").css("width", `${data.prox.ground.reflected[0] * 100 / 1000}%`).html(data.prox.ground.reflected[0]);
    $("#proxGroundReflect1").css("width", `${data.prox.ground.reflected[1] * 100 / 1000}%`).html(data.prox.ground.reflected[1]);
    $("#proxGroundDelta0").css("width", `${data.prox.ground.delta[0] * 100 / 1000}%`).html(data.prox.ground.delta[0]);
    $("#proxGroundDelta1").css("width", `${data.prox.ground.delta[1] * 100 / 1000}%`).html(data.prox.ground.delta[1]);
    $("#accelerometer0").css("width", `${(parseInt(data.acc[0]) * 100 / 28)+50-data.acc[0]}%`).html(data.acc[0]);
    $("#accelerometer1").css("width", `${(parseInt(data.acc[1]) * 100 / 23)+50}%`).html(data.acc[1]);
    $("#accelerometer2").css("width", `${(parseInt(data.acc[2]) * 100 / 24)+50}%`).html(data.acc[2]);
    $("#temperature").css("width", `${data.temperature * 100 / 1024}%`).html(data.temperature);
    $("#micIntensity").css("width", `${data.mic.intensity[0]}%`).html(data.mic.intensity[0]);
    $("#micThreshold").css("width", `${data.mic.threshold[0]}%`).html(data.mic.threshold[0]);
    $("#motorLeft").css("width", `${data.motor.left[0] * 100 / 250}%`).html(data.motor.left[0]);
    $("#motorRight").css("width", `${data.motor.right[0] * 100 / 250}%`).html(data.motor.right[0]);
}

function motor(m) {
    // var socket = io();
    socket.emit("motor", { left: $("#leftMotor").val(), right: $("#rightMotor").val() })
    console.log({ left: $("#leftMotor").val(), right: $("#rightMotor").val() })
}

function saveTextAsFile() {
    var textToWrite = editor_log.getValue();
    var textFileAsBlob = new Blob([textToWrite], {
      type: "text/plain;charset=utf-8"
    });
    var fileNameToSaveAs = "log.txt";
  
    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    if (window.webkitURL != null) {
      // Chrome allows the link to be clicked
      // without actually adding it to the DOM.
      downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    } else {
      // Firefox requires the link to be added to the DOM
      // before it can be clicked.
      downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
      downloadLink.onclick = destroyClickedElement;
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
    }
  
    downloadLink.click();
  }