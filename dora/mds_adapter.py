import sys, urllib2, json, re
from dora.models import *
from datetime import datetime, timedelta
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.contrib.gis.geos import Point

MDS_DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%S.%f'

def get_diagnosis_and_gps_lists(list):
	
	observation_list = (json.loads(list))['message']
	diagnosis_list = []
	gps_list = []

	for observation in observation_list:
		if observation['concept']['name'] == "LOCATION GPS":
			gps_list.append(observation)
		elif observation['concept']['name'] == "DIAGNOSIS":
			diagnosis_list.append(observation)

	return diagnosis_list, gps_list

@transaction.atomic
def populate_database(diagnosis_list, gps_list):
	
	
	synchronised_date_record = get_last_synchronised_date_record()
	synchronised_date = synchronised_date_record.last_synchronised
			
	populate_database_from_diagnosis_list(diagnosis_list, synchronised_date)
	populate_database_from_gps_list(gps_list, synchronised_date)
			
	synchronised_date_record.last_synchronised = datetime.now()
	
def populate_database_from_diagnosis_list(diagnosis_list, synchronised_date):
	for diagnosis in diagnosis_list:
		encounter = diagnosis['encounter']
		subject = encounter['subject']
		modified = datetime.strptime(encounter['modified'], MDS_DATETIME_FORMAT)
		
		if modified > synchronised_date:
			
			try:
				patient = Patient.objects.get(uuid=subject['uuid'])
				
			except ObjectDoesNotExist:
				patient = Patient.objects.create(uuid=subject['uuid'],
												given_name=subject['given_name'],
												family_name=subject['family_name'],
												dob=subject['dob'],
												gender=subject['gender'])
				
			try:
				disease = Disease.objects.get(name=diagnosis['value_text'])
			
			except ObjectDoesNotExist:
				disease = Disease.objects.create(name=diagnosis['value_text'])
			
			try:
				dora_encounter = Encounter.objects.get(uuid=encounter['uuid'])
				dora_encounter.delete()
			#check to see whether encounter exists, if it does, delete it
			except ObjectDoesNotExist:
				pass
			
			dora_encounter = Encounter.objects.create(uuid=encounter['uuid'],
													patient=patient,
													disease=disease,
													created=datetime.strptime(encounter['created'], MDS_DATETIME_FORMAT),
													modified=datetime.strptime(encounter['modified'], MDS_DATETIME_FORMAT))
			
def populate_database_from_gps_list(gps_list, synchronised_date):
	for gps in gps_list:
		encounter = gps['encounter']
		subject = encounter['subject']
		modified = datetime.strptime(encounter['modified'], MDS_DATETIME_FORMAT)
		created = datetime.strptime(encounter['created'], MDS_DATETIME_FORMAT)
		
		if modified > synchronised_date:
			
			try:
				dora_patient = Patient.objects.get(uuid=subject['uuid'])

				
			except ObjectDoesNotExist:
				dora_patient = Patient.objects.create(uuid=subject['uuid'],
												given_name=subject['given_name'],
												family_name=subject['family_name'],
												dob=subject['dob'],
												gender=subject['gender'])
				
			date_last_updated_gps = dora_patient.date_last_updated_gps
				
			if not date_last_updated_gps or date_last_updated_gps < created:
				dora_patient.date_last_updated_gps = created
				gps_tuple = tuple(float(v) for v in re.findall(r'[-+]?[0-9]*\.?[0-9]+', gps['value_text']))
				dora_patient.coordinates = Point(gps_tuple[0], gps_tuple[1])
				dora_patient.save()

def get_last_synchronised_date_record():
	last_synchronised_manager = LastSynchronised.objects
	
	if last_synchronised_manager.all().count() != 1:	
		for record in last_synchronised_manager.all():
			record.delete()
		
		now = datetime.now()
		five_hundred_years = timedelta(days=500*365)
		five_hundred_years_ago = now - five_hundred_years
		
		date = last_synchronised_manager.create(last_synchronised=five_hundred_years_ago)
		
	else:
		date = last_synchronised_manager.all()[0]
	
	return date
		

def main(argv):

	url = "http://mdstest.codeofjoy.com/core/observation/"
	response = urllib2.urlopen(url)

	if response.getcode() == 200:
		diagnosis_list = []
		gps_list = []

		diagnosis_list,gps_list = get_diagnosis_and_gps_lists(response.read())

		#This is for debugging/checking purposes
		for diagnosis in diagnosis_list:
			print diagnosis['concept']['name'] + " " + diagnosis['encounter']['created']
		for gps in gps_list:
			print gps['concept']['name'] + " " + gps['encounter']['created']
		#end of debugging/checking block

		populate_database(diagnosis_list,gps_list)
		
	else:
		print "Error code: &d" % response.getcode()
		
	return 0

if __name__ == "__main__":
	main(sys.argv)