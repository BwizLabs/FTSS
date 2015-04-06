/*global FTSS, angular */

(function () {

	"use strict";

	FTSS.ng.directive(
		'editStudents',

		[
			'$timeout',
			'SharePoint',
			'classProcessor',
			'utilities',

			function ($timeout, SharePoint, classProcessor, utilities) {

				return {
					'restrict'   : 'A',
					'scope'      : true,
					'templateUrl': function (elem, attrs) {
						return '/partials/edit-students-' + (attrs.templateurl || 'placeholder') + '.html';
					},
					'link'       : function (scope, el, attrs) {

						// Support embed instead of modal dialog
						scope.embed = (attrs.templateurl === 'embed');

						// For resources view, we have to lookkup the data first
						if (scope.getRow) {

							scope.data = scope.getRow(el[0].getAttribute('lookup'));

						} else {

							scope.data = scope.data || scope.row.Class || scope.row;
						}

						// Process our student data if there are approved seats
						scope.editStudents = function () {

							// If we have any registered students, load them async
							if (scope.data.Approved) {

								var read = FTSS.models('requests');

								read.params.$filter = 'ClassId eq ' + scope.data.Id;

								SharePoint.read(read).then(function (requests) {

									scope.loadingStudents = false;
									scope.students = classProcessor.requestProcessor(requests);

								});

								scope.loadingStudents = true;

							}

							// Open our modal dialog when embed is false
							!scope.embed && utilities.modal('edit-students', scope);

						};

						scope.embed && scope.editStudents();

					}

				};

			}
		]
	);

}());
