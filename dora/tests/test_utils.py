from django.test.client import RequestFactory
from django.test import TestCase
import dora.utils as utils
from dora.tests.util_test_helper import *


class UtilsTestCase(TestCase):
	def setUp(self):
		setup_database()
		self.factory = RequestFactory()


	#test the query method in views
	def test_get_QRS(self):
		#preparation steps for test case
		results = setup_get_QRS_results()

		#assert one with only disease
		request = self.factory.get('/query/', {'disease': 'tubercolosis'})
		query_result_set = utils.get_query_result_set(request)
		check_assertions(self, query_result_set, results, 0)

		#assert one with disease and gender
		request = self.factory.get('/query/', {'disease': 'tubercolosis', 'gender':'M'})
		query_result_set = utils.get_query_result_set(request)
		check_assertions(self, query_result_set, results, 1)

		#assert one with nothing (edge case)
		request = self.factory.get('/query/')
		query_result = utils.get_query_result_set(request)
		self.assertEqual(query_result,None)

	def test_create_json_obj_list(self):
		#setup
		results = setup_create_json_obj_list_results()
		request = self.factory.get('/query/', {'disease': 'tubercolosis', 'gender':'M'})
		query_result_set = utils.get_query_result_set(request)

		#assert when passed in None
		json_obj_list = utils.create_json_obj_list(None)
		self.assertEqual(json_obj_list, [])

		#assert when passed in some QRS
		json_obj_list = utils.create_json_obj_list(query_result_set)
		self.assertEqual(json_obj_list, results)

	def test_json_obj_to_return(self):
		#takes in list of json and returns json array
		json_list = []
		json_list.append("{'name':'json item 1'}")
		json_list.append("{'name':'json item 2'}")
		json_list.append("{'name':'json item 3'}")

		results = "[\n{'name':'json item 1'},\n{'name':'json item 2'},\n{'name':'json item 3'}\n]"
		json_array = utils.generate_json_obj_to_return(json_list)

		self.assertEquals(json_array, results)