requirejs.config(
{
    paths:
    {
        'jquery': '../external/jQuery/jquery-1.11.0.min',
        'bootstrap': '../external/bootstrap/dist/js/bootstrap.min'
    },
    shim:
    {
        'bootstrap.min':
        {
            deps: ['jquery'],
            exports: '$'
        }
    }
});

requirejs(['jquery', 'bootstrap'], function($)
{
    var audioContext;
    var oscillator;
    var isRunning = false;

    if (isPhoneGap()) {
        document.addEventListener("deviceready", onDeviceReady, false);
    } else {
        onDeviceReady();
    }

    function isPhoneGap() {
        // When running in PhoneGap, document.URL will be a file:// type URL
        return ((document.URL.indexOf( 'http://' ) === -1) && (document.URL.indexOf( 'https://' ) === -1));
    }

    function onDeviceReady() {
        if (!window.DeviceMotionEvent && !navigator.accelerometer) {
            displayError('Accelerometer/device motion is not supported.  This isn\'t going to work.');
            return;
        }

        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext);            
        } catch (e) {
            displayError('Audio context is not supported.  This isn\'t going to work.')
            return;
        }

        $('#startStopBtn').on('click', toggle);
    }

    function toggle(evt) {
        if (isRunning) {
            isRunning = false;
            $('#startStopBtn').attr('value', 'Start');
            stop(evt);
        } else {
            isRunning = true;
            $('#startStopBtn').attr('value', 'Stop');
            start(evt);
        }
    }

    function start(evt) {
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', onDeviceMotion, false);
        } else if (navigator.accelerometer) {
            startWatchingAccelerometer();
        }
        startOscillator();
        evt.preventDefault();
    }

    function stop(evt) {
        if (window.DeviceMotionEvent) {
            window.removeEventListener('devicemotion', onDeviceMotion, false);
        } else if (navigator.accelerometer) {
            stopWatchingAccelerometer();
        }
        stopOscillator();
        evt.preventDefault();
    }

    function enable(selector) {
        $(selector).prop("disabled",false);
    }

    function disable(selector) {
        $(selector).prop("disabled",true);
    }

    function displayError(string) {
        alert(string);
    }

    var accelerometerOptions = { frequency: 500 };
    var accelerometerWatchId = null;

    function startWatchingAccelerometer() {
        accelerometerWatchId = navigator.accelerometer.watchAcceleration(accelerometerSuccess, accelerometerError, accelerometerOptions); 
    }

    function accelerometerSuccess(acceleration) {
        adjustPitch(acceleration);
    }

    function accelerometerError(error) {
        displayError(error.message);
    }

    function onDeviceMotion(evt) {
        adjustPitch(evt.accelerationIncludingGravity);
    }

    var GREAT_A = 110;
    var GRAVITY = 9.80665;

    function adjustPitch(accelerationIncludingGravity) {
        // ... accelerationIncludingGravity.x, accelerationIncludingGravity.y, accelerationIncludingGravity.z
        var y = accelerationIncludingGravity.y || 0;
        var exp = 2*(y+GRAVITY)/GRAVITY;
        var pitch = GREAT_A*Math.pow(2, exp);

        oscillator.frequency.value = pitch;
    }

    function startOscillator() {
        oscillator = audioContext.createOscillator();
        oscillator.type = oscillator.SINE;
        oscillator.frequency.value = 0;
        oscillator.connect(audioContext.destination);
        oscillator.noteOn(0);
        var gainObj = audioContext.createGain();
        gainObj.gain.value = 0;
        oscillator.connect(gainObj);
        gainObj.connect(audioContext.destination);
    }

    function stopWatchingAccelerometer() {
        navigator.accelerometer.clearWatch(accelerometerWatchId);
        accelerometerWatchId = null;
    }

    function stopOscillator() {
        oscillator.noteOff(0);
    }
});

