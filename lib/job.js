'use strict'

const spawn = require( 'child_process' ).spawn
const colors = require( 'colors' )

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
	console.log( ( '\nTaking snapshots for ' + self.url + '' ).green );

	(async () => {
		const browser = await puppeteer.launch()
		const page = await browser.newPage()
		await page.goto( self.url )

		for( let index in self.sizes ) {
			let w_size = parseInt( self.sizes[index] )
			console.log( ( 'Set size to: ' + w_size ).italic )
			await page.setViewport({width: w_size, height: 1080});
			await page.screenshot({path: 'test_' + w_size + '.png', fullPage: true})
		}


		// const dimensions = await page.evaluate(() => {
		// 	return {
		// 		width: document.documentElement.clientWidth,
		// 		height: document.documentElement.clientHeight,
		// 		deviceScaleFactor: window.devicePixelRatio
		// 	}
		// })

		// console.log( 'Dimensions:', dimensions )


		await browser.close()
	})()


}

exports.job = Job