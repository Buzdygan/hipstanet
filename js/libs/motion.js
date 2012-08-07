var _motionAreas = [];
var anyMotion = function() {};

function addMotionArea(x1, y1, x2, y2, callback) {
_motionAreas = _motionAreas.concat({
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        callback: callback });
}

var content = $('#content');
var video = $('#webcam')[0];

function hasGetUserMedia() {
	// Note: Opera builds are unprefixed.
	return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

var webcamError = function(e) {
	alert(i18n('Webcam error!'), e);
};

if (navigator.getUserMedia) {
	navigator.getUserMedia({audio: true, video: true}, function(stream) {
		video.src = stream;
	}, webcamError);
} else if (navigator.webkitGetUserMedia) {
	navigator.webkitGetUserMedia({audio:true, video:true}, function(stream) {
		video.src = window.webkitURL.createObjectURL(stream);
	}, webcamError);
}

var timeOut, lastImageData;
var canvasSource = $("#canvas-source")[0];
var canvasBlended = $("#canvas-blended")[0];

var contextSource = canvasSource.getContext('2d');
var contextBlended = canvasBlended.getContext('2d');

var AudioContext = (
    window.AudioContext ||
    window.webkitAudioContext ||
    null
);

var soundContext = AudioContext ? new AudioContext() : null;
var bufferLoader;

// mirror video
contextSource.translate(canvasSource.width, 0);
contextSource.scale(-1, 1);

var c = 5;

playSound = function(obj) {
	if (!obj.ready) return;
	var source = soundContext.createBufferSource();
	source.buffer = obj.source.buffer;
	source.connect(soundContext.destination);
    source.noteOn(0);
	obj.ready = false;
	setTimeout(setReady, 400, obj);
}

function setReady(obj) {
	obj.ready = true;
}

function start() {
	$('.loading').fadeOut();
	$('body').addClass('black-background');
	$(canvasSource).fadeTo(0);
	$(canvasBlended).fadeTo(0);
	update();
}

function finishedLoading(bufferList) {
    for (var i=0; i<bufferList.length; i++) {
        var source = soundContext.createBufferSource();
        source.buffer = bufferList[i];
        source.connect(soundContext.destination);

        sound = {
            source: source,
            ready: true
        }
        sounds.push(sound);
    }
    start();
}

window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame    ||
		window.oRequestAnimationFrame      ||
		window.msRequestAnimationFrame     ||
		function( callback ){
			window.setTimeout(callback, 1000 / 60);
		};
})();

function update() {
	drawVideo();
	blend();
	checkAreas();
	requestAnimFrame(update);
}

function drawVideo() {
	contextSource.drawImage(video, 0, 0, video.width, video.height);
}

function blend() {
	var width = canvasSource.width;
	var height = canvasSource.height;
	var sourceData = contextSource.getImageData(0, 0, width, height);

	if (!lastImageData) lastImageData = contextSource.getImageData(0, 0, width, height);
	var blendedData = contextSource.createImageData(width, height);

	differenceAccuracy(blendedData.data, sourceData.data, lastImageData.data);
	contextBlended.putImageData(blendedData, 0, 0);
	lastImageData = sourceData;
}

function fastAbs(value) {
	// funky bitwise, equal Math.abs
	return (value ^ (value >> 31)) - (value >> 31);
}

function threshold(value) {
	return (value > 0x15) ? 0xFF : 0;
}

function difference(target, data1, data2) {
	// blend mode difference
	if (data1.length != data2.length) return null;
	var i = 0;
	while (i < (data1.length * 0.25)) {
		target[4*i] = data1[4*i] == 0 ? 0 : fastAbs(data1[4*i] - data2[4*i]);
		target[4*i+1] = data1[4*i+1] == 0 ? 0 : fastAbs(data1[4*i+1] - data2[4*i+1]);
		target[4*i+2] = data1[4*i+2] == 0 ? 0 : fastAbs(data1[4*i+2] - data2[4*i+2]);
		target[4*i+3] = 0xFF;
		++i;
	}
}

function differenceAccuracy(target, data1, data2) {
	if (data1.length != data2.length) return null;
	var i = 0;
	while (i < (data1.length * 0.25)) {
		var average1 = (data1[4*i] + data1[4*i+1] + data1[4*i+2]) / 3;
		var average2 = (data2[4*i] + data2[4*i+1] + data2[4*i+2]) / 3;
		var diff = threshold(fastAbs(average1 - average2));
		target[4*i] = diff;
		target[4*i+1] = diff;
		target[4*i+2] = diff;
		target[4*i+3] = 0xFF;
		++i;
	}
}

function checkAreas() {
    var
        width = video.width,
        height = video.height;

	for (var r=0; r<_motionAreas.length; ++r) {
		var blendedData = contextBlended.getImageData(
                _motionAreas[r].x1 * height,
                _motionAreas[r].y1 * height,
                _motionAreas[r].x2 * height,
                _motionAreas[r].y2 * height
            );
		var i = 0;
		var average = 0;
		// loop over the pixels
		while (i < (blendedData.data.length * 0.25)) {
			// make an average between the color channel
			average += (blendedData.data[i*4] + blendedData.data[i*4+1] + blendedData.data[i*4+2]) / 3;
			++i;
		}

        if (average)
            anyMotion();

		// calculate an average between of the color values of the area
		average = Math.round(average / (blendedData.data.length * 0.25));
		if (average > 10) {
                _motionAreas[r].callback();
		}
	}
}
