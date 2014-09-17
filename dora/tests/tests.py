from django.test import TestCase
from dora.views import query
from dora.models import *
import dora.mds_adapter as mds_adapter
from datetime import *

class ViewsTestCase(TestCase):

	#test the query method in views
	def test_query(self):
		query_result = query("test")
		self.assertEqual(query_result,"query_result_set")
		
class MdsAdapterTestCase(TestCase):
	def setup(self):
		pass
	
	def test_get_last_synchronised_date_record(self):
		"""Ensure that there is one or no entries in the LastSynchronised model"""
		prev_number_entries = LastSynchronised.objects.all().count()
		self.assertTrue(prev_number_entries == 0 or prev_number_entries == 1)
		
		last_synchronised_date = mds_adapter.get_last_synchronised_date_record()
		new_number_entries = LastSynchronised.objects.all().count()
		self.assertTrue(new_number_entries == 1)
			
		if prev_number_entries == 0:
			#ensure that last synchronised date is set to earlier than 100 years ago
			one_hundred_years = timedelta(days=100*365)
			now = datetime.now()
			self.assertTrue(now - last_synchronised_date.last_synchronised > one_hundred_years)
			
		
	def test_populate_database(self):
		pass
	