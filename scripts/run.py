#python3
import atexit
import dbus
import dbus.mainloop.glib
##
# import gobject
from gi.repository import GObject as gobject
import sys
import math
# from force_resistor import *
# from light_sensor import Light_sensor
from optparse import OptionParser

# Variables
TIME_STEP = 12
maxSpeed = 50
state= "findTarget"
duration = 0
ps = []
lightgoal = False
sensors = [0,0,0,0,0,0,0,0,0,0,0,0]
#proxSensorsVal=[0,0,0,0,0,0,0]
#groundSensors = [0,0]
# groundSensors = [0,0]
# lightSensor = [0,0]
# presureSensor = 0
status = True
pressureVal =26
lightVal = 5500 # max
pushingVal = 20
groundVal = 750
proxVal = 300
psValues = []
# psNames = ["prox.horizontal.0", "prox.horizontal.1", "prox.horizontal.2", "prox.horizontal.3", "prox.horizontal.4", "prox.horizontal.5", "prox.horizontal.6", "prox.ground.0", "prox.ground.1"]
robotInfo = [0, 0, 0, 0, 0, 0, 0]
counter = 0
nextStep = ""
distance = 0.0
goOut = True
currentState = ""
Timer = 0
target = {
    "distance":0,
    "time":0
}
turnInfo = {
    "direction":"L",
    "duration": 0.0,
    "L_MotorSpeed": 0,
    "R_MotorSpeed":0,
    "turnCount": 0
}
input_prox_horizontal = []
input_prox_ground = []
input_force = []
input_light = []
def Braitenberg():
    global input_prox_horizontal
    global input_force
    global input_light
    global input_prox_ground
    global robotE
    global sensors
    global Timer
    global state
    global maxSpeed
    global lightVal
    global distance
    global duration
    global turnInfo
    global nextStep
    global target
    global currentState
    global lightgoal
    global goOut
    global proxSensorsVal
    global groundSensors
    #get the values of the sensors
    network.GetVariable("thymio-II", "prox.horizontal",reply_handler=get_variables_reply,error_handler=get_variables_error)
    network.GetVariable("thymio-II", "prox.ground.reflected",reply_handler=get_variables_reply2,error_handler=get_variables_error2)
    #network.GetVariable("thymio-II", "prox.ground.reflected",reply_handler=get_groundSensors_reply,error_handler=get_variables_error)
    input_prox_horizontal = [sensors[0],sensors[1],sensors[2],sensors[3],sensors[4],sensors[5],sensors[6]]
    input_prox_ground = [sensors[7],sensors[8]]
    # sensors[9]= read_Light_Sensor_Real()
    # sensors[10]=read_Light_Sensor_Real()
    # input_light = read_Light_Sensor_Real()
    sensors[9]= 5500
    sensors[10]=5500
    # input_light = read_Light_Sensor_Real()
    sensors[11]= 15
    # input_force = readadc(0)
    # input_light = network.GetVariable(name, "light")
    # input_prox_ground = network.GetVariable(name, "force")
    #### Fill Value ###
    
    # The Foraging function returns an array with info about the state of the robot
    # [motor.left , motor.right, error, obstical, arenaborder, transportation, goal, (cycles)]
    retval = foraging()

    

    #send motor value to the robot
    network.SetVariable("thymio-II", "motor.left.target", [retval[0]])
    network.SetVariable("thymio-II", "motor.right.target",[retval[1]])

    Timer +=0.04
    return True

def get_variables_reply(r):
    global sensors
    sensors[0:6]=r


def get_variables_error(e):
    print ('error:')
    print (str(e))
    loop.quit()

def get_variables_reply2(r):
    global sensors
    sensors[7:8]=r

def get_variables_error2(e):
    print ('error:')
    print (str(e))
    loop.quit()

def read_Light_Sensor_Real():
	global sensor03
	global sensor01    
	return [sensor03.read_sensor_value(), sensor01.read_sensor_value()]


#############################################################
def checkLight():
    global sensors
    global robotInfo
    global lightVal
    print("checklight")
    if sensors[9] > lightVal:
       lightgoal == True
       print("in if light")
       robotInfo[6] = 1
       return True
    else:
       print("not in if")
       robotInfo[6] = 0
       return False
############################################################
 ############################################################
def foundObject():
    print("Pressure sensr is", sensors[11])
    if sensors[11]> pushingVal:
       return True
    return False
############################################################
def checkBorder():
        global groundVal
        global sensors
        global robotInfo
        print("IR Horz is"+str(sensors[7]))
        if sensors[7] > groundVal or sensors[8] >  groundVal:
            robotInfo[4] = 1
            return True
        else:
            robotInfo[4] = 0    
            return False
    ############################################################
