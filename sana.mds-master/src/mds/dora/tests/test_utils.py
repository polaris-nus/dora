from django.test.client import RequestFactory
from django.test import TestCase
import mds.dora.utils as utils
from mds.dora.tests.util_test_helper import *
from django.contrib.auth import authenticate, login


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
		request = self.factory.post('/dora/query/', {'diagnosis': 'inflammation of wound', 'gender':'M', 'location':'GEOMETRYCOLLECTION(POLYGON ((-3 0, -3 15, 0 15, 0 0, -3 0)))', 'age_range':'65-75'})
		query, concepts_list, locations_list = utils.parse_request(request)
		query_result_set = utils.get_query_result_set(query, concepts_list, locations_list)
		query_result_set = query_result_set.order_by('uuid')
		check_assertions(self, query_result_set, results, 3)

		#assert with nothing (edge case)
		request = self.factory.post('/dora/query/')
		query, concepts_list, locations_list = utils.parse_request(request)
		query_result_set = utils.get_query_result_set(query, concepts_list, locations_list)
		self.assertEqual(query_result_set,None)

	def test_create_json_obj_list(self):
		#setup
		results = setup_create_json_obj_list_results()
		request = self.factory.post('/dora/query/', {'diagnosis': 'inflammation of wound', 'gender':'M', 'location':'GEOMETRYCOLLECTION(POLYGON ((-3 0, -3 15, 0 15, 0 0, -3 0)))', 'age_range':'65-75'})
		query, concepts_list, locations_list = utils.parse_request(request)
		query_result_set = utils.get_query_result_set(query, concepts_list, locations_list)

		#assert when passed in None
		json_obj_list = utils.create_json_obj_list(None)
		self.assertEqual(json_obj_list, [[],[]])

		#assert when passed in some QRS
		json_obj_list = utils.create_json_obj_list(query_result_set)
		self.assertEqual(json_obj_list, results)
		pass

	def test_json_obj_to_return(self):
		#takes in list of json and returns json array
		json_list = []
		json_list.append([])
		json_list.append([])
		json_list[0].append('{"name":"json item 1"}')
		json_list[0].append('{"name":"json item 2"}')
		json_list[1].append('{"name":"json item 3"}')

		results = '{\n"assigned" : [\n{"name":"json item 1"},\n{"name":"json item 2"}\n],\n"unassigned" : [\n{"name":"json item 3"}\n],\n"status" : "ok"\n}'
		json_array = utils.generate_json_obj_to_return(json_list)

		self.assertEquals(json_array, results)