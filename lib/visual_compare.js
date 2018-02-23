'use strict'

const fs  = require('fs');
const colors = require( 'colors' );
const pathManager = require('./path_manager.js').pathManager;
const compareImages = require('resemblejs/compareImages');


const VisualCompare = function ( options ) {

}

VisualCompare.prototype.diff = function () {
	fs.readdir( global.localConfig.galleryPath + '/history/', function(err, items) {

		const files = [];
		let regex = new RegExp('^' + global.config.name + '_*[^\\.]+(\\.png)$', 'gm');
		for (let i=0; i<items.length; i++) {
			if( items[i].match( regex ) ) {
				files.push( items[i] );
			}
		}

		if( ! err ) {
			compare( files )
		} else {
			console.error( err );
		}
	});

	async function compare ( files ) {
		console.log( files );
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

		await new pathManager( { name: 'diff' } ).ensureExists( function (err) {
			if (err) console.error( 'Unable to create diff resource', err )
		} )

		for(let i=0; i<files.length; i++) {
			console.log( ('Comparing ' + files[i] + ' ...' ).yellow )

			let history_img = await fs.readFileSync( global.localConfig.galleryPath + '/history/' + files[i] );
			let latest_img = await fs.readFileSync( global.localConfig.galleryPath + '/latest/' + files[i] );

			const data = await compareImages(
				history_img,
				latest_img,
				options
			).catch( function( err ) {
				console.log( err );
			} )
			console.log('Data from diff', data)

			console.log( ('Writing to diff ...' ).italic )
			await fs.writeFileSync( global.localConfig.galleryPath + '/diff/' + files[i] , data.getBuffer());
		}

		await console.log( ('All diffs done!' ).black.greenBG )
	}
}

VisualCompare.prototype.gallery = function () {

}

exports.visualCompare = VisualCompare