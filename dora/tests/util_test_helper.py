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
	for i in range(0,20):
		if (i%2 == 1):
			gender = 'F'
		else:
			gender = 'M'
		seed = datetime(year=2014,month=1,day=1)
		temp_patient = Patient.objects.create(
			uuid=str(i), 
			given_name=('abnn'+str(i)), 
			family_name=str(i), 
			dob=datetime(year=(seed.year-(i*3)), month=seed.month, day=seed.day), 
			gender=gender,
			coordinates=Point((-180+((i+1)/20.0*360)),(-90+((i+1)/20.0*180)))
		)
		patients.append(temp_patient)
	for i in range(0,20):
		if (i >= 10):
			disease = disease2
		Encounter.objects.create(
			uuid=str(i), 
			patient=patients[i],
			disease=disease,
			created=datetime(2010, 10, 10),
			modified=datetime(2010, 10, 10)
		)

def setup_get_QRS_results():
	results = []
	results.append([])
	results.append([])
	results.append([])
	for i in range(0,10):
		results[0].append({
			"disease_name":'TUBERCOLOSIS', 
			"patient_uuid":str(i),
		})
		if (i%2 == 0):
			results[1].append({
				"disease_name":'TUBERCOLOSIS', 
				"patient_uuid":str(i),
			})
			if (i<=10/3 or (i>=50/3 and i <=60/3)):
				results[2].append({
					"disease_name":'TUBERCOLOSIS', 
					"patient_uuid":str(i),
				})

	return results

def check_assertions(self, query_result_set, results, check_num):
	index = 0
	for query_result in query_result_set:
		self.assertEqual(query_result.disease.name, results[check_num][index]['disease_name'])
		self.assertEqual(query_result.patient.uuid, results[check_num][index]['patient_uuid'])
		index += 1


def setup_create_json_obj_list_results():
	results = [[],[]]
	json_template = loader.get_template('json_obj_template')
	results[0].append(json_template.render(Context({
		"disease_name":'TUBERCOLOSIS', 
		"patient_uuid":'0', 
		"patient_family_name":'0', 
		"patient_given_name":'abnn0', 
		"patient_dob":'Jan. 1, 2014, midnight',
		"patient_gender":'M', 
		"created_date":'Oct. 10, 2010, midnight', 
		"modified_date":'Oct. 10, 2010, midnight', 
		"coordinates":'POINT (-162.0000000000000000 -81.0000000000000000)',
		"altitude":"alt!"
	})))
	results[0].append(json_template.render(Context({
		"disease_name":'TUBERCOLOSIS', 
		"patient_uuid":'2', 
		"patient_family_name":'2', 
		"patient_given_name":'abnn2', 
		"patient_dob":'Jan. 1, 2008, midnight',
		"patient_gender":'M', 
		"created_date":'Oct. 10, 2010, midnight', 
		"modified_date":'Oct. 10, 2010, midnight', 
		"coordinates":'POINT (-126.0000000000000000 -63.0000000000000000)',
		"altitude":"alt!"
	})))
	return results