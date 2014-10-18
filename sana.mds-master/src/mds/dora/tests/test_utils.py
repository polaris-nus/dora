from django.test.client import RequestFactory
from django.test import TestCase
import dora.utils as utils
from dora.tests.util_test_helper import *


class UtilsTestCase(TestCase):
	def setUp(self):
		setup_database()
		self.factory = RequestFactory()


	#test the query method in views
	def test_parse_query_and_get_QRS(self):
		#preparation steps for test case
		results = setup_get_QRS_results()

		#assert with only disease
		request = self.factory.get('/query/', {'disease': 'tubercolosis'})
		query = utils.parse_request(request)
		query_result_set = utils.get_query_result_set(query)
		check_assertions(self, query_result_set, results, 0)

		#assert with disease and gender
		request = self.factory.get('/query/', {'disease': 'tubercolosis', 'gender':'M'})
		query = utils.parse_request(request)
		query_result_set = utils.get_query_result_set(query)
		check_assertions(self, query_result_set, results, 1)

		#assert with disease,gender,age_range
		request = self.factory.get('/query/', {'disease': 'tubercolosis', 'gender':'M', 'age_range':'0-5,15-20'})
		query = utils.parse_request(request)
		query_result_set = utils.get_query_result_set(query)
		check_assertions(self, query_result_set, results, 2)

		#assert with disease,gender,location,age_range
		request = self.factory.get('/query/', {'disease': 'tubercolosis', 'gender':'M', 'location':'GEOMETRYCOLLECTION(POLYGON ((-200 -100, -200 -75, -150 -75, -150 -100, -200 -100)))', 'age_range':'0-10,50-60'})
		query = utils.parse_request(request)
		query_result_set = utils.get_query_result_set(query)
		check_assertions(self, query_result_set, results, 3)

		#assert with nothing (edge case)
		request = self.factory.get('/query/')
		query = utils.parse_request(request)
		query_result_set = utils.get_query_result_set(query)
		self.assertEqual(query_result_set,None)

	def test_create_json_obj_list(self):
		#setup
		results = setup_create_json_obj_list_results()
		request = self.factory.get('/query/', {'disease': 'tubercolosis', 'gender':'M', 'age_range':'0-10'})
		query = utils.parse_request(request)
		query_result_set = utils.get_query_result_set(query)

		#assert when passed in None
		json_obj_list = utils.create_json_obj_list(None)
		self.assertEqual(json_obj_list, [[],[]])

		#assert when passed in some QRS
		json_obj_list = utils.create_json_obj_list(query_result_set)
		self.assertEqual(json_obj_list, results)

	def test_json_obj_to_return(self):
		#takes in list of json and returns json array
		json_list = []
		json_list.append([])
		json_list.append([])
		json_list[0].append('{"name":"json item 1"}')
		json_list[0].append('{"name":"json item 2"}')
		json_list[1].append('{"name":"json item 3"}')

		results = '{\n"assigned" : [\n{"name":"json item 1"},\n{"name":"json item 2"}\n],\n"unassigned" : [\n{"name":"json item 3"}\n]\n}'
		json_array = utils.generate_json_obj_to_return(json_list)

		self.assertEquals(json_array, results)