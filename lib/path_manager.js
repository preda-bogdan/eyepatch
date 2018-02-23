'use strict'

const fs  = require('fs');
const path  = require('path');
const colors = require( 'colors' );

/**
 * Initialize a new path manager
 *
 * @param options
 * @constructor
 */
let PathManager = function ( options ) {
	this.name = ''
	this.chmod = '0777'
	this.basePath = global.localConfig.galleryPath

	if ( options ) {
		if (options.name !== undefined && options.name !== '') {
			this.name = options.name
		}
		if (options.basePath !== undefined) {
			this.chmod = options.chmod
		}
		if (options.basePath !== undefined && options.basePath !== '') {
			this.basePath = options.basePath
		}
	}
}

function mkDirByPathSync(targetDir, chmod, {isRelativeToScript = false} = {}, callback ) {
	const sep = path.sep;
	const initDir = path.isAbsolute(targetDir) ? sep : '';
	const baseDir = isRelativeToScript ? __dirname : '.';

	targetDir.split(sep).reduce((parentDir, childDir) => {
		const curDir = path.resolve(baseDir, parentDir, childDir);
		try {
			fs.mkdirSync( curDir, chmod );
			if ( global.config.verbose ) {
				console.log(`Directory ${curDir} created!`);
			}
		} catch (err) {
			if (err.code !== 'EEXIST') {
				callback( err );
			}
			if ( global.config.verbose > 2 ) {
				console.log(`Directory ${curDir} already exists! Moving forward.`);
			}
		}

		return curDir;
	}, initDir);
}

PathManager.prototype.fileExists = function ( filePath ) {
	try {
		return fs.statSync(filePath).isFile();
	} catch (err) {
		return false;
	}
}

PathManager.prototype.ensureExists = function ( callback ) {
	let self = this;
	if ( global.config.verbose ) {
		console.log(self.basePath + '/' + self.name)
	}

	mkDirByPathSync( self.basePath + '/' + self.name, self.chmod )

	// fs.mkdir( self.basePath + '/' + self.name, self.chmod, function(err) {
	// 	if (err) {
	// 		if (err.code == 'EEXIST') callback(null); // ignore the error if the folder already exists
	// 		else callback(err); // something else went wrong
	// 	} else callback(null); // successfully created folder
	// });
}

exports.pathManager = PathManager