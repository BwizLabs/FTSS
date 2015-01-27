/*global FTSS, _, caches */

FTSS.ng.controller(
	'admin-instructorsController',

	[
		'$scope',
		'$timeout',
		'SharePoint',
		function ($scope, $timeout, SharePoint) {

			$scope.pageLimit = 5000;

			var self = FTSS.controller($scope, {

				'sort' : 'InstructorName',
				'model': 'instructors',
				'group': 'FTD.LongName'

			});

			// Bind inlineUpdate to the scope
			$scope.inlineUpdate = self.inlineUpdate;

			SharePoint.read(FTSS.models('users')).then(function (response) {

				$timeout(function () {

					$scope.users = _.sortBy(response, 'Name');

				});

			});

			self.bind().then(function (data) {

				// Complete the controller initialization
				self.initialize(data).then(function (row) {

					row.FTD = caches.Units[row.UnitId];
					row.search = row.InstructorName + row.FTD.search;

				});


			});

		}
	]);