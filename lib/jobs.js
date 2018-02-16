'use strict'

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
			self.jobs[i].run( callback )
		} else {
			finishedCallback( returnCodes )
		}
	}

	if ( typeof jobId !== 'undefined' && jobId !== false ) {
		self.jobs[jobId].run( function ( code ) {
			returnCodes.push( code )
			finishedCallback( returnCodes )
		} )
	} else {
		self.jobs[i].run( callback )
	}
}

exports.jobs = Jobs