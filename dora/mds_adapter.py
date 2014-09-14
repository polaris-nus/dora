import sys, urllib2, json
from dora.dora.models import Patient, Disease
from dora.dora.mds_adapter_models import *
from datetime import datetime

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


def populate_database(diagnosis_list, gps_list):
	
	synchonisation_date = LastSynchronised.objects.all()[0]
	for diagnosis in diagnosis_list:
		encounter = diagnosis.encounter
		modified = datetime.strptime(encounter.modified, '%Y-%m-%sT%H:%M:%S')
		
		if modified > synchronisation_date:
			
			patient = PatientLookupTable.objects.get(uuid=subject.uuid)
			
			#check if patient exists, if not create it
			if not patient:
				patient = Patient.objects.create(given_name=subject.given_name,
											family_name=subject.family_name,
											dob=subject.dob,
											gender=subject.gender)
				PatientLookupTable.objects.create(uuid=subject.uuid, patient=patient)
			

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
	return 0

if __name__ == "__main__":
	main(sys.argv)