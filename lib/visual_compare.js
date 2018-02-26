'use strict'

const fs  = require('fs');
const colors = require( 'colors' );
const pathManager = require('./path_manager.js').pathManager;
const compareImages = require('resemblejs/compareImages');


const VisualCompare = function ( jsonJobsArray ) {
	this.jsonResponse = {}
	this.jsonResponse.jobs = jsonJobsArray
	this.jsonResponse.result = { diffs:[], summary: { diffInDimensions: false, totalChecks: 0, totalRawMisMatchPercentage: 0, totalMisMatchPercentage: '0.00' } }
	for( let i=0; i<this.jsonResponse.jobs.length; i++ ) {
		let url = this.jsonResponse.jobs[i].url.lastIndexOf('/') == this.jsonResponse.jobs[i].url.length - 1 ? this.url.substr(0, this.jsonResponse.jobs[i].url.length - 1) : this.jsonResponse.jobs[i].url.substr(0, this.jsonResponse.jobs[i].url.length + 1);
		let name = url.substr( url.lastIndexOf('/') + 1 );
		if ( this.jsonResponse.jobs[i].name === undefined || this.jsonResponse.jobs[i].name === '' ) {
			this.jsonResponse.jobs[i].name = name
		}
	}
}

VisualCompare.prototype.diff = function () {
	let self = this;

	for( let i=0; i<self.jsonResponse.jobs.length; i++ ) {
		fs.readdir( global.localConfig.galleryPath + '/history/' + global.config.name + '/', function(err, items) {

			const files = [];
			let regex = new RegExp('^' + self.jsonResponse.jobs[i].name + '_*[^\\.]+(\\.png)$', 'gm');
			for (let i=0; i<items.length; i++) {
				if( items[i].match( regex ) ) {
					files.push( items[i] );
				}
			}

			if( ! err ) {
				compare( files, i );
			} else {
				console.error( err );
			}
		});
	}

	async function compare ( files, count ) {
		//console.log( files );
		const options = {
			output: {
				errorColor: {
					red: 74,
					green: 20,
					blue: 140
				},
				errorType: 'movementDifferenceIntensity', // Other options { 'movement', 'flat', 'flatDifferenceIntensity', 'movementDifferenceIntensity', 'diffOnly'  }
				transparency: 1,
				largeImageThreshold: 1200,
				useCrossOrigin: false,
				outputDiff: true
			},
			scaleToSameSize: false,
			ignore: ['alpha'], // Other options { 'nothing', 'less', 'antialiasing', 'colors', 'alpha' }
		};

		await new pathManager( { name: 'diff/' + global.config.name } ).ensureExists( function (err) {
			if (err) console.error( 'Unable to create diff resource', err )
		} )
		for(let i=0; i<files.length; i++) {
			console.log( ('Comparing ' + files[i] + ' ...' ).yellow )

			let history_img = await fs.readFileSync( global.localConfig.galleryPath + '/history/' + global.config.name + '/' + files[i] );
			let latest_img = await fs.readFileSync( global.localConfig.galleryPath + '/latest/' + global.config.name + '/' + files[i] );

			const data = await compareImages(
				history_img,
				latest_img,
				options
			).catch( function( err ) {
				console.log( err );
			} )
			//console.log('Data from diff', data)

			console.log( ('Writing to diff ...' ).italic )
			await fs.writeFileSync( global.localConfig.galleryPath + '/diff/' + global.config.name + '/' + files[i], data.getBuffer());

			let diff_res = {
				name: self.jsonResponse.jobs[count].name,
				history_img:  global.localConfig.galleryURL + '/history/' + global.config.name + '/' + files[i],
				latest_img:  global.localConfig.galleryURL + '/latest/' + global.config.name + '/' + files[i],
				diff_img:  global.localConfig.galleryURL + '/diff/' + global.config.name + '/' + files[i],
				isSameDimensions: data.isSameDimensions,
				rawMisMatchPercentage: data.rawMisMatchPercentage,
				misMatchPercentage: data.misMatchPercentage
			}

			self.jsonResponse.result.diffs.push( diff_res );

			if( ! data.isSameDimensions && ! self.jsonResponse.result.summary.diffInDimensions ) {
				self.jsonResponse.result.summary.diffInDimensions = true
			}

			self.jsonResponse.result.summary.totalChecks += 1;
			self.jsonResponse.result.summary.totalRawMisMatchPercentage = ( self.jsonResponse.result.summary.totalRawMisMatchPercentage + data.rawMisMatchPercentage) / self.jsonResponse.result.summary.totalChecks;
			self.jsonResponse.result.summary.totalMisMatchPercentage = self.jsonResponse.result.summary.totalRawMisMatchPercentage.toFixed( 2 ).toString();
		}

		await console.log( ('Diff batch done!' ).black.greenBG )

		if ( self.jsonResponse.jobs.length - 1 === count ) {
			await console.log( self.jsonResponse )
			console.timeEnd('eyepatch_' + global.config.name );
		}
	}
}

VisualCompare.prototype.gallery = function () {

}

exports.visualCompare = VisualCompare