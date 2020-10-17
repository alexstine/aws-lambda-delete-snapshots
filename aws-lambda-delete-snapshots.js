// Include AWS EC2
const AWS = require( "aws-sdk" );
const EC2 = new AWS.EC2();

// Our function to list the snapshots and serve as the kick-off.
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
					delete_snapshot( snapshot.SnapshotId );
				} else {
					console.log( `The snapshot: ${ snapshot.SnapshotId } is newer than 3 days.` );
				}
			}
		}
	});
}

// Function to check if snapshot is older than 3 days
function is_older_than_3_days( snapshot_date ) {
	// Pass in the snapshot date from the loop in the previous function
	if ( typeof snapshot_date === "undefined" || typeof snapshot_date === "null" ) {
		return false;
	}
	if ( snapshot_date === "" ) {
		return false;
	}
	// Define a new date class with the snapshot date
	const snapshot_start = new Date( snapshot_date ).getTime();
	// Since this is a milliseconds comparison since 1/1/1970, we want to make sure the snapshot date is less than the current date minus 3 days
	const three_days_ago = new Date().getTime() - 1602703170;
	// If so, return true and if not, return false
	if ( snapshot_start < three_days_ago ) {
		return true;
	} else {
		return false;
	}
}

// Function to handle the deletion
function snapshot_delete( snapshot_id ) {
	// Pass in the snapshot ID from the loop in the previous function
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

exports.listSnapshots = listSnapshots;