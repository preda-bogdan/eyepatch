'use strict'

const colors = require( 'colors' );

const Job = require( './job' ).job

/**
 * Initialize new containers object
 *
 * @param jobsArray
 * @constructor
 */
var Jobs = function ( jobsArray ) {
	this.jobs = []

	for ( let i = 0; i < jobsArray.length; i++ ) {
		this.jobs.push( new Job( jobsArray[i] ) )
	}
}

/**
 * Run all containers
 */
Jobs.prototype.run = function ( finishedCallback, jobId ) {
	let i = 0,
		self = this,
		returnCodes = []

	function callback ( code ) {
		i++

		returnCodes.push( code )

		if ( i < self.jobs.length ) {
			console.log( ( 'Started job #' + ( i + 1 ) ).black.blueBG  );
			self.jobs[i].run( callback )
		} else {
			finishedCallback( returnCodes )
		}
	}


	if ( typeof jobId !== 'undefined' && jobId !== false ) {
		console.log( ( 'Started job #' + jobId ).black.blueBG  );
		self.jobs[jobId - 1].run( function ( code ) {
			returnCodes.push( code )
			finishedCallback( returnCodes )
		} )
	} else {
		console.log( ( 'Started job #' + ( i + 1 ) ).black.blueBG  );
		self.jobs[i].run( callback )
	}
}

exports.jobs = Jobs