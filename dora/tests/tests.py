import urllib2, json
from django.test import TestCase
from dora.models import *
import dora.mds_adapter as mds_adapter
from datetime import *
from django.contrib.gis.geos import Point

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
		
		#test 1: ensure that the encounter modified before the last synchronised date not show up
		
		with open(r'dora\tests\helpers\mds_populate_database_test_case_gps_list1.txt', 'r') as gps_json_list_file:
			gps_list = json.loads(gps_json_list_file.read())
			
		with open(r'dora\tests\helpers\mds_populate_database_test_case_diagnosis_list1.txt', 'r') as diagnosis_json_list_file:
			diagnosis_list = json.loads(diagnosis_json_list_file.read())
	
		mds_adapter.populate_database(diagnosis_list, gps_list)
		
		
		#esure patient is correct
		self.assertTrue(Patient.objects.all().count() == 1)
		patient = Patient.objects.all()[0]
		self.assertTrue(patient.family_name == 'test1' and
					patient.given_name == 'test1' and
					patient.uuid == 'subject1' and
					patient.dob == datetime(year=1986,month=1,day=13,hour=7,minute=13,second=38,microsecond=841000) and
					patient.gender == 'F')
		
		#ensure disease is correct
		self.assertTrue(Disease.objects.all().count() == 1)
		disease = Disease.objects.all()[0]
		self.assertTrue(disease.name == 'HIV')
		
		#ensure encounter is correct
		self.assertTrue(Encounter.objects.all().count() == 1)
		encounter = Encounter.objects.all()[0]
		self.assertTrue(encounter.uuid == 'encounter2' and
					encounter.created == datetime(2008,8,16,2,38,38,854000) and
					encounter.modified == datetime(2008,8,16,2,38,38,854000) and
					encounter.patient == patient and
					encounter.disease == disease)
		
		#test 2: ensure that the gps coordinates of a patient is updated from the latest encounter, and previous data is correct
		with open(r'dora\tests\helpers\mds_populate_database_test_case_gps_list2.txt', 'r') as gps_json_list_file:
			gps_list = json.loads(gps_json_list_file.read())
			
		with open(r'dora\tests\helpers\mds_populate_database_test_case_diagnosis_list2.txt', 'r') as diagnosis_json_list_file:
			diagnosis_list = json.loads(diagnosis_json_list_file.read())
	
		mds_adapter.populate_database(diagnosis_list, gps_list)
		
		self.assertTrue(Patient.objects.all().count() == 2)
		patient = Patient.objects.all()[0]
		self.assertTrue(patient.family_name == 'test1' and
					patient.given_name == 'test1' and
					patient.uuid == 'subject1' and
					patient.dob == datetime(year=1986,month=1,day=13,hour=7,minute=13,second=38,microsecond=841000) and
					patient.gender == 'F')
		
		
		self.assertTrue(Disease.objects.all().count() == 4)
		disease = Disease.objects.get(name='HIV')
		self.assertTrue(disease.name == 'HIV')
		
		self.assertTrue(Encounter.objects.all().count() == 4)
		encounter = Encounter.objects.all()[0]
		self.assertTrue(encounter.uuid == 'encounter2' and
					encounter.created == datetime(2008,8,16,2,38,38,854000) and
					encounter.modified == datetime(2008,8,16,2,38,38,854000) and
					encounter.patient == patient and
					encounter.disease == Disease.objects.get(name__iexact='hiv'))
		
		patient2 = Patient.objects.all()[1]
		self.assertTrue(patient2.family_name == 'test2' and
					patient2.given_name == 'test2' and
					patient2.uuid == 'subject2' and
					patient2.dob == datetime(1991,1,13,7,13,38,841000) and
					patient2.gender == 'M')
		
		diseases = Disease.objects.all()
		self.assertTrue(diseases[0].name == 'ATHLETES FOOT')
		self.assertTrue(diseases[1].name == 'HIV')
		self.assertTrue(diseases[2].name == 'MAD-COW DISEASE')
		self.assertTrue(diseases[3].name == 'SALMONELLA')
		
		self.assertTrue(patient2.coordinates == Point(3,3))