from django.test.client import RequestFactory
from django.test import TestCase
import mds.dora.utils as utils
from mds.dora.tests.util_test_helper import *
from django.contrib.auth import authenticate, login
import cjson


class UtilsTestCase(TestCase):
	fixtures = ['test_data.json']

	def setUp(self):
		self.factory = RequestFactory()


	#test the query method in views
	def test_parse_query_and_get_QRS(self):
		#preparation steps for test case
		results = setup_get_QRS_results()

		#assert with non-concept
		request = self.factory.post('/dora/query/', {'gender': 'M'})
		query, concepts_list, locations_list = utils.parse_request(request)
		query_result_set = utils.get_query_result_set(query, concepts_list, locations_list)
		query_result_set = query_result_set.order_by('uuid')
		check_assertions(self, query_result_set, results, 0)

		#assert with age_range
		request = self.factory.post('/dora/query/', {'age_range': '65-75', 'gender':'M'})
		query, concepts_list, locations_list = utils.parse_request(request)
		query_result_set = utils.get_query_result_set(query, concepts_list, locations_list)
		query_result_set = query_result_set.order_by('uuid')
		check_assertions(self, query_result_set, results, 1)

		#assert with concept, non-concept, age_range
		request = self.factory.post('/dora/query/', {'diagnosis': 'inflammation of wound', 'gender':'M', 'age_range':'65-75'})
		query, concepts_list, locations_list = utils.parse_request(request)
		query_result_set = utils.get_query_result_set(query, concepts_list, locations_list)
		query_result_set = query_result_set.order_by('uuid')
		check_assertions(self, query_result_set, results, 2)

		#assert with disease,gender,location,age_range
		request = self.factory.post('/dora/query/', {'diagnosis': 'inflammation of wound', 'gender':'M', 'location':'["POLYGON ((-3 0, -3 15, 0 15, 0 0, -3 0))"]', 'age_range':'65-75'})
		query, concepts_list, locations_list = utils.parse_request(request)
		query_result_set = utils.get_query_result_set(query, concepts_list, locations_list)
		query_result_set = query_result_set.order_by('uuid')
		check_assertions(self, query_result_set, results, 3)

		#assert with nothing (edge case)
		request = self.factory.post('/dora/query/')
		query, concepts_list, locations_list = utils.parse_request(request)
		query_result_set = utils.get_query_result_set(query, concepts_list, locations_list)
		self.assertEqual(query_result_set,None)

	def test_create_json_response(self):
		#setup
		results = setup_create_json_obj_list_results()
		request = self.factory.post('/dora/query/', {'diagnosis': 'inflammation of wound', 'gender':'M', 'location':'["POLYGON ((-3 0, -3 15, 0 15, 0 0, -3 0))"]', 'age_range':'65-75'})
		query, concepts_list, locations_list = utils.parse_request(request)
		query_result_set = utils.get_query_result_set(query, concepts_list, locations_list)

		#assert when passed in None
		json_response_none = {}
		json_response_none['assigned'] = []
		json_response_none['unassigned'] = []
		json_response_none['status'] = "ok"
		json_response = utils.create_json_response(None)
		self.assertEqual(cjson.decode(json_response), json_response_none)

		#assert when passed in some QRS
		json_response = utils.create_json_response(query_result_set)
		json_response = cjson.decode(json_response)
		self.assertEqual(json_response['status'], results['status'])
		self.assertEqual(len(json_response['assigned']), len(results['assigned']))
		self.assertEqual(len(json_response['unassigned']), len(results['unassigned']))

		for i in range(0,len(results['assigned'])):
			response = json_response['assigned'][i]
			result = results['assigned'][i]
			self.assertEqual(response['uuid'], result['uuid'])
			self.assertEqual(response['subject']['family_name'], result['subject']['family_name'])
			self.assertEqual(response['subject']['uuid'], result['subject']['uuid'])
			self.assertEqual(response['subject']['given_name'], result['subject']['given_name'])
			self.assertEqual(response['subject']['dob'], result['subject']['dob'])
			self.assertEqual(response['subject']['gender'], result['subject']['gender'])
			self.assertEqual(response['created_date'], result['created_date'])
			self.assertEqual(response['modified_date'], result['modified_date'])
			self.assertEqual(response['procedure'], result['procedure'])
			self.assertEqual(response['observer'], result['observer'])
			self.assertEqual(response['location']['coords'], result['location']['coords'])
			self.assertEqual(response['location']['alt'], result['location']['alt'])