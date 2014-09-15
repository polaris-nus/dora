from django.test import TestCase
from dora.views import query

class ViewsTestCase(TestCase):

	#test the query method in views
	def test_query(self):
		query_result = query("test")
		self.assertEqual(query_result,"query_result_set")