//
//
// 

var SeqTrack = function( opts ) {
	
	var _song = opts.song || null;
	var _midiout = opts.sendMidi || null;
	
	return {
		
		currentPattern: 0,
		currentStep: 0,
		cuedPattern: -1,
		
		
		step: function() {
		}
	}
};

exports.Sequencer = function( opts ) {
	
	var _ppqn = opts.ppqn || 96;
	var _song = opts.song || null;
	var _midiout = opts.sendMidi || null;
	var _step = -1;
	var _tracks = [];
	
	for( var j=0; j<16; j++ )
		_tracks.push( new SeqTrack( { sendMidi: _midiout } ) );
		
	for( var j=0; j<16; j++ ) {
		// var firstpat = _song.getTrack(j).getNextEnabledPattern(-1);
		_tracks[j].currentPattern = -1;
		_tracks[j].currentStep = -1;
	}
		
	var _runningnotes = [];
	
	return {
		
		player: null,
		
		getSong: function() {
			return _song;
		},
		
		removeOldNotes: function(){
			for( var j=_runningnotes.length-1; j>=0; j-- ){
				if( _runningnotes[j].timer > 0 )
					_runningnotes[j].timer --;
					
				if( _runningnotes[j].timer <= 0 ) {
					// console.log('stopping note '+_runningnotes[j].note+' on channel '+_runningnotes[j].chan);
					_midiout( [ 0x80 + _runningnotes[j].chan, _runningnotes[j].note, 0 ] );
					_runningnotes.splice( j, 1 );
				}
			}
		},
		
		queueNote: function( chan, note, vel, stepsdur ) {
			// console.log('starting note '+note+' on channel '+chan);
			_midiout( [ 0x90 + chan, note, vel ] );
			_runningnotes.push( {
				chan: chan,
				note: note,
				timer: Math.ceil(stepsdur * _ppqn),
			} );
		},
		
		getPlayingGlobalStep: function() {
			return _step / _ppqn;
		},
		
		getCuedPattern: function( track ){
			if( track < 0 || track > 15 )
				return -1;
			var trk = _tracks[track];
			return trk.cuedPattern;
		},
		
		cuePattern: function( track, pattern ){
			if( track < 0 || track > 15 )
				return -1;
			var trk = _tracks[track];
			trk.cuedPattern = pattern;
		},
		
		getPlayingPatternStep: function( track ) {
			if( track < 0 || track > 15 )
				return -1;
			var trk = _tracks[track];
			return trk.currentStep;
		},
		
		getPlayingPattern: function( track ) {
			if( track < 0 || track > 15 )
				return -1;
			var trk = _tracks[track];
			return trk.currentPattern;
		},
		
		queueEvents: function(trackindex,patindex,patstep) {			
			var strk = _song.getTrack(trackindex);
			if( strk == null )
				return;
			var spat = strk.getPattern(patindex);
			if( spat == null )
				return;
			var sstp = spat.getStep(patstep);
			if( sstp == null )
				return;
			var snot = sstp.getNotes();
			if( snot == null )
				return;
			if( strk.gate < 1 )
				return;
			for(var k=0; k<snot.length; k++ )
				if( snot[k].v > 0 )
					this.queueNote( strk.channel, snot[k].n, snot[k].v, strk.gate/16 );
		},
		
		step: function(arg) {
			this.removeOldNotes();
			var ppqnstep = _step % _ppqn;
			if( ppqnstep == 0 ) {				
				// time to step everything forward
				var stp = Math.floor( arg.step / arg.ppqn );
				var rsp = stp % 16;
				var rsp2 = stp % 128;
				console.log('step', rsp);
				if( rsp2 == 0 ) { 
					console.log('Resync all loops.');
				}
				// se till att pattern är rätt 
				for( var j=0; j<16; j++ ) {
					var trk = _tracks[ j ];
					var strk = _song.getTrack( j );
					
					var nextpat = false;
					if( trk.currentPattern != -1 ) {
						var p = strk.getPattern(trk.currentPattern);
						if( rsp2 == 0 ) trk.currentStep = p.start;
						if( trk.currentStep > p.end ) nextpat = true;
					}
					else 
					{
						// ingen nuvarande pattern, ska vi starta en?
						// starta patterns görs endast på första 4/4-takten
						if( rsp == 0 ) nextpat = true;
					}

					if( nextpat ){
						if( trk.cuedPattern != -1 ) {
							trk.currentPattern = trk.cuedPattern;
							trk.cuedPattern = -1;
						} else {
					 		trk.currentPattern = strk.getNextEnabledPattern( trk.currentPattern );
						}
						// console.log('changed to next pattern',trk.currentPattern,'on track',j);
						if( trk.currentPattern != -1 ) {
							p = strk.getPattern(trk.currentPattern);
							trk.currentStep = p.start;
						}
					}

					if( trk.currentPattern >= 0 && trk.currentStep >= 0 && strk.enabled )
						this.queueEvents( j, trk.currentPattern, trk.currentStep );
					trk.currentStep ++;
				}		
			}
			_step ++;
		}
	}
};




