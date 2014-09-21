import random
from dora.models import *
from datetime import *
from django.contrib.gis.geos import Point
from django.template import Context, loader


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
			dob=(date(2010, 10, 10) - timedelta(days=(i*365*5))), 
			gender=gender,
			coordinates=Point(-180+((i+1)/6*360),-90+((i+1)/6*180))
		)
		patients.append(temp_patient)
	for i in range(0,6):
		if (i > 2):
			disease = disease2
		Encounter.objects.create(
			uuid=str(i), 
			patient=patients[i],
			disease=disease,
			created=date(2010, 10, 10),
			modified=date(2010, 10, 10)
		)

def setup_get_QRS_results():
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


def setup_create_json_obj_list_results():
	results = []
	json_template = loader.get_template('query_json_template')
	results.append(json_template.render(Context({
		"disease_name":'TUBERCOLOSIS', 
		"patient_uuid":'0', 
		"patient_family_name":'0', 
		"patient_given_name":'abnn0', 
		"patient_dob":'Oct. 10, 2010, midnight',
		"patient_gender":'M', 
		"created_date":'Oct. 10, 2010, midnight', 
		"modified_date":'Oct. 10, 2010, midnight', 
		"longitude":str(-180.0+(1/6*360.0)), 
		"latitude":str(-90.0+(1/6*180.0)), 
		"altitude":"alt!"
	})))
	results.append(json_template.render(Context({
		"disease_name":'TUBERCOLOSIS', 
		"patient_uuid":'2', 
		"patient_family_name":'2', 
		"patient_given_name":'abnn2', 
		"patient_dob":'Oct. 12, 2000, midnight',
		"patient_gender":'M', 
		"created_date":'Oct. 10, 2010, midnight', 
		"modified_date":'Oct. 10, 2010, midnight', 
		"longitude":str(-180.0+(3/6*360.0)), 
		"latitude":str(-90.0+(3/6*180.0)), 
		"altitude":"alt!"
	})))
	return results