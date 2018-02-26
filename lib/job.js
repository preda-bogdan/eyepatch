'use strict'

const fs  = require('fs');
const colors = require( 'colors' );

const puppeteer = require('puppeteer');
const pathManager = require('./path_manager.js').pathManager;

/**
 * Initialize a new container
 *
 * @param jobsArray
 * @constructor
 */
var Job = function ( jobsArray ) {
	this.url = jobsArray.url
	this.url_base = false
	if ( jobsArray.url_base !== undefined && jobsArray.url_base !== '' ) {
		this.url_base = jobsArray.url_base
	}

	let url = this.url.lastIndexOf('/') == this.url.length - 1 ? this.url.substr(0, this.url.length - 1) : this.url.substr(0, this.url.length + 1);
	this.name = url.substr( url.lastIndexOf('/') + 1 );
	if ( jobsArray.name !== undefined && jobsArray.name !== '' ) {
		this.name = jobsArray.name
	}
	this.sizes = jobsArray.sizes
}

/**
 * Run tests on given container object
 *
 * @param finishedCallback
 */
Job.prototype.run = function ( finishedCallback ) {
	let self = this,
		options = {}

	if ( global.config.verbose ) {
		options = {stdio: 'inherit'}
	}

	if ( global.config.verbose ) {
		console.log('Slow Motion setting:', global.config.slowMo);

		console.log('Checking and creating required folders and paths ...');
	}

	new pathManager( { name: 'history/' + global.config.name } ).ensureExists( function (err) {
		if (err) console.error( 'Unable to create history resource', err )
	} )

	new pathManager( { name: 'latest/' + global.config.name } ).ensureExists( function (err) {
		if (err) console.error( 'Unable to create latest resource', err )
	} )

	puppeteer.launch({ headless: true, slowMo: global.config.slowMo, args: ['--no-sandbox', '--disable-setuid-sandbox' ]}).then(async browser => {
		const promises=[];
		for( let index in self.sizes ) {
			const worker = require('./worker.js').worker;
			promises.push( new worker( { name: self.name, url: self.url, size: self.sizes[index], wsEndpoint: browser.wsEndpoint(), isBase: false } ).run().catch( function(err) {
			//promises.push( new worker( { url: "https://www.google.com", w_size: w_size, h_size: h_size, id: wCount, wsEndpoint: browser.wsEndpoint() } ).run().catch( function(err) {
				console.error( ( err ).red );
			} ) );

			if( self.url_base ) {
				promises.push( new worker( { name: self.name, url: self.url_base, size: self.sizes[index], wsEndpoint: browser.wsEndpoint(), isBase: true } ).run().catch( function(err) {
					console.error( ( err ).red );
				} ) );
			}
		}

		//browser.disconnect();
		await Promise.all(promises)
		browser.close();
		finishedCallback( 0 );
	});

}

exports.job = Job