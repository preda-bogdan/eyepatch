'use strict'

const fs  = require('fs');
const colors = require( 'colors' );
const sh = require("shorthash");
const puppeteer = require('puppeteer');
const PNG = require('pngjs').PNG;


/**
 * Initialize a new worker
 *
 * @param parentData
 * @constructor
 */
const Worker = function ( parentData ) {
	this.url = parentData.url;
	this.size = parentData.size;
	this.w_size = parseInt( this.size )
	this.h_size = parseInt( ( this.w_size * (9/16) ) )
	if ( this.w_size <= 720 ) {
		this.h_size = parseInt( ( this.w_size * (16/9) ) )
	}
	this.wId = ( sh.unique( this.url + '_' + this.w_size ) + '_' + this.w_size ).blue;
	this.wsEndpoint = parentData.wsEndpoint;

	console.log( ( 'New Worker ' + this.wId + ' spawned' ).green.bold );
}

/**
 * Run worker object
 */
Worker.prototype.run = function () {
	let self = this;

	return new Promise((resolve, reject) => {

		async function timeout(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		(async () => {
			const browser = await puppeteer.connect({
				browserWSEndpoint: self.wsEndpoint,
				ignoreHTTPSErrors: true
			})
			await browser.newPage().then(async page => {
				await page.goto( self.url, {waitUntil: 'networkidle0', timeout: 120000} ).then( async function () {
					console.log( ( 'URL: ' + self.url + ' loaded in Worker ' + self.wId ).green );

					let w_size = self.w_size;
					let h_size = self.h_size;

					await page.bringToFront();
					await page.setViewport({ width: w_size, height: h_size, deviceScaleFactor: 1, isMobile: ( w_size <= 720 ) }).then(() => { console.log( ( 'Set size to: ' + w_size + 'x' + h_size + ' for Worker ' + self.wId ).italic ); }, function (error) {
						console.log(`Error on setViewport: ${error.message}`)
					});
					const bodyHandle = await page.$('body');
					const { width, height } = await bodyHandle.boundingBox();
					//console.log( ( 'Size: ' + width + 'x' + height + ' detected in Worker ' + self.wId ) );
					console.log( ( 'Waiting 1s to clear Animations in Worker ' + self.wId ) );
					await page.evaluate(() => {
						window.scrollTo(0, document.body.scrollHeight);
					});
					await timeout(500);
					await page.evaluate(() => {
						window.scrollTo(0, 0);
					});
					await timeout(500);

					let snapFull = new PNG( { width: w_size, height: height} );
					let parts = parseInt( height / h_size );
					let ypos = 0;
					console.log( 'Worker ' + self.wId + ' Parts', parts );

					for ( let count = 1; count <= parts; count++ ) {
						let new_h = Math.min( height - ypos, h_size, height );
						console.log( 'Worker ' + self.wId + ': Snap p' + (count) + ': height:' + new_h + ' top:' + ypos );

						let clipY = 0;
						let clipH = 0;
						if( ypos == 0 ) {
							clipY = ypos;
							clipH = new_h + 100;
						}
						if( ypos != 0 ) {
							clipY = ypos + 100;
							clipH = new_h;
							await page.evaluate((ypos) => {
								console.log('Y Pos:', ypos);
								window.scrollTo(0, ypos);
							}, ypos);
							await timeout(500);
						}
						if( count == parts ) {
							clipY = ypos + 100;
							clipH = height - clipY;
						}

						let snapPart = await page.screenshot({
							clip: {
								x: 0,
								y: clipY,
								width: w_size,
								height: clipH
							},
							type: 'png'
						})

						if ( ( clipY + clipH ) <= height ) {
							let part = new PNG().parse( snapPart );
							await new Promise(resolve => {
								part.on('parsed', function() {
									this.bitblt(snapFull, 0, 0, w_size, clipH, 0, clipY);
									console.log( 'Worker ' + self.wId + ': Saving "debug/p_' + w_size + '_' + count + '_.png"');
									part.pack().pipe(fs.createWriteStream('debug/p_' + w_size + '_' + count + '_.png'));
									resolve();
								})
							})
						}
						ypos = ypos + h_size;
					}
					snapFull.pack().pipe(fs.createWriteStream('test_' + w_size + '.png'));

					await bodyHandle.dispose();

				} ).catch( function(error) {
					reject( ( 'URL: ' + self.url + ' for Worker ' + self.wId + ' exceeded timeout.' ).red, error );
				} );

				resolve();
			});
		})()

	})
}

exports.worker = Worker;