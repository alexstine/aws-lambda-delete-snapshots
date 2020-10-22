// Include AWS EC2
const AWS = require( "aws-sdk" );
const EC2 = new AWS.EC2();

// Function to check if snapshot is older than 3 days
function is_older_than_3_days( snapshot_date ) {
	// Pass in the snapshot date from the loop in the main entrypoint function
	if ( typeof snapshot_date === "undefined" || typeof snapshot_date === "null" ) {
		return false;
	}
	if ( snapshot_date === "" ) {
		return false;
	}
	// Define a new date class with the snapshot date
	const snapshot_start = new Date( snapshot_date ).getTime();
	// Start with now, get 3 days ago, then finish off with converting to milliseconds
	const three_days_ago = new Date( new Date().setDate( new Date().getDate() - 3 ) ).getTime();
	// If snapshot start date is less than 3 days ago, return true or return false otherwise
	if ( snapshot_start < three_days_ago ) {
		return true;
	} else {
		return false;
	}
}

// Function to handle the deletion
function snapshot_delete( snapshot_id ) {
	// Pass in the snapshot ID from the loop in the main entrypoint function
	if ( typeof snapshot_id === "undefined" || typeof snapshot_id === "null" ) {
		return false;
	}
	if ( snapshot_id === "" ) {
		return false;
	}
	// Define some request params
	const params = {
		SnapshotId: snapshot_id
	};
	EC2.deleteSnapshot( params, function( err, data ) {
		if ( err ) {
			console.log( err, err.stack );
		} else {
			console.log( `Successfully deleted: ${snapshot_id}.` );
		}
	});
}

// Our main function to list snapshots, the entrypoint
function listSnapshots() {
	console.log( "Listing snapshots..." );
	// Grab env stored in Lambda
	const volume_id = process.env.VOLUME_ID;
	if ( typeof volume_id === "undefined" || typeof volume_id === "null" ) {
		console.log( "Null params." );
		return false;
	}
	if ( volume_id === "" ) {
		console.log( "Empty params." );
		return false;
	}
	// Define some request params
	const snapshotsParams = {
		Filters: [{
			Name: "status",
			Values: [ "completed" ],
			Name: "volume-id",
			Values: [ volume_id ]
		}],
		OwnerIds: [ "self" ]
	};
	EC2.describeSnapshots( snapshotsParams, function( err, data ) {
		if ( err ) {
			console.log( err, err.stack );
		} else {
			console.log( `There are currently ${data.Snapshots.length} snapshots.` );
			let snapshot;
			for ( snapshot of data.Snapshots ) {
				if ( true === is_older_than_3_days( snapshot.StartTime ) ) {
					console.log( `The snapshot: ${ snapshot.SnapshotId } is older than 3 days.` );
					snapshot_delete( snapshot.SnapshotId );
				} else {
					console.log( `The snapshot: ${ snapshot.SnapshotId } is newer than 3 days.` );
				}
			}
		}
	});
}

exports.listSnapshots = listSnapshots;