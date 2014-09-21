from django.test.client import RequestFactory
from django.test import TestCase
import dora.utils as utils
from dora.tests.util_test_helper import *


class UtilsTestCase(TestCase):
	#test the query method in views
	def test_get_QRS(self):
		#preparation steps for test case
		setup_database()
		results = setup_results()

		#assert one with only disease
		self.factory = RequestFactory()
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
