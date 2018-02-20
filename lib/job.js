'use strict'

const fs  = require('fs');
const colors = require( 'colors' );

const puppeteer = require('puppeteer');

/**
 * Initialize a new container
 *
 * @param jobsArray
 * @constructor
 */
var Job = function ( jobsArray ) {
	this.url = jobsArray.url
	this.sitemap = jobsArray.sitemap
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

	puppeteer.launch({ headless: true, slowMo: 0, args: ['--no-sandbox', '--disable-setuid-sandbox', '--remote-debugging-port=9222' ]}).then(async browser => {
		const promises=[];
		for( let index in self.sizes ) {
			const worker = require('./worker.js').worker;
			promises.push( new worker( { url: self.url, size: self.sizes[index], wsEndpoint: browser.wsEndpoint() } ).run().catch( function(err) {
			//promises.push( new worker( { url: "https://www.google.com", w_size: w_size, h_size: h_size, id: wCount, wsEndpoint: browser.wsEndpoint() } ).run().catch( function(err) {
				console.error( ( err ).red );
			} ) );
		}

		await Promise.all(promises)
		browser.close();
	});

}

exports.job = Job