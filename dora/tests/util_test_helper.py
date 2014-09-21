import random
from dora.models import *
from datetime import *


def setup_database():
	#put some items into "database"#create items as doesnt work in setup
	disease1 = Disease.objects.create(name='TUBERCOLOSIS')
	disease2 = Disease.objects.create(name='EBOLA')
	disease = disease1
	patients = []
	for i in range(0,6):
		if (i%2 == 1):
			gender = 'F'
		else:
			gender = 'M'
		temp_patient = Patient.objects.create(
			uuid=str(i), 
			given_name=('abnn'+str(i)), 
			family_name=str(i), 
			dob=(datetime.now() - timedelta(days=(i*365*5))), 
			gender=gender,
			coordinates=Point(random.uniform(-179.99, 180),random.uniform(-89.99, 90)), 
			created=datetime.now()
		)
		patients.append(temp_patient)
	for i in range(0,6):
		if (i > 2):
			disease = disease2
		Encounter.objects.create(
			uuid=str(i), 
			patient=patients[i],
			disease=disease,
			created=datetime.now(),
			modified=datetime.now()
		)

def setup_results():
	results = []
	results.append([])
	results.append([])
	results[0].append({
		"disease_name":'TUBERCOLOSIS', 
		"patient_uuid":'0',
	})
	results[0].append({
		"disease_name":'TUBERCOLOSIS', 
		"patient_uuid":'1',
	})
	results[0].append({
		"disease_name":'TUBERCOLOSIS', 
		"patient_uuid":'2',
	})
	results[1].append({
		"disease_name":'TUBERCOLOSIS', 
		"patient_uuid":'0',
	})
	results[1].append({
		"disease_name":'TUBERCOLOSIS', 
		"patient_uuid":'2',
	})
	return results

def check_assertions(self, query_result_set, results, check_num):
	index = 0
	for query_result in query_result_set:
		self.assertEqual(query_result.disease.name, results[check_num][index]['disease_name'])
		self.assertEqual(query_result.patient.uuid, results[check_num][index]['patient_uuid'])
		index += 1