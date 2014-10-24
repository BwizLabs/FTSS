/*global utils, FTSS, caches */

FTSS.ng.controller(
	'scheduled-ftdController',

	[
		'$scope',
		'$modal',
		'SharePoint',
		function ($scope, $modal, SharePoint) {

			var self = FTSS.controller($scope, {
				    'sort' : 'Start',
				    'group': 'Month',

				    'grouping': {
					    'Course'  : 'Course',
					    'Month' : 'Month',
					    'availability': 'Open Seats'
				    },

				    'sorting': {
					    'Start'      : 'Start Date',
					    'course'     : 'Course'
				    },

				    'model': 'scheduled',

				    'modalPlacement': 'wide',

				    // We will be post-post-processing this data for the calendar (needs some special data)
				    'finalProcess'  : function (data) {

					    var events = [];

					    _(data).each(function (group) {
						    events = events.concat(group);
					    });

					    $scope.events[0] = events;

					    setTimeout(function () {
						    $scope.schedule.fullCalendar('render');
					    }, 100);

				    },

				    'edit': function (scope, isNew) {

					    var getDates = function () {

						        return scope.data.Start && scope.data.End ?

						               {
							               'title'           : '***THIS COURSE***',
							               'start'           : scope.data.Start,
							               'end'             : scope.data.End,
							               'className'       : 'success',
							               'editable'        : true,
							               'durationEditable': true,
							               'allDay'          : true
						               }

							        : null;

					        },

					        update = function (event) {

						        var format = 'D MMM YYYY';

						        scope.data.Start = event.start.format(format);
						        scope.data.End = event.end.format(format);

						        scope.modal.$setDirty();

					        };

					    // If this is a new class, pre-fill the reserved seats with 0
					    if (isNew) {

						    scope.data.Host = 0;
						    scope.data.Other = 0;

					    }

					    // Some init settings for FullCalendar
					    scope.uiConfigInstructor = {

						    'weekends'     : false,
						    'allDayDefault': true,
						    'header'       : {
							    'left'  : 'title',
							    'center': '',
							    'right' : 'today prev,next'
						    },

						    'buttonText': {
							    today:    'Go to Today'
						    },

						    'eventResize': update,

						    'eventDrop': update,

						    'dayClick': function (start) {

							    if (!scope.data.Start && scope.data.CourseId) {

								    var days = caches.MasterCourseList[scope.data.CourseId].Days,
								        end = start.clone();

								    while (days > 0) {

									    if (end.isoWeekday() !== 6 && end.isoWeekday() !== 7) {
										    days -= 1;
									    }

									    end.add(1, 'days');

								    }

								    scope.data.Start = start.toISOString();
								    scope.data.End = end.toISOString();

								    scope.eventsInstructor[0] = [getDates()];

							    }

						    }
					    };

					    if (scope.data.Start) {
						    scope.uiConfigInstructor.defaultDate = scope.data.Start;
					    }

					    // Setup uour empty calendar for FullCalendar
					    scope.eventsInstructor = [];

					    // Monitors the InstructorId to load their teaching schedule
					    scope.$watch('data.InstructorId', function (instructor) {

						    // If we have selected an instructor, try to get their teaching schedule
						    if (instructor) {

							    // Get a copy of the model
							    var read = _.clone(FTSS.models.calendar);

							    // Our SP filters
							    read.params.$filter = [

								    // Only include this instructor
									    '(InstructorId eq ' + instructor + ')',

								    // Do not include archived courses
									    '(Archived eq false)'

							    ].join(' and ');

							    // Request the classes for this instructor from SP
							    SharePoint.read(read).then(function (result) {

								    // Convert our SP data into an array for FullCalendar
								    result = _(result)

									    // Perform some adjusments for Fullcalendar
									    .each(function (row) {

										          row.title = caches.MasterCourseList[row.CourseId].PDS;
										          row.start = row.Start;
										          row.end = row.End;
										          row.className = 'info';

									          })

									    // FullCalendar needs an array
									    .toArray()

									    // Exit lodash chain
									    .value();

								    getDates() && result.push(getDates());

								    // update the event source for the calendar
								    scope.eventsInstructor[0] = result;

							    })

						    } else {

							    var thisClass = getDates();

							    // Make sure we remove any old events
							    scope.eventsInstructor[0] = thisClass ? [thisClass] : [];

						    }

					    });

					    /**
					     * Get Open Seats, performs live counting of remaining seat openings in modals
					     *
					     * @returns {string}
					     */
					    scope.getOpenSeats = function () {

						    // Only attempt this if a CourseID exists
						    if (scope.data.CourseId) {

							    var requests = _(scope.data.Requests_JSON).reduce(function (count, request) {

								        // Only count seats pending (1) or approved (2) against total
								        return  (request[0] < 3) ? count + request[1].length : count;

							        }, 0),

							        open = (caches.MasterCourseList[scope.data.CourseId].Max -
							                (scope.data.Host || 0) -
							                (scope.data.Other || 0) -
							                requests);

							    // Provide human-friendly seat availability counters
							    switch (true) {

								    case (open > 0):
									    return open + ' Open Seats';

								    case (open < 0):
									    return 'Overbooked by ' + Math.abs(open);

								    default:
									    return 'Class Full';

							    }

						    } else {

							    return '';

						    }

					    };

					    scope.data.requests = utils.requestDecode(scope.data.Requests_JSON);

				    }

			    })
				;

			// Bind the seat request function
			$scope.request = utils.requestSeats($scope, $modal, SharePoint);

			// Setup a blank calendar
			$scope.events = [];

			// FullCalendar initial settings
			$scope.uiConfig = {
				calendar: {
					'header'       : {
						'left'  : 'prev,next today',
						'center': 'title',
						'right' : 'month,basicWeek'
					},
					'defaultView'  : 'basicWeek',
					'weekends'     : false,
					'allDayDefault': true,
					'buttonText': {
						today:    'Show Today',
						month:    'Monthly',
						week:     'Weekly'
					},
					eventClick     : function (event) {
						$scope.edit.apply({'row': event});
					}
				}
			};

			self

				.bind('filter')

				.then(function (data) {

					      // We can always request in this view
					      $scope.canRequest = true;

					      // Finish data binding and processing
					      self.initialize(data).then(utils.processScheduledRow);

				      });

		}
	])
;
