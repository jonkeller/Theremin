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
    var pitch = 440;
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

        $('#startBtn').on('click', start);
        $('#stopBtn').on('click', stop);
    }

    function start(evt) {
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', onDeviceMotion, false);
        } else if (navigator.accelerometer) {
            startWatchingAccelerometer();
        }
        startOscillator();
        disable('#startBtn');
        enable('#stopBtn');
        evt.preventDefault();
    }

    function stop(evt) {
        if (window.DeviceMotionEvent) {
            window.removeEventListener('devicemotion', onDeviceMotion, false);
        } else if (navigator.accelerometer) {
            stopWatchingAccelerometer();
        }
        stopOscillator();
        enable('#startBtn');
        disable('#stopBtn');
        evt.preventDefault();
    }

    function enable(selector) {
        $(selector).prop("disabled",false);
    }

    function disable(selector) {
        $(selector).prop("disabled",true);
    }

    function displayError(string) {
        var prev = $('#status').html();
        $('#status').html(prev + '\n' + string);
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
        /* Ignore for now:
        evt.acceleration.x, .y, and .z
        evt.rotationRate.alpha, .beta, and .gamma
        */
    }

    function adjustPitch(accelerationIncludingGravity) {
        // ... accelerationIncludingGravity.x, accelerationIncludingGravity.y, accelerationIncludingGravity.z
        var y = accelerationIncludingGravity.y || 0;
        pitch = (y+9.8) * 44.9;
//        $('#status').html(y + ' -> ' + pitch);
        oscillator.frequency.value = pitch;
    }

    function startOscillator() {
        oscillator = audioContext.createOscillator();
        oscillator.type = oscillator.SINE;
        oscillator.frequency.value = pitch;
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

