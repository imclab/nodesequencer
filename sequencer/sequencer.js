//
//
// 

var SeqTrack = function( opts ) {
	
	var _song = opts.song || null;
	var _midiout = opts.sendMidi || null;
	
	return {
		
		currentPattern: 0,
		currentStep: 0,
		
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
				timer: Math.ceil(stepsdur * _ppqn / 4),
			} );
		},
		
		getPlayingGlobalStep: function() {
			return _step / _ppqn;
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
			// console.log('queue events on track '+trackindex+', pattern '+patindex+', step '+patstep);
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
			// console.log('queue', snot);
			for(var k=0; k<snot.length; k++ )
				this.queueNote( strk.channel, snot[k].n, snot[k].v, 0.5 );
		},
		
		step: function(arg) {

			this.removeOldNotes();
			
			var ppqnstep = _step % _ppqn;
			var rsp = Math.floor( arg.step / arg.ppqn );
			
			// console.log('sequencer step: ', _step, rsp );
			
			for( var j=0; j<16; j++ ){
		//		var t = _song.getTrack( j );
		//		var s = t.getStep( rsp );
			}
			
			if( ppqnstep == 0 ) {
				// time to step everything forward
				
				// console.log('step seq', rsp);
				
				// se till att pattern är rätt 
				for( var j=0; j<2; j++ ) {

					var trk = _tracks[ j ];
					var strk = _song.getTrack( j);

					if( trk.currentPattern != -1 ) {
						var p = strk.getPattern(trk.currentPattern);
						
						trk.currentStep ++;
						if( trk.currentStep > p.end ) {
							// ska vi byta pattern ?
							trk.currentStep = p.start;
						}
						
						if( trk.currentStep >= 0 )	
							this.queueEvents( j, trk.currentPattern, trk.currentStep );
						
					} else {
						
						// ingen nuvarande pattern, ska vi starta en?
						// starta patterns görs endast på första 4/4-takten
						
						if( rsp == 0 ) {
							trk.currentPattern = strk.getNextEnabledPattern(-1);
							console.log('enabling pattern '+trk.currentPattern+' on track '+j);
							if( trk.currentPattern != -1 ) {
								var p = strk.getPattern(trk.currentPattern);
								trk.currentStep = p.start;
							}
						}
						
						if( trk.currentStep >= 0 )
							this.queueEvents( j, trk.currentPattern, trk.currentStep );
					}
				}		
				
				
				
				
						
			}

			_step ++;

			/*
			if( ppqnstep == 0 ) {

			//	console.log('step',rsp,'at tick', t);	
			 	if (rsp % 4 == 0 ) this.queueNote( 0, 36, 100, 1 );				
				if (rsp % 10 == 0 ) this.queueNote( 0, 42, 100, 1 );
				if (rsp % 15 == 0 ) this.queueNote( 0, 43, 100, 1 );
				if (rsp % 30 == 0 ) this.queueNote( 0,45, 100, 1 );
				if (rsp % 11 == 0 ) this.queueNote( 0, 46, 100, 1 );
				if (rsp % 5 == 0 ) this.queueNote( 0, 40, 100, 1 );
				if (rsp % 3 == 0 ) this.queueNote( 0, 45, 100, 1 );
				if (rsp % 2 == 0 ) this.queueNote( 0, 43, 100, 1 );

			 	if( rsp % 4 == 0 ) this.queueNote( 1, 36, 100, 0.5 );
			 	if( rsp % 4 == 2 ) this.queueNote( 1, 48, 100, 0.5 ); 
				if( rsp % 4 == 3 )this.queueNote( 1, 48, 100, 0.5 );
			}
			*/
		}
	}
	
};



