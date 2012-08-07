var sounds = [];

var countries = {
        'pl':
            [{
                vl: 110,
                pvl: 60,
                ht: 100,
                c: 0,
                img: 'images/korwin.png' },
            {
                vl: 130,
                pvl: 60,
                ht: 100,
                c: -17,
                img: 'images/najman.png' }]
    }

$(document).ready(function() {
    var character = countries.pl[1];

    var AudioContext = (
        window.AudioContext ||
        window.webkitAudioContext ||
        null
    );

	function loadSounds() {
		bufferLoader = new BufferLoader(soundContext,
			[
				'sounds/punch.mp3',
				'sounds/laugh.mp3'
			],
			finishedLoading
		);
		bufferLoader.load();
	}

    $('.instructions').fadeIn();
    $(video).hide();

    function initialize() {
            setTimeout(loadSounds, 1);
    }

    $(window).bind('resize', function() {
            var
                width = $('#content').width(),
                height = $('#content').height();

            left_glove.css({
                left: (width / 2.0 - 150 - 200) + 'px',
                top: (height / 2.0 + character.ht) + 'px' });
            right_glove.css({
                left: (width / 2.0 + 150) + 'px',
                top: (height / 2.0 + character.ht) + 'px' });
            person.css({
                left: (character.c + width / 2.0 - 250) + 'px',
                top: (height / 2.0 - 250) + 'px' });
        });

    var duration = 50,
        pduration = 100;

    var
        left_glove = $('#left_glove'),
        right_glove = $('#right_glove'),
        person = $('#person'),
        camOn = false,
        initialPunches = 2,
        punches,
        timestamp,
        animating;

    person.css('background', 'url(' + character.img + ') no-repeat');

    $('.instructions button').bind('click', function() {
            initialize();
            $('.instructions').fadeOut('slow');
            window.setTimeout(function() {
                    if (!camOn)
                        $('.allow-message').show();
                }, 1000);
        });

    var rotate = function(x, d) {
        x.css('transform', 'rotate(' + d + 'deg)');
        x.css('-ms-transform', 'rotate(' + d + 'deg)');
        x.css('-moz-transform', 'rotate(' + d + 'deg)');
        x.css('-webkit-transform', 'rotate(' + d + 'deg)');
        x.css('-o-transform', 'rotate(' + d + 'deg)');
    }

    var set_lifebar = function() {
        var color;
        if (punches > 5)
            color = 'red';
        if (punches > 10)
            color = 'yellow';
        if (punches > 15)
            color = 'green';

        $('.lifebar-inner').css({ width: (punches * 5.0) + '%',
                                'background-color': color });
    }

    set_lifebar();

    if (hasGetUserMedia()) {
        $('.introduction').fadeIn();
        $('.allow').fadeIn();
    } else {
        $('.browsers').fadeIn();
        return;
    }

    var reset = function() {
        timestamp = new Date().getTime();
        punches = initialPunches;
        set_lifebar();
        $('.knockout').hide();
        animating = false;
    }

    $('.knockout button').bind('click', function() {
        reset();
    });

    reset();

    var animate = function(o, a, b) {
            if (animating)
                return;

            if (punches == initialPunches)
                timestamp = new Date().getTime();

            punches -= 1;

            if (punches == 0) {
                $('.knockout').show();
                animating = true;
                playSound(sounds[1]);
                var time = (new Date().getTime() - timestamp) / 1000.0;
                $('#time').text(time);
                $('.knockout .msg a').attr('href',
                    'http://www.facebook.com/sharer.php?u=http://hipsta.net/&t=Pokonałem Najmana w ' + time + ' s!');
                return;
            }

            set_lifebar();

            $('.allow-message').fadeOut();

            animating = true;
            o.animate({ left: a + '=' + character.vl, top: '-=' + character.vl },
                { duration: duration, complete: function() {
                    window.setTimeout(function() {
                        o.animate({ left: b + '=' + character.vl, top: '+=' + character.vl },
                            { duration: duration });
                        }, 30);
                    window.setTimeout(function() {
                        rotate(person, a + '15');
                        person.animate({ left: a + '=' + character.pvl, top: '-=' + character.pvl },
                            { duration: duration, complete: function() {
                                rotate(person, '0');
                                window.setTimeout(function() {
                                    person.animate({ left: b + '=' + character.pvl, top: '+=' + character.pvl },
                                    { duration: pduration, complete: function() {
                                            window.setTimeout(function() {
                                                    animating = false;
                                                }, 100);
                                        } });
                                    }, 20);
                            }});
                        }, 50);
                }});
            playSound(sounds[0]);
    }

    anyMotion = function() {
        camOn = true;
        $('.allow-message').fadeOut();
    };

    addMotionArea(0, 0, 0.03, 1, function() {
            animate(left_glove, '+', '-');
        });
    addMotionArea(0.97, 0, 1, 1, function() {
            animate(right_glove, '-', '+');
        });
});
