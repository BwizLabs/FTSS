/*global FTSS */

/**
 *  FTSS Models
 *
 *      '$inlinecount': 'allpages',
 *      '$top'        : 25,
 *
 */
(function () {

	"use strict";

	FTSS.models = {

		'catalog': {

			'cache' : true,
			'source': 'MasterCourseList',
			'params': {
				'$select': [
					'PDS',
					'Days',
					'Hours',
					'Min',
					'Max',
					'Title',
					'Number',
					'IMDS',
					'Priority',
					'Archived'
				]
			}

		},

		'units': {

			'cache' : true,
			'source': 'Units',
			'params': {
				'$select': [
					'Base',
					'Det',
					'Email',
					'Phone',
					'Location',
					'LCode',
					'Courses_JSON',
					'Thumb'
				]
			}

		},

		'hosts': {

			'cache' : true,
			'source': 'HostUnits',
			'params': {
				'$select': [
					'Unit',
					'FTD',
					'Location',
					'Email'
				]
			}

		},

		'instructors': {

			'cache' : true,
			'source': 'Instructors',
			'params': {
				'$select': [
					'UnitId',
					'InstructorName',
					'InstructorEmail',
					'Photo',
					'Archived'
				]
			}

		},

		'scheduled': {

			'cache' : true,
			'source': 'Scheduled',
			'params': {
				'$select': [
					'Archived',
					'UnitId',
					'CourseId',
					'Start',
					'End',
					'InstructorId',
					'Host',
					'Other',
					'Requests_JSON',
					'ClassNotes',
					'J4Notes',
					'TTMS'
				]
			}

		},

		'calendar': {

			'source': 'Scheduled',
			'params': {
				'$select': [
					'CourseId',
					'Start',
					'End'
				]
			}

		},

		'ttms': {

			'source': 'Scheduled',
			'params': {
				'$select': [
					'Created',
					'UnitId',
					'CourseId',
					'Start',
					'End',
					'ClassNotes',
					'J4Notes'
				]
			}

		},

		'requirements': {

			'cache' : true,
			'source': 'Requirements',
			'params': {
				'$expand': 'CreatedBy',
				'$select': [
					'UnitId',
					'HostId',
					'DateNeeded',
					'Requirements_JSON',
					'ApprovedCC',
					'ApprovedMAJCOM',
					'Funded',
					'TDY',
					'Notes',
					'CreatedBy/Name',
					'CreatedBy/WorkEMail'
				]
			}
		},

		'requirements_stats': {

			'cache' : true,
			'source': 'RequirementsStats',
			'params': {
				'$select': [
					'Month',
					'Data_JSON'
				]
			}

		},

		'support': {

			'debounce': 3,
			'cache'   : true,
			'source'  : 'Support',
			'params'  : {
				'$expand': 'CreatedBy',
				'$select': [
					'Page',
					'Thread',
					'Staff',
					'Comment',
					'Created',
					'CreatedBy/Name'
				]
			}

		},


		'updates': {

			'debounce': 21600,
			'cache'   : true,
			'source'  : 'Updates',
			'params'  : {
				'$select': [
					'Update',
					'Created'
				]
			}

		}

	};

}());