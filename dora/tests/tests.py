import urllib2, json
from django.test import TestCase
from dora.models import *
import dora.mds_adapter as mds_adapter
from datetime import *


class MdsAdapterTestCase(TestCase):
	def setUp(self):
		#set last synchronised date to 1st January 2000
		LastSynchronised.objects.create(last_synchronised=datetime(2000,1,1,0,0,0,0))
	
	def test_get_diagnosis_and_gps_lists(self):
		#Create a fake json list to pass in
		with open (r"dora\tests\helpers\mds_adapter_test_case_data.txt", "r") as myfile:
			json_list = myfile.read().replace('\n', '')

		#generate hardcoded answer
		answer_diagnosis = []
		answer_diagnosis.append({})
		answer_diagnosis[0]['concept'] = {}
		answer_diagnosis[0]['concept']['name'] = 'DIAGNOSIS'
		answer_diagnosis[0]['encounter'] = {}
		answer_diagnosis[0]['encounter']['subject'] = {}
		answer_diagnosis[0]['encounter']['subject']['given_name'] = 'first'
		answer_diagnosis.append({})
		answer_diagnosis[1]['concept'] = {}
		answer_diagnosis[1]['concept']['name'] = 'DIAGNOSIS'
		answer_diagnosis[1]['encounter'] = {}
		answer_diagnosis[1]['encounter']['subject'] = {}
		answer_diagnosis[1]['encounter']['subject']['given_name'] = 'second'
		answer_diagnosis.append({})
		answer_diagnosis[2]['concept'] = {}
		answer_diagnosis[2]['concept']['name'] = 'DIAGNOSIS'
		answer_diagnosis[2]['encounter'] = {}
		answer_diagnosis[2]['encounter']['subject'] = {}
		answer_diagnosis[2]['encounter']['subject']['given_name'] = 'third'

		answer_location_gps = []
		answer_location_gps.append({})
		answer_location_gps[0]['concept'] = {}
		answer_location_gps[0]['concept']['name'] = 'LOCATION GPS'
		answer_location_gps[0]['encounter'] = {}
		answer_location_gps[0]['encounter']['subject'] = {}
		answer_location_gps[0]['encounter']['subject']['given_name'] = 'first'
		answer_location_gps.append({})
		answer_location_gps[1]['concept'] = {}
		answer_location_gps[1]['concept']['name'] = 'LOCATION GPS'
		answer_location_gps[1]['encounter'] = {}
		answer_location_gps[1]['encounter']['subject'] = {}
		answer_location_gps[1]['encounter']['subject']['given_name'] = 'second'
		answer_location_gps.append({})
		answer_location_gps[2]['concept'] = {}
		answer_location_gps[2]['concept']['name'] = 'LOCATION GPS'
		answer_location_gps[2]['encounter'] = {}
		answer_location_gps[2]['encounter']['subject'] = {}
		answer_location_gps[2]['encounter']['subject']['given_name'] = 'third'

		#pass into get_diagnosis_and_gps_lists
		response_diagnosis_list,response_gps_list = mds_adapter.get_diagnosis_and_gps_lists(json_list)

		#check whether same
		self.assertTrue(response_diagnosis_list == answer_diagnosis)
		self.assertTrue(response_gps_list == answer_location_gps)

	def test_get_last_synchronised_date_record(self):
		#ensure entry created on setup is correct
		self.assertTrue(LastSynchronised.objects.all()[0].last_synchronised == datetime(2000,1,1,0,0,0,0))
		
		#delete entry created on setup
		LastSynchronised.objects.all()[0].delete()
		
		#ensure that an entry is created on calling get_last_synchronised_date_record()
		last_synchronised_date = mds_adapter.get_last_synchronised_date_record()
		number_entries = LastSynchronised.objects.all().count()
		self.assertTrue(number_entries == 1)
		
		#ensure that last synchronised date is set to earlier than 100 years ago
		one_hundred_years = timedelta(days=100*365)
		now = datetime.now()
		self.assertTrue(now - last_synchronised_date.last_synchronised > one_hundred_years)
		
		#ensure that the date returned is the same as before when an entry already exists
		last_synchronised_date.last_synchronised = datetime(1999,3,18,0,0,0,0)
		last_synchronised_date.save()
		
		last_synchronised = mds_adapter.get_last_synchronised_date_record()
		self.assertTrue(last_synchronised.last_synchronised == datetime(1999,3,18,0,0,0,0))

	def test_populate_database(self):
		pass
	