######################################################################################
def foraging():
            global proxVal
            global sensors
            global Timer
            global state
            global maxSpeed
            global distance
            global duration
            global turnInfo
            global nextStep
            global target
            global currentState
            global lightgoal
            global goOut
            global pushingVal
            global pessureVal
            print(state)
            print(lightgoal)
            print("LIGHT SENSOR", sensors[9] )
	    	#print(currentState)
            print(sensors[11])
            #robotInfo[0]= maxSpeed
    ########################### find Target ##############################
            if state == "findTarget":
                currentState = "findTarget"
                # Light Was Found
                if checkLight():
                    lightgoal = True
                    turnInfo["duration"] = 1
                    turnInfo["direction"] = "L"
                    target["distance"] = 0
                    duration = Timer
                    state = "Turn"
                    turnInfo["duration"] = 1
                    nextStep = "Search"
                    goOut = True
                # if  not targetEreaFound:
                else:
                    # L_Motor.setVelocity(maxSpeed)
                    # R_Motor.setVelocity(maxSpeed)
                    robotInfo[0] = maxSpeed
                    robotInfo[1] = maxSpeed
                    if sensors[11]>pushingVal :
                        duration = Timer
                        state = "Back"
                        nextStep = "Turn"
                        turnInfo["turnCount"] +=1
                        if turnInfo["turnCount"] %3 ==0:
                           turnInfo["direction"] = "L"
                        else:
                            turnInfo["direction"] = "R"
                            turnInfo["duration"] = 6.4/maxSpeed
                    if checkBorder():
                        if sensors[7] > sensors[8]:
                            turnInfo["direction"] = "R"
                        else:
                            turnInfo["direction"] = "L"
                        state = "Back"
                        nextStep = "Turn"
                        turnInfo["duration"] = 6.4/maxSpeed
            ####################################### Search State #############################
            if state == "Search":
                currentState = "findTarget"
                 
                # Thymio here after turning & the light is on
                # Bring the boxes Algorithm
                # L_Motor.setVelocity(maxSpeed)
                # R_Motor.setVelocity(maxSpeed)
                robotInfo[0] = maxSpeed
                robotInfo[1] = maxSpeed
                if goOut:
                    distance += Timer - duration 
                    if checkBorder():
                        print("Turn Border")
                        state = "Turn"
                        duration = Timer
                        turnInfo["duration"] = 2.495 # 180
                        nextStep = "goToLight"
                        goOut = False
                    if foundObject():
                        state= "Avoid"
                        nextStep = "goToLight"
                        duration = Timer
                        turnInfo["direction"] = "R"
                        turnInfo["duration"] = 2.495 # 180 
                        goOut = False
                    if checkLight() and foundObject():
                        
                        state = "Turn"
                        distance = 0
                        duration = Timer
                        turnInfo["duration"] = Timer%3+1 # 180
                        nextStep = "goToLight"
                                          
                else:
                    distance -= Timer - duration + 1.5
                    if distance < 0:
                        state = "Turn"
                        duration = Timer
                        turnInfo["duration"] = 1 # 180 
                        goOut = True
                    if checkBorder():# miss the light
                        state = "Turn"
                        nextStep = "goToLight"
                        lightgoal = False
                        duration = Timer
                        turnInfo["duration"] = 2.495 # 180 
                    if checkLight():
                        distance= 0
                        state = "Turn"
                        duration = Timer
                        turnInfo["duration"] = 1 # 180 
                        nextStep = "Search"
                        goOut = True

            ######################################  Back State ###############################
            if state == "Back":
                currentState = "findTarget"
                # L_Motor.setVelocity(-2)
                # R_Motor.setVelocity(-2)
                robotInfo[0] = -maxSpeed
                robotInfo[1] = -maxSpeed
                if Timer - duration > 1:
                    duration = Timer
                    state = nextStep
            ###################################### Back End ##################################
            ###################################### Turn State ################################
            if state == "Turn":
                robotInfo[5] = 0
                currentState = "findTarget"
                if turnInfo["direction"] == "L":
                    # L_Motor.setVelocity(-5)
                    # R_Motor.setVelocity(5)
                    robotInfo[0] = -maxSpeed
                    robotInfo[1] = maxSpeed
                else:
                    # L_Motor.setVelocity(5)
                    # R_Motor.setVelocity(-5)
                    robotInfo[0] = maxSpeed
                    robotInfo[1] = -maxSpeed
                if Timer - duration > turnInfo["duration"]:
                    duration = Timer
                    # turnInfo["duration"] = 0
                    if lightgoal:
                        state = "Search"
                    else:
                        state = "findTarget"
                # goOut = not goOut
            ######################################## End Turn ################################
            ######################################## GoToLight ###############################
            if state == "goToLight":
                distance -= Timer - duration - 1.5
                currentState = "findTarget"
                # L_Motor.setVelocity(maxSpeed)
                # R_Motor.setVelocity(maxSpeed)
                robotInfo[0] = maxSpeed
                robotInfo[1] = maxSpeed
                if distance <0:
                    state = "Turn"
                    duration = Timer
                    turnInfo["duration"] = 2.495 # 180
                    nextStep = "Search"
                    distance = 0.0
                    goOut = True
                if foundObject():
                    robotInfo[5] = 1
                else:
                    robotInfo[5] = 0
                # if checkBorder():# miss the light
                #     state = "Turn"
                #     nextStep = "findTarget"
                #     lightgoal = False
                #     duration = Timer
                #     turnInfo["duration"] = 2.495 # 180 
                #     goOut = True
            ######################################## GoToLight End ###########################
            ######################################## Avoid state #############################
            if state == "Avoid":
                currentState = "findTarget"
                if Timer - duration < 0.5:
                    # L_Motor.setVelocity(-5) #  VVVVVV
                    # R_Motor.setVelocity(-5)
                    robotInfo[0] = -maxSpeed
                    robotInfo[1] = -maxSpeed
                elif Timer - duration > 0.5 and Timer - duration <1.75:
                    # L_Motor.setVelocity(-5) # <=========
                    # R_Motor.setVelocity(5)
                    robotInfo[0] = -maxSpeed
                    robotInfo[1] = maxSpeed
                elif Timer - duration >1.75 and Timer - duration < 3:
                    # L_Motor.setVelocity(5) # ^^^^^
                    # R_Motor.setVelocity(5)
                    robotInfo[0] = maxSpeed
                    robotInfo[1] = maxSpeed
                elif Timer - duration > 3 and Timer - duration <4.25:
                    # L_Motor.setVelocity(5) # =============>
                    # R_Motor.setVelocity(-5)
                    robotInfo[0] = maxSpeed
                    robotInfo[1] = -maxSpeed
                elif Timer - duration >4.25 and Timer - duration < 6.75:
                    # L_Motor.setVelocity(5) # ^^^^^
                    # R_Motor.setVelocity(5) 
                    robotInfo[0] = maxSpeed
                    robotInfo[1] = maxSpeed
                elif Timer - duration > 6.75 and Timer - duration < 8:
                    # L_Motor.setVelocity(5) # ==========>
                    # R_Motor.setVelocity(-5)
                    robotInfo[0] = maxSpeed
                    robotInfo[1] = -maxSpeed
                elif Timer - duration > 8 and Timer - duration < 9.25:
                    # L_Motor.setVelocity(5) # ^^^^
                    # R_Motor.setVelocity(5)
                    robotInfo[0] = maxSpeed
                    robotInfo[1] = maxSpeed
                elif Timer - duration > 9.25 and Timer - duration < 10.5:
                    # L_Motor.setVelocity(5)
                    # R_Motor.setVelocity(-5)
                    robotInfo[0] = maxSpeed
                    robotInfo[1] = -maxSpeed
                if Timer - duration > 10.5:
                    duration = Timer# reset the timer
                    state = nextStep
                    goOut = False
            if sensors[0] > proxVal or sensors[1] >proxVal  or sensors[2] > proxVal or sensors[3] > proxVal or sensors[4] >proxVal:
                # L_Motor.setVelocity(0) 
                
                # R_Motor.setVelocity(0)
                lightgoal== False
                robotInfo[0] = 0
                robotInfo[1] = 0
                robotInfo[3] = 1   
                if Timer - duration > 2:
                    state = currentState
            else:
                robotInfo[3] = 0
            #print(state)
           # print(goOut)
            print(robotInfo)
            return robotInfo
#######################################################################################



if __name__ == '__main__':
    parser = OptionParser()
    parser.add_option("-s", "--system", action="store_true", dest="system", default=False,help="use the system bus instead of the session bus")
    (options, args) = parser.parse_args()
    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
    if options.system:
        bus = dbus.SystemBus()
    else:
        bus = dbus.SessionBus()
    #Create Aseba network
    network = dbus.Interface(bus.get_object('ch.epfl.mobots.Aseba', '/'), dbus_interface='ch.epfl.mobots.AsebaNetwork')

    #print in the terminal the name of each Aseba NOde
    print (network.GetNodesList())

    # initalize light sensors
    # 3 => front facing sensor
    # sensor03 = Light_sensor(3)
    # 1 => back facing sensor
    # sensor01 = Light_sensor(1)

    #GObject loop
    print ('starting loop')
    loop = gobject.MainLoop()
    #call the callback of Braitenberg algorithm
    handle = gobject.timeout_add (100, Braitenberg) #every 0.1 sec
    loop.run()

@atexit.register
def goodbye():
    print("Stopping Thymio....")
    network.SetVariable("thymio-II", "motor.left.target", [0])
    network.SetVariable("thymio-II", "motor.right.target", [0])