'use strict'

const puppeteer = require('puppeteer');
const pathManager = require('./path_manager.js').pathManager;

const JobsManager = function ( jsonJobsArray ) {
	this.jsonJobsArray = jsonJobsArray
	this.jobsList = []
}

JobsManager.prototype.nameFromUrl = function ( passedUrl ) {
	let url =passedUrl.lastIndexOf('/') == passedUrl.length - 1 ? passedUrl.substr(0, passedUrl.length - 1) : passedUrl.substr(0, passedUrl.length + 1);
	return url.substr( url.lastIndexOf('/') + 1 );
}

JobsManager.prototype.getJobsList = function () {
	return this.jobsList
}

JobsManager.prototype.expand = function () {
	let self = this;
	for ( let i = 0; i < self.jsonJobsArray.length; i++ ) {
		let currentJob = self.jsonJobsArray[i]

		let url = currentJob.url
		let name = currentJob.name || this.nameFromUrl( url )
		let width = 1920
		let force = currentJob.force || global.config.forceUpdate

		if( currentJob.sizes && currentJob.sizes.length !== 0 ) {
			for ( let j = 0; j < currentJob.sizes.length; j++ ) {
				self.jobsList.push( { name: name, url: url, width:  currentJob.sizes[j], force: force, isBase: false } )
				if( currentJob.url_base ) {
					self.jobsList.push( { name: name, url: currentJob.url_base, width:  currentJob.sizes[j], force: force, isBase: true } )
				}
			}
		} else {
			self.jobsList.push( { name: name, url: url, width:  width, force: force, isBase: false } )
			if( currentJob.url_base ) {
				self.jobsList.push( { name: name, url: currentJob.url_base, width:  width, force: force, isBase: true } )
			}
		}
	}

	this.jobsList = self.jobsList
	return this
}

JobsManager.prototype.run = function ( finishedCallback ) {
	let self = this;

	new pathManager( { name: 'history/' + global.config.name } ).ensureExists( function (err) {
		if (err) console.error( 'Unable to create history resource', err )
	} )

	new pathManager( { name: 'latest/' + global.config.name } ).ensureExists( function (err) {
		if (err) console.error( 'Unable to create latest resource', err )
	} )

	puppeteer.launch( { headless: true, slowMo: global.config.slowMo, args: ['--no-sandbox', '--disable-setuid-sandbox' ] } )
		.then( async browser => {
			await this.batch( 0, 5, self.jobsList, browser )
			browser.close();
			finishedCallback()
		} );
}

JobsManager.prototype.batch = async function ( start, size, list, browser ) {

	let end = list.length;
	if ( size < end - start ) end = start + size

	let batches=[];
	let i = start;
	for ( i; i < end; i++ ) {
		let newJob = list[i]
		const ShotWorker = require('./shot_worker.js').ShotWorker;
		batches.push(
			new ShotWorker( newJob, browser.wsEndpoint() )
				.run()
				.catch( function(err) {
					console.error( ( err ).red );
				} )
		)
	}
	await Promise.all(batches)
	if ( i < list.length ) await this.batch( i, size, list, browser )
}

JobsManager.prototype.addResults = function () {

}

exports.jobsManager = JobsManager