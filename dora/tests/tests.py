import urllib2
from django.test import TestCase
from dora.models import *
import dora.mds_adapter as mds_adapter
from datetime import *


class MdsAdapterTestCase(TestCase):
	def setup(self):
		#Create a fake json list to pass in
		with open ("mds_adapter_test_case_data.txt", "r") as myfile:
			json_list = myfile.read().replace('\n', '')

		#generate hardcoded answer
		answer_diagnosis = []
		answer_diagnosis.append({})
		answer_diagnosis[0]['concept']['name'] = 'DIAGNOSIS'
		answer_diagnosis[0]['encounter']['subject']['given_name'] = 'first'
		answer_diagnosis.append({})
		answer_diagnosis[1]['concept']['name'] = 'DIAGNOSIS'
		answer_diagnosis[1]['encounter']['subject']['given_name'] = 'second'
		answer_diagnosis.append({})
		answer_diagnosis[2]['concept']['name'] = 'DIAGNOSIS'
		answer_diagnosis[2]['encounter']['subject']['given_name'] = 'third'

		answer_location_gps = []
		answer_location_gps.append({})
		answer_location_gps[0]['concept']['name'] = 'DIAGNOSIS'
		answer_location_gps[0]['encounter']['subject']['given_name'] = 'first'
		answer_location_gps.append({})
		answer_location_gps[1]['concept']['name'] = 'DIAGNOSIS'
		answer_location_gps[1]['encounter']['subject']['given_name'] = 'second'
		answer_location_gps.append({})
		answer_location_gps[2]['concept']['name'] = 'DIAGNOSIS'
		answer_location_gps[2]['encounter']['subject']['given_name'] = 'third'

		#pass into get_diagnosis_and_gps_list
		response_diagnosis_list,response_gps_list = mds_adapter.get_diagnosis_and_gps_list(json_list)

		#check whether same
		self.assertTrue(response_diagnosis_list == answer_diagnosis)
		self.assertTrue(response_gps_list == answer_location_gps)

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
	