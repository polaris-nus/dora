import sys, urllib2, json
from dora.dora.models import Patient, Disease, Encounter
from dora.dora.mds_adapter_models import *
from datetime import datetime

MDS_DATETIME_FORMAT = '%Y-%m-%sT%H:%M:%S'

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
		modified = datetime.strptime(encounter.modified, MDS_DATETIME_FORMAT)
		
		if modified > synchronisation_date:
			
			patient_record = PatientLookupTable.objects.get(uuid=encounter.subject.uuid)
			
			#check if patient exists, if not create it
			if not patient_record:
				patient = Patient.objects.create(given_name=subject.given_name,
											family_name=subject.family_name,
											dob=subject.dob,
											gender=subject.gender)
				PatientLookupTable.objects.create(uuid=subject.uuid, patient=patient)
			else:
				patient = patient_record.patient
				
			disease = Disease.objects.get(name=diagnosis.value_text)
			
			#check if disease exists, if not create it
			if not disease:
				disease = Disease.objects.create(name=diagnosis.value_text)
			
			dora_encounter = Encounter.objects.get(uuid=encounter.uuid)
			
			#check to see whether encounter exists, if it does, delete it
			if dora_encounter:
				dora_encounter.delete()
			
			dora_encounter = Encounter.objects.create(patient=patient,
												disease=disease,
												created=datetime.strptime(encounter.created, MDS_DATETIME_FORMAT),
												modified=datetime.strptime(encounter.modified, MDS_DATETIME_FORMAT))
			
	#only update lon and lat of encounters that already exist
	for gps in gps_list:
		encounter = gps.encounter
		modified = datetime.strptime(encounter.modified, MDS_DATETIME_FORMAT)
		
		if modified > synchronisation_date:
			
			dora_encounter = Encounter.objects.get(uuid=encounter.uuid)
			
			if dora_encounter:
				gps_tuple = tuple(float(v) for v in re.findall('[-+]?[0-9]*\.?[0-9]+', gps.value_text))
				dora_encounter.lon, dora_encounter.lat = gps_tuple[0], gps_tuple[1]
			

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