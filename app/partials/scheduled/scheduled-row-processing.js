/*global utils */

/**
 *
 */
(function () {

	"use strict";

	utils.requestSeats = function ($scope, $modal, SharePoint) {

		return function (row) {

			if ($scope.canRequest && row.openSeats > 0) {

				var scope = $scope.$new();

				scope.data = row;

				scope.data.Students = [];

				scope.close = $modal(
					{

						'scope'          : scope,
						'backdrop'       : 'static',
						'contentTemplate': '/partials/modal-request-seats.html'

					}).destroy;

				scope.submit = function () {

					row.Requests_JSON = row.Requests_JSON || [];

					row.Requests_JSON.push([
						                       // Status
						                       1,

						                       // Students Array
						                       scope.data.Students,

						                       // Notes
						                       scope.data.Notes,

						                       // Host ID
						                       scope.data.HostId
					                       ]);

					// Call sharePoint.update() with our data and handle the success/failure response
					SharePoint.update({

						                  'cache'        : true,
						                  '__metadata'   : row.__metadata,
						                  'Requests_JSON': row.Requests_JSON

					                  })

						.then(function (resp) {

							      scope.submitted = false;

							      // HTTP 204 is the status given for a successful update, there will be no body
							      if (resp.status === 204) {

								      utils.alert.create();

								      self.process();

								      scope.close();

								      utils.alert.create();

							      } else {

								      utils.alert.error('unknown update issue');

							      }

						      });

				};
			}
		};

	};

	utils.processScheduledRow = function (row) {

		utils.cacheFiller(row);

		row.search = [
			row.ClassNotes,
			row.Course.text,
			row.Instructor.label,
			row.TTMS,
			row.FTD.text
		].join(' ');

		switch (true) {
			case (row.openSeats > 0):
				row.openSeatsClass = 'success';
				break;

			case(row.openSeats < 0):
				row.openSeatsClass = 'danger';
				break;

			default:
				row.openSeatsClass = 'warning';
		}

		row.availability = {
			'success': 'Open Seats',
			'warning': 'No Open Seats',
			'danger' : 'Seat Limit Exceeded'
		}[row.openSeatsClass];

		row.TTMSText = row.TTMS ? ' - ' + row.TTMS : '';

		row.title = [row.Course.PDS,
		             row.Course.Number,
		             row.TTMS || 'Pending Class #'].join(' - ');

		row.mailFTD = row.FTD.Email +
		              '?subject=FTSS Class Inquiry for ' +
		              row.Course.PDS +
		              ' Class #' +
		              row.TTMS;

		// This is the hover image for each FTD
		row.map = 'https://maps.googleapis.com/maps/api/staticmap?' +
		          'sensor=false&size=400x300&zoom=5&markers=color:red|' +
		          row.FTD.Location.replace(/\s/g, '');

	};

}());
