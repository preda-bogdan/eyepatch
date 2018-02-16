'use strict'

const fs = require( 'fs' )
const argv = require( 'minimist' )( process.argv.slice( 2 ) )
const spawn = require( 'child_process' ).spawn
const packageObject = require( '../package.json' )
// eslint-disable-next-line no-unused-lets
const colors = require( 'colors' )

const Jobs = require( './jobs' ).jobs

/**
 * Set globals for command
 */
let setGlobals = exports.setGlobals = function () {
	/**
	 * Configuration for wit
	 *
	 * @type {{path: *, verbose: boolean, help: boolean, version: boolean }}
	 */
	global.config = {
		path: process.cwd(),
		verbose: false,
		help: false,
		version: false
	}

	/**
	 * Test arguments to pass to test command
	 */
	global.testArgs = {}

	/**t
	 * Supported epatch arguments/options
	 *
	 * @type {{epatch-verbose: boolean, help: boolean, version: boolean}}
	 */
	global.defaultArgs = {
		'epatch-verbose': 0,
		help: false,
		version: false
	}
}

setGlobals()

/**
 * Process command line options and arguments
 */
let processArgs = exports.processArgs = function ( args ) {
	global.testArgs = args

	if ( args['epatch-verbose'] ) {
		global.config.verbose = parseInt( args['epatch-verbose'] )

		if ( isNaN( global.config.verbose ) ) {
			global.config.verbose = 1
		}
	} else {
		global.config.verbose = 0
	}

	if ( typeof args['epatch-job'] !== 'undefined' && parseInt( args['epatch-job'] ) >= 0 ) {
		global.config.job = parseInt( args['epatch-job'] )
	}

	if ( args.help ) {
		global.config.help = true
	}

	if ( args.version ) {
		global.config.version = true
	}

	if ( args._.length ) {
		global.config.path = args._[0]

		// First argument is assumed to be the epatch path
		global.testArgs._.shift()
	}

	for ( let key in global.testArgs ) {
		if ( key !== '_' && typeof global.defaultArgs[key] !== 'undefined' ) {
			delete global.testArgs[key]
		}
	}
}

/**
 * Main script command
 */
exports.execute = function () {
	let json
	processArgs( argv )

	if ( global.config.help ) {
		let help = '\nUsage:\n'.cyan.bold +
			'  epatch <path-to-config> [options]\n' +
			'\n' +
			'\nOptions:'.cyan.bold +
			'\n  --epatch-verbose'.magenta + ' Output letious lines of status throughout testing' +
			'\n  --epatch-job'.magenta + ' Select a specific job to run' +
			'\n  --help'.magenta + ' Display this help text' +
			'\n  --version'.magenta + ' Display current version' +
			'\n'
		console.log( help )
		process.exit( 0 )
	}

	if ( global.config.version ) {
		console.log( '\nEyepatch ThemeIsle ' + packageObject.version + ' -- Bogdan Preda\n' )
		process.exit( 0 )
	}

	try {
		json = JSON.parse( fs.readFileSync( global.config.path + '/Eyepatch.json', 'utf8' ) )
	} catch ( exception ) {
		console.error( '\nCould not parse Eyepatch.json'.red )
		console.error( 'Make sure you have a Eyepatch.json file inside your project'.red )
		console.error( 'or you have provided the <path-to-config> param'.red )
		process.exit( 255 )
	}

	let jobs = new Jobs( json.jobs )

	jobs.run( function ( returnCodes ) {
		let errors = 0

		for ( let i = 0; i < returnCodes.length; i++ ) {
			if ( returnCodes[i] !== 0 ) {
				errors++
			}
		}

		if ( !returnCodes.length ) {
			console.log( ( '\nNo jobs finished' ).bgYellow + '\n' )
		} else {
			if ( !errors ) {
				console.log( ( '\n' + returnCodes.length + ' jobs(s) done' ).bgGreen + '\n' )
			} else {
				console.error( ( '\n' + ( returnCodes.length - errors ) + ' out of ' + returnCodes.length + ' jobs(s) done' ).bgRed + '\n' )
				process.exit( 1 )
			}
		}
	}, global.config.job )
}