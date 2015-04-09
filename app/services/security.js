/*global FTSS, _, caches */

/**
 * The FTSS.security() function controls the role-based views and automatic redirectors for pages not authorized.
 * Obviously, in a client-side SPA this can be easily bypassed so the views serve only as a convenience to the user
 * as the security is in the list-based SharePoint security groups on the server.  We are reflecting the limitations
 * already placed on the server so as not to confuse or overwhelm the user.
 */
FTSS.ng.service('security', [

	'SharePoint',
	'$modal',
	'$rootScope',

	function (SharePoint, $modal, $rootScope) {

		"use strict";

		var _authorizationMatrix = {

				'admin': ['admin'],

				'admin-instructors': ['admin'],

				'requirements': ['mtf', 'ftd'],

				'requests': ['mtf', 'ftd'],

				'manage-ftd': ['ftd', 'scheduling'],

				'scheduled-ftd': ['ftd', 'scheduling', 'instructor'],

				'production-ftd': ['ftd', 'instructor'],

				'backlog': ['mtf', 'ftd'],

				'my-unit': ['mtf', 'scheduling'],

				'ttms': ['scheduling']

			},

			_isAdmin = false,

			_groups = [],

			_self = this;

		/**
		 * Allow switching FTDs for certain users
		 */
		this.switchContext = function (contextType) {

			// Verify authorization first
			if (_self.hasRole(contextType)) {

				// Create an object that will pass up from the child scope
				$rootScope[contextType] = {};

				$modal(
					{
						'contentTemplate': '/partials/' + (_isAdmin ? 'switch-' : 'no-assigned-') +
						                   contextType + '.html',
						'backdrop'       : 'static',
						'keyboard'       : false
					});

				// Watch our newFTD variable
				$rootScope.$watch(contextType + '.id', function (id) {

					if (id) {

						localStorage['ftssCached_' + contextType] = JSON.stringify(
							{
								'Id'      : id,
								'LongName': (contextType === 'ftd') ?
								            caches.Units[id].LongName : caches.Hosts[id].Unit
							}
						);

						// Reload the page
						location.reload();

					}

				});


			}

		};

		/**
		 * Test for a particular user role
		 *
		 * @param roles
		 * @returns {boolean}
		 */
		this.hasRole = function (roles) {

			return _isAdmin || _(roles.map ? roles : [roles]).any(function (role) {

					return _groups.indexOf(role) > -1;

				});

		};

		/**
		 * Performs page validation check
		 *
		 */
		this.isAuthorized = function () {

			var page = _authorizationMatrix[$rootScope.ftss.viewTitle];

			return _isAdmin || !page || _.intersection(page, _groups).length > 0

		};

		this.checkHost = function () {

			if ($rootScope.host) return true;

			if (_self.hasRole('host')) {

				try {
					$rootScope.host = JSON.parse(localStorage.ftssCached_host);
				} catch (e) {
					caches.Hosts && _self.switchContext('host');
				}

			}

		};


		/**
		 *
		 * @param user
		 */
		this.checkFTD = function (user) {

			if ($rootScope.ftd) return true;

			// Check for email and login name
			var identifier = user ?

			                 [
				                 (user.email || '').toLowerCase().trim() || false,
				                 (user.loginname || '').toLowerCase().trim() || false
			                 ].filter(function (e) {return e}) : [],

			// First try to load from localStorage, otherwise attempt to load from cache
				ftd = JSON.parse(localStorage.ftssCached_ftd || false) ||

				      (caches.Instructors && identifier.length && _(caches.Instructors)

					      // Remove empty accounts
					      .filter('Email')

					      // Try to perform our match against the array elements
					      .find(function (test) {

						            var check = test.Email.toLowerCase().trim();
						            return (identifier.indexOf(check) > -1);

					            }));

			if (ftd) {

				// Load the $rootScope.ftd variable
				$rootScope.ftd = caches.Units ? caches.Units[ftd.UnitId || ftd.Id] : ftd;

				// Add the "instructor" group to this user
				_groups.push('instructor');

				// Push this back to localStorage for future use
				localStorage.ftssCached_ftd = JSON.stringify(
					{
						'Id'      : $rootScope.ftd.Id,
						'LongName': $rootScope.ftd.LongName
					});

			} else {

				if (identifier && caches.Instructors) {

					// If the user was not found, send to switch FTD to check for the FTD role
					_self.switchContext('ftd');

				}

			}

		};

		/**
		 *
		 */
		this.initialize = function () {

			// Initialize our $rootScope variables
			$rootScope.initInstructorRole = angular.noop;
			$rootScope.rolsceClasses = '';
			$rootScope.roleText = '';

			/**
			 * This eliminates the needless server calls for user/group info when developing FTSS.
			 *
			 * Yes, someone could easily spoof the global variable (if they paused the code during page load
			 * and changed it.  However, this is all just client-view stuff anyway.  Additionally, doing so
			 * would cause them more problems as it would force everything to read from a different SharePoint
			 * site altogether.  Finally, we make a double check by validating the file name matches.
			 *
			 */
			if (!PRODUCTION && location.pathname === '/dev.html') {

				_isAdmin = true;

				$rootScope.roleClasses = 'admin';

				$rootScope.roleText = 'DEVELOPER MODE';

				$rootScope.switchContext = _self.switchContext;

				_self.checkFTD(false);

				_self.checkHost();

				$rootScope.ftss.initPage('security');

			} else {

				// First try to check for the cached FTD settings (before the user data is loaded)
				_self.checkFTD(false);

				_self.checkHost();

				// Load our user data into FTSS
				SharePoint.user().then(initSecurity);

			}
		};


		function initSecurity(user) {

			// Check again if this is an FTD user (should only happen the first time for them)
			_self.checkFTD(user);

			// Load the SP groups every time
			SharePoint.groups().then(function (spGroups) {

				// Extract the name of any groups the user is a member of
				_groups = _groups.concat(spGroups.name ? [spGroups.name] : _.pluck(spGroups, 'name'));

				// If no groups were found, just add our "guest" group
				_groups = _groups.length ? _groups : ['guest'];

				// Check for the admin group
				_isAdmin = _groups.indexOf('admin') > -1;

				// Add special "host" role for mtf/scheduling to use host-centric view
				_self.hasRole(['mtf', 'scheduling']) && _groups.push('host');

				// Add switchContext() for admins
				if (_isAdmin) {
					$rootScope.switchContext = _self.switchContext;
				}

				// Used to modify views based on roles
				$rootScope.roleClasses = _groups.join(' ');

				// This is the text that is displayed in the top-left corner of the app
				$rootScope.roleText = _groups.join(' • ')
					.replace('mtf', 'MTS/UTM')
					.replace('ftd', 'FTD Scheduler/Production Supervisor')
					.replace('curriculum', 'Training/Curriculum Manager')
					.replace('scheduling', 'J4 Scheduler')
					.replace('admin', 'Administrator')
					.replace('instructor', 'FTD Member')
					.replace('guest', 'Visitor');

				// Finish the security code
				$rootScope.ftss.initPage('security');

			});

		}

	}
]);